import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock expo-localization
vi.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'id', regionCode: 'ID' }],
}));

// Mock useFinanceStore to prevent loading native SQLite in node
vi.mock('@/store/useFinanceStore', () => ({
  useFinanceStore: {
    getState: () => ({
      settings: { language: 'id' },
    }),
  },
}));

// Mock expo-notifications
vi.mock('expo-notifications', () => {
  return {
    setNotificationHandler: vi.fn(),
    setNotificationChannelAsync: vi.fn().mockResolvedValue({}),
    getPermissionsAsync: vi.fn().mockResolvedValue({
      granted: true,
      status: 'granted',
      canAskAgain: true,
      expires: 'never',
    }),
    requestPermissionsAsync: vi.fn().mockResolvedValue({
      granted: true,
      status: 'granted',
      canAskAgain: true,
      expires: 'never',
    }),
    cancelAllScheduledNotificationsAsync: vi.fn().mockResolvedValue(undefined),
    scheduleNotificationAsync: vi.fn().mockResolvedValue('notif_123'),
    getLastNotificationResponseAsync: vi.fn().mockResolvedValue(null),
    addNotificationResponseReceivedListener: vi.fn().mockReturnValue({
      remove: vi.fn(),
    }),
    SchedulableTriggerInputTypes: {
      DAILY: 'daily',
      TIME_INTERVAL: 'timeInterval',
    },
    AndroidImportance: {
      HIGH: 6,
    },
    PermissionStatus: {
      GRANTED: 'granted',
      UNDETERMINED: 'undetermined',
      DENIED: 'denied',
    },
  };
});

import * as Notifications from 'expo-notifications';
import {
  parseTimeString,
  generateReminderMessage,
  setupNotificationChannelAsync,
  requestNotificationPermissionsAsync,
  syncScheduledAlarms,
  triggerTestNotification,
  setupNotificationResponseListeners,
} from '../notifications';
import { ReminderItem } from '@/lib/db/types';

describe('Notification Helpers & Business Logic', () => {
  describe('parseTimeString', () => {
    it('should parse valid HH:mm correctly', () => {
      expect(parseTimeString('20:00')).toEqual({ hour: 20, minute: 0 });
      expect(parseTimeString('09:15')).toEqual({ hour: 9, minute: 15 });
      expect(parseTimeString('23:59')).toEqual({ hour: 23, minute: 59 });
      expect(parseTimeString('00:00')).toEqual({ hour: 0, minute: 0 });
    });

    it('should fallback to 20:00 for invalid strings or out-of-range times', () => {
      expect(parseTimeString('invalid')).toEqual({ hour: 20, minute: 0 });
      expect(parseTimeString('25:00')).toEqual({ hour: 20, minute: 0 });
      expect(parseTimeString('12:60')).toEqual({ hour: 20, minute: 0 });
      expect(parseTimeString('')).toEqual({ hour: 20, minute: 0 });
    });
  });

  describe('generateReminderMessage', () => {
    it('should generate appropriate message for finite runway in both locales', () => {
      const msgId = generateReminderMessage(42, undefined, 'id');
      expect(msgId.title).toBe('CashRunway');
      expect(msgId.body).toContain('42 hari');
      expect(msgId.body.toLowerCase()).toContain('catat');

      const msgEn = generateReminderMessage(42, undefined, 'en');
      expect(msgEn.title).toBe('CashRunway');
      expect(msgEn.body).toContain('42');
      expect(msgEn.body.toLowerCase()).toContain('log');
    });

    it('should generate warning message for 0 or depleted runway in both locales', () => {
      const msg0Id = generateReminderMessage(0, undefined, 'id');
      expect(msg0Id.title).toBe('CashRunway');
      expect(msg0Id.body).toContain('habis');

      const msg0En = generateReminderMessage(0, undefined, 'en');
      expect(msg0En.title).toBe('CashRunway');
      expect(msg0En.body.toLowerCase()).toContain('run out');

      const msgNegative = generateReminderMessage(-5, undefined, 'id');
      expect(msgNegative.title).toBe('CashRunway');
      expect(msgNegative.body).toContain('habis');
    });

    it('should generate healthy message for very long runway (> 365 days) in both locales', () => {
      const msgId = generateReminderMessage(500, undefined, 'id');
      expect(msgId.title).toBe('CashRunway');
      expect(msgId.body).toContain('sehat');

      const msgEn = generateReminderMessage(500, undefined, 'en');
      expect(msgEn.title).toBe('CashRunway');
      expect(msgEn.body.toLowerCase()).toContain('healthy');
    });
  });
});

