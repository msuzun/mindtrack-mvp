export const darkColors = {
  background: '#0f172a', surface: '#1e293b', surfaceRaised: '#263449',
  border: '#334155', textPrimary: '#f8fafc', textMuted: '#94a3b8',
  accent: '#38bdf8', success: '#10b981', danger: '#fb7185',
  overlay: 'rgba(15, 23, 42, 0.82)', modalOverlay: 'rgba(2, 6, 23, 0.82)',
  shadow: '#000000', completedSurface: 'rgba(30, 41, 59, 0.72)',
  completedBorder: 'rgba(16, 185, 129, 0.45)', onAccent: '#0f172a',
  heatmapLow: '#6ee7b7', heatmapMedium: '#34d399',
  illustrationLine: '#94a3b8', illustrationGlowPrimary: 'rgba(56, 189, 248, 0.12)',
  illustrationGlowSecondary: 'rgba(16, 185, 129, 0.10)', illustrationFill: 'rgba(148, 163, 184, 0.08)',
  tagFocusBg: 'rgba(168, 85, 247, 0.15)', tagFocusText: '#c084fc',
  tagPersonalBg: 'rgba(16, 185, 129, 0.15)', tagPersonalText: '#34d399',
  tagWorkBg: 'rgba(56, 189, 248, 0.15)', tagWorkText: '#38bdf8',
  tagRoutineBg: 'rgba(251, 146, 60, 0.15)', tagRoutineText: '#fb923c',
  priorityImportant: '#f59e0b', priorityUrgent: '#fb7185',
} as const;

export const lightColors = {
  background: '#f8fafc', surface: '#ffffff', surfaceRaised: '#f1f5f9',
  border: '#e2e8f0', textPrimary: '#0f172a', textMuted: '#64748b',
  accent: '#0284c7', success: '#059669', danger: '#e11d48',
  overlay: 'rgba(248, 250, 252, 0.94)', modalOverlay: 'rgba(15, 23, 42, 0.45)',
  shadow: '#0f172a', completedSurface: '#f0fdf4',
  completedBorder: 'rgba(5, 150, 105, 0.38)', onAccent: '#ffffff',
  heatmapLow: '#a7f3d0', heatmapMedium: '#34d399',
  illustrationLine: '#64748b', illustrationGlowPrimary: 'rgba(2, 132, 199, 0.08)',
  illustrationGlowSecondary: 'rgba(5, 150, 105, 0.08)', illustrationFill: 'rgba(100, 116, 139, 0.06)',
  tagFocusBg: 'rgba(147, 51, 234, 0.10)', tagFocusText: '#7e22ce',
  tagPersonalBg: 'rgba(5, 150, 105, 0.10)', tagPersonalText: '#047857',
  tagWorkBg: 'rgba(2, 132, 199, 0.10)', tagWorkText: '#0369a1',
  tagRoutineBg: 'rgba(217, 119, 6, 0.10)', tagRoutineText: '#b45309',
  priorityImportant: '#d97706', priorityUrgent: '#e11d48',
} as const;

export type ThemeMode = 'system' | 'dark' | 'light';
export type ResolvedTheme = 'dark' | 'light';
export type ThemeColors = { [K in keyof typeof darkColors]: string };

export const radii = { card: 16, pill: 999 } as const;
export const spacing = { screen: 20, card: 18, section: 24 } as const;
