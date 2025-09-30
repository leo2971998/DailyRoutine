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
    50: '#f2f7ff',
    100: '#d8e6ff',
    200: '#b9d2ff',
    300: '#99bdff',
    400: '#5f95ff',
    500: '#2b6bff',
    600: '#1f4fcc',
    700: '#16399a',
    800: '#0d2466',
    900: '#061133'
  }
};

const styles = {
  global: {
    body: {
      bg: '#f7f8fc',
      color: '#1a202c'
    }
  }
};

const theme = extendTheme({ config, fonts, colors, styles });

export default theme;
