import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Inline nickname display + edit. Tap the nickname to edit it.
 * Saves directly to public.users.nickname and updates the store.
 */
export default function NicknameEditor() {
  const { profile, user, setProfile } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(profile?.nickname || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    const trimmed = value.trim().slice(0, 20);
    if (!trimmed || trimmed === profile?.nickname) {
      setEditing(false);
      return;
    }
    if (!user?.id) return;

    setSaving(true);
    setError('');

    const { error: updErr } = await supabase
      .from('users')
      .update({ nickname: trimmed })
      .eq('id', user.id);

    setSaving(false);

    if (updErr) {
      console.error(updErr);
      setError(updErr.message || 'Save failed');
      return;
    }

    setProfile({ ...(profile || { id: user.id }), nickname: trimmed });
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => {
          setValue(profile?.nickname || '');
          setEditing(true);
        }}
        className="text-left group"
      >
        <p className="text-white font-bold flex items-center gap-1.5">
          {profile?.nickname || 'Tap to set name'}
          <span className="text-white/40 text-[10px] group-hover:text-white/70">✏️</span>
        </p>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') setEditing(false);
        }}
        maxLength={20}
        placeholder="Your name"
        className="bg-white/10 border border-white/30 rounded-lg px-2 py-1 text-white text-sm w-32 focus:outline-none focus:ring-1 focus:ring-pink-300"
      />
      <button
        onClick={handleSave}
        disabled={saving}
        className="text-pink-200 text-sm font-bold disabled:opacity-50 px-1"
      >
        {saving ? '…' : '✓'}
      </button>
      <button
        onClick={() => setEditing(false)}
        className="text-white/50 text-sm px-1"
      >
        ✕
      </button>
      <AnimatePresence>
        {error && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-rose-200 text-[10px]"
          >
            {error}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
