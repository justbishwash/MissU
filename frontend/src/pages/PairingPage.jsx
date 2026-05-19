import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuthStore } from '../store/useAuthStore';
import { useCoupleStore } from '../store/useCoupleStore';

export default function PairingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { generateInviteCode, useInviteCode, inviteCode, isPaired } = useCoupleStore();
  
  const [mode, setMode] = useState('share'); // share or enter
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isPaired) {
      navigate('/home', { replace: true });
    }
  }, [isPaired, navigate]);

  useEffect(() => {
    if (user?.id && !inviteCode) {
      generateInviteCode(user.id);
    }
  }, [user, inviteCode, generateInviteCode]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (inputCode.length !== 6) return;
    
    setLoading(true);
    setError('');
    const { error: err } = await useInviteCode(inputCode, user.id);
    setLoading(false);
    
    if (err) {
      setError(typeof err === 'string' ? err : 'Invalid code. Try again.');
    }
  };

  const qrData = inviteCode ? `missu://pair/${inviteCode}` : '';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500 animate-gradient px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <span className="text-5xl block mb-2">💑</span>
        <h1 className="text-2xl font-bold text-white">Connect with your person</h1>
        <p className="text-white/60 text-sm mt-1">Share code or scan to pair ❤️</p>
      </motion.div>

      {/* Mode toggle */}
      <div className="glass rounded-full p-1 flex gap-1 mb-6">
        <button
          onClick={() => setMode('share')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'share' ? 'bg-white text-pink-500' : 'text-white/70'
          }`}
        >
          Share Code
        </button>
        <button
          onClick={() => setMode('enter')}
          className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
            mode === 'enter' ? 'bg-white text-pink-500' : 'text-white/70'
          }`}
        >
          Enter Code
        </button>
      </div>

      {/* Content */}
      <motion.div
        key={mode}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="glass-strong rounded-3xl p-6 w-full max-w-sm"
      >
        {mode === 'share' ? (
          <div className="flex flex-col items-center">
            {/* QR Code */}
            <div className="bg-white rounded-2xl p-4 mb-4">
              <QRCodeSVG 
                value={qrData || 'loading...'} 
                size={180}
                level="M"
                fgColor="#ff6b9d"
              />
            </div>
            
            {/* Invite code display */}
            <p className="text-white/60 text-xs mb-2">Or share this code:</p>
            <motion.div
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-white/10 border border-white/20 rounded-2xl px-6 py-3"
            >
              <span className="text-white text-3xl font-mono tracking-[0.5em] font-bold">
                {inviteCode || '------'}
              </span>
            </motion.div>
            
            <p className="text-white/50 text-xs mt-4 text-center">
              Send this to your partner. Code expires in 24h.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-white text-center mb-4 font-medium">
              Enter your partner's 6-digit code
            </p>
            
            <form onSubmit={handleJoin} className="space-y-4">
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-4 text-white text-center text-3xl font-mono tracking-[0.4em] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
              
              <motion.button
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={inputCode.length !== 6 || loading}
                className="w-full bg-white text-pink-500 font-bold py-3.5 rounded-2xl shadow-lg disabled:opacity-50"
              >
                {loading ? 'Connecting...' : 'Connect ❤️'}
              </motion.button>
            </form>
            
            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-rose-200 text-sm text-center mt-3"
              >
                {error}
              </motion.p>
            )}
          </div>
        )}
      </motion.div>

      {/* Skip for demo */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={() => navigate('/home', { replace: true })}
        className="text-white/40 text-sm mt-6 hover:text-white/60 transition-colors"
      >
        Skip for now (demo mode)
      </motion.button>
    </div>
  );
}
