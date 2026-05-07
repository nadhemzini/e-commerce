'use client';
import { create } from 'zustand';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const applyTheme = (theme: Theme): 'light' | 'dark' => {
  const prefersDark =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

  const resolved: 'light' | 'dark' =
    theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;

  if (resolved === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  return resolved;
};

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'system',
  resolvedTheme: 'light',

  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    const resolvedTheme = applyTheme(theme);
    set({ theme, resolvedTheme });
  },
}));

/** Call this once in a client component (ThemeProvider) inside useEffect. */
export const initTheme = () => {
  if (typeof window === 'undefined') return;
  const saved = localStorage.getItem('theme') as Theme | null;
  const theme: Theme = saved || 'system';
  const resolvedTheme = applyTheme(theme);
  useThemeStore.setState({ theme, resolvedTheme });
};
