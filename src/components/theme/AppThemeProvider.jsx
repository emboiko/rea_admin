'use client';

import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { SessionProvider } from '@/client/state/SessionProvider';
import { AppShell } from '@/components/layout/AppShell';
import { theme } from '@/components/theme/theme';

export const AppThemeProvider = ({ children }) => {
  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme} defaultMode="system">
        <CssBaseline />
        <SessionProvider>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
};
