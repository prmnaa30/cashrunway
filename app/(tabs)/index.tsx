import { View, Text, ScrollView } from 'react-native';
import { Plane, Eye, EyeOff } from 'lucide-react-native';
import { Card, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';
import { useSettingsStore } from '@/store/useSettingStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export default function DashboardScreen() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { isPrivacyMode, togglePrivacyMode } = useSettingsStore();

  return (
    <ScrollView className="flex-1 bg-linen-bg dark:bg-cypress-bg px-4 pt-4">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <Text className="text-2xl font-black text-linen-text-primary dark:text-cypress-text-primary">
            CashRunway
          </Text>
          <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
            Your Daily Spending Tracker
          </Text>
        </View>

        <Button
          variant="secondary"
          size="icon"
          onPress={togglePrivacyMode}
          accessibilityLabel="Toggle Privacy Mode"
        >
          {isPrivacyMode ? (
            <EyeOff size={20} color={colors.textSecondary} />
          ) : (
            <Eye size={20} color={colors.textSecondary} />
          )}
        </Button>
      </View>

      <Card>
        <CardHeader>
          <View className="flex-row items-center space-x-2">
            <Plane size={20} color={colors.tint} />
            <Text className="ml-2 text-xs font-semibold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary">
              Cash Runway
            </Text>
          </View>
          <Badge variant="safe" label="Aman (> 30 hari)" />
        </CardHeader>

        <View className="my-5">
          <Text className="text-5xl font-extrabold tracking-tight text-linen-text-primary dark:text-cypress-text-primary">
            42 <Text className="text-2xl font-medium text-linen-text-secondary dark:text-cypress-text-secondary">hari</Text>
          </Text>
          <Text className="mt-1 text-sm text-linen-text-secondary dark:text-cypress-text-secondary">
            Uang bertahan hingga <Text className="font-semibold text-accent-brass dark:text-accent-champagne">19 Okt 2026</Text>
          </Text>
        </View>

        <CardFooter>
          <Text className="text-xs font-medium text-linen-text-secondary dark:text-cypress-text-secondary">
            Kas Aktif: <Text className="font-bold text-linen-text-primary dark:text-cypress-text-primary">{formatCurrency(8450000, isPrivacyMode)}</Text>
          </Text>
          <Text className="text-xs font-medium text-linen-text-secondary dark:text-cypress-text-secondary">
            Burn: <Text className="font-bold text-linen-text-primary dark:text-cypress-text-primary">{formatCurrency(120000, isPrivacyMode)}/hari</Text>
          </Text>
        </CardFooter>
      </Card>
    </ScrollView>
  );
}
