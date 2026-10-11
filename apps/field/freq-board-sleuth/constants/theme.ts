// FreqBoard Sleuth — Dark Terminal Theme
export const theme = {
  colors: {
    background: '#0a0a0a',
    surface: '#1a1a1a',
    surfaceLight: '#2a2a2a',
    primary: '#00ff41', // Terminal green
    secondary: '#ffb000', // Warning amber
    danger: '#ff3333',
    text: '#e0e0e0',
    textDim: '#888888',
    textBright: '#ffffff',
    border: '#333333',
    success: '#00ff41',
    warning: '#ffb000',
    error: '#ff3333',
    graph: {
      low: '#001a0a',
      med: '#00ff41',
      high: '#ffb000',
      peak: '#ff3333',
    },
  },
  fonts: {
    mono: 'Courier',
    regular: 'System',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
} as const;

export type Theme = typeof theme;
