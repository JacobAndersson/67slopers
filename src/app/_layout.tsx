import '@/global.css';

import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { FONTS } from '@/lib/fonts';
import { useStore } from '@/lib/store/store';
import { NAV_THEME, THEME } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const colors = THEME[scheme];
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

  return (
    <ThemeProvider value={NAV_THEME[scheme]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontFamily: 'GeistMono_600SemiBold' },
          headerShadowVisible: false,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}>
        <Stack.Screen name="index" options={{ title: 'Hangboard' }} />
        <Stack.Screen name="workout/new" options={{ title: 'New workout' }} />
        <Stack.Screen name="workout/[id]/index" options={{ title: '' }} />
        <Stack.Screen name="workout/[id]/edit" options={{ title: 'Edit workout' }} />
        <Stack.Screen
          name="workout/[id]/run"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            gestureEnabled: false,
            animation: 'slide_from_bottom',
          }}
        />
      </Stack>
      <PortalHost />
    </ThemeProvider>
  );
}
