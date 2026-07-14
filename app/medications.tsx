import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { PersonalText } from '@/accounts/savita/PersonalText';
import { Button, Card, DetailHeader, IconChip, ProgressBar, ScreenContainer, Sheet, StatusPill, Text as CircleText } from '@/components';
import type { TextProps } from '@/components/Text';
import { family } from '@/data';
import { useAppState } from '@/state';
import { accents, colors, radius, spacing } from '@/theme';
import type { Medication } from '@/types';

export default function MedicationsScreen() {
  const { activeAccountId, takenMedicationIds, medications, toggleMedication, addMedication, updateMedication } = useAppState();
  const personal = activeAccountId === 'savita';
  const [member, setMember] = useState(personal ? 'savita' : 'all');
  const [selected, setSelected] = useState<Medication>();
  const [adding, setAdding] = useState(false);
  const visible = medications.filter((item) => !item.archived && (personal ? item.memberId === 'savita' : member === 'all' || item.memberId === member));

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <DetailHeader title={personal ? 'My medicines' : 'Medications'} actionLabel={personal ? undefined : 'Add'} onAction={personal ? undefined : () => setAdding(true)} />
      {!personal ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          <Filter label="Family" active={member === 'all'} onPress={() => setMember('all')} />
          {family.map((item) => <Filter key={item.id} label={item.name.split(' ')[0]!} active={member === item.id} onPress={() => setMember(item.id)} />)}
        </ScrollView>
      ) : null}
      <View style={styles.list}>
        {visible.map((med) => {
          const person = family.find((item) => item.id === med.memberId)!;
          const taken = takenMedicationIds.includes(med.id);
          return (
            <Card key={med.id} onPress={() => setSelected(med)}>
              <View style={styles.row}>
                <Pressable
                  onPress={() => toggleMedication(med.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${taken ? 'Mark not taken' : 'Mark taken'}: ${med.name}`}
                  accessibilityState={{ checked: taken }}
                  style={styles.medicationToggle}
                >
                  <IconChip size={46} background={taken ? accents.sage.tint : accents[person.accent].tint}>
                    <Feather name={taken ? 'check' : 'plus'} size={20} color={taken ? accents.sage.solid : accents[person.accent].solid} />
                  </IconChip>
                </Pressable>
                <View style={styles.copy}>
                  <Text variant="headline">{med.name} · {med.dose}</Text>
                  <Text variant={personal ? 'body' : 'footnote'} color={colors.textSecondary}>{personal ? med.schedule : `${person.name.split(' ')[0]} · ${med.schedule}`}</Text>
                </View>
                <StatusPill label={taken ? 'Taken' : med.next} accent={taken ? 'sage' : person.accent} />
              </View>
            </Card>
          );
        })}
      </View>
      <Sheet visible={Boolean(selected)} onClose={() => setSelected(undefined)} title={selected?.name}>
        <View style={styles.sheet}>{selected ? <>
          <Text variant="title2">{selected.dose}</Text>
          <Text variant="callout">{selected.schedule}</Text>
          <Card background={colors.surfaceMuted}><Text variant="caption" color={colors.textSecondary}>INSTRUCTIONS</Text><Text variant="callout" style={styles.smallGap}>{selected.instructions}</Text></Card>
          {!personal ? <>
            <Text variant="headline">{selected.adherence}% adherence this month</Text>
            <ProgressBar progress={selected.adherence / 100} accent={selected.adherence >= 90 ? 'sage' : 'amber'} accessibilityLabel={`${selected.adherence}% adherence`} />
            <View style={styles.calendar}>{Array.from({ length: 14 }, (_, index) => <View key={index} style={[styles.day, index < Math.round(selected.adherence / 100 * 14) && styles.dayTaken]} />)}</View>
          </> : null}
          <Button title={takenMedicationIds.includes(selected.id) ? 'Mark not taken' : 'Mark taken'} onPress={() => { toggleMedication(selected.id); setSelected(undefined); }} />
          {!personal ? <>
            <Button title="Set refill reminder" variant="secondary" onPress={() => { updateMedication(selected.id, { next: 'Refill in 7 days' }); setSelected(undefined); }} />
            <Button title="Edit schedule" variant="tertiary" onPress={() => { updateMedication(selected.id, { schedule: 'Updated daily schedule' }); setSelected(undefined); }} />
            <Button title="Archive medication" variant="tertiary" onPress={() => { updateMedication(selected.id, { archived: true }); setSelected(undefined); }} />
          </> : null}
        </> : null}</View>
      </Sheet>
      <Sheet visible={!personal && adding} onClose={() => setAdding(false)} title="Add medication" footer={<Button title="Save medication locally" onPress={() => { addMedication({ id: `med-${Date.now()}`, memberId: 'arjun', name: 'New medication', dose: 'Add dose', schedule: 'Daily schedule', instructions: 'Review and edit instructions.', adherence: 100, next: 'Tomorrow, 8:00 am' }); setAdding(false); }} />}>
        <Text variant="callout" color={colors.textSecondary}>Add an editable local medication for Arjun, then open it to change its schedule, refill reminder or archive status.</Text>
      </Sheet>
    </ScreenContainer>
  );
}

function Text(props: TextProps) {
  const { activeAccountId } = useAppState();
  return activeAccountId === 'savita' ? <PersonalText {...props} /> : <CircleText {...props} />;
}

function Filter({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }} style={[styles.filter, active && styles.filterActive]}><Text variant="subhead" color={active ? colors.white : colors.textSecondary}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  filters: { gap: spacing.sm, paddingVertical: spacing.lg },
  filter: { minHeight: 48, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface },
  filterActive: { backgroundColor: colors.textPrimary },
  list: { gap: spacing.md, marginTop: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  medicationToggle: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: spacing.xs },
  sheet: { gap: spacing.lg },
  smallGap: { marginTop: spacing.sm },
  calendar: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  day: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.surfaceMuted },
  dayTaken: { backgroundColor: accents.sage.solid },
});
