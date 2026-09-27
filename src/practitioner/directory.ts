import { providerById } from '@/data/care';
import type { CareProfessional } from '@/types';
import type { PracticeCategory, PracticeSnapshot } from './types';

const familyCategory: Record<PracticeCategory, string> = { Physiotherapy: 'physiotherapy', Therapy: 'therapy', Fitness: 'trainer', Nutrition: 'nutrition', Yoga: 'yoga' };

/** Keep the existing sample directory entry in sync with the editable practice. */
export function practiceDirectoryEntry(practice: PracticeSnapshot): CareProfessional {
  const base = providerById('arvind-nair')!;
  const { profile } = practice;
  const services = practice.services.filter((service) => service.active);
  return { ...base, name: profile.name, title: profile.title, category: familyCategory[profile.category],
    bio: profile.bio, qualifications: [profile.qualification], languages: [...profile.languages], location: profile.address,
    price: services.length ? Math.min(...services.map((service) => service.priceInr)) : 0,
    modes: [...new Set(services.flatMap((service) => service.modes))],
    specialisations: [profile.category], services: services.map((service) => service.name),
  };
}

export function practiceMatchesFilters(practice: PracticeSnapshot, { category = 'All', mode = 'Any format', query = '' }: { category?: string; mode?: string; query?: string }) {
  const { profile } = practice;
  const label = profile.category === 'Physiotherapy' ? 'Physio' : profile.category;
  return (category === 'All' || category === label)
    && (mode === 'Any format' || practice.services.some((service) => service.active && service.modes.some((value) => value === mode)))
    && `${profile.name} ${profile.title} ${profile.category} ${profile.languages.join(' ')} ${profile.address} ${profile.bio}`.toLowerCase().includes(query.trim().toLowerCase());
}
