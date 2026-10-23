// Deterministic "big discretionary spend relative to what's left" detector — pure arithmetic
// over the user's own transactions and current balance, no guessing or LLM involvement.

const AMOUNT_THRESHOLD_GEL = 150;
/** Flags a purchase when it's at least this big a slice of the user's current balance. */
const BALANCE_MULTIPLE = 3;
const RECENT_DAYS = 7;
const FLAGGED_CATEGORIES = new Set(["entertainment", "food"]);

export interface RecklessSpendAlert {
  transactionId: string;
  note: string;
  amount: number;
  date: string;
  category: string;
}

export function detectRecklessSpend(
  expenses: { id: string; note: string; amount: number; date: string; category: string | null }[],
  totalBalance: number
): RecklessSpendAlert | null {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECENT_DAYS);

  const candidate = expenses
    .filter((e) => e.category && FLAGGED_CATEGORIES.has(e.category))
    .filter((e) => e.amount >= AMOUNT_THRESHOLD_GEL)
    .filter((e) => new Date(e.date) >= cutoff)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  if (!candidate || totalBalance >= candidate.amount * BALANCE_MULTIPLE) return null;

  return {
    transactionId: candidate.id,
    note: candidate.note,
    amount: candidate.amount,
    date: candidate.date,
    category: candidate.category!,
  };
}
