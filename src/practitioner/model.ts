import { launchMarket } from '@/config/launch';
import { family } from '@/data/family';
import type { CareMode } from '@/types';
import type { PracticeActor, PracticeHours, PracticeProfile, PracticeRequest, PracticeRequestInput, PracticeResult, PracticeService, PracticeSnapshot } from './types';

export const practiceDemoDate = '2026-09-25';
export const practiceDemoNow = '2026-09-25T09:00:00+05:30';
export const practiceCategories = ['Physiotherapy', 'Therapy', 'Fitness', 'Nutrition', 'Yoga'] as const;
export const practiceModes: CareMode[] = ['Online', 'In person', 'Home visit'];

export function practicePrice(amount: number) { return `₹${amount.toLocaleString('en-IN')}`; }
export function practiceDateLabel(date: string) {
  if (!validDate(date)) return date;
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', timeZone: launchMarket.timeZone });
}
export function practiceTimeLabel(time: string) {
  const value = minutes(time);
  if (value === null) return time;
  const hour = Math.floor(value / 60);
  return `${hour % 12 || 12}:${String(value % 60).padStart(2, '0')} ${hour < 12 ? 'am' : 'pm'}`;
}
export function validDate(date: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && Number.isFinite(Date.parse(`${date}T12:00:00Z`)) && new Date(`${date}T12:00:00Z`).toISOString().slice(0, 10) === date;
}
function minutes(time: string): number | null {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}
function timeString(value: number) { return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`; }
export function practiceRequestStart(request: Pick<PracticeRequest, 'date' | 'time'>) {
  return validDate(request.date) && minutes(request.time) !== null ? Date.parse(`${request.date}T${request.time}:00+05:30`) : Number.NaN;
}
export function practiceRequestEnd(request: Pick<PracticeRequest, 'date' | 'time' | 'durationMinutes'>) {
  return Number.isInteger(request.durationMinutes) && request.durationMinutes > 0 ? practiceRequestStart(request) + request.durationMinutes * 60_000 : Number.NaN;
}
export function practiceRequestHasEnded(request: Pick<PracticeRequest, 'date' | 'time' | 'durationMinutes'>) {
  const end = practiceRequestEnd(request);
  return Number.isFinite(end) && end <= Date.parse(practiceDemoNow);
}
function isFuture(date: string, time: string) { return practiceRequestStart({ date, time }) > Date.parse(practiceDemoNow); }
function fitsHours(state: PracticeSnapshot, date: string, time: string, duration: number) {
  const start = minutes(time);
  if (!validDate(date) || start === null || state.blockedDates.includes(date)) return false;
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  const hours = state.hours.find((item) => item.day === day);
  if (!hours?.enabled) return false;
  const open = minutes(hours.start); const close = minutes(hours.end);
  return open !== null && close !== null && start >= open && start + duration <= close;
}
function hasConflict(state: PracticeSnapshot, date: string, time: string, duration: number, exceptId?: string) {
  const start = minutes(time)!;
  return state.requests.some((item) => item.id !== exceptId && item.status === 'Confirmed' && item.date === date && start < minutes(item.time)! + item.durationMinutes && start + duration > minutes(item.time)!);
}
export function availablePracticeSlots(state: PracticeSnapshot, serviceId: string, date: string, mode: CareMode): string[] {
  const service = state.services.find((item) => item.id === serviceId && item.active && item.modes.includes(mode));
  if (!state.profile.acceptingRequests || !service || !validDate(date) || date < practiceDemoDate || state.blockedDates.includes(date)) return [];
  const hours = state.hours.find((item) => item.day === new Date(`${date}T12:00:00Z`).getUTCDay() && item.enabled);
  if (!hours || minutes(hours.start) === null || minutes(hours.end) === null) return [];
  const slots: string[] = [];
  for (let start = minutes(hours.start)!; start + service.durationMinutes <= minutes(hours.end)!; start += 30) {
    const time = timeString(start);
    if (isFuture(date, time) && !hasConflict(state, date, time, service.durationMinutes)) slots.push(time);
  }
  return slots;
}
function profileError(profile: PracticeProfile): string | undefined {
  if (profile.name.trim().length < 2 || profile.name.length > 80) return 'Enter a name between 2 and 80 characters.';
  if (!practiceCategories.includes(profile.category)) return 'Choose a professional category.';
  if (profile.title.trim().length < 3 || profile.title.length > 100) return 'Enter your professional title (3–100 characters).';
  if (profile.bio.trim().length < 30 || profile.bio.length > 1200) return 'Add a short introduction between 30 and 1,200 characters.';
  if (profile.qualification.trim().length < 3 || profile.qualification.length > 200) return 'Enter your qualification or training (3–200 characters).';
  if (!profile.languages.length || profile.languages.some((language) => !language.trim() || language.length > 40)) return 'Add at least one language.';
  if (profile.address.trim().length < 5 || profile.address.length > 200 || !profile.address.toLowerCase().includes('chandigarh')) return 'Enter a practice address in Chandigarh.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim()) || profile.email.length > 160) return 'Enter a valid contact email.';
  if (profile.phone.trim() && !/^\+?[\d\s()-]{10,20}$/.test(profile.phone.trim())) return 'Enter a valid phone number or leave it blank for this demo.';
}
function serviceError(service: PracticeService): string | undefined {
  if (service.name.trim().length < 3 || service.name.length > 100) return 'Enter a service name between 3 and 100 characters.';
  if (service.description.length > 600) return 'Keep the service description under 600 characters.';
  if (!Number.isInteger(service.durationMinutes) || service.durationMinutes < 15 || service.durationMinutes > 180) return 'Set a whole-number duration between 15 and 180 minutes.';
  if (!Number.isInteger(service.priceInr) || service.priceInr < 1 || service.priceInr > 100000) return 'Set a whole-rupee price between ₹1 and ₹1,00,000.';
  if (!service.modes.length || service.modes.some((mode) => !practiceModes.includes(mode))) return 'Choose at least one supported consultation format.';
}
export function practiceSetupIssues(state: PracticeSnapshot): string[] {
  const issues: string[] = [];
  if (profileError(state.profile)) issues.push('Complete your practice profile');
  if (!state.services.some((service) => service.active && !serviceError(service))) issues.push('Add an active service');
  if (!state.hours.some((day) => day.enabled)) issues.push('Set your weekly availability');
  return issues;
}

const seedProfile: PracticeProfile = {
  name: 'Arvind Nair', title: 'Physiotherapist', category: 'Physiotherapy',
  bio: 'Practical, gentle physiotherapy for everyday movement, recovery and confidence. This sample practice supports adults and older family members in Chandigarh.',
  qualification: 'Master of Physiotherapy — sample qualification', languages: ['English', 'Hindi', 'Punjabi'],
  address: 'Sample practice, Sector 22, Chandigarh', email: 'arvind@example.com', phone: '', acceptingRequests: true,
};
const seedServices: PracticeService[] = [
  { id: 'practice-assessment', name: 'Physiotherapy assessment', description: 'A first conversation and movement assessment to plan your next steps.', durationMinutes: 45, priceInr: 900, modes: ['In person', 'Online'], active: true },
  { id: 'practice-followup', name: 'Follow-up session', description: 'Review progress and practise your agreed exercises.', durationMinutes: 30, priceInr: 600, modes: ['In person', 'Online'], active: true },
  { id: 'practice-home', name: 'Home physiotherapy', description: 'A sample home visit within Chandigarh.', durationMinutes: 60, priceInr: 1400, modes: ['Home visit'], active: true },
];
function seedRequest(id: string, clientAccountId: 'arjun' | 'savita' | 'riya', recipientId: PracticeRequest['recipientId'], serviceIndex: number, date: string, time: string, mode: CareMode, status: PracticeRequest['status'], note: string): PracticeRequest {
  const service = seedServices[serviceIndex];
  const recipientName = recipientId === 'riya' ? 'Riya Shah' : family.find((person) => person.id === recipientId)!.name;
  const requesterName = clientAccountId === 'riya' ? 'Riya Shah' : family.find((person) => person.id === clientAccountId)!.name;
  const createdAt = '2026-09-24T10:00:00+05:30';
  return { id, clientAccountId, recipientId, recipientName, requesterName, serviceId: service.id, serviceName: service.name, durationMinutes: service.durationMinutes, priceInr: service.priceInr, mode, date, time, note, status, sessionDetails: status === 'Confirmed' ? seedProfile.address : '', createdAt, events: [{ status: 'Requested', actor: requesterName, at: createdAt }, ...(status !== 'Requested' ? [{ status, actor: seedProfile.name, at: '2026-09-24T11:00:00+05:30' }] : [])] };
}
export function initialPractice(): PracticeSnapshot {
  return {
    profile: { ...seedProfile, languages: [...seedProfile.languages] },
    services: seedServices.map((service) => ({ ...service, modes: [...service.modes] })),
    hours: Array.from({ length: 7 }, (_, day) => ({ day, enabled: day >= 1 && day <= 6, start: '09:00', end: day === 6 ? '13:00' : '17:00' })),
    blockedDates: [],
    requests: [
      seedRequest('practice-riya-request', 'riya', 'riya', 0, '2026-09-28', '10:00', 'In person', 'Requested', 'I would like to discuss staying comfortable while working at a desk.'),
      seedRequest('practice-savita-request', 'arjun', 'savita', 2, '2026-09-28', '14:00', 'Home visit', 'Requested', 'A gentle introduction to movement at home. Address can be agreed when the visit is confirmed.'),
      seedRequest('practice-rajiv-request', 'arjun', 'rajiv', 1, '2026-09-29', '11:00', 'Online', 'Requested', 'A short follow-up to discuss my exercise routine.'),
      seedRequest('practice-today', 'savita', 'savita', 1, practiceDemoDate, '11:00', 'In person', 'Confirmed', 'Follow-up visit at the sample practice.'),
    ],
  };
}

export type PracticeAction =
  | { type: 'profile'; profile: PracticeProfile }
  | { type: 'service'; service: PracticeService }
  | { type: 'remove-service'; id: string }
  | { type: 'hours'; hours: PracticeHours[] }
  | { type: 'blocked-date'; date: string }
  | { type: 'request'; input: PracticeRequestInput; id: string }
  | { type: 'confirm'; id: string; sessionDetails: string }
  | { type: 'decline' | 'cancel'; id: string; reason: string }
  | { type: 'complete'; id: string };
type Transition = { state: PracticeSnapshot; result: PracticeResult };

/** Deterministic domain transitions for the demo. This is not server authorization. */
export function applyPracticeAction(state: PracticeSnapshot, actor: PracticeActor, action: PracticeAction, at = practiceDemoNow): Transition {
  const fail = (error: string): Transition => ({ state, result: { ok: false, error } });
  const done = (next: PracticeSnapshot, id?: string): Transition => ({ state: next, result: { ok: true, ...(id ? { id } : {}) } });
  if (action.type !== 'request' && action.type !== 'cancel' && actor !== 'practitioner') return fail('Switch to the practitioner workspace to make this change.');
  if (action.type === 'profile') {
    const error = profileError(action.profile); if (error) return fail(error);
    const profile = { ...action.profile, name: action.profile.name.trim(), title: action.profile.title.trim(), bio: action.profile.bio.trim(), qualification: action.profile.qualification.trim(), address: action.profile.address.trim(), email: action.profile.email.trim(), phone: action.profile.phone.trim(), languages: [...new Set(action.profile.languages.map((language) => language.trim()))] };
    return done({ ...state, profile });
  }
  if (action.type === 'service') {
    const error = serviceError(action.service); if (error) return fail(error);
    const service = { ...action.service, id: action.service.id.trim(), name: action.service.name.trim(), description: action.service.description.trim(), modes: [...new Set(action.service.modes)] };
    if (!service.id || service.id.length > 100) return fail('This service needs a valid identifier.');
    const existing = state.services.some((item) => item.id === service.id);
    return done({ ...state, services: existing ? state.services.map((item) => item.id === service.id ? service : item) : [...state.services, service] }, service.id);
  }
  if (action.type === 'remove-service') {
    if (!state.services.some((item) => item.id === action.id)) return fail('This service no longer exists.');
    if (state.requests.some((item) => item.serviceId === action.id && (item.status === 'Requested' || item.status === 'Confirmed'))) return fail('This service has open appointments. Pause it to stop new requests, or resolve those appointments before removing it.');
    return done({ ...state, services: state.services.filter((item) => item.id !== action.id) });
  }
  if (action.type === 'hours') {
    if (action.hours.length !== 7 || new Set(action.hours.map((item) => item.day)).size !== 7 || action.hours.some((item) => !Number.isInteger(item.day) || item.day < 0 || item.day > 6)) return fail('Set availability for all seven days.');
    if (action.hours.some((item) => minutes(item.start) === null || minutes(item.end) === null || (item.enabled && minutes(item.start)! >= minutes(item.end)!))) return fail('Use valid HH:mm times, with closing time after opening time.');
    const next = { ...state, hours: action.hours.map((item) => ({ ...item })) };
    if (state.requests.some((item) => item.status === 'Confirmed' && !practiceRequestHasEnded(item) && !fitsHours(next, item.date, item.time, item.durationMinutes))) return fail('These hours would exclude a confirmed appointment. Keep that time available or cancel the appointment first.');
    return done(next);
  }
  if (action.type === 'blocked-date') {
    if (!validDate(action.date) || action.date < practiceDemoDate) return fail('Choose a valid date on or after 25 September 2026, the demo date.');
    if (state.blockedDates.includes(action.date)) return done({ ...state, blockedDates: state.blockedDates.filter((date) => date !== action.date) });
    if (state.requests.some((item) => item.date === action.date && item.status === 'Confirmed' && !practiceRequestHasEnded(item))) return fail('This date has a confirmed appointment. Cancel it before closing the date.');
    return done({ ...state, blockedDates: [...state.blockedDates, action.date].sort() });
  }
  if (action.type === 'request') {
    if (actor !== 'arjun' && actor !== 'savita' && actor !== 'riya') return fail('Use a personal or family profile to request an appointment.');
    const input = action.input;
    const recipientAllowed = actor === 'riya' ? input.recipientId === 'riya' : actor === 'savita' ? input.recipientId === 'savita' : family.some((person) => person.id === input.recipientId);
    if (!recipientAllowed) return fail('This recipient is not available from your current demo profile.');
    if (!state.profile.acceptingRequests) return fail('This practitioner has paused new requests.');
    if (input.note.length > 1000) return fail('Keep your note under 1,000 characters.');
    const service = state.services.find((item) => item.id === input.serviceId && item.active);
    if (!service || !service.modes.includes(input.mode)) return fail('This service or visit format is no longer available.');
    const duplicate = state.requests.find((item) => item.clientAccountId === actor && item.recipientId === input.recipientId && item.serviceId === input.serviceId && item.date === input.date && item.time === input.time && (item.status === 'Requested' || item.status === 'Confirmed'));
    if (duplicate) {
      if (duplicate.mode !== input.mode) return fail(`You already have a ${duplicate.mode.toLowerCase()} request for this service and time. Cancel it before choosing a different format.`);
      return done(state, duplicate.id);
    }
    if (!availablePracticeSlots(state, service.id, input.date, input.mode).includes(input.time)) return fail('That time is no longer available. Choose another time.');
    if (!action.id || state.requests.some((item) => item.id === action.id)) return fail('Could not create a unique request. Please try again.');
    const recipientName = input.recipientId === 'riya' ? 'Riya Shah' : family.find((person) => person.id === input.recipientId)!.name;
    const requesterName = actor === 'riya' ? 'Riya Shah' : family.find((person) => person.id === actor)!.name;
    const request: PracticeRequest = { ...input, note: input.note.trim(), id: action.id, clientAccountId: actor, recipientName, requesterName, serviceName: service.name, durationMinutes: service.durationMinutes, priceInr: service.priceInr, status: 'Requested', sessionDetails: '', createdAt: at, events: [{ status: 'Requested', actor: requesterName, at }] };
    return done({ ...state, requests: [request, ...state.requests] }, request.id);
  }
  const request = state.requests.find((item) => item.id === action.id);
  if (!request) return fail('This request could not be found.');
  let status: PracticeRequest['status']; let reason: string | undefined; let sessionDetails = request.sessionDetails;
  if (action.type === 'confirm') {
    if (request.status !== 'Requested') return fail('Only a pending request can be confirmed.');
    if (!isFuture(request.date, request.time)) return fail('The requested time has passed in this demo. Decline it and arrange a new request.');
    if (!fitsHours(state, request.date, request.time, request.durationMinutes)) return fail('This time is outside your availability. Update your hours or decline the request.');
    if (hasConflict(state, request.date, request.time, request.durationMinutes, request.id)) return fail('This overlaps a confirmed appointment. Decline this request or cancel the other appointment first.');
    if (action.sessionDetails.trim().length < 5 || action.sessionDetails.length > 500) return fail('Add session details between 5 and 500 characters.');
    sessionDetails = action.sessionDetails.trim(); status = 'Confirmed';
  } else if (action.type === 'decline') {
    if (request.status !== 'Requested') return fail('Only a pending request can be declined.');
    status = 'Declined'; reason = action.reason.trim();
  } else if (action.type === 'cancel') {
    if (actor !== 'practitioner' && actor !== request.clientAccountId) return fail('You can only cancel a request made by your current profile.');
    if (request.status !== 'Requested' && request.status !== 'Confirmed') return fail('This appointment is already closed.');
    status = 'Cancelled'; reason = action.reason.trim();
  } else {
    if (request.status !== 'Confirmed') return fail('Only a confirmed appointment can be marked complete.');
    if (!practiceRequestHasEnded(request)) return fail('This appointment has not finished in the demo schedule yet.');
    status = 'Completed';
  }
  if ((status === 'Declined' || status === 'Cancelled') && (!reason || reason.length > 500)) return fail('Add a reason between 1 and 500 characters.');
  const actorName = actor === 'practitioner' ? state.profile.name : request.requesterName;
  const updated = { ...request, status, sessionDetails, reason, events: [...request.events, { status, actor: actorName, at, ...(reason ? { note: reason } : {}) }] };
  return done({ ...state, requests: state.requests.map((item) => item.id === request.id ? updated : item) }, request.id);
}
