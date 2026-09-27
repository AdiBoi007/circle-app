// Wire contracts shared by the API and client. Keep this module independent of UI libraries.
export type CareMode = "Online" | "In person" | "Home visit";
export type PracticeCategory = "Physiotherapy" | "Therapy" | "Fitness" | "Nutrition" | "Yoga";
/** Weekday follows JS: Sunday=0. Times are HH:mm in Asia/Kolkata. */
export type PracticeHours = { day: number; enabled: boolean; start: string; end: string };
export type PracticeRequestStatus = "Requested" | "Confirmed" | "Declined" | "Cancelled" | "Completed";

export type LiveRole = "client" | "practitioner" | "operator";
export type LiveProfile = {
  id: string;
  name: string;
  email: string;
  role: LiveRole;
  viewPreference: "standard" | "simple";
};
export type LivePractice = {
  id: string;
  ownerId: string;
  name: string;
  title: string;
  category: PracticeCategory;
  bio: string;
  qualification: string;
  languages: string[];
  address: string;
  contactEmail: string;
  phone: string;
  acceptingRequests: boolean;
  status: "Pending" | "Approved" | "Suspended";
  reviewNote?: string;
  hours: PracticeHours[];
  blockedDates: string[];
};
export type LiveService = {
  id: string;
  practiceId: string;
  name: string;
  description: string;
  durationMinutes: number;
  priceInr: number;
  modes: CareMode[];
  active: boolean;
};
export type LiveBooking = {
  id: string;
  practiceId: string;
  practitionerName: string;
  requesterId: string;
  requesterName: string;
  attendeeId: string;
  attendeeName: string;
  serviceId: string;
  serviceName: string;
  durationMinutes: number;
  priceInr: number;
  mode: CareMode;
  date: string;
  time: string;
  startsAt: string;
  endsAt: string;
  status: PracticeRequestStatus;
  note: string;
  sessionDetails: string;
  reason?: string;
  createdAt: string;
  followUp?: { text: string; dueDate: string; completedAt: string | null };
  events: {
    status: PracticeRequestStatus;
    actorName: string;
    at: string;
    note?: string;
  }[];
};
export type LiveFamilyLink = {
  id: string;
  organiserId: string;
  organiserName: string;
  memberId: string;
  memberName: string;
  status: "Active" | "Revoked";
};
export type LiveNotification = {
  id: string;
  title: string;
  body: string;
  bookingId: string | null;
  readAt: string | null;
  createdAt: string;
};
export type LiveInvitation = {
  id: string;
  email: string;
  role: "client" | "practitioner";
  purpose: "beta" | "family";
  status: "Pending" | "Accepted" | "Revoked" | "Expired";
  expiresAt: string;
  createdAt: string;
};
export type LiveDelivery = {
  id: string;
  recipient: string;
  kind: string;
  status: "Pending" | "Sent" | "Failed";
  attempts: number;
  lastError: string | null;
  createdAt: string;
};
export type LiveAudit = {
  id: string;
  actorName: string;
  action: string;
  targetId: string | null;
  reason: string;
  createdAt: string;
};
export type LiveBootstrap = {
  serverTime: string;
  profile: LiveProfile;
  practices: LivePractice[];
  services: LiveService[];
  bookings: LiveBooking[];
  familyLinks: LiveFamilyLink[];
  notifications: LiveNotification[];
  invitations: LiveInvitation[];
  operator?: { deliveries: LiveDelivery[]; audit: LiveAudit[] };
};
export type LiveInvitationPreview = {
  email: string;
  role: LiveRole;
  purpose: "beta" | "family";
  inviterName: string;
  expiresAt: string;
  consentText: string;
};
export type LiveSlots = {
  date: string;
  times: string[];
  timeZone: "Asia/Kolkata";
};
export type LiveBookingInput = {
  serviceId: string;
  attendeeId: string;
  date: string;
  time: string;
  mode: CareMode;
  note: string;
  expectedPriceInr: number;
  expectedDurationMinutes: number;
  idempotencyKey: string;
};
export type LivePracticeInput = Omit<
  LivePractice,
  "id" | "ownerId" | "status" | "reviewNote" | "hours" | "blockedDates"
>;
export type LiveServiceInput = Omit<LiveService, "id" | "practiceId"> & {
  id?: string;
};
