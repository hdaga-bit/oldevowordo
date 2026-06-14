export const COLORS = {
  background: '#090a0c',
  surface: '#18181b',
  surfaceElevated: '#1c1c1f',
  border: '#27272a',
  borderSubtle: '#3f3f46',
  text: {
    primary: '#fafafa',
    secondary: '#a1a1aa',
    muted: '#71717a',
  },
  accent: {
    primary: '#fafafa',
    primaryFg: '#18181b',
  },
};

export const SURFACES = {
  app: COLORS.background,
  card: COLORS.surface,
  cardElevated: COLORS.surfaceElevated,
};

/** @deprecated Use SURFACES — kept for gradual migration */
export const GRADIENTS = {
  background: COLORS.background,
  accent: COLORS.accent.primary,
  accentHover: COLORS.accent.primary,
};

export const SPACING = {
  xs: '0.5rem',
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
  '3xl': '4rem',
};

export const BORDER_RADIUS = {
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  full: '9999px',
};

export const SHADOWS = {
  sm: '0 1px 3px rgba(0, 0, 0, 0.35)',
  md: '0 4px 12px rgba(0, 0, 0, 0.4)',
  lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
};

export const ANIMATIONS = {
  duration: {
    fast: '150ms',
    normal: '250ms',
    slow: '350ms',
  },
  easing: {
    easeOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
    easeIn: 'cubic-bezier(0.7, 0, 0.84, 0)',
    easeInOut: 'cubic-bezier(0.87, 0, 0.13, 1)',
  },
};

export const TRANSITIONS = {
  default: `all ${ANIMATIONS.duration.normal} ${ANIMATIONS.easing.easeOut}`,
  fast: `all ${ANIMATIONS.duration.fast} ${ANIMATIONS.easing.easeOut}`,
  slow: `all ${ANIMATIONS.duration.slow} ${ANIMATIONS.easing.easeOut}`,
};

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
};
