import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useSettingsStore = create(
  persist(
    (set) => ({
      notifications: true,
      locationSharing: true,
      approximateMode: false,
      vibration: true,
      sound: true,
      theme: 'pink-love',

      setNotifications: (val) => set({ notifications: val }),
      setLocationSharing: (val) => set({ locationSharing: val }),
      setApproximateMode: (val) => set({ approximateMode: val }),
      setVibration: (val) => set({ vibration: val }),
      setSound: (val) => set({ sound: val }),
      setTheme: (theme) => set({ theme }),
    }),
    { name: 'missu-settings' }
  )
);
