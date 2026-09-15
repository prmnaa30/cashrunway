import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { AppModal } from '@/components/ui/AppModal';
import Colors from '@/constants/Colors';

export interface NoteInputModalProps {
  visible: boolean;
  initialNote: string;
  onSaveNote: (note: string) => void;
  onClose: () => void;
  colorScheme: 'light' | 'dark';
}

export function NoteInputModal({
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

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title="Catatan Transaksi"
      subtitle="Tambahkan keterangan atau rincian transaksi"
      maxWidth={380}
    >
      <View className="pt-2">
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Tulis catatan di sini (opsional)..."
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="w-full min-h-[96px] p-3.5 rounded-2xl bg-linen-surface dark:bg-cypress-surface border border-linen-border dark:border-cypress-border text-sm font-medium text-linen-text-primary dark:text-cypress-text-primary mb-4"
        />

        <View className="flex-row items-center space-x-2">
          <TouchableOpacity
            onPress={() => {
              setText('');
              Keyboard.dismiss();
              onSaveNote('');
              onClose();
            }}
            activeOpacity={0.7}
            className="flex-1 py-3 rounded-xl border border-linen-border dark:border-cypress-border items-center justify-center mr-2"
          >
            <Text className="text-xs font-bold text-linen-text-secondary dark:text-cypress-text-secondary">
              Hapus Catatan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            activeOpacity={0.8}
            className="flex-1 py-3 rounded-xl bg-cypress-surface dark:bg-accent-champagne items-center justify-center shadow-xs"
          >
            <Text className="text-xs font-bold text-white dark:text-black">
              Simpan
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </AppModal>
  );
}
