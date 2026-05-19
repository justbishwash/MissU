import { useThemeStore } from '../store/useThemeStore';
import { THEMES } from '../lib/themes';

// Wraps children with the active theme's animated gradient background
export default function ThemeBackground({ children, className = '' }) {
  const activeTheme = useThemeStore((s) => s.activeTheme);
  const theme = THEMES[activeTheme] || THEMES['pink-love'];

  return (
    <div className={`relative min-h-screen bg-gradient-to-br ${theme.bgGradient} animate-gradient ${className}`}>
      {children}
    </div>
  );
}
