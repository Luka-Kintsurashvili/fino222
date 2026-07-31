// Tool registry for the Fino chat assistant's Gemini function-calling loop.
// Add a new entry here (schema + handler) to give the assistant a new action —
// no changes to the request loop in functions/chat/index.ts are needed.
// Schema format follows Gemini's functionDeclarations.parameters (OpenAPI-subset, uppercase types).

import type { SupabaseClient } from "npm:@supabase/supabase-js@2";
import { compareLoanOffers, type LoanType } from "./loanMath.ts";
import { BUDGET_RULES, seedAmountsFromRule } from "./budgetMath.ts";

export type TileTarget = "funds" | "calendar" | "loan" | "networth" | "budget";

export interface ChatAction {
  target: TileTarget;
  label: string;
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

  if (error) return { summary: `Error creating fund: ${error.message}` };

  const contributionPart =
    contributionValue > 0
      ? contributionMode === "percent"
        ? ` with a plan to save ${contributionValue}% of income per month`
        : ` with a plan to save ${contributionValue} GEL per month`
      : "";
  return {
    summary: `Created fund "${data.name}" with a target of ${data.target_amount} GEL${contributionPart}.`,
    action: { target: "funds", label: "View fund" },
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
      "Creates a new savings fund (a labeled sub-goal like 'Vacation' or 'Emergency fund') with a target amount. Use this when the user wants to start saving toward something specific or set a savings goal — not for recording a one-off transaction.",
    parameters: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING", description: "Short name for the fund, e.g. 'Vacation' or 'Emergency fund'." },
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
];

export function getTool(name: string): ToolDefinition | undefined {
  return TOOLS.find((t) => t.name === name);
}
