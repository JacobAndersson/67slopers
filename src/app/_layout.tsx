import '@/global.css';

import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { FONTS } from '@/lib/fonts';
import { useStore } from '@/lib/store/store';
import { NAV_THEME, THEME } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONTS);
  const hydrated = useStore((s) => s.hydrated);

  // Native waits for fonts and the persisted store (a few ms of AsyncStorage) behind the
  // splash so the first frame is the populated home screen. Web is statically rendered
  // and fills in on the client instead.
  const ready = (fontsLoaded || fontError !== null) && (hydrated || Platform.OS === 'web');

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready && Platform.OS !== 'web') {
    return null;
  }

  // The gesture root is a plain view; drag-to-reorder in the workout builder needs it.
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider value={NAV_THEME}>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: THEME.background },
            headerTintColor: THEME.foreground,
            headerTitleStyle: { fontFamily: 'GeistMono_600SemiBold' },
            headerShadowVisible: false,
            headerBackButtonDisplayMode: 'minimal',
            contentStyle: { backgroundColor: THEME.background },
          }}>
          <Stack.Screen name="index" options={{ title: '67slopers' }} />
          <Stack.Screen name="workouts" options={{ title: 'Your workouts' }} />
          <Stack.Screen name="sessions" options={{ title: 'Latest workouts' }} />
          <Stack.Screen name="calendar" options={{ title: 'Calendar' }} />
          <Stack.Screen name="presets" options={{ title: 'Classic workouts' }} />
          <Stack.Screen name="workout/new" options={{ title: 'New workout' }} />
          <Stack.Screen name="workout/[id]/index" options={{ title: '' }} />
          <Stack.Screen name="workout/[id]/edit" options={{ title: 'Edit workout' }} />
          <Stack.Screen name="session/[id]" options={{ title: 'Session' }} />
          {(['workout/[id]/run', 'workout/run'] as const).map((route) => (
            <Stack.Screen
              key={route}
              name={route}
              options={{
                headerShown: false,
                presentation: 'fullScreenModal',
                gestureEnabled: false,
                animation: 'slide_from_bottom',
              }}
            />
          ))}
        </Stack>
        <PortalHost />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
