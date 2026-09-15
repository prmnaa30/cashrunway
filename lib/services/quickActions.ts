import * as QuickActions from 'expo-quick-actions';
import { Platform } from 'react-native';
import { translate } from '../i18n';

/**
 * Return static quick action shortcuts definition
 */
export function getQuickActionItems(): QuickActions.Action[] {
  return [
    {
      id: 'action_expense',
      title: translate('quickActions.expense.title'),
      subtitle: translate('quickActions.expense.subtitle'),
      icon: Platform.select({
        ios: 'symbol:minus.circle.fill',
        android: 'ic_quick_expense',
      }),
      params: { mode: 'expense' },
    },
    {
      id: 'action_income',
      title: translate('quickActions.income.title'),
      subtitle: translate('quickActions.income.subtitle'),
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
