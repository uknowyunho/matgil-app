import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, type ColorPalette } from './colors';
import { useThemeStore } from '../store/useThemeStore';

interface ThemeContextValue {
  colors: ColorPalette;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const systemColorScheme = useColorScheme();

  const value = useMemo(() => {
    let isDark = false;
    if (mode === 'system') {
      isDark = systemColorScheme === 'dark';
    } else {
      isDark = mode === 'dark';
    }
    return {
      colors: isDark ? darkColors : lightColors,
      isDark,
    };
  }, [mode, systemColorScheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
