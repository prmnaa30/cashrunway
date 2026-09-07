import { SymbolView } from 'expo-symbols';
import { Link, Tabs } from 'expo-router';
import { Platform, Pressable, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { History, Home, Plus, Settings, Wallet } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

function AnimatedAddButton() {
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.85, { damping: 35, stiffness: 280 })
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 35, stiffness: 280 })
  }

  const handlePress = () => {
    alert('Soon')
  }

  return (
    <View className="flex-1 items-center justify-center" pointerEvents="box-none">
      <Animated.View style={animatedStyle}>
        <Pressable
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handlePress}
          className="items-center justify-center -mt-6 w-16 h-16 rounded-full bg-accent-brass dark:bg-accent-champagne shadow-lg"
          style={{
            elevation: 8,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
          }}>
          <Plus size={28} color="#0C1513" strokeWidth={2.6} />
        </Pressable>
      </Animated.View>
    </View>
  )
}

export default function TabLayout() {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const insets = useSafeAreaInsets()

  const bottomInset = insets.bottom;
  const tabHeight = Platform.OS === 'ios' ? 60 + bottomInset : 64 + (bottomInset > 0 ? bottomInset : 8);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.tint,
        tabBarInactiveTintColor: colors.tabIconDefault,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 0,
          height: tabHeight,
          paddingTop: 8,
          paddingBottom: bottomInset > 0 ? bottomInset + 2 : 10,
        },
        headerStyle: {
          backgroundColor: colors.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
        },
      }}>

      <Tabs.Screen
        name='index'
        options={{
          title: 'Runway',
          tabBarIcon: ({ color, size }) => <Home size={22} color={color} />
        }}
      />

      <Tabs.Screen
        name='history'
        options={{
          title: 'Riwayat',
          tabBarIcon: ({ color, size }) => <History size={22} color={color} />
        }}
      />

      <Tabs.Screen
        name="add-action"
        options={{
          title: '',
          tabBarButton: (props) => (
            <AnimatedAddButton />
          ),
        }}
      />

      <Tabs.Screen
        name='wallets'
        options={{
          title: 'Dompet',
          tabBarIcon: ({ color, size }) => <Wallet size={22} color={color} />
        }}
      />

      <Tabs.Screen
        name='settings'
        options={{
          title: 'Pengaturan',
          tabBarIcon: ({ color, size }) => <Settings size={22} color={color} />
        }}
      />
    </Tabs>
  );
}
