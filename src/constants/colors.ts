/**
 * Same palette as the KaaamNow app (KaaamNowApp/src/constants/colors.ts).
 * Exposed to CSS as variables by ThemeProvider, so styles read var(--color-*).
 */
export type ThemeColors = {
  background: string;
  surface: string;
  fill: string;
  border: string;
  outline: string;
  text: string;
  textMuted: string;
  textSubtle: string;
  primary: string;
  onPrimary: string;
  success: string;
  successSoft: string;
  warning: string;
  warningSoft: string;
  primarySoft: string;
  danger: string;
  dangerSoft: string;
  backdrop: string;
  sidebar: string;
  sidebarText: string;
  sidebarActive: string;
};

export const LIGHT_COLORS: ThemeColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  fill: '#F8FAFC',
  border: '#E2E8F0',
  outline: 'rgba(11, 16, 32, 0.22)',
  text: '#0B1020',
  textMuted: '#475569',
  textSubtle: '#64748B',
  primary: '#8B5CF6',
  onPrimary: '#FFFFFF',
  success: '#16A34A',
  successSoft: '#DCFCE7',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  primarySoft: '#F5F3FF',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  backdrop: 'rgba(11, 16, 32, 0.45)',
  sidebar: '#0B1020',
  sidebarText: '#A7B0C4',
  sidebarActive: '#171F35',
};

export const DARK_COLORS: ThemeColors = {
  background: '#0B1020',
  surface: '#171F35',
  fill: '#111830',
  border: '#29334B',
  outline: 'rgba(248, 250, 252, 0.22)',
  text: '#F8FAFC',
  textMuted: '#A7B0C4',
  textSubtle: '#7C879F',
  primary: '#8B5CF6',
  onPrimary: '#FFFFFF',
  success: '#22C55E',
  successSoft: '#14532D',
  warning: '#F59E0B',
  warningSoft: '#451A03',
  primarySoft: '#261F48',
  danger: '#EF4444',
  dangerSoft: '#451B1F',
  backdrop: 'rgba(0, 0, 0, 0.6)',
  sidebar: '#070B17',
  sidebarText: '#7C879F',
  sidebarActive: '#171F35',
};

export const BRAND_COLORS = {
  mark: '#8B5CF6',
  tileTop: '#171F35',
  tileBottom: '#0B1020',
} as const;

/** Series colours for charts, in order of use. */
export const CHART_COLORS = [
  '#8B5CF6',
  '#16A34A',
  '#F59E0B',
  '#0EA5E9',
  '#EC4899',
  '#64748B',
] as const;
