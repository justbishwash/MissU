import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Compact avatar uploader. Shows current avatar, lets user pick + upload
 * a new one to the `avatars` bucket. Updates users.avatar_url on success.
 */
export default function AvatarUpload({ size = 80, allowChange = true }) {
  const { profile, user, setProfile } = useAuthStore();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    setError('');
    try {
      // File too big? (5 MB cap)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image too large (max 5 MB)');
        return;
      }

      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      // Stable filename overwrites prior avatar; user folder enforced by RLS
      const filename = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filename, file, { contentType: file.type, upsert: true });

      if (uploadError) {
        console.error('Avatar upload failed:', uploadError);
        setError(uploadError.message || 'Upload failed');
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename);
      const cacheBustedUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update DB. We deliberately don't chain .select() / return the row,
      // because the post-write SELECT re-runs RLS policies which used to hit
      // a "permission denied for table couples" recursion edge case (now
      // fixed in migration 005, but keeping this minimal write defensive).
      const { error: updateError } = await supabase
        .from('users')
        .update({ avatar_url: cacheBustedUrl })
        .eq('id', user.id);

      if (updateError) {
        console.error('avatar_url update failed:', updateError);
        setError(updateError.message);
        return;
      }

      // Update store directly so UI reflects immediately — don't rely on a
      // re-fetch which can race against the persist middleware re-hydrating
      // a stale value.
      setProfile({ ...(profile || { id: user.id }), avatar_url: cacheBustedUrl });
    } catch (err) {
      console.error(err);
      setError(String(err?.message || err));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block">
      <motion.div
        whileTap={allowChange ? { scale: 0.95 } : {}}
        onClick={() => allowChange && fileRef.current?.click()}
        style={{ width: size, height: size }}
        className={`rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden ${
          allowChange ? 'cursor-pointer' : ''
        } ${uploading ? 'opacity-60 animate-pulse' : ''}`}
      >
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide broken image so the fallback emoji shows through
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : (
          <span style={{ fontSize: size * 0.45 }}>😊</span>
        )}
      </motion.div>

      {allowChange && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 bg-white text-pink-500 w-7 h-7 rounded-full shadow-md flex items-center justify-center text-xs font-bold"
          >
            {uploading ? '…' : '📷'}
          </button>
        </>
      )}

      {error && (
        <p className="text-rose-200 text-[10px] text-center mt-1 max-w-[120px]">
          {error}
        </p>
      )}
    </div>
  );
}
