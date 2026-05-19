import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MissYouButton from '../components/MissYouButton';
import FloatingHearts from '../components/FloatingHearts';
import MoodPicker from '../components/MoodPicker';
import DistanceCard from '../components/DistanceCard';
import StreakCounter from '../components/StreakCounter';
import PresenceIndicator from '../components/PresenceIndicator';
import { useAuthStore } from '../store/useAuthStore';
import { useCoupleStore } from '../store/useCoupleStore';
import { useRealtime } from '../hooks/useRealtime';

export default function HomePage() {
  const navigate = useNavigate();
  const [moodOpen, setMoodOpen] = useState(false);
  const [heartBurst, setHeartBurst] = useState(false);
  
  const { user, profile } = useAuthStore();
  const { partner, couple, streak, isPaired, fetchCouple } = useCoupleStore();

  // Initialize realtime subscriptions
  useRealtime(user?.id);

  useEffect(() => {
    if (user?.id) {
      fetchCouple(user.id);
    }
  }, [user, fetchCouple]);

  // Calculate days together
  const getDaysTogether = () => {
    if (!couple?.paired_at) return 0;
    const diff = Date.now() - new Date(couple.paired_at).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500 animate-gradient" />
      
      {/* Floating hearts background */}
      <FloatingHearts intensity={isPaired ? 'medium' : 'low'} burst={heartBurst} />

      {/* Content */}
      <div className="relative z-10 px-6 py-8 pb-24 max-w-md mx-auto min-h-screen flex flex-col">
        
        {/* Top section - Partner info */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          {/* Partner avatar */}
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 mx-auto mb-3 flex items-center justify-center overflow-hidden"
          >
            {partner?.avatar_url ? (
              <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl">
                {isPaired ? '💕' : '👤'}
              </span>
            )}
          </motion.div>
          
          {/* Partner name & status */}
          <h2 className="text-white font-bold text-lg">
            {isPaired ? (
              <>❤️ Connected with {partner?.nickname || 'Your Person'}</>
            ) : (
              <>Waiting for your person...</>
            )}
          </h2>
          
          {isPaired && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-white/60 text-sm mt-1"
            >
              Together for {getDaysTogether()} days ✨
            </motion.p>
          )}
          
          {/* Presence indicator */}
          {partner && (
            <div className="mt-2 flex justify-center">
              <PresenceIndicator partner={partner} />
            </div>
          )}
        </motion.div>

        {/* Distance card */}
        {isPaired && (
          <div className="mb-6">
            <DistanceCard />
          </div>
        )}

        {/* Main button - CENTER */}
        <div className="flex-1 flex items-center justify-center">
          <MissYouButton />
        </div>

        {/* Bottom section - Streak + Mood */}
        <div className="space-y-3 mt-6">
          {/* Streak */}
          <StreakCounter streak={streak} />
          
          {/* Mood button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setMoodOpen(true)}
            className="w-full glass rounded-2xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">💭</span>
              <span className="text-white font-medium text-sm">Send a mood</span>
            </div>
            <span className="text-white/40">→</span>
          </motion.button>

          {/* Emergency attention button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setHeartBurst(true);
              setTimeout(() => setHeartBurst(false), 100);
            }}
            className="w-full glass rounded-2xl p-3 flex items-center justify-center gap-2 border border-rose-300/30"
          >
            <span className="text-lg">🚨</span>
            <span className="text-white/70 text-xs font-medium">Need Attention</span>
          </motion.button>
        </div>

        {/* Bottom nav */}
        <motion.nav
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="fixed bottom-0 left-0 right-0 glass-strong border-t border-white/10 px-6 py-3 flex justify-around items-center"
        >
          <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-1">
            <span className="text-xl">🏠</span>
            <span className="text-white/60 text-[10px]">Home</span>
          </button>
          <button onClick={() => navigate('/stats')} className="flex flex-col items-center gap-1">
            <span className="text-xl">📊</span>
            <span className="text-white/60 text-[10px]">Stats</span>
          </button>
          <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-1">
            <span className="text-xl">⚙️</span>
            <span className="text-white/60 text-[10px]">Settings</span>
          </button>
        </motion.nav>
      </div>

      {/* Mood picker overlay */}
      <MoodPicker isOpen={moodOpen} onClose={() => setMoodOpen(false)} />
    </div>
  );
}
