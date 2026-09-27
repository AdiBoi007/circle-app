import { launchMarket } from '@/config/launch';

export type IndividualBooking = {
  id: string;
  providerId: string;
  service: string;
  date: string;
  time: string;
  mode: 'Online' | 'In person';
  status: 'Confirmed' | 'Cancelled';
};

export type IndividualCategory = 'Therapy' | 'Fitness' | 'Nutrition' | 'Physio' | 'Yoga';
export type IndividualProvider = {
  id: string;
  name: string;
  portrait: string;
  title: string;
  category: IndividualCategory;
  qualification: string;
  languages: string;
  price: number;
  currency: typeof launchMarket.currency;
  duration: number;
  modes: IndividualBooking['mode'][];
  location: string;
  focus: string[];
  about: string;
  approach: string;
  slots: string[];
};

export const individualProfile = { id: 'riya', name: 'Riya Shah', firstName: 'Riya', age: 29, city: launchMarket.city, timezone: launchMarket.timeZone } as const;
export const individualCategories: IndividualCategory[] = ['Therapy', 'Fitness', 'Nutrition', 'Physio', 'Yoga'];
export const individualHabits = [
  { id: 'riya-walk', title: 'Step outside for 20 minutes', detail: 'A little movement, a little fresh air.', icon: 'sun' },
  { id: 'riya-water', title: 'Finish your second bottle of water', detail: 'Your own daily hydration goal.', icon: 'droplet' },
  { id: 'riya-unwind', title: 'Make time to wind down', detail: '10 quiet minutes before bed.', icon: 'moon' },
] as const;

export const individualProviders: IndividualProvider[] = [
  { id: 'personal-emily-chen', name: 'Emily Chen', portrait: 'emily-chen', title: 'Psychologist', category: 'Therapy', qualification: 'Master of Clinical Psychology', languages: 'English, Hindi, Mandarin', price: 1500, currency: launchMarket.currency, duration: 50, modes: ['Online', 'In person'], location: `Sector 9, ${launchMarket.city}`, focus: ['Stress & burnout', 'Life changes'], about: 'A warm, collaborative space to talk through what is taking up room in your life. Emily’s sample practice focuses on work stress, change, and finding steadier routines.', approach: 'An introductory conversation about what brings you here, what you would like to work on, and whether the approach feels right for you.', slots: ['09:00', '12:30', '17:00'] },
  { id: 'personal-liam-walker', name: 'Liam Walker', portrait: 'liam-walker', title: 'Personal trainer', category: 'Fitness', qualification: 'Certified personal trainer', languages: 'English', price: 800, currency: launchMarket.currency, duration: 45, modes: ['Online', 'In person'], location: `Sector 8, ${launchMarket.city}`, focus: ['Strength for beginners', 'Sustainable routines'], about: 'Approachable strength training built around your starting point and your week. This sample profile is for people who want to feel more confident moving.', approach: 'Talk about your goals, equipment and experience, then explore a manageable training plan. You can ask questions before committing to a routine.', slots: ['07:00', '12:00', '18:00'] },
  { id: 'personal-claire-wong', name: 'Claire Wong', portrait: 'claire-wong', title: 'Dietitian', category: 'Nutrition', qualification: 'Master of Nutrition and Dietetics', languages: 'English, Hindi, Punjabi', price: 1000, currency: launchMarket.currency, duration: 45, modes: ['Online', 'In person'], location: `Sector 17, ${launchMarket.city}`, focus: ['Everyday nutrition', 'Busy schedules'], about: 'Practical food support that makes room for your culture, preferences and schedule. Claire’s sample practice focuses on everyday nourishment without rigid rules.', approach: 'Discuss your usual week, what is working and what feels difficult. Bring your questions; no meal diary is required for this mock introduction.', slots: ['10:00', '14:00', '16:30'] },
  { id: 'personal-daniel-lee', name: 'Daniel Lee', portrait: 'daniel-lee', title: 'Physiotherapist', category: 'Physio', qualification: 'Master of Physiotherapy', languages: 'English, Hindi, Korean', price: 900, currency: launchMarket.currency, duration: 45, modes: ['In person'], location: `Sector 22, ${launchMarket.city}`, focus: ['Desk-related discomfort', 'Movement confidence'], about: 'A sample physiotherapy practice focused on understanding how you move and what you would like to get back to doing.', approach: 'An initial discussion and movement assessment. Any treatment or exercises would be agreed with a qualified clinician in a real consultation.', slots: ['08:30', '11:00', '15:00'] },
  { id: 'personal-sophie-hart', name: 'Sophie Hart', portrait: 'sophie-hart', title: 'Yoga instructor', category: 'Yoga', qualification: '500-hour yoga teacher training', languages: 'English', price: 600, currency: launchMarket.currency, duration: 50, modes: ['Online', 'In person'], location: `Sector 16, ${launchMarket.city}`, focus: ['Gentle movement', 'Beginners welcome'], about: 'Unhurried movement and breathing in a welcoming setting. Sophie’s sample classes offer options so you can move at your own pace.', approach: 'Share your experience and preferences, then try an introductory practice adapted to your comfort level.', slots: ['07:30', '12:00', '18:30'] },
  { id: 'personal-olivia-reed', name: 'Olivia Reed', portrait: 'olivia-reed', title: 'Counsellor', category: 'Therapy', qualification: 'Master of Counselling', languages: 'English', price: 1200, currency: launchMarket.currency, duration: 50, modes: ['Online'], location: `${launchMarket.city} · online practice`, focus: ['Relationships', 'Finding balance'], about: 'A supportive sample counselling practice for making sense of life transitions and everyday challenges.', approach: 'Use the first conversation to share what matters to you and ask about the practitioner’s approach, qualifications and fit.', slots: ['11:00', '15:30', '19:00'] },
];

export const individualSlotDates = ['2026-09-28', '2026-09-29', '2026-09-30'];
export const seedIndividualBookings: IndividualBooking[] = [
  { id: 'riya-intro-emily', providerId: 'personal-emily-chen', service: 'Psychology introduction', date: '2026-09-28', time: '17:00', mode: 'Online', status: 'Confirmed' },
];

export function personalDate(date: string, short = false) {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: short ? 'short' : 'long', timeZone: launchMarket.timeZone });
}

export function personalTime(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'am' : 'pm'}`;
}

export function nextPersonalBooking(bookings: IndividualBooking[]) {
  return [...bookings].filter((booking) => booking.status === 'Confirmed').sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))[0];
}

export const personalTimeZoneLabel = `${launchMarket.city} time · ${launchMarket.timeZoneLabel} (UTC${launchMarket.utcOffset})`;

export function personalPrice(amount: number) {
  return `${launchMarket.currencySymbol}${amount.toLocaleString('en-IN')}`;
}
