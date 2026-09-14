import { create } from "zustand";
import { updateSettings, getSettings } from "@/lib/db";
import { ReminderItem, DEFAULT_REMINDERS, generateId } from "@/lib/db/types";
import { syncScheduledAlarms, triggerTestNotification } from "@/lib/services/notifications";

interface SettingsState {
  currency: string;
  isPrivacyMode: boolean;
  themeMode: 'system' | 'light' | 'dark';
  isReminderEnabled: boolean;
  reminders: ReminderItem[];
  setCurrency: (currency: string) => void;
  togglePrivacyMode: () => void;
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
  loadSettings: () => Promise<void>;
  toggleReminderEnabled: () => Promise<void>;
  toggleReminderItem: (id: string) => Promise<void>;
  addReminderItem: (time: string, label: string) => Promise<string>;
  deleteReminderItem: (id: string) => Promise<void>;
  updateReminderItem: (id: string, time: string, label: string) => Promise<void>;
  testNotification: () => Promise<void>;
}

function getRunwayDays(): number {
  try {
    const { useFinanceStore } = require("@/store/useFinanceStore");
    const runway = useFinanceStore.getState().runway;
    return runway?.operationalRunwayDays ?? 0;
  } catch (_) {
    return 0;
  }
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  currency: 'IDR',
  isPrivacyMode: false,
  themeMode: 'system',
  isReminderEnabled: true,
  reminders: DEFAULT_REMINDERS,

  setCurrency: (currency) => {
    set({ currency });
    updateSettings({ currency }).catch(console.error);
  },

  togglePrivacyMode: () => {
    const nextVal = !get().isPrivacyMode;
    set({ isPrivacyMode: nextVal });
    updateSettings({ isPrivacyMode: nextVal ? 1 : 0 }).catch(console.error);
  },

  setThemeMode: (mode) => {
    set({ themeMode: mode });
    try {
      const { colorScheme } = require("nativewind");
      colorScheme.set(mode);
    } catch (_) {}
    updateSettings({ themeMode: mode }).catch(console.error);
  },

  loadSettings: async () => {
    try {
      const dbSettings = await getSettings();
      if (!dbSettings) return;

      let parsedReminders = DEFAULT_REMINDERS;
      if (dbSettings.reminderTimes) {
        try {
          parsedReminders = JSON.parse(dbSettings.reminderTimes);
        } catch (_) {
          parsedReminders = DEFAULT_REMINDERS;
        }
      }

      parsedReminders = parsedReminders.map((r) =>
        r.id === 'rem_morning' || r.id === 'rem_lunch' || r.id === 'rem_evening'
          ? { ...r, label: '' }
          : r
      );

      const isReminderEnabled = dbSettings.isReminderEnabled !== undefined
        ? Boolean(dbSettings.isReminderEnabled)
        : true;

      const currency = dbSettings.currency || 'IDR';
      const isPrivacyMode = Boolean(dbSettings.isPrivacyMode);
      const themeMode = (dbSettings.themeMode as 'system' | 'light' | 'dark') || 'system';

      set({
        currency,
        isPrivacyMode,
        themeMode,
        isReminderEnabled,
        reminders: parsedReminders,
      });

      try {
        const { colorScheme } = require("nativewind");
        colorScheme.set(themeMode);
      } catch (_) {}
    } catch (error) {
      console.error("Failed to load settings in useSettingsStore:", error);
    }
  },

  toggleReminderEnabled: async () => {
    const nextEnabled = !get().isReminderEnabled;
    const currentReminders = get().reminders;
    set({ isReminderEnabled: nextEnabled });

    try {
      await updateSettings({ isReminderEnabled: nextEnabled ? 1 : 0 });
    } catch (err) {
      console.error("Failed to update isReminderEnabled in DB:", err);
    }

    try {
      const runwayDays = getRunwayDays();
      await syncScheduledAlarms(currentReminders, nextEnabled, runwayDays);
    } catch (err) {
      console.error("Failed to sync alarms on toggleReminderEnabled:", err);
    }
  },

  toggleReminderItem: async (id: string) => {
    const updatedReminders = get().reminders.map((item) =>
      item.id === id ? { ...item, isEnabled: !item.isEnabled } : item
    );
    set({ reminders: updatedReminders });

    try {
      await updateSettings({ reminderTimes: JSON.stringify(updatedReminders) });
    } catch (err) {
      console.error("Failed to save updated reminder items to DB:", err);
    }

    try {
      const runwayDays = getRunwayDays();
      await syncScheduledAlarms(updatedReminders, get().isReminderEnabled, runwayDays);
    } catch (err) {
      console.error("Failed to sync alarms on toggleReminderItem:", err);
    }
  },

  addReminderItem: async (time: string, label: string) => {
    const newId = generateId('rem');
    const newItem: ReminderItem = {
      id: newId,
      time,
      label,
      isEnabled: true,
    };
    const updatedReminders = [...get().reminders, newItem];
    set({ reminders: updatedReminders });

    try {
      await updateSettings({ reminderTimes: JSON.stringify(updatedReminders) });
    } catch (err) {
      console.error("Failed to add reminder item to DB:", err);
    }

    try {
      const runwayDays = getRunwayDays();
      await syncScheduledAlarms(updatedReminders, get().isReminderEnabled, runwayDays);
    } catch (err) {
      console.error("Failed to sync alarms on addReminderItem:", err);
    }

    return newId;
  },

  deleteReminderItem: async (id: string) => {
    const updatedReminders = get().reminders.filter((item) => item.id !== id);
    set({ reminders: updatedReminders });

    try {
      await updateSettings({ reminderTimes: JSON.stringify(updatedReminders) });
    } catch (err) {
      console.error("Failed to delete reminder item from DB:", err);
    }

    try {
      const runwayDays = getRunwayDays();
      await syncScheduledAlarms(updatedReminders, get().isReminderEnabled, runwayDays);
    } catch (err) {
      console.error("Failed to sync alarms on deleteReminderItem:", err);
    }
  },

  updateReminderItem: async (id: string, time: string, label: string) => {
    const updatedReminders = get().reminders.map((item) =>
      item.id === id ? { ...item, time, label } : item
    );
    set({ reminders: updatedReminders });

    try {
      await updateSettings({ reminderTimes: JSON.stringify(updatedReminders) });
    } catch (err) {
      console.error("Failed to update reminder item in DB:", err);
    }

    try {
      const runwayDays = getRunwayDays();
      await syncScheduledAlarms(updatedReminders, get().isReminderEnabled, runwayDays);
    } catch (err) {
      console.error("Failed to sync alarms on updateReminderItem:", err);
    }
  },

  testNotification: async () => {
    const runwayDays = getRunwayDays();
    await triggerTestNotification(runwayDays);
  },
}));
