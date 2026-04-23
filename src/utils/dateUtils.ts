/**
 * Formats an ISO 8601 date string (YYYY-MM-DD) as "MMM D, YYYY".
 * Uses timeZone: 'UTC' to avoid local-timezone day-shift issues.
 */
export function formatDate(dateStr: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return formatter.format(new Date(dateStr));
}

/**
 * Returns true if the date represented by dateStr falls within the inclusive
 * range [today, today + days days] in local calendar time.
 */
export function isWithinNextDays(dateStr: string, days: number): boolean {
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const endOfRange = new Date(startOfToday);
  endOfRange.setDate(startOfToday.getDate() + days);

  // Parse the ISO date string as a local midnight date to avoid UTC shift
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);

  return target >= startOfToday && target <= endOfRange;
}
