import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useCoupleStore } from '../store/useCoupleStore';

export default function AnniversaryEditor() {
  const { couple, fetchCouple } = useCoupleStore();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(couple?.anniversary_date || '');
  const [saving, setSaving] = useState(false);

  if (!couple) return null;

  const handleSave = async () => {
    if (!date) return;
    setSaving(true);
    await supabase
      .from('couples')
      .update({ anniversary_date: date })
      .eq('id', couple.id);
    // Refetch via either user1_id or user2_id (we don't have user here, but couple has paired users)
    await fetchCouple(couple.user1_id);
    setSaving(false);
    setOpen(false);
  };

  const formatted = couple.anniversary_date
    ? new Date(couple.anniversary_date).toLocaleDateString(undefined, {
        month: 'long', day: 'numeric', year: 'numeric',
      })
    : 'Not set';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
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
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong rounded-3xl p-6 w-full max-w-sm"
            >
              <span className="text-4xl block text-center mb-3">💍</span>
              <h3 className="text-white font-bold text-lg text-center mb-1">
                When did it begin?
              </h3>
              <p className="text-white/60 text-sm text-center mb-5">
                Pick the date you became official
              </p>

              <input
                type="date"
                value={date || ''}
                onChange={(e) => setDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white mb-4 focus:outline-none focus:ring-2 focus:ring-pink-300"
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
                  disabled={!date || saving}
                  className="flex-1 bg-white text-pink-500 py-3 rounded-2xl font-bold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save 💍'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
