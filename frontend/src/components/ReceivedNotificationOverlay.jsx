import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeartConfetti from './HeartConfetti';
import { getMoodMeta } from '../lib/moodMeta';
import { playSound, triggerHaptic } from '../lib/sounds';
import { useReceivedStore } from '../store/useReceivedStore';
import { useAuthStore } from '../store/useAuthStore';
import { useCoupleStore } from '../store/useCoupleStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { dispatchNotification } from '../services/notifications';

/**
 * Full-screen "viral moment" when a notification is received in-app.
 * Mood-aware gradient, big emoji, sender name, confetti, quick-reply buttons.
 */
export default function ReceivedNotificationOverlay() {
  const { current, dismiss, markRead } = useReceivedStore();
  const { profile } = useAuthStore();
  const { partner } = useCoupleStore();
  const { sound, vibration, mutedMoods = [] } = useSettingsStore();

  const [confettiTrigger, setConfettiTrigger] = useState(0);
  const [replying, setReplying] = useState(false);

  const meta = current ? getMoodMeta(current.type) : null;
  const senderName = partner?.nickname || 'Your person';

  useEffect(() => {
    if (!current) return;

    // Respect per-mood mutes (still show, but no sound/haptic)
    const muted = mutedMoods.includes(current.type);
    if (sound && !muted) playSound(meta.sound);
    if (vibration && !muted) triggerHaptic(meta.haptic);
    setConfettiTrigger((t) => t + 1);

    // Auto-mark as read once shown
    if (!current.opened) markRead(current.id);
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleReplyMiss = async () => {
    if (replying || !partner?.id) return;
    setReplying(true);
    await dispatchNotification({ receiverId: partner.id, type: 'miss' });
    setTimeout(() => {
      setReplying(false);
      dismiss();
    }, 600);
  };

  const handleReplyHug = async () => {
    if (replying || !partner?.id) return;
    setReplying(true);
    await dispatchNotification({ receiverId: partner.id, type: 'hug' });
    setTimeout(() => {
      setReplying(false);
      dismiss();
    }, 600);
  };

  return (
    <AnimatePresence>
      {current && meta && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[60] flex items-center justify-center"
        >
          {/* Mood-aware gradient backdrop */}
          <motion.div
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} animate-gradient`}
            style={{ backgroundSize: '200% 200%' }}
          />

          {/* Glow halo */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="absolute w-[500px] h-[500px] rounded-full blur-3xl"
            style={{ background: meta.glow }}
          />

          {/* Confetti */}
          <HeartConfetti
            trigger={confettiTrigger}
            intensity={current.type === 'love_attack' ? 'mega' : 'big'}
          />

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center px-8 text-center max-w-sm">
            {/* Sender avatar */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 12 }}
              className="w-20 h-20 rounded-full bg-white/20 border-2 border-white/40 mb-4 flex items-center justify-center overflow-hidden shadow-xl"
            >
              {partner?.avatar_url ? (
                <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl">💕</span>
              )}
            </motion.div>

            {/* Big emoji */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{
                scale: [0, 1.5, 1],
                rotate: [0, -10, 10, -5, 5, 0],
              }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="text-9xl mb-4 drop-shadow-2xl"
            >
              {meta.emoji}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-white text-3xl font-black mb-1 drop-shadow-lg"
            >
              {meta.overlayTitle}
            </motion.h1>

            {/* Body */}
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white/90 text-lg mb-8 drop-shadow"
            >
              <span className="font-bold">{senderName}</span>
              <br />
              {meta.overlayBody}
            </motion.p>

            {/* Quick-reply buttons */}
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col gap-3 w-full"
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleReplyMiss}
                disabled={replying}
                className="bg-white text-pink-500 font-bold py-4 rounded-2xl shadow-2xl text-lg disabled:opacity-50"
              >
                {replying ? 'Sending...' : 'Miss You Too ❤️'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleReplyHug}
                disabled={replying}
                className="bg-white/20 backdrop-blur text-white font-medium py-3 rounded-2xl border border-white/30 disabled:opacity-50"
              >
                Send Hug 🫂
              </motion.button>
              <button
                onClick={dismiss}
                className="text-white/70 text-sm py-2"
              >
                Close
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
