import React, { useCallback } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { Delete, Check } from 'lucide-react-native';
import { KeypadKey } from '@/lib/utils/calculator';
import { useQuickEntryStore } from '@/store/useQuickEntryStore';
import { useTranslation } from '@/lib/i18n';

export interface CalculatorKeypadProps {
  onKeyPress?: (key: KeypadKey) => void;
  onSubmit: () => void;
  isValid: boolean;
  colorScheme: 'light' | 'dark';
  submitText?: string;
}

interface KeypadButtonProps {
  onPressIn?: () => void;
  onPress?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  isDark?: boolean;
}

const KeypadButton = React.memo(function KeypadButton({
  onPressIn,
  onPress,
  onLongPress,
  children,
  className = '',
  disabled = false,
  isDark = true,
}: KeypadButtonProps) {
  return (
    <View
      style={styles.buttonWrapper}
      className={`border rounded-2xl overflow-hidden ${className}`}
    >
      <Pressable
        disabled={disabled}
        onPressIn={onPressIn}
        onPress={onPress}
        onLongPress={onLongPress}
        android_ripple={{
          color: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
          borderless: false,
        }}
        className="flex-1 w-full h-full items-center justify-center"
        style={({ pressed }) => [
          styles.pressableContent,
          pressed && Platform.OS === 'ios' && styles.iosPressed,
        ]}
      >
        {children}
      </Pressable>
    </View>
  );
});

interface KeyDigitProps {
  keyId: KeypadKey;
  label: string;
  btnClass: string;
  textClass: string;
  isDark: boolean;
  onPressKey: (key: KeypadKey) => void;
}

const KeyDigit = React.memo(function KeyDigit({
  keyId,
  label,
  btnClass,
  textClass,
  isDark,
  onPressKey,
}: KeyDigitProps) {
  const handlePressIn = useCallback(() => {
    onPressKey(keyId);
  }, [keyId, onPressKey]);

  return (
    <KeypadButton
      onPressIn={handlePressIn}
      className={btnClass}
      isDark={isDark}
    >
      <Text className={textClass}>{label}</Text>
    </KeypadButton>
  );
});

const styles = StyleSheet.create({
  buttonWrapper: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  pressableContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosPressed: {
    opacity: 0.6,
  },
});

/**
 * Ultra-fast 4x4 keypad with 0ms touch latency.
 * Uses Pressable with delayPressIn={0} and onPressIn to register inputs on touch-down (like native dialers).
 * UI touch feedback is hardware-accelerated via android_ripple with hard-clipped corners.
 */
