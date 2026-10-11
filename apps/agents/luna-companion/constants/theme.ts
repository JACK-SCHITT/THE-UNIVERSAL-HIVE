// Dark Fantasy / Neon Dream Theme

export const colors = {
  // Background layers
  bgDeep: '#0a0a0f',
  bgDark: '#12121a',
  bgMid: '#1a1a26',
  bgLight: '#252533',

  // Neon accents
  neonPurple: '#a855f7',
  neonPink: '#ec4899',
  neonBlue: '#3b82f6',
  neonCyan: '#06b6d4',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#a8a8b8',
  textMuted: '#6b6b7b',

  // States
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',

  // Overlays
  overlay: 'rgba(10, 10, 15, 0.85)',
  overlayLight: 'rgba(255, 255, 255, 0.05)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 9999,
};

export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyLarge: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 28,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

export const shadows = {
  neonGlow: {
    shadowColor: '#a855f7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
};
