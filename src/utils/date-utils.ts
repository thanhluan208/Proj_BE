import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Extend dayjs with timezone support
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Converts a date string or Date object to UTC based on the provided timezone.
 * If the input is already a UTC string or if no timezone is provided, it defaults to UTC.
 */
export const convertToUTC = (
  date: string | Date | undefined | null,
  userTimezone: string = 'UTC',
): Date | null => {
  if (!date) return null;

  // If it's a date string like "2024-01-01", we interpret it in the user's timezone
  // and then convert to UTC.
  // If it's strictly an ISO string with Z at the end, dayjs usually handles it as UTC.

  const formattedDate = dayjs.tz(date, userTimezone).utc();

  return formattedDate.toDate();
};

/**
 * Converts a UTC date from the database back to a specific timezone for display.
 * Returns a string in ISO format or a specific format if provided.
 */
export const convertFromUTC = (
  date: string | Date | undefined | null,
  userTimezone: string = 'UTC',
  format?: string,
): string | null => {
  if (!date) return null;

  const dayjsDate = dayjs.utc(date).tz(userTimezone);

  return format ? dayjsDate.format(format) : dayjsDate.format();
};

export default dayjs;
