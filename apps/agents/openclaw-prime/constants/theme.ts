// OpenClaw Prime — Design System
export const Colors = {
  // Base
  bg: '#080808',
  bgSurface: '#111111',
  bgCard: '#161616',
  bgElevated: '#1c1c1c',
  border: '#2a2a2a',
  borderStrong: '#3a3a3a',

  // Brand
  primary: '#F5A623',       // Amber — OpenClaw identity
  primaryDim: '#C4841C',
  primaryGlow: 'rgba(245,166,35,0.18)',
  primaryBorder: 'rgba(245,166,35,0.35)',

  // Agents
  architect: '#4FC3F7',     // Blueprint blue
  developer: '#69F0AE',     // Code green
  devops: '#CE93D8',        // Deploy purple
  marketer: '#FF8A65',      // Growth orange
  legal: '#FFD54F',         // Gold/legal
  billing: '#80DEEA',       // Teal/money

  // Text
  textPrimary: '#F0F0F0',
  textSecondary: '#999999',
  textMuted: '#555555',
  textInverse: '#080808',

  // Semantic
  success: '#69F0AE',
  error: '#FF5252',
  warning: '#F5A623',

  // UI
  white: '#FFFFFF',
  transparent: 'transparent',
};

export const Typography = {
  // Families
  mono: 'SpaceMono',

  // Sizes
  xs: 11,
  sm: 13,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  xxl: 30,
  display: 38,

  // Weights
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const Radii = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  amber: {
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
};
