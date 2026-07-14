import type { Goal, MemberId, MetricKind, TodayItem } from '@/types';

export const todayItems: TodayItem[] = [
  { id: 'mobility', title: 'Complete mobility exercises', memberId: 'savita', who: 'Savita', time: 'Overdue', date: 'Today', icon: 'repeat', accent: 'plum', completed: false },
  { id: 'bp-evening', title: 'Log evening blood pressure', memberId: 'rajiv', who: 'Rajiv', time: '7:30 pm', date: 'Today', icon: 'activity', accent: 'amber', completed: false },
  { id: 'glucose-diary', title: 'Prepare Rajiv’s glucose diary', memberId: 'arjun', who: 'Arjun', time: 'Before Thursday', date: 'Today', icon: 'book-open', accent: 'blue', completed: false },
  { id: 'savita-evening-gel', title: 'Apply evening knee gel', memberId: 'savita', who: 'Savita', time: '8:00 pm', date: 'Today', note: 'Use only as directed on the current prescription.', icon: 'plus-circle', accent: 'plum', completed: false },
  { id: 'neha-walk', title: 'Take a gentle 20-minute walk', memberId: 'neha', who: 'Neha', time: '6:45 pm', date: 'Today', icon: 'map', accent: 'sage', completed: false },
  { id: 'rajiv-dinner-meds', title: 'Take dinner medication', memberId: 'rajiv', who: 'Rajiv', time: '8:15 pm', date: 'Today', icon: 'check-circle', accent: 'amber', completed: false },
  { id: 'arjun-sleep-winddown', title: 'Start sleep wind-down', memberId: 'arjun', who: 'Arjun', time: '10:30 pm', date: 'Today', note: 'Put the phone away and dim the lights.', icon: 'moon', accent: 'blue', completed: false },
  { id: 'neha-thyroid-complete', title: 'Take morning thyroid medication', memberId: 'neha', who: 'Neha', time: '6:30 am', date: 'Today', icon: 'check-circle', accent: 'sage', completed: true },
  { id: 'arjun-sync-complete', title: 'Sync Apple Health', memberId: 'arjun', who: 'Arjun', time: '7:10 am', date: 'Today', icon: 'refresh-cw', accent: 'blue', completed: true },
  { id: 'savita-breakfast-complete', title: 'Have breakfast and morning water', memberId: 'savita', who: 'Savita', time: '8:30 am', date: 'Today', icon: 'coffee', accent: 'plum', completed: true },
  { id: 'physio-prepare', title: 'Prepare the living room for physiotherapy', memberId: 'arjun', who: 'Arjun', time: '9:15 am', date: 'Tomorrow', note: 'Clear a safe walking path and place a firm chair nearby.', icon: 'home', accent: 'blue', completed: false },
  { id: 'neha-yoga-reminder', title: 'Set up Neha’s yoga call', memberId: 'neha', who: 'Neha', time: '7:15 am', date: '15 July', icon: 'video', accent: 'sage', completed: false },
  { id: 'rajiv-dietitian-notes', title: 'Write questions for the dietitian', memberId: 'rajiv', who: 'Rajiv', time: '5:30 pm', date: '16 July', icon: 'edit-3', accent: 'amber', completed: false },
  { id: 'savita-refill', title: 'Check calcium refill', memberId: 'arjun', who: 'Arjun', time: 'After lunch', date: '17 July', icon: 'shopping-bag', accent: 'plum', completed: false },
  { id: 'family-checkin-prep', title: 'Share Sunday check-in agenda', memberId: 'arjun', who: 'Arjun', time: '6:00 pm', date: '19 July', icon: 'users', accent: 'blue', completed: false },
  { id: 'rajiv-report-complete', title: 'Upload Rajiv’s diabetes report', memberId: 'rajiv', who: 'Rajiv', time: '10:20 am', date: 'Yesterday', icon: 'upload-cloud', accent: 'amber', completed: true },
];

