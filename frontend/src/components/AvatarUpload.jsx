import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

/**
 * Compact avatar uploader. Shows current avatar, lets user pick + upload
 * a new one to the `avatars` bucket. Updates users.avatar_url on success.
 */
export default function AvatarUpload({ size = 80, allowChange = true }) {
  const { profile, user, fetchProfile } = useAuthStore();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      // Stable filename overwrites prior avatar; user folder enforced by RLS
      const filename = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filename, file, { contentType: file.type, upsert: true });

      if (uploadError) {
        console.error(uploadError);
        alert('Upload failed. Make sure the avatars bucket exists.');
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filename);
      const cacheBustedUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      await supabase.from('users').update({ avatar_url: cacheBustedUrl }).eq('id', user.id);
      await fetchProfile(user.id);
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
          <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
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
    </div>
  );
}
