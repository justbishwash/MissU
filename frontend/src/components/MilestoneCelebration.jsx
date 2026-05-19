import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeartConfetti from './HeartConfetti';
import { MILESTONE_META, useMilestonesStore } from '../store/useMilestonesStore';
import { useCoupleStore } from '../store/useCoupleStore';
import { playSound, triggerHaptic } from '../lib/sounds';
import { useSettingsStore } from '../store/useSettingsStore';

/**
 * Full-screen celebration screen for unlocked milestones.
 * Listens to milestonesStore.current and plays the sequence.
 */
export default function MilestoneCelebration() {
  const { current, acknowledge, showNext, pending } = useMilestonesStore();
  const { couple } = useCoupleStore();
  const { sound, vibration } = useSettingsStore();
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  const meta = current ? MILESTONE_META[current] : null;

  useEffect(() => {
    if (!current) return;
    if (sound) playSound('sparkle');
    if (vibration) triggerHaptic('heartbeat');
    setConfettiTrigger((t) => t + 1);
  }, [current]); // eslint-disable-line react-hooks/exhaustive-deps

  // When current is dismissed but more pending, show next after a delay
  useEffect(() => {
    if (!current && pending.length > 0) {
      const t = setTimeout(showNext, 600);
      return () => clearTimeout(t);
    }
  }, [current, pending.length, showNext]);

  const handleClose = async () => {
    if (couple?.id && current) {
      await acknowledge(couple.id, current);
    }
  };

  return (
    <AnimatePresence>
      {current && meta && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-center justify-center bg-gradient-to-br from-pink-500 via-purple-500 to-rose-500 animate-gradient"
          style={{ backgroundSize: '200% 200%' }}
        >
          <HeartConfetti trigger={confettiTrigger} intensity={meta.confetti} />

          {/* Glow */}
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute w-[500px] h-[500px] rounded-full blur-3xl bg-yellow-300/40"
          />

          <div className="relative z-10 flex flex-col items-center px-8 text-center max-w-sm">
            {/* Big trophy emoji */}
            <motion.div
              initial={{ scale: 0, rotate: -360 }}
              animate={{
                scale: [0, 1.4, 1],
                rotate: [0, 0, 0],
                y: [0, -10, 0],
              }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="text-9xl mb-6 drop-shadow-2xl"
            >
              {meta.emoji}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-white text-4xl font-black mb-2 drop-shadow-lg"
            >
              {meta.title}
            </motion.h1>

            {/* Body */}
            <motion.p
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-white/90 text-lg mb-8 drop-shadow"
            >
              {meta.body}
            </motion.p>

            {/* Sparkle stars */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="flex gap-3 mb-6 text-2xl"
            >
              {['✨', '💖', '✨'].map((s, i) => (
                <motion.span
                  key={i}
                  animate={{ scale: [1, 1.4, 1], rotate: [0, 360, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                >
                  {s}
                </motion.span>
              ))}
            </motion.div>

            {/* Close */}
            <motion.button
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClose}
              className="bg-white text-pink-500 font-bold px-10 py-4 rounded-full shadow-2xl text-lg"
            >
              Continue ❤️
            </motion.button>

            {pending.length > 1 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                transition={{ delay: 1.2 }}
                className="text-white/70 text-xs mt-4"
              >
                +{pending.length - 1} more milestones to celebrate
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
