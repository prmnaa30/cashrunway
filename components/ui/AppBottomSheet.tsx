import React, { useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  StyleSheet,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { X } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export interface AppBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxHeight?: string | number;
  showHandle?: boolean;
  contentClassName?: string;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function AppBottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = '90%',
  showHandle = true,
  contentClassName = '',
}: AppBottomSheetProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

  // Direct render synchronization to avoid empty null frame
  const [isRendered, setIsRendered] = useState(visible);
  if (visible && !isRendered) {
    setIsRendered(true);
  }

  const isClosingRef = useRef(false);

  // Dynamic sheet height and animations
  const sheetHeight = useSharedValue(0);
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const backdropOpacity = useSharedValue(0);
  const isOpened = useSharedValue(false);

  const finalizeClose = useCallback(() => {
    setIsRendered(false);
    isClosingRef.current = false;
    isOpened.value = false;
    onClose();
  }, [onClose]);

  const closeWithAnimation = useCallback(() => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    backdropOpacity.value = withTiming(0, { duration: 180 });
    const targetY = sheetHeight.value > 0 ? sheetHeight.value + 40 : SCREEN_HEIGHT;

    translateY.value = withTiming(
      targetY,
      {
        duration: 200,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
      (finished) => {
        if (finished) {
          runOnJS(finalizeClose)();
        }
      }
    );
  }, [finalizeClose]);

  // When visible changes to true, reset state
  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      setIsRendered(true);
      // If already measured, animate up immediately
      if (sheetHeight.value > 0) {
        translateY.value = sheetHeight.value;
        translateY.value = withTiming(0, {
          duration: 250,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }, (finished) => {
          if (finished) {
            isOpened.value = true;
          }
        });
        backdropOpacity.value = withTiming(1, { duration: 220 });
      }
    } else if (isRendered && !isClosingRef.current) {
      closeWithAnimation();
    }
  }, [visible, closeWithAnimation]);

  // Handle measurement of sheet height
  const handleSheetLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0) {
      const isFirstMeasure = sheetHeight.value === 0;
      sheetHeight.value = h;

      if (isFirstMeasure && !isClosingRef.current) {
        // Start sliding up from exact bottom of card
        translateY.value = h;
        translateY.value = withTiming(0, {
          duration: 260,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }, (finished) => {
          if (finished) {
            isOpened.value = true;
          }
        });
        backdropOpacity.value = withTiming(1, { duration: 220 });
      }
    }
  }, []);

  // UI-thread worklet Pan Gesture
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      'worklet';
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      'worklet';
      if (e.translationY > 80 || e.velocityY > 600) {
        const targetY = sheetHeight.value > 0 ? sheetHeight.value + 40 : SCREEN_HEIGHT;
        translateY.value = withTiming(
          targetY,
          { duration: 180, easing: Easing.bezier(0.25, 0.1, 0.25, 1) },
          (finished) => {
            if (finished) {
              runOnJS(finalizeClose)();
            }
          }
        );
        backdropOpacity.value = withTiming(0, { duration: 180 });
      } else {
        translateY.value = withTiming(0, {
          duration: 200,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        });
      }
    });

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
      onRequestClose={closeWithAnimation}
    >
      <View style={StyleSheet.absoluteFill}>
        {/* Full-screen Backdrop */}
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
            accessibilityLabel="Tutup sheet"
          />
        </Animated.View>

        {/* Bottom Sheet Card */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
          pointerEvents="box-none"
        >
          <Animated.View
            onLayout={handleSheetLayout}
            style={[
              { maxHeight: maxHeight as any },
              sheetAnimatedStyle,
            ]}
            className={"bg-linen-card dark:bg-cypress-card rounded-t-3xl border-t border-linen-border dark:border-cypress-border shadow-2xl " + contentClassName}
          >
            {/* Drag Handle with Native GestureDetector */}
            {showHandle && (
              <GestureDetector gesture={panGesture}>
                <View className="w-full items-center pb-1 pt-2.5 active:opacity-75">
                  <View className="w-11 h-1.5 rounded-full bg-linen-border dark:bg-cypress-border" />
                </View>
              </GestureDetector>
            )}

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pb-3 border-b border-linen-border/60 dark:border-cypress-border/60">
              <View className="flex-1 pr-3">
                <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary">
                  {title}
                </Text>
                {subtitle ? (
                  <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary mt-0.5 leading-4">
                    {subtitle}
                  </Text>
                ) : null}
              </View>

              <Pressable
                onPress={closeWithAnimation}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                className="min-w-[40px] min-h-[40px] rounded-full bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center active:opacity-70"
                accessibilityLabel="Tutup"
              >
                <X size={16} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Content with dynamic transition only when opened */}
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
