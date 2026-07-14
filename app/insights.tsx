import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { Href } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import {
  Button,
  Card,
  DetailHeader,
  IconChip,
  ScreenContainer,
  SectionHeading,
  Segmented,
  StatusPill,
  Text,
  TrendChart,
} from '@/components';
import { insights, metricFor } from '@/data';
import { accents, colors, spacing } from '@/theme';
import type { Insight } from '@/types';

const filters = ['All', 'Needs care', 'On track'] as const;
type Filter = (typeof filters)[number];

const tonePill: Record<Insight['tone'], { label: string; accent: 'amber' | 'sage' | 'blue' }> = {
  attention: { label: 'Worth a look', accent: 'amber' },
  positive: { label: 'Improving', accent: 'sage' },
  steady: { label: 'Steady', accent: 'blue' },
};

export default function InsightsScreen() {
  const [filter, setFilter] = useState<Filter>('All');
  const visible = insights.filter((item) =>
    filter === 'All'
      ? true
      : filter === 'Needs care'
        ? item.tone === 'attention'
        : item.tone !== 'attention',
  );

  const askSummary = () =>
    router.push('/ai?prompt=Summarise%20how%20my%20family%20is%20doing%20this%20week' as Href);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <DetailHeader title="Family insights" actionLabel="Ask Circle" onAction={askSummary} />

      <Card background={colors.blueTint} style={styles.digest}>
        <Text variant="overline" color={colors.blue}>
          THIS WEEK · 12–18 JULY
        </Text>
        <Text variant="title2" style={styles.digestTitle}>
          A calm week overall, with two things worth a gentle look.
        </Text>
        <View style={styles.stats}>
          <Stat value="2" label="Need care" />
          <Stat value="3" label="On track" />
          <Stat value="4" label="Members" />
        </View>
      </Card>

      <View style={styles.segmented}>
        <Segmented options={filters} value={filter} onChange={setFilter} />
      </View>

      <View style={styles.list}>
        {visible.map((item) => (
          <InsightCard key={item.id} insight={item} />
        ))}
      </View>

      <SectionHeading title="Go deeper" />
      <Card style={styles.deeper}>
        <Text variant="callout" color={colors.textSecondary}>
          Circle AI can turn this week into a plain-language summary and suggest gentle next steps
          for each family member.
        </Text>
        <Button title="Ask Circle AI for a summary" onPress={askSummary} style={styles.deeperButton} />
      </Card>
    </ScreenContainer>
  );
}

function InsightCard({ insight }: { insight: Insight }) {
  const pill = tonePill[insight.tone];
  const metric = insight.metric ? metricFor(insight.metric.memberId, insight.metric.kind) : undefined;

  return (
    <Card>
      <View style={styles.cardTop}>
        <IconChip size={44} background={accents[insight.accent].tint}>
          <Feather name={insight.icon} size={20} color={accents[insight.accent].solid} />
        </IconChip>
        <StatusPill label={pill.label} accent={pill.accent} />
      </View>
      <Text variant="title3" style={styles.cardTitle}>
        {insight.title}
      </Text>
      <Text variant="callout" color={colors.textSecondary} style={styles.cardSummary}>
        {insight.summary}
      </Text>
      {metric ? (
        <View style={styles.chart}>
          <TrendChart
            values={metric.history.map((point) => point.value)}
            labels={metric.history.filter((_, i) => i === 0 || i === 3 || i === 6).map((point) => point.label)}
          />
        </View>
      ) : null}
      <View style={styles.actions}>
        {insight.actions.map((action) => (
          <Pressable
            key={action.label}
            onPress={() => router.push(action.href as Href)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.actionChip, pressed && styles.pressed]}
          >
            <Text variant="subhead" color={colors.blue} numberOfLines={1}>
              {action.label}
            </Text>
            <Feather name="arrow-up-right" size={15} color={colors.blue} />
          </Pressable>
        ))}
      </View>
    </Card>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="title1">{value}</Text>
      <Text variant="caption" color={colors.textSecondary}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  digest: { marginTop: spacing.lg, gap: spacing.md },
  digestTitle: { marginTop: spacing.xs },
  stats: { flexDirection: 'row', gap: spacing.xxl, marginTop: spacing.sm },
  stat: { gap: spacing.xxs },
  segmented: { marginTop: spacing.xl },
  list: { marginTop: spacing.xl, gap: spacing.lg },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { marginTop: spacing.lg },
  cardSummary: { marginTop: spacing.sm },
  chart: { marginTop: spacing.lg },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.blueTint,
    borderRadius: 999,
  },
  pressed: { opacity: 0.7 },
  deeper: { marginTop: spacing.lg },
  deeperButton: { marginTop: spacing.lg },
});
