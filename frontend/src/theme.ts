import { extendTheme, ThemeConfig } from '@chakra-ui/react';

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false
};

const fonts = {
  heading: 'Outfit, sans-serif',
  body: 'Outfit, sans-serif'
};

const colors = {
  brand: {
    50: '#fff7ed',
    100: '#ffedd5',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12'
  },
  warmGray: {
    50: '#fefaf6',
    100: '#f5ebe1',
    200: '#ead8c8',
    300: '#d0bba4',
    400: '#b79982',
    500: '#8d7055',
    600: '#745b45',
    700: '#5c4736',
    800: '#473327',
    900: '#2f2019'
  }
};

const styles = {
  global: {
    body: {
      bg: '#fff7ed',
      color: '#473327'
    }
  }
};

const theme = extendTheme({ config, fonts, colors, styles });

export default theme;
