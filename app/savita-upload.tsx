import { useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, DetailHeader, ScreenContainer } from '@/components';
import { PersonalText as Text } from '@/accounts/savita/PersonalText';
import { useAppState } from '@/state';
import { colors, radius, spacing } from '@/theme';
import type { HealthRecord } from '@/types';

type Step = 'choose' | 'preview' | 'uploading' | 'result';

export default function SavitaUploadScreen() {
  const { addRecord, personalPreferences } = useAppState();
  const [step, setStep] = useState<Step>('choose');
  const [recordId, setRecordId] = useState('');

  const addDocument = () => {
    setStep('uploading');
    setTimeout(() => {
      const id = `savita-upload-${Date.now()}`;
      const record: HealthRecord = {
        id,
        memberId: 'savita',
        title: 'Knee and Mobility Report',
        date: '13 July 2026',
        category: 'Consultation',
        status: 'Ready',
        note: 'Photographed and added by Savita',
        values: [
          { label: 'Knee pain', value: '6 out of 10' },
          { label: 'Mobility', value: 'Exercises recommended' },
        ],
        explanation: 'This report records Savita’s current knee discomfort and mobility plan. It does not change her treatment. A physiotherapist can answer questions about the exercises.',
      };
      addRecord(record);
      setRecordId(id);
      setStep('result');
    }, personalPreferences.reduceMotion ? 0 : 650);
  };

  return (
    <ScreenContainer edges={['top', 'bottom']} contentStyle={styles.content}>
      <DetailHeader title="Add a report" />
      {step === 'choose' ? (
        <>
          <View style={styles.heading}>
            <Text variant="title1">Choose your document</Text>
            <Text variant="body" color={colors.textSecondary} style={styles.body}>You can take a new photo or choose something already on your phone.</Text>
          </View>
          <View style={styles.choices}>
            <SourceButton icon="camera" title="Take a photo" onPress={() => setStep('preview')} />
            <SourceButton icon="image" title="Choose from photos" onPress={() => setStep('preview')} />
            <SourceButton icon="file-text" title="Choose a file" onPress={() => setStep('preview')} />
          </View>
        </>
      ) : null}

      {step === 'preview' ? (
        <>
          <View style={styles.heading}>
            <Text variant="title1">Is this the right document?</Text>
            <Text variant="body" color={colors.textSecondary} style={styles.body}>Knee and Mobility Report · 1 page</Text>
          </View>
          <DocumentPreview />
          <View style={styles.buttons}>
            <Button title="Use this" onPress={addDocument} />
            <Button title="Try again" variant="secondary" onPress={() => setStep('choose')} />
          </View>
        </>
      ) : null}

      {step === 'uploading' ? (
        <View style={styles.processing} accessibilityRole="progressbar" accessibilityLabel="Adding your report">
          <ActivityIndicator size="large" color={colors.blue} />
          <Text variant="title2">Adding your report…</Text>
          <Text variant="body" color={colors.textSecondary} style={styles.body}>Circle is putting it in your health records.</Text>
        </View>
      ) : null}

      {step === 'result' ? (
        <View style={styles.result} accessibilityRole="summary" accessibilityLiveRegion="polite">
          <View style={styles.successIcon}><Feather name="check" size={34} color={colors.white} /></View>
          <Text variant="title1" align="center">Your report has been added.</Text>
          <Text variant="body" color={colors.textSecondary} align="center" style={styles.body}>Circle will help explain it in simple language.</Text>
          <Card elevation="none" bordered style={styles.resultCard}>
            <Feather name="file-text" size={28} color={colors.plum} />
            <View style={styles.flex}><Text variant="headline">Knee and Mobility Report</Text><Text variant="body" color={colors.textSecondary} style={styles.body}>Added today</Text></View>
          </Card>
          <View style={styles.buttons}>
            <Button title="Explain this report" onPress={() => router.replace(`/ai?prompt=Explain%20my%20latest%20report.&recordId=${recordId}`)} />
            <Button title="Done" variant="secondary" onPress={() => router.replace('/')} />
          </View>
        </View>
      ) : null}
    </ScreenContainer>
  );
}

function SourceButton({ icon, title, onPress }: { icon: keyof typeof Feather.glyphMap; title: string; onPress: () => void }) {
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={({ pressed }) => [styles.source, pressed && styles.pressed]}><View style={styles.sourceIcon}><Feather name={icon} size={27} color={colors.blue} /></View><Text variant="title3" style={styles.flex}>{title}</Text><Feather name="chevron-right" size={24} color={colors.textSecondary} /></Pressable>;
}

function DocumentPreview() {
  return (
    <View style={styles.document} accessibilityLabel="Preview of Knee and Mobility Report">
      <View style={styles.paperHeader}><View style={styles.logoMark}><Feather name="activity" size={22} color={colors.plum} /></View><View><Text variant="headline">Mobility Clinic</Text><Text variant="subhead" color={colors.textSecondary}>Knee and Mobility Report</Text></View></View>
      <View style={styles.paperLineWide} /><View style={styles.paperLine} /><View style={styles.paperLineWide} />
      <View style={styles.documentBox}><Text variant="subhead" color={colors.textSecondary}>CURRENT CONCERN</Text><Text variant="title3">Knee discomfort</Text><Text variant="body" style={styles.body}>Pain noted as 6 out of 10.</Text></View>
      <View style={styles.paperLine} /><View style={styles.paperLineWide} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.xl },
  heading: { gap: spacing.sm },
  body: { fontSize: 18, lineHeight: 26 },
  choices: { gap: spacing.md },
  source: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.card, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderStrong },
  sourceIcon: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueTint },
  flex: { flex: 1, minWidth: 0 },
  document: { minHeight: 390, padding: spacing.xxl, borderRadius: radius.card, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.borderStrong, gap: spacing.xl },
  paperHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logoMark: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.plumTint },
  paperLine: { height: 8, width: '68%', borderRadius: 4, backgroundColor: colors.surfaceMuted },
  paperLineWide: { height: 8, width: '100%', borderRadius: 4, backgroundColor: colors.surfaceMuted },
  documentBox: { gap: spacing.sm, padding: spacing.lg, borderRadius: radius.input, backgroundColor: colors.plumTint },
  buttons: { gap: spacing.md },
  processing: { minHeight: 440, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  result: { alignItems: 'center', gap: spacing.lg },
  successIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.sage },
  resultCard: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  pressed: { opacity: 0.7 },
});
