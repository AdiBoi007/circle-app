import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, DetailHeader, ScreenContainer, Segmented, StatusPill, Text, TrendChart } from '@/components';
import { family, metricFor } from '@/data';
import { colors, spacing } from '@/theme';
import type { MemberId } from '@/types';

const ranges = ['7D', '1M', '3M', '1Y'] as const;
export default function MetricDetailScreen() {
  const { memberId = 'arjun', kind = 'steps' } = useLocalSearchParams<{ memberId: MemberId; kind: string }>();
  const [range, setRange] = useState<typeof ranges[number]>('7D'); const [logged, setLogged] = useState(false);
  const metric = metricFor(memberId, kind); const member = family.find((item) => item.id === memberId)!;
  if (!metric) return <ScreenContainer><DetailHeader title="Metric" /><Card><Text>Metric data is unavailable.</Text></Card></ScreenContainer>;
  return <ScreenContainer edges={['top', 'bottom']}><DetailHeader title={member.name.split(' ')[0]!} /><View style={styles.hero}><Text variant="overline" color={colors.textSecondary}>{metric.label.toUpperCase()}</Text><Text variant="largeTitle">{metric.value}</Text><StatusPill label={metric.change} accent={metric.change.includes('higher') || metric.change.includes('less') ? 'amber' : 'sage'} /></View><Segmented options={ranges} value={range} onChange={setRange} /><Card style={styles.chart}><TrendChart values={metric.history.map((item) => item.value)} labels={metric.history.filter((_, i) => i === 0 || i === 3 || i === 6).map((item) => item.label)} /></Card><View style={styles.grid}><Card style={styles.half}><Text variant="caption" color={colors.textSecondary}>PREVIOUS</Text><Text variant="title3">{metric.previous}</Text></Card><Card style={styles.half}><Text variant="caption" color={colors.textSecondary}>CHANGE</Text><Text variant="title3">{metric.change}</Text></Card></View><Card><View style={styles.meta}><Feather name="database" size={18} color={colors.blue} /><View><Text variant="headline">{metric.source}</Text><Text variant="footnote" color={colors.textSecondary}>Last updated {metric.updated.toLowerCase()}</Text></View></View></Card><View style={styles.history}><Text variant="title3">History</Text>{metric.history.slice().reverse().map((item, index) => <View key={`${item.label}-${index}`} style={styles.historyRow}><Text variant="callout">{index ? item.label : 'Today'}</Text><Text variant="headline">{item.display}</Text></View>)}</View><Card background={colors.blueTint}><Text variant="headline">About this metric</Text><Text variant="callout" color={colors.textSecondary} style={styles.note}>{metric.note}</Text></Card><Button title={logged ? 'Reading logged locally' : 'Log manually'} disabled={logged} onPress={() => setLogged(true)} /></ScreenContainer>;
}
const styles = StyleSheet.create({ hero: { alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xxxl }, chart: { marginVertical: spacing.lg }, grid: { flexDirection: 'row', gap: spacing.md }, half: { flex: 1, gap: spacing.xs }, meta: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' }, history: { marginVertical: spacing.xxl, gap: spacing.md }, historyRow: { flexDirection: 'row', justifyContent: 'space-between', paddingBottom: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }, note: { marginTop: spacing.sm } });
