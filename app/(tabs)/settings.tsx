import React, { useRef, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Wallet,
  Palette,
  Bell,
  Cloud,
  Database,
  Info,
  ChevronRight,
  Shield,
} from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useSettingsStore } from '@/store/useSettingStore';
import { useBackupStore } from '@/store/useBackupStore';
import { useTranslation } from '@/lib/i18n';
import { useGuardedNavigation } from '@/hooks/useGuardedNavigation';

interface HubCategoryItemProps {
  icon: React.ReactNode;
  iconBgColor: string;
  title: string;
  subtitle: string;
  badge?: string;
  onPress: () => void;
  isLast?: boolean;
}

function HubCategoryItem({
  icon,
  iconBgColor,
  title,
  subtitle,
  badge,
  onPress,
  isLast = false,
}: HubCategoryItemProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between py-4 px-4 min-h-[64px] active:bg-linen-border/30 dark:active:bg-cypress-border/30 ${
        !isLast ? 'border-b border-linen-border/70 dark:border-cypress-border/70' : ''
      }`}
    >
      <View className="flex-row items-center flex-1 pr-3">
        <View
          className="w-11 h-11 rounded-2xl items-center justify-center mr-3.5 border"
          style={{ backgroundColor: iconBgColor, borderColor: 'rgba(255, 255, 255, 0.08)' }}
        >
          {icon}
        </View>

        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary">
              {title}
            </Text>
            {badge && (
              <View className="px-2 py-0.5 rounded-full bg-emerald-500/15 dark:bg-accent-champagne/15 border border-emerald-500/30 dark:border-accent-champagne/30">
                <Text className="text-[10px] font-bold text-emerald-800 dark:text-accent-champagne">
                  {badge}
                </Text>
              </View>
            )}
          </View>
          <Text
            className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary mt-0.5 leading-4"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>
      </View>

      <ChevronRight
        size={18}
        color={isDark ? 'rgba(141, 164, 153, 0.5)' : 'rgba(82, 102, 94, 0.5)'}
      />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { push: navigateTo, resetLock } = useGuardedNavigation();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const { t: translate } = useTranslation();
  const scrollViewRef = useRef<ScrollView>(null);

  useFocusEffect(
    useCallback(() => {
      resetLock();
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
      useBackupStore.getState().initialize().catch(() => {});
    }, [resetLock])
  );

  const settings = useFinanceStore((s) => s.settings);
  const categories = useFinanceStore((s) => s.categories);
  const { currency, themeMode, reminders, isReminderEnabled } = useSettingsStore();
  const { isSignedIn, googleUser } = useBackupStore();

  const activeBurnWindow = settings?.burnWindowDays ?? 14;
  const activePayday = settings?.paydayDay ?? 25;
  const activeRemindersCount = isReminderEnabled ? reminders.filter((r) => r.isEnabled).length : 0;

  return (
    <View className="flex-1 bg-linen-bg dark:bg-cypress-bg">
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 80,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* App Settings Header */}
        <View className="mb-6 px-1">
          <Text className="text-2xl font-black tracking-tight text-linen-text-primary dark:text-cypress-text-primary">
            {translate('settings.title')}
          </Text>
          <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary mt-0.5">
            {translate('settings.aboutInfo.tagline')}
          </Text>
        </View>

        {/* Group 1: Core Financial & Visual Preferences */}
        <View className="mb-5">
          <View className="px-1 mb-2">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-linen-text-secondary dark:text-cypress-text-secondary">
              {translate('settings.hubGroups.system')}
            </Text>
          </View>
          <View className="bg-linen-card dark:bg-cypress-card rounded-2xl border border-linen-border dark:border-cypress-border overflow-hidden shadow-sm">
            <HubCategoryItem
              icon={<Wallet size={20} color="#F59E0B" />}
              iconBgColor="rgba(245, 158, 11, 0.15)"
              title={translate('settings.sections.financial')}
              subtitle={translate('settings.hubSubtitles.financialSummary', {
                currency,
                burnDays: activeBurnWindow,
                payday: activePayday,
                categories: categories.length,
              })}
              badge={currency}
              onPress={() => navigateTo('/settings/financial')}
            />

            <HubCategoryItem
              icon={<Palette size={20} color="#3B82F6" />}
              iconBgColor="rgba(59, 130, 246, 0.15)"
              title={translate('settings.sections.appearance')}
              subtitle={translate('settings.hubSubtitles.appearanceSummary', {
                theme:
                  themeMode === 'dark'
                    ? translate('settings.theme.dark')
                    : themeMode === 'light'
                    ? translate('settings.theme.light')
                    : translate('settings.theme.system'),
                language:
                  settings?.language === 'id'
                    ? 'ID'
                    : settings?.language === 'en'
                    ? 'EN'
                    : translate('settings.language.auto'),
              })}
              onPress={() => navigateTo('/settings/appearance')}
              isLast
            />
          </View>
        </View>

        {/* Group 2: Notifications, Cloud Backup & Sync */}
        <View className="mb-5">
          <View className="px-1 mb-2">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-linen-text-secondary dark:text-cypress-text-secondary">
              {translate('settings.hubGroups.notificationsBackup')}
            </Text>
          </View>
          <View className="bg-linen-card dark:bg-cypress-card rounded-2xl border border-linen-border dark:border-cypress-border overflow-hidden shadow-sm">
            <HubCategoryItem
              icon={<Bell size={20} color="#8B5CF6" />}
              iconBgColor="rgba(139, 92, 246, 0.15)"
              title={translate('settings.sections.notifications')}
              subtitle={
                isReminderEnabled
                  ? translate('settings.hubSubtitles.remindersSummaryActive', { count: activeRemindersCount })
                  : translate('settings.hubSubtitles.remindersSummaryDisabled')
              }
              badge={
                isReminderEnabled
                  ? translate('settings.hubSubtitles.remindersBadgeActive', { count: activeRemindersCount })
                  : undefined
              }
              onPress={() => navigateTo('/settings/notifications')}
            />

            <HubCategoryItem
              icon={<Cloud size={20} color="#10B981" />}
              iconBgColor="rgba(16, 185, 129, 0.15)"
              title={translate('settings.sections.backup')}
              subtitle={
                isSignedIn && googleUser?.email
                  ? translate('settings.hubSubtitles.cloudConnected', {
                      email: googleUser.email.split('@')[0],
                    })
                  : translate('settings.googleDrive.notConnected')
              }
              badge={isSignedIn ? translate('settings.hubSubtitles.cloudOnBadge') : undefined}
              onPress={() => navigateTo('/settings/backup')}
              isLast
            />
          </View>
        </View>

        {/* Group 3: Data Management & About */}
        <View className="mb-6">
          <View className="px-1 mb-2">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-linen-text-secondary dark:text-cypress-text-secondary">
              {translate('settings.hubGroups.dataAbout')}
            </Text>
          </View>
          <View className="bg-linen-card dark:bg-cypress-card rounded-2xl border border-linen-border dark:border-cypress-border overflow-hidden shadow-sm">
            <HubCategoryItem
              icon={<Database size={20} color="#EC4899" />}
              iconBgColor="rgba(236, 72, 153, 0.15)"
              title={translate('settings.sections.data')}
              subtitle={translate('settings.subtitles.data')}
              onPress={() => navigateTo('/settings/data')}
            />

            <HubCategoryItem
              icon={<Info size={20} color="#64748B" />}
              iconBgColor="rgba(100, 116, 139, 0.15)"
              title={translate('settings.sections.about')}
              subtitle={translate('settings.hubSubtitles.aboutSummary')}
              onPress={() => navigateTo('/settings/about')}
              isLast
            />
          </View>
        </View>

        {/* Subtle Brand Footer */}
        <View className="items-center justify-center pt-2 pb-6">
          <View className="flex-row items-center gap-1.5 opacity-60">
            <Shield size={13} color={colors.textSecondary} />
            <Text className="text-[11px] font-medium text-linen-text-secondary dark:text-cypress-text-secondary">
              {translate('settings.hubSubtitles.privacyFooter')}
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
