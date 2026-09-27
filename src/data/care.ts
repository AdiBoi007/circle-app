import { launchMarket } from '@/config/launch';
import type { AccentName } from '@/theme';
import type { CareCategory, CareMode, CareProfessional, FeatherIconName, MemberId } from '@/types';

export const careCategories: CareCategory[] = [
  { id: 'all', label: 'All', icon: 'grid' }, { id: 'nutrition', label: 'Nutrition', icon: 'coffee' },
  { id: 'trainer', label: 'Training', icon: 'trending-up' }, { id: 'yoga', label: 'Yoga', icon: 'sun' },
  { id: 'therapy', label: 'Counselling', icon: 'message-circle' }, { id: 'physiotherapy', label: 'Physiotherapy', icon: 'activity' },
  { id: 'wellness', label: 'Wellness & sleep', icon: 'moon' }, { id: 'caregiver', label: 'Caregivers', icon: 'heart' },
  { id: 'nurse', label: 'Nurses', icon: 'plus' }, { id: 'elder-care', label: 'Elder care', icon: 'users' },
];

type Seed = { id: string; name: string; category: string; title: string; price: number; languages?: string[]; modes?: CareMode[]; specialty: string; recommendedFor?: MemberId[]; accent?: AccentName; icon?: FeatherIconName };

/** Fictional preview profiles. These are not the launch market's practitioner roster. */
const makeProvider = (s: Seed, index: number): CareProfessional => ({
  id: s.id, name: s.name, category: s.category, title: s.title, location: launchMarket.city,
  timezone: launchMarket.timeZone, modes: s.modes ?? ['Online'],
  languages: s.languages ?? ['English', 'Hindi', 'Punjabi'], qualifications: ['Sample profile — qualifications have not been verified'],
  verified: false, jurisdictions: [launchMarket.city],
  specialisations: [s.specialty, 'Family-centred care', 'Sustainable routines'],
  ageGroups: s.category === 'elder-care' || s.category === 'caregiver' ? ['Adults', 'Older adults'] : ['Young adults', 'Adults', 'Older adults'],
  experience: 0, rating: 0, reviewCount: 0,
  price: s.price, currency: launchMarket.currencySymbol, priceSuffix: s.category === 'caregiver' ? '/hour' : undefined,
  nextSlot: `Sample slot · 20 July 2026, 6:30 pm ${launchMarket.timeZoneLabel}`,
  bio: `Fictional sample profile for the ${launchMarket.city} preview. This example illustrates support for ${s.specialty.toLowerCase()}. Identity, qualifications, experience, prices and availability have not been verified; no practitioner is offering care through this listing.`,
  services: ['60-minute introduction', 'Personal care plan', '30-minute follow-up'], packages: ['Single session', 'Four-session care pack', 'Monthly support'],
  availability: [`Sample Monday · 6:30 pm ${launchMarket.timeZoneLabel}`, `Sample Wednesday · 7:00 pm ${launchMarket.timeZoneLabel}`, `Sample Saturday · 10:00 am ${launchMarket.timeZoneLabel}`], reviews: [],
  cancellation: 'Demo appointments can be changed or removed in this preview. No practitioner is contacted and no payment or refund is processed.',
  matchScore: 0, recommendedFor: s.recommendedFor ?? [],
  why: `Sample ${launchMarket.city} profile illustrating ${s.specialty.toLowerCase()}; this is not a verified recommendation.`,
  accent: s.accent ?? (['blue', 'sage', 'amber', 'plum'][index % 4] as AccentName),
  icon: s.icon ?? (s.category === 'nutrition' ? 'coffee' : s.category === 'physiotherapy' ? 'activity' : s.category === 'caregiver' ? 'heart' : 'user'),
});

