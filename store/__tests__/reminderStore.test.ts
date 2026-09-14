import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock lib/services/notifications
vi.mock('@/lib/services/notifications', () => ({
  syncScheduledAlarms: vi.fn().mockResolvedValue(undefined),
  triggerTestNotification: vi.fn().mockResolvedValue(undefined),
}));

// Mock lib/db
vi.mock('@/lib/db', () => ({
  updateSettings: vi.fn().mockResolvedValue(null),
  getSettings: vi.fn().mockResolvedValue({
    id: 1,
    currency: 'IDR',
    isPrivacyMode: 0,
    themeMode: 'system',
    isReminderEnabled: 1,
    reminderTimes: JSON.stringify([
      { id: 'rem_morning', time: '09:00', label: 'Pagi (Kesiapan Kas)', isEnabled: false },
      { id: 'rem_evening', time: '20:00', label: 'Malam (Rekap Harian & Sisa Napas)', isEnabled: true },
    ]),
  }),
}));

import { useSettingsStore } from '../useSettingStore';
import { syncScheduledAlarms, triggerTestNotification } from '@/lib/services/notifications';
import { updateSettings, getSettings } from '@/lib/db';
import { DEFAULT_REMINDERS } from '@/lib/db/types';

describe('useSettingsStore Reminders', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSettingsStore.setState({
      currency: 'IDR',
      isPrivacyMode: false,
      themeMode: 'system',
      isReminderEnabled: true,
      reminders: DEFAULT_REMINDERS,
    });
  });

  it('should initialize with default reminder values', () => {
    const state = useSettingsStore.getState();
    expect(state.isReminderEnabled).toBe(true);
    expect(state.reminders).toBeDefined();
    expect(state.reminders.length).toBeGreaterThan(0);
    expect(state.reminders.some((r) => r.time === '20:00' && r.isEnabled)).toBe(true);
  });

  it('should load settings from DB and populate state', async () => {
    await useSettingsStore.getState().loadSettings();

    expect(getSettings).toHaveBeenCalled();
    const state = useSettingsStore.getState();
    expect(state.isReminderEnabled).toBe(true);
    expect(state.reminders).toHaveLength(2);
    expect(state.reminders[0].id).toBe('rem_morning');
  });

  it('should toggle reminder enabled state, update DB, and sync alarms', async () => {
    const initialEnabled = useSettingsStore.getState().isReminderEnabled;
    await useSettingsStore.getState().toggleReminderEnabled();

    const state = useSettingsStore.getState();
    expect(state.isReminderEnabled).toBe(!initialEnabled);
    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        isReminderEnabled: !initialEnabled ? 1 : 0,
      })
    );
    expect(syncScheduledAlarms).toHaveBeenCalledWith(
      state.reminders,
      !initialEnabled,
      expect.any(Number)
    );
  });

  it('should toggle a specific reminder item, update DB, and sync alarms', async () => {
    const target = useSettingsStore.getState().reminders[0];
    const initialItemStatus = target.isEnabled;

    await useSettingsStore.getState().toggleReminderItem(target.id);

    const state = useSettingsStore.getState();
    const updated = state.reminders.find((r) => r.id === target.id);
    expect(updated?.isEnabled).toBe(!initialItemStatus);

    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderTimes: JSON.stringify(state.reminders),
      })
    );
    expect(syncScheduledAlarms).toHaveBeenCalled();
  });

  it('should add a reminder item, update DB, and sync alarms', async () => {
    const newId = await useSettingsStore.getState().addReminderItem('15:30', 'Sore');
    expect(newId).toBeDefined();

    const state = useSettingsStore.getState();
    const added = state.reminders.find((r) => r.id === newId);
    expect(added).toBeDefined();
    expect(added?.time).toBe('15:30');
    expect(added?.label).toBe('Sore');
    expect(added?.isEnabled).toBe(true);

    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderTimes: JSON.stringify(state.reminders),
      })
    );
    expect(syncScheduledAlarms).toHaveBeenCalled();
  });

  it('should delete a reminder item, update DB, and sync alarms', async () => {
    const newId = await useSettingsStore.getState().addReminderItem('15:30', 'Sore');
    vi.clearAllMocks();

    await useSettingsStore.getState().deleteReminderItem(newId);

    const state = useSettingsStore.getState();
    const found = state.reminders.find((r) => r.id === newId);
    expect(found).toBeUndefined();

    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderTimes: JSON.stringify(state.reminders),
      })
    );
    expect(syncScheduledAlarms).toHaveBeenCalled();
  });

  it('should update a reminder item time and label, update DB, and sync alarms', async () => {
    const target = useSettingsStore.getState().reminders[0];

    await useSettingsStore.getState().updateReminderItem(target.id, '16:00', 'Sore Baru');

    const state = useSettingsStore.getState();
    const updated = state.reminders.find((r) => r.id === target.id);
    expect(updated?.time).toBe('16:00');
    expect(updated?.label).toBe('Sore Baru');

    expect(updateSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        reminderTimes: JSON.stringify(state.reminders),
      })
    );
    expect(syncScheduledAlarms).toHaveBeenCalled();
  });

  it('should call triggerTestNotification with runway days', async () => {
    await useSettingsStore.getState().testNotification();
    expect(triggerTestNotification).toHaveBeenCalledWith(expect.any(Number));
  });
});
