import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound, triggerHaptic } from '../lib/sounds';
import { dispatchNotification } from '../services/notifications';
import { useCoupleStore } from '../store/useCoupleStore';
import { useSettingsStore } from '../store/useSettingsStore';

export default function EmergencyAttention() {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const { partner } = useCoupleStore();
  const { sound, vibration } = useSettingsStore();

  const handleSend = async () => {
    if (sending || !partner?.id) return;
    setSending(true);

    // Stronger haptic — repeated urgent vibration
    if (vibration && navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200, 100, 400]);
    }
    if (sound) playSound('attention');

    await dispatchNotification({
      receiverId: partner.id,
      type: 'attention',
      urgent: true,
    });

    setSent(true);
    setTimeout(() => {
      setSending(false);
      setSent(false);
      setConfirmOpen(false);
    }, 2000);
  };

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setConfirmOpen(true)}
        className="w-full glass rounded-2xl p-3 flex items-center justify-center gap-2 border border-rose-300/30 hover:border-rose-300/60 transition-colors"
      >
        <motion.span
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          className="text-lg"
        >
          🚨
        </motion.span>
        <span className="text-white/80 text-xs font-medium">Need Attention</span>
      </motion.button>

      {/* Confirm modal */}
      <AnimatePresence>
        {confirmOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
            onClick={() => !sending && setConfirmOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-3xl p-6 w-full max-w-sm border-2 border-rose-300/40"
            >
              {!sent ? (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, -5, 5, 0] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-5xl text-center mb-3"
                  >
                    🚨
                  </motion.div>
                  <h3 className="text-white font-bold text-lg text-center mb-2">
                    Need them right now?
                  </h3>
                  <p className="text-white/60 text-sm text-center mb-5">
                    Your partner will get an urgent notification with stronger vibration.
                    Use this when you really need them.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmOpen(false)}
                      disabled={sending}
                      className="flex-1 bg-white/10 text-white/80 py-3 rounded-2xl font-medium"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleSend}
                      disabled={sending}
                      className="flex-1 bg-gradient-to-r from-rose-500 to-red-500 text-white py-3 rounded-2xl font-bold shadow-lg disabled:opacity-50"
                    >
                      {sending ? 'Sending...' : 'Send 🚨'}
                    </motion.button>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center py-4"
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.6 }}
                    className="text-5xl mb-3"
                  >
                    ❤️
                  </motion.div>
                  <p className="text-white font-bold text-lg">Sent!</p>
                  <p className="text-white/60 text-sm mt-1">They'll feel it.</p>
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
