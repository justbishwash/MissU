import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DISMISS_KEY = 'missu-install-dismissed';
const SHOW_AFTER_MS = 5000;

/**
 * Custom PWA install prompt.
 * - Listens for the `beforeinstallprompt` event on Chromium browsers
 * - For iOS Safari (which never fires that event), shows a "tap share → Add to Home Screen" hint
 * - Respects user dismissal via localStorage so we don't nag
 */
export default function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    // Already installed?
    const standalone = window.matchMedia?.('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    if (standalone) return;

    // iOS Safari path
    const ua = window.navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    if (ios) {
      setIsIOS(true);
      const t = setTimeout(() => setShow(true), SHOW_AFTER_MS);
      return () => clearTimeout(t);
    }

    // Chromium / Android path
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShow(true), SHOW_AFTER_MS);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // If installed mid-session, hide
    const installedHandler = () => {
      setShow(false);
      localStorage.setItem(DISMISS_KEY, '1');
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice?.outcome === 'accepted') {
      localStorage.setItem(DISMISS_KEY, '1');
    }
    setDeferredPrompt(null);
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="fixed left-3 right-3 bottom-20 z-40 mx-auto max-w-md"
        >
          <div className="glass-strong rounded-2xl p-4 shadow-2xl border border-white/30">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-3xl flex-shrink-0"
              >
                📲
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">Install MissU</p>
                <p className="text-white/70 text-xs leading-snug">
                  {isIOS
                    ? 'Tap Share → "Add to Home Screen"'
                    : 'Get it as a real app — opens instantly.'}
                </p>
              </div>
              {!isIOS && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleInstall}
                  className="bg-white text-pink-500 font-bold text-xs px-3 py-2 rounded-xl shadow-md flex-shrink-0"
                >
                  Install
                </motion.button>
              )}
              <button
                onClick={handleDismiss}
                className="text-white/50 hover:text-white/80 text-lg leading-none px-1 flex-shrink-0"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
