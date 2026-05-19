import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { THEMES, isThemeUnlocked } from '../lib/themes';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      activeTheme: 'pink-love',

      setTheme: (themeId, { streak = 0, daysTogether = 0 } = {}) => {
        if (!isThemeUnlocked(themeId, { streak, daysTogether })) {
          return { error: 'Theme locked' };
        }
        set({ activeTheme: themeId });
        return { ok: true };
      },

      getTheme: () => THEMES[get().activeTheme] || THEMES['pink-love'],
    }),
    { name: 'missu-theme' }
  )
);
