import type { PracticeRequest, PracticeSnapshot } from './types';

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Calendar dates are civil dates, so device timezone and daylight saving never enter the calculation. */
function calendarDate(date: string): Date {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!parts) throw new RangeError('Use a calendar date in YYYY-MM-DD format.');
  const [, year, month, day] = parts.map(Number);
  const value = new Date(0);
  value.setUTCFullYear(year, month - 1, day);
  value.setUTCHours(0, 0, 0, 0);
  if (value.getUTCFullYear() !== year || value.getUTCMonth() !== month - 1 || value.getUTCDate() !== day) {
    throw new RangeError('Use a valid calendar date.');
  }
  return value;
}

function calendarISO(date: Date): string {
  if (!Number.isFinite(date.getTime()) || date.getUTCFullYear() < 0 || date.getUTCFullYear() > 9999) {
    throw new RangeError('Calendar date is outside the supported range.');
  }
  return date.toISOString().slice(0, 10);
}

export function addCalendarDays(date: string, amount: number): string {
  if (!Number.isInteger(amount)) throw new RangeError('Add a whole number of calendar days.');
  const value = calendarDate(date);
  value.setUTCDate(value.getUTCDate() + amount);
  return calendarISO(value);
}

/** Sunday=0, Monday=1, matching PracticeHours.day. */
export function calendarWeekday(date: string): number {
  return calendarDate(date).getUTCDay();
}

export function startOfCalendarWeek(date: string): string {
  return addCalendarDays(date, -((calendarWeekday(date) + 6) % 7));
}

export function calendarMonthDays(date: string): string[] {
  const value = calendarDate(date);
  value.setUTCDate(1);
  const start = startOfCalendarWeek(calendarISO(value));
  return Array.from({ length: 42 }, (_, index) => addCalendarDays(start, index));
}

export function calendarMonthLabel(date: string): string {
  const value = calendarDate(date);
  return `${months[value.getUTCMonth()]} ${value.getUTCFullYear()}`;
}

export function calendarDayLabel(date: string): string {
  const value = calendarDate(date);
  return `${weekdays[value.getUTCDay()]}, ${value.getUTCDate()} ${months[value.getUTCMonth()]}`;
}

/** Minutes since midnight; invalid or incomplete HH:mm values return NaN. */
export function calendarMinutes(time: string): number {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return Number.NaN;
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export function scheduleRequests(practice: PracticeSnapshot, date: string): PracticeRequest[] {
  return practice.requests.filter((request) => request.date === date && (request.status === 'Requested' || request.status === 'Confirmed' || request.status === 'Completed'))
    .sort((a, b) => a.time.localeCompare(b.time) || b.durationMinutes - a.durationMinutes || a.id.localeCompare(b.id));
}

export type CalendarEventLayout = {
  request: PracticeRequest;
  column: number;
  columns: number;
  startMinutes: number;
  endMinutes: number;
};

/** Each connected overlap group shares a lane count. Touching intervals can reuse a lane. */
export function layoutCalendarEvents(requests: readonly PracticeRequest[]): CalendarEventLayout[] {
  const events = requests.map((request) => {
    const startMinutes = calendarMinutes(request.time);
    return { request, startMinutes, endMinutes: startMinutes + request.durationMinutes, column: 0, columns: 1 };
  }).filter((event) => Number.isFinite(event.startMinutes) && Number.isInteger(event.request.durationMinutes) && event.request.durationMinutes > 0)
    .sort((a, b) => a.request.date.localeCompare(b.request.date) || a.startMinutes - b.startMinutes || b.endMinutes - a.endMinutes || a.request.id.localeCompare(b.request.id));

  let group: CalendarEventLayout[] = [];
  let laneEnds: number[] = [];
  let groupEnd = -1;
  let groupDate = '';
  function finishGroup() {
    for (const event of group) event.columns = laneEnds.length;
    group = []; laneEnds = []; groupEnd = -1;
  }
  for (const event of events) {
    if (event.request.date !== groupDate || event.startMinutes >= groupEnd) finishGroup();
    groupDate = event.request.date;
    let column = laneEnds.findIndex((end) => end <= event.startMinutes);
    if (column === -1) column = laneEnds.length;
    laneEnds[column] = event.endMinutes;
    event.column = column;
    group.push(event);
    groupEnd = Math.max(groupEnd, event.endMinutes);
  }
  finishGroup();
  return events;
}

/** Show 08:00–18:00 by default, expanding to include the visible days' hours and visits. */
export function calendarBounds(practice: PracticeSnapshot, dates: readonly string[]): { startHour: number; endHour: number } {
  let startMinutes = 8 * 60;
  let endMinutes = 18 * 60;
  for (const date of new Set(dates)) {
    const hours = practice.hours.find((item) => item.day === calendarWeekday(date) && item.enabled);
    if (hours) {
      const start = calendarMinutes(hours.start);
      const end = calendarMinutes(hours.end);
      if (Number.isFinite(start) && Number.isFinite(end) && start < end) {
        startMinutes = Math.min(startMinutes, start);
        endMinutes = Math.max(endMinutes, end);
      }
    }
    for (const event of layoutCalendarEvents(scheduleRequests(practice, date))) {
      startMinutes = Math.min(startMinutes, event.startMinutes);
      endMinutes = Math.max(endMinutes, event.endMinutes);
    }
  }
  return { startHour: Math.max(0, Math.floor(startMinutes / 60)), endHour: Math.min(24, Math.ceil(endMinutes / 60)) };
}
