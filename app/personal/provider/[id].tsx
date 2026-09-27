import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, DetailHeader, ScreenContainer, Text } from '@/components';
import { categoryAppearance, DemoNotice, PersonalAccess, PersonalButton, PersonalSection, ui } from '@/accounts/individual/PersonalUI';
import { individualProviders, individualSlotDates, personalDate, personalPrice, personalTimeZoneLabel } from '@/data/individual';
import { useAppState } from '@/state';
import { colors } from '@/theme';

export default function IndividualProviderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeAccountId, individualSavedProviders, toggleIndividualSavedProvider } = useAppState();
  const provider = individualProviders.find((item) => item.id === id);
  if (activeAccountId !== 'riya') return <PersonalAccess />;
  if (!provider) return <ScreenContainer><DetailHeader title="Find care" /><Text>We couldn’t find this sample practitioner.</Text><PersonalButton title="Explore practitioners" onPress={() => router.replace('/care')} /></ScreenContainer>;
  const saved = individualSavedProviders.includes(provider.id);
  const appearance = categoryAppearance[provider.category];
  return <ScreenContainer bottomInset={32} contentStyle={ui.page}>
    <DetailHeader title="Practitioner" actionLabel={saved ? 'Saved' : 'Save'} onAction={() => toggleIndividualSavedProvider(provider.id)} />
    <View style={[ui.card, { gap: 18 }]}>
      <View style={ui.row}><Avatar name={provider.portrait} size={82} /><View style={ui.flex}><Text variant="title2">{provider.name}</Text><Text variant="headline" color={appearance.color}>{provider.title}</Text><Text variant="footnote" color={colors.textSecondary}>{provider.location}</Text></View></View>
      <Text variant="body">{provider.focus.join(' · ')}</Text>
      <View style={styles.session}><View style={{ gap: 2 }}><Text variant="title2">{personalPrice(provider.price)}</Text><Text variant="footnote" color={colors.textSecondary}>{provider.duration}-minute session</Text></View><View style={{ gap: 3, flexShrink: 1 }}><Text variant="subhead">{provider.modes.join(' · ')}</Text><Text variant="footnote" color={colors.textSecondary}>From {personalDate(individualSlotDates[0], true)}</Text></View></View>
      <PersonalButton title="Choose a time" onPress={() => router.push(`/personal/booking/${provider.id}`)} />
    </View>
    <DemoNotice />
    <PersonalSection title="About"><View style={ui.card}><Text variant="body">{provider.about}</Text></View></PersonalSection>
    <PersonalSection title="Practice details"><View style={[ui.card, { paddingVertical: 0 }]}><InfoRow icon="award" title="Example qualification" value={provider.qualification} /><InfoRow icon="message-circle" title="Languages" value={provider.languages} separated /><InfoRow icon="map-pin" title="Location" value={provider.location} separated /><InfoRow icon="clock" title="Time zone" value={personalTimeZoneLabel} separated /></View></PersonalSection>
    <PersonalSection title="Your first session"><View style={ui.card}><Text variant="body">{provider.approach}</Text></View></PersonalSection>
    <Pressable onPress={() => router.push(`/ai?prompt=${encodeURIComponent(`What should I ask a ${provider.title.toLowerCase()} before a first session?`)}`)} accessibilityRole="button" style={[ui.card, ui.row]}><Feather name="message-circle" size={23} color={colors.blue} /><View style={ui.flex}><Text variant="headline">Prepare for your session</Text><Text variant="footnote" color={colors.textSecondary}>Make a list of questions with Circle</Text></View><Feather name="chevron-right" size={18} color={colors.textSecondary} /></Pressable>
  </ScreenContainer>;
}

function InfoRow({ icon, title, value, separated = false }: { icon: keyof typeof Feather.glyphMap; title: string; value: string; separated?: boolean }) {
  return <View style={[ui.row, styles.infoRow, separated && styles.separator]}><Feather name={icon} size={20} color={colors.blue} /><View style={ui.flex}><Text variant="footnote" color={colors.textSecondary}>{title}</Text><Text variant="body">{value}</Text></View></View>;
}
const styles = StyleSheet.create({
  session: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 16 },
  infoRow: { minHeight: 68, paddingVertical: 13 },
  separator: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
});
