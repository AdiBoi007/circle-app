import { useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Avatar, Card, ScreenContainer, ScreenHeader } from '@/components';
import { PersonalText as Text } from '@/accounts/savita/PersonalText';
import { careProfessionals } from '@/data';
import { colors, radius, spacing } from '@/theme';
import type { CareProfessional } from '@/types';

const categories = [
  { id: 'all', label: 'All' },
  { id: 'physiotherapy', label: 'Physiotherapists' },
  { id: 'nutrition', label: 'Dietitians' },
  { id: 'nurse', label: 'Nurses' },
  { id: 'therapy', label: 'Counsellors' },
  { id: 'yoga', label: 'Yoga instructors' },
  { id: 'caregiver', label: 'Caregivers' },
  { id: 'elder-care', label: 'Elder-care professionals' },
  { id: 'trainer', label: 'Fitness trainers' },
];

export function SavitaCare() {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [showAll, setShowAll] = useState(false);
  const visible = useMemo(() => careProfessionals
    .filter((provider) => category === 'all' ? provider.recommendedFor.includes('savita') : provider.category === category)
    .filter((provider) => `${provider.name} ${provider.title} ${provider.specialisations.join(' ')}`.toLowerCase().includes(query.toLowerCase()))
    .sort((a, b) => b.matchScore - a.matchScore), [category, query]);
  const shown = showAll || category !== 'all' || query ? visible : visible.slice(0, 3);

  return (
    <ScreenContainer bottomInset={132} contentStyle={styles.content}>
      <ScreenHeader eyebrow="CARE" title="Find the right care" titleVariant="title1" subtitle="Professionals who can support your health." />
      <View style={styles.search}>
        <Feather name="search" size={22} color={colors.textSecondary} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search by name or care type" placeholderTextColor={colors.textSecondary} accessibilityLabel="Search care professionals" style={styles.searchInput} />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters} style={styles.filterScroll}>
        {categories.map((item) => {
          const selected = item.id === category;
          return <Pressable key={item.id} onPress={() => { setCategory(item.id); setShowAll(false); }} accessibilityRole="button" accessibilityLabel={item.label} accessibilityState={{ selected }} style={({ pressed }) => [styles.filter, selected && styles.filterSelected, pressed && styles.pressed]}><Text variant="headline" color={selected ? colors.white : colors.textPrimary}>{item.label}</Text></Pressable>;
        })}
      </ScrollView>
      <View style={styles.sectionHeader}>
        <Text variant="title2">{category === 'all' ? 'Recommended for you' : categories.find((item) => item.id === category)?.label}</Text>
        {!showAll && category === 'all' && visible.length > 3 ? <Pressable onPress={() => setShowAll(true)} accessibilityRole="button" accessibilityLabel="See all recommended professionals" style={styles.seeAll}><Text variant="headline" color={colors.blue}>See all</Text></Pressable> : null}
      </View>
      <View style={styles.list}>
        {shown.map((provider) => <ProviderCard key={provider.id} provider={provider} />)}
        {!shown.length ? <Card elevation="none" bordered><Text variant="body" color={colors.textSecondary} style={styles.body}>No professionals match this search. Try another category or name.</Text></Card> : null}
      </View>
    </ScreenContainer>
  );
}

function ProviderCard({ provider }: { provider: CareProfessional }) {
  const mode = provider.modes.map((item) => item === 'In person' ? 'Clinic visit' : item).join(' · ');
  return (
    <Card padding={spacing.lg} elevation="none" bordered>
      <View style={styles.providerTop}>
        <Avatar name={provider.name} accent={provider.accent} size={62} />
        <View style={styles.flex}>
          <Text variant="title3">{provider.name}</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.body}>{provider.title}</Text>
        </View>
        <View style={styles.rating}><Feather name="star" size={18} color={colors.amber} /><Text variant="headline">{provider.rating}</Text></View>
      </View>
      <View style={styles.details}>
        <Detail icon="message-circle" text={provider.languages.join(' · ')} />
        <Detail icon="map-pin" text={mode} />
        <Detail icon="clock" text={`Earliest: ${provider.nextSlot}`} />
        <Detail icon="credit-card" text={`${provider.currency}${provider.price}${provider.priceSuffix ?? ''}`} />
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => router.push(`/provider/${provider.id}`)} accessibilityRole="button" accessibilityLabel={`View ${provider.name}'s profile`} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}><Text variant="headline">View profile</Text></Pressable>
        <Pressable onPress={() => router.push(`/booking/new?providerId=${provider.id}&memberId=savita`)} accessibilityRole="button" accessibilityLabel={`Book with ${provider.name}`} style={({ pressed }) => [styles.primary, pressed && styles.pressed]}><Text variant="headline" color={colors.white}>Book</Text></Pressable>
      </View>
    </Card>
  );
}

function Detail({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  return <View style={styles.detail}><Feather name={icon} size={19} color={colors.textSecondary} /><Text variant="body" color={colors.textSecondary} style={[styles.body, styles.flex]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  body: { fontSize: 18, lineHeight: 25 },
  search: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, borderRadius: radius.input, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
  searchInput: { flex: 1, minHeight: 52, fontSize: 18, color: colors.textPrimary },
  filterScroll: { marginHorizontal: -spacing.xl },
  filters: { gap: spacing.sm, paddingHorizontal: spacing.xl },
  filter: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.lg, borderRadius: radius.pill, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
  filterSelected: { backgroundColor: colors.textPrimary, borderColor: colors.textPrimary },
  sectionHeader: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  seeAll: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.sm },
  list: { gap: spacing.md },
  providerTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, minWidth: 0 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  details: { gap: spacing.sm, marginTop: spacing.lg },
  detail: { minHeight: 30, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  secondary: { minHeight: 52, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.button, backgroundColor: colors.surfaceMuted },
  primary: { minHeight: 52, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: radius.button, backgroundColor: colors.blue },
  pressed: { opacity: 0.7 },
});
