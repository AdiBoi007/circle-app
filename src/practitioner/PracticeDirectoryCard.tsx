import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, View } from 'react-native';
import { Avatar, Button } from '@/components';
import { useAppState } from '@/state';
import { colors } from '@/theme';
import { consumerStyles, PracticeText } from './ConsumerPracticeProfile';
import { practicePrice } from './model';

export function PracticeDirectoryCard() {
  const { practice, activeAccountId, individualSavedProviders, toggleIndividualSavedProvider, savedProviders, toggleSavedProvider } = useAppState();
  const { profile } = practice;
  const services = practice.services.filter((service) => service.active);
  const saved = (activeAccountId === 'riya' ? individualSavedProviders : savedProviders).includes('arvind-nair');
  const toggle = activeAccountId === 'riya' ? toggleIndividualSavedProvider : toggleSavedProvider;
  return <View style={[consumerStyles.card, consumerStyles.section]}>
    <View style={consumerStyles.row}>
      <Avatar name="Arvind Nair" size={52} />
      <View style={consumerStyles.flex}><PracticeText variant="headline">{profile.name}</PracticeText><PracticeText variant="subhead" color={colors.textSecondary}>{profile.title}</PracticeText></View>
      <Pressable accessibilityRole="button" accessibilityLabel={`${saved ? 'Unsave' : 'Save'} ${profile.name}`} accessibilityState={{ selected: saved }} onPress={() => toggle('arvind-nair')} style={{ minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' }}><Feather name={saved ? 'check' : 'bookmark'} size={20} color={colors.blue} /></Pressable>
    </View>
    <PracticeText variant="footnote" color={colors.blue}>Connected sample practice</PracticeText>
    <PracticeText variant="callout" color={colors.textSecondary}>{profile.address} · {profile.languages.join(', ')}</PracticeText>
    <PracticeText variant="subhead" color={colors.textSecondary}>{[...new Set(services.flatMap((service) => service.modes))].join(' · ') || 'No services listed'}</PracticeText>
    <View style={consumerStyles.wrap}><PracticeText variant="headline">{services.length ? `From ${practicePrice(Math.min(...services.map((service) => service.priceInr)))}` : 'Services coming soon'}</PracticeText><PracticeText variant="footnote" color={colors.textSecondary}>{profile.acceptingRequests ? 'Example fees' : 'Requests paused'}</PracticeText></View>
    <Button title="View practice" variant="secondary" size="md" onPress={() => router.push('/practitioner-profile')} />
  </View>;
}
