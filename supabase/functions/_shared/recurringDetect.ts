// Deterministic recurring-payment detection — pure pattern matching over the user's own
// expense history, no LLM guessing involved (the model only gets to explain the result).
// Groups expenses by note, keeps groups that look like a real recurring bill (same rough
// day of month, same rough amount, across at least 2 different calendar months), and skips
// anything the user has already added to calendar_payments.

export interface ExpenseRow {
  note: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

export interface RecurringCandidate {
  name: string;
  amount: number;
  day_of_month: number;
  months_seen: number;
}

const MAX_DAY_SPREAD = 3; // days of month must cluster within this range
const MAX_AMOUNT_VARIATION = 0.15; // coefficient of variation (stddev / mean)

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stddev(values: number[], avg: number): number {
  return Math.sqrt(mean(values.map((v) => (v - avg) ** 2)));
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
    const months = new Set(rows.map((r) => r.date.slice(0, 7)));
    if (months.size < 2) continue; // needs to repeat across at least 2 different months

    const days = rows.map((r) => Number(r.date.slice(8, 10)));
    const daySpread = Math.max(...days) - Math.min(...days);
    if (daySpread > MAX_DAY_SPREAD) continue;

    const amounts = rows.map((r) => r.amount);
    const avgAmount = mean(amounts);
    const variation = avgAmount > 0 ? stddev(amounts, avgAmount) / avgAmount : 1;
    if (variation > MAX_AMOUNT_VARIATION) continue;

    candidates.push({
      name,
      amount: Math.round(avgAmount),
      day_of_month: Math.round(mean(days)),
      months_seen: months.size,
    });
  }

  return candidates.sort((a, b) => b.months_seen - a.months_seen || b.amount - a.amount);
}
