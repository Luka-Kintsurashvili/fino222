export interface SavingsResult {
  months: number;
  totalDeposited: number;
  interestEarned: number;
  projectedDate: Date;
}

/** Solve for months needed to reach a target with compound interest and monthly contributions.
 *  n = ln(1 + (FV*r)/PMT) / ln(1+r)   where r = monthly rate
 */
export function monthsToGoal(target: number, monthlyContribution: number, annualRate: number): SavingsResult | null {
  if (monthlyContribution <= 0 || target <= 0) return null;

  const r = annualRate / 12;
  let months: number;

  if (r === 0) {
    months = target / monthlyContribution;
  } else {
    const arg = 1 + (target * r) / monthlyContribution;
    if (arg <= 0) return null;
    months = Math.log(arg) / Math.log(1 + r);
  }

  if (!Number.isFinite(months) || months <= 0) return null;

  const roundedMonths = Math.ceil(months);
  const totalDeposited = roundedMonths * monthlyContribution;
  const interestEarned = target - totalDeposited;

  const projectedDate = new Date();
  projectedDate.setMonth(projectedDate.getMonth() + roundedMonths);

  return {
    months: roundedMonths,
    totalDeposited,
    interestEarned: Math.max(0, interestEarned),
    projectedDate,
  };
}
