import '@/global.css';

import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { cssInterop } from 'nativewind';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FONTS } from '@/lib/fonts';
import { useStore } from '@/lib/store/store';
import { mark, measure } from '@/lib/perf';
import { NAV_THEME, THEME } from '@/lib/theme';

// On web an Animated.View drops its class names unless it is registered; native passes them
// through to the inner View already.
if (Platform.OS === 'web') cssInterop(Animated.View, { className: 'style' });

SplashScreen.preventAutoHideAsync();
mark('launch');

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
      measure('launch', 'JS start → first screen');
    }
  }, [ready]);

  if (!ready && Platform.OS !== 'web') {
    return null;
  }

  // The gesture root is a plain view; drag-to-reorder in the workout builder needs it.
  // SafeAreaProvider is sync (no startup cost): without it useSafeAreaInsets() reads 0 on
  // edge-to-edge Android, so footers and full-screen timers sit under the nav bar.
  return (
    <SafeAreaProvider>
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
            <Stack.Screen name="(tabs)" options={{ headerShown: false, title: '67slopers' }} />
            <Stack.Screen name="sessions" options={{ title: 'Sessions' }} />
            <Stack.Screen name="presets" options={{ title: 'Classic workouts' }} />
            <Stack.Screen name="workout/new" options={{ title: 'New workout' }} />
            <Stack.Screen name="workout/[id]/index" options={{ title: '' }} />
            <Stack.Screen name="workout/[id]/edit" options={{ title: 'Edit workout' }} />
            <Stack.Screen name="session/[id]" options={{ title: 'Session' }} />
            <Stack.Screen name="import" options={{ title: 'Shared workout' }} />
            <Stack.Screen name="climb/setup" options={{ title: 'Set up board' }} />
            <Stack.Screen name="climb/connect" options={{ title: 'Connect lights' }} />
            <Stack.Screen name="climb/lights" options={{ title: 'Board lights' }} />
            <Stack.Screen name="climb/board" options={{ title: 'MoonBoard' }} />
            <Stack.Screen name="climb/problem/[id]" options={{ title: '' }} />
            <Stack.Screen name="climb/new" options={{ title: 'New problem' }} />
            <Stack.Screen name="climb/import" options={{ title: 'Shared problem' }} />
            <Stack.Screen name="climb/circuit/[id]/index" options={{ title: 'Circuit' }} />
            <Stack.Screen name="climb/circuit/[id]/edit" options={{ title: 'Edit circuit' }} />
            <Stack.Screen name="climb/session/[id]" options={{ title: 'Session' }} />
            <Stack.Screen
              name="climb/circuit/[id]/run"
              options={{
                headerShown: false,
                presentation: 'fullScreenModal',
                gestureEnabled: false,
                animation: 'slide_from_bottom',
              }}
            />
            {(['workout/[id]/share', 'climb/share/[id]', 'scan'] as const).map((route) => (
              <Stack.Screen
                key={route}
                name={route}
                options={{
                  headerShown: false,
                  presentation: 'fullScreenModal',
                  animation: 'slide_from_bottom',
                }}
              />
            ))}
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
    </SafeAreaProvider>
  );
}
