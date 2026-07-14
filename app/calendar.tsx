import { useMemo, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  DetailHeader,
  IconChip,
  ListRow,
  ScreenContainer,
  Sheet,
  StatusPill,
  Text,
} from '@/components';
import { family, medications } from '@/data';
import { useAppState } from '@/state';
import { accents, colors, radius, spacing } from '@/theme';
import type { AccentName } from '@/theme';
import type { FeatherIconName, MemberId } from '@/types';

const WEEK = [
  { day: 12, weekday: 'Sun' },
  { day: 13, weekday: 'Mon' },
  { day: 14, weekday: 'Tue' },
  { day: 15, weekday: 'Wed' },
  { day: 16, weekday: 'Thu' },
  { day: 17, weekday: 'Fri' },
  { day: 18, weekday: 'Sat' },
];

type CalEvent = {
  id: string;
  day: number;
  time: string;
  title: string;
  who: string;
  memberId?: MemberId;
  icon: FeatherIconName;
  accent: AccentName;
  kind: 'Task' | 'Care' | 'Medicine';
  href: Href;
  done?: boolean;
};

function dayFromLabel(value: string): number {
  if (/today|tonight|overdue/i.test(value)) return 12;
  if (/tomorrow/i.test(value)) return 13;
  const match = value.match(/(\d{1,2})\s+July/);
  return match ? Number(match[1]) : 12;
}

function timeToMinutes(time: string): number {
  if (/overdue/i.test(time)) return -1;
  if (/tonight/i.test(time)) return 22 * 60;
  const match = time.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (!match) return 60 * 24 + 1;
  let hour = Number(match[1]) % 12;
  if (/pm/i.test(match[3]!)) hour += 12;
  return hour * 60 + Number(match[2]);
}

