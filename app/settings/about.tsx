import React from 'react';
import { View, Text, ScrollView, Linking, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Info, ShieldCheck, Database, Smartphone } from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useTranslation } from '@/lib/i18n';
import {
  SettingSection,
  SettingRow,
  SettingsSubHeader,
} from '@/components/settings';

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { t: translate } = useTranslation();

  return (
    <View className="flex-1 bg-linen-bg dark:bg-cypress-bg" style={{ paddingTop: insets.top }}>
      <SettingsSubHeader
        title={translate('settings.sections.about')}
        subtitle={translate('settings.subtitles.about')}
      />

      <ScrollView
        className="flex-1 px-5 pt-5"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingSection title={translate('settings.sections.about')}>
          <SettingRow
            label={translate('settings.aboutInfo.version')}
            description={translate('settings.aboutInfo.tagline')}
            icon={<Info size={18} color={colors.tint} />}
            action={
              <View className="px-3 py-1 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
                <Text className="text-xs font-mono font-bold text-linen-text-primary dark:text-cypress-text-primary">
                  v1.0.0 (Build 2026)
                </Text>
              </View>
            }
          />

          <SettingRow
            label={translate('settings.aboutInfo.storage')}
            description={translate('settings.aboutInfo.storageDesc')}
            icon={<Database size={18} color={colors.tint} />}
            action={
              <View className="px-3 py-1 rounded-xl bg-emerald-500/10 dark:bg-accent-champagne/15 border border-emerald-600/30 dark:border-accent-champagne/30">
                <Text className="text-xs font-bold text-emerald-800 dark:text-accent-champagne">
                  SQLite WAL
                </Text>
              </View>
            }
          />

          <SettingRow
            label={translate('settings.aboutInfo.privacyTitle')}
            description={translate('settings.aboutInfo.privacyDesc')}
            icon={<ShieldCheck size={18} color={colors.tint} />}
            isLast
          />
        </SettingSection>

        {/* Footer brand info */}
        <View className="items-center justify-center py-6">
          <Text className="text-sm font-black tracking-tight text-linen-text-primary/70 dark:text-cypress-text-primary/70">
            CashRunway
          </Text>
          <Text className="text-[11px] text-linen-text-secondary/70 dark:text-cypress-text-secondary/70 mt-1">
            Built with React Native & Expo SDK 57
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
