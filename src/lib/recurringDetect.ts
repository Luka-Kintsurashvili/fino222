// Client-side copy of supabase/functions/_shared/recurringDetect.ts — kept in sync manually.
// Deterministic pattern matching over the user's own expense history: same note, similar
// amount, similar day of month, across at least 2 different months, not already tracked.

export interface ExpenseRow {
  note: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category?: string | null;
}

// Day-to-day discretionary spending (groceries, taxis, nights out) can coincidentally repeat
// at a similar amount and day without being a "bill" anyone would want on a payment calendar —
// recurring detection is only useful for things like rent, utilities, subscriptions and loan
// repayments, so these categories are excluded even if they otherwise match the pattern.
const VARIABLE_SPENDING_CATEGORIES = new Set(["food", "transport", "entertainment"]);

export interface RecurringCandidate {
  name: string;
  amount: number;
  day_of_month: number;
  months_seen: number;
}

const MAX_DAY_SPREAD = 3;
const MAX_AMOUNT_VARIATION = 0.15;

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stddev(values: number[], avg: number): number {
  return Math.sqrt(mean(values.map((v) => (v - avg) ** 2)));
}

const LOAN_KEYWORDS = ["სესხ", "კრედიტ", "განვადება", "loan", "credit", "installment"];

/** Heuristic only — flags a recurring payment whose note reads like a loan/installment
 * repayment, so it can be suggested (not assumed) as an existing loan in the credit check. */
export function isLikelyExistingLoan(name: string): boolean {
  const lower = name.toLowerCase();
  return LOAN_KEYWORDS.some((k) => lower.includes(k));
}

export function detectRecurringPayments(expenses: ExpenseRow[], existingPaymentNames: string[]): RecurringCandidate[] {
  const existing = new Set(existingPaymentNames.map((n) => n.trim().toLowerCase()));
  const groups = new Map<string, ExpenseRow[]>();

  for (const e of expenses) {
    const key = e.note.trim();
    if (!key || existing.has(key.toLowerCase())) continue;
    const list = groups.get(key) ?? [];
    list.push(e);
    groups.set(key, list);
  }

  const candidates: RecurringCandidate[] = [];

  for (const [name, rows] of groups) {
    if (rows[0].category && VARIABLE_SPENDING_CATEGORIES.has(rows[0].category)) continue;

    const months = new Set(rows.map((r) => r.date.slice(0, 7)));
    if (months.size < 2) continue;

    const days = rows.map((r) => Number(r.date.slice(8, 10)));
    const daySpread = Math.max(...days) - Math.min(...days);
    if (daySpread > MAX_DAY_SPREAD) continue;

    const amounts = rows.map((r) => r.amount);
    const avgAmount = mean(amounts);
    const variation = avgAmount > 0 ? stddev(amounts, avgAmount) / avgAmount : 1;
    if (variation > MAX_AMOUNT_VARIATION) continue;

    candidates.push({ name, amount: Math.round(avgAmount), day_of_month: Math.round(mean(days)), months_seen: months.size });
  }

  return candidates.sort((a, b) => b.months_seen - a.months_seen || b.amount - a.amount);
}
