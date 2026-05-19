import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

// Triggers a heart-shaped confetti burst whenever `trigger` increments
export default function HeartConfetti({ trigger, intensity = 'normal' }) {
  const lastTrigger = useRef(0);

  useEffect(() => {
    if (!trigger || trigger === lastTrigger.current) return;
    lastTrigger.current = trigger;

    const colors = ['#ff6b9d', '#fda4af', '#c084fc', '#f9a8d4', '#fff'];
    const count = intensity === 'mega' ? 200 : intensity === 'big' ? 120 : 60;

    // Fire from 3 origins for a fuller spread
    const origins = [
      { x: 0.2, y: 0.7 },
      { x: 0.5, y: 0.6 },
      { x: 0.8, y: 0.7 },
    ];

    origins.forEach((origin, i) => {
      setTimeout(() => {
        confetti({
          particleCount: Math.floor(count / origins.length),
          spread: 70,
          origin,
          colors,
          ticks: 200,
          shapes: ['circle'],
          gravity: 0.7,
          scalar: 1.1,
          startVelocity: 35,
          drift: (i - 1) * 0.5,
        });
      }, i * 80);
    });

    if (intensity === 'mega') {
      // Side cannons for the mega case
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
          colors,
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
          colors,
        });
      }, 250);
    }
  }, [trigger, intensity]);

  return null;
}
