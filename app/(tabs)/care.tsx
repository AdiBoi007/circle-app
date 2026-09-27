import { launchMarket } from '@/config/launch';
import { availableCareModes as eligibleModes } from '@/utils/careEligibility';
import { useMemo, useState, type ReactNode } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ConsumerPracticeRequests } from '@/practitioner/ConsumerPracticeRequests';
import { practiceDirectoryEntry } from '@/practitioner/directory';
import { IndividualCare } from '@/accounts/individual/IndividualCare';
import { SavitaCare } from '@/accounts/savita/SavitaCare';
import { Avatar, Button, ScreenContainer, Sheet, Text } from '@/components';
import { careCategories, careProfessionals, family } from '@/data';
import { ExperienceHeader } from '@/experience/ExperienceHeader';
import { useAppState } from '@/state';
import { colors } from '@/theme';
import type { CareMode, CareProfessional, FeatherIconName, MemberId } from '@/types';

const sage = colors.blue;
const modes = ['Any format', 'Online', 'In person', 'Home visit'] as const;

export default function CareScreen() {
  const { activeAccountId } = useAppState();
  if (activeAccountId === 'riya') return <IndividualCare />;
  if (activeAccountId === 'savita') return <SavitaCare />;
  return <FamilyCare />;
}

function FamilyCare() {
  const params = useLocalSearchParams<{ memberId?: MemberId; category?: string }>();
  const { bookings, savedProviders, toggleSavedProvider, practice } = useAppState();
  const [memberId, setMemberId] = useState<MemberId>(family.some((person) => person.id === params.memberId) ? params.memberId! : 'rajiv');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(careCategories.some((item) => item.id === params.category) ? params.category! : 'all');
  const [mode, setMode] = useState<typeof modes[number]>('Any format');
  const [language, setLanguage] = useState('Any language');
  const [sort, setSort] = useState('Name');
  const [savedOnly, setSavedOnly] = useState(false);
  const [moreFilters, setMoreFilters] = useState(false);
  const member = family.find((person) => person.id === memberId)!;
  const selectedLocation = launchMarket.city;
  const confirmedBookings = bookings.filter((booking) => booking.status === 'Confirmed');

  const visible = useMemo(() => careProfessionals.map((pro) => pro.id === 'arvind-nair' ? practiceDirectoryEntry(practice) : pro).filter((pro) => {
    const availableModes = eligibleModes(pro, memberId);
    return availableModes.length > 0 &&
      (category === 'all' || pro.category === category) &&
      (mode === 'Any format' || availableModes.includes(mode)) &&
      (language === 'Any language' || pro.languages.includes(language)) &&
      (!savedOnly || savedProviders.includes(pro.id)) &&
      `${pro.name} ${pro.title} ${pro.specialisations.join(' ')} ${pro.languages.join(' ')} ${pro.location}`.toLowerCase().includes(query.trim().toLowerCase());
  }).sort((a, b) => sort === 'Price: low to high' ? a.price - b.price : a.name.localeCompare(b.name)), [memberId, category, mode, language, savedOnly, savedProviders, query, sort, practice]);

  function resetFilters() {
    setQuery(''); setCategory('all'); setMode('Any format'); setLanguage('Any language'); setSort('Name'); setSavedOnly(false);
  }

  return (
    <ScreenContainer bottomInset={36} contentStyle={styles.page}>
      <ExperienceHeader eyebrow="SUPPORT FOR YOUR PEOPLE" title="Find care" subtitle="The right support for your family." />

      <Pressable accessibilityRole="button" accessibilityLabel="Open all family appointments" onPress={() => router.push('/calendar')} style={({ pressed }) => [styles.appointments, pressed && styles.pressed]}>
        <View style={styles.appointmentIcon}><Feather name="calendar" size={22} color={sage} /></View>
        <View style={styles.flex}><Text variant="headline">Family appointments</Text><Text variant="footnote" color={colors.textSecondary}>{confirmedBookings.length} booked in your demo calendar</Text></View>
        <Feather name="arrow-up-right" size={22} color={sage} />
      </Pressable>

      <ConsumerPracticeRequests limit={2} activeOnly />

      <View style={styles.search}>
        <Feather name="search" size={21} color={colors.textSecondary} />
        <TextInput value={query} onChangeText={setQuery} accessibilityLabel="Search professionals by name, specialty, language or location" placeholder="Try dietitian, mobility, therapist…" placeholderTextColor={colors.textSecondary} returnKeyType="search" style={styles.searchInput} />
        {query ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} style={styles.clear}><Feather name="x" size={20} color={colors.textSecondary} /></Pressable> : null}
      </View>

      <View style={styles.filterGroup}>
        <FilterRow title="Care for" detail={launchMarket.regionLabel}>
          {family.map((person) => <FilterChip key={person.id} title={person.name.split(' ')[0]!} selected={memberId === person.id} onPress={() => setMemberId(person.id)} />)}
        </FilterRow>
        <FilterRow title="Specialty">
          {careCategories.map((item) => <FilterChip key={item.id} title={item.label} icon={item.icon} selected={category === item.id} onPress={() => setCategory(item.id)} />)}
        </FilterRow>
        <FilterRow title="Consultation">
          {modes.map((item) => <FilterChip key={item} title={item} selected={mode === item} onPress={() => setMode(item)} />)}
        </FilterRow>
        <View style={styles.utilityRow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Choose language and price sorting" onPress={() => setMoreFilters(true)} style={styles.utilityAction}><Feather name="sliders" size={17} color={sage} /><Text variant="subhead" color={sage}>{language === 'Any language' ? 'Language & sort' : language}</Text></Pressable>
          <Pressable accessibilityRole="button" accessibilityState={{ selected: savedOnly }} accessibilityLabel={savedOnly ? 'Show all professionals' : 'Show saved professionals only'} onPress={() => setSavedOnly(!savedOnly)} style={styles.utilityAction}><Feather name="bookmark" size={17} color={sage} /><Text variant="subhead" color={sage}>{savedOnly ? 'Saved only ✓' : 'Saved'}</Text></Pressable>
        </View>
      </View>

      <View style={styles.demoNotice}><Feather name="info" size={17} color={colors.textSecondary} /><Text variant="footnote" color={colors.textSecondary} style={styles.flex}>Sample directory. Profiles, prices and bookings are for this preview.</Text></View>

      <View style={styles.results}>
        <View style={styles.resultsHeading}><View style={styles.flex}><Text variant="title3">{savedOnly ? 'Your shortlist' : `Explore care for ${member.name.split(' ')[0]}`}</Text><Text variant="footnote" color={colors.textSecondary}>{selectedLocation} · {sort === 'Name' ? 'Alphabetical' : 'Price: low to high'}</Text></View><Text variant="footnote" color={colors.textSecondary}>{visible.length} profiles</Text></View>
        {visible.length ? visible.map((pro) => <ProfessionalCard key={pro.id} pro={pro} memberId={memberId} modes={eligibleModes(pro, memberId)} saved={savedProviders.includes(pro.id)} onSave={() => toggleSavedProvider(pro.id)} />) : <View style={styles.empty}><View style={styles.emptyIcon}><Feather name="search" size={26} color={sage} /></View><Text variant="title3">A little more room to search?</Text><Text variant="callout" color={colors.textSecondary} align="center">There are no sample profiles with these filters for {member.name.split(' ')[0]}. Try another specialty or format.</Text><Button title="Clear search filters" variant="secondary" onPress={resetFilters} /></View>}
      </View>

      <Sheet visible={moreFilters} onClose={() => setMoreFilters(false)} title="Make it work for you" footer={<Button title={`Show ${visible.length} profiles`} onPress={() => setMoreFilters(false)} />}>
        <View style={styles.filterGroup}><FilterRow title="Language">{['Any language', 'English', 'Hindi', 'Punjabi'].map((item) => <FilterChip key={item} title={item} selected={language === item} onPress={() => setLanguage(item)} />)}</FilterRow><FilterRow title="Sort profiles">{['Name', 'Price: low to high'].map((item) => <FilterChip key={item} title={item} selected={sort === item} onPress={() => setSort(item)} />)}</FilterRow><Text variant="footnote" color={colors.textSecondary}>Prices are shown in Indian rupees (₹) for {member.name.split(' ')[0]}.</Text><Button title="Reset filters" variant="tertiary" onPress={resetFilters} /></View>
      </Sheet>
    </ScreenContainer>
  );
}

