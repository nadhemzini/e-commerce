'use client';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { cn } from '@/lib/utils';

type Theme = 'light' | 'dark' | 'system';

const options: { value: Theme; icon: React.ReactNode; label: string }[] = [
  { value: 'light', icon: <Sun className="w-4 h-4" />, label: 'Light' },
  { value: 'dark', icon: <Moon className="w-4 h-4" />, label: 'Dark' },
  { value: 'system', icon: <Monitor className="w-4 h-4" />, label: 'System' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useThemeStore();

  const active = options.find((o) => o.value === theme) ?? options[0];
  const next = options[(options.findIndex((o) => o.value === theme) + 1) % options.length];

  return (
    <button
      id="theme-toggle-btn"
      onClick={() => setTheme(next.value)}
      className={cn(
        'btn-ghost p-2 rounded-xl transition-all duration-150',
        'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
      )}
      aria-label={`Thème actuel: ${active.label}. Changer vers ${next.label}`}
      title={`Thème: ${active.label}`}
    >
      <span className="transition-all duration-150">{active.icon}</span>
    </button>
  );
}
