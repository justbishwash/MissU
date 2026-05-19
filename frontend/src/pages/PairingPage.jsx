import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Camera } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useAuthStore } from '../store/useAuthStore';
import { useCoupleStore } from '../store/useCoupleStore';

export default function PairingPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { generateInviteCode, useInviteCode, inviteCode, isPaired } = useCoupleStore();

  const [mode, setMode] = useState('share'); // share | enter
  const [inputCode, setInputCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [genError, setGenError] = useState('');
  const [genLoading, setGenLoading] = useState(false);

  useEffect(() => {
    if (isPaired) navigate('/home', { replace: true });
  }, [isPaired, navigate]);

  useEffect(() => {
    if (!user?.id || inviteCode) return;
    setGenLoading(true);
    setGenError('');
    generateInviteCode(user.id)
      .then((res) => res?.error && setGenError(res.error))
      .catch((e) => setGenError(e?.message || 'Could not create invite code'))
      .finally(() => setGenLoading(false));
  }, [user, inviteCode, generateInviteCode]);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (inputCode.length !== 6 || !user?.id) return;

    setLoading(true);
    setError('');
    const { error: err } = await useInviteCode(inputCode, user.id);
    setLoading(false);

    if (err) setError(typeof err === 'string' ? err : 'Invalid code. Try again.');
  };

  const qrData = inviteCode ? `missu://pair/${inviteCode}` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500 animate-gradient">
      <div className="max-w-md mx-auto px-5 pt-6 pb-12 flex flex-col">
        <PageHeader title="Connect with your person" />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-5"
        >
          <span className="text-4xl block mb-1">💑</span>
          <p className="text-white/70 text-sm">Share your code, or enter theirs</p>
        </motion.div>

        {/* Mode toggle */}
        <div className="glass rounded-full p-1 flex gap-1 mb-5 self-center">
          <button
            onClick={() => setMode('share')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              mode === 'share' ? 'bg-white text-pink-500 shadow' : 'text-white/75'
            }`}
          >
            Share
          </button>
          <button
            onClick={() => setMode('enter')}
            className={`px-5 py-2 rounded-full text-xs font-semibold transition-all ${
              mode === 'enter' ? 'bg-white text-pink-500 shadow' : 'text-white/75'
            }`}
          >
            Enter
          </button>
          <button
            onClick={() => navigate('/scan')}
            className="px-4 py-2 rounded-full text-xs font-semibold text-white/75 hover:text-white transition-all flex items-center gap-1"
          >
            <Camera size={14} strokeWidth={2.4} />
            Scan
          </button>
        </div>

        {/* Content */}
        <motion.div
          key={mode}
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="glass-strong rounded-3xl p-6 w-full border border-white/20"
        >
          {mode === 'share' ? (
            <div className="flex flex-col items-center">
              <div className="bg-white rounded-2xl p-4 mb-4 relative">
                <QRCodeSVG
                  value={qrData || 'missu-loading'}
                  size={180}
                  level="M"
                  fgColor={inviteCode ? '#ff6b9d' : '#fde2eb'}
                />
                {(genLoading || !inviteCode) && !genError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/85 rounded-2xl">
                    <span className="text-pink-500 text-sm font-medium">Generating...</span>
                  </div>
                )}
              </div>

              <p className="text-white/60 text-xs mb-2">Or share this code:</p>
              <motion.div
                animate={inviteCode ? { scale: [1, 1.02, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
                className="bg-white/10 border border-white/20 rounded-2xl px-6 py-3"
              >
                <span className="text-white text-3xl font-mono tracking-[0.5em] font-bold tabular-nums">
                  {inviteCode || '------'}
                </span>
              </motion.div>

              {genError ? (
                <div className="mt-4 text-center">
                  <p className="text-rose-200 text-xs mb-2">Couldn't create code: {genError}</p>
                  <button
                    onClick={() => {
                      setGenError('');
                      setGenLoading(true);
                      generateInviteCode(user.id)
                        .then((r) => r?.error && setGenError(r.error))
                        .finally(() => setGenLoading(false));
                    }}
                    className="text-white text-xs underline"
                  >
                    Try again
                  </button>
                </div>
              ) : (
                <p className="text-white/55 text-xs mt-4 text-center">
                  Send this to your partner. Code expires in 24h.
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-white text-center mb-4 font-medium">
                Enter your partner's 6-digit code
              </p>

              <form onSubmit={handleJoin} className="space-y-4">
                <input
                  type="text"
                  inputMode="numeric"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full bg-white/10 border border-white/25 rounded-2xl px-4 py-4 text-white text-center text-3xl font-mono tracking-[0.4em] placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-300 tabular-nums"
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
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-rose-200 text-sm text-center mt-3"
                >
                  {error}
                </motion.p>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
