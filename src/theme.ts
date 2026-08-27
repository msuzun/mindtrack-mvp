export const darkColors = {
  background: '#0f172a', surface: '#1e293b', surfaceRaised: '#263449',
  border: '#334155', textPrimary: '#f8fafc', textMuted: '#94a3b8',
  accent: '#38bdf8', success: '#10b981', danger: '#fb7185',
  overlay: 'rgba(15, 23, 42, 0.82)', modalOverlay: 'rgba(2, 6, 23, 0.82)',
  shadow: '#000000', completedSurface: 'rgba(30, 41, 59, 0.72)',
  completedBorder: 'rgba(16, 185, 129, 0.45)', onAccent: '#0f172a',
  heatmapLow: '#6ee7b7', heatmapMedium: '#34d399',
} as const;

export const lightColors = {
  background: '#f8fafc', surface: '#ffffff', surfaceRaised: '#f1f5f9',
  border: '#e2e8f0', textPrimary: '#0f172a', textMuted: '#64748b',
  accent: '#0284c7', success: '#059669', danger: '#e11d48',
  overlay: 'rgba(248, 250, 252, 0.94)', modalOverlay: 'rgba(15, 23, 42, 0.45)',
  shadow: '#0f172a', completedSurface: '#f0fdf4',
  completedBorder: 'rgba(5, 150, 105, 0.38)', onAccent: '#ffffff',
  heatmapLow: '#a7f3d0', heatmapMedium: '#34d399',
} as const;

export type ThemeMode = 'system' | 'dark' | 'light';
export type ResolvedTheme = 'dark' | 'light';
export type ThemeColors = { [K in keyof typeof darkColors]: string };

export const radii = { card: 16, pill: 999 } as const;
export const spacing = { screen: 20, card: 18, section: 24 } as const;
