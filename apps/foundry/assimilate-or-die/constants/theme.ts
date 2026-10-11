// ASSIMILATE OR DIE — AI APP FOUNDRY
// Design System: Gothic Industrial / Dark Terminal

export const Colors = {
  // Core backgrounds
  void: '#000000',
  abyss: '#080808',
  surface: '#0d0d0d',
  surfaceRaised: '#111111',
  surfaceElevated: '#161616',
  border: '#1e1e1e',
  borderGlow: '#2a0a0a',

  // Brand / Accent
  bloodRed: '#C0392B',
  crimson: '#E74C3C',
  scarlet: '#FF2D20',
  emberGlow: '#FF6B35',
  cyanPulse: '#00F5FF',
  cyanDim: '#00B8CC',
  cyanFaint: '#003d42',

  // Text
  textPrimary: '#F0F0F0',
  textSecondary: '#888888',
  textMuted: '#444444',
  textAccent: '#E74C3C',
  textCyan: '#00F5FF',

  // Status
  success: '#27AE60',
  warning: '#F39C12',
  danger: '#C0392B',
  info: '#00B8CC',

  // Gradients (used as arrays in LinearGradient)
  gradientHero: ['#000000', '#1a0000', '#0a0010'],
  gradientCard: ['#111111', '#0d0d0d'],
  gradientRed: ['#C0392B', '#7B241C'],
  gradientCyan: ['#00F5FF', '#00B8CC'],
};

export const Typography = {
  // Font weights
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  black: '900' as const,

  // Font sizes
  xs: 11,
  sm: 13,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  xxl: 30,
  display: 38,
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
  pill: 999,
};

export const Shadow = {
  redGlow: {
    shadowColor: '#C0392B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  cyanGlow: {
    shadowColor: '#00F5FF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 5,
  },
};
