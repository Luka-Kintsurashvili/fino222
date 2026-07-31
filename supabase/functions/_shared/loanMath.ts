// Ported from src/lib/loan.ts + src/data/banks.ts — Deno can't resolve the "@/" Vite alias,
// so this is a deliberate duplicate. Keep in sync manually if the client-side source changes.

export interface Bank {
  id: string;
  name: string;
  consumerRate: number;
  mortgageRate: number;
  autoRate: number;
  businessRate: number;
  microRate: number;
}

export type LoanType = "consumer" | "mortgage" | "auto" | "business" | "micro";

export interface LoanOffer {
  bankName: string;
  annualRate: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
}

const banks: Bank[] = [
  { id: "tbc", name: "TBC ბანკი", consumerRate: 0.15, mortgageRate: 0.105, autoRate: 0.12, businessRate: 0.135, microRate: 0.19 },
  { id: "bog", name: "საქართველოს ბანკი", consumerRate: 0.148, mortgageRate: 0.108, autoRate: 0.121, businessRate: 0.132, microRate: 0.188 },
  { id: "liberty", name: "ლიბერთი", consumerRate: 0.169, mortgageRate: 0.119, autoRate: 0.135, businessRate: 0.15, microRate: 0.205 },
  { id: "credo", name: "კრედო", consumerRate: 0.182, mortgageRate: 0.135, autoRate: 0.148, businessRate: 0.162, microRate: 0.215 },
  { id: "basisbank", name: "ბაზისბანკი", consumerRate: 0.158, mortgageRate: 0.112, autoRate: 0.128, businessRate: 0.141, microRate: 0.196 },
];

function rateForLoanType(bank: Bank, type: LoanType): number {
  if (type === "mortgage") return bank.mortgageRate;
  if (type === "auto") return bank.autoRate;
  if (type === "business") return bank.businessRate;
  if (type === "micro") return bank.microRate;
  return bank.consumerRate;
}

/** Standard amortization formula: M = P * r(1+r)^n / ((1+r)^n - 1) */
function monthlyPayment(principal: number, annualRate: number, months: number): number {
  if (months <= 0 || principal <= 0) return 0;
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  const factor = Math.pow(1 + r, months);
  return (principal * r * factor) / (factor - 1);
}

export function compareLoanOffers(principal: number, months: number, type: LoanType): LoanOffer[] {
  const offers = banks.map((bank) => {
    const annualRate = rateForLoanType(bank, type);
    const payment = monthlyPayment(principal, annualRate, months);
    const total = payment * months;
    return {
      bankName: bank.name,
      annualRate,
      monthlyPayment: payment,
      totalPayment: total,
      totalInterest: total - principal,
    };
  });
  return offers.sort((a, b) => a.monthlyPayment - b.monthlyPayment);
}
