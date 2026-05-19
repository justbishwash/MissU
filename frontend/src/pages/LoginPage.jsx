import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '../store/useAuthStore';

export default function LoginPage() {
  const { signInWithOtp } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    const { error: err } = await signInWithOtp(email);
    setLoading(false);

    if (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } else {
      setMessage('✨ Magic link sent! Check your email.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500 animate-gradient px-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
        className="text-6xl mb-2"
      >
        ❤️
      </motion.div>
      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-3xl font-black text-white mb-1"
      >
        MissU
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-white/70 mb-8"
      >
        Closer than distance.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-strong rounded-3xl p-6 w-full max-w-sm"
      >
        <p className="text-white/80 text-sm text-center mb-4">
          Sign in or sign up with your email
        </p>

        <form onSubmit={handleOtp} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!email || loading}
            className="w-full bg-white text-pink-500 font-bold py-3.5 rounded-2xl shadow-lg disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send Magic Link ✉️'}
          </motion.button>
        </form>

        {message && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 rounded-2xl p-3 mt-4 border border-white/20"
          >
            <p className="text-white text-sm text-center font-medium">
              {message}
            </p>
            <p className="text-white/60 text-xs text-center mt-1">
              Tap the link in the email to sign in.
            </p>
          </motion.div>
        )}

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-rose-200 text-sm text-center mt-4"
          >
            {error}
          </motion.p>
        )}

        <p className="text-white/40 text-[11px] text-center mt-5 leading-relaxed">
          By continuing you agree we may store your email and notification settings to deliver MissU.
        </p>
      </motion.div>
    </div>
  );
}
