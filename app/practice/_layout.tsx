import { Stack } from 'expo-router';
import { colors } from '@/theme';

export default function PracticeLayout() {
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}><Stack.Screen name="(tabs)" /><Stack.Screen name="services" /><Stack.Screen name="request/[id]" /></Stack>;
}