export const goals: Goal[] = [
  { id: 'goal-arjun', memberId: 'arjun', title: 'Sleep at least 7 hours on 20 nights', current: 9, target: 20, unit: 'nights', caption: '9 of 20 nights', accent: 'blue', active: true },
  { id: 'goal-rajiv', memberId: 'rajiv', title: 'Maintain at least 95% medication adherence', current: 86, target: 95, unit: '% adherence', caption: 'Currently 86%', accent: 'amber', active: true },
  { id: 'goal-neha', memberId: 'neha', title: 'Reach 6,000 steps on 20 days', current: 7, target: 20, unit: 'days', caption: '7 of 20 days', accent: 'sage', active: true },
  { id: 'goal-savita', memberId: 'savita', title: 'Complete 20 mobility-exercise sessions', current: 6, target: 20, unit: 'sessions', caption: '6 of 20 sessions', accent: 'plum', active: true },
  { id: 'goal-family', title: 'Four Sunday health check-ins', current: 2, target: 4, unit: 'check-ins', caption: '2 of 4 completed · Next: Sunday, 19 July, 7:00 pm IST', accent: 'sage', active: true },
];

export const familyGoal = goals[4]!;

export const homeFamilyPulse = {
  eyebrow: 'YOUR FAMILY TODAY',
  title: 'Two things to review',
  summary: 'Rajiv has an evening blood-pressure reading due at 7:30 pm. Savita’s mobility exercises are overdue. Neha and Arjun are up to date.',
  updatedLabel: '4 members updated today',
  attention: [
    { memberId: 'rajiv' as const, text: 'HbA1c 7.2% → 7.8%' },
    { memberId: 'savita' as const, text: 'Mobility exercises overdue' },
  ],
  askHref: '/ai?prompt=What%20should%20I%20review%20across%20my%20family%20today%3F',
};

export const homeMemberSnapshots: Record<MemberId, {
  eyebrow: string;
  title: string;
  summary: string;
  updatedLabel: string;
  askHref: string;
}> = {
  arjun: {
    eyebrow: 'ARJUN TODAY',
    title: 'Up to date',
    summary: 'Arjun’s health data synced today. His sleep routine is the main focus tonight, with a 10:30 pm wind-down planned.',
    updatedLabel: 'Updated today',
    askHref: '/ai?prompt=What%20should%20I%20review%20for%20Arjun%20today%3F',
  },
  rajiv: {
    eyebrow: 'RAJIV TODAY',
    title: 'One action due tonight',
    summary: 'Rajiv has an evening blood-pressure reading due at 7:30 pm. His diabetes report is ready and his dietitian visit is booked for 16 July.',
    updatedLabel: 'Updated 2 hours ago',
    askHref: '/ai?prompt=What%20should%20I%20review%20for%20Rajiv%20today%3F',
  },
  neha: {
    eyebrow: 'NEHA TODAY',
    title: 'Morning routine complete',
    summary: 'Neha completed her morning medication. Her yoga introduction is booked for 15 July and her thyroid records are organised.',
    updatedLabel: 'Updated 4 hours ago',
    askHref: '/ai?prompt=What%20should%20I%20review%20for%20Neha%20today%3F',
  },
  savita: {
    eyebrow: 'SAVITA TODAY',
    title: 'One action to finish',
    summary: 'Savita’s mobility exercises are overdue. Her latest pain entry is 6/10 and home physiotherapy is booked for tomorrow at 10:00 am.',
    updatedLabel: 'Updated today',
    askHref: '/ai?prompt=What%20should%20I%20review%20for%20Savita%20today%3F',
  },
};

export const homeFamilyGoalNext = {
  date: 'Sunday, 19 July',
  time: '7:00 pm IST',
};

/** The five actions intentionally curated for the operational Home dashboard. */
export const homeTaskIds = [
  'mobility',
  'bp-evening',
  'glucose-diary',
  'neha-thyroid-complete',
  'arjun-sync-complete',
] as const;

export const homeMemberPriorities: Record<MemberId, {
  eyebrow: string;
  title: string;
  details: string[];
  primaryAction: { label: string; href: string };
  secondaryAction: { label: string; href: string };
}> = {
  arjun: {
    eyebrow: 'ARJUN TODAY',
    title: 'Sleep is the main focus tonight',
    details: ['6h 48m last night', 'Monthly sleep goal: 9 of 20 nights'],
    primaryAction: { label: 'View profile', href: '/member/arjun' },
    secondaryAction: { label: 'Ask Circle', href: '/ai?prompt=Help%20me%20improve%20my%20sleep%20routine%20tonight' },
  },
  rajiv: {
    eyebrow: 'RAJIV TODAY',
    title: 'Evening blood-pressure reading due at 7:30 pm',
    details: ['Medication adherence: 86%', 'Latest HbA1c: 7.8%, previously 7.2%'],
    primaryAction: { label: 'Log reading', href: '/quick-add/reading' },
    secondaryAction: { label: 'View profile', href: '/member/rajiv' },
  },
  neha: {
    eyebrow: 'NEHA TODAY',
    title: 'Morning medication completed',
    details: ['Yoga introduction on 15 July', 'Thyroid follow-up on 20 July'],
    primaryAction: { label: 'View schedule', href: '/calendar' },
    secondaryAction: { label: 'View profile', href: '/member/neha' },
  },
  savita: {
    eyebrow: 'SAVITA TODAY',
    title: 'Mobility exercises are overdue',
    details: ['Pain recorded: 6/10', 'Home physiotherapy on 14 July'],
    primaryAction: { label: 'Complete exercises', href: '/tasks?focus=mobility' },
    secondaryAction: { label: 'View profile', href: '/member/savita' },
  },
};

