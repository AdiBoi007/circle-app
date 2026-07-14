import type { EmergencyProfile, Insight, MemberId } from '@/types';

import { family } from './family';
import { medications } from './records';

const medsFor = (memberId: MemberId): string[] =>
  medications
    .filter((item) => item.memberId === memberId && !item.archived && item.dose !== 'Reminder')
    .map((item) => `${item.name} · ${item.dose}`);

const conditionsFor = (memberId: MemberId): string[] => {
  const member = family.find((item) => item.id === memberId);
  return member && member.conditions.length ? member.conditions : ['No conditions recorded'];
};

const allergiesFor = (memberId: MemberId): string[] =>
  family.find((item) => item.id === memberId)?.allergies ?? ['No known allergies'];

const captain = { name: 'Arjun Mehra', relation: 'Care Captain · Son', phone: '+61 400 100 100', primary: true };
const rajiv = { name: 'Rajiv Mehra', relation: 'Father', phone: '+91 98100 20020' };
const neha = { name: 'Neha Mehra', relation: 'Mother', phone: '+91 98100 30030' };

/** Apple-Health-style Medical ID cards. Local demo data only. */
export const emergencyProfiles: Record<MemberId, EmergencyProfile> = {
  arjun: {
    memberId: 'arjun', bloodType: 'O+', organDonor: true, height: '1.78 m', weight: '72.4 kg',
    conditions: conditionsFor('arjun'), allergies: allergiesFor('arjun'), medications: medsFor('arjun'),
    notes: 'Generally healthy. Wears contact lenses. Prefers Hindi or English.',
    contacts: [neha, rajiv],
  },
  rajiv: {
    memberId: 'rajiv', bloodType: 'B+', organDonor: false, height: '1.72 m', weight: '81.2 kg',
    conditions: conditionsFor('rajiv'), allergies: allergiesFor('rajiv'), medications: medsFor('rajiv'),
    notes: 'Type 2 diabetes and hypertension. Carries glucose tablets. Speaks Hindi and English.',
    contacts: [neha, captain],
  },
  neha: {
    memberId: 'neha', bloodType: 'B+', organDonor: true, height: '1.60 m', weight: '68.6 kg',
    conditions: conditionsFor('neha'), allergies: allergiesFor('neha'), medications: medsFor('neha'),
    notes: 'Penicillin allergy — do not administer. Hypothyroidism managed with daily medicine.',
    contacts: [rajiv, captain],
  },
  savita: {
    memberId: 'savita', bloodType: 'O+', organDonor: false, height: '1.55 m', weight: '64.8 kg',
    conditions: conditionsFor('savita'), allergies: allergiesFor('savita'), medications: medsFor('savita'),
    notes: 'Reduced mobility — uses a walking aid. Prefers Hindi. Lives with Rajiv and Neha.',
    contacts: [rajiv, neha, captain],
  },
};

export function emergencyFor(memberId: string): EmergencyProfile {
  return emergencyProfiles[memberId as MemberId] ?? emergencyProfiles.arjun;
}

