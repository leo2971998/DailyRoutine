import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true
};

const fonts = {
  heading: 'Outfit, sans-serif',
  body: 'Outfit, sans-serif'
};

const colors = {
  brand: {
    50: '#fef7ed',
    100: '#fed7aa',
    200: '#fdba74',
    300: '#fb923c',
    400: '#f97316',
    500: '#ea580c',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d'
  },
  text: {
    primary: '#1f2937',
    secondary: '#374151',
    muted: '#6b7280',
    inverse: '#f9fafb',
    accent: '#dc2626'
  },
  bg: {
    primary: '#ffffff',
    secondary: '#f9fafb',
    accent: '#fef7ed',
    dark: '#1f2937',
    gradient: 'linear-gradient(135deg, #fef7ed 0%, #fed7aa 100%)'
  }
};

const semanticTokens = {
  colors: {
    'text.primary': { default: colors.text.primary, _dark: colors.text.inverse },
    'text.secondary': { default: colors.text.secondary, _dark: '#e5e7eb' },
    'text.muted': { default: colors.text.muted, _dark: '#d1d5db' },
    'text.inverse': { default: colors.text.inverse, _dark: colors.text.primary },
    'text.accent': { default: colors.text.accent, _dark: '#fca5a5' },
    'text.onAccent': { default: '#ffffff', _dark: '#ffffff' },
    'bg.primary': { default: colors.bg.primary, _dark: '#111827' },
    'bg.secondary': { default: colors.bg.secondary, _dark: '#1f2937' },
    'bg.accent': { default: colors.bg.accent, _dark: '#2c1b17' },
    'bg.muted': { default: '#f4f5f7', _dark: '#1e293b' },
    'bg.dark': { default: colors.bg.dark, _dark: '#0f172a' },
    'bg.gradient': {
      default: colors.bg.gradient,
      _dark: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)'
    },
    'surface.translucent': {
      default: 'linear-gradient(160deg, rgba(255, 255, 255, 0.96), rgba(254, 247, 235, 0.9))',
      _dark: 'linear-gradient(160deg, rgba(30, 41, 59, 0.82), rgba(15, 23, 42, 0.9))'
    },
    'surface.solid': {
      default: 'linear-gradient(150deg, rgba(253, 186, 116, 0.16), rgba(234, 88, 12, 0.12))',
      _dark: 'linear-gradient(150deg, rgba(30, 41, 59, 0.92), rgba(15, 23, 42, 0.96))'
    },
    'surface.muted': {
      default: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(254, 247, 237, 0.92))',
      _dark: 'linear-gradient(180deg, rgba(30, 41, 59, 0.9), rgba(17, 24, 39, 0.95))'
    },
    'border.subtle': { default: 'rgba(15, 23, 42, 0.08)', _dark: 'rgba(148, 163, 184, 0.32)' },
    'border.strong': { default: 'rgba(234, 88, 12, 0.28)', _dark: 'rgba(248, 113, 113, 0.45)' }
  },
  shadows: {
    'shadow.card': { default: '0 18px 48px rgba(15, 23, 42, 0.12)', _dark: '0 18px 48px rgba(0, 0, 0, 0.45)' },
    'shadow.accent': { default: '0 10px 24px rgba(234, 88, 12, 0.2)', _dark: '0 10px 24px rgba(248, 113, 113, 0.35)' }
  }
};

const shadows = {
  'shadow.card': '0 18px 48px rgba(15, 23, 42, 0.12)',
  'shadow.accent': '0 10px 24px rgba(234, 88, 12, 0.2)'
};

const styles = {
  global: {
    'html, body': {
      bg: 'bg.primary',
      color: 'text.primary',
      transitionProperty: 'background-color, color',
      transitionDuration: '0.2s'
    }
  }
};

const theme = extendTheme({ config, fonts, colors, semanticTokens, styles, shadows });

export default theme;
