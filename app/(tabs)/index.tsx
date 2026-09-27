import { SavitaHome } from '@/accounts/savita/SavitaHome';
import { IndividualHome } from '@/accounts/individual/IndividualHome';
import { FamilyHome } from '@/experience/FamilyHome';
import { useAppState } from '@/state';
export default function HomeScreen() {
  const { activeAccountId } = useAppState();
  if (activeAccountId === 'savita') return <SavitaHome />;
  if (activeAccountId === 'riya') return <IndividualHome />;
  return <FamilyHome />;
}
