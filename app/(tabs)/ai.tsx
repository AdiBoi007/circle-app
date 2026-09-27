import { SavitaAI } from '@/accounts/savita/SavitaAI';
import { IndividualAI } from '@/accounts/individual/IndividualAI';
import { FamilyAI } from '@/experience/FamilyAI';
import { useAppState } from '@/state';
export default function CircleAiScreen() {
  const { activeAccountId, aiHistoryKey } = useAppState();
  if (activeAccountId === 'savita') return <SavitaAI key={aiHistoryKey} />;
  if (activeAccountId === 'riya') return <IndividualAI key={aiHistoryKey} />;
  return <FamilyAI key={aiHistoryKey} />;
}
