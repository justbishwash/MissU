import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useCoupleStore } from '../store/useCoupleStore';
import { useAuthStore } from '../store/useAuthStore';

function toLocalInputValue(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const off = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - off).toISOString().slice(0, 16);
}

export default function AnniversaryEditor() {
  const { couple, fetchCouple } = useCoupleStore();
  const { user } = useAuthStore();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(() =>
    toLocalInputValue(couple?.anniversary_at || couple?.anniversary_date)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!couple) return null;

  const handleOpen = () => {
    setValue(toLocalInputValue(couple.anniversary_at || couple.anniversary_date));
    setError('');
    setOpen(true);
  };

  const handleSave = async () => {
    if (!value) return;
    const localDate = new Date(value);
    if (isNaN(localDate.getTime())) {
      setError('Invalid date / time');
      return;
    }

    setSaving(true);
    setError('');

    const { error: updErr } = await supabase
      .from('couples')
      .update({
        anniversary_at: localDate.toISOString(),
        anniversary_date: localDate.toISOString().slice(0, 10),
      })
      .eq('id', couple.id);

    if (updErr) {
      setError(updErr.message || 'Save failed');
      setSaving(false);
      return;
    }

    await fetchCouple(user?.id || couple.user1_id);
    setSaving(false);
    setOpen(false);
  };

  const formatted = (couple.anniversary_at || couple.anniversary_date)
    ? new Date(couple.anniversary_at || couple.anniversary_date).toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit',
      })
    : 'Not set';

  const nowLocal = (() => {
    const d = new Date();
    const off = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - off).toISOString().slice(0, 16);
  })();

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center justify-between w-full py-3 group"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">💍</span>
          <div className="text-left">
            <p className="text-white font-medium text-sm">Anniversary</p>
            <p className="text-white/40 text-xs">{formatted}</p>
          </div>
        </div>
        <span className="text-white/40 text-xs group-hover:text-white/60">Edit →</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-3xl p-6 w-full max-w-sm border border-white/30"
            >
              <span className="text-4xl block text-center mb-2">💍</span>
              <h3 className="text-white font-bold text-lg text-center mb-1">
                When did it begin?
              </h3>
              <p className="text-white/60 text-sm text-center mb-5">
                Pick the exact date and time
              </p>

              <input
                type="datetime-local"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                max={nowLocal}
                className="w-full bg-white/10 border border-white/25 rounded-2xl px-4 py-3 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-pink-300"
                style={{ colorScheme: 'dark' }}
              />

              <div className="flex gap-2">
                <button
                  onClick={() => setOpen(false)}
                  className="flex-1 bg-white/10 text-white/80 py-3 rounded-2xl font-medium"
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSave}
                  disabled={!value || saving}
                  className="flex-1 bg-white text-pink-500 py-3 rounded-2xl font-bold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save 💍'}
                </motion.button>
              </div>

              {error && (
                <p className="text-rose-200 text-xs text-center mt-3">{error}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
