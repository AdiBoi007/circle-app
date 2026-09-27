import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { PracticeDirectoryCard } from '@/practitioner/PracticeDirectoryCard';
import { practiceMatchesFilters } from '@/practitioner/directory';
import { launchMarket } from '@/config/launch';
import { ScreenContainer, Text } from '@/components';
import { individualCategories, individualProviders, type IndividualCategory } from '@/data/individual';
import { ExperienceHeader } from '@/experience/ExperienceHeader';
import { useAppState } from '@/state';
import { colors } from '@/theme';
import { categoryAppearance, DemoNotice, PersonalProviderCard, ui } from './PersonalUI';

export function IndividualCare() {
  const params = useLocalSearchParams<{ category?: string }>();
  const category = params.category && individualCategories.includes(params.category as IndividualCategory) ? params.category as IndividualCategory : 'All';
  const setCategory = (value: IndividualCategory | 'All') => router.setParams({ category: value });
  const [mode, setMode] = useState('Any format');
  const [query, setQuery] = useState('');
  const [savedOnly, setSavedOnly] = useState(false);
  const { individualSavedProviders, practice } = useAppState();
  const filtered = individualProviders.filter((provider) => (category === 'All' || provider.category === category) && (mode === 'Any format' || provider.modes.some((item) => item === mode)) && (!savedOnly || individualSavedProviders.includes(provider.id)) && `${provider.name} ${provider.title} ${provider.category} ${provider.focus.join(' ')} ${provider.languages}`.toLowerCase().includes(query.trim().toLowerCase()));

  const showPractice = practiceMatchesFilters(practice, { category, mode, query }) && (!savedOnly || individualSavedProviders.includes('arvind-nair'));
  const count = filtered.length + Number(showPractice);

  return <ScreenContainer bottomInset={32} contentStyle={styles.page}>
    <ExperienceHeader title="Find care" subtitle="Support for your mind and body." />
    <View style={styles.search}><Feather name="search" size={19} color={colors.textSecondary} /><TextInput value={query} onChangeText={setQuery} placeholder="Name, specialty or language" placeholderTextColor={colors.textSecondary} accessibilityLabel="Search practitioners by name, focus or language" style={styles.input} returnKeyType="search" />{query ? <Pressable onPress={() => setQuery('')} accessibilityRole="button" accessibilityLabel="Clear search" style={styles.clear}><Feather name="x-circle" size={19} color={colors.textSecondary} /></Pressable> : null}</View>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categories}>{(['All', ...individualCategories] as const).map((item) => <Pressable key={item} onPress={() => setCategory(item)} accessibilityRole="button" accessibilityState={{ selected: item === category }} style={[styles.category, item === category && styles.categoryActive]}>{item !== 'All' ? <Feather name={categoryAppearance[item].icon} size={16} color={item === category ? colors.white : categoryAppearance[item].color} /> : null}<Text variant="subhead" color={item === category ? colors.white : colors.textPrimary}>{item}</Text></Pressable>)}</ScrollView>
    <View style={styles.formatRow}>{['Any format', 'Online', 'In person'].map((item) => <Pressable key={item} onPress={() => setMode(item)} accessibilityRole="button" accessibilityState={{ selected: item === mode }} style={[styles.format, item === mode && styles.formatActive]}><Text variant="subhead" color={colors.textPrimary} align="center">{item}</Text></Pressable>)}</View>
    <View style={ui.between}><View style={[ui.row, { gap: 5, flex: 1, minWidth: 160 }]}><Feather name="map-pin" size={14} color={colors.textSecondary} /><Text variant="footnote" color={colors.textSecondary} style={{ flexShrink: 1 }}>{mode === 'Online' ? `${launchMarket.city} · online · ${launchMarket.timeZoneLabel}` : launchMarket.regionLabel}</Text></View><Pressable onPress={() => setSavedOnly(!savedOnly)} accessibilityRole="button" accessibilityState={{ selected: savedOnly }} style={ui.textAction}><Feather name="bookmark" size={17} color={colors.blue} /><Text variant="callout" color={colors.blue}>{savedOnly ? 'Saved only ✓' : 'Saved'}</Text></Pressable></View>
    <View style={{ gap: 12 }}><View style={ui.between}><Text variant="title2" style={{ flexShrink: 1 }}>{savedOnly ? 'Saved practitioners' : category === 'All' ? 'Practitioners' : category}</Text><Text variant="footnote" color={colors.textSecondary}>{count} {count === 1 ? 'profile' : 'profiles'}</Text></View>
      <DemoNotice />
      {showPractice ? <PracticeDirectoryCard /> : null}
      {count ? filtered.map((provider) => <PersonalProviderCard key={provider.id} provider={provider} />) : <View style={[ui.card, { gap: 12 }]}><Text variant="headline">No matching profiles</Text><Text variant="callout" color={colors.textSecondary}>Try another category or clear your filters. This preview contains sample practitioners only.</Text><Pressable onPress={() => { setQuery(''); setMode('Any format'); setCategory('All'); setSavedOnly(false); }} accessibilityRole="button" style={ui.textAction}><Text variant="headline" color={colors.blue}>Clear filters</Text></Pressable></View>}
    </View>
    <Pressable onPress={() => router.push('/personal/bookings')} accessibilityRole="button" style={[ui.card, ui.row]}><View style={styles.appointmentIcon}><Feather name="calendar" size={20} color={colors.blue} /></View><View style={ui.flex}><Text variant="headline">My appointments</Text><Text variant="footnote" color={colors.textSecondary}>View or change your demo bookings</Text></View><Feather name="chevron-right" size={18} color={colors.textSecondary} /></Pressable>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  page: { gap: 16, paddingTop: 4 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: colors.surfaceMuted, borderRadius: 12, paddingHorizontal: 12, minHeight: 46 },
  input: { flex: 1, minWidth: 0, minHeight: 46, fontSize: 17, color: colors.textPrimary },
  clear: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  categories: { gap: 8, paddingVertical: 2 },
  category: { minHeight: 44, borderRadius: 22, paddingHorizontal: 15, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  categoryActive: { backgroundColor: colors.blue },
  formatRow: { flexDirection: 'row', padding: 3, backgroundColor: colors.surfaceMuted, borderRadius: 11, gap: 3 },
  format: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 44, padding: 6, borderRadius: 8 },
  formatActive: { backgroundColor: colors.surface, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' },
  appointmentIcon: { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueTint },
});
