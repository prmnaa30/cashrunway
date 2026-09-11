import { create } from "zustand";
import { updateSettings } from "@/lib/db";
import { colorScheme as nwColorScheme } from "nativewind";

interface SettingsState {
  currency: string;
  isPrivacyMode: boolean;
  themeMode: 'system' | 'light' | 'dark';
  setCurrency: (currency: string) => void;
  togglePrivacyMode: () => void;
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  currency: 'IDR',
  isPrivacyMode: false,
  themeMode: 'system',
  setCurrency: (currency) => {
    set({ currency });
    updateSettings({ currency }).catch(console.error);
  },
  togglePrivacyMode: () => {
    const nextVal = !get().isPrivacyMode;
    set({ isPrivacyMode: nextVal });
    updateSettings({ isPrivacyMode: nextVal ? 1 : 0 }).catch(console.error);
  },
  setThemeMode: (mode) => {
    set({ themeMode: mode });
    try {
      nwColorScheme.set(mode);
    } catch (_) {}
    updateSettings({ themeMode: mode }).catch(console.error);
  },
}));
