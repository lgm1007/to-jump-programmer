import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { useProgress } from '@/features/progress/store';

import { palettes, type ColorScheme, type Theme } from './tokens';

const ThemeContext = createContext<Theme>({ scheme: 'light', colors: palettes.light });

export function AppThemeProvider({ children }: { children: ReactNode }) {
  const preference = useProgress((s) => s.settings.theme);
  const system = useColorScheme();
  const scheme: ColorScheme =
    preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;
  const value = useMemo<Theme>(() => ({ scheme, colors: palettes[scheme] }), [scheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}

export function useColors() {
  return useContext(ThemeContext).colors;
}
