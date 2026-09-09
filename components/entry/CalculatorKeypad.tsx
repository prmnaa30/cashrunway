import React, { useCallback } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import { Delete, Check } from 'lucide-react-native';
import { KeypadKey } from '@/lib/utils/calculator';
import { useQuickEntryStore } from '@/store/useQuickEntryStore';

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
    <Pressable
      disabled={disabled}
      onPressIn={onPressIn}
      onPress={onPress}
      onLongPress={onLongPress}
      android_ripple={{
        color: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
        borderless: false,
      }}
      style={({ pressed }) => [
        pressed && Platform.OS === 'ios' && styles.iosPressed,
      ]}
      className={`flex-1 h-14 rounded-2xl border items-center justify-center overflow-hidden ${className}`}
    >
      {children}
    </Pressable>
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
  iosPressed: {
    opacity: 0.6,
  },
});

/**
 * Ultra-fast 4x4 keypad with 0ms touch latency.
 * Uses Pressable with delayPressIn={0} and onPressIn to register inputs on touch-down (like native dialers).
 * UI touch feedback is hardware-accelerated via android_ripple.
 */
function CalculatorKeypadComponent({
  onKeyPress,
  onSubmit,
  isValid,
  colorScheme,
  submitText = 'Simpan',
}: CalculatorKeypadProps) {
  const isDark = colorScheme === 'dark';

  const pressKey = useQuickEntryStore((s) => s.pressKey);
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
    'bg-linen-surface dark:bg-cypress-card border-linen-border dark:border-cypress-border';
  const numTextClass =
    'text-2xl font-bold font-mono text-linen-text-primary dark:text-cypress-text-primary';

  const opBtnClass =
    'bg-linen-card dark:bg-cypress-surface border-linen-border dark:border-cypress-border';
  const opTextClass =
    'text-xl font-bold text-linen-text-secondary dark:text-cypress-text-secondary';
  const shortcutTextClass =
    'text-base font-extrabold font-mono text-linen-text-secondary dark:text-cypress-text-secondary';

  const submitBtnClass = isValid
    ? 'bg-accent-brass dark:bg-accent-champagne border-accent-brass dark:border-accent-champagne'
    : 'bg-linen-card/40 dark:bg-cypress-surface/40 border-linen-border/40 dark:border-cypress-border/40 opacity-40';

  const submitTextColor = isValid
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
          disabled={!isValid}
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
              {submitText}
            </Text>
          </View>
        </KeypadButton>
      </View>
    </View>
  );
}

export const CalculatorKeypad = React.memo(CalculatorKeypadComponent);
