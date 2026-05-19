import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePushPermission } from '../hooks/usePushPermission';
import { useCoupleStore } from '../store/useCoupleStore';

/**
 * Elegant first-run modal that asks for notification permission.
 * Only shown when:
 * - Push is supported
 * - User is paired
 * - Permission is 'default' (not yet asked)
 * - User hasn't dismissed it before
 */
export default function NotificationPermissionFlow() {
  const { permission, hasAsked, isSupported, request, dismiss } = usePushPermission();
  const { isPaired } = useCoupleStore();
  const [show, setShow] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!isSupported || !isPaired) return;
    if (permission !== 'default') return;
    if (hasAsked) return;

    // Wait a bit so user sees the home screen first
    const t = setTimeout(() => setShow(true), 2500);
    return () => clearTimeout(t);
  }, [isSupported, isPaired, permission, hasAsked]);

  const handleEnable = async () => {
    setRequesting(true);
    await request();
    setRequesting(false);
    setShow(false);
  };

  const handleNotNow = () => {
    dismiss();
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center p-4 sm:items-center"
        >
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="glass-strong rounded-3xl p-6 w-full max-w-sm border border-white/40"
          >
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                rotate: [0, 8, -8, 0],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="text-6xl text-center mb-3"
            >
              🔔
            </motion.div>

            <h3 className="text-white font-bold text-xl text-center mb-2">
              Don't miss their love
            </h3>

            <p className="text-white/75 text-sm text-center mb-5 leading-relaxed">
              Get notified the moment your person misses you — even when MissU is closed.
              You can turn this off anytime in Settings.
            </p>

            <div className="flex flex-col gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleEnable}
                disabled={requesting}
                className="bg-white text-pink-500 font-bold py-3.5 rounded-2xl shadow-lg disabled:opacity-50"
              >
                {requesting ? 'Asking your browser...' : 'Yes, notify me ❤️'}
              </motion.button>
              <button
                onClick={handleNotNow}
                className="text-white/60 text-sm py-2 hover:text-white/80 transition-colors"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
