import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RotateCcw, Trash2 } from 'lucide-react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useTranslation } from '@/lib/i18n';
import {
  SettingSection,
  SettingRow,
  DangerConfirmModal,
  SettingsSubHeader,
} from '@/components/settings';

export default function DataManagementScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { t: translate } = useTranslation();

  const resetToDemo = useFinanceStore((s) => s.resetToDemo);
  const clearTransactions = useFinanceStore((s) => s.clearTransactions);

  const [dangerModal, setDangerModal] = useState<{
    visible: boolean;
    type: 'reset' | 'clear';
  }>({ visible: false, type: 'reset' });

  return (
    <View className="flex-1 bg-linen-bg dark:bg-cypress-bg" style={{ paddingTop: insets.top }}>
      <SettingsSubHeader
        title={translate('settings.sections.data')}
        subtitle={translate('settings.subtitles.data')}
      />

      <ScrollView
        className="flex-1 px-5 pt-5"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 32 }}
        showsVerticalScrollIndicator={false}
      >
        <SettingSection title={translate('settings.sections.data')}>
          {__DEV__ && (
            <SettingRow
              label={translate('settings.resetDemo.title')}
              description={translate('settings.resetDemo.desc')}
              icon={<RotateCcw size={18} color={colors.tint} />}
              onPress={() => setDangerModal({ visible: true, type: 'reset' })}
            />
          )}

          <SettingRow
            label={translate('settings.clearData.title')}
            description={translate('settings.clearData.desc')}
            icon={<Trash2 size={18} color="#EF4444" />}
            isDanger
            isLast
            onPress={() => setDangerModal({ visible: true, type: 'clear' })}
          />
        </SettingSection>
      </ScrollView>

      {/* Confirmation Modal */}
      <DangerConfirmModal
        visible={dangerModal.visible}
        title={
          dangerModal.type === 'reset'
            ? translate('settings.resetDemo.confirmTitle')
            : translate('settings.clearData.confirmTitle')
        }
        description={
          dangerModal.type === 'reset'
            ? translate('settings.resetDemo.confirmDesc')
            : translate('settings.clearData.confirmDesc')
        }
        confirmLabel={
          dangerModal.type === 'reset'
            ? translate('settings.resetDemo.confirmButton')
            : translate('settings.clearData.confirmButton')
        }
        onConfirm={async () => {
          if (dangerModal.type === 'reset') {
            await resetToDemo();
          } else {
            await clearTransactions();
          }
          setDangerModal({ visible: false, type: 'reset' });
        }}
        onClose={() => setDangerModal({ visible: false, type: 'reset' })}
      />
    </View>
  );
}
