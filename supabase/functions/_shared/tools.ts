// Tool registry for the Fino chat assistant's Gemini function-calling loop.
// Add a new entry here (schema + handler) to give the assistant a new action —
// no changes to the request loop in functions/chat/index.ts are needed.
// Schema format follows Gemini's functionDeclarations.parameters (OpenAPI-subset, uppercase types).

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { compareLoanOffers, type LoanType } from "./loanMath.ts";
import { BUDGET_RULES, seedAmountsFromRule } from "./budgetMath.ts";
import { scoreApplicant, type ApplicantInput, type Region, type EmploymentType, type CreditHistory, type LoanCurrency } from "./creditRisk.ts";
import { detectRecurringPayments } from "./recurringDetect.ts";
import { detectFrequentStores } from "./discountMatch.ts";

export type TileTarget = "funds" | "calendar" | "loan" | "networth" | "budget" | "credit";

export interface ChatAction {
  target: TileTarget;
  label: string;
  /** A drafted recurring-payment suggestion for the user to review and approve — never auto-saved. */
  draft?: { name: string; amount: number; day_of_month: number };
}

export interface ToolResult {
  /** Sent back to Gemini as the function's result — the model never sees `action`. */
  summary: string;
  /** Rendered client-side as a clickable chip deep-linking to the relevant UI. Omit for chat-only tools. */
  action?: ChatAction;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: "OBJECT";
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (supabase: SupabaseClient, userId: string, input: Record<string, unknown>) => Promise<ToolResult>;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

async function addCalendarReminderHandler(
  supabase: SupabaseClient,
  userId: string,
  input: Record<string, unknown>
): Promise<ToolResult> {
  const label = typeof input.label === "string" ? input.label.trim() : "";
  const dueDate = typeof input.due_date === "string" ? input.due_date : "";
  const amount = typeof input.amount === "number" ? input.amount : null;
  const remindDaysBefore = typeof input.remind_days_before === "number" ? Math.max(0, Math.round(input.remind_days_before)) : 1;

  if (!label) return { summary: "Error: label is required and must be a non-empty string." };
  if (!ISO_DATE.test(dueDate)) return { summary: "Error: due_date must be an ISO date in YYYY-MM-DD format." };

  const { data, error } = await supabase
    .from("reminders")
    .insert({ user_id: userId, label, amount, due_date: dueDate, remind_days_before: remindDaysBefore })
    .select()
    .single();

  if (error) return { summary: `Error creating reminder: ${error.message}` };

  const amountPart = data.amount != null ? ` for ${data.amount} GEL` : "";
  return {
    summary: `Created reminder "${data.label}"${amountPart}, due ${data.due_date}. Will surface it ${data.remind_days_before} day(s) before.`,
  };
}

async function createFundHandler(supabase: SupabaseClient, userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const targetAmount = typeof input.target_amount === "number" ? input.target_amount : 0;
  const contributionMode = input.contribution_mode === "percent" ? "percent" : "fixed";
  const contributionValue = typeof input.contribution_value === "number" ? input.contribution_value : 0;

  if (!name) return { summary: "Error: name is required and must be a non-empty string." };
  if (targetAmount <= 0) return { summary: "Error: target_amount must be a positive number." };

  const { data, error } = await supabase
    .from("funds")
    .insert({
      user_id: userId,
      name,
      target_amount: targetAmount,
      saved_amount: 0,
      contribution_mode: contributionMode,
      contribution_value: contributionValue,
      is_rainy_day: false,
    })
    .select()
    .single();

  if (error) return { summary: `Error creating goal: ${error.message}` };

  const contributionPart =
    contributionValue > 0
      ? contributionMode === "percent"
        ? ` with a plan to save ${contributionValue}% of income per month`
        : ` with a plan to save ${contributionValue} GEL per month`
      : "";
  return {
    summary: `Created goal "${data.name}" with a target of ${data.target_amount} GEL${contributionPart}.`,
    action: { target: "funds", label: "View goal" },
  };
}

async function setRecurringBillHandler(supabase: SupabaseClient, userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const amount = typeof input.amount === "number" ? input.amount : 0;
  const dayOfMonth = typeof input.day_of_month === "number" ? Math.min(31, Math.max(1, Math.round(input.day_of_month))) : 0;

  if (!name) return { summary: "Error: name is required and must be a non-empty string." };
  if (amount <= 0) return { summary: "Error: amount must be a positive number." };
  if (dayOfMonth < 1) return { summary: "Error: day_of_month is required and must be between 1 and 31." };

  const { data, error } = await supabase
    .from("calendar_payments")
    .insert({ user_id: userId, name, amount, day_of_month: dayOfMonth, color: "#3B82F6" })
    .select()
    .single();

  if (error) return { summary: `Error creating recurring bill: ${error.message}` };

  return {
    summary: `Set up a recurring bill "${data.name}" for ${data.amount} GEL, due on day ${data.day_of_month} of every month.`,
    action: { target: "calendar", label: "View calendar" },
  };
}

// Mirrors src/data/assetTypes.ts's liquidity mapping (Deno can't resolve the `@/` Vite alias).
const ASSET_LIQUIDITY: Record<string, "liquid" | "nonliquid"> = {
  cash: "liquid",
  investment: "liquid",
  real_estate: "nonliquid",
  vehicle: "nonliquid",
  valuables: "nonliquid",
  other: "nonliquid",
};
const LIABILITY_TYPES = new Set(["bank_loan", "personal_debt", "credit_card", "other"]);

async function addAssetHandler(supabase: SupabaseClient, userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const value = typeof input.value === "number" ? input.value : 0;
  const type = typeof input.type === "string" && input.type in ASSET_LIQUIDITY ? input.type : "other";

  if (!name) return { summary: "Error: name is required and must be a non-empty string." };
  if (value <= 0) return { summary: "Error: value must be a positive number." };

  const { data, error } = await supabase
    .from("assets")
    .insert({ user_id: userId, name, type, value, liquidity: ASSET_LIQUIDITY[type] })
    .select()
    .single();

  if (error) return { summary: `Error adding asset: ${error.message}` };

  return {
    summary: `Added asset "${data.name}" worth ${data.value} GEL.`,
    action: { target: "networth", label: "View net worth" },
  };
}

async function addLiabilityHandler(supabase: SupabaseClient, userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const amount = typeof input.amount === "number" ? input.amount : 0;
  const type = typeof input.type === "string" && LIABILITY_TYPES.has(input.type) ? input.type : "other";

  if (!name) return { summary: "Error: name is required and must be a non-empty string." };
  if (amount <= 0) return { summary: "Error: amount must be a positive number." };

  const { data, error } = await supabase
    .from("liabilities")
    .insert({ user_id: userId, name, type, amount })
    .select()
    .single();

  if (error) return { summary: `Error adding liability: ${error.message}` };

  return {
    summary: `Added liability "${data.name}" of ${data.amount} GEL.`,
    action: { target: "networth", label: "View net worth" },
  };
}

const LOAN_TYPES = new Set(["consumer", "mortgage", "auto", "business", "micro"]);

// deno-lint-ignore require-await
async function compareLoanOffersHandler(_supabase: SupabaseClient, _userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const principal = typeof input.principal === "number" ? input.principal : 0;
  const months = typeof input.months === "number" && input.months > 0 ? Math.round(input.months) : 36;
  const loanType = (typeof input.loan_type === "string" && LOAN_TYPES.has(input.loan_type) ? input.loan_type : "consumer") as LoanType;

  if (principal <= 0) return { summary: "Error: principal must be a positive number." };

  const offers = compareLoanOffers(principal, months, loanType);
  const top = offers.slice(0, 3);
  const summaryLines = top.map(
    (o, i) => `${i + 1}. ${o.bankName}: ${o.monthlyPayment.toFixed(2)} GEL/month (${(o.annualRate * 100).toFixed(1)}% APR, total interest ${o.totalInterest.toFixed(2)} GEL)`
  );

  return {
    summary: `Best ${loanType} loan offers for ${principal} GEL over ${months} months:\n${summaryLines.join("\n")}`,
    action: { target: "loan", label: "View loan comparison" },
  };
}

// deno-lint-ignore require-await
async function suggestBudgetSplitHandler(_supabase: SupabaseClient, _userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const income = typeof input.monthly_income === "number" ? input.monthly_income : 0;
  const ruleId = typeof input.rule === "string" ? input.rule : "classic";

  if (income <= 0) return { summary: "Error: monthly_income must be a positive number." };

  const rule = BUDGET_RULES.find((r) => r.id === ruleId) ?? BUDGET_RULES[0];
  const breakdown = seedAmountsFromRule(rule, income);
  const lines = breakdown.map((b) => `${b.label}: ${b.amount} GEL`);

  return {
    summary: `Budget split for ${income} GEL/month using the "${rule.label}" rule (${rule.needs}/${rule.wants}/${rule.savings} needs/wants/savings):\n${lines.join("\n")}`,
    action: { target: "budget", label: "View budget plan" },
  };
}

const REGIONS = new Set(["Tbilisi", "Kutaisi", "Rustavi", "Batumi", "Other"]);
const EMPLOYMENT_TYPES = new Set(["salaried", "public_sector", "self_employed", "freelancer"]);
const CREDIT_HISTORIES = new Set(["none", "some", "long"]);

// deno-lint-ignore require-await
async function checkLoanApprovalHandler(_supabase: SupabaseClient, _userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const monthlyIncome = typeof input.monthly_income_gel === "number" ? input.monthly_income_gel : 0;
  const loanAmount = typeof input.loan_amount === "number" ? input.loan_amount : 0;
  const loanTermMonths = typeof input.loan_term_months === "number" ? input.loan_term_months : 0;

  if (monthlyIncome <= 0) return { summary: "Error: monthly_income_gel must be a positive number." };
  if (loanAmount <= 0) return { summary: "Error: loan_amount must be a positive number." };
  if (loanTermMonths <= 0) return { summary: "Error: loan_term_months must be a positive number." };

  const applicant: ApplicantInput = {
    age: typeof input.age === "number" ? input.age : 35,
    monthly_income_gel: monthlyIncome,
    loan_amount: loanAmount,
    loan_term_months: loanTermMonths,
    loan_currency: (typeof input.loan_currency === "string" && input.loan_currency === "USD" ? "USD" : "GEL") as LoanCurrency,
    region: (typeof input.region === "string" && REGIONS.has(input.region) ? input.region : "Tbilisi") as Region,
    employment_type: (typeof input.employment_type === "string" && EMPLOYMENT_TYPES.has(input.employment_type) ? input.employment_type : "salaried") as EmploymentType,
    credit_history: (typeof input.credit_history === "string" && CREDIT_HISTORIES.has(input.credit_history) ? input.credit_history : "some") as CreditHistory,
    years_at_job: typeof input.years_at_job === "number" ? input.years_at_job : 3,
    credit_history_months: typeof input.credit_history_months === "number" ? input.credit_history_months : 24,
    income_months_last_6: typeof input.income_months_last_6 === "number" ? Math.min(6, input.income_months_last_6) : 6,
    overdrafts_last_6m: typeof input.overdrafts_last_6m === "number" ? input.overdrafts_last_6m : 0,
    essentials_share_pct: typeof input.essentials_share_pct === "number" ? input.essentials_share_pct : 40,
    existing_loans: typeof input.existing_loans === "number" ? input.existing_loans : 0,
  };

  const result = scoreApplicant(applicant);

  const decisionText = result.decision === "auto_approve" ? "likely approved" : result.decision === "manual_review" ? "needs manual review" : "likely declined";
  const ptiText = result.ptiPass
    ? `PTI ${result.ptiPct.toFixed(1)}% is within the ${result.ptiLimitPct}% limit.`
    : `PTI ${result.ptiPct.toFixed(1)}% EXCEEDS the ${result.ptiLimitPct}% limit — this alone would block approval regardless of score.`;
  const reasonsText = result.reasons.map((r) => `${r.label} (${r.direction === "up" ? "increases" : "decreases"} risk)`).join(", ");

  return {
    summary: `Estimated default probability: ${(result.pd * 100).toFixed(1)}% → ${decisionText}. Estimated monthly payment: ${result.monthlyPayment.toFixed(0)} GEL. ${ptiText} Top factors: ${reasonsText}. This is an estimate from a model trained on fictional data, not a real bank decision.`,
    action: { target: "credit", label: "View loan approval estimate" },
  };
}

async function detectRecurringPaymentsHandler(supabase: SupabaseClient, userId: string, _input: Record<string, unknown>): Promise<ToolResult> {
  const { data: expenses, error: txError } = await supabase
    .from("transactions")
    .select("note, amount, date, category")
    .eq("type", "expense");
  if (txError) return { summary: `Error reading transactions: ${txError.message}` };

  const { data: payments, error: payError } = await supabase.from("calendar_payments").select("name").eq("user_id", userId);
  if (payError) return { summary: `Error reading existing recurring payments: ${payError.message}` };

  const { data: dismissed, error: dismissError } = await supabase.from("dismissed_recurring_payments").select("name").eq("user_id", userId);
  if (dismissError) return { summary: `Error reading dismissed recurring payments: ${dismissError.message}` };

  const excluded = [...(payments ?? []).map((p) => p.name), ...(dismissed ?? []).map((d) => d.name)];
  const candidates = detectRecurringPayments(expenses ?? [], excluded);

  if (candidates.length === 0) {
    return { summary: "No recurring payment pattern was found in the user's transaction history (needs the same note, a similar amount, and a similar day of month across at least 2 different months)." };
  }

  const top = candidates[0];
  return {
    summary: `Found a likely recurring payment: "${top.name}", about ${top.amount} GEL, seen on roughly day ${top.day_of_month} of ${top.months_seen} different months. This is a DRAFT — nothing has been saved. The user must review and approve it themselves.`,
    action: {
      target: "calendar",
      label: "Review & approve",
      draft: { name: top.name, amount: top.amount, day_of_month: top.day_of_month },
    },
  };
}

async function rememberFactHandler(supabase: SupabaseClient, userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const fact = typeof input.fact === "string" ? input.fact.trim() : "";
  if (!fact) return { summary: "Error: fact is required and must be a non-empty string." };

  const { error } = await supabase.from("user_memory").insert({ user_id: userId, fact });
  if (error) return { summary: `Error saving memory: ${error.message}` };

  return { summary: `Remembered: "${fact}". Confirm to the user what was saved, in your own words, so they can correct it if it's wrong.` };
}

async function checkStoreDiscountsHandler(supabase: SupabaseClient, _userId: string, input: Record<string, unknown>): Promise<ToolResult> {
  const productQuery = typeof input.product_query === "string" ? input.product_query.trim() : "";

  const { data: storeRows, error: storeError } = await supabase
    .from("discount_offers")
    .select("store_slug, store_name_ka, store_name_en")
    .limit(2000);
  if (storeError) return { summary: `Error reading tracked stores: ${storeError.message}` };

  const knownStores = [...new Map((storeRows ?? []).map((s) => [s.store_slug, s])).values()].map((s) => ({
    slug: s.store_slug,
    name_ka: s.store_name_ka,
    name_en: s.store_name_en,
  }));
  if (knownStores.length === 0) {
    return { summary: "No discount data has been synced yet (ekalata-sync hasn't run)." };
  }

  const { data: expenses, error: txError } = await supabase.from("transactions").select("note, amount").eq("type", "expense");
  if (txError) return { summary: `Error reading transactions: ${txError.message}` };

  const frequentStores = detectFrequentStores(expenses ?? [], knownStores);

  // Product-specific lookup (e.g. "how much do eggs cost?") — search real tracked SKUs across
  // every known store, not just the user's frequent ones. ekalata only covers packaged
  // supermarket products, never restaurants/prepared food, so "no match" must be reported
  // honestly rather than letting the model fill the gap from general knowledge.
  if (productQuery) {
    const frequentSlugs = new Set(frequentStores.map((s) => s.storeSlug));
    const { data: productMatches, error: productError } = await supabase
      .from("discount_offers")
      .select("store_slug, store_name_ka, product_name_ka, price_new, price_old")
      .ilike("product_name_ka", `%${productQuery}%`)
      .limit(50);
    if (productError) return { summary: `Error searching discount offers: ${productError.message}` };

    if (!productMatches || productMatches.length === 0) {
      return {
        summary: `No real data for "${productQuery}" exists in ekalata.gov.ge's tracked products — it only covers packaged supermarket SKUs (Carrefour, Nikora, Goodwill, Spar, Magniti, etc.), never restaurants or prepared/cooked food (e.g. khinkali at a restaurant isn't tracked). Tell the user honestly that you don't have real pricing data for this specific item — never invent a price, store, or restaurant name.`,
      };
    }

    const ranked = productMatches
      .map((o) => ({ ...o, isFrequent: frequentSlugs.has(o.store_slug) }))
      .sort((a, b) => Number(b.isFrequent) - Number(a.isFrequent) || Number(a.price_new) - Number(b.price_new))
      .slice(0, 8);

    const lines = ranked.map((o) => {
      const hasDiscount = o.price_old != null && Number(o.price_old) > Number(o.price_new);
      const discountNote = hasDiscount
        ? ` (იყო ${o.price_old} GEL, -${(((Number(o.price_old) - Number(o.price_new)) / Number(o.price_old)) * 100).toFixed(0)}%)`
        : "";
      return `${o.store_name_ka}: ${o.product_name_ka} — ${o.price_new} GEL${discountNote}`;
    });

    return {
      summary: `Real current prices for "${productQuery}" (source: ekalata.gov.ge, Georgia's government price-transparency tool, today's snapshot):\n${lines.join(
        "\n"
      )}\nOnly state these exact products/stores/prices from this list — never add or guess a product, store, or price that isn't here.`,
    };
  }

  if (frequentStores.length === 0) {
    return {
      summary:
        "The user's transaction history doesn't match any store ekalata.gov.ge tracks (Carrefour, Nikora, Goodwill, Spar, Magniti, and others) — no real-store spending pattern to match discounts against.",
    };
  }

  const topSlugs = frequentStores.slice(0, 3).map((s) => s.storeSlug);
  const { data: offers, error: offerError } = await supabase
    .from("discount_offers")
    .select("store_name_ka, product_name_ka, price_new, price_old")
    .in("store_slug", topSlugs)
    .not("price_old", "is", null)
    .order("price_new", { ascending: true });
  if (offerError) return { summary: `Error reading discount offers: ${offerError.message}` };

  const genuineDiscounts = (offers ?? [])
    .filter((o) => o.price_old != null && Number(o.price_old) > Number(o.price_new))
    .map((o) => ({ ...o, pct: ((Number(o.price_old) - Number(o.price_new)) / Number(o.price_old)) * 100 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 8);

  if (genuineDiscounts.length === 0) {
    return {
      summary: `The user most often shops at ${frequentStores
        .slice(0, 3)
        .map((s) => s.storeNameKa)
        .join(", ")}, but no current discounts were found there in today's ekalata.gov.ge snapshot.`,
    };
  }

  const lines = genuineDiscounts.map(
    (o) => `${o.store_name_ka}: ${o.product_name_ka} — ${o.price_new} GEL (was ${o.price_old} GEL, -${o.pct.toFixed(0)}%)`
  );

  return {
    summary: `The user's most-frequented real stores (from their own transaction history) are ${frequentStores
      .slice(0, 3)
      .map((s) => s.storeNameKa)
      .join(", ")}. Real current discounts there (source: ekalata.gov.ge, Georgia's government price-transparency tool):\n${lines.join(
      "\n"
    )}\nMention this naturally, and say where the data is from if asked — never present it as something you inferred, it's a real daily snapshot.`,
  };
}

export const TOOLS: ToolDefinition[] = [
  {
    name: "add_calendar_reminder",
    description:
      "Creates a one-off reminder for a specific date (e.g. an upcoming bill, payment, or deadline). Use this when the user asks to be reminded about something on a given date. Not for recurring monthly bills.",
    parameters: {
      type: "OBJECT",
      properties: {
        label: { type: "STRING", description: "Short description of the reminder, e.g. 'Rent payment' or 'Car insurance renewal'." },
        amount: { type: "NUMBER", description: "Amount in GEL if this reminder is about a payment; omit if not monetary.", nullable: true },
        due_date: { type: "STRING", description: "ISO date (YYYY-MM-DD) the reminder is due. Resolve relative phrases like 'next Friday' using today's date given in the system prompt." },
        remind_days_before: { type: "INTEGER", description: "How many days before due_date to start surfacing this reminder. Defaults to 1 if the user doesn't specify." },
      },
      required: ["label", "due_date"],
    },
    handler: addCalendarReminderHandler,
  },
  {
    name: "create_fund",
    description:
      "Creates a new savings goal (a labeled target like 'Vacation' or 'Emergency fund') with a target amount. Use this when the user wants to start saving toward something specific or set a savings goal — not for recording a one-off transaction.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Short name for the goal, e.g. 'Vacation' or 'Emergency fund'." },
        target_amount: { type: "NUMBER", description: "The total amount in GEL the user wants to save toward." },
        contribution_mode: { type: "STRING", description: "How the user plans to contribute monthly: 'fixed' (a flat GEL amount) or 'percent' (a percentage of income). Defaults to 'fixed'." },
        contribution_value: { type: "NUMBER", description: "The monthly contribution amount (GEL if fixed, percent if percent-of-income). Omit if the user hasn't decided yet." },
      },
      required: ["name", "target_amount"],
    },
    handler: createFundHandler,
  },
  {
    name: "set_recurring_bill",
    description:
      "Creates a recurring MONTHLY bill or payment reminder (e.g. rent, internet, a subscription) that repeats every month on the same day. Use this for ongoing/repeating bills — for a one-time reminder on a specific date, use add_calendar_reminder instead.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Short name for the bill, e.g. 'Rent' or 'Netflix subscription'." },
        amount: { type: "NUMBER", description: "The amount in GEL due each month." },
        day_of_month: { type: "INTEGER", description: "The day of the month (1-31) this bill is due, every month." },
      },
      required: ["name", "amount", "day_of_month"],
    },
    handler: setRecurringBillHandler,
  },
  {
    name: "compare_loan_offers",
    description:
      "Compares loan offers across banks for a given amount, term, and loan type, returning the best options by monthly payment. Use this when the user asks about taking out a loan or wants to compare loan/bank offers. This is informational only — no real loan application happens.",
    parameters: {
      type: "OBJECT",
      properties: {
        principal: { type: "NUMBER", description: "The loan amount in GEL the user wants to borrow." },
        months: { type: "INTEGER", description: "The loan term in months. Defaults to 36 if the user doesn't specify a term — do not ask for this, just proceed with the default." },
        loan_type: { type: "STRING", description: "One of: 'consumer', 'mortgage', 'auto', 'business', 'micro'. Defaults to 'consumer' if not specified." },
      },
      required: ["principal"],
    },
    handler: compareLoanOffersHandler,
  },
  {
    name: "add_asset",
    description:
      "Adds an asset (something the user owns that has value — cash, an investment, real estate, a vehicle, valuables, etc.) to their net worth. Use this when the user mentions owning something with a monetary value that isn't already tracked, e.g. 'I have an apartment worth 200000' or 'I own 50000 GEL in stocks'.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Short name for the asset, e.g. 'Apartment' or 'S&P 500 investment'." },
        value: { type: "NUMBER", description: "The current value in GEL." },
        type: { type: "STRING", description: "One of: 'cash', 'investment', 'real_estate', 'vehicle', 'valuables', 'other'. Defaults to 'other' if unclear." },
      },
      required: ["name", "value"],
    },
    handler: addAssetHandler,
  },
  {
    name: "add_liability",
    description:
      "Adds a liability (a debt the user owes — a bank loan, credit card balance, or personal debt) to their net worth. Use this when the user mentions owing money that isn't already tracked, e.g. 'I have a 60000 GEL mortgage' or 'I owe my friend 2000 GEL'.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Short name for the liability, e.g. 'Mortgage' or 'Owe Nugzar'." },
        amount: { type: "NUMBER", description: "The amount owed in GEL." },
        type: { type: "STRING", description: "One of: 'bank_loan', 'personal_debt', 'credit_card', 'other'. Defaults to 'other' if unclear." },
      },
      required: ["name", "amount"],
    },
    handler: addLiabilityHandler,
  },
  {
    name: "suggest_budget_split",
    description:
      "Suggests how to split a monthly income across spending categories (housing, food, transport, entertainment, savings, etc.) using a named budgeting rule. Use this when the user asks how to budget their income, e.g. 'how should I split my 3000 GEL salary?' or 'suggest a budget for me'.",
    parameters: {
      type: "OBJECT",
      properties: {
        monthly_income: { type: "NUMBER", description: "The user's monthly income in GEL to split into a budget." },
        rule: {
          type: "STRING",
          description:
            "Which budgeting rule to apply: 'classic' (50/30/20, balanced — the default), 'economic' (70/20/10, more room for daily spending), 'zero-based' (55/15/30, savings-focused), or 'aggressive' (50/10/40, maximum investment). Default to 'classic' unless the user's goal clearly matches another rule (e.g. asks to save aggressively).",
        },
      },
      required: ["monthly_income"],
    },
    handler: suggestBudgetSplitHandler,
  },
  {
    name: "check_loan_approval",
    description:
      "Estimates whether a bank would likely approve a consumer loan, using a credit-risk model trained on fictional course data — an estimate, not a real bank decision. Returns a default-probability estimate, an approve/review/decline suggestion, the top factors driving the estimate, and whether the payment-to-income (PTI) affordability rule passes. Use this when the user asks whether they'd get approved for a loan, what their chances are, or what they'd need to change to qualify — not for comparing bank interest rates (use compare_loan_offers for that).",
    parameters: {
      type: "OBJECT",
      properties: {
        monthly_income_gel: { type: "NUMBER", description: "The applicant's net monthly income in GEL." },
        loan_amount: { type: "NUMBER", description: "The requested loan amount in GEL." },
        loan_term_months: { type: "INTEGER", description: "The requested loan term in months." },
        loan_currency: { type: "STRING", description: "'GEL' or 'USD'. Defaults to 'GEL' if not specified." },
        age: { type: "INTEGER", description: "Applicant's age. Defaults to 35 if not mentioned — do not ask for this unless relevant." },
        region: { type: "STRING", description: "One of: 'Tbilisi', 'Kutaisi', 'Rustavi', 'Batumi', 'Other'. Defaults to 'Tbilisi' if not mentioned — do not ask." },
        employment_type: { type: "STRING", description: "One of: 'salaried', 'public_sector', 'self_employed', 'freelancer'. Defaults to 'salaried' if not mentioned — do not ask." },
        credit_history: { type: "STRING", description: "One of: 'none', 'some', 'long'. Defaults to 'some' if not mentioned — do not ask." },
        years_at_job: { type: "NUMBER", description: "Years at current job. Defaults to 3 if not mentioned — do not ask." },
        existing_loans: { type: "INTEGER", description: "Number of existing loans. Defaults to 0 if not mentioned — do not ask." },
      },
      required: ["monthly_income_gel", "loan_amount", "loan_term_months"],
    },
    handler: checkLoanApprovalHandler,
  },
  {
    name: "detect_recurring_payments",
    description:
      "Scans the user's own transaction history for a payment that repeats (same note, similar amount, similar day of month) across at least 2 different months — like rent or a subscription — and are not already tracked as a recurring bill. Use this when the user asks Fino to check their spending for recurring payments, or asks whether anything looks like a regular bill. This only DRAFTS a suggestion for the user to review and approve themselves — it never saves anything automatically.",
    parameters: { type: "OBJECT", properties: {} },
    handler: detectRecurringPaymentsHandler,
  },
  {
    name: "remember_fact",
    description:
      "Saves a short, durable fact about the user for future conversations — a stated preference, usual shopping habit, goal, or similar detail they told you directly. Only call this for something the user explicitly and clearly said about themselves, never something you inferred, guessed, or paraphrased from unclear/test/nonsense input. If the message doesn't contain an unambiguous fact, do not call this tool at all — never save the raw message text as a 'fact' when its meaning isn't clear to you. Always tell the user afterward what you saved, in plain language, so they can correct it if it's wrong.",
    parameters: {
      type: "OBJECT",
      properties: {
        fact: {
          type: "STRING",
          description:
            "The fact to remember, written as a short, self-contained statement about the user (e.g. 'Usually buys rice, chicken, and milk' or 'Shops mainly at Nikora and Carrefour'). Never a verbatim quote of an unclear message or a note like 'meaning unclear'.",
        },
      },
      required: ["fact"],
    },
    handler: rememberFactHandler,
  },
  {
    name: "check_store_discounts",
    description:
      "Finds real current prices/discounts from ekalata.gov.ge (Georgia's government price-transparency tool, synced daily; covers packaged supermarket SKUs only — never restaurants or prepared food). With no arguments, matches the user's own transaction history against tracked stores and reports real discounts at the ones they actually shop at. Pass product_query whenever the user asks about a specific product or item's price (e.g. 'კვერცხი', 'რძე', 'olive oil') — this searches real tracked prices for that exact product across all stores. Only reports real, dated data that this tool actually returned — never invents prices, stores, products, or restaurants; if nothing matches, the tool says so and you must relay that honestly.",
    parameters: {
      type: "OBJECT",
      properties: {
        product_query: {
          type: "STRING",
          description:
            "A specific product/item name the user asked about, in Georgian or English (e.g. 'კვერცხი', 'olive oil'). Omit this for a general 'any discounts for me?' question.",
        },
      },
    },
    handler: checkStoreDiscountsHandler,
  },
];

export function getTool(name: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.name === name);
}
