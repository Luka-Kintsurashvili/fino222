export function formatGEL(value: number, opts: { decimals?: number } = {}): string {
  const { decimals = 0 } = opts;
  const formatted = value.toLocaleString("ka-GE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatted} ₾`;
}

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString("ka-GE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toLocaleString("ka-GE", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

const GEORGIAN_MONTHS = [
  "იანვარი",
  "თებერვალი",
  "მარტი",
  "აპრილი",
  "მაისი",
  "ივნისი",
  "ივლისი",
  "აგვისტო",
  "სექტემბერი",
  "ოქტომბერი",
  "ნოემბერი",
  "დეკემბერი",
];

export function georgianMonth(monthIndex: number): string {
  return GEORGIAN_MONTHS[monthIndex] ?? "";
}

export function monthsToYearsLabel(months: number): string {
  const years = Math.floor(months / 12);
  const rem = Math.round(months % 12);
  if (years === 0) return `${rem} თვე`;
  if (rem === 0) return `${years} წელი`;
  return `${years} წელი ${rem} თვე`;
}
