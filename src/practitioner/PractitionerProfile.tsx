import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Switch, TextInput, View, type KeyboardTypeOptions } from 'react-native';

import { Button, DetailHeader, ScreenContainer, Text } from '@/components';
import { launchMarket } from '@/config/launch';
import { useAppState } from '@/state';
import { colors, spacing } from '@/theme';
import type { PracticeCategory, PracticeProfile } from './types';

const categories: PracticeCategory[] = ['Physiotherapy', 'Therapy', 'Fitness', 'Nutrition', 'Yoga'];
type ProfileDraft = Omit<PracticeProfile, 'languages'> & { languagesText: string };
const toDraft = ({ languages, ...profile }: PracticeProfile): ProfileDraft => ({ ...profile, languagesText: languages.join(', ') });

export function PractitionerProfile() {
  const { practice, savePracticeProfile } = useAppState();
  const [editedDraft, setDraft] = useState<ProfileDraft | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const draft = editedDraft ?? toDraft(practice.profile);
  const dirty = JSON.stringify(draft) !== JSON.stringify(toDraft(practice.profile));

  function update<K extends keyof ProfileDraft>(field: K, value: ProfileDraft[K]) {
    setDraft((current) => ({ ...(current ?? toDraft(practice.profile)), [field]: value }));
    setError('');
    setNotice('');
  }

  function save() {
    Keyboard.dismiss();
    const profile: PracticeProfile = {
      name: draft.name.trim(), title: draft.title.trim(), category: draft.category,
      bio: draft.bio.trim(), qualification: draft.qualification.trim(),
      languages: [...new Set(draft.languagesText.split(',').map((item) => item.trim()).filter(Boolean))],
      address: draft.address.trim(), email: draft.email.trim(), phone: draft.phone.trim(),
      acceptingRequests: draft.acceptingRequests,
    };
    const result = savePracticeProfile(profile);
    if (!result.ok) { setError(result.error); setNotice(''); return; }
    setDraft(null);
    setError('');
    setNotice('Your sample practice profile has been saved.');
  }

  function cancel() {
    Keyboard.dismiss();
    setDraft(null);
    setError('');
    setNotice('Unsaved changes discarded.');
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenContainer edges={['top', 'bottom']} bottomInset={36} contentStyle={styles.page}>
        <DetailHeader title="My practice" />

        <View style={styles.identity}><View style={styles.avatar}><Feather name="briefcase" size={28} color={colors.blue} /></View><View style={styles.flex}><Text variant="title2">{practice.profile.name}</Text><Text variant="subhead" color={colors.textSecondary}>{launchMarket.regionLabel}</Text><Text variant="footnote" color={colors.amber}>Sample profile · Not verified</Text></View></View>

        <Pressable accessibilityRole="button" accessibilityLabel="Preview saved public practice profile" onPress={() => { Keyboard.dismiss(); router.push('/practitioner-profile' as Href); }} style={({ pressed }) => [styles.link, pressed && styles.pressed]}><Feather name="eye" size={22} color={colors.blue} /><View style={styles.flex}><Text variant="headline">Public preview</Text><Text variant="footnote" color={colors.textSecondary}>See the profile your saved details create</Text></View><Feather name="chevron-right" size={18} color={colors.textTertiary} /></Pressable>

        <View style={styles.section}><Text variant="title3">Public details</Text><View style={styles.group}>
          <ProfileField label="Full name" value={draft.name} onChangeText={(value) => update('name', value)} placeholder="Your full name" maxLength={80} />
          <ProfileField label="Professional title" value={draft.title} onChangeText={(value) => update('title', value)} placeholder="e.g. Physiotherapist" maxLength={100} />
          <View style={styles.field}><Text variant="footnote" color={colors.textSecondary}>Category</Text><View style={styles.categories}>{categories.map((category) => <Pressable key={category} accessibilityRole="radio" accessibilityLabel={`${category} category`} accessibilityState={{ checked: draft.category === category }} onPress={() => { Keyboard.dismiss(); update('category', category); }} style={[styles.category, draft.category === category && styles.selectedCategory]}><Text variant="subhead" color={draft.category === category ? colors.blue : colors.textPrimary} style={styles.shrink}>{category}</Text>{draft.category === category ? <Feather name="check" size={16} color={colors.blue} /> : null}</Pressable>)}</View></View>
          <ProfileField label="About your practice" value={draft.bio} onChangeText={(value) => update('bio', value)} placeholder="Describe your approach and the people you support (at least 30 characters)." multiline maxLength={1200} last />
        </View></View>

        <View style={styles.section}><Text variant="title3">Qualifications & languages</Text><View style={styles.group}>
          <ProfileField label="Qualification" value={draft.qualification} onChangeText={(value) => update('qualification', value)} placeholder="Sample qualification" multiline maxLength={200} />
          <ProfileField label="Languages" value={draft.languagesText} onChangeText={(value) => update('languagesText', value)} placeholder="English, Hindi, Punjabi" maxLength={200} last />
        </View><Text variant="footnote" color={colors.textSecondary} style={styles.sectionNote}>Separate languages with commas. Qualifications are sample information and are not verified. No documents are uploaded in this demo.</Text></View>

        <View style={styles.section}><Text variant="title3">Practice location & contact</Text><View style={styles.group}>
          <View style={styles.field}><Text variant="footnote" color={colors.textSecondary}>Beta service area</Text><Text variant="body" style={styles.readOnly}>{launchMarket.regionLabel}</Text></View>
          <ProfileField label="Practice address" value={draft.address} onChangeText={(value) => update('address', value)} placeholder="Chandigarh practice address" multiline maxLength={200} />
          <ProfileField label="Contact email" value={draft.email} onChangeText={(value) => update('email', value)} placeholder="name@example.com" keyboardType="email-address" maxLength={160} />
          <ProfileField label="Contact phone (optional)" value={draft.phone} onChangeText={(value) => update('phone', value)} placeholder="+91 phone number" keyboardType="phone-pad" maxLength={20} last />
        </View><Text variant="footnote" color={colors.textSecondary} style={styles.sectionNote}>Use sample contact details. This preview does not send messages or contact clients.</Text></View>

        <View style={styles.group}><View style={styles.requestRow}><View style={styles.flex}><Text variant="headline">Accept appointment requests</Text><Text variant="footnote" color={colors.textSecondary}>When off, new requests pause after you save.</Text></View><View style={styles.switchTarget}><Switch accessibilityLabel="Accept appointment requests" value={draft.acceptingRequests} onValueChange={(value) => { Keyboard.dismiss(); update('acceptingRequests', value); }} trackColor={{ false: colors.borderStrong, true: colors.blue }} thumbColor={colors.white} /></View></View></View>

        {error ? <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}><Feather name="alert-circle" size={20} color={colors.red} /><Text variant="callout" color={colors.red} style={styles.flex}>{error}</Text></View> : null}
        {notice ? <Text accessibilityLiveRegion="polite" variant="callout" color={colors.textSecondary}>{notice}</Text> : null}
        <View style={styles.actions}><Button title="Save changes" onPress={save} disabled={!dirty} /><Button title="Cancel changes" onPress={cancel} variant="tertiary" disabled={!dirty} /></View>

        <Pressable accessibilityRole="button" accessibilityLabel="Manage your practice services" onPress={() => { Keyboard.dismiss(); router.push('/practice/services' as Href); }} style={({ pressed }) => [styles.link, pressed && styles.pressed]}><Feather name="list" size={22} color={colors.blue} /><View style={styles.flex}><Text variant="headline">Services & prices</Text><Text variant="footnote" color={colors.textSecondary}>{practice.services.filter((service) => service.active).length} enabled · {launchMarket.currency}</Text></View><Feather name="chevron-right" size={18} color={colors.textTertiary} /></Pressable>
        <Text variant="footnote" color={colors.textSecondary} style={styles.sectionNote}>Demo workspace. Saving updates this preview; it does not publish a real practitioner listing.</Text>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

function ProfileField({ label, value, onChangeText, placeholder, multiline = false, keyboardType = 'default', maxLength, last = false }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; multiline?: boolean; keyboardType?: KeyboardTypeOptions; maxLength: number; last?: boolean }) {
  return <View style={[styles.field, last && styles.lastField]}><Text variant="footnote" color={colors.textSecondary}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.textTertiary} keyboardType={keyboardType} autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'} autoCorrect={keyboardType === 'default'} multiline={multiline} maxLength={maxLength} maxFontSizeMultiplier={2} returnKeyType={multiline ? 'default' : 'done'} onSubmitEditing={multiline ? undefined : Keyboard.dismiss} style={[styles.input, multiline && styles.multiline]} /></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  page: { gap: spacing.xxl },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
  shrink: { flexShrink: 1 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  avatar: { width: 64, height: 64, borderRadius: 18, backgroundColor: colors.blueTint, alignItems: 'center', justifyContent: 'center' },
  section: { gap: spacing.md },
  group: { borderRadius: 20, backgroundColor: colors.surface, overflow: 'hidden', paddingHorizontal: spacing.lg },
  field: { paddingTop: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, gap: spacing.xs },
  lastField: { borderBottomWidth: 0 },
  input: { minHeight: 48, color: colors.textPrimary, fontSize: 17, paddingVertical: spacing.md, paddingHorizontal: 0 },
  multiline: { minHeight: 100, textAlignVertical: 'top', lineHeight: 25 },
  readOnly: { paddingVertical: spacing.md },
  categories: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingVertical: spacing.sm },
  category: { minHeight: 48, maxWidth: '100%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.background, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  selectedCategory: { backgroundColor: colors.blueTint, borderColor: colors.blue },
  sectionNote: { paddingHorizontal: spacing.lg },
  requestRow: { minHeight: 88, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.lg },
  switchTarget: { minWidth: 56, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  error: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.lg, backgroundColor: colors.redTint, borderRadius: 14 },
  actions: { gap: spacing.xs },
  link: { minHeight: 84, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: 20, backgroundColor: colors.surface },
  pressed: { opacity: 0.65 },
});
