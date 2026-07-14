import type { AccentName } from '@/theme';
import type { CareCategory, CareMode, CareProfessional, FeatherIconName, MemberId } from '@/types';

export const careCategories: CareCategory[] = [
  { id: 'all', label: 'All', icon: 'grid' }, { id: 'nutrition', label: 'Nutrition', icon: 'coffee' },
  { id: 'trainer', label: 'Training', icon: 'trending-up' }, { id: 'yoga', label: 'Yoga', icon: 'sun' },
  { id: 'therapy', label: 'Counselling', icon: 'message-circle' }, { id: 'physiotherapy', label: 'Physiotherapy', icon: 'activity' },
  { id: 'wellness', label: 'Wellness & sleep', icon: 'moon' }, { id: 'caregiver', label: 'Caregivers', icon: 'heart' },
  { id: 'nurse', label: 'Nurses', icon: 'plus' }, { id: 'elder-care', label: 'Elder care', icon: 'users' },
];

type Seed = { id: string; name: string; category: string; title: string; location: string; price: number; currency?: '₹' | 'A$'; languages?: string[]; modes?: CareMode[]; specialty: string; recommendedFor?: MemberId[]; score?: number; accent?: AccentName; icon?: FeatherIconName; next?: string; experience?: number; rating?: number };

const makeProvider = (s: Seed, index: number): CareProfessional => ({
  id: s.id, name: s.name, category: s.category, title: s.title, location: s.location,
  timezone: s.currency === 'A$' ? 'Australia/Sydney' : 'Asia/Kolkata', modes: s.modes ?? ['Online'],
  languages: s.languages ?? ['English', 'Hindi'], qualifications: [`Certified ${s.title}`, index % 2 ? 'Master’s in relevant health science' : 'Advanced family-care certification'],
  verified: true, jurisdictions: s.currency === 'A$' ? ['New South Wales', 'Online worldwide'] : ['Delhi NCR', 'Online across India'],
  specialisations: [s.specialty, 'Family-centred care', 'Sustainable routines'],
  ageGroups: s.category === 'elder-care' || s.category === 'caregiver' ? ['Adults', 'Older adults'] : ['Young adults', 'Adults', 'Older adults'],
  experience: s.experience ?? 6 + (index % 12), rating: s.rating ?? Number((4.7 + (index % 3) * 0.1).toFixed(1)), reviewCount: 48 + index * 7,
  price: s.price, currency: s.currency ?? '₹', priceSuffix: s.category === 'caregiver' ? '/hour' : undefined,
  nextSlot: s.next ?? (index % 2 ? 'Tomorrow, 6:30 pm' : 'Today, 7:00 pm'),
  bio: `${s.name} offers practical, culturally aware support in ${s.specialty.toLowerCase()}, with plans designed around everyday family life.`,
  services: ['60-minute introduction', 'Personal care plan', '30-minute follow-up'], packages: ['Single session', 'Four-session care pack', 'Monthly support'],
  availability: ['Mon · 6:30 pm', 'Wed · 7:00 pm', 'Sat · 10:00 am'], reviews: [
    { name: 'A family member', rating: 5, text: 'Warm, clear and easy to work with.' },
    { name: 'Verified client', rating: 5, text: 'The plan felt realistic for our routine.' },
    { name: 'Circle family', rating: 4, text: 'Thoughtful follow-up and practical advice.' },
  ], cancellation: 'Cancel or reschedule up to 12 hours before the session for a full mock refund.',
  matchScore: s.score ?? 78 + (index % 18), recommendedFor: s.recommendedFor ?? [],
  why: `Strong match for ${s.specialty.toLowerCase()}, preferred languages and availability.`,
  accent: s.accent ?? (['blue', 'sage', 'amber', 'plum'][index % 4] as AccentName),
  icon: s.icon ?? (s.category === 'nutrition' ? 'coffee' : s.category === 'physiotherapy' ? 'activity' : s.category === 'caregiver' ? 'heart' : 'user'),
});

