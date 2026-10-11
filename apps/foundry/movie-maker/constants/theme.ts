/**
 * Theme Constants - Cinematic Movie Studio Aesthetic
 */

export const Colors = {
  // Base
  background: '#0a0a0a',
  surface: '#1a1a1a',
  surfaceElevated: '#252525',
  
  // Brand - Cinematic Gold
  primary: '#FFD700',
  primaryDark: '#B8960A',
  accent: '#FFA500',
  
  // Text
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textMuted: '#666666',
  
  // Semantic
  success: '#4CAF50',
  error: '#FF5252',
  warning: '#FFC107',
  info: '#2196F3',
  
  // UI
  border: '#2a2a2a',
  divider: '#1f1f1f',
  overlay: 'rgba(0, 0, 0, 0.85)',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Typography = {
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    lineHeight: 36,
  },
  headline: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: Colors.text,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    color: Colors.text,
    lineHeight: 24,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.textMuted,
    lineHeight: 20,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const Shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
};
