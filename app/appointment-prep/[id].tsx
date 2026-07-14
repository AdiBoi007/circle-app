import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, DetailHeader, ScreenContainer } from '@/components';
import { PersonalText as Text } from '@/accounts/savita/PersonalText';
import { useAppState } from '@/state';
import { colors, radius, spacing } from '@/theme';

const questions = [
  'Which exercises are safest for me at home?',
  'What should I do if my knee hurts more?',
  'How often should I practise the exercises?',
];

export default function AppointmentPreparationScreen() {
  useLocalSearchParams<{ id: string }>();
  const { medications } = useAppState();
  const medicines = medications.filter((medicine) => medicine.memberId === 'savita').slice(0, 3);

  return (
    <ScreenContainer edges={['top', 'bottom']} contentStyle={styles.content}>
      <DetailHeader title="Get ready" />
      <View style={styles.heading}><Text variant="title1">Your physiotherapy visit</Text><Text variant="body" color={colors.textSecondary} style={styles.body}>A simple list to help you feel prepared.</Text></View>
      <Card background={colors.blueTint} elevation="none" bordered>
        <Info icon="clock" title="14 July · 10:00 AM" detail="Home visit" />
        <View style={styles.divider} />
        <Info icon="user" title="Vikram Nair" detail="Physiotherapist" />
      </Card>

      <Section title="What is bothering you now">
        <PlainRow text="Knee pain is about 6 out of 10" />
        <PlainRow text="Walking and bending feel difficult" />
      </Section>

      <Section title="Medicines to mention">
        {medicines.map((medicine) => <PlainRow key={medicine.id} text={`${medicine.name} · ${medicine.dose}`} />)}
      </Section>

      <Section title="Questions you may want to ask">
        {questions.map((question, index) => <View key={question} style={styles.question}><View style={styles.number}><Text variant="headline" color={colors.plum}>{index + 1}</Text></View><Text variant="body" style={[styles.body, styles.flex]}>{question}</Text></View>)}
      </Section>

      <Button title="Ask Circle to help me prepare" onPress={() => router.push('/ai?prompt=Help%20me%20prepare%20for%20my%20physiotherapy%20appointment.')} />
    </ScreenContainer>
  );
}

function Info({ icon, title, detail }: { icon: keyof typeof Feather.glyphMap; title: string; detail: string }) {
  return <View style={styles.info}><View style={styles.infoIcon}><Feather name={icon} size={23} color={colors.blue} /></View><View style={styles.flex}><Text variant="title3">{title}</Text><Text variant="body" color={colors.textSecondary} style={styles.body}>{detail}</Text></View></View>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <View style={styles.section}><Text variant="title2">{title}</Text><Card padding={spacing.md} elevation="none" bordered>{children}</Card></View>;
}
function PlainRow({ text }: { text: string }) {
  return <View style={styles.plainRow}><Feather name="check-circle" size={22} color={colors.sage} /><Text variant="body" style={[styles.body, styles.flex]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  heading: { gap: spacing.sm },
  body: { fontSize: 18, lineHeight: 26 },
  info: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  infoIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  flex: { flex: 1, minWidth: 0 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong, marginVertical: spacing.md },
  section: { gap: spacing.md },
  plainRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.sm },
  question: { minHeight: 70, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.borderStrong },
  number: { width: 42, height: 42, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.plumTint },
});
