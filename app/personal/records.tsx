import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, View } from 'react-native';

import { DetailHeader, ScreenContainer, Text } from '@/components';
import { DemoNotice, PersonalAccess, PersonalButton, PersonalSection, ui } from '@/accounts/individual/PersonalUI';
import { individualHabits } from '@/data/individual';
import { useAppState } from '@/state';
import { colors } from '@/theme';

export default function PersonalRecords() {
  const { section } = useLocalSearchParams<{ section?: string }>();
  const { activeAccountId, completedHabitIds, toggleHabit } = useAppState();
  const [expanded, setExpanded] = useState<string | undefined>(section);
  if (activeAccountId !== 'riya') return <PersonalAccess />;
  return <ScreenContainer bottomInset={40} contentStyle={ui.page}><DetailHeader title="My health snapshot" /><DemoNotice compact />
    <PersonalSection title="Health highlights"><View style={[ui.card, { backgroundColor: colors.surface, gap: 14 }]}><Pressable onPress={() => setExpanded(expanded === 'sleep' ? undefined : 'sleep')} accessibilityRole="button" accessibilityState={{ expanded: expanded === 'sleep' }} style={ui.between}><View style={ui.flex}><Text variant="headline" color={colors.plum}>Sleep</Text><Text variant="title1">7 hr 20 min</Text><Text variant="footnote" color={colors.textSecondary}>Sample night · 24 September 2026</Text></View><Feather name={expanded === 'sleep' ? 'chevron-up' : 'chevron-down'} size={22} color={colors.blue} /></Pressable>{expanded === 'sleep' ? <Text variant="callout" color={colors.textSecondary}>Example entry: bedtime 11:10 pm, wake time 6:30 am. This is demo data. No wearable is connected, and this number is not a clinical assessment.</Text> : null}</View><View style={[ui.card, { backgroundColor: colors.surface, gap: 14 }]}><Pressable onPress={() => setExpanded(expanded === 'movement' ? undefined : 'movement')} accessibilityRole="button" accessibilityState={{ expanded: expanded === 'movement' }} style={ui.between}><View style={ui.flex}><Text variant="headline" color={colors.red}>Steps</Text><Text variant="title1">6,420 steps</Text><Text variant="footnote" color={colors.textSecondary}>Sample day · 24 September 2026</Text></View><Feather name={expanded === 'movement' ? 'chevron-up' : 'chevron-down'} size={22} color={colors.blue} /></Pressable>{expanded === 'movement' ? <Text variant="callout" color={colors.textSecondary}>Your example goal is 8,000 steps. Goals are personal; this demo target is not a recommendation. No step counter or wearable is connected.</Text> : null}</View></PersonalSection>
    <PersonalSection title="Daily habits">{individualHabits.map((habit) => { const done = completedHabitIds.includes(habit.id); return <Pressable key={habit.id} onPress={() => toggleHabit(habit.id)} accessibilityRole="checkbox" accessibilityState={{ checked: done }} style={[ui.card, ui.row]}><Feather name={done ? 'check-circle' : 'circle'} size={24} color={colors.blue} /><View style={ui.flex}><Text variant="headline">{habit.title}</Text><Text variant="footnote" color={colors.textSecondary}>{done ? 'Done for today · tap to undo' : habit.detail}</Text></View></Pressable>; })}</PersonalSection>
    <PersonalSection title="My records"><View style={[ui.card, { gap: 10 }]}><Feather name="folder" size={26} color={colors.blue} /><Text variant="headline">A space for your records</Text><Text variant="callout" color={colors.textSecondary}>Riya has no personal medical documents in this demo. Document import is not connected in this preview.</Text></View></PersonalSection><PersonalButton title="See my appointments" onPress={() => router.push('/personal/bookings')} /></ScreenContainer>;
}
