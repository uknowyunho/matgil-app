import { create } from 'zustand';
import { storage } from '../utils/storage';

type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'app.themeMode';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: (storage.getString(THEME_KEY) as ThemeMode) || 'system',

  setMode: (mode) => {
    storage.set(THEME_KEY, mode);
    set({ mode });
  },
}));
