import { createTheme } from '@mui/material/styles';
import chartColors from './components/colors';

const theme = createTheme({
  palette: {
    background: {
      default: chartColors.background,
    },
    text: {
      primary: chartColors.axisText,
    },
    primary: {
      main: chartColors.api4com,
    },
    secondary: {
      main: chartColors.callix,
    },
  },
});

export default theme;
