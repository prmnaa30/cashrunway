import * as QuickActions from 'expo-quick-actions';
import { Platform } from 'react-native';

/**
 * Return static quick action shortcuts definition
 */
export function getQuickActionItems(): QuickActions.Action[] {
  return [
    {
      id: 'action_expense',
      title: 'Catat Pengeluaran',
      subtitle: 'Input pengeluaran baru',
      icon: Platform.select({
        ios: 'symbol:minus.circle.fill',
        android: 'ic_quick_expense',
      }),
      params: { mode: 'expense' },
    },
    {
      id: 'action_income',
      title: 'Catat Pemasukan',
      subtitle: 'Input pemasukan baru',
      icon: Platform.select({
        ios: 'symbol:plus.circle.fill',
        android: 'ic_quick_income',
      }),
      params: { mode: 'income' },
    },
  ];
}

/**
 * Configure app quick action shortcuts if supported by device
 */
export async function setupQuickActions(): Promise<void> {
  try {
    const supported = await QuickActions.isSupported();
    if (supported) {
      await QuickActions.setItems(getQuickActionItems());
    }
  } catch (error) {
    console.warn('Failed to setup quick actions:', error);
  }
}