export default function CalendarScreen() {
  const { tasks, bookings } = useAppState();
  const [selected, setSelected] = useState(12);
  const [member, setMember] = useState<'all' | MemberId>('all');
  const [adding, setAdding] = useState(false);

  const events = useMemo<CalEvent[]>(() => {
    const taskEvents: CalEvent[] = tasks.map((task) => ({
      id: `task-${task.id}`,
      day: dayFromLabel(task.date === 'Today' ? task.time : task.date),
      time: task.time,
      title: task.title,
      who: task.who,
      memberId: task.memberId,
      icon: task.icon,
      accent: task.accent,
      kind: 'Task',
      href: `/tasks?focus=${task.id}` as Href,
      done: task.completed,
    }));

    const bookingEvents: CalEvent[] = bookings
      .filter((booking) => booking.status !== 'Cancelled')
      .map((booking) => ({
        id: `booking-${booking.id}`,
        day: dayFromLabel(booking.date),
        time: booking.time,
        title: booking.service,
        who: family.find((m) => m.id === booking.memberId)?.name.split(' ')[0] ?? '',
        memberId: booking.memberId,
        icon: 'calendar',
        accent: 'blue',
        kind: 'Care',
        href: `/booking/${booking.id}` as Href,
      }));

    const medEvents: CalEvent[] = medications
      .filter((med) => !med.archived && /today|tomorrow/i.test(med.next))
      .map((med) => ({
        id: `med-${med.id}`,
        day: dayFromLabel(med.next),
        time: med.next.split(',')[1]?.trim() ?? med.next,
        title: `${med.name} · ${med.dose}`,
        who: family.find((m) => m.id === med.memberId)?.name.split(' ')[0] ?? '',
        memberId: med.memberId,
        icon: 'plus-circle',
        accent: family.find((m) => m.id === med.memberId)?.accent ?? 'blue',
        kind: 'Medicine',
        href: '/medications' as Href,
      }));

    return [...taskEvents, ...bookingEvents, ...medEvents].sort(
      (a, b) => timeToMinutes(a.time) - timeToMinutes(b.time),
    );
  }, [tasks, bookings]);

  const forMember = (event: CalEvent) => member === 'all' || event.memberId === member;
  const dayEvents = events.filter((event) => event.day === selected && forMember(event));
  const countFor = (day: number) => events.filter((event) => event.day === day && forMember(event)).length;

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <DetailHeader title="Family calendar" actionLabel="Add" onAction={() => setAdding(true)} />

      <View style={styles.week}>
        {WEEK.map((d) => {
          const active = d.day === selected;
          const count = countFor(d.day);
          return (
            <Pressable
              key={d.day}
              onPress={() => setSelected(d.day)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`${d.weekday} ${d.day}, ${count} events`}
              style={[styles.dayPill, active && styles.dayPillActive]}
            >
              <Text variant="caption" color={active ? colors.white : colors.textTertiary}>
                {d.weekday}
              </Text>
              <Text variant="headline" color={active ? colors.white : colors.textPrimary}>
                {d.day}
              </Text>
              <View style={[styles.dot, count ? (active ? styles.dotActive : styles.dotOn) : undefined]} />
            </Pressable>
          );
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        <Filter label="Everyone" active={member === 'all'} onPress={() => setMember('all')} />
        {family.map((m) => (
          <Filter key={m.id} label={m.name.split(' ')[0]!} active={member === m.id} onPress={() => setMember(m.id)} />
        ))}
      </ScrollView>

      <View style={styles.agendaHead}>
        <Text variant="title3">
          {selected === 12 ? 'Today' : selected === 13 ? 'Tomorrow' : `${selected} July`}
        </Text>
        <Text variant="footnote" color={colors.textSecondary}>
          {dayEvents.length} {dayEvents.length === 1 ? 'event' : 'events'}
        </Text>
      </View>

      {dayEvents.length ? (
        <View style={styles.list}>
          {dayEvents.map((event) => (
            <Card key={event.id} onPress={() => router.push(event.href)} padding={spacing.lg}>
              <ListRow
                title={event.title}
                subtitle={`${event.who} · ${event.time}`}
                leading={
                  <IconChip size={42} background={event.done ? accents.sage.tint : accents[event.accent].tint}>
                    <Feather
                      name={event.done ? 'check' : event.icon}
                      size={18}
                      color={event.done ? accents.sage.solid : accents[event.accent].solid}
                    />
                  </IconChip>
                }
                trailing={<StatusPill label={event.done ? 'Done' : event.kind} accent={event.done ? 'sage' : event.accent} />}
              />
            </Card>
          ))}
        </View>
      ) : (
        <Card style={styles.empty}>
          <Text variant="callout" color={colors.textSecondary} align="center">
            Nothing scheduled. Enjoy the calm — or add a reminder.
          </Text>
        </Card>
      )}

      <Sheet
        visible={adding}
        onClose={() => setAdding(false)}
        title="Add to calendar"
        footer={<Button title="Close" variant="secondary" onPress={() => setAdding(false)} />}
      >
        <View style={styles.sheet}>
          <Button title="Create a reminder" onPress={() => { setAdding(false); router.push('/quick-add/reminder'); }} />
          <Button title="Assign a family task" variant="secondary" onPress={() => { setAdding(false); router.push('/quick-add/task'); }} />
          <Button title="Book care" variant="secondary" onPress={() => { setAdding(false); router.push('/care'); }} />
        </View>
      </Sheet>
    </ScreenContainer>
  );
}

function Filter({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.filter, active && styles.filterActive]}>
      <Text variant="subhead" color={active ? colors.white : colors.textSecondary}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  week: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.lg },
  dayPill: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  dayPillActive: { backgroundColor: colors.textPrimary },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'transparent', marginTop: spacing.xxs },
  dotOn: { backgroundColor: colors.blue },
  dotActive: { backgroundColor: colors.white },
  filters: { gap: spacing.sm, paddingVertical: spacing.lg },
  filter: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surface },
  filterActive: { backgroundColor: colors.textPrimary },
  agendaHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.sm, marginBottom: spacing.md },
  list: { gap: spacing.md },
  empty: { paddingVertical: spacing.xxxl },
  sheet: { gap: spacing.sm },
});