/** Gentle, data-grounded weekly observations for the Insights screen. */
export const insights: Insight[] = [
  {
    id: 'rajiv-glucose',
    memberId: 'rajiv',
    title: 'Rajiv’s glucose is trending higher',
    summary: 'HbA1c moved from 7.2% to 7.8% and fasting glucose is up since April. Worth reviewing supportively at his next appointment.',
    tone: 'attention',
    icon: 'trending-up',
    accent: 'amber',
    metric: { memberId: 'rajiv', kind: 'hba1c' },
    actions: [
      { label: 'View trend', href: '/metric/rajiv/hba1c' },
      { label: 'Open report', href: '/record/rajiv-diabetes-jul' },
      { label: 'Ask Circle', href: '/ai?prompt=Compare%20Dad%E2%80%99s%20latest%20glucose%20report' },
    ],
  },
  {
    id: 'savita-mobility',
    memberId: 'savita',
    title: 'Savita is moving a little more',
    summary: 'Mobility sessions reached 6 of 20 and daily steps rose to 1,650. Gentle momentum is building with the home physiotherapy plan.',
    tone: 'positive',
    icon: 'repeat',
    accent: 'sage',
    metric: { memberId: 'savita', kind: 'mobility-sessions' },
    actions: [
      { label: 'View trend', href: '/metric/savita/mobility-sessions' },
      { label: 'Savita’s profile', href: '/member/savita' },
    ],
  },
  {
    id: 'neha-sleep',
    memberId: 'neha',
    title: 'Neha’s sleep dipped this week',
    summary: 'Sleep averaged 6h 21m, about 23 minutes less than last week. A calmer evening routine may help.',
    tone: 'attention',
    icon: 'moon',
    accent: 'plum',
    metric: { memberId: 'neha', kind: 'sleep' },
    actions: [
      { label: 'View trend', href: '/metric/neha/sleep' },
      { label: 'Find sleep coach', href: '/care?category=wellness' },
    ],
  },
  {
    id: 'family-adherence',
    title: 'Medication adherence is mostly on track',
    summary: 'Neha is at 93% and Rajiv at 86% this month. Rajiv’s July goal is at least 95% — small reminders around dinner could close the gap.',
    tone: 'steady',
    icon: 'check-circle',
    accent: 'blue',
    actions: [
      { label: 'Open medications', href: '/medications' },
      { label: 'View goals', href: '/goals' },
    ],
  },
  {
    id: 'arjun-activity',
    memberId: 'arjun',
    title: 'Arjun is keeping steady',
    summary: 'Activity held around 8,420 steps with a lower resting heart rate. Sleep is a touch short — an earlier wind-down could help.',
    tone: 'positive',
    icon: 'activity',
    accent: 'blue',
    metric: { memberId: 'arjun', kind: 'steps' },
    actions: [{ label: 'View trend', href: '/metric/arjun/steps' }],
  },
  {
    id: 'savita-pain',
    memberId: 'savita',
    title: 'Savita’s knee pain eased slightly',
    summary: 'Her latest check-in is 6/10, one point below the previous reading. Keep tracking comfort alongside mobility sessions.',
    tone: 'positive',
    icon: 'trending-down',
    accent: 'sage',
    metric: { memberId: 'savita', kind: 'knee-pain' },
    actions: [
      { label: 'View pain trend', href: '/metric/savita/knee-pain' },
      { label: 'Open care plan', href: '/booking/physio-savita' },
    ],
  },
  {
    id: 'neha-thyroid-review',
    memberId: 'neha',
    title: 'Neha has a useful thyroid comparison',
    summary: 'Her March and July panels are now both in the record vault, making the TSH change easier to discuss at follow-up.',
    tone: 'steady',
    icon: 'file-text',
    accent: 'sage',
    metric: { memberId: 'neha', kind: 'tsh' },
    actions: [
      { label: 'Open July panel', href: '/record/neha-thyroid-jul' },
      { label: 'View TSH trend', href: '/metric/neha/tsh' },
    ],
  },
  {
    id: 'family-care-week',
    title: 'Four care sessions are organised',
    summary: 'Physiotherapy, yoga, nutrition and training are booked across the next week. The family calendar has the details in one place.',
    tone: 'positive',
    icon: 'calendar',
    accent: 'blue',
    actions: [
      { label: 'Open calendar', href: '/calendar' },
      { label: 'View care', href: '/care' },
    ],
  },
  {
    id: 'records-ready',
    title: 'The record vault is ready for follow-ups',
    summary: 'Lab reports, prescriptions, imaging, vaccinations and consultation notes are now organised across all four family profiles.',
    tone: 'steady',
    icon: 'archive',
    accent: 'plum',
    actions: [{ label: 'Browse records', href: '/records' }],
  },
];
