import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

/**
 * Visible call-to-action shown on the home page when the user is signed in
 * but not yet paired. Replaces the previous dead-end "Waiting for your
 * person..." text.
 */
export default function PairingCta() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="glass-strong rounded-3xl p-5 mb-4 border border-white/30"
    >
      <div className="flex flex-col items-center text-center">
        <motion.div
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="text-5xl mb-2"
        >
          💑
        </motion.div>
        <h3 className="text-white font-bold text-lg mb-1">Connect with your person</h3>
        <p className="text-white/70 text-xs mb-4 leading-relaxed max-w-[260px]">
          MissU comes alive when you're paired. Share your code or scan theirs to begin.
        </p>

        <div className="flex flex-col w-full gap-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/pairing')}
            className="w-full bg-white text-pink-500 font-bold py-3 rounded-2xl shadow-lg text-sm"
          >
            Get Your Code ✨
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/scan')}
            className="w-full bg-white/10 border border-white/30 text-white font-medium py-3 rounded-2xl text-sm"
          >
            📷 Scan Their Code
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}
