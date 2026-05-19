import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useCoupleStore } from '../store/useCoupleStore';

const DISMISS_KEY = 'missu-first-met-skipped';

/**
 * Shown ONCE after a couple is paired, prompting them to set the day they
 * first met. Saves to couples.anniversary_date which feeds the days_X
 * milestones.
 *
 * Skippable — sets a localStorage flag so we don't nag forever, but the
 * user can still set it later via Settings → Anniversary.
 */
export default function FirstMetPrompt() {
  const { couple, isPaired, fetchCouple } = useCoupleStore();
  const [show, setShow] = useState(false);
  const [date, setDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isPaired || !couple) return;
    if (couple.anniversary_date) return; // already set
    if (localStorage.getItem(DISMISS_KEY) === couple.id) return;

    // Brief delay so the home screen settles first
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, [isPaired, couple]);

  const handleSave = async () => {
    if (!date || !couple?.id) return;
    setSaving(true);

    const { error } = await supabase
      .from('couples')
      .update({ anniversary_date: date })
      .eq('id', couple.id);

    setSaving(false);

    if (error) {
      console.error('Failed to save anniversary:', error);
      return;
    }

    // Refresh couple in store
    await fetchCouple(couple.user1_id);
    setShow(false);
  };

  const handleSkip = () => {
    if (couple?.id) localStorage.setItem(DISMISS_KEY, couple.id);
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[55] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.9, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="glass-strong rounded-3xl p-6 w-full max-w-sm border border-white/40"
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1], rotate: [0, 8, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="text-6xl text-center mb-3"
            >
              💞
            </motion.div>

            <h3 className="text-white font-bold text-xl text-center mb-2">
              When did you first meet?
            </h3>
            <p className="text-white/70 text-sm text-center mb-5 leading-relaxed">
              We'll celebrate your monthiversaries and anniversary together ✨
            </p>

            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-pink-300"
              style={{ colorScheme: 'dark' }}
            />

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={!date || saving}
              className="w-full bg-white text-pink-500 font-bold py-3.5 rounded-2xl shadow-lg disabled:opacity-50 mb-2"
            >
              {saving ? 'Saving...' : 'Save 💞'}
            </motion.button>

            <button
              onClick={handleSkip}
              className="w-full text-white/60 text-sm py-2 hover:text-white/80 transition-colors"
            >
              I'll add it later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
