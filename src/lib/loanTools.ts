export interface PayoffResult {
  baseMonths: number;
  baseInterest: number;
  fasterMonths: number;
  fasterInterest: number;
  monthsSaved: number;
  interestSaved: number;
}

/** Months to fully amortize a balance at a given payment: n = -ln(1 - rP/M) / ln(1+r) */
function monthsToPayoff(balance: number, monthlyRate: number, payment: number): number | null {
  if (payment <= 0 || balance <= 0) return null;
  if (monthlyRate === 0) return balance / payment;
  const ratio = 1 - (monthlyRate * balance) / payment;
  if (ratio <= 0) return null; // payment doesn't even cover interest
  return -Math.log(ratio) / Math.log(1 + monthlyRate);
}

export function calculateEarlyPayoff(
  balance: number,
  annualRate: number,
  currentPayment: number,
  extraPayment: number
): PayoffResult | null {
  const r = annualRate / 12;
  const baseMonths = monthsToPayoff(balance, r, currentPayment);
  if (baseMonths === null) return null;

  const fasterPayment = currentPayment + extraPayment;
  const fasterMonths = extraPayment > 0 ? monthsToPayoff(balance, r, fasterPayment) : baseMonths;
  if (fasterMonths === null) return null;

  const baseInterest = currentPayment * baseMonths - balance;
  const fasterInterest = fasterPayment * fasterMonths - balance;

  return {
    baseMonths: Math.ceil(baseMonths),
    baseInterest,
    fasterMonths: Math.ceil(fasterMonths),
    fasterInterest,
    monthsSaved: Math.ceil(baseMonths) - Math.ceil(fasterMonths),
    interestSaved: Math.max(0, baseInterest - fasterInterest),
  };
}

export interface EligibilityResult {
  availableMonthlyCapacity: number;
  maxEligibleAmount: number;
  isRealistic: boolean;
  gap: number;
}

const MAX_DEBT_TO_INCOME = 0.4;
const ASSUMED_ANNUAL_RATE = 0.15;
const ASSUMED_TERM_MONTHS = 36;

/** Rough affordability estimate using a standard debt-to-income cap. */
export function estimateEligibility(income: number, existingObligations: number, desiredAmount: number): EligibilityResult {
  const availableMonthlyCapacity = Math.max(0, income * MAX_DEBT_TO_INCOME - existingObligations);

  const r = ASSUMED_ANNUAL_RATE / 12;
  const n = ASSUMED_TERM_MONTHS;
  const factor = Math.pow(1 + r, n);
  const maxEligibleAmount = availableMonthlyCapacity > 0 ? (availableMonthlyCapacity * (factor - 1)) / (r * factor) : 0;

  const isRealistic = maxEligibleAmount >= desiredAmount;
  const gap = isRealistic ? 0 : desiredAmount - maxEligibleAmount;

  return { availableMonthlyCapacity, maxEligibleAmount, isRealistic, gap };
}
