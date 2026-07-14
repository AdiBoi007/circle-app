import type { Feather } from '@expo/vector-icons';

import type { AccentName, PastelName } from '@/theme';

export type FeatherIconName = keyof typeof Feather.glyphMap;
export type MemberId = 'arjun' | 'rajiv' | 'neha' | 'savita';
export type DemoAccountId = 'arjun' | 'savita';

export interface PersonalAccountPreferences {
  largerText: boolean;
  readAloud: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  medicineNotifications: boolean;
  appointmentNotifications: boolean;
  careNotifications: boolean;
}
export type MetricKind =
  | 'steps' | 'sleep' | 'resting-heart-rate' | 'weight' | 'blood-pressure'
  | 'fasting-glucose' | 'hba1c' | 'tsh' | 'ldl' | 'vitamin-d'
  | 'knee-pain' | 'mobility-sessions' | 'medication-adherence';

export interface FamilyMember {
  id: MemberId;
  name: string;
  relation: string;
  age: number;
  location: string;
  role?: string;
  status: string;
  conditions: string[];
  allergies: string[];
  accent: AccentName;
}

export interface Metric {
  kind: MetricKind;
  label: string;
  value: string;
  previous: string;
  change: string;
  caption: string;
  source: string;
  updated: string;
  note: string;
  icon: FeatherIconName;
  pastel: PastelName;
  history: { label: string; value: number; display: string }[];
}

export interface MemberPulse { memberId: MemberId; metrics: Metric[] }

export interface TodayItem {
  id: string;
  title: string;
  memberId: MemberId;
  who: string;
  time: string;
  date: string;
  note?: string;
  icon: FeatherIconName;
  accent: AccentName;
  completed: boolean;
}

export type FamilyLogCategory = 'Medication' | 'Symptom' | 'Metric' | 'Task completion' | 'Note';

export interface FamilyLog {
  id: string;
  memberId: MemberId;
  category: FamilyLogCategory;
  text: string;
  time: string;
}

export interface Goal {
  id: string;
  memberId?: MemberId;
  title: string;
  current: number;
  target: number;
  unit: string;
  caption: string;
  accent: AccentName;
  active: boolean;
}

export interface CareCategory { id: string; label: string; icon: FeatherIconName }
export type CareMode = 'Online' | 'In person' | 'Home visit';

export interface CareProfessional {
  id: string;
  name: string;
  category: string;
  title: string;
  location: string;
  timezone: string;
  modes: CareMode[];
  languages: string[];
  qualifications: string[];
  verified: boolean;
  jurisdictions: string[];
  specialisations: string[];
  ageGroups: string[];
  experience: number;
  rating: number;
  reviewCount: number;
  price: number;
  currency: '₹' | 'A$';
  priceSuffix?: string;
  nextSlot: string;
  bio: string;
  services: string[];
  packages: string[];
  availability: string[];
  reviews: { name: string; rating: number; text: string }[];
  cancellation: string;
  matchScore: number;
  recommendedFor: MemberId[];
  why: string;
  accent: AccentName;
  icon: FeatherIconName;
}

export interface HealthRecord {
  id: string;
  memberId: MemberId;
  title: string;
  date: string;
  category: 'Lab report' | 'Prescription' | 'Consultation' | 'Imaging' | 'Vaccination';
  status: 'Ready' | 'Processing';
  note: string;
  values: { label: string; value: string; flag?: 'High' | 'Low' | 'Normal' }[];
  explanation: string;
  relatedId?: string;
}

export interface Medication {
  id: string;
  memberId: MemberId;
  name: string;
  dose: string;
  schedule: string;
  instructions: string;
  adherence: number;
  next: string;
  archived?: boolean;
}

export interface Booking {
  id: string;
  providerId: string;
  memberId: MemberId;
  service: string;
  date: string;
  time: string;
  mode: CareMode;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  note?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  memberId?: MemberId;
  time: string;
  group: 'Today' | 'Earlier';
  read: boolean;
  href: string;
}

export interface SuggestedPrompt { id: string; text: string; icon: FeatherIconName }
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  citations?: { title: string; recordId?: string }[];
  actions?: { label: string; href: string }[];
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  primary?: boolean;
}

export interface EmergencyProfile {
  memberId: MemberId;
  bloodType: string;
  organDonor: boolean;
  height: string;
  weight: string;
  conditions: string[];
  allergies: string[];
  medications: string[];
  notes: string;
  contacts: EmergencyContact[];
}

export interface Insight {
  id: string;
  memberId?: MemberId;
  title: string;
  summary: string;
  tone: 'attention' | 'positive' | 'steady';
  icon: FeatherIconName;
  accent: AccentName;
  metric?: { memberId: MemberId; kind: MetricKind };
  actions: { label: string; href: string }[];
}
