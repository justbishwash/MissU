import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set, get) => ({
      notifications: true,
      locationSharing: true,
      approximateMode: false,
      vibration: true,
      sound: true,
      theme: 'pink-love',
      mutedMoods: [], // string[] of mood types to silence sound/haptic for

      setNotifications: (val) => set({ notifications: val }),
      setLocationSharing: (val) => set({ locationSharing: val }),
      setApproximateMode: (val) => set({ approximateMode: val }),
      setVibration: (val) => set({ vibration: val }),
      setSound: (val) => set({ sound: val }),
      setTheme: (theme) => set({ theme }),

      toggleMoodMute: (moodType) => {
        const muted = get().mutedMoods || [];
        const next = muted.includes(moodType)
          ? muted.filter((m) => m !== moodType)
          : [...muted, moodType];
        set({ mutedMoods: next });
      },
      isMoodMuted: (moodType) => (get().mutedMoods || []).includes(moodType),
    }),
    { name: 'missu-settings' }
  )
);
