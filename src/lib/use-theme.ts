import * as React from 'react';

type Theme = 'light' | 'dark';
const STORAGE_KEY = 'devos:theme';

function apply(theme: Theme) {
  const html = document.documentElement;
  html.classList.toggle('dark', theme === 'dark');
}

/** Простой useTheme без контекста — состояние в localStorage + html.class */
export function useTheme(): [Theme, (t: Theme) => void, () => void] {
  const [theme, set] = React.useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  React.useEffect(() => {
    apply(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = React.useCallback(() => set((t) => (t === 'dark' ? 'light' : 'dark')), []);

  return [theme, set, toggle];
}
