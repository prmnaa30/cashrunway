import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, Pressable, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, BellRing } from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSettingsStore } from '@/store/useSettingStore';
import { useTranslation } from '@/lib/i18n';
import {
  SettingSection,
  SettingRow,
  ReminderManagerModal,
  SettingsSubHeader,
} from '@/components/settings';

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t: translate } = useTranslation();

  const {
    isReminderEnabled,
    reminders,
    toggleReminderEnabled,
    testNotification,
  } = useSettingsStore();

  const [isReminderModalVisible, setIsReminderModalVisible] = useState(false);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [reminderTestFeedback, setReminderTestFeedback] = useState<string | null>(null);

  const handleTestNotification = async () => {
    if (isTestingNotification) return;
    setIsTestingNotification(true);
    setReminderTestFeedback(null);
    try {
      await testNotification();
      setReminderTestFeedback(translate('settings.reminders.testSuccess'));
    } catch (_) {
      setReminderTestFeedback(translate('settings.reminders.testError'));
    } finally {
      setIsTestingNotification(false);
      setTimeout(() => setReminderTestFeedback(null), 4000);
    }
  };

  return (
    <View className="flex-1 bg-linen-bg dark:bg-cypress-bg" style={{ paddingTop: insets.top }}>
      <SettingsSubHeader
        title={translate('settings.sections.notifications')}
        subtitle={translate('settings.subtitles.notifications')}
      />

      <ScrollView
        className="flex-1 px-5 pt-5"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingSection title={translate('settings.reminders.dailyTitle')}>
          {/* Enable Notifications Switch */}
          <SettingRow
            label={translate('settings.reminders.title')}
            description={translate('settings.reminders.desc')}
            icon={<Bell size={18} color={colors.tint} />}
            isLast={!isReminderEnabled}
            action={
              <Switch
                value={isReminderEnabled}
                onValueChange={toggleReminderEnabled}
                trackColor={{ false: isDark ? '#374151' : '#DCE5E0', true: colors.tint }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
              />
            }
          />

          {isReminderEnabled && (
            <>
              {/* Reminder Times Manager */}
              <SettingRow
                label={translate('settings.reminders.timesTitle')}
                description={translate('settings.reminders.timesDesc', {
                  count: reminders.filter((r) => r.isEnabled).length,
                })}
                icon={<BellRing size={18} color={colors.tint} />}
                onPress={() => setIsReminderModalVisible(true)}
                action={
                  <View className="px-3 py-1 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
                    <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
                      {reminders.filter((r) => r.isEnabled).length} {translate('common.active')}
                    </Text>
                  </View>
                }
              />

              {/* Test Notification Row */}
              <View className="py-3 px-4 border-t border-linen-border/70 dark:border-cypress-border/70">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-xs font-semibold text-linen-text-primary dark:text-cypress-text-primary">
                      {translate('settings.reminders.testTitle')}
                    </Text>
                    <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary mt-0.5 leading-4">
                      {translate('settings.reminders.testDesc')}
                    </Text>
                  </View>
                  <Pressable
                    onPress={handleTestNotification}
                    disabled={isTestingNotification}
                    className="px-3.5 py-1.5 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border active:opacity-70"
                  >
                    {isTestingNotification ? (
                      <ActivityIndicator size="small" color={colors.tint} />
                    ) : (
                      <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
                        {translate('settings.reminders.testButton')}
                      </Text>
                    )}
                  </Pressable>
                </View>

                {reminderTestFeedback && (
                  <Text
                    className={`text-[11px] mt-2 text-center font-medium ${
                      isDark ? 'text-accent-champagne' : 'text-emerald-600'
                    }`}
                  >
                    {reminderTestFeedback}
                  </Text>
                )}
              </View>
            </>
          )}
        </SettingSection>
      </ScrollView>

      {/* Reminder Manager Modal */}
      <ReminderManagerModal
        visible={isReminderModalVisible}
        onClose={() => setIsReminderModalVisible(false)}
      />
    </View>
  );
}
