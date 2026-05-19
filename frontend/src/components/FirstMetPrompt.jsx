import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useCoupleStore } from '../store/useCoupleStore';
import { useAuthStore } from '../store/useAuthStore';

const DISMISS_KEY = 'missu-first-met-skipped';

/**
 * One-time prompt to capture the precise moment a couple first met
 * (date AND time, second precision). Writes to:
 *   - couples.anniversary_at   (timestamptz, the truth)
 *   - couples.anniversary_date (date, kept for backward compat / milestones)
 */
export default function FirstMetPrompt() {
  const { couple, isPaired, fetchCouple } = useCoupleStore();
  const { user } = useAuthStore();
  const [show, setShow] = useState(false);
  const [datetime, setDatetime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isPaired || !couple) return;
    if (couple.anniversary_at || couple.anniversary_date) return;
    if (localStorage.getItem(DISMISS_KEY) === couple.id) return;

    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, [isPaired, couple]);

  const handleSave = async () => {
    if (!datetime || !couple?.id) return;
    setSaving(true);
    setError('');

    // datetime-local gives "YYYY-MM-DDTHH:mm" in LOCAL time. Convert to ISO.
    const localDate = new Date(datetime);
    if (isNaN(localDate.getTime())) {
      setError('Please pick a valid date & time');
      setSaving(false);
      return;
    }

    const { error: updErr } = await supabase
      .from('couples')
      .update({
        anniversary_at: localDate.toISOString(),
        anniversary_date: localDate.toISOString().slice(0, 10),
      })
      .eq('id', couple.id);

    if (updErr) {
      console.error('Failed to save anniversary:', updErr);
      setError(updErr.message || 'Save failed');
      setSaving(false);
      return;
    }

    // Refresh couple — use whichever user id we have
    await fetchCouple(user?.id || couple.user1_id);
    setSaving(false);
    setShow(false);
  };

  const handleSkip = () => {
    if (couple?.id) localStorage.setItem(DISMISS_KEY, couple.id);
    setShow(false);
  };

  // Default the picker to "now" so user has something sensible to start from.
  const nowLocal = (() => {
    const d = new Date();
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - off).toISOString().slice(0, 16);
  })();

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
            initial={{ scale: 0.92, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            className="glass-strong rounded-3xl p-6 w-full max-w-sm border border-white/40"
          >
            <motion.div
              animate={{ scale: [1, 1.12, 1], rotate: [0, 6, -6, 0] }}
              transition={{ duration: 3.5, repeat: Infinity }}
              className="text-6xl text-center mb-3"
            >
              💞
            </motion.div>

            <h3 className="text-white font-bold text-xl text-center mb-2">
              When did you two begin?
            </h3>
            <p className="text-white/70 text-sm text-center mb-5 leading-relaxed">
              Pick the exact date and time. We'll count every second together.
            </p>

            <input
              type="datetime-local"
              value={datetime}
              onChange={(e) => setDatetime(e.target.value)}
              max={nowLocal}
              className="w-full bg-white/10 border border-white/25 rounded-2xl px-4 py-3 text-white mb-2 focus:outline-none focus:ring-2 focus:ring-pink-300"
              style={{ colorScheme: 'dark' }}
            />
            <p className="text-white/50 text-[11px] text-center mb-4">
              Use your local time — we'll save the exact moment.
            </p>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSave}
              disabled={!datetime || saving}
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

            {error && (
              <p className="text-rose-200 text-xs text-center mt-2">{error}</p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
