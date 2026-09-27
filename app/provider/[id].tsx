import { launchMarket } from '@/config/launch';
import { availableCareModes as availableModes } from '@/utils/careEligibility';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, DetailHeader, ScreenContainer, SectionHeading, StatusPill, Text } from '@/components';
import { family, providerById } from '@/data';
import { useAppState } from '@/state';
import { colors, radius, spacing } from '@/theme';

export default function ProviderProfileScreen() {
  const { id, memberId } = useLocalSearchParams<{ id: string; memberId?: string }>();
  const { activeAccountId } = useAppState();
  if (id === 'arvind-nair') return <Redirect href={{ pathname: '/practitioner-profile', params: { memberId } }} />;
  return <ProviderProfileContent key={`${id}-${memberId ?? ''}-${activeAccountId}`} />;
}

function ProviderProfileContent() {
  const { id, memberId: requestedMember } = useLocalSearchParams<{ id: string; memberId?: string }>();
  const pro = providerById(id);
  const { activeAccountId, savedProviders, toggleSavedProvider } = useAppState();
  const eligibleMembers = family.filter((member) => pro && availableModes(pro, member.id).length > 0);
  const initialMember = activeAccountId === 'savita' ? 'savita' : requestedMember ?? eligibleMembers.find((member) => pro?.recommendedFor.includes(member.id))?.id ?? eligibleMembers[0]?.id;
  const [recipient, setRecipient] = useState<string | undefined>(initialMember);
  const person = family.find((member) => member.id === recipient);
  const modes = pro && person ? availableModes(pro, person.id) : [];

  if (activeAccountId === 'riya') return <ScreenContainer><DetailHeader title="Care professional" /><Card><Text variant="title3">Explore care for you</Text><Text style={styles.gap}>This profile belongs to the family demo directory.</Text><Button title="Go to my care directory" onPress={() => router.replace('/care')} style={styles.gap} /></Card></ScreenContainer>;
  if (!pro) return <ScreenContainer><DetailHeader title="Care professional" /><Card><Text>Professional not found.</Text></Card></ScreenContainer>;
  const saved = savedProviders.includes(pro.id);
  const canBook = Boolean(person && modes.length);

  return <ScreenContainer edges={['top', 'bottom']} contentStyle={styles.content}>
    <DetailHeader title="Care professional" />
    <View style={styles.hero}><Avatar name={pro.name} accent={pro.accent} size={88} /><StatusPill label="Sample professional" accent="sage" /><Text variant="title1" align="center">{pro.name}</Text><Text variant="headline" color={colors.textSecondary} align="center">{pro.title}</Text><Text variant="callout" color={colors.textSecondary}>{pro.location}</Text></View>
    <Card background={colors.sageTint}><Text variant="headline">Explore a sample profile</Text><Text variant="callout" style={styles.gap}>Profile details, qualifications, reviews and availability are examples for this demo. No professional has been verified or contacted.</Text></Card>

    <View style={styles.section}><Text variant="title3">Care for {person?.name.split(' ')[0] ?? 'a family member'}</Text><Text variant="callout" color={colors.textSecondary}>{person ? `${person.location} · ${launchMarket.country}` : 'Choose who will attend the appointment.'}</Text>
      {!canBook ? <Text variant="callout" color={colors.red}>{person ? `This professional has no supported appointments for ${person.name.split(' ')[0]} in ${launchMarket.city}.` : 'Select an eligible family member below.'}</Text> : <Text variant="callout">Available format: {modes.join(' · ')}</Text>}
      {activeAccountId === 'arjun' ? <View style={styles.recipients}>{eligibleMembers.map((member) => <Pressable key={member.id} onPress={() => setRecipient(member.id)} accessibilityRole="radio" accessibilityState={{ checked: recipient === member.id }} style={({ pressed }) => [styles.recipient, recipient === member.id && styles.recipientSelected, pressed && styles.pressed]}><Text variant="headline" color={recipient === member.id ? colors.white : colors.textPrimary}>{member.name.split(' ')[0]}</Text></Pressable>)}</View> : null}
    </View>
    <Button title={canBook ? `Plan a visit for ${person!.name.split(' ')[0]}` : 'Unavailable for this recipient'} disabled={!canBook} onPress={() => { if (person && modes.length) router.push(`/booking/new?providerId=${pro.id}&memberId=${person.id}`); }} />
    <Button title={saved ? 'Saved to your list' : 'Save professional'} variant="secondary" onPress={() => toggleSavedProvider(pro.id)} />

    <SectionHeading title="About" /><Text variant="callout" color={colors.textSecondary}>{pro.bio}</Text>
    <Card><Info label="Languages" value={pro.languages.join(' · ')} /><Line /><Info label="Listed service region" value={pro.jurisdictions.filter((item) => !/worldwide/i.test(item)).join(' · ')} /><Line /><Info label="Example price" value={`From ${pro.currency}${pro.price}${pro.priceSuffix ?? ''}`} /></Card>
    <SectionHeading title="Areas of focus" /><View style={styles.tags}>{pro.specialisations.map((item) => <StatusPill key={item} label={item} accent={pro.accent} />)}</View>
    <SectionHeading title="Sample qualifications" /><Card>{pro.qualifications.map((item) => <View key={item} style={styles.infoRow}><Feather name="file-text" size={20} color={colors.sage} /><Text variant="callout" style={styles.flex}>{item}</Text></View>)}</Card>
    <SectionHeading title="Services" /><Card>{pro.services.map((service) => <Text key={service} variant="callout" style={styles.service}>{service}</Text>)}</Card>
    <SectionHeading title="Sample feedback" />{pro.reviews.slice(0, 2).map((review, index) => <Card key={index}><Text variant="headline">Example review {index + 1}</Text><Text variant="callout" color={colors.textSecondary} style={styles.gap}>{review.text}</Text></Card>)}
    <Text variant="callout" color={colors.textSecondary}>Bookings in this demo only save a sample visit. There is no payment or confirmed availability.</Text>
    <Button title={`Plan a sample visit · ${pro.currency}${pro.price}`} disabled={!canBook} onPress={() => { if (person && modes.length) router.push(`/booking/new?providerId=${pro.id}&memberId=${person.id}`); }} />
  </ScreenContainer>;
}


function Info({ label, value }: { label: string; value: string }) { return <View><Text variant="caption" color={colors.textSecondary}>{label.toUpperCase()}</Text><Text variant="callout" style={styles.gap}>{value}</Text></View>; }
function Line() { return <View style={styles.line} />; }

const styles = StyleSheet.create({
  content: { gap: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
  gap: { marginTop: spacing.sm },
  section: { gap: spacing.md },
  flex: { flex: 1 },
  recipients: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  recipient: { minHeight: 56, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, justifyContent: 'center' },
  recipientSelected: { backgroundColor: colors.sage },
  line: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.lg },
  infoRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  service: { paddingVertical: spacing.md },
  pressed: { opacity: 0.7 },
});
