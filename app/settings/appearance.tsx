import React from 'react';
import { View, Text, ScrollView, Switch, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SunMoon, Globe, Shield } from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useSettingsStore } from '@/store/useSettingStore';
import { useTranslation } from '@/lib/i18n';
import { AppSegmentedTabs } from '@/components/ui/AppSegmentedTabs';
import { syncScheduledAlarms } from '@/lib/services/notifications';
import {
  SettingSection,
  SettingRow,
  SettingsSubHeader,
} from '@/components/settings';

export default function AppearanceScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t: translate } = useTranslation();

  const settings = useFinanceStore((s) => s.settings);
  const updateSettings = useFinanceStore((s) => s.updateSettings);

  const {
    themeMode,
    setThemeMode,
    isPrivacyMode,
    togglePrivacyMode,
    reminders,
    isReminderEnabled,
  } = useSettingsStore();

  const activeLanguage = settings?.language ?? 'auto';
  const activeThemeMode = (settings?.themeMode || themeMode || 'system') as 'system' | 'light' | 'dark';

  const handleSelectLanguage = async (lang: string) => {
    await updateSettings({ language: lang });
    try {
      const runwayDays = useFinanceStore.getState()?.runway?.operationalRunwayDays || 0;
      await syncScheduledAlarms(reminders, isReminderEnabled, runwayDays);
    } catch (_) {}
  };

  const handleSelectTheme = async (mode: 'system' | 'light' | 'dark') => {
    setThemeMode(mode);
    await updateSettings({ themeMode: mode });
  };

  return (
    <View className="flex-1 bg-linen-bg dark:bg-cypress-bg" style={{ paddingTop: insets.top }}>
      <SettingsSubHeader
        title={translate('settings.sections.appearance')}
        subtitle={translate('settings.subtitles.appearance')}
      />

      <ScrollView
        className="flex-1 px-5 pt-5"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingSection title={translate('settings.sections.appearance')}>
          {/* Theme Mode Selector */}
          <View className="py-3.5 px-4 border-b border-linen-border/70 dark:border-cypress-border/70">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center flex-1 pr-2">
                <SunMoon size={18} color={colors.tint} />
                <Text className="text-sm font-semibold text-linen-text-primary dark:text-cypress-text-primary ml-3">
                  {translate('settings.theme.title')}
                </Text>
              </View>
            </View>

            <View className="mb-1.5">
              <AppSegmentedTabs<'system' | 'light' | 'dark'>
                size="sm"
                value={activeThemeMode}
                onChange={(mode) => handleSelectTheme(mode)}
                options={[
                  { key: 'system', label: translate('settings.theme.system') },
                  { key: 'light', label: translate('settings.theme.light') },
                  { key: 'dark', label: translate('settings.theme.dark') },
                ]}
              />
            </View>

            <Text className="text-[11px] text-linen-text-secondary/90 dark:text-cypress-text-secondary/90 leading-4">
              {translate('settings.theme.desc')}
            </Text>
          </View>

          {/* Language Selector */}
          <View className="py-3.5 px-4 border-b border-linen-border/70 dark:border-cypress-border/70">
            <View className="flex-row items-center justify-between mb-2">
              <View className="flex-row items-center flex-1 pr-2">
                <Globe size={18} color={colors.tint} />
                <Text className="text-sm font-semibold text-linen-text-primary dark:text-cypress-text-primary ml-3">
                  {translate('settings.language.title')}
                </Text>
              </View>
            </View>

            <View className="mb-1.5">
              <AppSegmentedTabs<string>
                size="sm"
                value={activeLanguage}
                onChange={(l) => handleSelectLanguage(l)}
                options={[
                  { key: 'auto', label: translate('settings.language.auto') },
                  { key: 'id', label: translate('settings.language.id') },
                  { key: 'en', label: translate('settings.language.en') },
                ]}
              />
            </View>

            <Text className="text-[11px] text-linen-text-secondary/90 dark:text-cypress-text-secondary/90 leading-4">
              {translate('settings.language.desc')}
            </Text>
          </View>

          {/* Privacy Mode Toggle */}
          <SettingRow
            label={translate('settings.privacy.title')}
            description={translate('settings.privacy.desc')}
            icon={<Shield size={18} color={colors.tint} />}
            isLast
            action={
              <Switch
                value={isPrivacyMode}
                onValueChange={togglePrivacyMode}
                trackColor={{ false: isDark ? '#374151' : '#DCE5E0', true: colors.tint }}
                thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
              />
            }
          />
        </SettingSection>
      </ScrollView>
    </View>
  );
}
