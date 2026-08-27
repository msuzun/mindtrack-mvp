import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getAppSetting, setAppSetting } from '../db/database';
import { darkColors, lightColors, ResolvedTheme, ThemeColors, ThemeMode } from '../theme';

const STORAGE_KEY = '@mindtrack/theme-mode';

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  colors: ThemeColors;
  ready: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void getAppSetting(STORAGE_KEY).then((saved) => {
      if (!active) return;
      if (saved === 'system' || saved === 'dark' || saved === 'light') setModeState(saved);
      setReady(true);
    }).catch(() => setReady(true));
    return () => { active = false; };
  }, []);

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await setAppSetting(STORAGE_KEY, nextMode);
  }, []);

  const resolvedTheme: ResolvedTheme = mode === 'system'
    ? (systemScheme === 'light' ? 'light' : 'dark')
    : mode;
  const colors = resolvedTheme === 'dark' ? darkColors : lightColors;
  const value = useMemo(
    () => ({ mode, resolvedTheme, colors, ready, setMode }),
    [mode, resolvedTheme, colors, ready, setMode]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}

export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors } = useTheme();
  return useMemo(() => factory(colors), [colors, factory]);
}
