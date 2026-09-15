import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import { ReminderItem } from '@/lib/db/types';
import { translate, ActiveLocale } from '@/lib/i18n';

export const REMINDER_CHANNEL_ID = 'cashrunway-reminders';
export const REMINDER_SOUND_NAME = 'reminder.wav';

// Configure foreground notification presentation handler safely
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (err) {
  console.warn('[Notifications] Failed to set notification handler:', err);
}

/**
 * Parse time string in 'HH:mm' format with fallback to 20:00
 */
export function parseTimeString(timeStr: string): { hour: number; minute: number } {
  if (!timeStr || typeof timeStr !== 'string') {
    return { hour: 20, minute: 0 };
  }

  const parts = timeStr.split(':');
  if (parts.length !== 2) {
    return { hour: 20, minute: 0 };
  }

  const hour = parseInt(parts[0], 10);
  const minute = parseInt(parts[1], 10);

  if (isNaN(hour) || isNaN(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return { hour: 20, minute: 0 };
  }

  return { hour, minute };
}

/**
 * Generate contextual notification message based on financial runway days
 */
export function generateReminderMessage(
  runwayDays: number,
  _time?: string,
  localeOverride?: ActiveLocale
): { title: string; body: string } {
  const title = 'CashRunway';

  if (runwayDays <= 0) {
    return {
      title,
      body: translate('notifications.reminderDepleted', undefined, localeOverride),
    };
  }

  if (runwayDays > 365) {
    return {
      title,
      body: translate('notifications.reminderHealthy', undefined, localeOverride),
    };
  }

  return {
    title,
    body: translate(
      'notifications.reminderRunway',
      { days: Math.round(runwayDays) },
      localeOverride
    ),
  };
}

/**
 * Configure Android notification channel with custom chime sound
 */
export async function setupNotificationChannelAsync(): Promise<void> {
  try {
    if (Platform.OS === 'android' || Platform.OS === 'web' || process.env.NODE_ENV === 'test') {
      await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
        name: translate('notifications.channelName'),
        importance: Notifications.AndroidImportance.HIGH,
        sound: REMINDER_SOUND_NAME,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
        enableVibrate: true,
      });
    }
  } catch (err) {
    console.warn('[Notifications] setupNotificationChannelAsync warning:', err);
  }
}

/**
 * Request notification permissions from user
 */
export async function requestNotificationPermissionsAsync(): Promise<boolean> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    if (settings.granted || settings.status === 'granted') {
      return true;
    }

    const requested = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
      },
    });

    return requested.granted || requested.status === 'granted';
  } catch (err) {
    console.warn('[Notifications] requestNotificationPermissionsAsync error:', err);
    return false;
  }
}

/**
 * Synchronize scheduled daily alarms with OS
 */
export async function syncScheduledAlarms(
  reminders: ReminderItem[],
  isEnabled: boolean,
  runwayDays: number
): Promise<void> {
  try {
    // Cancel previous alarms
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!isEnabled) {
      return;
    }

    // Ensure channel exists on Android
    await setupNotificationChannelAsync();

    const enabledReminders = reminders.filter((r) => r.isEnabled);

    for (const reminder of enabledReminders) {
      const { hour, minute } = parseTimeString(reminder.time);
      const message = generateReminderMessage(runwayDays, reminder.time);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: message.title,
          body: message.body,
          sound: REMINDER_SOUND_NAME,
          data: {
            reminderId: reminder.id,
            time: reminder.time,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
          channelId: REMINDER_CHANNEL_ID,
        },
      });
    }
  } catch (err) {
    console.warn('[Notifications] syncScheduledAlarms error:', err);
  }
}

/**
 * Trigger an immediate 1-second test notification
 */
export async function triggerTestNotification(runwayDays: number): Promise<void> {
  try {
    await setupNotificationChannelAsync();
    const message = generateReminderMessage(runwayDays);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: message.title,
        body: message.body,
        sound: REMINDER_SOUND_NAME,
        data: { isTest: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 1,
        repeats: false,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
  } catch (err) {
    console.warn('[Notifications] triggerTestNotification error:', err);
    Alert.alert(
      'Notifikasi',
      'Tidak dapat memicu notifikasi pada lingkungan saat ini. Untuk pengujian suara penuh, gunakan Development Build (npx expo run:android).'
    );
  }
}

/**
 * Listen for notification responses (tap events in background/foreground/cold-start)
 * and trigger Quick Entry
 */
export function setupNotificationResponseListeners(
  onOpenQuickEntry: () => void
): () => void {
  try {
    // Check cold start response
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          onOpenQuickEntry();
        }
      })
      .catch((err) => {
        console.warn('[Notifications] Error getting last notification response:', err);
      });

    // Listen for foreground / background response tap
    const subscription = Notifications.addNotificationResponseReceivedListener((_response) => {
      onOpenQuickEntry();
    });

    return () => {
      subscription.remove();
    };
  } catch (err) {
    console.warn('[Notifications] setupNotificationResponseListeners error:', err);
    return () => {};
  }
}