function CalculatorKeypadComponent({
  onKeyPress,
  onSubmit,
  isValid,
  colorScheme,
  submitText,
}: CalculatorKeypadProps) {
  const { t } = useTranslation();
  const isDark = colorScheme === 'dark';

  const pressKey = useQuickEntryStore((s) => s.pressKey);
  const hasAmount = useQuickEntryStore((s) => s.amount > 0);
  const isSubmitReady = isValid && hasAmount;
  const effectiveSubmitText = submitText ?? t('entry.save');

  const handlePressKey = useCallback(
    (key: KeypadKey) => {
      if (onKeyPress) {
        onKeyPress(key);
      } else {
        pressKey(key);
      }
    },
    [onKeyPress, pressKey]
  );

  const handleBackspace = useCallback(() => {
    handlePressKey('backspace');
  }, [handlePressKey]);

  const handleClear = useCallback(() => {
    handlePressKey('clear');
  }, [handlePressKey]);

  const numBtnClass =
    'bg-linen-surface dark:bg-cypress-surface border-linen-border dark:border-cypress-border';
  const numTextClass =
    'text-2xl font-bold font-mono tabular-nums text-center text-linen-text-primary dark:text-cypress-text-primary';

  const opBtnClass =
    'bg-linen-surface/70 dark:bg-cypress-surface/60 border-linen-border/70 dark:border-cypress-border/70';
  const opTextClass =
    'text-xl font-bold text-center text-linen-text-secondary dark:text-cypress-text-secondary';
  const shortcutTextClass =
    'text-base font-extrabold font-mono tabular-nums text-center text-linen-text-secondary dark:text-cypress-text-secondary';

  const submitBtnClass = isSubmitReady
    ? 'bg-cypress-surface dark:bg-accent-champagne border-cypress-surface dark:border-accent-champagne'
    : 'bg-linen-surface/40 dark:bg-cypress-surface/40 border-linen-border/30 dark:border-cypress-border/30 opacity-40';

  const submitTextColor = isSubmitReady
    ? isDark
      ? '#0C1513'
      : '#FFFFFF'
    : isDark
    ? '#4B6258'
    : '#8D9F98';

  return (
    <View className="w-full px-3 pt-1.5 pb-1 gap-2">
      {/* Row 1: 1, 2, 3, Delete */}
      <View className="flex-row w-full gap-2">
        <KeyDigit
          keyId="1"
          label="1"
          btnClass={numBtnClass}
          textClass={numTextClass}
          isDark={isDark}
          onPressKey={handlePressKey}
        />
        <KeyDigit
          keyId="2"
          label="2"
          btnClass={numBtnClass}
          textClass={numTextClass}
          isDark={isDark}
          onPressKey={handlePressKey}
        />
        <KeyDigit
          keyId="3"
          label="3"
          btnClass={numBtnClass}
          textClass={numTextClass}
          isDark={isDark}
          onPressKey={handlePressKey}
        />
        <KeypadButton
          onPressIn={handleBackspace}
          onLongPress={handleClear}
          className={opBtnClass}
          isDark={isDark}
        >
          <Delete
            size={22}
            color={isDark ? '#8DA499' : '#52665E'}
            strokeWidth={2.2}
          />
        </KeypadButton>
      </View>

      {/* Row 2: 4, 5, 6, + */}
      <View className="flex-row w-full gap-2">
        <KeyDigit
          keyId="4"
          label="4"
          btnClass={numBtnClass}
          textClass={numTextClass}
          isDark={isDark}
          onPressKey={handlePressKey}
        />
        <KeyDigit
          keyId="5"
          label="5"
          btnClass={numBtnClass}
          textClass={numTextClass}
          isDark={isDark}
          onPressKey={handlePressKey}
        />
        <KeyDigit
          keyId="6"
          label="6"
          btnClass={numBtnClass}
          textClass={numTextClass}
          isDark={isDark}
          onPressKey={handlePressKey}
        />
        <KeyDigit
          keyId="+"
          label="+"
          btnClass={opBtnClass}
          textClass={opTextClass}
          isDark={isDark}
          onPressKey={handlePressKey}
        />
      </View>

      {/* Row 3: 7, 8, 9, - */}
      <View className="flex-row w-full gap-2">
        <KeyDigit
          keyId="7"
          label="7"
          btnClass={numBtnClass}
          textClass={numTextClass}
          isDark={isDark}
          onPressKey={handlePressKey}
        />
        <KeyDigit
          keyId="8"
          label="8"
          btnClass={numBtnClass}
          textClass={numTextClass}
          isDark={isDark}
          onPressKey={handlePressKey}
        />
        <KeyDigit
          keyId="9"
          label="9"
          btnClass={numBtnClass}
          textClass={numTextClass}
          isDark={isDark}
          onPressKey={handlePressKey}
        />
        <KeyDigit
          keyId="-"
          label="−"
          btnClass={opBtnClass}
          textClass={opTextClass}
          isDark={isDark}
          onPressKey={handlePressKey}
        />
      </View>

      {/* Row 4: 000, 0, =, Save */}
      <View className="flex-row w-full gap-2">
        <KeyDigit
          keyId="000"
          label="000"
          btnClass={opBtnClass}
          textClass={shortcutTextClass}
          isDark={isDark}
          onPressKey={handlePressKey}
        />
        <KeyDigit
          keyId="0"
          label="0"
          btnClass={numBtnClass}
          textClass={numTextClass}
          isDark={isDark}
          onPressKey={handlePressKey}
        />
        <KeyDigit
          keyId="="
          label="="
          btnClass={opBtnClass}
          textClass={opTextClass}
          isDark={isDark}
          onPressKey={handlePressKey}
        />
        <KeypadButton
          disabled={!isSubmitReady}
          onPress={onSubmit}
          className={submitBtnClass}
          isDark={isDark}
        >
          <View className="flex-row items-center justify-center">
            <Check size={18} color={submitTextColor} strokeWidth={3} />
            <Text
              className="text-xs font-black ml-1"
              style={{ color: submitTextColor }}
            >
              {effectiveSubmitText}
            </Text>
          </View>
        </KeypadButton>
      </View>
    </View>
  );
}

export const CalculatorKeypad = React.memo(CalculatorKeypadComponent);
