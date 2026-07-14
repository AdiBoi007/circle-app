import type { FamilyMember, MemberId, MemberPulse, Metric, MetricKind } from '@/types';

export const family: FamilyMember[] = [
  { id: 'arjun', name: 'Arjun Mehra', relation: 'You', age: 23, location: 'Sydney', role: 'Care Captain', status: 'Apple Health synced today', conditions: [], allergies: ['No known allergies'], accent: 'blue' },
  { id: 'rajiv', name: 'Rajiv Mehra', relation: 'Father', age: 57, location: 'New Delhi', status: 'Evening blood pressure due', conditions: ['Type 2 diabetes', 'Hypertension'], allergies: ['No known allergies'], accent: 'amber' },
  { id: 'neha', name: 'Neha Mehra', relation: 'Mother', age: 52, location: 'New Delhi', status: 'Morning medication complete', conditions: ['Hypothyroidism', 'Elevated cholesterol'], allergies: ['Penicillin'], accent: 'sage' },
  { id: 'savita', name: 'Savita Mehra', relation: 'Grandmother', age: 76, location: 'New Delhi', status: 'Mobility exercises due', conditions: ['Osteoarthritis', 'Reduced mobility'], allergies: ['No known allergies'], accent: 'plum' },
];

export const familyOwner = family[0]!;

