import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Switch,
  Platform,
  KeyboardAvoidingView,
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
import { X, Banknote, Landmark, Smartphone, Percent, AlertCircle, ShieldAlert } from 'lucide-react-native';
import { Wallet } from '@/lib/db';
import Colors from '@/constants/Colors';

export interface WalletFormSheetProps {
  visible: boolean;
  walletToEdit?: Wallet | null;
  defaultIsVault?: boolean;
  colorScheme: 'light' | 'dark';
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    type: 'cash' | 'bank' | 'ewallet';
    isVault: boolean;
    initialBalance?: number;
    isInterestEnabled?: boolean;
    interestRate?: number;
    autoTax?: boolean;
    taxRate?: number;
    taxThreshold?: number;
  }) => Promise<void>;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function WalletFormSheet({
  visible,
  walletToEdit,
  defaultIsVault = false,
  colorScheme,
  onClose,
  onSubmit,
}: WalletFormSheetProps) {
  const insets = useSafeAreaInsets();
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  const isEditMode = Boolean(walletToEdit);

  const [name, setName] = useState('');
  const [type, setType] = useState<'cash' | 'bank' | 'ewallet'>('bank');
  const [isVault, setIsVault] = useState(defaultIsVault);
  const [initialBalance, setInitialBalance] = useState('');
  const [isInterestEnabled, setIsInterestEnabled] = useState(false);
  const [interestRatePercent, setInterestRatePercent] = useState('3.75');
  const [autoTax, setAutoTax] = useState(true);
  const [taxRatePercent, setTaxRatePercent] = useState('20');
  const [taxThresholdStr, setTaxThresholdStr] = useState('7500000');
  const [taxPreset, setTaxPreset] = useState<'id_bank' | 'zero' | 'custom'>('id_bank');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      if (walletToEdit) {
        setName(walletToEdit.name);
        setType(walletToEdit.type as any);
        setIsVault(Boolean(walletToEdit.isVault));
        setInitialBalance('');
        setIsInterestEnabled(Boolean(walletToEdit.isInterestEnabled));
        setInterestRatePercent(
          walletToEdit.interestRate ? (walletToEdit.interestRate * 100).toString() : '3.75'
        );
        const hasAutoTax = walletToEdit.autoTax !== 0;
        setAutoTax(hasAutoTax);
        const ratePct = walletToEdit.taxRate !== undefined && walletToEdit.taxRate !== null
          ? (walletToEdit.taxRate * 100).toString()
          : '20';
        setTaxRatePercent(ratePct);
        const thresh = walletToEdit.taxThreshold !== undefined && walletToEdit.taxThreshold !== null
          ? walletToEdit.taxThreshold.toString()
          : '7500000';
        setTaxThresholdStr(thresh);

        if (!hasAutoTax || ratePct === '0') {
          setTaxPreset('zero');
        } else if (ratePct === '20' && thresh === '7500000') {
          setTaxPreset('id_bank');
        } else {
          setTaxPreset('custom');
        }
      } else {
        setName('');
        setType('bank');
        setIsVault(defaultIsVault);
        setInitialBalance('');
        setIsInterestEnabled(defaultIsVault);
        setInterestRatePercent('3.75');
        setAutoTax(true);
        setTaxRatePercent('20');
        setTaxThresholdStr('7500000');
        setTaxPreset('id_bank');
      }
      setErrorMsg('');
      setIsSubmitting(false);
    }
  }, [visible, walletToEdit, defaultIsVault]);

  const handleSelectTaxPreset = (preset: 'id_bank' | 'zero' | 'custom') => {
    setTaxPreset(preset);
    if (preset === 'id_bank') {
      setAutoTax(true);
      setTaxRatePercent('20');
      setTaxThresholdStr('7500000');
    } else if (preset === 'zero') {
      setAutoTax(false);
      setTaxRatePercent('0');
      setTaxThresholdStr('0');
    } else {
      setAutoTax(true);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setErrorMsg('Nama dompet tidak boleh kosong');
      return;
    }

    const parsedInterest = parseFloat(interestRatePercent);
    if (isVault && isInterestEnabled && (isNaN(parsedInterest) || parsedInterest < 0)) {
      setErrorMsg('Suku bunga tidak valid');
      return;
    }

    const parsedTaxRate = parseFloat(taxRatePercent);
    if (isVault && isInterestEnabled && autoTax && (isNaN(parsedTaxRate) || parsedTaxRate < 0 || parsedTaxRate > 100)) {
      setErrorMsg('Tarif pajak tidak valid (0 - 100%)');
      return;
    }

    const parsedThreshold = parseFloat(taxThresholdStr.replace(/[^0-9.]/g, ''));
    if (isVault && isInterestEnabled && autoTax && (isNaN(parsedThreshold) || parsedThreshold < 0)) {
      setErrorMsg('Batas saldo bebas pajak tidak valid');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const balanceNum = initialBalance ? parseFloat(initialBalance.replace(/\D/g, '')) || 0 : 0;
      const rateDecimal = isVault && isInterestEnabled ? (parsedInterest || 0) / 100 : 0;
      const finalTaxRate = isVault && isInterestEnabled && autoTax ? (parsedTaxRate || 0) / 100 : 0;
      const finalTaxThreshold = isVault && isInterestEnabled && autoTax ? (parsedThreshold || 0) : 0;

      await onSubmit({
        name: name.trim(),
        type,
        isVault,
        initialBalance: isEditMode ? undefined : balanceNum,
        isInterestEnabled: isVault && isInterestEnabled,
        interestRate: rateDecimal,
        autoTax: isVault && isInterestEnabled ? autoTax : false,
        taxRate: finalTaxRate,
        taxThreshold: finalTaxThreshold,
      });

      closeWithAnimation();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan dompet');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isRendered, setIsRendered] = useState(visible);
  const isClosingRef = useRef(false);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);

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

  const finalizeClose = () => {
    setIsRendered(false);
    isClosingRef.current = false;
    onClose();
  };

  const closeWithAnimation = () => {
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
          runOnJS(finalizeClose)();
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

  if (!isRendered) return null;

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
            accessibilityLabel="Tutup formulir"
          />
        </Animated.View>

        {/* Bottom Sheet Card */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              { maxHeight: '88%' },
              sheetAnimatedStyle,
            ]}
            className="bg-linen-card dark:bg-cypress-card rounded-t-3xl border-t border-linen-border dark:border-cypress-border"
          >
            {/* Drag Handle Indicator */}
            <View {...panResponder.panHandlers} className="w-full items-center pb-2 pt-2">
              <View className="w-11 h-1.5 rounded-full bg-linen-border dark:bg-cypress-border" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pb-3 border-b border-linen-border/60 dark:border-cypress-border/60">
              <View>
                <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary">
                  {isEditMode ? 'Ubah Dompet / Tabungan' : 'Tambah Dompet Baru'}
                </Text>
                <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary">
                  {isVault ? 'Akun simpanan/tabungan' : 'Akun kas harian operasional'}
                </Text>
              </View>

              <Pressable
                onPress={() => closeWithAnimation()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-8 h-8 rounded-full bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center active:opacity-70"
              >
                <X size={16} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              className="px-5 pt-4"
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
              showsVerticalScrollIndicator={false}
            >
          {errorMsg ? (
            <View className="mb-4 p-3 rounded-xl bg-status-danger/10 border border-status-danger/30 flex-row items-center">
              <AlertCircle size={16} color="#EF4444" />
              <Text className="ml-2 text-xs font-semibold text-status-danger flex-1">
                {errorMsg}
              </Text>
            </View>
          ) : null}

            {/* Segmented: Daily Cash vs Savings */}
            {!isEditMode && (
              <View className="mb-4">
                <Text className="text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-2">
                  Kategori Akun
                </Text>
                <View className="flex-row p-1 rounded-2xl bg-linen-bg dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
                  <Pressable
                    onPress={() => {
                      setIsVault(false);
                      setIsInterestEnabled(false);
                    }}
                    className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
                      !isVault ? 'bg-white dark:bg-accent-champagne shadow-xs border border-linen-border/40 dark:border-transparent' : ''
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        !isVault ? 'text-linen-text-primary dark:text-[#0C1513]' : 'text-linen-text-secondary dark:text-cypress-text-secondary'
                      }`}
                    >
                      Uang Harian
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setIsVault(true);
                      setIsInterestEnabled(true);
                    }}
                    className={`flex-1 py-2.5 rounded-xl items-center justify-center ${
                      isVault ? 'bg-white dark:bg-accent-champagne shadow-xs border border-linen-border/40 dark:border-transparent' : ''
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        isVault ? 'text-linen-text-primary dark:text-[#0C1513]' : 'text-linen-text-secondary dark:text-cypress-text-secondary'
                      }`}
                    >
                      Tabungan
                    </Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* Name Input */}
            <View className="mb-4">
              <Text className="text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-2">
                Nama Dompet / Bank
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="contoh: BCA Tahapan, GoPay, SeaBank"
                placeholderTextColor={colors.textSecondary}
                className="w-full px-4 py-3 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border text-sm font-semibold text-linen-text-primary dark:text-cypress-text-primary"
              />
            </View>

            {/* Wallet Type */}
            <View className="mb-4">
              <Text className="text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-2">
                Bentuk Dompet
              </Text>
              <View className="flex-row gap-2">
                {[
                  { key: 'bank', label: 'Bank', icon: Landmark },
                  { key: 'ewallet', label: 'E-Wallet', icon: Smartphone },
                  { key: 'cash', label: 'Tunai', icon: Banknote },
                ].map((item) => {
                  const IconComponent = item.icon;
                  const isSelected = type === item.key;
                  return (
                    <Pressable
                      key={item.key}
                      onPress={() => setType(item.key as any)}
                      className={`flex-1 py-3 px-2 rounded-2xl border items-center justify-center ${
                        isSelected
                          ? 'bg-emerald-500/10 dark:bg-accent-champagne/15 border-emerald-600 dark:border-accent-champagne'
                          : 'bg-linen-surface dark:bg-cypress-surface border-linen-border dark:border-cypress-border'
                      }`}
                    >
                      <IconComponent
                        size={18}
                        color={
                          isSelected
                            ? colorScheme === 'dark'
                              ? '#D4AF37'
                              : '#059669'
                            : colors.textSecondary
                        }
                      />
                      <Text
                        className={`text-xs font-bold mt-1.5 ${
                          isSelected
                            ? 'text-emerald-800 dark:text-accent-champagne'
                            : 'text-linen-text-secondary dark:text-cypress-text-secondary'
                        }`}
                      >
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Initial Balance (Create mode only) */}
            {!isEditMode && (
              <View className="mb-4">
                <Text className="text-xs font-bold uppercase tracking-wider text-linen-text-secondary dark:text-cypress-text-secondary mb-2">
                  Saldo Awal (Opsional)
                </Text>
                <TextInput
                  value={initialBalance}
                  onChangeText={setInitialBalance}
                  keyboardType="numeric"
                  placeholder="Rp 0"
                  placeholderTextColor={colors.textSecondary}
                  className="w-full px-4 py-3 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border text-sm font-semibold text-linen-text-primary dark:text-cypress-text-primary"
                />
              </View>
            )}

            {/* Savings / Vault Options */}
            {isVault && (
              <View className="mb-5 p-4 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-row items-center flex-1 mr-2">
                    <Percent size={16} color={colors.tint} />
                    <Text className="ml-2 text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary">
                      Hitung Bunga Tabungan
                    </Text>
                  </View>
                  <Switch
                    value={isInterestEnabled}
                    onValueChange={setIsInterestEnabled}
                    trackColor={{ false: '#374151', true: colors.tint }}
                    thumbColor={Platform.OS === 'ios' ? undefined : '#FFFFFF'}
                  />
                </View>

                {isInterestEnabled && (
                  <View className="pt-2 border-t border-linen-border/60 dark:border-cypress-border/60">
                    <Text className="text-[11px] font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-1.5">
                      Suku Bunga (% per tahun)
                    </Text>
                    <View className="flex-row items-center gap-2 mb-3">
                      <TextInput
                        value={interestRatePercent}
                        onChangeText={setInterestRatePercent}
                        keyboardType="decimal-pad"
                        placeholder="3.75"
                        placeholderTextColor={colors.textSecondary}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border text-sm font-bold text-linen-text-primary dark:text-cypress-text-primary"
                      />
                      {['3.75', '5.0', '6.0'].map((preset) => (
                        <Pressable
                          key={preset}
                          onPress={() => setInterestRatePercent(preset)}
                          className="px-2.5 py-2.5 rounded-xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border"
                        >
                          <Text className="text-xs font-bold text-linen-text-secondary dark:text-cypress-text-secondary">
                            {preset}%
                          </Text>
                        </Pressable>
                      ))}
                    </View>

                    {/* Interest Tax Header */}
                    <View className="pt-3 border-t border-linen-border/60 dark:border-cypress-border/60">
                      <Text className="text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary mb-1">
                        Pajak Bunga / Imbal Hasil
                      </Text>
                      <Text className="text-[10px] text-linen-text-secondary dark:text-cypress-text-secondary mb-2.5">
                        Pilih aturan pajak atau kustomisasikan sesuai jenis produk dan mata uang
                      </Text>

                      {/* Preset Selector */}
                      <View className="flex-row gap-1.5 mb-3">
                        {[
                          { key: 'id_bank', label: 'Bank ID (20% > 7.5jt)' },
                          { key: 'zero', label: 'Bebas Pajak (0%)' },
                          { key: 'custom', label: 'Kustom' },
                        ].map((item) => {
                          const isSelected = taxPreset === item.key;
                          return (
                            <Pressable
                              key={item.key}
                              onPress={() => handleSelectTaxPreset(item.key as any)}
                              className={`flex-1 py-2 px-1 rounded-xl border items-center justify-center ${
                                isSelected
                                  ? 'bg-emerald-500/10 dark:bg-accent-champagne/15 border-emerald-600 dark:border-accent-champagne'
                                  : 'bg-linen-card dark:bg-cypress-card border-linen-border dark:border-cypress-border'
                              }`}
                            >
                              <Text
                                numberOfLines={1}
                                className={`text-[10px] font-bold ${
                                  isSelected
                                    ? 'text-emerald-800 dark:text-accent-champagne'
                                    : 'text-linen-text-secondary dark:text-cypress-text-secondary'
                                }`}
                              >
                                {item.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>

                      {/* Custom Tax Inputs (Shown when Custom is selected) */}
                      {taxPreset === 'custom' && (
                        <View className="p-3 rounded-xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border space-y-2.5">
                          <View>
                            <Text className="text-[10px] font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-1">
                              Tarif Pajak (% pemotongan)
                            </Text>
                            <TextInput
                              value={taxRatePercent}
                              onChangeText={setTaxRatePercent}
                              keyboardType="decimal-pad"
                              placeholder="20"
                              placeholderTextColor={colors.textSecondary}
                              className="w-full px-3 py-2 rounded-lg bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary"
                            />
                          </View>

                          <View>
                            <Text className="text-[10px] font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-1">
                              Ambang Batas Saldo Kena Pajak (Ketik 0 jika kena pajak dari awal)
                            </Text>
                            <TextInput
                              value={taxThresholdStr}
                              onChangeText={setTaxThresholdStr}
                              keyboardType="numeric"
                              placeholder="7500000"
                              placeholderTextColor={colors.textSecondary}
                              className="w-full px-3 py-2 rounded-lg bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border text-xs font-bold text-linen-text-primary dark:text-cypress-text-primary"
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`w-full py-4 rounded-2xl bg-cypress-surface dark:bg-accent-champagne items-center justify-center mb-6 active:opacity-80 shadow-xs ${
                isSubmitting ? 'opacity-60' : ''
              }`}
            >
              <Text className="text-sm font-black text-white dark:text-[#0C1513]">
                {isSubmitting
                  ? 'Menyimpan...'
                  : isEditMode
                  ? 'Simpan Perubahan'
                  : 'Buat Dompet Sekarang'}
              </Text>
            </Pressable>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  </Modal>
);
}
