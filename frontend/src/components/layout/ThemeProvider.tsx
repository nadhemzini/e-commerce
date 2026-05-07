'use client';
import { useEffect } from 'react';
import { initTheme } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initTheme();
  }, []);

  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return <>{children}</>;
}
