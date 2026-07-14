import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppStateProvider } from '@/state';
import { colors } from '@/theme';

// Keep the warm splash visible until the first frame is ready, avoiding a
// jarring white flash on launch.
SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op: splash may already be hidden */
});

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {
      /* no-op */
    });
  }, []);

  return (
    <SafeAreaProvider>
      <AppStateProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
          <Stack.Screen name="quick-add/[kind]" options={{ presentation: 'modal' }} />
          <Stack.Screen name="savita-upload" options={{ presentation: 'modal' }} />
          <Stack.Screen name="appointment-prep/[id]" />
        </Stack>
      </AppStateProvider>
    </SafeAreaProvider>
  );
}
