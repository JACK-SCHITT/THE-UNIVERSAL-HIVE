// KRACKERJACK FOUNDRY — Design Tokens
export const Colors = {
  // Core
  bg: '#000000',
  bgPanel: '#0a0a0a',
  bgCard: '#111111',
  bgInput: '#0d0d0d',

  // Brand
  primary: '#00ff00',       // Neon green
  primaryDim: '#00cc00',
  primaryMuted: '#003300',
  accent: '#FFD700',        // Gold
  accentDim: '#cc9900',
  accentMuted: '#2a2200',

  // Danger
  danger: '#ff4400',
  dangerDim: '#cc3300',
  dangerMuted: '#2a0900',

  // Text
  textPrimary: '#00ff00',
  textSecondary: '#888888',
  textMuted: '#444444',
  textOnPrimary: '#000000',
  textOnAccent: '#000000',

  // Additions
  infoMuted: '#001a2a',
  textWhite: '#ffffff',

  // Borders
  border: '#1a1a1a',
  borderActive: '#00ff00',
  borderAccent: '#FFD700',

  // Status
  success: '#00ff88',
  warning: '#FFD700',
  error: '#ff4400',
  info: '#00ccff',

  // Semantic
  surface: '#111111',
  overlay: 'rgba(0,0,0,0.85)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 100,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 28,
  hero: 36,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,
};
