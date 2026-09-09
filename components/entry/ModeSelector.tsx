import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react-native';
import { TransactionMode } from './types';
import Colors from '@/constants/Colors';

export interface ModeSelectorProps {
  mode: TransactionMode;
  onSelectMode: (mode: TransactionMode) => void;
  colorScheme: 'light' | 'dark';
}

/**
 * 3-mode segmented tab selector for Quick Entry: Pengeluaran, Pemasukan, and Transfer.
 */
function ModeSelectorComponent({
  mode,
  onSelectMode,
  colorScheme,
}: ModeSelectorProps) {
  const colors = Colors[colorScheme];

  const modes: { id: TransactionMode; label: string; icon: any }[] = [
    { id: 'expense', label: 'Pengeluaran', icon: ArrowDownLeft },
    { id: 'income', label: 'Pemasukan', icon: ArrowUpRight },
    { id: 'transfer', label: 'Transfer', icon: ArrowLeftRight },
  ];

  return (
    <View className="flex-row rounded-2xl bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-1 mx-4 mb-2">
      {modes.map((item) => {
        const isActive = mode === item.id;
        const Icon = item.icon;

        let activeTextClass = 'text-linen-text-primary dark:text-cypress-text-primary';
        let activeBgClass = 'bg-linen-card dark:bg-cypress-surface shadow-xs';
        let iconColor = colors.textSecondary;

        if (isActive) {
          if (item.id === 'expense') {
            activeTextClass = 'text-status-danger font-black';
            iconColor = '#EF4444';
          } else if (item.id === 'income') {
            activeTextClass = 'text-status-safe font-black';
            iconColor = '#10B981';
          } else {
            activeTextClass =
              colorScheme === 'dark'
                ? 'text-accent-champagne font-black'
                : 'text-accent-brass font-black';
            iconColor = colorScheme === 'dark' ? '#D4AF37' : '#B8860B';
          }
        }

        return (
          <Pressable
            key={item.id}
            onPress={() => onSelectMode(item.id)}
            className={`flex-1 flex-row items-center justify-center py-2.5 rounded-xl ${
              isActive ? activeBgClass : 'opacity-70'
            }`}
          >
            <Icon size={15} color={iconColor} strokeWidth={isActive ? 2.5 : 1.8} />
            <Text
              className={`text-xs ml-1.5 ${
                isActive
                  ? activeTextClass
                  : 'font-medium text-linen-text-secondary dark:text-cypress-text-secondary'
              }`}
            >
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export const ModeSelector = React.memo(ModeSelectorComponent);
