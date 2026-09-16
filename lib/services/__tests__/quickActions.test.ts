import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../i18n', () => ({
  translate: vi.fn((key: string) => key),
}));
vi.mock('@/lib/i18n', () => ({
  translate: vi.fn((key: string) => key),
}));

vi.mock('expo-quick-actions', () => ({
  isSupported: vi.fn().mockResolvedValue(true),
  setItems: vi.fn().mockResolvedValue(undefined),
}));

import * as QuickActions from 'expo-quick-actions';
import { getQuickActionItems, setupQuickActions } from '../quickActions';

describe('Quick Actions Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 2 quick actions with correct modes', () => {
    const items = getQuickActionItems();
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe('action_expense');
    expect(items[0].params?.mode).toBe('expense');
    expect(items[1].id).toBe('action_income');
    expect(items[1].params?.mode).toBe('income');
  });

  it('should setup quick actions when supported', async () => {
    vi.mocked(QuickActions.isSupported).mockResolvedValueOnce(true);
    await setupQuickActions();
    expect(QuickActions.setItems).toHaveBeenCalledWith(expect.any(Array));
  });

  it('should not setItems when quick actions is not supported', async () => {
    vi.mocked(QuickActions.isSupported).mockResolvedValueOnce(false);
    await setupQuickActions();
    expect(QuickActions.setItems).not.toHaveBeenCalled();
  });

  it('should handle errors gracefully during setupQuickActions', async () => {
    vi.mocked(QuickActions.isSupported).mockRejectedValueOnce(new Error('Device error'));
    await expect(setupQuickActions()).resolves.not.toThrow();
  });
});
