export type CurrencyCode = "GEL" | "USD" | "EUR" | "GBP" | "RUB" | "TRY";

export const currencies: { code: CurrencyCode; label: string; flag: string }[] = [
  { code: "GEL", label: "ქართული ლარი", flag: "🇬🇪" },
  { code: "USD", label: "აშშ დოლარი", flag: "🇺🇸" },
  { code: "EUR", label: "ევრო", flag: "🇪🇺" },
  { code: "GBP", label: "ბრიტანული გირვანქა", flag: "🇬🇧" },
  { code: "RUB", label: "რუსული რუბლი", flag: "🇷🇺" },
  { code: "TRY", label: "თურქული ლირა", flag: "🇹🇷" },
];

/** Approximate fallback rates (GEL base) used only if the live API is unreachable. */
export const fallbackRatesFromGEL: Record<CurrencyCode, number> = {
  GEL: 1,
  USD: 0.37,
  EUR: 0.34,
  GBP: 0.29,
  RUB: 33,
  TRY: 12.6,
};

export interface RatesResult {
  rates: Record<CurrencyCode, number>;
  live: boolean;
  updatedAt: Date;
}

const API_URL = "https://open.er-api.com/v6/latest/GEL";

export async function fetchGelRates(): Promise<RatesResult> {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.result !== "success" || !data.rates) throw new Error("Unexpected API response");

    const rates = {} as Record<CurrencyCode, number>;
    for (const code of Object.keys(fallbackRatesFromGEL) as CurrencyCode[]) {
      rates[code] = data.rates[code] ?? fallbackRatesFromGEL[code];
    }

    return { rates, live: true, updatedAt: new Date() };
  } catch {
    return { rates: fallbackRatesFromGEL, live: false, updatedAt: new Date() };
  }
}

export function convert(amount: number, from: CurrencyCode, to: CurrencyCode, ratesFromGEL: Record<CurrencyCode, number>): number {
  const amountInGEL = amount / ratesFromGEL[from];
  return amountInGEL * ratesFromGEL[to];
}
