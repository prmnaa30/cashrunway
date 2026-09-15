import React from 'react';
import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { Cloud, CloudOff, LogOut, CheckCircle2 } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useTranslation } from '@/lib/i18n';
import { useBackupStore } from '@/store/useBackupStore';

export function GoogleAccountCard() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { t } = useTranslation();

  const {
    isSignedIn,
    isSigningIn,
    googleUser,
    signIn,
    signOut,
  } = useBackupStore();

  return (
    <View className="py-3.5 px-4 border-b border-linen-border/70 dark:border-cypress-border/70">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 pr-3">
          {googleUser?.photo ? (
            <Image
              source={{ uri: googleUser.photo }}
              className="w-9 h-9 rounded-full border border-emerald-500/30 dark:border-accent-champagne/40 mr-3"
            />
          ) : (
            <View className="w-9 h-9 rounded-full bg-emerald-500/15 dark:bg-accent-champagne/15 items-center justify-center mr-3 border border-emerald-500/20 dark:border-accent-champagne/20">
              {isSignedIn ? (
                <Cloud size={18} color={colors.tint} />
              ) : (
                <CloudOff size={18} color={colors.textSecondary} />
              )}
            </View>
          )}

          <View className="flex-1">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-sm font-semibold text-linen-text-primary dark:text-cypress-text-primary">
                {isSignedIn && googleUser?.name ? googleUser.name : t('settings.googleDrive.title')}
              </Text>
              {isSignedIn && (
                <CheckCircle2 size={13} color={isDark ? '#34D399' : '#059669'} />
              )}
            </View>
            <Text
              className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary mt-0.5"
              numberOfLines={1}
            >
              {isSignedIn && googleUser?.email
                ? googleUser.email
                : t('settings.googleDrive.notConnected')}
            </Text>
          </View>
        </View>

        {isSigningIn ? (
          <View className="px-3 py-1.5">
            <ActivityIndicator size="small" color={colors.tint} />
          </View>
        ) : isSignedIn ? (
          <Pressable
            onPress={signOut}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="px-3 py-1.5 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border flex-row items-center active:opacity-70"
          >
            <LogOut size={13} color={colors.textSecondary} />
            <Text className="text-xs font-semibold text-linen-text-secondary dark:text-cypress-text-secondary ml-1.5">
              {t('settings.googleDrive.disconnect')}
            </Text>
          </Pressable>
        ) : (
          <Pressable
            onPress={signIn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-accent-champagne/15 border border-emerald-600 dark:border-accent-champagne flex-row items-center active:opacity-70"
          >
            <Cloud size={13} color={colors.tint} />
            <Text className="text-xs font-bold text-emerald-800 dark:text-accent-champagne ml-1.5">
              {t('settings.googleDrive.connect')}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
