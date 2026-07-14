export interface Bank {
  id: string;
  name: string;
  /** Annual base rate for a consumer loan, as a decimal (e.g. 0.14 = 14%) */
  consumerRate: number;
  /** Annual rate discount applied to mortgage loans */
  mortgageRate: number;
  /** Annual rate discount applied to auto loans */
  autoRate: number;
  /** Annual deposit rates by term, as decimals */
  depositRates: { "3": number; "6": number; "12": number };
}

export const banks: Bank[] = [
  {
    id: "tbc",
    name: "TBC ბანკი",
    consumerRate: 0.15,
    mortgageRate: 0.105,
    autoRate: 0.12,
    depositRates: { "3": 0.075, "6": 0.085, "12": 0.095 },
  },
  {
    id: "bog",
    name: "საქართველოს ბანკი",
    consumerRate: 0.148,
    mortgageRate: 0.108,
    autoRate: 0.121,
    depositRates: { "3": 0.07, "6": 0.082, "12": 0.093 },
  },
  {
    id: "liberty",
    name: "ლიბერთი",
    consumerRate: 0.169,
    mortgageRate: 0.119,
    autoRate: 0.135,
    depositRates: { "3": 0.08, "6": 0.09, "12": 0.1 },
  },
  {
    id: "credo",
    name: "კრედო",
    consumerRate: 0.182,
    mortgageRate: 0.135,
    autoRate: 0.148,
    depositRates: { "3": 0.078, "6": 0.088, "12": 0.098 },
  },
  {
    id: "basisbank",
    name: "ბაზისბანკი",
    consumerRate: 0.158,
    mortgageRate: 0.112,
    autoRate: 0.128,
    depositRates: { "3": 0.076, "6": 0.086, "12": 0.096 },
  },
];