describe('Notification Service Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('setupNotificationChannelAsync', () => {
    it('configures android notification channel with custom sound reminder.wav', async () => {
      await setupNotificationChannelAsync();
      expect(Notifications.setNotificationChannelAsync).toHaveBeenCalledWith(
        'cashrunway-reminders',
        expect.objectContaining({
          sound: 'reminder.wav',
          importance: Notifications.AndroidImportance.HIGH,
        })
      );
    });
  });

  describe('requestNotificationPermissionsAsync', () => {
    it('returns true when permissions already granted', async () => {
      vi.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce({
        granted: true,
        status: Notifications.PermissionStatus.GRANTED,
        canAskAgain: true,
        expires: 'never',
      });
      const res = await requestNotificationPermissionsAsync();
      expect(res).toBe(true);
      expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    });

    it('requests permissions when not granted', async () => {
      vi.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce({
        granted: false,
        status: Notifications.PermissionStatus.UNDETERMINED,
        canAskAgain: true,
        expires: 'never',
      });
      vi.mocked(Notifications.requestPermissionsAsync).mockResolvedValueOnce({
        granted: true,
        status: Notifications.PermissionStatus.GRANTED,
        canAskAgain: true,
        expires: 'never',
      });
      const res = await requestNotificationPermissionsAsync();
      expect(res).toBe(true);
      expect(Notifications.requestPermissionsAsync).toHaveBeenCalled();
    });

    it('returns false when request is denied', async () => {
      vi.mocked(Notifications.getPermissionsAsync).mockResolvedValueOnce({
        granted: false,
        status: Notifications.PermissionStatus.DENIED,
        canAskAgain: false,
        expires: 'never',
      });
      vi.mocked(Notifications.requestPermissionsAsync).mockResolvedValueOnce({
        granted: false,
        status: Notifications.PermissionStatus.DENIED,
        canAskAgain: false,
        expires: 'never',
      });
      const res = await requestNotificationPermissionsAsync();
      expect(res).toBe(false);
    });
  });

  describe('syncScheduledAlarms', () => {
    const mockReminders: ReminderItem[] = [
      { id: 'rem_1', time: '09:00', label: 'Pagi', isEnabled: false },
      { id: 'rem_2', time: '20:00', label: 'Malam', isEnabled: true },
    ];

    it('cancels all scheduled notifications and schedules only enabled items when isEnabled is true', async () => {
      await syncScheduledAlarms(mockReminders, true, 30);
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledTimes(1);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            sound: 'reminder.wav',
            body: expect.stringContaining('30 hari'),
          }),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: 20,
            minute: 0,
            channelId: 'cashrunway-reminders',
          },
        })
      );
    });

    it('cancels all scheduled notifications without scheduling new ones if isEnabled is false', async () => {
      await syncScheduledAlarms(mockReminders, false, 30);
      expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
      expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
    });
  });

  describe('triggerTestNotification', () => {
    it('schedules an immediate test notification with 1 second delay', async () => {
      await triggerTestNotification(45);
      expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            sound: 'reminder.wav',
            body: expect.stringContaining('45 hari'),
          }),
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 1,
            repeats: false,
            channelId: 'cashrunway-reminders',
          },
        })
      );
    });
  });

  describe('setupNotificationResponseListeners', () => {
    it('registers response listener and checks cold-start response', async () => {
      const openQuickEntry = vi.fn();
      vi.mocked(Notifications.getLastNotificationResponseAsync).mockResolvedValueOnce({
        notification: {} as any,
        actionIdentifier: 'expo.modules.notifications.actions.DEFAULT',
      });

      const cleanup = setupNotificationResponseListeners(openQuickEntry);
      expect(Notifications.addNotificationResponseReceivedListener).toHaveBeenCalledTimes(1);
      await new Promise((r) => setTimeout(r, 10));
      expect(openQuickEntry).toHaveBeenCalledTimes(1);
      expect(typeof cleanup).toBe('function');
      cleanup();
    });
  });
});
