import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  Dimensions,
  StyleSheet,
  PanResponder,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Edit3, SlidersHorizontal, Trash2, X, Wallet as WalletIcon } from 'lucide-react-native';
import { Wallet } from '@/lib/db';
import Colors from '@/constants/Colors';

export interface WalletActionMenuModalProps {
  visible: boolean;
  wallet: Wallet | null;
  colorScheme: 'light' | 'dark';
  onClose: () => void;
  onEdit: (wallet: Wallet) => void;
  onAdjustBalance: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function WalletActionMenuModal({
  visible,
  wallet,
  colorScheme,
  onClose,
  onEdit,
  onAdjustBalance,
  onDelete,
}: WalletActionMenuModalProps) {
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme];

  const [isRendered, setIsRendered] = useState(visible);
  const [cachedWallet, setCachedWallet] = useState<Wallet | null>(wallet);
  const isClosingRef = useRef(false);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (wallet) {
      setCachedWallet(wallet);
    }
  }, [wallet]);

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      setIsRendered(true);
      translateY.value = SCREEN_HEIGHT;
      backdropOpacity.value = 0;
      translateY.value = withTiming(0, {
        duration: 380,
        easing: Easing.bezier(0.2, 0.9, 0.3, 1),
      });
      backdropOpacity.value = withTiming(1, { duration: 320 });
    } else if (isRendered && !isClosingRef.current) {
      closeWithAnimation();
    }
  }, [visible]);

  const finalizeClose = (callback?: () => void) => {
    setIsRendered(false);
    isClosingRef.current = false;
    onClose();
    if (callback) {
      callback();
    }
  };

  const closeWithAnimation = (callback?: () => void) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    backdropOpacity.value = withTiming(0, { duration: 280 });
    translateY.value = withTiming(
      SCREEN_HEIGHT,
      {
        duration: 320,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
      (finished) => {
        if (finished) {
          runOnJS(finalizeClose)(callback);
        }
      }
    );
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 5,
        onPanResponderMove: (_, gesture) => {
          if (gesture.dy > 0) {
            translateY.value = gesture.dy;
          }
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 70 || gesture.vy > 0.5) {
            closeWithAnimation();
          } else {
            translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
          }
        },
      }),
    []
  );

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const currentWallet = wallet || cachedWallet;
  if (!isRendered || !currentWallet) return null;

  return (
    <Modal
      visible={isRendered}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => closeWithAnimation()}
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Stationary Backdrop - only fades, never slides */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: 'rgba(0, 0, 0, 0.65)' },
            backdropAnimatedStyle,
          ]}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => closeWithAnimation()}
            accessibilityLabel="Tutup menu"
          />
        </Animated.View>

        {/* Bottom Sheet Card */}
        <View className="flex-1 justify-end" pointerEvents="box-none">
          <Animated.View
            style={[
              { paddingBottom: Math.max(insets.bottom, 24) },
              sheetAnimatedStyle,
            ]}
            className="bg-linen-card dark:bg-cypress-card rounded-t-3xl border-t border-linen-border dark:border-cypress-border p-5"
          >
            {/* Drag Handle Indicator */}
            <View {...panResponder.panHandlers} className="w-full items-center pb-3 pt-1">
              <View className="w-11 h-1.5 rounded-full bg-linen-border dark:bg-cypress-border" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-linen-border/60 dark:border-cypress-border/60 mb-3">
              <View className="flex-row items-center flex-1 mr-2">
                <View className="w-8 h-8 rounded-full bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center mr-2">
                  <WalletIcon size={14} color={colors.tint} />
                </View>
                <Text
                  numberOfLines={1}
                  className="text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary"
                >
                  {currentWallet.name}
                </Text>
              </View>

              <Pressable
                onPress={() => closeWithAnimation()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-7 h-7 rounded-full bg-linen-surface dark:bg-cypress-surface items-center justify-center border border-linen-border dark:border-cypress-border active:opacity-70"
              >
                <X size={14} color={colors.textSecondary} />
              </Pressable>
            </View>

            <View className="space-y-2">
              {/* Edit Details / Settings */}
              <Pressable
                onPress={() => closeWithAnimation(() => onEdit(currentWallet))}
                className="p-3.5 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border flex-row items-center active:opacity-70 mb-2"
              >
                <Edit3 size={16} color={colors.tint} />
                <View className="ml-3 flex-1">
                  <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
                    Ubah Informasi Dompet
                  </Text>
                  <Text className="text-[10px] text-linen-text-secondary dark:text-cypress-text-secondary">
                    Ganti nama, bentuk dompet, atau suku bunga
                  </Text>
                </View>
              </Pressable>

              {/* Balance Reconciliation */}
              <Pressable
                onPress={() => closeWithAnimation(() => onAdjustBalance(currentWallet))}
                className="p-3.5 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border flex-row items-center active:opacity-70 mb-2"
              >
                <SlidersHorizontal size={16} color={colors.tint} />
                <View className="ml-3 flex-1">
                  <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
                    Sesuaikan Saldo Fisik
                  </Text>
                  <Text className="text-[10px] text-linen-text-secondary dark:text-cypress-text-secondary">
                    Perbarui saldo akun {currentWallet.name} agar sesuai dengan jumlah yang sebenarnya
                  </Text>
                </View>
              </Pressable>

              {/* Delete / Archive */}
              <Pressable
                onPress={() => closeWithAnimation(() => onDelete(currentWallet))}
                className="p-3.5 rounded-2xl bg-status-danger/10 border border-status-danger/25 flex-row items-center active:opacity-70"
              >
                <Trash2 size={16} color="#EF4444" />
                <View className="ml-3 flex-1">
                  <Text className="text-xs font-bold text-status-danger">
                    Hapus / Arsipkan Dompet
                  </Text>
                  <Text className="text-[10px] text-linen-text-secondary dark:text-cypress-text-secondary">
                    Simpan riwayat masa lalu dan sembunyikan dompet
                  </Text>
                </View>
              </Pressable>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
