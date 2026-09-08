import '@/global.css';

import { PortalHost } from '@rn-primitives/portal';
import { useFonts } from 'expo-font';
import { ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import AppTabs from '@/components/app-tabs';
import { FONTS } from '@/lib/fonts';
import { NAV_THEME } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  const [fontsLoaded, fontError] = useFonts(FONTS);
  const fontsReady = fontsLoaded || fontError !== null;

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  // Keep the splash screen up until the typeface is available on native. The web
  // build is statically rendered, so it renders immediately and swaps fonts in.
  if (!fontsReady && Platform.OS !== 'web') {
    return null;
  }

  return (
    <ThemeProvider value={NAV_THEME[scheme]}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <AppTabs />
      <PortalHost />
    </ThemeProvider>
  );
}
