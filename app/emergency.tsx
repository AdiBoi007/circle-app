import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { PersonalText } from '@/accounts/savita/PersonalText';
import {
  Avatar,
  Button,
  Card,
  DetailHeader,
  FamilySelector,
  IconChip,
  ScreenContainer,
  SectionHeading,
  Sheet,
  StatusPill,
  Text as CircleText,
} from '@/components';
import type { TextProps } from '@/components/Text';
import { emergencyFor, family } from '@/data';
import { useAppState } from '@/state';
import { accents, colors, spacing } from '@/theme';
import type { EmergencyContact, MemberId } from '@/types';

export default function EmergencyScreen() {
  const { member: initial } = useLocalSearchParams<{ member?: MemberId }>();
  const { activeAccountId } = useAppState();
  const personal = activeAccountId === 'savita';
  const [selectedId, setSelectedId] = useState<MemberId>(personal ? 'savita' : initial ?? 'arjun');
  const [contact, setContact] = useState<EmergencyContact | undefined>();
  const member = family.find((m) => m.id === selectedId)!;
  const profile = emergencyFor(selectedId);
  const noAllergy = profile.allergies.every((a) => /no known/i.test(a));

  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <DetailHeader title={personal ? 'My medical ID' : 'Medical ID'} />

      {!personal ? <FamilySelector members={family} selectedId={selectedId} onSelect={(id) => setSelectedId(id as MemberId)} style={styles.selector} /> : null}

      <Card background={colors.redTint} style={styles.sos}>
        <View style={styles.sosRow}>
          <IconChip size={44} background={colors.surface}>
            <Feather name="phone-call" size={20} color={colors.red} />
          </IconChip>
          <View style={styles.flex}>
            <Text variant="headline">Emergency services</Text>
            <Text variant="footnote" color={colors.textSecondary}>
              Call 000 in Australia or 112 in India. Circle is not an emergency service.
            </Text>
          </View>
        </View>
      </Card>

      <Card style={styles.identity}>
        <Avatar name={member.name} accent={member.accent} size={60} />
        <View style={styles.flex}>
          <Text variant="title2">{member.name}</Text>
          <Text variant="subhead" color={colors.textSecondary}>
            {personal ? `${member.age} · ${member.location}` : `${member.relation} · ${member.age} · ${member.location}`}
          </Text>
        </View>
      </Card>

      <View style={styles.stats}>
        <Vital label="Blood type" value={profile.bloodType} />
        <Vital label="Height" value={profile.height} />
        <Vital label="Weight" value={profile.weight} />
      </View>

      <StatusPill
        label={profile.organDonor ? 'Registered organ donor' : 'Not an organ donor'}
        accent={profile.organDonor ? 'sage' : 'neutral'}
        icon={<Feather name={profile.organDonor ? 'check' : 'minus'} size={12} color={profile.organDonor ? accents.sage.solid : colors.textSecondary} />}
        style={styles.donor}
      />

      <SectionHeading title="Allergies & reactions" style={styles.section} />
      <Card background={noAllergy ? colors.surface : colors.redTint}>
        <View style={styles.criticalRow}>
          <Feather name={noAllergy ? 'shield' : 'alert-triangle'} size={20} color={noAllergy ? colors.sage : colors.red} />
          <View style={styles.flex}>
            {profile.allergies.map((item) => (
              <Text key={item} variant="callout">
                {item}
              </Text>
            ))}
          </View>
        </View>
      </Card>

      <SectionHeading title="Conditions" style={styles.section} />
      <Card>
        <View style={styles.tags}>
          {profile.conditions.map((item) => (
            <StatusPill key={item} label={item} accent={member.accent} />
          ))}
        </View>
      </Card>

      <SectionHeading title="Current medications" style={styles.section} />
      <Card padding={spacing.sm}>
        {profile.medications.length ? (
          profile.medications.map((item, index) => (
            <View key={item}>
              {index ? <View style={styles.divider} /> : null}
              <View style={styles.medRow}>
                <IconChip size={38} background={accents[member.accent].tint}>
                  <Feather name="plus-circle" size={17} color={accents[member.accent].solid} />
                </IconChip>
                <Text variant="callout" style={styles.flex}>
                  {item}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text variant="callout" color={colors.textSecondary} style={styles.pad}>
            No regular medications recorded.
          </Text>
        )}
      </Card>

      <SectionHeading title="Emergency contacts" style={styles.section} />
      <View style={styles.contacts}>
        {profile.contacts.map((item) => (
          <Card key={item.name + item.phone} onPress={() => setContact(item)} padding={spacing.lg}>
            <View style={styles.contactRow}>
              <IconChip size={42} background={accents.blue.tint}>
                <Feather name="phone" size={18} color={accents.blue.solid} />
              </IconChip>
              <View style={styles.flex}>
                <Text variant="headline">
                  {item.name}
                  {item.primary ? ' · Primary' : ''}
                </Text>
                <Text variant="footnote" color={colors.textSecondary}>
                  {item.relation} · {item.phone}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.textTertiary} />
            </View>
          </Card>
        ))}
      </View>

      <Text variant="footnote" color={colors.textTertiary} style={styles.note}>
        Medical ID is stored locally on this device in the demo. Keep it current so the right people
        can help quickly.
      </Text>

      <Sheet
        visible={Boolean(contact)}
        onClose={() => setContact(undefined)}
        title={contact?.name}
        footer={<Button title="Done" variant="secondary" onPress={() => setContact(undefined)} />}
      >
        <View style={styles.sheet}>
          <Text variant="largeTitle">{contact?.phone}</Text>
          <Text variant="callout" color={colors.textSecondary}>
            {contact?.relation}. Calling and messaging are simulated in this local demo.
          </Text>
        </View>
      </Sheet>
    </ScreenContainer>
  );
}

function Text(props: TextProps) {
  const { activeAccountId } = useAppState();
  return activeAccountId === 'savita' ? <PersonalText {...props} /> : <CircleText {...props} />;
}

function Vital({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.vital} padding={spacing.lg}>
      <Text variant="caption" color={colors.textSecondary}>
        {label.toUpperCase()}
      </Text>
      <Text variant="title2">{value}</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  selector: { marginTop: spacing.sm },
  sos: { marginTop: spacing.lg },
  sosRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1, gap: spacing.xxs },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, marginTop: spacing.lg },
  stats: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg },
  vital: { flex: 1, gap: spacing.xs },
  donor: { marginTop: spacing.lg },
  section: { marginTop: spacing.xxl, marginBottom: spacing.md },
  criticalRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: spacing.md + 38 + spacing.md },
  medRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
  pad: { padding: spacing.md },
  contacts: { gap: spacing.md },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  note: { marginTop: spacing.xl, textAlign: 'center' },
  sheet: { gap: spacing.sm, alignItems: 'center', paddingVertical: spacing.md },
});
