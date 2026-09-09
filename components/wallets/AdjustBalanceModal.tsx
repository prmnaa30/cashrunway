import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
} from 'react-native';
import { SlidersHorizontal, X } from 'lucide-react-native';
import { Wallet } from '@/lib/db';
import { formatCurrency } from '@/lib/format';
import Colors from '@/constants/Colors';

export interface AdjustBalanceModalProps {
  visible: boolean;
  wallet: Wallet | null;
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
  onClose: () => void;
  onConfirm: (walletId: string, newBalance: number) => Promise<void>;
}

export function AdjustBalanceModal({
  visible,
  wallet,
  isPrivacyMode,
  colorScheme,
  onClose,
  onConfirm,
}: AdjustBalanceModalProps) {
  const colors = Colors[colorScheme];

  const [inputBalance, setInputBalance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (visible && wallet) {
      setInputBalance(wallet.balance.toString());
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [visible, wallet]);

  if (!wallet) return null;

  const currentBalance = wallet.balance || 0;
  const parsedNewBalance = parseFloat(inputBalance.replace(/[^0-9.]/g, '')) || 0;
  const delta = parsedNewBalance - currentBalance;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onConfirm(wallet.id, parsedNewBalance);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal memperbarui saldo');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center px-6 bg-black/65">
        <Pressable className="absolute inset-0" onPress={onClose} />

        <View className="w-full max-w-sm rounded-3xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-5 shadow-2xl z-10">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-accent-brass/15 dark:bg-accent-champagne/15 items-center justify-center mr-2">
                <SlidersHorizontal size={16} color={colors.tint} />
              </View>
              <Text className="text-base font-bold text-linen-text-primary dark:text-cypress-text-primary">
                Perbarui Saldo
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-7 h-7 rounded-full items-center justify-center bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border"
            >
              <X size={14} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text className="text-xs leading-relaxed text-linen-text-secondary dark:text-cypress-text-secondary mb-4">
            Perbarui saldo akun <Text className="font-bold text-linen-text-primary dark:text-cypress-text-primary">{wallet.name}</Text> agar sesuai dengan jumlah uang fisik atau catatan rekeningmu yang sebenarnya.
          </Text>

          {/* Recorded vs New Balance Card */}
          <View className="p-3.5 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border mb-4">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-[11px] font-semibold text-linen-text-secondary dark:text-cypress-text-secondary">
                Saldo Tercatat di Aplikasi:
              </Text>
              <Text className="text-xs font-bold font-mono text-linen-text-primary dark:text-cypress-text-primary">
                {formatCurrency(currentBalance, isPrivacyMode)}
              </Text>
            </View>

            <View className="pt-2 border-t border-linen-border/60 dark:border-cypress-border/60">
              <Text className="text-[11px] font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-1">
                Saldo Sebenarnya Saat Ini:
              </Text>
              <TextInput
                value={inputBalance}
                onChangeText={setInputBalance}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textSecondary}
                className="w-full px-3 py-2 rounded-xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border text-base font-black font-mono text-linen-text-primary dark:text-cypress-text-primary"
              />
            </View>

            {/* Difference Indicator */}
            <View className="mt-3 pt-2 border-t border-linen-border/60 dark:border-cypress-border/60">
              <View className="flex-row justify-between items-center">
                <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary">
                  Selisih Penyesuaian:
                </Text>
                <Text
                  className={`text-xs font-black font-mono ${
                    delta > 0
                      ? 'text-status-safe'
                      : delta < 0
                      ? 'text-status-danger'
                      : 'text-linen-text-secondary dark:text-cypress-text-secondary'
                  }`}
                >
                  {delta > 0 ? '+' : ''}
                  {formatCurrency(delta, isPrivacyMode)}
                </Text>
              </View>

              {delta !== 0 && (
                <Text className="text-[10px] text-linen-text-secondary dark:text-cypress-text-secondary mt-1.5">
                  Sistem akan otomatis mencatat penyesuaian agar pembukuan tetap seimbang.
                </Text>
              )}
            </View>
          </View>

          {errorMsg ? (
            <Text className="text-xs text-status-danger mb-3 font-semibold">
              {errorMsg}
            </Text>
          ) : null}

          {/* Action Buttons */}
          <View className="flex-row gap-2">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center active:opacity-70"
            >
              <Text className="text-xs font-bold text-linen-text-secondary dark:text-cypress-text-secondary">
                Batal
              </Text>
            </Pressable>

            <Pressable
              onPress={handleConfirm}
              disabled={isSubmitting}
              className={`flex-1 py-3 rounded-xl bg-accent-brass dark:bg-accent-champagne items-center justify-center active:opacity-80 ${
                isSubmitting ? 'opacity-60' : ''
              }`}
            >
              <Text className="text-xs font-black text-[#0C1513]">
                {isSubmitting ? 'Menyimpan...' : 'Perbarui Saldo'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

