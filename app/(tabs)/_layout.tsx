import { SymbolView } from 'expo-symbols';
import { Link, Tabs } from 'expo-router';
import { Platform, Pressable, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { History, Home, Plus, Settings, Wallet } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useFinanceStore } from '@/store/useFinanceStore';
import { useQuickEntryStore } from '@/store/useQuickEntryStore';
import { QuickEntrySheet } from '@/components/entry';

function AnimatedAddButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const colorScheme = useColorScheme() ?? 'dark';
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.85, { damping: 35, stiffness: 280 });
    onPress();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 35, stiffness: 280 });
  };

  return (
    <View className="flex-1 items-center justify-center" pointerEvents="box-none">
      <Animated.View style={animatedStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className="items-center justify-center -mt-6 w-16 h-16 rounded-full bg-cypress-surface dark:bg-accent-champagne shadow-lg border border-black/10 dark:border-transparent"
          style={{
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
          }}
          accessibilityLabel="Catat Transaksi Cepat"
        >
          <Plus
            size={28}
            color={colorScheme === 'dark' ? '#0C1513' : '#D4AF37'}
            strokeWidth={2.6}
          />
        </Pressable>
      </Animated.View>
    </View>
  );
}

function TabIcon({
  Icon,
  color,
  focused,
}: {
  Icon: any;
  color: any;
  focused: boolean;
}) {
  return <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 1.7} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const openQuickEntry = useQuickEntryStore((s) => s.open);

  const bottomInset = insets.bottom;
  const tabHeight = Platform.OS === 'ios' ? 60 + bottomInset : 64 + (bottomInset > 0 ? bottomInset : 8);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.tint,
          tabBarInactiveTintColor: colors.tabIconDefault,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
          },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            elevation: 0,
            height: tabHeight,
            paddingTop: 8,
            paddingBottom: bottomInset > 0 ? bottomInset + 2 : 10,
          },
        }}>

        <Tabs.Screen
          name='index'
          options={{
            title: 'Runway',
            tabBarIcon: ({ color, focused }) => <TabIcon Icon={Home} color={color} focused={focused} />
          }}
        />

        <Tabs.Screen
          name='history'
          options={{
            title: 'Riwayat',
            tabBarIcon: ({ color, focused }) => <TabIcon Icon={History} color={color} focused={focused} />
          }}
        />

        <Tabs.Screen
          name="add-action"
          options={{
            title: '',
            tabBarButton: () => (
              <AnimatedAddButton onPress={() => openQuickEntry('expense')} />
            ),
          }}
        />

        <Tabs.Screen
          name='wallets'
          options={{
            title: 'Dompet',
            tabBarIcon: ({ color, focused }) => <TabIcon Icon={Wallet} color={color} focused={focused} />
          }}
        />

        <Tabs.Screen
          name='settings'
          options={{
            title: 'Pengaturan',
            tabBarIcon: ({ color, focused }) => <TabIcon Icon={Settings} color={color} focused={focused} />
          }}
        />
      </Tabs>
      <QuickEntrySheet />
    </>
  );
}
