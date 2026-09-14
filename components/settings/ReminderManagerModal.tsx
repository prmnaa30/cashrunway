import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Trash2, Plus, BellRing, Check, ChevronDown, ChevronUp } from 'lucide-react-native';
import Colors, { Palette } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useSettingsStore } from '@/store/useSettingStore';
import { translate } from '@/lib/i18n';
import { SettingsBottomSheet } from './SettingsBottomSheet';

export interface ReminderManagerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ReminderManagerModal({ visible, onClose }: ReminderManagerModalProps) {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const reminders = useSettingsStore((s) => s.reminders);
  const toggleReminderItem = useSettingsStore((s) => s.toggleReminderItem);
  const addReminderItem = useSettingsStore((s) => s.addReminderItem);
  const deleteReminderItem = useSettingsStore((s) => s.deleteReminderItem);
  const testNotification = useSettingsStore((s) => s.testNotification);

  // Form state
  const [isAdding, setIsAdding] = useState(false);
  const [hour, setHour] = useState('20');
  const [minute, setMinute] = useState('00');
  const [label, setLabel] = useState('');

  // Feedback state for test notification
  const [isTesting, setIsTesting] = useState(false);
  const [testFeedback, setTestFeedback] = useState<string | null>(null);

  const handleToggleAdd = () => {
    setIsAdding((prev) => !prev);
  };

  const handleSaveReminder = async () => {
    let cleanHour = parseInt(hour, 10);
    if (isNaN(cleanHour) || cleanHour < 0) cleanHour = 0;
    if (cleanHour > 23) cleanHour = 23;

    let cleanMin = parseInt(minute, 10);
    if (isNaN(cleanMin) || cleanMin < 0) cleanMin = 0;
    if (cleanMin > 59) cleanMin = 59;

    const formattedTime = `${String(cleanHour).padStart(2, '0')}:${String(cleanMin).padStart(2, '0')}`;
    const formattedLabel = label.trim();

    await addReminderItem(formattedTime, formattedLabel);
    setLabel('');
    setIsAdding(false);
  };

