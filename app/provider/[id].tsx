import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, DetailHeader, ScreenContainer, SectionHeading, StatusPill, Text } from '@/components';
import { providerById } from '@/data';
import { useAppState } from '@/state';
import { accents, colors, spacing } from '@/theme';

export default function ProviderProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const pro = providerById(id);
  const { savedProviders, toggleSavedProvider } = useAppState();
  const [shared, setShared] = useState(false);

  if (!pro) return <ScreenContainer><DetailHeader title="Care professional" /><Card><Text>Professional not found.</Text></Card></ScreenContainer>;
  const saved = savedProviders.includes(pro.id);

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <DetailHeader title="Professional profile" />
      <View style={styles.hero}>
        <Avatar name={pro.name} accent={pro.accent} size={88} />
        <Text variant="title1">{pro.name}</Text>
        <Text variant="headline" color={colors.textSecondary}>{pro.title}</Text>
        <View style={styles.pills}>
          <StatusPill label={pro.verified ? 'Circle verified' : 'Profile'} accent="blue" />
          <StatusPill label={`${pro.matchScore}% match`} accent={pro.accent} />
        </View>
        <Text variant="subhead" color={colors.textSecondary}>★ {pro.rating} · {pro.reviewCount} reviews · {pro.location}</Text>
      </View>

      <Card background={accents[pro.accent].tint}>
        <Text variant="overline">WHY CIRCLE RECOMMENDS {pro.name.split(' ')[0]!.toUpperCase()}</Text>
        <Text variant="callout" style={styles.gap}>{pro.why}</Text>
      </Card>
      <View style={styles.actions}>
        <Button title={saved ? 'Saved' : 'Save'} variant="secondary" onPress={() => toggleSavedProvider(pro.id)} style={styles.flex} />
        <Button title={shared ? 'Share ready' : 'Share'} variant="secondary" onPress={() => setShared(true)} style={styles.flex} />
      </View>

      <SectionHeading title="About" />
      <Text variant="callout" color={colors.textSecondary} style={styles.body}>{pro.bio}</Text>
      <Card style={styles.section}>
        <Info label="Languages" value={pro.languages.join(' · ')} /><Line />
        <Info label="Mode" value={pro.modes.join(' · ')} /><Line />
        <Info label="Experience" value={`${pro.experience} years`} /><Line />
        <Info label="Jurisdictions" value={pro.jurisdictions.join(' · ')} />
      </Card>

      <SectionHeading title="Qualifications" />
      {pro.qualifications.map((item) => (
        <Card key={item} style={styles.smallCard}>
          <View style={styles.infoRow}><Feather name="award" size={18} color={colors.blue} /><Text variant="callout">{item}</Text></View>
        </Card>
      ))}
      <SectionHeading title="Specialisations" />
      <View style={styles.tags}>{pro.specialisations.map((item) => <StatusPill key={item} label={item} accent={pro.accent} />)}</View>

      <SectionHeading title="Services & packages" />
      {pro.services.map((service, index) => (
        <Card key={service} style={styles.smallCard}>
          <View style={styles.priceRow}>
            <View><Text variant="headline">{service}</Text><Text variant="footnote" color={colors.textSecondary}>{pro.packages[index] ?? 'Single session'}</Text></View>
            <Text variant="title3">{pro.currency}{index ? Math.round(pro.price * (index === 1 ? 3.6 : 0.7)) : pro.price}</Text>
          </View>
        </Card>
      ))}

      <SectionHeading title="Next availability" />
      <Card><Text variant="title3">{pro.nextSlot}</Text>{pro.availability.map((item) => <Text key={item} variant="callout" color={colors.textSecondary} style={styles.gap}>{item}</Text>)}</Card>
      <SectionHeading title={`Reviews (${pro.reviewCount})`} />
      {pro.reviews.map((review) => (
        <Card key={review.name} style={styles.smallCard}>
          <View style={styles.reviewRow}>
            <Avatar name={review.name} size={42} />
            <View style={styles.flex}><Text variant="headline">{review.name} · {'★'.repeat(review.rating)}</Text><Text variant="callout" color={colors.textSecondary} style={styles.gap}>{review.text}</Text></View>
          </View>
        </Card>
      ))}
      <SectionHeading title="Cancellation policy" />
      <Text variant="callout" color={colors.textSecondary} style={styles.body}>{pro.cancellation}</Text>
      <Button title={`Book from ${pro.currency}${pro.price}${pro.priceSuffix ?? ''}`} onPress={() => router.push(`/booking/new?providerId=${pro.id}`)} style={styles.section} />
    </ScreenContainer>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <View><Text variant="caption" color={colors.textSecondary}>{label.toUpperCase()}</Text><Text variant="callout" style={styles.gap}>{value}</Text></View>;
}
function Line() { return <View style={styles.line} />; }

const styles = StyleSheet.create({
  hero: { alignItems: 'center', gap: spacing.sm, marginVertical: spacing.xxl },
  pills: { flexDirection: 'row', gap: spacing.sm },
  gap: { marginTop: spacing.sm },
  actions: { flexDirection: 'row', gap: spacing.md, marginVertical: spacing.lg },
  flex: { flex: 1 },
  section: { marginTop: spacing.xxl },
  body: { marginTop: spacing.sm, marginBottom: spacing.xxl },
  line: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.lg },
  smallCard: { marginTop: spacing.sm },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reviewRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
