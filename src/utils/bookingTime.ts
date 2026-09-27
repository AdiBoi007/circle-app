import type { Booking } from '@/types';

const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** Parse a fixture calendar date without platform-dependent Date.parse. Invalid dates return 0. */
export function fixtureDateValue(date: string): number {
  const match = /^(\d{1,2})\s+([a-z]+)\s+(\d{4})$/i.exec(date.trim());
  if (!match) return 0;
  const day = Number(match[1]);
  const month = months.findIndex((name) => name === match[2].toLowerCase() || name.slice(0, 3) === match[2].toLowerCase());
  const year = Number(match[3]);
  if (month < 0 || day < 1 || year < 1000) return 0;
  const value = Date.UTC(year, month, day);
  const parsed = new Date(value);
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month && parsed.getUTCDate() === day ? value : 0;
}

/**
 * Sort the family's display-date fixtures by local calendar date and clock time.
 * This is a wall-clock sort key, not a timezone conversion or a real appointment timestamp.
 * Invalid values sort after valid appointments.
 */
export function bookingTimeValue(booking: Pick<Booking, 'date' | 'time'>): number {
  const date = fixtureDateValue(booking.date);
  const match = /^(\d{1,2}):(\d{2})\s*([ap]m)?$/i.exec(booking.time.trim());
  if (!date || !match) return Number.MAX_SAFE_INTEGER;
  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = match[3]?.toLowerCase();
  if (minute > 59 || (meridiem ? hour < 1 || hour > 12 : hour > 23)) return Number.MAX_SAFE_INTEGER;
  if (meridiem) hour = hour % 12 + (meridiem === 'pm' ? 12 : 0);
  return date + (hour * 60 + minute) * 60_000;
}