const seeds: Seed[] = [
  { id: 'rhea-malhotra', name: 'Rhea Malhotra', category: 'nutrition', title: 'Diabetes dietitian', price: 899, specialty: 'Diabetes and vegetarian Indian nutrition', languages: ['Hindi', 'English'], recommendedFor: ['rajiv'], accent: 'amber' },
  { id: 'maya-iyer', name: 'Maya Iyer', category: 'nutrition', title: 'Women’s health dietitian', price: 1099, specialty: 'Thyroid and women’s nutrition', recommendedFor: ['neha'], accent: 'sage' },
  { id: 'emily-chen', name: 'Emily Chen', category: 'nutrition', title: 'Sports dietitian', price: 1100, specialty: 'Sports performance nutrition', languages: ['English', 'Mandarin'], recommendedFor: ['arjun'], accent: 'blue' },
  { id: 'aditi-rao', name: 'Aditi Rao', category: 'nutrition', title: 'Geriatric dietitian', price: 799, specialty: 'Older-adult nutrition and bone health', recommendedFor: ['savita'], accent: 'plum' },
  { id: 'sameer-khanna', name: 'Sameer Khanna', category: 'nutrition', title: 'Family nutritionist', price: 749, specialty: 'Heart-friendly family meals' },
  { id: 'kabir-sethi', name: 'Kabir Sethi', category: 'trainer', title: 'Personal trainer', price: 700, specialty: 'Strength and university fitness', languages: ['English', 'Hindi'], recommendedFor: ['arjun'], accent: 'blue' },
  { id: 'meera-bhasin', name: 'Meera Bhasin', category: 'trainer', title: 'Women’s fitness coach', price: 799, specialty: 'Midlife strength and fitness', recommendedFor: ['neha'], accent: 'sage' },
  { id: 'liam-walker', name: 'Liam Walker', category: 'trainer', title: 'Running coach', price: 800, specialty: 'Running form and conditioning', languages: ['English'] },
  { id: 'devika-shah', name: 'Devika Shah', category: 'trainer', title: 'Functional trainer', price: 699, specialty: 'Low-impact functional fitness' },
  { id: 'rohan-gill', name: 'Rohan Gill', category: 'trainer', title: 'Strength coach', price: 899, specialty: 'Safe progressive strength' },
  { id: 'ananya-sen', name: 'Ananya Sen', category: 'yoga', title: 'Yoga instructor', price: 499, specialty: 'Women’s yoga and thyroid support', recommendedFor: ['neha'], accent: 'sage' },
  { id: 'kavita-joshi', name: 'Kavita Joshi', category: 'yoga', title: 'Senior mobility yoga instructor', price: 599, specialty: 'Chair yoga and senior mobility', recommendedFor: ['savita'], accent: 'plum', modes: ['Online', 'In person'] },
  { id: 'pranav-kulkarni', name: 'Pranav Kulkarni', category: 'yoga', title: 'Breathwork instructor', price: 549, specialty: 'Breathwork and relaxation' },
  { id: 'sophie-hart', name: 'Sophie Hart', category: 'yoga', title: 'Yoga instructor', price: 600, specialty: 'Mobility and recovery', languages: ['English'] },
  { id: 'naina-kapoor', name: 'Naina Kapoor', category: 'therapy', title: 'Counsellor', price: 1200, specialty: 'Family stress and caregiving', recommendedFor: ['arjun'], accent: 'plum' },
  { id: 'isha-verma', name: 'Isha Verma', category: 'therapy', title: 'Family therapist', price: 1400, specialty: 'Family communication' },
  { id: 'daniel-lee', name: 'Daniel Lee', category: 'therapy', title: 'Counsellor', price: 1200, specialty: 'Young-adult wellbeing', languages: ['English', 'Korean'] },
  { id: 'zoya-mirza', name: 'Zoya Mirza', category: 'therapy', title: 'Grief counsellor', price: 1000, specialty: 'Grief and life transitions' },
  { id: 'arvind-nair', name: 'Arvind Nair', category: 'physiotherapy', title: 'Home physiotherapist', price: 1200, specialty: 'Osteoarthritis and home mobility', modes: ['Home visit', 'Online'], recommendedFor: ['savita'], accent: 'plum' },
  { id: 'claire-wong', name: 'Claire Wong', category: 'physiotherapy', title: 'Sports physiotherapist', price: 1100, specialty: 'Sports recovery and injury prevention', languages: ['English', 'Cantonese'], recommendedFor: ['arjun'], accent: 'blue' },
  { id: 'harsh-vardhan', name: 'Harsh Vardhan', category: 'physiotherapy', title: 'Musculoskeletal physiotherapist', price: 1100, specialty: 'Back pain and posture', modes: ['In person', 'Home visit'] },
  { id: 'ritu-chawla', name: 'Ritu Chawla', category: 'physiotherapy', title: 'Geriatric physiotherapist', price: 1050, specialty: 'Balance and fall prevention', recommendedFor: ['savita'] },
  { id: 'tara-menon', name: 'Tara Menon', category: 'wellness', title: 'Sleep coach', price: 899, specialty: 'Adult sleep routines', recommendedFor: ['arjun', 'neha'] },
  { id: 'olivia-reed', name: 'Olivia Reed', category: 'wellness', title: 'Wellness coach', price: 850, specialty: 'Student routines and stress', languages: ['English'], recommendedFor: ['arjun'] },
  { id: 'mohit-arora', name: 'Mohit Arora', category: 'wellness', title: 'Lifestyle coach', price: 799, specialty: 'Metabolic health habits', recommendedFor: ['rajiv'] },
  { id: 'sana-qureshi', name: 'Sana Qureshi', category: 'wellness', title: 'Sleep educator', price: 699, specialty: 'Sleep education for families' },
  { id: 'farah-ali', name: 'Farah Ali', category: 'caregiver', title: 'Elder-care companion', price: 450, specialty: 'Companionship and daily support', modes: ['Home visit'], recommendedFor: ['savita'], accent: 'plum' },
  { id: 'pooja-saini', name: 'Pooja Saini', category: 'caregiver', title: 'Home caregiver', price: 500, specialty: 'Mobility and meal support', modes: ['Home visit'] },
  { id: 'sunil-yadav', name: 'Sunil Yadav', category: 'caregiver', title: 'Care companion', price: 400, specialty: 'Appointments and companionship', modes: ['Home visit'] },
  { id: 'grace-thomas', name: 'Grace Thomas', category: 'caregiver', title: 'Dementia-aware caregiver', price: 650, specialty: 'Memory-aware home support', modes: ['Home visit'] },
  { id: 'rekha-paul', name: 'Rekha Paul', category: 'nurse', title: 'Home-care nurse', price: 900, specialty: 'Vitals and medication support', modes: ['Home visit'] },
  { id: 'amanpreet-kaur', name: 'Amanpreet Kaur', category: 'nurse', title: 'Diabetes nurse educator', price: 1000, specialty: 'Diabetes self-management education', recommendedFor: ['rajiv'] },
  { id: 'julia-martin', name: 'Julia Martin', category: 'nurse', title: 'Community nurse', price: 900, specialty: 'Home health education', languages: ['English'], modes: ['Home visit', 'Online'] },
  { id: 'shreya-bose', name: 'Shreya Bose', category: 'elder-care', title: 'Elder-care coordinator', price: 950, specialty: 'Coordinated ageing-at-home plans', recommendedFor: ['savita'] },
  { id: 'alok-mathur', name: 'Alok Mathur', category: 'elder-care', title: 'Senior living adviser', price: 800, specialty: 'Home safety and care planning' },
  { id: 'leela-dsouza', name: 'Leela D’Souza', category: 'elder-care', title: 'Ageing-well specialist', price: 850, specialty: 'Active ageing and family support' },
];

export const careProfessionals = seeds.map(makeProvider);
export const recommendedProfessionals = ['rhea-malhotra', 'arvind-nair', 'maya-iyer', 'kabir-sethi'].map((id) => careProfessionals.find((item) => item.id === id)!);
export const providerById = (id: string) => careProfessionals.find((item) => item.id === id);
