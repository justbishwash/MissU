import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import QrScanner from 'qr-scanner';
import { useAuthStore } from '../store/useAuthStore';
import { useCoupleStore } from '../store/useCoupleStore';

export default function QRScannerPage() {
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const scannerRef = useRef(null);
  const { user } = useAuthStore();
  const { useInviteCode } = useCoupleStore();

  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(true);
  const [status, setStatus] = useState(''); // 'connecting' | 'success' | ''

  useEffect(() => {
    if (!videoRef.current) return;

    const scanner = new QrScanner(
      videoRef.current,
      async (result) => {
        const text = result?.data || '';
        // Expected format: "missu://pair/123456" or just the 6-digit code
        const match = text.match(/(\d{6})/);
        if (!match) return;

        setScanning(false);
        scanner.stop();
        setStatus('connecting');

        const { error: err } = await useInviteCode(match[1], user.id);
        if (err) {
          setError(typeof err === 'string' ? err : 'Could not connect with this code.');
          setStatus('');
        } else {
          setStatus('success');
          setTimeout(() => navigate('/home', { replace: true }), 1200);
        }
      },
      {
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 4,
      }
    );

    scannerRef.current = scanner;

    scanner.start().catch((err) => {
      setError('Camera access denied. Please enable camera permissions.');
      console.error(err);
    });

    return () => {
      scanner.stop();
      scanner.destroy();
    };
  }, [user, useInviteCode, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <button onClick={() => navigate(-1)} className="text-white text-2xl">←</button>
        <h1 className="text-white font-bold">Scan to Connect</h1>
        <div className="w-8" />
      </div>

      {/* Scanner */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="relative w-full max-w-sm aspect-square rounded-3xl overflow-hidden bg-black/30 border-2 border-white/30">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />

          {/* Scanning frame overlay */}
          {scanning && (
            <>
              <div className="absolute inset-8 border-2 border-white/60 rounded-2xl pointer-events-none" />
              <motion.div
                animate={{ y: [0, 200, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
                className="absolute left-8 right-8 h-0.5 bg-pink-300 shadow-[0_0_20px_rgba(255,107,157,0.8)] pointer-events-none"
              />
              <div className="absolute top-3 left-3 right-3 text-center">
                <p className="text-white text-sm font-medium drop-shadow">Point at your partner's QR</p>
              </div>
            </>
          )}

          {/* Status overlay */}
          {status === 'connecting' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="text-4xl mb-2"
                >
                  ❤️
                </motion.div>
                <p className="text-white">Connecting...</p>
              </div>
            </motion.div>
          )}

          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 bg-black/60 flex items-center justify-center"
            >
              <div className="text-center">
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 0.6, repeat: Infinity }}
                  className="text-6xl mb-2"
                >
                  💕
                </motion.div>
                <p className="text-white font-bold text-lg">Connected!</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-6 text-center">
        {error ? (
          <p className="text-rose-200 text-sm mb-3">{error}</p>
        ) : (
          <p className="text-white/60 text-sm mb-3">Hold steady. We'll detect the code automatically.</p>
        )}
        <button
          onClick={() => navigate('/pairing')}
          className="text-white/70 underline text-sm"
        >
          Enter code manually instead
        </button>
      </div>
    </div>
  );
}