const seeds: Seed[] = [
  { id: 'rhea-malhotra', name: 'Rhea Malhotra', category: 'nutrition', title: 'Diabetes dietitian', location: 'New Delhi', price: 899, specialty: 'Diabetes and vegetarian Indian nutrition', languages: ['Hindi', 'English'], recommendedFor: ['rajiv'], score: 98, accent: 'amber', next: 'Tomorrow, 6:30 pm' },
  { id: 'maya-iyer', name: 'Maya Iyer', category: 'nutrition', title: 'Women’s health dietitian', location: 'Bengaluru · Online', price: 1099, specialty: 'Thyroid and women’s nutrition', recommendedFor: ['neha'], score: 94, accent: 'sage' },
  { id: 'emily-chen', name: 'Emily Chen', category: 'nutrition', title: 'Sports dietitian', location: 'Sydney', price: 110, currency: 'A$', specialty: 'Sports performance nutrition', languages: ['English', 'Mandarin'], recommendedFor: ['arjun'], score: 93, accent: 'blue' },
  { id: 'aditi-rao', name: 'Aditi Rao', category: 'nutrition', title: 'Geriatric dietitian', location: 'New Delhi', price: 799, specialty: 'Older-adult nutrition and bone health', recommendedFor: ['savita'], score: 92, accent: 'plum' },
  { id: 'sameer-khanna', name: 'Sameer Khanna', category: 'nutrition', title: 'Family nutritionist', location: 'Gurugram · Online', price: 749, specialty: 'Heart-friendly family meals' },
  { id: 'kabir-sethi', name: 'Kabir Sethi', category: 'trainer', title: 'Personal trainer', location: 'Sydney', price: 55, currency: 'A$', specialty: 'Strength and university fitness', languages: ['English', 'Hindi'], recommendedFor: ['arjun'], score: 95, accent: 'blue' },
  { id: 'meera-bhasin', name: 'Meera Bhasin', category: 'trainer', title: 'Women’s fitness coach', location: 'New Delhi · Online', price: 799, specialty: 'Midlife strength and fitness', recommendedFor: ['neha'], score: 90, accent: 'sage' },
  { id: 'liam-walker', name: 'Liam Walker', category: 'trainer', title: 'Running coach', location: 'Sydney', price: 65, currency: 'A$', specialty: 'Running form and conditioning', languages: ['English'] },
  { id: 'devika-shah', name: 'Devika Shah', category: 'trainer', title: 'Functional trainer', location: 'Mumbai · Online', price: 699, specialty: 'Low-impact functional fitness' },
  { id: 'rohan-gill', name: 'Rohan Gill', category: 'trainer', title: 'Strength coach', location: 'New Delhi', price: 899, specialty: 'Safe progressive strength' },
  { id: 'ananya-sen', name: 'Ananya Sen', category: 'yoga', title: 'Yoga instructor', location: 'New Delhi · Online', price: 499, specialty: 'Women’s yoga and thyroid support', recommendedFor: ['neha'], score: 96, accent: 'sage' },
  { id: 'kavita-joshi', name: 'Kavita Joshi', category: 'yoga', title: 'Senior mobility yoga instructor', location: 'New Delhi', price: 599, specialty: 'Chair yoga and senior mobility', recommendedFor: ['savita'], score: 97, accent: 'plum', modes: ['Online', 'In person'] },
  { id: 'pranav-kulkarni', name: 'Pranav Kulkarni', category: 'yoga', title: 'Breathwork instructor', location: 'Pune · Online', price: 549, specialty: 'Breathwork and relaxation' },
  { id: 'sophie-hart', name: 'Sophie Hart', category: 'yoga', title: 'Yoga instructor', location: 'Sydney', price: 70, currency: 'A$', specialty: 'Mobility and recovery', languages: ['English'] },
  { id: 'naina-kapoor', name: 'Naina Kapoor', category: 'therapy', title: 'Counsellor', location: 'New Delhi · Online', price: 1200, specialty: 'Family stress and caregiving', recommendedFor: ['arjun'], score: 89, accent: 'plum' },
  { id: 'isha-verma', name: 'Isha Verma', category: 'therapy', title: 'Family therapist', location: 'Noida · Online', price: 1400, specialty: 'Family communication' },
  { id: 'daniel-lee', name: 'Daniel Lee', category: 'therapy', title: 'Counsellor', location: 'Sydney', price: 125, currency: 'A$', specialty: 'Young-adult wellbeing', languages: ['English', 'Korean'] },
  { id: 'zoya-mirza', name: 'Zoya Mirza', category: 'therapy', title: 'Grief counsellor', location: 'New Delhi · Online', price: 1000, specialty: 'Grief and life transitions' },
  { id: 'arvind-nair', name: 'Arvind Nair', category: 'physiotherapy', title: 'Home physiotherapist', location: 'New Delhi', price: 1200, specialty: 'Osteoarthritis and home mobility', modes: ['Home visit', 'Online'], recommendedFor: ['savita'], score: 99, accent: 'plum' },
  { id: 'claire-wong', name: 'Claire Wong', category: 'physiotherapy', title: 'Sports physiotherapist', location: 'Sydney', price: 140, currency: 'A$', specialty: 'Sports recovery and injury prevention', languages: ['English', 'Cantonese'], recommendedFor: ['arjun'], score: 91, accent: 'blue' },
  { id: 'harsh-vardhan', name: 'Harsh Vardhan', category: 'physiotherapy', title: 'Musculoskeletal physiotherapist', location: 'Gurugram', price: 1100, specialty: 'Back pain and posture', modes: ['In person', 'Home visit'] },
  { id: 'ritu-chawla', name: 'Ritu Chawla', category: 'physiotherapy', title: 'Geriatric physiotherapist', location: 'New Delhi', price: 1050, specialty: 'Balance and fall prevention', recommendedFor: ['savita'] },
  { id: 'tara-menon', name: 'Tara Menon', category: 'wellness', title: 'Sleep coach', location: 'Bengaluru · Online', price: 899, specialty: 'Adult sleep routines', recommendedFor: ['arjun', 'neha'] },
  { id: 'olivia-reed', name: 'Olivia Reed', category: 'wellness', title: 'Wellness coach', location: 'Sydney', price: 95, currency: 'A$', specialty: 'Student routines and stress', languages: ['English'], recommendedFor: ['arjun'] },
  { id: 'mohit-arora', name: 'Mohit Arora', category: 'wellness', title: 'Lifestyle coach', location: 'New Delhi · Online', price: 799, specialty: 'Metabolic health habits', recommendedFor: ['rajiv'] },
  { id: 'sana-qureshi', name: 'Sana Qureshi', category: 'wellness', title: 'Sleep educator', location: 'Hyderabad · Online', price: 699, specialty: 'Sleep education for families' },
  { id: 'farah-ali', name: 'Farah Ali', category: 'caregiver', title: 'Elder-care companion', location: 'New Delhi', price: 450, specialty: 'Companionship and daily support', modes: ['Home visit'], recommendedFor: ['savita'], score: 96, accent: 'plum' },
  { id: 'pooja-saini', name: 'Pooja Saini', category: 'caregiver', title: 'Home caregiver', location: 'New Delhi', price: 500, specialty: 'Mobility and meal support', modes: ['Home visit'] },
  { id: 'sunil-yadav', name: 'Sunil Yadav', category: 'caregiver', title: 'Care companion', location: 'Noida', price: 400, specialty: 'Appointments and companionship', modes: ['Home visit'] },
  { id: 'grace-thomas', name: 'Grace Thomas', category: 'caregiver', title: 'Dementia-aware caregiver', location: 'Gurugram', price: 650, specialty: 'Memory-aware home support', modes: ['Home visit'] },
  { id: 'rekha-paul', name: 'Rekha Paul', category: 'nurse', title: 'Home-care nurse', location: 'New Delhi', price: 900, specialty: 'Vitals and medication support', modes: ['Home visit'] },
  { id: 'amanpreet-kaur', name: 'Amanpreet Kaur', category: 'nurse', title: 'Diabetes nurse educator', location: 'New Delhi · Online', price: 1000, specialty: 'Diabetes self-management education', recommendedFor: ['rajiv'] },
  { id: 'julia-martin', name: 'Julia Martin', category: 'nurse', title: 'Community nurse', location: 'Sydney', price: 120, currency: 'A$', specialty: 'Home health education', languages: ['English'], modes: ['Home visit', 'Online'] },
  { id: 'shreya-bose', name: 'Shreya Bose', category: 'elder-care', title: 'Elder-care coordinator', location: 'New Delhi', price: 950, specialty: 'Coordinated ageing-at-home plans', recommendedFor: ['savita'] },
  { id: 'alok-mathur', name: 'Alok Mathur', category: 'elder-care', title: 'Senior living adviser', location: 'Gurugram', price: 800, specialty: 'Home safety and care planning' },
  { id: 'leela-dsouza', name: 'Leela D’Souza', category: 'elder-care', title: 'Ageing-well specialist', location: 'Goa · Online', price: 850, specialty: 'Active ageing and family support' },
];

export const careProfessionals = seeds.map(makeProvider);
export const recommendedProfessionals = ['rhea-malhotra', 'arvind-nair', 'maya-iyer', 'kabir-sethi'].map((id) => careProfessionals.find((item) => item.id === id)!);
export const providerById = (id: string) => careProfessionals.find((item) => item.id === id);