export const homeLatestChanges: Record<MemberId, {
  metricMemberId: MemberId;
  kind: MetricKind;
  href: string;
}> = {
  arjun: { metricMemberId: 'arjun', kind: 'sleep', href: '/metric/arjun/sleep' },
  rajiv: { metricMemberId: 'rajiv', kind: 'hba1c', href: '/record/rajiv-diabetes-jul' },
  neha: { metricMemberId: 'neha', kind: 'tsh', href: '/record/neha-thyroid-jul' },
  savita: { metricMemberId: 'savita', kind: 'knee-pain', href: '/metric/savita/knee-pain' },
};

export const upcomingCare = [
  { memberId: 'savita', title: 'Savita home physiotherapy', date: '14 July, 10:00 am', providerId: 'arvind-nair' },
  { memberId: 'neha', title: 'Neha online yoga introduction', date: '15 July, 7:30 am', providerId: 'ananya-sen' },
  { memberId: 'rajiv', title: 'Rajiv online dietitian', date: '16 July, 6:30 pm', providerId: 'rhea-malhotra' },
  { memberId: 'arjun', title: 'Arjun online trainer introduction', date: '18 July, 8:00 am', providerId: 'kabir-sethi' },
] as const;

export const recentUpdates = [
  { title: 'Rajiv’s diabetes report is ready', memberId: 'rajiv' as const, time: '2 hours ago', icon: 'file-text' as const, href: '/record/rajiv-diabetes-jul' },
  { title: 'Neha completed her morning medication', memberId: 'neha' as const, time: '4 hours ago', icon: 'check-circle' as const, href: '/medications' },
  { title: 'Savita’s physiotherapy was confirmed', memberId: 'savita' as const, time: 'Yesterday', icon: 'calendar' as const, href: '/booking/physio-savita' },
  { title: 'Arjun’s Apple Health data synced', memberId: 'arjun' as const, time: 'Yesterday', icon: 'refresh-cw' as const, href: '/member/arjun' },
  { title: 'Savita logged a lower knee-pain score', memberId: 'savita' as const, time: 'Yesterday', icon: 'trending-down' as const, href: '/metric/savita/knee-pain' },
  { title: 'Neha added her thyroid prescription', memberId: 'neha' as const, time: '2 days ago', icon: 'plus-circle' as const, href: '/record/neha-rx-jul' },
  { title: 'Rajiv completed his morning blood pressure', memberId: 'rajiv' as const, time: '2 days ago', icon: 'activity' as const, href: '/metric/rajiv/blood-pressure' },
  { title: 'Family check-in progress reached 50%', memberId: undefined, time: '3 days ago', icon: 'users' as const, href: '/goals' },
  { title: 'Arjun updated the family Medical ID', memberId: 'arjun' as const, time: '4 days ago', icon: 'shield' as const, href: '/emergency' },
  { title: 'Savita’s home-safety checklist was reviewed', memberId: 'savita' as const, time: '5 days ago', icon: 'home' as const, href: '/member/savita' },
];

export const quickActions = [
  { id: 'tell-circle', title: 'Tell Circle what happened', icon: 'message-circle' as const },
  { id: 'upload', title: 'Upload or scan report', icon: 'upload-cloud' as const },
  { id: 'reading', title: 'Log health reading', icon: 'activity' as const },
  { id: 'medication', title: 'Add medication', icon: 'plus-circle' as const },
  { id: 'reminder', title: 'Create reminder', icon: 'bell' as const },
  { id: 'task', title: 'Assign family task', icon: 'check-square' as const },
  { id: 'care', title: 'Book care', icon: 'heart' as const },
];
