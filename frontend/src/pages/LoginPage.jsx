import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signInWithOtp, signInWithGoogle, signInAnonymously, createProfile } = useAuthStore();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState('login'); // login, nickname
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signInWithOtp(email);
    setLoading(false);
    if (error) {
      setMessage('Something went wrong. Try again.');
    } else {
      setMessage('✨ Magic link sent! Check your email.');
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    await signInWithGoogle();
    setLoading(false);
  };

  const handleGuest = async () => {
    setLoading(true);
    const { error } = await signInAnonymously();
    setLoading(false);
    if (!error) {
      setStep('nickname');
    }
  };

  const handleNickname = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setLoading(true);
    await createProfile({ nickname: nickname.trim() });
    setLoading(false);
    navigate('/pairing', { replace: true });
  };

  if (step === 'nickname') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500 animate-gradient px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-8 w-full max-w-sm"
        >
          <motion.span
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-5xl block text-center mb-4"
          >
            👋
          </motion.span>
          <h2 className="text-white text-xl font-bold text-center mb-2">What should we call you?</h2>
          <p className="text-white/60 text-sm text-center mb-6">Your partner will see this name</p>
          
          <form onSubmit={handleNickname} className="space-y-4">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Your cute nickname..."
              maxLength={20}
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-300 text-center text-lg"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!nickname.trim() || loading}
              className="w-full bg-white text-pink-500 font-bold py-3.5 rounded-2xl shadow-lg disabled:opacity-50"
            >
              {loading ? '...' : 'Continue ✨'}
            </motion.button>
          </form>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500 animate-gradient px-6">
      {/* Logo */}
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

      {/* Login card */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-strong rounded-3xl p-6 w-full max-w-sm"
      >
        {/* Email OTP */}
        <form onSubmit={handleOtp} className="space-y-3 mb-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email..."
            className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3.5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-300"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!email || loading}
            className="w-full bg-white text-pink-500 font-bold py-3.5 rounded-2xl shadow-lg disabled:opacity-50"
          >
            {loading ? '...' : 'Send Magic Link ✉️'}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-white/50 text-xs">or</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        {/* Google */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleGoogle}
          disabled={loading}
          className="w-full bg-white/10 border border-white/20 text-white font-medium py-3.5 rounded-2xl mb-3 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </motion.button>

        {/* Guest */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleGuest}
          disabled={loading}
          className="w-full text-white/60 font-medium py-3 rounded-2xl text-sm hover:text-white/80 transition-colors"
        >
          Continue as Guest 👻
        </motion.button>

        {/* Message */}
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white/80 text-sm text-center mt-4"
          >
            {message}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}
