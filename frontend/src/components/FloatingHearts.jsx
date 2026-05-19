import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HEART_EMOJIS = ['❤️', '💕', '💗', '💖', '💝', '✨', '🩷'];

export default function FloatingHearts({ intensity = 'medium', burst = false }) {
  const [hearts, setHearts] = useState([]);

  const count = intensity === 'high' ? 8 : intensity === 'medium' ? 5 : 3;
  const interval = intensity === 'high' ? 800 : intensity === 'medium' ? 1500 : 3000;

  useEffect(() => {
    const timer = setInterval(() => {
      const newHeart = {
        id: Date.now() + Math.random(),
        emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
        x: Math.random() * 100,
        size: 14 + Math.random() * 20,
        duration: 3 + Math.random() * 3,
      };
      setHearts((prev) => [...prev.slice(-count), newHeart]);
    }, interval);

    return () => clearInterval(timer);
  }, [count, interval]);

  // Burst effect - spawn many hearts at once
  useEffect(() => {
    if (burst) {
      const burstHearts = Array.from({ length: 15 }, (_, i) => ({
        id: Date.now() + i + Math.random(),
        emoji: HEART_EMOJIS[Math.floor(Math.random() * HEART_EMOJIS.length)],
        x: 30 + Math.random() * 40,
        size: 16 + Math.random() * 24,
        duration: 2 + Math.random() * 2,
      }));
      setHearts((prev) => [...prev, ...burstHearts]);
    }
  }, [burst]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <AnimatePresence>
        {hearts.map((heart) => (
          <motion.div
            key={heart.id}
            initial={{ 
              y: '100vh', 
              x: `${heart.x}vw`, 
              opacity: 0.8,
              scale: 0.5,
            }}
            animate={{ 
              y: '-10vh', 
              opacity: 0,
              scale: 1,
              rotate: Math.random() > 0.5 ? 20 : -20,
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: heart.duration, 
              ease: 'easeOut',
            }}
            onAnimationComplete={() => {
              setHearts((prev) => prev.filter((h) => h.id !== heart.id));
            }}
            className="absolute"
            style={{ fontSize: heart.size }}
          >
            {heart.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
