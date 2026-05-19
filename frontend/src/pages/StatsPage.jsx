import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import GlassCard from '../components/GlassCard';
import ThemeBackground from '../components/ThemeBackground';
import BottomNav from '../components/BottomNav';
import { useAuthStore } from '../store/useAuthStore';
import { useCoupleStore } from '../store/useCoupleStore';
import { useNotificationStore } from '../store/useNotificationStore';

function AnimatedCounter({ value, label, emoji, delay = 0 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) return;

    const timer = setInterval(() => {
      start += Math.ceil(end / 30);
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, 40);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass rounded-2xl p-4 flex flex-col items-center justify-center"
    >
      <span className="text-2xl mb-1">{emoji}</span>
      <motion.span
        key={count}
        className="text-white text-2xl font-bold"
      >
        {count}
      </motion.span>
      <span className="text-white/50 text-xs mt-1 text-center">{label}</span>
    </motion.div>
  );
}

export default function StatsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { couple, streak } = useCoupleStore();
  const { getStats } = useNotificationStore();
  const [stats, setStats] = useState({ totalSent: 0, totalReceived: 0 });

  useEffect(() => {
    if (user?.id) {
      getStats(user.id).then(setStats);
    }
  }, [user, getStats]);

  // Days together: prefer the user-set anniversary; fall back to paired_at.
  const getDaysTogether = () => {
    const anchor = couple?.anniversary_at || couple?.anniversary_date || couple?.paired_at;
    if (!anchor) return 0;
    return Math.floor((Date.now() - new Date(anchor).getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <ThemeBackground>
    <div className="px-6 py-8 pb-28">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <button onClick={() => navigate('/home')} className="text-white/60 text-2xl">←</button>
          <h1 className="text-white font-bold text-xl">Love Stats 📊</h1>
          <div className="w-8" />
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <AnimatedCounter value={stats.totalSent} label="Miss You's Sent" emoji="❤️" delay={0.1} />
          <AnimatedCounter value={stats.totalReceived} label="Miss You's Received" emoji="💌" delay={0.2} />
          <AnimatedCounter value={getDaysTogether()} label="Days Together" emoji="📅" delay={0.3} />
          <AnimatedCounter value={streak?.longest_streak || 0} label="Longest Streak" emoji="🔥" delay={0.4} />
        </div>

        {/* Current streak card */}
        <GlassCard delay={0.5}>
          <div className="text-center">
            <motion.span
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl block mb-2"
            >
              🔥
            </motion.span>
            <p className="text-white text-3xl font-bold">{streak?.current_streak || 0}</p>
            <p className="text-white/60 text-sm">Current Love Streak</p>
          </div>
        </GlassCard>

        {/* Mood breakdown (placeholder) */}
        <GlassCard className="mt-4" delay={0.6}>
          <h3 className="text-white font-bold text-sm mb-3">Favorite Moods 💭</h3>
          <div className="space-y-2">
            {[
              { emoji: '❤️', label: 'Missing You', pct: 65 },
              { emoji: '🫂', label: 'Need Hug', pct: 20 },
              { emoji: '💘', label: 'Love Attack', pct: 15 },
            ].map((mood, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-lg">{mood.emoji}</span>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-white/70 mb-1">
                    <span>{mood.label}</span>
                    <span>{mood.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${mood.pct}%` }}
                      transition={{ delay: 0.8 + i * 0.1, duration: 0.8 }}
                      className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Love timeline */}
        <GlassCard className="mt-4" delay={0.7}>
          <h3 className="text-white font-bold text-sm mb-3">Love Timeline 💕</h3>
          <div className="flex justify-between text-center">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
              <div key={day} className="flex flex-col items-center gap-1">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${20 + Math.random() * 40}px` }}
                  transition={{ delay: 1 + i * 0.05 }}
                  className="w-4 bg-gradient-to-t from-pink-400 to-purple-400 rounded-full"
                />
                <span className="text-white/50 text-[9px]">{day}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

    </div>
    <BottomNav active="stats" />
    </ThemeBackground>
  );
}