function ProfessionalCard({ pro, memberId, modes: availableModes, saved, onSave }: { pro: CareProfessional; memberId: MemberId; modes: CareMode[]; saved: boolean; onSave: () => void }) {
  const openProfile = () => {
    if (!eligibleModes(pro, memberId).length) return;
    router.push({ pathname: '/provider/[id]', params: { id: pro.id, memberId } });
  };
  return (
    <View style={styles.provider}>
      <View style={styles.providerTop}>
        <Pressable accessibilityRole="button" accessibilityLabel={`View ${pro.name}, ${pro.title}`} onPress={openProfile} style={({ pressed }) => [styles.providerIdentity, pressed && styles.pressed]}>
          <Avatar name={pro.name} accent={pro.accent} size={56} />
          <View style={styles.flex}><Text variant="headline">{pro.name}</Text><Text variant="subhead" color={colors.textSecondary}>{pro.title}</Text></View>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={`${saved ? 'Unsave' : 'Save'} ${pro.name}`} accessibilityState={{ selected: saved }} onPress={onSave} style={[styles.saveButton, saved && styles.savedButton]}><Feather name={saved ? 'check' : 'bookmark'} size={20} color={sage} /></Pressable>
      </View>
      <Text variant="callout" color={colors.textSecondary}>{pro.specialisations[0]}</Text>
      <View style={styles.providerDetails}><View style={styles.detail}><Feather name="map-pin" size={14} color={colors.textSecondary} /><Text variant="footnote" color={colors.textSecondary}>{pro.location.replace(' · Online', '')}</Text></View><View style={styles.detail}><Feather name="message-circle" size={14} color={colors.textSecondary} /><Text variant="footnote" color={colors.textSecondary}>{pro.languages.join(', ')}</Text></View></View>
      <View style={styles.modeTags}>{availableModes.map((item) => <View key={item} style={styles.modeTag}><Feather name={item === 'Online' ? 'video' : item === 'Home visit' ? 'home' : 'users'} size={13} color={sage} /><Text variant="caption" color={sage}>{item}</Text></View>)}</View>
      <View style={styles.providerFooter}><View style={styles.flex}><Text variant="title3">{pro.currency}{pro.price}<Text variant="footnote" color={colors.textSecondary}>{pro.priceSuffix ?? ' / session'}</Text></Text><Text variant="caption" color={colors.textSecondary}>Sample price</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`View ${pro.name}’s profile for ${memberId}`} onPress={openProfile} style={({ pressed }) => [styles.profileButton, pressed && styles.pressed]}><Text variant="subhead" color="#FFFFFF">View profile</Text><Feather name="arrow-right" size={17} color="#FFFFFF" /></Pressable></View>
    </View>
  );
}

