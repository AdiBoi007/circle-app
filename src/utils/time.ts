/**
 * Time-of-day helpers used for greetings and light contextual copy.
 */

export type PartOfDay = 'morning' | 'afternoon' | 'evening';

export function getPartOfDay(date: Date = new Date()): PartOfDay {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

export function getGreeting(name: string, date: Date = new Date()): string {
  const part = getPartOfDay(date);
  return `Good ${part}, ${name}`;
}

/** Human month label, e.g. "July". */
export function getMonthName(date: Date = new Date()): string {
  return date.toLocaleDateString(undefined, { month: 'long' });
}
