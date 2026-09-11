import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { X, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Colors, { Palette } from '@/constants/Colors';
import { Category } from '@/lib/db';
import { useFinanceStore } from '@/store/useFinanceStore';

export interface CategoryFormModalProps {
  visible: boolean;
  initialType?: 'expense' | 'income';
  categoryToEdit?: Category | null;
  onSave: (category: Category) => void;
  onClose: () => void;
  colorScheme: 'light' | 'dark';
}

const EXPENSE_EMOJIS = [
  '🍔', '☕', '🛒', '🍕', '🍜', '🧋',
  '🛵', '🚗', '⛽', '🏠', '💡', '📶',
  '🛍️', '👕', '🎮', '🎬', '📚', '✈️',
  '🐾', '💇', '🎁', '💄', '⚽', '🏋️',
  '💊', '🩺', '💳', '📦', '🍼', '🧹',
];

const INCOME_EMOJIS = [
  '💼', '💻', '💰', '💵', '📈', '🎁',
  '🏆', '🪙', '🏷️', '🏦', '🤝', '💎',
];

export function CategoryFormModal({
  visible,
  initialType = 'expense',
  categoryToEdit,
  onSave,
  onClose,
  colorScheme,
}: CategoryFormModalProps) {
  const colors = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const categories = useFinanceStore((s) => s.categories);
  const addCategory = useFinanceStore((s) => s.addCategory);
  const updateCategory = useFinanceStore((s) => s.updateCategory);

  const [type, setType] = useState<'expense' | 'income'>(initialType);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🍔');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize or reset when visible/categoryToEdit changes
  useEffect(() => {
    if (visible) {
      if (categoryToEdit) {
        setType(categoryToEdit.type as 'expense' | 'income');
        setName(categoryToEdit.name);
        setIcon(categoryToEdit.icon);
      } else {
        setType(initialType);
        setName('');
        setIcon(initialType === 'income' ? '💼' : '🍔');
      }
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [visible, categoryToEdit, initialType]);

  // Handle switching type when creating new category
  const handleTypeChange = (newType: 'expense' | 'income') => {
    setType(newType);
    if (!categoryToEdit) {
      setIcon(newType === 'income' ? '💼' : '🍔');
    }
    setErrorMessage(null);
  };

  const currentPresetEmojis = useMemo(
    () => (type === 'income' ? INCOME_EMOJIS : EXPENSE_EMOJIS),
    [type]
  );

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage('Nama kategori wajib diisi');
      return;
    }

    if (!icon.trim()) {
      setErrorMessage('Pilih atau ketik 1 emoji icon');
      return;
    }

    // Check for duplicate names within the same type
    const isDuplicate = categories.some(
      (c) =>
        c.type === type &&
        c.name.toLowerCase() === trimmedName.toLowerCase() &&
        c.id !== categoryToEdit?.id
    );

    if (isDuplicate) {
      setErrorMessage(`Kategori "${trimmedName}" sudah ada untuk ${type === 'income' ? 'pemasukan' : 'pengeluaran'}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (categoryToEdit) {
        await updateCategory(categoryToEdit.id, {
          name: trimmedName,
          icon: icon.trim(),
        });
        const updatedCat: Category = {
          ...categoryToEdit,
          name: trimmedName,
          icon: icon.trim(),
        };
        onSave(updatedCat);
      } else {
        const createdCat = await addCategory({
          name: trimmedName,
          type,
          icon: icon.trim(),
          isFixed: 0,
        });
        onSave(createdCat);
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to save category:', err);
      setErrorMessage(err?.message || 'Gagal menyimpan kategori');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(insets.top, 24) + 16,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onClose}
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
        />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? Palette.cypressBg : Palette.linenBg,
              borderColor: isDark ? Palette.cypressBorder : Palette.linenBorder,
              maxHeight: '94%',
            },
          ]}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-linen-border/60 dark:border-cypress-border/60">
            <Text className="text-base font-black text-linen-text-primary dark:text-cypress-text-primary">
              {categoryToEdit ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              className="w-7 h-7 rounded-full bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border items-center justify-center"
            >
              <X size={14} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            className="mt-3"
            style={{ maxHeight: 400 }}
          >
            {/* Type Selector (Disabled when editing) */}
            {!categoryToEdit && (
              <View className="mb-4">
                <Text className="text-xs font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-2">
                  Tipe Kategori
                </Text>
                <View className="flex-row p-1 rounded-xl bg-linen-surface dark:bg-cypress-card border border-linen-border/60 dark:border-cypress-border/60">
                  <TouchableOpacity
                    onPress={() => handleTypeChange('expense')}
                    activeOpacity={0.8}
                    className={`flex-1 py-2 rounded-lg items-center justify-center ${
                      type === 'expense'
                        ? isDark
                          ? 'bg-accent-champagne'
                          : 'bg-white shadow-xs border border-linen-border/40'
                        : ''
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        type === 'expense'
                          ? isDark
                            ? 'text-black'
                            : 'text-linen-text-primary'
                          : 'text-linen-text-secondary dark:text-cypress-text-secondary'
                      }`}
                    >
                      Pengeluaran
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleTypeChange('income')}
                    activeOpacity={0.8}
                    className={`flex-1 py-2 rounded-lg items-center justify-center ${
                      type === 'income'
                        ? isDark
                          ? 'bg-accent-champagne'
                          : 'bg-white shadow-xs border border-linen-border/40'
                        : ''
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        type === 'income'
                          ? isDark
                            ? 'text-black'
                            : 'text-linen-text-primary'
                          : 'text-linen-text-secondary dark:text-cypress-text-secondary'
                      }`}
                    >
                      Pemasukan
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Icon Preview & Custom Input */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-2">
                Icon / Emoji
              </Text>
              <View className="flex-row items-center">
                <View className="w-14 h-14 rounded-2xl bg-linen-surface dark:bg-cypress-card border border-linen-border dark:border-cypress-border items-center justify-center shadow-xs mr-3">
                  <Text
                    style={{
                      fontSize: 28,
                      lineHeight: 34,
                      textAlign: 'center',
                      opacity: icon ? 1 : 0.35,
                    }}
                  >
                    {icon || '🏷️'}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="text-[11px] text-linen-text-secondary dark:text-cypress-text-secondary mb-1">
                    Ketik emoji bebas dari keyboard:
                  </Text>
                  <TextInput
                    value={icon}
                    onChangeText={(val) => {
                      setIcon(val);
                      setErrorMessage(null);
                    }}
                    placeholder="Contoh: 🎧"
                    placeholderTextColor={colors.textSecondary}
                    maxLength={4}
                    style={{
                      height: 48,
                      textAlignVertical: 'center',
                      paddingVertical: 8,
                      fontSize: 15,
                    }}
                    className="px-3.5 rounded-xl bg-linen-surface dark:bg-cypress-card border border-linen-border/80 dark:border-cypress-border/80 text-linen-text-primary dark:text-cypress-text-primary font-medium"
                  />
                </View>
              </View>
            </View>

            {/* Quick Emoji Preset Grid */}
            <View className="mb-4">
              <Text className="text-[11px] font-semibold text-linen-text-secondary/80 dark:text-cypress-text-secondary/80 mb-2">
                Atau pilih emoji cepat:
              </Text>
              <View className="flex-row flex-wrap justify-start">
                {currentPresetEmojis.map((emojiItem) => {
                  const isSelected = icon === emojiItem;
                  return (
                    <TouchableOpacity
                      key={emojiItem}
                      onPress={() => {
                        setIcon(emojiItem);
                        setErrorMessage(null);
                      }}
                      activeOpacity={0.7}
                      className={`w-10 h-10 m-1 rounded-xl items-center justify-center border ${
                        isSelected
                          ? isDark
                            ? 'bg-accent-champagne/20 border-accent-champagne'
                            : 'bg-emerald-500/20 border-emerald-600'
                          : 'bg-linen-surface dark:bg-cypress-card border-linen-border/60 dark:border-cypress-border/60'
                      }`}
                    >
                      <Text style={{ textAlign: 'center', fontSize: 20 }}>{emojiItem}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Category Name */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-linen-text-secondary dark:text-cypress-text-secondary mb-1.5">
                Nama Kategori
              </Text>
              <TextInput
                value={name}
                onChangeText={(val) => {
                  setName(val);
                  setErrorMessage(null);
                }}
                placeholder={type === 'income' ? 'cth: Dividen, Royalti, Freelance' : 'cth: Skincare, Kopi Sore, Hobi'}
                placeholderTextColor={colors.textSecondary}
                maxLength={30}
                autoFocus={!categoryToEdit}
                style={{
                  height: 48,
                  textAlignVertical: 'center',
                  paddingVertical: 10,
                }}
                className="px-3.5 rounded-xl bg-linen-surface dark:bg-cypress-card border border-linen-border/80 dark:border-cypress-border/80 text-linen-text-primary dark:text-cypress-text-primary text-sm font-medium"
              />
            </View>

            {/* Error Banner */}
            {errorMessage ? (
              <View className="mb-4 p-2.5 rounded-xl bg-status-danger/15 border border-status-danger/30">
                <Text className="text-xs text-status-danger font-medium text-center">
                  {errorMessage}
                </Text>
              </View>
            ) : null}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={isSubmitting || !name.trim() || !icon.trim()}
              activeOpacity={0.8}
              className={`w-full py-3.5 rounded-xl items-center justify-center mt-1 mb-2 ${
                !name.trim() || !icon.trim()
                  ? 'bg-linen-border/60 dark:bg-cypress-border/40 opacity-50'
                  : isDark
                  ? 'bg-accent-champagne'
                  : 'bg-cypress-surface'
              }`}
            >
              <Text
                className={`text-sm font-bold ${
                  !name.trim() || !icon.trim()
                    ? 'text-linen-text-secondary dark:text-cypress-text-secondary'
                    : isDark
                    ? 'text-black'
                    : 'text-white'
                }`}
              >
                {isSubmitting
                  ? 'Menyimpan...'
                  : categoryToEdit
                  ? 'Simpan Perubahan'
                  : 'Buat Kategori'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
  },
});
