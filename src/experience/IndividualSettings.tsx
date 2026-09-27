import { useState } from 'react';
import { router } from 'expo-router';
import { View } from 'react-native';
import { AccountSection, Button, Card, DetailHeader, ScreenContainer, Sheet, Text } from '@/components';
import { useAppState } from '@/state';
import { colors } from '@/theme';

export function IndividualSettings() {
  const { resetDemo } = useAppState();
  const [resetOpen, setResetOpen] = useState(false);
  return <ScreenContainer bottomInset={36} contentStyle={{ gap: 24 }}>
    <DetailHeader title="Settings" /><AccountSection />
    <Card><Text variant="title3">Your personal space</Text><Text color={colors.textSecondary} style={{ marginTop: 12 }}>Riya Shah · Chandigarh, India</Text><Text color={colors.textSecondary} style={{ marginTop: 12 }}>Your habits, saved practitioners and appointments belong to this personal profile. No family is connected.</Text></Card>
    <Card><Text variant="title3">About this preview</Text><Text color={colors.textSecondary} style={{ marginTop: 12 }}>All health readings and practitioner profiles are examples. Bookings stay in this session; no payment is collected and no practitioner is contacted.</Text><Text color={colors.textSecondary} style={{ marginTop: 12 }}>Reloading resets the demo. Device connections, document uploads and live consultations will need a connected service.</Text></Card>
    <View style={{ gap: 12 }}><Button title="Explore the family experience" variant="secondary" onPress={() => router.push('/onboarding')} /><Button title="Reset all demo profiles" variant="tertiary" onPress={() => setResetOpen(true)} /></View>
    <Sheet visible={resetOpen} onClose={() => setResetOpen(false)} title="Start again?" footer={<Button title="Reset demo" onPress={() => { setResetOpen(false); resetDemo(); router.replace('/onboarding'); }} />}><Text>This clears the changes you’ve made to all three sample profiles in this session.</Text></Sheet>
  </ScreenContainer>;
}
