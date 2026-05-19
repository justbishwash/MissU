import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'missu-push-permission-asked';

/**
 * Manages Web Push permission state.
 * - permission: 'default' | 'granted' | 'denied'
 * - hasAsked: whether we've shown the modal at least once
 * - request(): triggers the native prompt
 * - dismiss(): mark as asked without prompting (skip-for-now)
 */
export function usePushPermission() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [hasAsked, setHasAsked] = useState(
    () => localStorage.getItem(STORAGE_KEY) === '1'
  );

  useEffect(() => {
    if (typeof Notification === 'undefined') return;

    // Periodically check in case user changed it from browser settings
    const id = setInterval(() => {
      if (Notification.permission !== permission) {
        setPermission(Notification.permission);
      }
    }, 5000);
    return () => clearInterval(id);
  }, [permission]);

  const request = useCallback(async () => {
    if (typeof Notification === 'undefined') return 'denied';
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      localStorage.setItem(STORAGE_KEY, '1');
      setHasAsked(true);
      return result;
    } catch {
      return 'denied';
    }
  }, []);

  const dismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, '1');
    setHasAsked(true);
  }, []);

  return {
    permission,
    hasAsked,
    isSupported: typeof Notification !== 'undefined',
    request,
    dismiss,
  };
}
