import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
} from 'react-native';
import { Archive, X, AlertTriangle } from 'lucide-react-native';
import { Wallet } from '@/lib/db';
import { formatCurrency } from '@/lib/format';
import Colors from '@/constants/Colors';

export interface DeleteWalletModalProps {
  visible: boolean;
  wallet: Wallet | null;
  isPrivacyMode: boolean;
  colorScheme: 'light' | 'dark';
  onClose: () => void;
  onConfirm: (walletId: string) => Promise<void>;
}

export function DeleteWalletModal({
  visible,
  wallet,
  isPrivacyMode,
  colorScheme,
  onClose,
  onConfirm,
}: DeleteWalletModalProps) {
  const colors = Colors[colorScheme];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!wallet) return null;

  const hasRemainingBalance = (wallet.balance || 0) > 0;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onConfirm(wallet.id);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menghapus dompet');
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
          <View className="items-center mb-3">
            <View className="w-12 h-12 rounded-full bg-status-danger/15 border border-status-danger/30 items-center justify-center mb-2">
              <Archive size={22} color="#EF4444" />
            </View>
            <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary text-center">
              Hapus / Arsipkan Dompet
            </Text>
            <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary text-center mt-1">
              Apakah Anda yakin ingin menghapus akun{' '}
              <Text className="font-bold text-linen-text-primary dark:text-cypress-text-primary">
                "{wallet.name}"
              </Text>
              ?
            </Text>
          </View>

          {hasRemainingBalance && (
            <View className="mb-4 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex-row items-start">
              <AlertTriangle size={16} color="#F59E0B" className="mt-0.5" />
              <View className="ml-2 flex-1">
                <Text className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  Saldo Masih Tersisa
                </Text>
                <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary mt-0.5 leading-4">
                  Akun ini masih memiliki saldo{' '}
                  <Text className="font-bold font-mono">
                    {formatCurrency(wallet.balance, isPrivacyMode)}
                  </Text>
                  . Saldo tidak akan lagi dihitung ke kas harian / tabungan aktif setelah diarsipkan.
                </Text>
              </View>
            </View>
          )}

          <View className="p-3 rounded-xl bg-linen-surface dark:bg-cypress-surface border border-linen-border/60 dark:border-cypress-border/60 mb-4">
            <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary leading-4">
              🛡️ <Text className="font-bold text-linen-text-primary dark:text-cypress-text-primary">Aman:</Text> Seluruh mutasi & riwayat transaksi historis yang pernah menggunakan akun ini tetap tersimpan utuh di laporan keuangan.
            </Text>
          </View>

          {errorMsg ? (
            <Text className="text-xs text-status-danger mb-3 font-semibold text-center">
              {errorMsg}
            </Text>
          ) : null}

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
              className={`flex-1 py-3 rounded-xl bg-status-danger items-center justify-center active:opacity-80 ${
                isSubmitting ? 'opacity-60' : ''
              }`}
            >
              <Text className="text-xs font-black text-white">
                {isSubmitting ? 'Memproses...' : 'Ya, Hapus'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
