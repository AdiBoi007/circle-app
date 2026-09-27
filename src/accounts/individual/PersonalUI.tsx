import type { ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { launchMarket } from '@/config/launch';
import { Avatar, ScreenContainer, Text } from '@/components';
import { individualProviders, personalDate, personalPrice, personalTime, type IndividualBooking, type IndividualCategory, type IndividualProvider } from '@/data/individual';
import { useAppState } from '@/state';
import { colors } from '@/theme';

export const categoryAppearance: Record<IndividualCategory, { icon: keyof typeof Feather.glyphMap; color: string; tint: string }> = {
  Therapy: { icon: 'message-circle', color: colors.plum, tint: colors.plumTint },
  Fitness: { icon: 'activity', color: colors.red, tint: colors.redTint },
  Nutrition: { icon: 'coffee', color: colors.sage, tint: colors.sageTint },
  Physio: { icon: 'heart', color: colors.blue, tint: colors.blueTint },
  Yoga: { icon: 'sun', color: colors.amber, tint: colors.amberTint },
};

export function PersonalSection({ title, action, onPress, children }: { title: string; action?: string; onPress?: () => void; children: ReactNode }) {
  return <View style={ui.section}>
    <View style={ui.sectionHeading}><Text variant="title2" style={{ flexShrink: 1 }}>{title}</Text>{action && onPress ? <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`View ${title.toLowerCase()}`} style={ui.textAction}><Text variant="callout" color={colors.blue}>{action}</Text></Pressable> : null}</View>
    {children}
  </View>;
}

export function PersonalButton({ title, onPress, secondary = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }} style={({ pressed }) => [ui.button, { backgroundColor: secondary ? colors.blueTint : colors.blue, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 }]}><Text variant="headline" align="center" color={secondary ? colors.blue : colors.white} style={{ flexShrink: 1 }}>{title}</Text></Pressable>;
}

export function DemoNotice({ compact = false }: { compact?: boolean }) {
  return <View style={ui.notice}><Text variant="footnote" color={colors.textSecondary}>{compact ? 'Sample health information · personal demo' : 'Sample profiles, qualifications and prices. No real booking or payment.'}</Text></View>;
}

export function PersonalBookingCard({ booking }: { booking: IndividualBooking }) {
  const provider = individualProviders.find((item) => item.id === booking.providerId);
  return <Pressable onPress={() => router.push(`/personal/booking/${booking.id}`)} accessibilityRole="button" accessibilityLabel={`View ${booking.service} with ${provider?.name ?? 'your practitioner'}, ${personalDate(booking.date)}, ${personalTime(booking.time)} ${launchMarket.timeZoneLabel}, ${booking.status}`} style={({ pressed }) => [ui.card, ui.row, pressed && ui.pressed]}>
    <View style={ui.dateTile}><Text variant="caption" color={colors.red}>{new Date(`${booking.date}T12:00:00Z`).toLocaleDateString('en-IN', { month: 'short', timeZone: launchMarket.timeZone }).toUpperCase()}</Text><Text variant="title1">{Number(booking.date.slice(-2))}</Text></View>
    <View style={ui.flex}><Text variant="headline">{booking.service}</Text><Text variant="subhead" color={colors.textSecondary}>{provider?.name ?? 'Practitioner'} · {booking.mode}</Text><Text variant="footnote" color={colors.textSecondary}>{personalTime(booking.time)} · {launchMarket.timeZoneLabel}</Text>{booking.status === 'Cancelled' ? <Text variant="footnote" color={colors.red}>Cancelled</Text> : null}</View><Feather name="chevron-right" size={19} color={colors.textSecondary} />
  </Pressable>;
}

export function PersonalProviderCard({ provider }: { provider: IndividualProvider }) {
  const { individualSavedProviders, toggleIndividualSavedProvider } = useAppState();
  const saved = individualSavedProviders.includes(provider.id);
  const appearance = categoryAppearance[provider.category];
  return <View style={[ui.card, ui.providerCard]}>
    <View style={[ui.row, { alignItems: 'flex-start' }]}>
      <Avatar name={provider.portrait} size={62} />
      <View style={[ui.flex, { paddingTop: 5 }]}><Text variant="title3">{provider.name}</Text><Text variant="subhead" color={appearance.color}>{provider.title}</Text><Text variant="footnote" color={colors.textSecondary}>{provider.location}</Text></View>
      <Pressable onPress={() => toggleIndividualSavedProvider(provider.id)} accessibilityRole="button" accessibilityLabel={`${saved ? 'Unsave' : 'Save'} ${provider.name}`} accessibilityState={{ selected: saved }} style={ui.saveButton}><Feather name={saved ? 'check-circle' : 'bookmark'} size={21} color={colors.blue} /></Pressable>
    </View>
    <Text variant="callout">{provider.focus.join(' · ')}</Text>
    <Text variant="footnote" color={colors.textSecondary}>{provider.qualification}{'\n'}{provider.languages}</Text>
    <View style={[ui.between, ui.providerFooter]}>
      <View style={{ flex: 1, minWidth: 100, gap: 3 }}><Text variant="headline">{personalPrice(provider.price)}<Text variant="footnote" color={colors.textSecondary}> / {provider.duration} min</Text></Text><Text variant="footnote" color={colors.textSecondary}>{provider.modes.join(' · ')}</Text></View>
      <Pressable onPress={() => router.push(`/personal/provider/${provider.id}`)} accessibilityRole="button" accessibilityLabel={`View ${provider.name} and available times`} style={ui.smallButton}><Text variant="headline" color={colors.blue} align="center" style={{ flexShrink: 1 }}>View profile</Text></Pressable>
    </View>
  </View>;
}

export function PersonalAccess() {
  const { setActiveAccountId } = useAppState();
  return <ScreenContainer contentStyle={{ paddingTop: 40, gap: 20 }}><Text variant="title1">Riya’s personal space</Text><Text color={colors.textSecondary}>Switch to Riya to explore personal health and find care.</Text><PersonalButton title="Explore Riya’s demo" onPress={() => { setActiveAccountId('riya'); router.replace('/'); }} /><PersonalButton title="Back to my home" secondary onPress={() => router.replace('/')} /></ScreenContainer>;
}

export const ui = StyleSheet.create({
  page: { gap: 22, paddingTop: 4 },
  section: { gap: 9 },
  sectionHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  card: { backgroundColor: colors.surface, borderRadius: 16, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  between: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  flex: { flex: 1, minWidth: 0, gap: 3 },
  button: { minHeight: 50, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  textAction: { minHeight: 44, alignItems: 'center', flexDirection: 'row', gap: 6 },
  notice: { paddingHorizontal: 3, paddingVertical: 2 },
  dateTile: { minWidth: 52, paddingHorizontal: 8, minHeight: 63, backgroundColor: colors.surfaceMuted, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 1 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7, backgroundColor: colors.surfaceMuted },
  saveButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  smallButton: { minHeight: 44, maxWidth: '100%', borderRadius: 24, paddingHorizontal: 16, backgroundColor: colors.blueTint, alignItems: 'center', justifyContent: 'center' },
  providerCard: { gap: 12 },
  providerFooter: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 12 },
  pressed: { opacity: 0.7 },
});
