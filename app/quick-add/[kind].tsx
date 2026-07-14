import { useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, DetailHeader, ScreenContainer, Segmented, Text } from '@/components';
import { family } from '@/data';
import { useAppState } from '@/state';
import { colors, radius, spacing } from '@/theme';
import type { HealthRecord, MemberId, TodayItem } from '@/types';

const copy: Record<string, { title: string; description: string; button: string }> = {
  upload: { title: 'Upload report', description: 'Add a local document to the family record vault.', button: 'Choose document' },
  reading: { title: 'Log health reading', description: 'Record a reading manually for the selected person.', button: 'Save reading' },
  medication: { title: 'Add medication', description: 'Add a medicine and schedule to the local family overview.', button: 'Add medication' },
  reminder: { title: 'Create reminder', description: 'Create a family reminder stored on this device.', button: 'Create reminder' },
  task: { title: 'Assign family task', description: 'Give a practical care task to one person.', button: 'Assign task' },
  care: { title: 'Book care', description: 'Browse the verified non-doctor care network.', button: 'Browse care' },
};

export default function QuickAddScreen() {
  const { kind = 'task' } = useLocalSearchParams<{ kind: string }>();
  const config = copy[kind] ?? copy.task;
  const { addRecord, addTask } = useAppState();
  const [memberId, setMemberId] = useState<MemberId>('rajiv');
  const [title, setTitle] = useState(''); const [note, setNote] = useState(''); const [stage, setStage] = useState(0);
  const memberOptions = useMemo(() => family.map((member) => member.name.split(' ')[0]!) as [string, ...string[]], []);
  const memberName = family.find((member) => member.id === memberId)!.name.split(' ')[0]!;

  const submit = () => {
    if (kind === 'care') { router.replace('/care'); return; }
    if (kind === 'medication') { router.replace('/medications'); return; }
    if (kind === 'upload') {
      if (stage < 4) { setStage((value) => value + 1); return; }
      const record: HealthRecord = { id: `local-${Date.now()}`, memberId, title: title || 'Uploaded health record', date: '12 July 2026', category: 'Lab report', status: 'Ready', note: note || 'Added locally', values: [{ label: 'Status', value: 'Ready' }], explanation: 'Circle organised this local document. Open it to review and add context.' };
      addRecord(record); router.replace(`/record/${record.id}`); return;
    }
    const task: TodayItem = { id: `local-${Date.now()}`, title: title || (kind === 'reading' ? 'Log health reading' : kind === 'medication' ? 'Review new medication' : 'Family reminder'), memberId, who: memberName, time: '7:30 pm', date: 'Today', note, icon: kind === 'medication' ? 'plus-circle' : kind === 'reading' ? 'activity' : 'bell', accent: family.find((member) => member.id === memberId)!.accent, completed: false };
    addTask(task); router.replace('/tasks');
  };

  const stages = ['Choose source', 'Reading document', 'Extracting values', 'Organising timeline', 'Ready'];
  return <ScreenContainer edges={['top', 'bottom']}><DetailHeader title={config.title} /><View style={styles.hero}><Feather name={kind === 'upload' ? 'upload-cloud' : kind === 'care' ? 'heart' : 'plus-circle'} size={34} color={colors.blue} /><Text variant="title1">{config.title}</Text><Text variant="callout" color={colors.textSecondary}>{config.description}</Text></View><Card style={styles.form}><Text variant="overline" color={colors.textSecondary}>FAMILY MEMBER</Text><Segmented options={memberOptions} value={memberName} onChange={(value) => setMemberId(family.find((member) => member.name.startsWith(value))!.id)} /><TextInput value={title} onChangeText={setTitle} placeholder={kind === 'upload' ? 'Record title' : 'What needs to happen?'} placeholderTextColor={colors.textTertiary} style={styles.input} /><TextInput value={note} onChangeText={setNote} placeholder="Add a note (optional)" placeholderTextColor={colors.textTertiary} multiline style={[styles.input, styles.note]} />{kind === 'upload' ? <View style={styles.sources}>{['camera', 'image', 'file-text'].map((icon, i) => <Pressable key={icon} style={styles.source}><Feather name={icon as 'camera'} size={20} color={colors.blue} /><Text variant="caption">{['Scan', 'Photo', 'Document'][i]}</Text></Pressable>)}</View> : null}</Card>{kind === 'upload' && stage > 0 ? <Card style={styles.progress}><Text variant="headline">{stages[stage]}</Text><View style={styles.track}><View style={[styles.fill, { width: `${stage * 25}%` }]} /></View><Text variant="footnote" color={colors.textSecondary}>{stage === 4 ? 'Your record is ready to add.' : 'Local simulation—nothing leaves this device.'}</Text></Card> : null}<Button title={kind === 'upload' && stage > 0 && stage < 4 ? 'Continue' : stage === 4 ? 'Add to records' : config.button} onPress={submit} style={styles.button} /></ScreenContainer>;
}

const styles = StyleSheet.create({ hero: { alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xxxl }, form: { gap: spacing.lg }, input: { minHeight: 52, backgroundColor: colors.surfaceMuted, borderRadius: radius.input, paddingHorizontal: spacing.lg, fontSize: 16, color: colors.textPrimary }, note: { minHeight: 88, paddingTop: spacing.lg, textAlignVertical: 'top' }, sources: { flexDirection: 'row', gap: spacing.sm }, source: { flex: 1, alignItems: 'center', gap: spacing.sm, padding: spacing.md, backgroundColor: colors.blueTint, borderRadius: radius.input }, progress: { marginTop: spacing.lg, gap: spacing.md }, track: { height: 8, borderRadius: 8, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }, fill: { height: 8, backgroundColor: colors.blue }, button: { marginTop: spacing.xl } });
