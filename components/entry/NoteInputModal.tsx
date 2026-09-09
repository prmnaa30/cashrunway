import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Platform,
  Modal,
  KeyboardAvoidingView,
  StyleSheet,
} from 'react-native';
import { FileText, X } from 'lucide-react-native';
import Colors from '@/constants/Colors';

export interface NoteInputModalProps {
  visible: boolean;
  initialNote: string;
  onSaveNote: (note: string) => void;
  onClose: () => void;
  colorScheme: 'light' | 'dark';
}

/**
 * Overlay dialog for entering or editing transaction notes with smooth keyboard awareness and fade animation.
 */
function NoteInputModalComponent({
  visible,
  initialNote,
  onSaveNote,
  onClose,
  colorScheme,
}: NoteInputModalProps) {
  const colors = Colors[colorScheme];
  const [text, setText] = useState(initialNote);

  useEffect(() => {
    if (visible) {
      setText(initialNote);
    }
  }, [initialNote, visible]);

  const handleSave = () => {
    Keyboard.dismiss();
    onSaveNote(text.trim());
    onClose();
  };

  const handleClose = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View className="flex-1 justify-center items-center px-5 bg-black/65">
          <TouchableOpacity
            onPress={handleClose}
            activeOpacity={1}
            style={StyleSheet.absoluteFill}
            accessibilityLabel="Tutup"
          />

          <View className="w-full max-w-sm rounded-3xl bg-linen-bg dark:bg-cypress-bg border border-linen-border dark:border-cypress-border p-5 shadow-2xl z-10">
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3 border-b border-linen-border/60 dark:border-cypress-border/60">
              <View className="flex-row items-center">
                <FileText size={18} color={colors.tint} />
                <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary ml-2">
                  Catatan Transaksi
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleClose}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-7 h-7 rounded-full bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border items-center justify-center"
              >
                <X size={14} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Input Box */}
            <View className="my-4 p-3.5 rounded-2xl bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border">
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Contoh: Makan siang nasi padang, beli bensin..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={3}
                autoFocus
                maxLength={120}
                className="text-sm text-linen-text-primary dark:text-cypress-text-primary min-h-[70px] text-top py-0"
              />
            </View>

            <View className="flex-row justify-between gap-2">
              <TouchableOpacity
                onPress={() => {
                  setText('');
                  onSaveNote('');
                  onClose();
                }}
                activeOpacity={0.7}
                className="px-4 py-3 rounded-2xl border border-linen-border dark:border-cypress-border items-center justify-center"
              >
                <Text className="text-xs font-bold text-linen-text-secondary dark:text-cypress-text-secondary">
                  Hapus
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSave}
                activeOpacity={0.8}
                className="flex-1 py-3 rounded-2xl bg-accent-brass dark:bg-accent-champagne items-center justify-center shadow-sm"
              >
                <Text className="text-xs font-black text-[#0C1513]">
                  Simpan Catatan
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const NoteInputModal = React.memo(NoteInputModalComponent);
