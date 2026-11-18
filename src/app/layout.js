import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { AppThemeProvider } from '@/components/theme/AppThemeProvider';
import './globals.css';

export const metadata = {
  title: 'Redfield Estates',
  description: 'Annual dues for the Redfield Estates Association.',
};

const RootLayout = ({ children }) => {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <InitColorSchemeScript attribute="class" defaultMode="system" />
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
