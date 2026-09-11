import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, Inbox } from 'lucide-react-native';
import { formatDate } from '@/lib/format';
import { useSettingsStore } from '@/store/useSettingStore';
import { useFinanceStore } from '@/store/useFinanceStore';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { TransactionWithDetails } from '@/lib/db';
import { TransactionGroup, DeleteTransactionModal } from '@/components/history';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  const { isPrivacyMode, togglePrivacyMode } = useSettingsStore();

  const transactions = useFinanceStore((s) => s.transactions);
  const isLoading = useFinanceStore((s) => s.isLoading);
  const loadAllData = useFinanceStore((s) => s.loadAllData);
  const deleteTx = useFinanceStore((s) => s.deleteTx);
  const seedDemoData = useFinanceStore((s) => s.seedDemoData);

  const [txToDelete, setTxToDelete] = useState<TransactionWithDetails | null>(null);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const todayStr = useMemo(() => {
    return new Date().toISOString().split('T')[0];
  }, []);

  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const groupedTransactions = useMemo(() => {
    const groups: {
      [date: string]: {
        items: TransactionWithDetails[];
        netAmount: number;
      };
    } = {};

    for (const tx of transactions) {
      const dateKey = tx.localDate;
      if (!groups[dateKey]) {
        groups[dateKey] = { items: [], netAmount: 0 };
      }
      groups[dateKey].items.push(tx);

      if (tx.type === 'expense') {
        groups[dateKey].netAmount -= tx.amount;
      } else if (tx.type === 'income') {
        groups[dateKey].netAmount += tx.amount;
      } else if (tx.type === 'transfer' && tx.fee > 0) {
        groups[dateKey].netAmount -= tx.fee;
      }
    }

    const sortedDates = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedDates.map((date) => ({
      date,
      items: groups[date].items,
      netAmount: groups[date].netAmount,
    }));
  }, [transactions]);

  const getDateHeaderLabel = (dateStr: string) => {
    if (dateStr === todayStr) {
      return 'Hari Ini';
    }
    if (dateStr === yesterdayStr) {
      return 'Kemarin';
    }
    return formatDate(dateStr);
  };

  const handleOpenDelete = (tx: TransactionWithDetails) => {
    setTxToDelete(tx);
  };

  const handleConfirmDelete = async () => {
    if (txToDelete) {
      const id = txToDelete.id;
      setTxToDelete(null);
      await deleteTx(id);
    }
  };

  return (
    <>
      <ScrollView
        className="flex-1 bg-linen-bg dark:bg-cypress-bg px-5"
        style={{ paddingTop: Math.max(insets.top + 8, 16) }}
        contentContainerStyle={{ paddingBottom: 48 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => loadAllData({ force: true, showLoading: true })}
            tintColor={colors.tint}
            colors={[colors.tint]}
          />
        }
      >
        <View className="flex-row items-center justify-between pb-4 pt-1">
          <View>
            <Text className="text-xl font-black text-linen-text-primary dark:text-cypress-text-primary tracking-tight">
              Riwayat Transaksi
            </Text>
            <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
              {transactions.length} mutasi tercatat
            </Text>
          </View>

          <Pressable
            onPress={togglePrivacyMode}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            className="w-9 h-9 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border/80 dark:border-cypress-border/80 items-center justify-center active:opacity-70"
            accessibilityLabel="Sensor Angka"
          >
            {isPrivacyMode ? (
              <EyeOff size={16} color={colors.textSecondary} />
            ) : (
              <Eye size={16} color={colors.textSecondary} />
            )}
          </Pressable>
        </View>

        {transactions.length === 0 && !isLoading && (
          <View className="items-center justify-center py-20 px-4">
            <View className="w-14 h-14 rounded-2xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border items-center justify-center mb-3">
              <Inbox size={26} color={colors.textSecondary} />
            </View>
            <Text className="text-base font-bold text-linen-text-primary dark:text-cypress-text-primary">
              Belum ada catatan mutasi
            </Text>
            <Text className="mt-1 text-center text-xs text-linen-text-secondary dark:text-cypress-text-secondary leading-4 max-w-xs">
              Pengeluaran harian dan pemasukan yang kamu catat akan terorganisir rapi di sini.
            </Text>
            <Pressable
              onPress={seedDemoData}
              className="mt-4 py-2 px-4 rounded-xl bg-cypress-surface dark:bg-accent-champagne active:opacity-80 shadow-xs"
            >
              <Text className="text-xs font-bold text-white dark:text-[#0C1513]">
                Isi Data Sampel
              </Text>
            </Pressable>
          </View>
        )}

        {groupedTransactions.map((group) => (
          <TransactionGroup
            key={group.date}
            date={group.date}
            label={getDateHeaderLabel(group.date)}
            netAmount={group.netAmount}
            items={group.items}
            isPrivacyMode={isPrivacyMode}
            colorScheme={colorScheme}
            onDelete={handleOpenDelete}
          />
        ))}
      </ScrollView>

      <DeleteTransactionModal
        visible={Boolean(txToDelete)}
        transaction={txToDelete}
        isPrivacyMode={isPrivacyMode}
        colorScheme={colorScheme}
        onClose={() => setTxToDelete(null)}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
