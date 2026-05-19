import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const PARTICLES = ['✨', '💫', '⭐', '🩷', '💗', '💖'];

export default function ParticleBurst({ trigger, x = 50, y = 50 }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (trigger) {
      const newParticles = Array.from({ length: 12 }, (_, i) => ({
        id: Date.now() + i,
        emoji: PARTICLES[Math.floor(Math.random() * PARTICLES.length)],
        angle: (i * 30) + Math.random() * 20,
        distance: 60 + Math.random() * 80,
        size: 12 + Math.random() * 16,
      }));
      setParticles(newParticles);

      setTimeout(() => setParticles([]), 1200);
    }
  }, [trigger]);

  return (
    <AnimatePresence>
      {particles.map((particle) => {
        const radian = (particle.angle * Math.PI) / 180;
        const targetX = Math.cos(radian) * particle.distance;
        const targetY = Math.sin(radian) * particle.distance;

        return (
          <motion.span
            key={particle.id}
            initial={{ 
              opacity: 1, 
              scale: 0,
              x: 0, 
              y: 0,
            }}
            animate={{ 
              opacity: 0, 
              scale: 1.5,
              x: targetX, 
              y: targetY,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute pointer-events-none"
            style={{ 
              fontSize: particle.size,
              left: `${x}%`,
              top: `${y}%`,
            }}
          >
            {particle.emoji}
          </motion.span>
        );
      })}
    </AnimatePresence>
  );
}
