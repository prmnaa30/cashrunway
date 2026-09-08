/**
 * Deterministic date utilities (zero-dependency) for discrete financial simulations.
 * All operations run on the local timezone at 00:00:00 to avoid UTC offset and shifting bugs.
 */

/**
 * Parses a 'YYYY-MM-DD' string into a local Date object (00:00:00).
 */
export function parseLocalDate(dateStr: string): Date {
  const [yearStr, monthStr, dayStr] = dateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const day = parseInt(dayStr, 10);
  return new Date(year, month, day, 0, 0, 0, 0);
}

/**
 * Formats a local Date object into a 'YYYY-MM-DD' string.
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the 'YYYY-MM' period format from a Date object.
 */
export function formatPeriod(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * Adds or subtracts a specified number of days to/from a Date object.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate() + days, 0, 0, 0, 0);
  return result;
}

/**
 * Calculates the calendar day difference (target - start).
 * Positive if target is after start.
 */
export function diffDays(startDate: Date, targetDate: Date): number {
  const utcStart = Date.UTC(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const utcTarget = Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round((utcTarget - utcStart) / MS_PER_DAY);
}

/**
 * Returns the number of days in a given month (month: 1-12).
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Clamps the target due day (1-31) against the maximum days of the target month.
 * Example: dueDay 31 in a non-leap February is clamped to 28, in leap February to 29, and in April to 30.
 * Month is 1-12.
 */
export function clampDayOfMonth(year: number, month: number, targetDay: number): number {
  const maxDays = getDaysInMonth(year, month);
  return Math.max(1, Math.min(targetDay, maxDays));
}

/**
 * Checks whether two dates fall on the same calendar day.
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}
