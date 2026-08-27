import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import { getAppSetting, setAppSetting } from '../db/database';
import { darkColors, lightColors, ResolvedTheme, ThemeColors, ThemeMode } from '../theme';

const STORAGE_KEY = '@mindtrack/theme-mode';
const FONT_SCALE_KEY = '@mindtrack/font-size-scale';
export type FontSizeScale = 0.9 | 1 | 1.15;

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  colors: ThemeColors;
  ready: boolean;
  setMode: (mode: ThemeMode) => Promise<void>;
  fontSizeScale: FontSizeScale;
  setFontSizeScale: (scale: FontSizeScale) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [fontSizeScale, setFontSizeScaleState] = useState<FontSizeScale>(1);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    void Promise.all([getAppSetting(STORAGE_KEY), getAppSetting(FONT_SCALE_KEY)]).then(([saved, savedScale]) => {
      if (!active) return;
      if (saved === 'system' || saved === 'dark' || saved === 'light') setModeState(saved);
      const parsedScale = Number(savedScale);
      if (parsedScale === 0.9 || parsedScale === 1 || parsedScale === 1.15) setFontSizeScaleState(parsedScale);
      setReady(true);
    }).catch(() => setReady(true));
    return () => { active = false; };
  }, []);

  const setMode = useCallback(async (nextMode: ThemeMode) => {
    setModeState(nextMode);
    await setAppSetting(STORAGE_KEY, nextMode);
  }, []);

  const setFontSizeScale = useCallback(async (scale: FontSizeScale) => {
    setFontSizeScaleState(scale);
    await setAppSetting(FONT_SCALE_KEY, String(scale));
  }, []);

  const resolvedTheme: ResolvedTheme = mode === 'system'
    ? (systemScheme === 'light' ? 'light' : 'dark')
    : mode;
  const colors = resolvedTheme === 'dark' ? darkColors : lightColors;
  const value = useMemo(
    () => ({ mode, resolvedTheme, colors, ready, setMode, fontSizeScale, setFontSizeScale }),
    [mode, resolvedTheme, colors, ready, setMode, fontSizeScale, setFontSizeScale]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}

export function useThemedStyles<T>(factory: (colors: ThemeColors) => T): T {
  const { colors, fontSizeScale } = useTheme();
  return useMemo(() => {
    const styles = factory(colors) as Record<string, Record<string, unknown>>;
    const scaled = Object.fromEntries(Object.entries(styles).map(([name, style]) => [
      name,
      Object.fromEntries(Object.entries(style).map(([property, value]) => [
        property,
        (property === 'fontSize' || property === 'lineHeight') && typeof value === 'number'
          ? Math.round(value * fontSizeScale * 10) / 10
          : value,
      ])),
    ]));
    return scaled as T;
  }, [colors, factory, fontSizeScale]);
}

export function useTypography() {
  const { fontSizeScale, setFontSizeScale } = useTheme();
  return { fontSizeScale, setFontSizeScale };
}
