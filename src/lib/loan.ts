import { banks, type Bank } from "@/data/banks";

export type LoanType = "consumer" | "mortgage" | "auto" | "business" | "micro";

export interface LoanOffer {
  bank: Bank;
  annualRate: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
}

export function rateForLoanType(bank: Bank, type: LoanType): number {
  if (type === "mortgage") return bank.mortgageRate;
  if (type === "auto") return bank.autoRate;
  if (type === "business") return bank.businessRate;
  if (type === "micro") return bank.microRate;
  return bank.consumerRate;
}

/** Standard amortization formula: M = P * r(1+r)^n / ((1+r)^n - 1) */
export function monthlyPayment(principal: number, annualRate: number, months: number): number {
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
      bank,
      annualRate,
      monthlyPayment: payment,
      totalPayment: total,
      totalInterest: total - principal,
    };
  });
  return offers.sort((a, b) => a.monthlyPayment - b.monthlyPayment);
}
