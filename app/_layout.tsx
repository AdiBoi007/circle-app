import { useEffect } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppStateProvider, useAppState } from "@/state";
import { colors } from "@/theme";
import { liveMode } from "@/live/mode";

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
        <AppNavigator />
      </AppStateProvider>
    </SafeAreaProvider>
  );
}

function AppNavigator() {
  const { activeAccountId, hasStarted } = useAppState();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="beta" />
      <Stack.Protected guard={!liveMode}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Protected
          guard={hasStarted && activeAccountId === "practitioner"}
        >
          <Stack.Screen name="practice" />
        </Stack.Protected>
        <Stack.Protected guard={hasStarted}>
          <Stack.Screen name="practitioner-profile" />
        </Stack.Protected>
        <Stack.Protected
          guard={hasStarted && activeAccountId !== "practitioner"}
        >
          <Stack.Screen name="request-care" />
          <Stack.Screen name="care-request/[id]" />
        </Stack.Protected>
        <Stack.Protected
          guard={
            hasStarted &&
            (activeAccountId === "arjun" || activeAccountId === "savita")
          }
        >
          <Stack.Screen
            name="notifications"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="quick-add/[kind]"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen
            name="savita-upload"
            options={{ presentation: "modal" }}
          />
          <Stack.Screen name="appointment-prep/[id]" />
          <Stack.Screen name="records" />
          <Stack.Screen name="record/[id]" />
          <Stack.Screen name="medications" />
          <Stack.Screen name="booking/[id]" />
          <Stack.Screen name="provider/[id]" />
          <Stack.Screen name="emergency" />
          <Stack.Screen name="settings/[section]" />
          <Stack.Screen name="consultation/[id]" />
          <Stack.Screen name="member/[id]" />
          <Stack.Screen name="metric/[memberId]/[kind]" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="tasks" />
          <Stack.Screen name="goals" />
          <Stack.Screen name="insights" />
        </Stack.Protected>
        <Stack.Screen name="personal/bookings" />
        <Stack.Screen name="personal/records" />
        <Stack.Screen name="personal/booking/[id]" />
        <Stack.Screen name="personal/provider/[id]" />
      </Stack.Protected>
    </Stack>
  );
}
