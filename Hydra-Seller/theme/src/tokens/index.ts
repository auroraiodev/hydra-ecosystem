export const colors = {
  brand: {
    primary: '#148a81',
    primaryHover: '#0f6e69',
    primaryLight: '#e6f4f3',
    secondary: '#64748b',
    secondaryHover: '#475569',
    accent: '#f59e0b',
    accentHover: '#d97706',
  },
  semantic: {
    success: '#10b981',
    successLight: '#d1fae5',
    warning: '#f59e0b',
    warningLight: '#fef3c7',
    error: '#ef4444',
    errorLight: '#fee2e2',
    info: '#148a81',
    infoLight: '#e6f4f3',
  },
  neutral: {
    0:   '#ffffff',
    50:  '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617',
  },
  vault: {
    bg:          'oklch(0.06 0.02 260)',
    surface:     'oklch(0.1 0.01 260)',
    surfaceLow:  'oklch(0.08 0.01 260)',
    surfaceHigh: 'oklch(0.14 0.01 260)',
    border:      'oklch(0.2 0.03 175)',
    text:        'oklch(0.98 0 0)',
    textMuted:   'oklch(0.7 0.03 260)',
    teal:        'oklch(0.65 0.18 175)',
    gold:        'oklch(0.75 0.15 85)',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: ['Inter', 'sans-serif'],
    display: ['Inter', 'sans-serif'],
  },
  fontSize: {
    xs:   '0.75rem',
    sm:   '0.875rem',
    base: '1rem',
    lg:   '1.125rem',
    xl:   '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
  },
  fontWeight: {
    thin:      100,
    light:     300,
    normal:    400,
    medium:    500,
    semibold:  600,
    bold:      700,
    extrabold: 800,
    black:     900,
  },
} as const;

export const spacing = {
  0:  '0rem',
  1:  '0.25rem',
  2:  '0.5rem',
  3:  '0.75rem',
  4:  '1rem',
  5:  '1.25rem',
  6:  '1.5rem',
  8:  '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
  32: '8rem',
} as const;

export const borderRadius = {
  none:  '0',
  sm:    '0.125rem',
  base:  '0.25rem',
  md:    '0.375rem',
  lg:    '0.5rem',
  xl:    '0.75rem',
  '2xl': '1rem',
  '3xl': '1.5rem',
  full:  '9999px',
} as const;

export const shadows = {
  xs:   '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm:   '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md:   '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg:   '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl:   '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl':'0 25px 50px -12px rgb(0 0 0 / 0.25)',
  vaultGlow: '0 0 20px rgba(20, 184, 166, 0.15), 0 0 60px rgba(20, 184, 166, 0.05)',
} as const;

export const zIndex = {
  hide:     -1,
  base:      0,
  docked:   10,
  dropdown: 1000,
  sticky:   1100,
  overlay:  1300,
  modal:    1400,
  popover:  1500,
  toast:    1700,
  tooltip:  1800,
} as const;

export default { colors, typography, spacing, borderRadius, shadows, zIndex } as const;
