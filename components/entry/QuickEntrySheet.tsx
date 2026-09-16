import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  BackHandler,
  StyleSheet,
  Dimensions,
} from 'react-native';
import BottomSheet, {
  BottomSheetView,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  useBottomSheetTimingConfigs,
} from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { useFinanceStore } from '@/store/useFinanceStore';
import { useQuickEntryStore } from '@/store/useQuickEntryStore';
import { useColorScheme } from '@/components/useColorScheme';
import Colors, { Palette } from '@/constants/Colors';
import { formatLocalDate } from '@/lib/engine/dateUtils';
import { evaluateExpression } from '@/lib/utils/calculator';
import { useTranslation } from '@/lib/i18n';


import { TransactionMode } from './types';
import { ModeSelector } from './ModeSelector';
import { AmountDisplay } from './AmountDisplay';
import { MetadataBar } from './MetadataBar';
import { CalculatorKeypad } from './CalculatorKeypad';
import { WalletPickerModal } from './WalletPickerModal';
import { CategoryPickerModal } from './CategoryPickerModal';
import { DatePickerModal } from './DatePickerModal';
import { FeePickerModal } from './FeePickerModal';
import { NoteInputModal } from './NoteInputModal';

import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, type SharedValue, Easing } from 'react-native-reanimated';

interface BackdropTouchAreaProps {
  animatedPosition: SharedValue<number>;
  onPress: () => void;
}

const BackdropTouchArea = React.memo(function BackdropTouchArea({
  animatedPosition,
  onPress,
}: BackdropTouchAreaProps) {
  const touchAreaStyle = useAnimatedStyle(() => ({
    height: Math.max(0, animatedPosition.value),
  }));

  return (
    <Animated.View style={[{ width: '100%' }, touchAreaStyle]}>
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Tutup sheet"
      />
    </Animated.View>
  );
});

/**
 * Ultra-smooth Quick Entry Bottom Sheet powered by @gorhom/bottom-sheet v5.
 * Declaratively controlled via Zustand isQuickEntryOpen for 100% reliable opening on navbar click.
 */
