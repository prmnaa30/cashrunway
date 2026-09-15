import { StatusBar } from 'expo-status-bar';
import 'react-native-gesture-handler';
import "../global.css";
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SQLiteProvider } from "expo-sqlite";

import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useColorScheme } from '@/components/useColorScheme';
import { DATABASE_NAME, initDatabase } from '@/lib/db';

import { setupQuickActions } from '@/lib/services/quickActions';
import {
  setupNotificationChannelAsync,
  requestNotificationPermissionsAsync,
  setupNotificationResponseListeners,
} from '@/lib/services/notifications';
import { useQuickEntryStore } from '@/store/useQuickEntryStore';
import { useQuickActionCallback } from 'expo-quick-actions/hooks';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName={DATABASE_NAME} onInit={initDatabase}>
        <BottomSheetModalProvider>
          <RootLayoutNav />
        </BottomSheetModalProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    setupQuickActions();
    setupNotificationChannelAsync();
    requestNotificationPermissionsAsync();

    // Initialize backup store session
    try {
      const { useBackupStore } = require('@/store/useBackupStore');
      useBackupStore.getState().initialize().catch(() => {});
    } catch (_) {}

    const cleanupListeners = setupNotificationResponseListeners(() => {
      useQuickEntryStore.getState().open('expense');
    });

    // AppState listener to trigger auto-backup when transitioning to background
    const { AppState } = require('react-native');
    const appStateSubscription = AppState.addEventListener('change', (nextAppState: string) => {
      if (nextAppState.match(/inactive|background/)) {
        try {
          const { useBackupStore } = require('@/store/useBackupStore');
          const backupState = useBackupStore.getState();
          if (backupState.isAutoBackupEnabled && backupState.isSignedIn) {
            backupState.createBackup(true).catch(() => {});
          }
        } catch (_) {}
      }
    });

    return () => {
      cleanupListeners();
      appStateSubscription.remove();
    };
  }, []);

  useQuickActionCallback((action) => {
    const mode = action.params?.mode;
    if (mode === 'expense' || mode === 'income') {
      useQuickEntryStore.getState().open(mode);
    }
  });

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} animated />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}

