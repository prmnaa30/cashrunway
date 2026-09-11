import React, { useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  KeyboardAvoidingView,
  Platform,
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
import { X } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

export interface SettingsBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  maxHeight?: string | number;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;

export function SettingsBottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = '88%',
}: SettingsBottomSheetProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];

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
        duration: 320,
        easing: Easing.bezier(0.2, 0.9, 0.3, 1),
      });
      backdropOpacity.value = withTiming(1, { duration: 260 });
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

    backdropOpacity.value = withTiming(0, { duration: 220 });
    translateY.value = withTiming(
      SCREEN_HEIGHT,
      {
        duration: 260,
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
        {/* Full-screen Backdrop covering entire window including navbar */}
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
            accessibilityLabel="Tutup"
          />
        </Animated.View>

        {/* Bottom Sheet Modal Card */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end"
          pointerEvents="box-none"
        >
          <Animated.View
            style={[
              { maxHeight: maxHeight as any },
              sheetAnimatedStyle,
            ]}
            className="bg-linen-card dark:bg-cypress-card rounded-t-3xl border-t border-linen-border dark:border-cypress-border shadow-2xl"
          >
            {/* Drag Handle Bar */}
            <View {...panResponder.panHandlers} className="w-full items-center pb-2 pt-2.5">
              <View className="w-11 h-1.5 rounded-full bg-linen-border dark:bg-cypress-border" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-5 pb-3 border-b border-linen-border/60 dark:border-cypress-border/60">
              <View className="flex-1 pr-3">
                <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary">
                  {title}
                </Text>
                {subtitle && (
                  <Text className="text-xs text-linen-text-secondary dark:text-cypress-text-secondary mt-0.5 leading-4">
                    {subtitle}
                  </Text>
                )}
              </View>

              <Pressable
                onPress={() => closeWithAnimation()}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-8 h-8 rounded-full bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border items-center justify-center active:opacity-70"
              >
                <X size={16} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Content Body */}
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
