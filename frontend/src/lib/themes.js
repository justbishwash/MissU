// MissU Theme System
// Each theme defines gradient, accent colors, and unlock criteria

export const THEMES = {
  'pink-love': {
    id: 'pink-love',
    name: 'Pink Love',
    emoji: '🩷',
    bgGradient: 'from-pink-400 via-rose-400 to-purple-500',
    cardGradient: 'from-pink-500 to-rose-500',
    accent: '#ff6b9d',
    glow: 'rgba(255, 107, 157, 0.4)',
    unlockedByDefault: true,
  },
  'midnight': {
    id: 'midnight',
    name: 'Midnight',
    emoji: '🌙',
    bgGradient: 'from-indigo-700 via-purple-800 to-slate-900',
    cardGradient: 'from-indigo-500 to-purple-600',
    accent: '#a78bfa',
    glow: 'rgba(167, 139, 250, 0.4)',
    requiresStreak: 7,
  },
  'sunset': {
    id: 'sunset',
    name: 'Cozy Sunset',
    emoji: '🌅',
    bgGradient: 'from-orange-400 via-pink-500 to-purple-600',
    cardGradient: 'from-orange-400 to-pink-500',
    accent: '#fb923c',
    glow: 'rgba(251, 146, 60, 0.4)',
    requiresStreak: 14,
  },
  'sakura': {
    id: 'sakura',
    name: 'Sakura Dream',
    emoji: '🌸',
    bgGradient: 'from-pink-200 via-pink-300 to-purple-400',
    cardGradient: 'from-pink-300 to-purple-400',
    accent: '#f9a8d4',
    glow: 'rgba(249, 168, 212, 0.4)',
    requiresDays: 30,
  },
  'galaxy': {
    id: 'galaxy',
    name: 'Galaxy Hearts',
    emoji: '🌌',
    bgGradient: 'from-purple-700 via-blue-800 to-indigo-900',
    cardGradient: 'from-purple-500 to-blue-600',
    accent: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.4)',
    requiresDays: 100,
  },
};

export function isThemeUnlocked(themeId, { streak = 0, daysTogether = 0 } = {}) {
  const theme = THEMES[themeId];
  if (!theme) return false;
  if (theme.unlockedByDefault) return true;
  if (theme.requiresStreak && streak >= theme.requiresStreak) return true;
  if (theme.requiresDays && daysTogether >= theme.requiresDays) return true;
  return false;
}

export function getThemeUnlockText(themeId) {
  const theme = THEMES[themeId];
  if (!theme || theme.unlockedByDefault) return null;
  if (theme.requiresStreak) return `${theme.requiresStreak} day streak`;
  if (theme.requiresDays) return `${theme.requiresDays} days together`;
  return null;
}
