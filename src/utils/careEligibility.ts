import { launchMarket } from '@/config/launch';
import { family } from '@/data/family';
import type { CareMode, CareProfessional, MemberId } from '@/types';

/** Shared demo-market filtering; live booking eligibility must also be enforced by the server. */
export function availableCareModes(pro: CareProfessional, memberId: MemberId): CareMode[] {
  const member = family.find((person) => person.id === memberId);
  if (!member || !member.location.includes(launchMarket.city)) return [];
  if (pro.timezone !== launchMarket.timeZone || pro.currency !== launchMarket.currencySymbol) return [];
  if (!pro.jurisdictions.includes(launchMarket.city)) return [];
  if (!pro.location.includes(launchMarket.city)) return [];
  return [...pro.modes];
}
