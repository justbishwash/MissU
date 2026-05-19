import { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MissYouButton from '../components/MissYouButton';
import FloatingHearts from '../components/FloatingHearts';
import MoodPicker from '../components/MoodPicker';
import DistanceCard from '../components/DistanceCard';
import StreakCounter from '../components/StreakCounter';
import PresenceIndicator from '../components/PresenceIndicator';
import EmergencyAttention from '../components/EmergencyAttention';
import ThemeBackground from '../components/ThemeBackground';
import { useAuthStore } from '../store/useAuthStore';
import { useCoupleStore } from '../store/useCoupleStore';
import { useRealtime } from '../hooks/useRealtime';

// Lazy-load Leaflet only when user opens the map
const MiniMapCard = lazy(() => import('../components/MiniMapCard'));

export default function HomePage() {
  const navigate = useNavigate();
  const [moodOpen, setMoodOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const { user } = useAuthStore();
  const { partner, couple, streak, isPaired, fetchCouple } = useCoupleStore();

  useRealtime(user?.id);

  useEffect(() => {
    if (user?.id) fetchCouple(user.id);
  }, [user, fetchCouple]);

  const getDaysTogether = () => {
    if (!couple?.paired_at) return 0;
    const diff = Date.now() - new Date(couple.paired_at).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <ThemeBackground>
      <div className="relative overflow-hidden">
        <FloatingHearts intensity={isPaired ? 'medium' : 'low'} />

        <div className="relative z-10 px-6 py-8 pb-24 max-w-md mx-auto min-h-screen flex flex-col">
          {/* Top section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-5"
          >
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 mx-auto mb-3 flex items-center justify-center overflow-hidden"
            >
              {partner?.avatar_url ? (
                <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">{isPaired ? '💕' : '👤'}</span>
              )}
            </motion.div>

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

            {partner && (
              <div className="mt-2 flex justify-center">
                <PresenceIndicator partner={partner} />
              </div>
            )}
          </motion.div>

          {/* Distance */}
          {isPaired && (
            <div className="mb-3">
              <DistanceCard />
            </div>
          )}

          {/* Map toggle */}
          {isPaired && (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowMap((v) => !v)}
              className="text-white/60 text-xs text-center mb-3 underline"
            >
              {showMap ? 'Hide map' : 'Show love map 🗺️'}
            </motion.button>
          )}

          {showMap && isPaired && (
            <div className="mb-4">
              <Suspense fallback={
                <div className="glass rounded-2xl p-6 text-center text-white/60 text-sm">
                  Loading map...
                </div>
              }>
                <MiniMapCard />
              </Suspense>
            </div>
          )}

          {/* Main button */}
          <div className="flex-1 flex items-center justify-center">
            <MissYouButton />
          </div>

          {/* Bottom controls */}
          <div className="space-y-3 mt-6">
            <StreakCounter streak={streak} />

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

            {isPaired && <EmergencyAttention />}
          </div>

          {/* Bottom nav */}
          <motion.nav
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="fixed bottom-0 left-0 right-0 glass-strong border-t border-white/10 px-4 py-3 flex justify-around items-center"
          >
            <button onClick={() => navigate('/home')} className="flex flex-col items-center gap-1">
              <span className="text-xl">🏠</span>
              <span className="text-white/80 text-[10px] font-bold">Home</span>
            </button>
            <button onClick={() => navigate('/memories')} className="flex flex-col items-center gap-1">
              <span className="text-xl">💌</span>
              <span className="text-white/60 text-[10px]">Memories</span>
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

        <MoodPicker isOpen={moodOpen} onClose={() => setMoodOpen(false)} />
      </div>
    </ThemeBackground>
  );
}
