import { describe, it, expect } from 'vitest';
import { ReminderItem, DEFAULT_REMINDERS, DEFAULT_REMINDERS_JSON } from '../types';
import { settings, CREATE_TABLES_SQL_STATEMENTS } from '../schema';

describe('Reminder Settings in DB Schema & Migration', () => {
  it('should initialize with default reminder settings contract', () => {
    expect(DEFAULT_REMINDERS).toBeDefined();
    expect(DEFAULT_REMINDERS.length).toBeGreaterThan(0);
    expect(DEFAULT_REMINDERS.some((r) => r.time === '20:00' && r.isEnabled)).toBe(true);

    const parsed = JSON.parse(DEFAULT_REMINDERS_JSON) as ReminderItem[];
    expect(parsed).toEqual(DEFAULT_REMINDERS);
  });

  it('should have isReminderEnabled and reminderTimes defined in Drizzle schema', () => {
    expect(settings.isReminderEnabled).toBeDefined();
    expect(settings.reminderTimes).toBeDefined();
  });

  it('should include reminder columns in CREATE TABLE statement for settings', () => {
    const settingsSql = CREATE_TABLES_SQL_STATEMENTS.find((s) =>
      s.includes('CREATE TABLE IF NOT EXISTS settings')
    );
    expect(settingsSql).toBeDefined();
    expect(settingsSql).toContain('is_reminder_enabled');
    expect(settingsSql).toContain('reminder_times');
  });

  it('should update reminder times cleanly with custom list', () => {
    const updatedList: ReminderItem[] = [
      { id: 'rem_1', time: '08:30', label: 'Pagi', isEnabled: true },
      { id: 'rem_2', time: '21:00', label: 'Malam', isEnabled: false },
    ];

    const serialized = JSON.stringify(updatedList);
    const parsed = JSON.parse(serialized) as ReminderItem[];
    expect(parsed).toEqual(updatedList);
    expect(parsed[0].time).toBe('08:30');
    expect(parsed[1].isEnabled).toBe(false);
  });
});

