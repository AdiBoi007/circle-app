import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Keyboard, Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';

import { Button, DetailHeader, ScreenContainer, Sheet, Text } from '@/components';
import { launchMarket } from '@/config/launch';
import { useAppState } from '@/state';
import { colors, spacing } from '@/theme';
import type { CareMode } from '@/types';
import type { PracticeService } from './types';

type ServiceDraft = { id: string; name: string; description: string; duration: string; price: string; modes: CareMode[]; active: boolean };
const modeOptions: { value: CareMode; icon: 'video' | 'users' | 'home' }[] = [{ value: 'Online', icon: 'video' }, { value: 'In person', icon: 'users' }, { value: 'Home visit', icon: 'home' }];
const editDraft = ({ durationMinutes, priceInr, ...service }: PracticeService): ServiceDraft => ({ ...service, duration: String(durationMinutes), price: String(priceInr), modes: [...service.modes] });

export function PractitionerServices() {
  const { practice, savePracticeService, removePracticeService } = useAppState();
  const [draft, setDraft] = useState<ServiceDraft | null>(null);
  const [editorError, setEditorError] = useState('');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [removeId, setRemoveId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState('');
  const removing = practice.services.find((service) => service.id === removeId);
  const editingExisting = Boolean(draft && practice.services.some((service) => service.id === draft.id));

  function openNew() {
    Keyboard.dismiss();
    setEditorError('');
    setDraft({ id: `practice-service-${Date.now()}`, name: '', description: '', duration: '60', price: '', modes: ['Online'], active: true });
  }

  function update<K extends keyof ServiceDraft>(field: K, value: ServiceDraft[K]) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
    setEditorError('');
  }

  function closeEditor() { Keyboard.dismiss(); setDraft(null); setEditorError(''); }

  function save() {
    if (!draft) return;
    Keyboard.dismiss();
    const service: PracticeService = { id: draft.id, name: draft.name.trim(), description: draft.description.trim(), durationMinutes: draft.duration.trim() ? Number(draft.duration) : Number.NaN, priceInr: draft.price.trim() ? Number(draft.price) : Number.NaN, modes: draft.modes, active: draft.active };
    const result = savePracticeService(service);
    if (!result.ok) { setEditorError(result.error); return; }
    setNotice(`${service.name} ${editingExisting ? 'updated' : 'added'} in your demo services.`);
    setError('');
    closeEditor();
  }

  function setActive(service: PracticeService, active: boolean) {
    Keyboard.dismiss();
    const result = savePracticeService({ ...service, active });
    if (!result.ok) { setError(result.error); setNotice(''); return; }
    setError('');
    setNotice(`${service.name} ${active ? 'enabled for new demo requests' : 'disabled for new demo requests'}.`);
  }

  function remove() {
    if (!removing) return;
    Keyboard.dismiss();
    const result = removePracticeService(removing.id);
    if (!result.ok) { setRemoveError(result.error); return; }
    setNotice(`${removing.name} removed from your demo services.`);
    setError('');
    setRemoveId(null);
    setRemoveError('');
  }

  function disableInstead() {
    if (!removing) return;
    const result = savePracticeService({ ...removing, active: false });
    if (!result.ok) { setRemoveError(result.error); return; }
    setNotice(`${removing.name} disabled. Existing requests keep their details.`);
    setError('');
    setRemoveId(null);
    setRemoveError('');
  }

  return (
    <ScreenContainer edges={['top', 'bottom']} bottomInset={36} contentStyle={styles.page}>
      <DetailHeader title="Services" />
      <View style={styles.intro}><Text variant="title2">Services & prices</Text><Text variant="callout" color={colors.textSecondary}>Set up the appointments people can request in {launchMarket.city}. Prices are in {launchMarket.currency}.</Text></View>
      <Button title="Add service" onPress={openNew} icon={<Feather name="plus" size={20} color={colors.white} />} />
      {notice ? <Text accessibilityLiveRegion="polite" variant="callout" color={colors.textSecondary}>{notice}</Text> : null}
      {error ? <Message message={error} /> : null}

      {practice.services.length ? <View style={styles.group}>{practice.services.map((service, index) => <View key={service.id} style={[styles.service, index > 0 && styles.divider]}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${service.name}`} onPress={() => { setEditorError(''); setDraft(editDraft(service)); }} style={({ pressed }) => [styles.serviceMain, pressed && styles.pressed]}><View style={styles.flex}><Text variant="headline">{service.name}</Text><Text variant="subhead" color={colors.textSecondary}>{service.durationMinutes} min · {launchMarket.currencySymbol}{service.priceInr.toLocaleString('en-IN')}</Text><Text variant="footnote" color={colors.textSecondary}>{service.modes.join(' · ')}</Text></View><Text variant="subhead" color={colors.blue}>Edit</Text></Pressable>
        {service.description ? <Text variant="footnote" color={colors.textSecondary}>{service.description}</Text> : null}
        <View style={styles.serviceControls}><View style={styles.activeControl}><View style={styles.switchTarget}><Switch accessibilityLabel={`Enable ${service.name} for new requests`} value={service.active} onValueChange={(value) => setActive(service, value)} trackColor={{ false: colors.borderStrong, true: colors.blue }} thumbColor={colors.white} /></View><Text variant="footnote" color={colors.textSecondary} style={styles.shrink}>{service.active ? 'Enabled' : 'Disabled'}</Text></View><Pressable accessibilityRole="button" accessibilityLabel={`Remove ${service.name}`} onPress={() => { Keyboard.dismiss(); setRemoveError(''); setRemoveId(service.id); }} style={({ pressed }) => [styles.removeAction, pressed && styles.pressed]}><Feather name="trash-2" size={17} color={colors.red} /><Text variant="footnote" color={colors.red}>Remove</Text></Pressable></View>
      </View>)}</View> : <View style={styles.empty}><Feather name="list" size={32} color={colors.blue} /><Text variant="headline">Add your first service</Text><Text variant="callout" color={colors.textSecondary} align="center">Choose a name, consultation format, duration and example price.</Text></View>}
      <Text variant="footnote" color={colors.textSecondary} style={styles.note}>Demo services and example prices. Saving does not publish a real service, collect a payment or verify qualifications.</Text>

      <Sheet visible={Boolean(draft)} onClose={closeEditor} title={editingExisting ? 'Edit service' : 'Add service'} footer={<View style={styles.footer}><Button title={editingExisting ? 'Save service' : 'Add service'} onPress={save} /><Button title="Cancel" variant="tertiary" onPress={closeEditor} /></View>}>
        {draft ? <View style={styles.form}>
          <View style={styles.field}><Text variant="subhead">Service name</Text><TextInput accessibilityLabel="Service name" value={draft.name} onChangeText={(value) => update('name', value)} placeholder="e.g. Initial physiotherapy consultation" placeholderTextColor={colors.textTertiary} maxLength={100} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} maxFontSizeMultiplier={2} style={styles.input} /></View>
          <View style={styles.field}><Text variant="subhead">Description</Text><TextInput accessibilityLabel="Service description" value={draft.description} onChangeText={(value) => update('description', value)} placeholder="What is included in this appointment?" placeholderTextColor={colors.textTertiary} multiline maxLength={600} maxFontSizeMultiplier={2} style={[styles.input, styles.multiline]} /></View>
          <View style={styles.numbers}><View style={[styles.field, styles.numberField]}><Text variant="subhead">Duration (minutes)</Text><TextInput accessibilityLabel="Duration in minutes, between 15 and 180" value={draft.duration} onChangeText={(value) => update('duration', value)} placeholder="60" placeholderTextColor={colors.textTertiary} keyboardType="number-pad" maxLength={3} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} maxFontSizeMultiplier={2} style={styles.input} /><Text variant="footnote" color={colors.textSecondary}>15–180 minutes</Text></View><View style={[styles.field, styles.numberField]}><Text variant="subhead">Price ({launchMarket.currencySymbol})</Text><TextInput accessibilityLabel="Service price in Indian rupees" value={draft.price} onChangeText={(value) => update('price', value)} placeholder="1200" placeholderTextColor={colors.textTertiary} keyboardType="number-pad" maxLength={6} returnKeyType="done" onSubmitEditing={Keyboard.dismiss} maxFontSizeMultiplier={2} style={styles.input} /><Text variant="footnote" color={colors.textSecondary}>₹1–₹1,00,000 · whole rupees</Text></View></View>
          <View style={styles.field}><Text variant="subhead">Consultation formats</Text><Text variant="footnote" color={colors.textSecondary}>Choose at least one.</Text><View style={styles.modeOptions}>{modeOptions.map(({ value, icon }) => {
            const selected = draft.modes.includes(value);
            return <Pressable key={value} accessibilityRole="checkbox" accessibilityLabel={value} accessibilityState={{ checked: selected }} onPress={() => { Keyboard.dismiss(); update('modes', selected ? draft.modes.filter((mode) => mode !== value) : [...draft.modes, value]); }} style={[styles.mode, selected && styles.selectedMode]}><Feather name={icon} size={19} color={selected ? colors.blue : colors.textSecondary} /><Text variant="subhead" color={selected ? colors.blue : colors.textPrimary} style={styles.flex}>{value}</Text><Feather name={selected ? 'check-square' : 'square'} size={19} color={selected ? colors.blue : colors.textTertiary} /></Pressable>;
          })}</View></View>
          <View style={styles.editorActive}><View style={styles.flex}><Text variant="headline">Enabled for requests</Text><Text variant="footnote" color={colors.textSecondary}>Disabled services remain in your workspace.</Text></View><View style={styles.switchTarget}><Switch accessibilityLabel="Enable this service for requests" value={draft.active} onValueChange={(value) => { Keyboard.dismiss(); update('active', value); }} trackColor={{ false: colors.borderStrong, true: colors.blue }} thumbColor={colors.white} /></View></View>
          {editorError ? <Message message={editorError} /> : null}
        </View> : null}
      </Sheet>

      <Sheet visible={Boolean(removing)} onClose={() => { Keyboard.dismiss(); setRemoveId(null); setRemoveError(''); }} title="Remove service?" footer={<View style={styles.footer}><Button title="Remove service" onPress={remove} /><Button title="Keep service" variant="tertiary" onPress={() => { setRemoveId(null); setRemoveError(''); }} /></View>}>
        {removing ? <View style={styles.form}><Text variant="headline">{removing.name}</Text><Text variant="callout" color={colors.textSecondary}>Remove this service from your demo workspace. If it has appointment requests, you can disable it to stop new requests.</Text>{removeError ? <Message message={removeError} /> : null}{removing.active ? <Button title="Disable service instead" variant="secondary" onPress={disableInstead} /> : null}</View> : null}
      </Sheet>
    </ScreenContainer>
  );
}

function Message({ message }: { message: string }) {
  return <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}><Feather name="alert-circle" size={20} color={colors.red} /><Text variant="callout" color={colors.red} style={styles.flex}>{message}</Text></View>;
}

const styles = StyleSheet.create({
  page: { gap: spacing.xl },
  flex: { flex: 1, minWidth: 0, gap: spacing.xs },
  shrink: { flexShrink: 1, minWidth: 0 },
  intro: { gap: spacing.sm },
  group: { backgroundColor: colors.surface, borderRadius: 20, paddingHorizontal: spacing.lg, overflow: 'hidden' },
  service: { paddingVertical: spacing.md, gap: spacing.sm },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  serviceMain: { minHeight: 64, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xs },
  serviceControls: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  activeControl: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  switchTarget: { minWidth: 56, minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  removeAction: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm },
  empty: { padding: spacing.xxl, backgroundColor: colors.surface, borderRadius: 20, alignItems: 'center', gap: spacing.md },
  note: { paddingHorizontal: spacing.lg },
  form: { gap: spacing.xl },
  field: { gap: spacing.sm },
  input: { minHeight: 50, borderRadius: 12, backgroundColor: colors.background, color: colors.textPrimary, fontSize: 17, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderWidth: 1, borderColor: colors.border },
  multiline: { minHeight: 100, lineHeight: 25, textAlignVertical: 'top' },
  numbers: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  numberField: { flexGrow: 1, flexBasis: 120, minWidth: 120, maxWidth: '100%' },
  modeOptions: { gap: spacing.sm },
  mode: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: 12, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  selectedMode: { borderColor: colors.blue, backgroundColor: colors.blueTint },
  editorActive: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  error: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md, borderRadius: 12, backgroundColor: colors.redTint },
  footer: { gap: spacing.xs },
  pressed: { opacity: 0.65 },
});
