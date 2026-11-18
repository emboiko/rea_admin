import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1f4d3a' },
        secondary: { main: '#8a5a2a' },
        background: { default: '#f4f1ea', paper: '#fffdf8' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#8fbfa8' },
        secondary: { main: '#e0b07a' },
        background: { paper: '#24302a' },
        divider: 'rgba(244, 241, 234, 0.16)',
      },
    },
  },
  typography: {
    fontFamily: '"Segoe UI", "Source Sans 3", sans-serif',
  },
  shape: {
    borderRadius: 10,
  },
});
