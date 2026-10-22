// Fixed, non-random fake transaction data — supplements the real TBC mock data (tbcMockClient.ts)
// with a richer, categorized 3-month history for budgeting/recurring-bill features the mock's
// small transaction set doesn't cover. Deliberately deterministic: every Fino user who connects
// sees exactly the same amounts, merchants and dates, so the demo is reproducible and the
// organizers' own test account looks identical to any other tester's.

// BOG has no public Open Banking mock available (unlike TBC — see tbcMockClient.ts), so it
// stays a simulated connection with a fixed balance, standing in for the "every bank in one
// place" pitch until real multi-bank access exists.
export const DEMO_BANKS = [{ bankId: "bog", nickname: "დემო ანგარიში", balance: 1780 }] as const;

interface DemoTransaction {
  type: "income" | "expense";
  amount: number;
  category: string | null;
  note: string;
  date: string;
  external_id: string;
}

// One fixed merchant per calendar slot — no randomness, so the same slot always produces the
// same merchant for every user, every run.
const FOOD_MERCHANTS = ["Carrefour", "Nikora", "Fresco", "Goodwill"];
const TRANSPORT_MERCHANTS = ["Bolt", "Wheely", "Yandex Taxi", "Socar საწვავი", "Bolt"];
const ENTERTAINMENT_MERCHANTS = ["Cinema House", "Netflix"];

function dateStr(year: number, month: number, day: number): string {
  const d = new Date(year, month, Math.min(day, 28));
  return d.toISOString().slice(0, 10);
}

/** A stable, idempotent 3-month history — identical for every user, safe to upsert repeatedly. */
export function generateSeedTransactions(): DemoTransaction[] {
  const rows: DemoTransaction[] = [];
  const today = new Date();
  let idx = 0;

  for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
    const d = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
    const y = d.getFullYear();
    const m = d.getMonth();

    rows.push({ type: "income", amount: 2200, category: null, note: "ხელფასი", date: dateStr(y, m, 1), external_id: `demo-seed-${idx++}` });
    rows.push({ type: "expense", amount: 800, category: "housing", note: "ბინის ქირა", date: dateStr(y, m, 3), external_id: `demo-seed-${idx++}` });
    rows.push({ type: "expense", amount: 82, category: "housing", note: "საქართველოს ენერგია", date: dateStr(y, m, 5), external_id: `demo-seed-${idx++}` });
    rows.push({ type: "expense", amount: 45, category: "housing", note: "Silknet ინტერნეტი", date: dateStr(y, m, 6), external_id: `demo-seed-${idx++}` });

    const foodAmounts = [42, 68, 55, 90];
    for (let i = 0; i < 4; i++) {
      rows.push({ type: "expense", amount: foodAmounts[i], category: "food", note: FOOD_MERCHANTS[i], date: dateStr(y, m, 2 + i * 7), external_id: `demo-seed-${idx++}` });
    }
    const transportAmounts = [8, 12, 6, 15, 9];
    for (let i = 0; i < 5; i++) {
      rows.push({ type: "expense", amount: transportAmounts[i], category: "transport", note: TRANSPORT_MERCHANTS[i], date: dateStr(y, m, 1 + i * 5), external_id: `demo-seed-${idx++}` });
    }
    const entertainmentAmounts = [35, 18];
    for (let i = 0; i < 2; i++) {
      rows.push({ type: "expense", amount: entertainmentAmounts[i], category: "entertainment", note: ENTERTAINMENT_MERCHANTS[i], date: dateStr(y, m, 10 + i * 10), external_id: `demo-seed-${idx++}` });
    }
  }

  return rows.filter((r) => new Date(r.date) <= today);
}

/** One new transaction per calendar day — deterministic (same day always produces the same
 * entry for everyone), and idempotent (the external_id is keyed by date, so syncing twice in
 * one day doesn't duplicate it; syncing on a new day adds exactly one more). */
export function generateFreshTransaction(): DemoTransaction {
  const pools: { category: string; merchants: string[]; amounts: number[] }[] = [
    { category: "food", merchants: FOOD_MERCHANTS, amounts: [48, 72, 60, 95] },
    { category: "transport", merchants: TRANSPORT_MERCHANTS, amounts: [8, 12, 6, 15, 9] },
    { category: "entertainment", merchants: ENTERTAINMENT_MERCHANTS, amounts: [35, 18] },
  ];
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86_400_000);
  const pool = pools[dayOfYear % pools.length];
  const slot = dayOfYear % pool.merchants.length;

  return {
    type: "expense",
    amount: pool.amounts[slot % pool.amounts.length],
    category: pool.category,
    note: pool.merchants[slot],
    date: today.toISOString().slice(0, 10),
    external_id: `demo-fresh-${today.toISOString().slice(0, 10)}`,
  };
}
