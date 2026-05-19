import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function SplashPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuthStore();

  // Hard fallback: never let the splash sit longer than 3.5s.
  // If `loading` somehow stays true (auth init hangs, RLS error, etc), we
  // still navigate so the user isn't trapped.
  useEffect(() => {
    const minDisplayMs = 1500; // let the logo breathe
    const start = Date.now();

    const decide = () => {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, minDisplayMs - elapsed);
      setTimeout(() => {
        const { user: latestUser } = useAuthStore.getState();
        if (latestUser) navigate('/home', { replace: true });
        else navigate('/login', { replace: true });
      }, wait);
    };

    if (!loading) {
      // Auth state already known
      decide();
      return;
    }

    // Wait until loading flips OR 3.5s passes (whichever is first)
    const unsub = useAuthStore.subscribe((s) => {
      if (!s.loading) {
        unsub();
        clearTimeout(hardTimeout);
        decide();
      }
    });

    const hardTimeout = setTimeout(() => {
      unsub();
      decide();
    }, 3500);

    return () => {
      unsub();
      clearTimeout(hardTimeout);
    };
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500 animate-gradient relative overflow-hidden">
      <motion.div
        animate={{ y: [0, -20, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-20 left-10 text-4xl opacity-30"
      >
        💕
      </motion.div>
      <motion.div
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        className="absolute top-40 right-12 text-3xl opacity-25"
      >
        ✨
      </motion.div>
      <motion.div
        animate={{ y: [0, -25, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-32 left-20 text-5xl opacity-20"
      >
        💗
      </motion.div>
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        className="absolute bottom-48 right-16 text-3xl opacity-25"
      >
        💫
      </motion.div>

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        className="text-8xl mb-6"
      >
        ❤️
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-5xl font-black text-white tracking-tight mb-2"
      >
        MissU
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-white/80 text-lg font-light"
      >
        Closer than distance.
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-12"
      >
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
          className="w-3 h-3 bg-white rounded-full mx-auto"
        />
      </motion.div>
    </div>
  );
}