export function QuickEntrySheet() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme() ?? 'dark';
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme];
  const { t } = useTranslation();

  const isQuickEntryOpen = useQuickEntryStore((s) => s.isOpen);
  const quickEntryType = useQuickEntryStore((s) => s.type);
  const editingTransaction = useQuickEntryStore((s) => s.editingTransaction);
  const closeQuickEntry = useQuickEntryStore((s) => s.close);

  const addTransaction = useFinanceStore((s) => s.addTransaction);
  const editTransaction = useFinanceStore((s) => s.editTransaction);
  const wallets = useFinanceStore((s) => s.wallets);
  const categories = useFinanceStore((s) => s.categories);

  const bottomSheetRef = useRef<BottomSheet>(null);

  const [mode, setMode] = useState<TransactionMode>('expense');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('');
  const [targetWalletId, setTargetWalletId] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(formatLocalDate(new Date()));
  const [isOutlier, setIsOutlier] = useState<boolean>(false);
  const [note, setNote] = useState<string>('');
  const [fee, setFee] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sub-picker visibility states
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isTargetWalletModalOpen, setIsTargetWalletModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDateModalOpen, setIsDateModalOpen] = useState(false);
  const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);

  const sheetAnimationConfigs = useBottomSheetTimingConfigs({
    duration: 260,
    easing: Easing.bezier(0.25, 1, 0.5, 1),
  });

  const handleClose = useCallback(() => {
    bottomSheetRef.current?.close();
  }, []);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.65}
        pressBehavior="none"
      >
        <BackdropTouchArea
          animatedPosition={props.animatedPosition}
          onPress={handleClose}
        />
      </BottomSheetBackdrop>
    ),
    [handleClose]
  );

  const handleSheetChanges = useCallback(
    (index: number) => {
      if (index === -1) {
        closeQuickEntry();
      }
    },
    [closeQuickEntry]
  );

  // Synchronous state adjustment during render (prevents stale frame flickering when switching transactions)
  const activeTxId = isQuickEntryOpen ? (editingTransaction?.id ?? 'new') : null;
  const prevTxIdRef = useRef<string | null>(null);

  if (activeTxId !== null && activeTxId !== prevTxIdRef.current) {
    prevTxIdRef.current = activeTxId;
    if (editingTransaction) {
      const editMode = (editingTransaction.type === 'adjustment'
        ? 'expense'
        : editingTransaction.type) as TransactionMode;
      setMode(editMode);
      setSelectedDate(editingTransaction.localDate);
      setIsOutlier(Boolean(editingTransaction.isOutlier));
      setNote(editingTransaction.note ?? '');
      setFee(editingTransaction.fee ?? 0);
      setSelectedWalletId(editingTransaction.walletId);
      setTargetWalletId(editingTransaction.targetWalletId ?? '');
      setSelectedCategoryId(editingTransaction.categoryId ?? null);
      setIsSubmitting(false);
    } else {
      const initialMode = quickEntryType ?? 'expense';
      setMode(initialMode);
      setSelectedDate(formatLocalDate(new Date()));
      setIsOutlier(false);
      setNote('');
      setFee(0);
      setIsSubmitting(false);

      const opWallet = wallets.find((w) => w.isVault === 0) ?? wallets[0];
      const defaultWalletId = opWallet ? opWallet.id : '';
      setSelectedWalletId(defaultWalletId);

      const otherWallet = wallets.find((w) => w.id !== defaultWalletId);
      setTargetWalletId(otherWallet ? otherWallet.id : '');

      const defaultCat = categories.find((c) => c.type === initialMode);
      setSelectedCategoryId(defaultCat ? defaultCat.id : null);
    }
  } else if (activeTxId === null && prevTxIdRef.current !== null) {
    prevTxIdRef.current = null;
  }

  // Snap sheet smoothly on open trigger
  useEffect(() => {
    if (isQuickEntryOpen) {
      bottomSheetRef.current?.snapToIndex(0);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [isQuickEntryOpen]);

  // Hardware back button support
  useEffect(() => {
    const onBackPress = () => {
      if (
        isWalletModalOpen ||
        isTargetWalletModalOpen ||
        isCategoryModalOpen ||
        isDateModalOpen ||
        isFeeModalOpen ||
        isNoteModalOpen
      ) {
        setIsWalletModalOpen(false);
        setIsTargetWalletModalOpen(false);
        setIsCategoryModalOpen(false);
        setIsDateModalOpen(false);
        setIsFeeModalOpen(false);
        setIsNoteModalOpen(false);
        return true;
      }

      if (isQuickEntryOpen) {
        handleClose();
        return true;
      }
      return false;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [
    isQuickEntryOpen,
    isWalletModalOpen,
    isTargetWalletModalOpen,
    isCategoryModalOpen,
    isDateModalOpen,
    isFeeModalOpen,
    isNoteModalOpen,
    handleClose,
  ]);

  const handleModeChange = useCallback(
    (newMode: TransactionMode) => {
      setMode(newMode);
      if (newMode === 'transfer') {
        setSelectedCategoryId(null);
        if (!targetWalletId || targetWalletId === selectedWalletId) {
          const other = wallets.find((w) => w.id !== selectedWalletId);
          if (other) setTargetWalletId(other.id);
        }
      } else {
        const cat = categories.find((c) => c.type === newMode);
        setSelectedCategoryId(cat ? cat.id : null);
      }
    },
    [categories, selectedWalletId, targetWalletId, wallets]
  );

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId) ?? null;
  const targetWallet = wallets.find((w) => w.id === targetWalletId) ?? null;
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) ?? null;

  const hasAmount = useQuickEntryStore((s) => s.amount > 0);
  const isValid =
    hasAmount &&
    selectedWalletId !== '' &&
    (mode === 'transfer'
      ? targetWalletId !== '' && targetWalletId !== selectedWalletId
      : selectedCategoryId !== null) &&
    !isSubmitting;

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const finalAmount = evaluateExpression(useQuickEntryStore.getState().expression);
      if (finalAmount <= 0) return;

      const timeNow = new Date();
      const timeStr = timeNow.toTimeString().split(' ')[0];
      const fullDate = `${selectedDate} ${timeStr}`;

      if (editingTransaction) {
        await editTransaction(editingTransaction.id, {
          type: mode,
          amount: finalAmount,
          fee: mode === 'transfer' ? fee : 0,
          walletId: selectedWalletId,
          targetWalletId: mode === 'transfer' ? targetWalletId : null,
          categoryId: mode === 'transfer' ? null : selectedCategoryId,
          isOutlier: mode === 'expense' && isOutlier ? 1 : 0,
          date: fullDate,
          localDate: selectedDate,
          note: note.trim() ? note.trim() : null,
        });
      } else {
        await addTransaction({
          type: mode,
          amount: finalAmount,
          fee: mode === 'transfer' ? fee : 0,
          walletId: selectedWalletId,
          targetWalletId: mode === 'transfer' ? targetWalletId : null,
          categoryId: mode === 'transfer' ? null : selectedCategoryId,
          isOutlier: mode === 'expense' && isOutlier ? 1 : 0,
          date: fullDate,
          localDate: selectedDate,
          note: note.trim() ? note.trim() : null,
        });
      }

      // Smoothly close the sheet and reset state
      bottomSheetRef.current?.close();
      closeQuickEntry();
    } catch (err) {
      console.error('Failed to save quick transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitRef = useRef(handleSubmit);
  handleSubmitRef.current = handleSubmit;
  const onKeypadSubmit = useCallback(() => {
    handleSubmitRef.current();
  }, []);

  const sheetBg = isDark ? Palette.cypressCard : Palette.linenCard;
  const sheetBorder = isDark ? Palette.cypressBorder : Palette.linenBorder;

  let title = editingTransaction ? t('entry.editTitle') : t('entry.title');
  let subtitle = '';
  if (editingTransaction) {
    subtitle = t('entry.subtitleEdit');
  } else if (mode === 'expense') {
    subtitle = t('entry.subtitleExpense');
  } else if (mode === 'income') {
    subtitle = t('entry.subtitleIncome');
  } else {
    subtitle = t('entry.subtitleTransfer');
  }

  return (
    <View
      style={styles.sheetOverlay}
      pointerEvents={isQuickEntryOpen ? 'auto' : 'box-none'}
    >
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        enableDynamicSizing={true}
        maxDynamicContentSize={Dimensions.get('window').height * 0.92}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        enablePanDownToClose={true}
        enableOverDrag={false}
        overDragResistanceFactor={0}
        enableContentPanningGesture={false}
        enableHandlePanningGesture={true}
        animationConfigs={sheetAnimationConfigs}
        onClose={closeQuickEntry}
        backgroundStyle={{
          backgroundColor: sheetBg,
          borderColor: sheetBorder,
          borderWidth: 1,
        }}
        handleIndicatorStyle={{
          backgroundColor: isDark ? '#2D463E' : '#CBDAD3',
          width: 44,
          height: 5,
          borderRadius: 3,
        }}
      >
        <BottomSheetView
          onStartShouldSetResponder={() => true}
          style={[
            styles.sheetContent,
            { paddingBottom: Math.max(insets.bottom, 12) },
          ]}
        >
          {/* Header Content - matches Gambar 2 AppBottomSheet */}
          <View
            style={[
              styles.header,
              { borderBottomColor: isDark ? 'rgba(35, 58, 52, 0.6)' : 'rgba(220, 229, 224, 0.6)' },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text
                style={[
                  styles.title,
                  { color: isDark ? Palette.cypressTextPrimary : Palette.linenTextPrimary },
                ]}
              >
                {title}
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: isDark ? Palette.cypressTextSecondary : Palette.linenTextSecondary },
                ]}
              >
                {subtitle}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleClose}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDark ? Palette.cypressSurface : Palette.linenSurface,
                  borderColor: isDark ? Palette.cypressBorder : Palette.linenBorder,
                },
              ]}
              accessibilityLabel={t('entry.close')}
            >
              <X size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Mode Selector */}
          <ModeSelector
            mode={mode}
            onSelectMode={handleModeChange}
            colorScheme={colorScheme}
          />

          {/* Big Amount Display */}
          <AmountDisplay
            mode={mode}
            colorScheme={colorScheme}
          />

          {/* Metadata Action Chips Bar */}
          <MetadataBar
            mode={mode}
            wallet={selectedWallet}
            targetWallet={targetWallet}
            category={selectedCategory}
            selectedDate={selectedDate}
            isOutlier={isOutlier}
            note={note}
            fee={fee}
            onOpenWalletPicker={() => setIsWalletModalOpen(true)}
            onOpenTargetWalletPicker={() => setIsTargetWalletModalOpen(true)}
            onOpenCategoryPicker={() => setIsCategoryModalOpen(true)}
            onOpenDatePicker={() => setIsDateModalOpen(true)}
            onToggleOutlier={() => setIsOutlier(!isOutlier)}
            onOpenFeePicker={() => setIsFeeModalOpen(true)}
            onOpenNoteInput={() => setIsNoteModalOpen(true)}
            colorScheme={colorScheme}
          />

          {/* Large 4x4 Mini-Calculator Keypad */}
          <View style={styles.keypadWrapper}>
            <CalculatorKeypad
              onSubmit={onKeypadSubmit}
              isValid={isValid}
              colorScheme={colorScheme}
              submitText={isSubmitting ? '...' : t('entry.save')}
            />
          </View>
        </BottomSheetView>
      </BottomSheet>

      {/* In-Sheet Pickers / Overlays with useNativeModal={false} for instant 0ms native feel */}
      <WalletPickerModal
        visible={isWalletModalOpen}
        wallets={wallets}
        selectedWalletId={selectedWalletId}
        onSelectWallet={setSelectedWalletId}
        onClose={() => setIsWalletModalOpen(false)}
        colorScheme={colorScheme}
        title={mode === 'transfer' ? t('entry.sourceWalletTitle') : t('entry.walletPickerTitle')}
        useNativeModal={false}
      />

      <WalletPickerModal
        visible={isTargetWalletModalOpen}
        wallets={wallets}
        selectedWalletId={targetWalletId}
        onSelectWallet={setTargetWalletId}
        onClose={() => setIsTargetWalletModalOpen(false)}
        colorScheme={colorScheme}
        title={t('entry.targetWalletTitle')}
        excludeWalletId={selectedWalletId}
        useNativeModal={false}
      />

      <CategoryPickerModal
        visible={isCategoryModalOpen}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={setSelectedCategoryId}
        onClose={() => setIsCategoryModalOpen(false)}
        mode={mode}
        colorScheme={colorScheme}
        useNativeModal={false}
      />

      <DatePickerModal
        visible={isDateModalOpen}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onClose={() => setIsDateModalOpen(false)}
        colorScheme={colorScheme}
        useNativeModal={false}
      />

      <FeePickerModal
        visible={isFeeModalOpen}
        currentFee={fee}
        onSelectFee={setFee}
        onClose={() => setIsFeeModalOpen(false)}
        colorScheme={colorScheme}
        useNativeModal={false}
      />

      <NoteInputModal
        visible={isNoteModalOpen}
        initialNote={note}
        onSaveNote={setNote}
        onClose={() => setIsNoteModalOpen(false)}
        colorScheme={colorScheme}
        useNativeModal={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheetOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    elevation: 100,
  },
  sheetContent: {
    paddingHorizontal: 0,
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadWrapper: {
    paddingTop: 2,
    paddingBottom: 2,
  },
});

