'use client';

import Button from '@mui/material/Button';
import { styled, useColorScheme } from '@mui/material/styles';

const ThemeButton = styled(Button)(({ theme }) => ({
  gap: theme.spacing(0.75),
  minWidth: 0,
  flexShrink: 0,
  textTransform: 'none',
  fontWeight: 600,
}));

const ThemeIcon = ({ className, children }) => {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
};

const MoonIcon = () => {
  return (
    <ThemeIcon className="theme-toggle-icon theme-toggle-moon">
      <path
        fill="currentColor"
        d="M21 14.6A8.4 8.4 0 0 1 9.4 3 7.2 7.2 0 1 0 21 14.6z"
      />
    </ThemeIcon>
  );
};

const SunIcon = () => {
  return (
    <ThemeIcon className="theme-toggle-icon theme-toggle-sun">
      <circle cx="12" cy="12" r="4" fill="currentColor" />
      <g stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M12 2.5v2.2M12 19.3V21.5M2.5 12h2.2M19.3 12h2.2M5.1 5.1l1.6 1.6M17.3 17.3l1.6 1.6M18.9 5.1l-1.6 1.6M6.7 17.3l-1.6 1.6" />
      </g>
    </ThemeIcon>
  );
};

export const ThemeModeToggle = () => {
  const { mode, setMode, systemMode } = useColorScheme();

  const handleToggle = () => {
    let resolvedMode = mode;
    if (mode === 'system') {
      resolvedMode = systemMode;
    }
    if (!resolvedMode && typeof document !== 'undefined') {
      if (document.documentElement.classList.contains('dark')) {
        resolvedMode = 'dark';
      } else {
        resolvedMode = 'light';
      }
    }
    if (resolvedMode === 'dark') {
      setMode('light');
      return;
    }
    setMode('dark');
  };

  return (
    <ThemeButton
      color="inherit"
      aria-label="Switch between light and dark theme"
      onClick={handleToggle}
    >
      <MoonIcon />
      <SunIcon />
      <span className="theme-toggle-to-dark">Dark</span>
      <span className="theme-toggle-to-light">Light</span>
    </ThemeButton>
  );
};
