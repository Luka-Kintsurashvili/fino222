/** Future purchasing power of today's amount after N years of inflation. */
export function purchasingPower(amountToday: number, annualRate: number, years: number): number {
  return amountToday / Math.pow(1 + annualRate, years);
}

/** Amount needed in N years to match today's purchasing power. */
export function equivalentFutureAmount(amountToday: number, annualRate: number, years: number): number {
  return amountToday * Math.pow(1 + annualRate, years);
}
