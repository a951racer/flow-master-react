/**
 * Formats an ISO 8601 date string or Date object as "MMM D, YYYY".
 */
export function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '—';
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return formatter.format(date);
}

/**
 * Returns true if the date represented by dateStr falls within the inclusive
 * range [today, today + days] in local calendar time.
 */
export function isWithinNextDays(dateStr: string, days: number): boolean {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfRange = new Date(startOfToday);
  endOfRange.setDate(startOfToday.getDate() + days);

  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);

  return target >= startOfToday && target <= endOfRange;
}

/**
 * Returns true if a recurring item with the given dayOfMonth falls within
 * the next `days` calendar days from today.
 * Checks both the current month and next month to handle month boundaries.
 */
export function isDayOfMonthWithinNextDays(dayOfMonth: number, days: number): boolean {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfRange = new Date(startOfToday);
  endOfRange.setDate(startOfToday.getDate() + days);

  const currentMonthOccurrence = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
  if (currentMonthOccurrence >= startOfToday && currentMonthOccurrence <= endOfRange) {
    return true;
  }

  const nextMonthOccurrence = new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);
  return nextMonthOccurrence >= startOfToday && nextMonthOccurrence <= endOfRange;
}

/**
 * Given a dayOfMonth, returns the next occurrence formatted as "MMM D, YYYY".
 * If the day is today or later this month, returns this month's date.
 * Otherwise returns next month's date.
 */
export function nextOccurrenceFromDayOfMonth(dayOfMonth: number): string {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const thisMonthOccurrence = new Date(today.getFullYear(), today.getMonth(), dayOfMonth);
  const target = thisMonthOccurrence >= startOfToday
    ? thisMonthOccurrence
    : new Date(today.getFullYear(), today.getMonth() + 1, dayOfMonth);

  // Format using local date parts to avoid UTC shift
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return formatter.format(target);
}