function FilterRow({ title, detail, children }: { title: string; detail?: string; children: ReactNode }) {
  return <View style={styles.filterRow}><View style={styles.filterLabel}><Text variant="overline" color={colors.textSecondary}>{title.toUpperCase()}</Text>{detail ? <Text variant="caption" color={colors.textSecondary}>{detail}</Text> : null}</View><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>{children}</ScrollView></View>;
}

function FilterChip({ title, selected, icon, onPress }: { title: string; selected: boolean; icon?: FeatherIconName; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ selected }} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>{icon ? <Feather name={icon} size={16} color={selected ? '#FFFFFF' : colors.textSecondary} /> : null}<Text variant="subhead" color={selected ? '#FFFFFF' : colors.textPrimary}>{title}</Text></Pressable>;
}

/** Match country and physical service area before exposing a profile to book. */


const styles = StyleSheet.create({
  page: { gap: 22 },
  flex: { flex: 1, minWidth: 0 },
  appointments: { backgroundColor: colors.blueTint, borderRadius: 21, padding: 15, minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: 12 },
  appointmentIcon: { width: 44, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 14 },
  search: { minHeight: 60, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 19, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15 },
  searchInput: { flex: 1, minWidth: 0, minHeight: 58, fontSize: 16, color: colors.textPrimary },
  clear: { width: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  filterGroup: { gap: 17 },
  filterRow: { gap: 8 },
  filterLabel: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  filterScroll: { gap: 8, paddingRight: 5 },
  chip: { minHeight: 48, paddingHorizontal: 17, paddingVertical: 9, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', gap: 7 },
  chipSelected: { backgroundColor: sage, borderColor: sage },
  utilityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  utilityAction: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 48 },
  demoNotice: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 13, backgroundColor: colors.surfaceMuted, borderRadius: 14 },
  results: { gap: 16 },
  resultsHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  provider: { padding: 18, backgroundColor: colors.surface, borderRadius: 20, borderWidth: 0, borderColor: colors.border, gap: 13 },
  providerTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  providerIdentity: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 62 },
  saveButton: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.surfaceMuted },
  savedButton: { backgroundColor: colors.blueTint },
  providerDetails: { gap: 6 },
  detail: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  modeTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  modeTag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.blueTint, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 9 },
  providerFooter: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14, marginTop: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  profileButton: { backgroundColor: sage, borderRadius: 24, paddingHorizontal: 17, minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9 },
  empty: { backgroundColor: colors.surface, borderRadius: 24, padding: 23, gap: 15, alignItems: 'center' },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.blueTint, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.7 },
});
