export interface AdvisorInput {
  income: number;
  food: number;
  transport: number;
  entertainment: number;
  other: number;
  goalAmount: number;
  targetDate: Date;
}

export interface AdvisorResult {
  totalExpenses: number;
  leftover: number;
  monthsToTarget: number;
  requiredMonthlySavings: number;
  isRealistic: boolean;
  shortfall: number;
}

export function evaluateAdvisor(input: AdvisorInput): AdvisorResult {
  const totalExpenses = input.food + input.transport + input.entertainment + input.other;
  const leftover = input.income - totalExpenses;

  const now = new Date();
  const monthsToTarget = Math.max(
    1,
    (input.targetDate.getFullYear() - now.getFullYear()) * 12 + (input.targetDate.getMonth() - now.getMonth())
  );

  const requiredMonthlySavings = input.goalAmount / monthsToTarget;
  const isRealistic = leftover >= requiredMonthlySavings;
  const shortfall = isRealistic ? 0 : requiredMonthlySavings - leftover;

  return { totalExpenses, leftover, monthsToTarget, requiredMonthlySavings, isRealistic, shortfall };
}