  const handleTestNotification = async () => {
    if (isTesting) return;
    setIsTesting(true);
    setTestFeedback(null);
    try {
      await testNotification();
      setTestFeedback(translate('settings.reminders.testSuccess'));
    } catch (err) {
      console.error(err);
      setTestFeedback(translate('settings.reminders.testError'));
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestFeedback(null), 4000);
    }
  };

  const isPreadded = (id: string) =>
    id === 'rem_morning' || id === 'rem_lunch' || id === 'rem_evening';

  return (
    <SettingsBottomSheet
      visible={visible}
      onClose={onClose}
      title={translate('settings.reminders.sheetTitle')}
      subtitle={translate('settings.reminders.sheetSubtitle')}
      maxHeight="88%"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 14,
          paddingBottom: Math.max(insets.bottom, 24) + 16,
        }}
      >
        {/* List of Reminders */}
        <View className="mb-4">
          {reminders.length === 0 ? (
            <View className="py-6 items-center justify-center">
              <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
                {translate('settings.reminders.emptyReminders')}
              </Text>
            </View>
          ) : (
            reminders.map((item) => {
              const displayLabel = !isPreadded(item.id) && item.label?.trim() ? item.label : null;

              return (
                <View
                  key={item.id}
                  className="flex-row items-center justify-between p-3.5 mb-2.5 rounded-2xl bg-linen-bg dark:bg-cypress-surface border border-linen-border/80 dark:border-cypress-border/80"
                >
                  {/* Left: Time and Optional Custom Label */}
                  <View className="flex-1 mr-3">
                    <Text className="text-2xl font-black tracking-tight text-linen-text-primary dark:text-cypress-text-primary tabular-nums">
                      {item.time}
                    </Text>
                    {displayLabel ? (
                      <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary mt-0.5 font-medium">
                        {displayLabel}
                      </Text>
                    ) : null}
                  </View>

                  {/* Right: Switch & Delete */}
                  <View className="flex-row items-center">
                    <Switch
                      value={item.isEnabled}
                      onValueChange={() => toggleReminderItem(item.id)}
                      trackColor={{ false: isDark ? '#374151' : '#DCE5E0', true: colors.tint }}
                      thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                    />

                    <TouchableOpacity
                      onPress={() => deleteReminderItem(item.id)}
                      activeOpacity={0.7}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      className="min-w-[44px] min-h-[44px] rounded-xl bg-status-danger/10 border border-status-danger/25 items-center justify-center ml-2.5 active:bg-status-danger/20"
                      accessibilityRole="button"
                      accessibilityLabel={`Hapus pengingat ${item.time}`}
                    >
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Form "+ Tambah Jam Pengingat" */}
        <View className="mb-4 rounded-2xl bg-linen-bg dark:bg-cypress-surface border border-linen-border/80 dark:border-cypress-border/80 overflow-hidden">
          <TouchableOpacity
            onPress={handleToggleAdd}
            activeOpacity={0.8}
            className="min-h-[44px] flex-row items-center justify-between px-4 py-3 active:opacity-70"
          >
            <View className="flex-row items-center">
              <Plus size={16} color={isDark ? '#D4AF37' : '#059669'} />
              <Text
                className={`text-xs font-bold ml-2 ${
                  isDark ? 'text-accent-champagne' : 'text-emerald-700'
                }`}
              >
                {translate('settings.reminders.addTime')}
              </Text>
            </View>
            {isAdding ? (
              <ChevronUp size={16} color={isDark ? '#D4AF37' : colors.textSecondary} />
            ) : (
              <ChevronDown size={16} color={colors.textSecondary} />
            )}
          </TouchableOpacity>

          {isAdding && (
            <View className="px-4 pb-4 pt-2 border-t border-linen-border/50 dark:border-cypress-border/50">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-1 mr-2">
                  <Text className="text-[11px] font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-1">
                    {translate('settings.reminders.timeLabel')}
                  </Text>
                  <TextInput
                    value={hour}
                    onChangeText={setHour}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="20"
                    placeholderTextColor={colors.textSecondary}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border text-center font-bold text-base text-linen-text-primary dark:text-cypress-text-primary tabular-nums"
                  />
                </View>

                <Text className="text-lg font-bold text-linen-text-secondary dark:text-cypress-text-secondary mt-5">
                  :
                </Text>

                <View className="flex-1 ml-2">
                  <Text className="text-[11px] font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-1">
                    &nbsp;
                  </Text>
                  <TextInput
                    value={minute}
                    onChangeText={setMinute}
                    keyboardType="number-pad"
                    maxLength={2}
                    placeholder="00"
                    placeholderTextColor={colors.textSecondary}
                    className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border text-center font-bold text-base text-linen-text-primary dark:text-cypress-text-primary tabular-nums"
                  />
                </View>
              </View>

              <View className="mb-3">
                <Text className="text-[11px] font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-1">
                  {translate('settings.reminders.nameLabel')}
                </Text>
                <TextInput
                  value={label}
                  onChangeText={setLabel}
                  placeholder={translate('settings.reminders.namePlaceholder')}
                  placeholderTextColor={colors.textSecondary}
                  className="w-full min-h-[44px] px-3 py-2 rounded-xl bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border text-xs text-linen-text-primary dark:text-cypress-text-primary font-medium"
                />
              </View>

              <Pressable
                onPress={handleSaveReminder}
                className="w-full min-h-[44px] py-3 rounded-xl bg-cypress-surface dark:bg-accent-champagne items-center justify-center flex-row active:opacity-80 shadow-xs"
              >
                <Check size={16} color={isDark ? '#0C1513' : '#FFFFFF'} />
                <Text className="text-xs font-black text-white dark:text-[#0C1513] ml-1.5">
                  {translate('settings.reminders.save')}
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Test Notification Button */}
        <View className="pt-1">
          <TouchableOpacity
            onPress={handleTestNotification}
            disabled={isTesting}
            activeOpacity={0.8}
            className="min-h-[44px] py-3 px-4 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-emerald-500/30 dark:border-accent-champagne/40 flex-row items-center justify-center active:opacity-70"
          >
            {isTesting ? (
              <ActivityIndicator size="small" color={isDark ? '#D4AF37' : '#059669'} />
            ) : (
              <>
                <BellRing size={16} color={isDark ? '#D4AF37' : '#059669'} />
                <Text
                  className={`text-xs font-bold ml-2 ${
                    isDark ? 'text-accent-champagne' : 'text-emerald-700'
                  }`}
                >
                  {translate('settings.reminders.testButton')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {testFeedback && (
            <View className="mt-2.5 p-2.5 rounded-xl bg-status-safe/10 border border-status-safe/30 items-center">
              <Text
                className={`text-xs font-semibold text-center ${
                  isDark ? 'text-accent-champagne' : 'text-status-safe'
                }`}
              >
                {testFeedback}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SettingsBottomSheet>
  );
}
