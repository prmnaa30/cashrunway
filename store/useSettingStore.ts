import { create } from "zustand"

interface SettingsState {
  currency: string;
  isPrivacyMode: boolean;
  themeMode: 'system' | 'light' | 'dark';
  setCurrency: (currency: string) => void;
  togglePrivacyMode: () => void;
  setThemeMode: (mode: 'system' | 'light' | 'dark') => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  currency: 'IDR',
  isPrivacyMode: false,
  themeMode: 'system',
  setCurrency: (currency) => set({ currency }),
  togglePrivacyMode: () => set((state) => ({ isPrivacyMode: !state.isPrivacyMode })),
  setThemeMode: (mode) => set({ themeMode: mode }),
}));
