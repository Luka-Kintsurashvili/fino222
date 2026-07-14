export interface CalendarCell {
  day: number | null;
}

/** Builds a 7-column grid of cells (Monday-start) for the given month, with leading/trailing nulls for padding. */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // getDay(): 0 = Sunday ... convert to Monday-start index (0 = Monday)
  const leadingBlanks = (firstDay.getDay() + 6) % 7;

  const cells: CalendarCell[] = [];
  for (let i = 0; i < leadingBlanks; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d });
  while (cells.length % 7 !== 0) cells.push({ day: null });
  return cells;
}

export const weekdayLabels = ["ორშ", "სამ", "ოთხ", "ხუთ", "პარ", "შაბ", "კვი"];
