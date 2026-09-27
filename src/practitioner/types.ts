import type { CareMode, DemoAccountId, MemberId } from '@/types';

export type PracticeCategory = 'Physiotherapy' | 'Therapy' | 'Fitness' | 'Nutrition' | 'Yoga';
export type ClientAccountId = 'arjun' | 'savita' | 'riya';
export type PracticeProfile = {
  name: string;
  title: string;
  category: PracticeCategory;
  bio: string;
  qualification: string;
  languages: string[];
  address: string;
  email: string;
  phone: string;
  acceptingRequests: boolean;
};
export type PracticeService = {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceInr: number;
  modes: CareMode[];
  active: boolean;
};
/** Weekday follows JS: Sunday=0. Times are HH:mm in Asia/Kolkata. */
export type PracticeHours = { day: number; enabled: boolean; start: string; end: string };
export type PracticeRequestStatus = 'Requested' | 'Confirmed' | 'Declined' | 'Cancelled' | 'Completed';
export type PracticeRequestEvent = { status: PracticeRequestStatus; actor: string; at: string; note?: string };
export type PracticeRequest = {
  id: string;
  clientAccountId: ClientAccountId;
  recipientId: MemberId | 'riya';
  recipientName: string;
  requesterName: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  priceInr: number;
  mode: CareMode;
  date: string;
  time: string;
  note: string;
  status: PracticeRequestStatus;
  sessionDetails: string;
  reason?: string;
  createdAt: string;
  events: PracticeRequestEvent[];
};
export type PracticeSnapshot = {
  profile: PracticeProfile;
  services: PracticeService[];
  hours: PracticeHours[];
  blockedDates: string[];
  requests: PracticeRequest[];
};
export type PracticeResult = { ok: true; id?: string } | { ok: false; error: string };
export type PracticeRequestInput = {
  serviceId: string;
  recipientId: MemberId | 'riya';
  mode: CareMode;
  date: string;
  time: string;
  note: string;
};
export type PracticeStore = {
  practice: PracticeSnapshot;
  savePracticeProfile: (profile: PracticeProfile) => PracticeResult;
  savePracticeService: (service: PracticeService) => PracticeResult;
  removePracticeService: (id: string) => PracticeResult;
  savePracticeHours: (hours: PracticeHours[]) => PracticeResult;
  togglePracticeBlockedDate: (date: string) => PracticeResult;
  requestPracticeAppointment: (input: PracticeRequestInput) => PracticeResult;
  confirmPracticeRequest: (id: string, sessionDetails: string) => PracticeResult;
  declinePracticeRequest: (id: string, reason: string) => PracticeResult;
  cancelPracticeRequest: (id: string, reason: string) => PracticeResult;
  completePracticeRequest: (id: string) => PracticeResult;
  resetPractice: () => void;
};

export type PracticeActor = DemoAccountId;
