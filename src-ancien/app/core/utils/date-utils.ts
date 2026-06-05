/**
 * Formats a date to YYYY-MM-DD format
 * @param date - Date object, Date string, or timestamp
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDateToISO(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Alias for formatDateToISO - formats a date to YYYY-MM-DD format
 * @param date - Date object, Date string, or timestamp
 * @returns Formatted date string in YYYY-MM-DD format
 */
export function formatDate(date: Date | string | number): string {
  return formatDateToISO(date);
}

export function dateDiffInDays(dateStr1: string, dateStr2: string): number {
  // Helper to parse YYYY-MM-DD and return a UTC timestamp.
  const toUtcTimestamp = (str: string): number => {
    const parts = str.split('-').map(Number);
    if (parts.length !== 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
      return NaN;
    }
    // Month is 0-indexed in Date.UTC, so subtract 1.
    return Date.UTC(parts[0], parts[1] - 1, parts[2]);
  };

  const timestamp1 = toUtcTimestamp(dateStr1);
  const timestamp2 = toUtcTimestamp(dateStr2);

  if (isNaN(timestamp1) || isNaN(timestamp2)) {
    console.warn('Invalid date format provided to dateDiffInDays:', { dateStr1, dateStr2 });
    return 0;
  }

  const diffTime = timestamp2 - timestamp1;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
