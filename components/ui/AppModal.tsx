import React, { useEffect, useState, useRef, ReactNode, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  BackHandler,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  showCloseButton?: boolean;
  maxWidth?: number;
  contentClassName?: string;
  accessibilityLabel?: string;
  useNativeModal?: boolean;
}

export function AppModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  showCloseButton = true,
  maxWidth = 400,
  contentClassName = '',
  accessibilityLabel,
  useNativeModal = true,
}: AppModalProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  const [isRendered, setIsRendered] = useState(visible);
  if (visible && !isRendered) {
    setIsRendered(true);
  }

  const isClosingRef = useRef(false);

  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.94);

  const finalizeClose = useCallback(() => {
    setIsRendered(false);
    isClosingRef.current = false;
    onClose();
  }, [onClose]);

  const closeWithAnimation = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    opacity.value = withTiming(0, { duration: 160, easing: Easing.bezier(0.4, 0, 0.2, 1) });
    scale.value = withTiming(
      0.94,
      { duration: 170, easing: Easing.bezier(0.4, 0, 0.2, 1) },
      (finished) => {
        if (finished) {
          runOnJS(finalizeClose)();
        }
      }
    );
  }, [finalizeClose]);

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      setIsRendered(true);
      opacity.value = withTiming(1, { duration: 160 });
      scale.value = withTiming(1, { duration: 170, easing: Easing.out(Easing.cubic) });
    } else if (isRendered && !isClosingRef.current) {
      closeWithAnimation();
    }
  }, [visible, closeWithAnimation]);

  useEffect(() => {
    if (!useNativeModal && isRendered) {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        closeWithAnimation();
        return true;
      });
      return () => sub.remove();
    }
  }, [useNativeModal, isRendered, closeWithAnimation]);

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!isRendered) return null;

  const modalContent = (
    <View style={StyleSheet.absoluteFill} className="items-center justify-center px-4 z-50">
      {/* Backdrop */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: 'rgba(0, 0, 0, 0.65)' },
          backdropAnimatedStyle,
        ]}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={closeWithAnimation}
          accessibilityLabel="Tutup dialog"
        />
      </Animated.View>

      {/* Keyboard Avoiding Content Wrapper */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="w-full items-center justify-center z-10"
        pointerEvents="box-none"
      >
        <Animated.View
          style={[
            { maxWidth, width: '100%' },
            cardAnimatedStyle,
          ]}
          className={"rounded-3xl bg-linen-card dark:bg-cypress-card border border-linen-border dark:border-cypress-border p-5 shadow-2xl " + contentClassName}
          accessibilityRole="alert"
          accessibilityLabel={accessibilityLabel || title}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <View className="flex-row items-center justify-between pb-3 mb-2 border-b border-linen-border/60 dark:border-cypress-border/60">
              <View className="flex-1 pr-3">
                {title && (
                  <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary">
                    {title}
                  </Text>
                )}
                {subtitle && (
                  <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary mt-0.5 leading-4">
                    {subtitle}
                  </Text>
                )}
              </View>

              {showCloseButton && (
                <Pressable
                  onPress={closeWithAnimation}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  className="min-w-[40px] min-h-[40px] rounded-full bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center active:opacity-70"
                  accessibilityLabel="Tutup"
                >
                  <X size={16} color={colors.textSecondary} />
                </Pressable>
              )}
            </View>
          )}

          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );

  if (useNativeModal) {
    return (
      <Modal
        visible={isRendered}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={closeWithAnimation}
      >
        {modalContent}
      </Modal>
    );
  }

  return modalContent;
}
