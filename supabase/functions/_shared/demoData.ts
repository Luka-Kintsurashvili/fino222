// Realistic-looking fake TBC account/transaction data for the SIMULATED bank connection.
// Real TBC Open Banking access requires a National Bank of Georgia AISP license that
// this project doesn't hold yet — see tbc-consent-start/index.ts for the real (dormant)
// flow this stands in for until that's obtained.

export const DEMO_BANK_ID = "tbc-demo";

interface DemoTransaction {
  type: "income" | "expense";
  amount: number;
  category: string | null;
  note: string;
  date: string;
  external_id: string;
}

const FOOD_MERCHANTS = ["Carrefour", "Nikora", "Fresco", "Goodwill", "Spar"];
const TRANSPORT_MERCHANTS = ["Bolt", "Wheely", "Yandex Taxi", "Socar საწვავი"];
const ENTERTAINMENT_MERCHANTS = ["Cinema House", "Netflix", "Wolt", "Glovo"];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function dateStr(year: number, month: number, day: number): string {
  const d = new Date(year, month, Math.min(day, 28));
  return d.toISOString().slice(0, 10);
}

/** A stable, idempotent 3-month history — safe to upsert repeatedly (same external_ids every time). */
export function generateSeedTransactions(): DemoTransaction[] {
  const rows: DemoTransaction[] = [];
  const today = new Date();
  let idx = 0;

  for (let monthsAgo = 2; monthsAgo >= 0; monthsAgo--) {
    const d = new Date(today.getFullYear(), today.getMonth() - monthsAgo, 1);
    const y = d.getFullYear();
    const m = d.getMonth();

    rows.push({ type: "income", amount: 2200 + randomAmount(-100, 100), category: null, note: "ხელფასი", date: dateStr(y, m, 1), external_id: `demo-seed-${idx++}` });
    rows.push({ type: "expense", amount: 800, category: "housing", note: "ბინის ქირა", date: dateStr(y, m, 3), external_id: `demo-seed-${idx++}` });
    rows.push({ type: "expense", amount: randomAmount(70, 95), category: "housing", note: "საქართველოს ენერგია", date: dateStr(y, m, 5), external_id: `demo-seed-${idx++}` });
    rows.push({ type: "expense", amount: 45, category: "housing", note: "Silknet ინტერნეტი", date: dateStr(y, m, 6), external_id: `demo-seed-${idx++}` });

    for (let i = 0; i < 4; i++) {
      rows.push({ type: "expense", amount: randomAmount(35, 110), category: "food", note: pick(FOOD_MERCHANTS), date: dateStr(y, m, 2 + i * 7), external_id: `demo-seed-${idx++}` });
    }
    for (let i = 0; i < 5; i++) {
      rows.push({ type: "expense", amount: randomAmount(5, 18), category: "transport", note: pick(TRANSPORT_MERCHANTS), date: dateStr(y, m, 1 + i * 5), external_id: `demo-seed-${idx++}` });
    }
    for (let i = 0; i < 2; i++) {
      rows.push({ type: "expense", amount: randomAmount(15, 60), category: "entertainment", note: pick(ENTERTAINMENT_MERCHANTS), date: dateStr(y, m, 10 + i * 10), external_id: `demo-seed-${idx++}` });
    }
  }

  return rows.filter((r) => new Date(r.date) <= today);
}

/** One new, uniquely-IDed transaction — simulates "fresh activity" on each manual sync click. */
export function generateFreshTransaction(): DemoTransaction {
  const pools: { category: string; merchants: string[]; range: [number, number] }[] = [
    { category: "food", merchants: FOOD_MERCHANTS, range: [15, 90] },
    { category: "transport", merchants: TRANSPORT_MERCHANTS, range: [5, 20] },
    { category: "entertainment", merchants: ENTERTAINMENT_MERCHANTS, range: [10, 55] },
  ];
  const pool = pick(pools);
  return {
    type: "expense",
    amount: randomAmount(pool.range[0], pool.range[1]),
    category: pool.category,
    note: pick(pool.merchants),
    date: new Date().toISOString().slice(0, 10),
    external_id: `demo-fresh-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  };
}