const h = (values: number[], suffix = '') => values.map((value, i) => ({ label: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'][i]!, value, display: `${value}${suffix}` }));
const metric = (kind: MetricKind, label: string, value: string, previous: string, change: string, caption: string, source: string, icon: Metric['icon'], pastel: Metric['pastel'], values: number[], suffix = ''): Metric => ({
  kind, label, value, previous, change, caption, source, updated: 'Today, 6:42 pm', icon, pastel, history: h(values, suffix),
  note: 'This information helps you notice patterns over time. It is not a diagnosis; discuss unexpected changes with a qualified clinician.',
});

const pulses: Record<MemberId, MemberPulse> = {
  arjun: { memberId: 'arjun', metrics: [
    metric('sleep', 'Sleep', '6h 48m', '7h 02m', '14m less', 'last night', 'Apple Health', 'moon', 'lavender', [6.5, 7.2, 6.9, 7.4, 6.2, 7.1, 6.8], 'h'),
    metric('steps', 'Activity', '8,420', '7,960', '460 more', 'steps today', 'Apple Health', 'activity', 'blue', [6800, 9210, 7430, 10120, 7780, 7960, 8420]),
    metric('resting-heart-rate', 'Resting heart rate', '68 bpm', '70 bpm', '2 bpm lower', 'daily average', 'Apple Health', 'heart', 'mint', [71, 69, 70, 68, 67, 70, 68], ' bpm'),
    metric('weight', 'Weight', '72.4 kg', '72.8 kg', '0.4 kg lower', 'latest check-in', 'Manual check-in', 'target', 'cream', [73.1, 72.9, 72.8, 72.6, 72.7, 72.8, 72.4], ' kg'),
    metric('vitamin-d', 'Vitamin D', '24 ng/mL', '21 ng/mL', '3 higher', '12 May', 'Annual Blood Work', 'sun', 'peach', [19, 20, 20, 21, 22, 21, 24], ' ng/mL'),
  ] },
  rajiv: { memberId: 'rajiv', metrics: [
    metric('blood-pressure', 'Blood pressure', '138/86', '136/84', '2/2 higher', 'mmHg, morning', 'Manual reading', 'activity', 'peach', [142, 139, 137, 141, 135, 136, 138]),
    metric('fasting-glucose', 'Fasting glucose', '146 mg/dL', '139 mg/dL', '7 higher', '8 July', 'Diabetes Panel', 'droplet', 'blue', [132, 136, 139, 142, 140, 139, 146], ' mg/dL'),
    metric('medication-adherence', 'Medication adherence', '86%', '91%', '5% lower', 'this month', 'Circle medication log', 'check-circle', 'mint', [92, 88, 91, 84, 90, 91, 86], '%'),
    metric('hba1c', 'HbA1c', '7.8%', '7.2%', '0.6 higher', '8 July', 'Diabetes Panel', 'droplet', 'peach', [6.9, 7.0, 7.1, 7.2, 7.3, 7.5, 7.8], '%'),
    metric('ldl', 'LDL cholesterol', '118 mg/dL', '112 mg/dL', '6 higher', '8 July', 'Diabetes Panel', 'bar-chart-2', 'cream', [108, 110, 112, 113, 116, 112, 118], ' mg/dL'),
    metric('weight', 'Weight', '81.2 kg', '81.8 kg', '0.6 kg lower', 'latest check-in', 'Manual check-in', 'target', 'blue', [82.4, 82.0, 81.9, 81.7, 81.5, 81.8, 81.2], ' kg'),
  ] },
  neha: { memberId: 'neha', metrics: [
    metric('steps', 'Steps', '5,260', '5,810', '550 fewer', 'today', 'Phone activity', 'activity', 'blue', [4800, 6220, 5710, 6030, 5140, 5810, 5260]),
    metric('sleep', 'Sleep', '6h 21m', '6h 44m', '23m less', 'last night', 'Phone estimate', 'moon', 'lavender', [6.8, 6.3, 7.0, 6.6, 6.9, 6.7, 6.35], 'h'),
    metric('medication-adherence', 'Medication adherence', '93%', '96%', '3% lower', 'this month', 'Circle medication log', 'check-circle', 'mint', [96, 94, 92, 95, 93, 96, 93], '%'),
    metric('tsh', 'TSH', '5.1 mIU/L', '4.8 mIU/L', '0.3 higher', '6 July', 'Thyroid and Lipid Panel', 'bar-chart', 'peach', [5.7, 5.4, 5.3, 5.0, 4.9, 4.8, 5.1], ' mIU/L'),
    metric('ldl', 'LDL cholesterol', '142 mg/dL', '136 mg/dL', '6 higher', '6 July', 'Thyroid and Lipid Panel', 'bar-chart-2', 'cream', [148, 145, 144, 140, 138, 136, 142], ' mg/dL'),
    metric('vitamin-d', 'Vitamin D', '21 ng/mL', '19 ng/mL', '2 higher', '12 January', 'Preventive Health Check', 'sun', 'lavender', [17, 18, 19, 19, 20, 19, 21], ' ng/mL'),
    metric('weight', 'Weight', '68.6 kg', '69.0 kg', '0.4 kg lower', 'latest check-in', 'Manual check-in', 'target', 'blue', [69.8, 69.5, 69.4, 69.1, 68.9, 69.0, 68.6], ' kg'),
  ] },
  savita: { memberId: 'savita', metrics: [
    metric('steps', 'Steps', '1,650', '1,420', '230 more', 'today', 'Phone activity', 'activity', 'blue', [1100, 1480, 1320, 1710, 1240, 1420, 1650]),
    metric('knee-pain', 'Knee pain', '6/10', '7/10', '1 point lower', 'evening check-in', 'Manual check-in', 'thermometer', 'peach', [7, 6, 7, 6, 5, 7, 6], '/10'),
    metric('mobility-sessions', 'Mobility sessions', '6/20', '5/20', '1 more', 'this month', 'Circle care plan', 'repeat', 'mint', [0, 1, 2, 3, 4, 5, 6]),
    metric('weight', 'Weight', '64.8 kg', '65.1 kg', '0.3 kg lower', 'latest check-in', 'Manual check-in', 'target', 'cream', [65.3, 65.2, 65.1, 65.0, 64.9, 65.1, 64.8], ' kg'),
  ] },
};

export function pulseFor(memberId: string): MemberPulse { return pulses[memberId as MemberId] ?? pulses.arjun; }
export function metricFor(memberId: string, kind: string): Metric | undefined { return pulseFor(memberId).metrics.find((item) => item.kind === kind); }
