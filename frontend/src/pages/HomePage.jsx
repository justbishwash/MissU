import { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MissYouButton from '../components/MissYouButton';
import FloatingHearts from '../components/FloatingHearts';
import MoodPicker from '../components/MoodPicker';
import DistanceCard from '../components/DistanceCard';
import StreakCounter from '../components/StreakCounter';
import EmergencyAttention from '../components/EmergencyAttention';
import ThemeBackground from '../components/ThemeBackground';
import { useAuthStore } from '../store/useAuthStore';
import { useCoupleStore } from '../store/useCoupleStore';
import { useReceivedStore } from '../store/useReceivedStore';
import { useMilestonesStore } from '../store/useMilestonesStore';
import { useRealtime } from '../hooks/useRealtime';
import { usePresence } from '../hooks/usePresence';

const MiniMapCard = lazy(() => import('../components/MiniMapCard'));

export default function HomePage() {
  const navigate = useNavigate();
  const [moodOpen, setMoodOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const { user } = useAuthStore();
  const { partner, couple, streak, isPaired, fetchCouple } = useCoupleStore();
  const { setInboxOpen, inbox } = useReceivedStore();
  const { checkPending, showNext, current: currentMilestone } = useMilestonesStore();

  useRealtime(user?.id);
  const { partnerOnline, partnerTyping } = usePresence({
    coupleId: couple?.id,
    userId: user?.id,
    partnerId: partner?.id,
  });

  // Load couple data on mount
  useEffect(() => {
    if (user?.id) fetchCouple(user.id);
  }, [user, fetchCouple]);

  // Check for milestones whenever streak/days change
  useEffect(() => {
    if (!couple?.id) return;
    let cancelled = false;

    const run = async () => {
      const pending = await checkPending(couple.id);
      if (cancelled) return;
      // Only show if nothing else is currently displayed
      if (pending.length > 0 && !currentMilestone) {
        // Small delay so UI is settled before celebration
        setTimeout(() => showNext(), 1500);
      }
    };
    run();

    return () => { cancelled = true; };
  }, [couple?.id, streak?.current_streak, checkPending, showNext, currentMilestone]);

  const getDaysTogether = () => {
    if (!couple?.paired_at) return 0;
    return Math.floor((Date.now() - new Date(couple.paired_at).getTime()) / (1000 * 60 * 60 * 24));
  };

  const unreadCount = inbox.filter((n) => !n.opened && n.receiver_id === user?.id).length;

  const presenceLabel = partnerTyping
    ? '💬 typing...'
    : partnerOnline
    ? '🌙 Online now'
    : partner?.last_seen
    ? `💫 Active ${timeAgoShort(partner.last_seen)}`
    : '💫 Away';

  return (
    <ThemeBackground>
      <div className="relative overflow-hidden">
        <FloatingHearts intensity={isPaired ? 'medium' : 'low'} />

        <div className="relative z-10 px-6 py-8 pb-24 max-w-md mx-auto min-h-screen flex flex-col">
          {/* Inbox button — top right */}
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setInboxOpen(true)}
            className="absolute top-6 right-6 glass rounded-full w-10 h-10 flex items-center justify-center"
          >
            <span className="text-base">💌</span>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-pink-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border-2 border-white/40"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </motion.button>

          {/* Top section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-5"
          >
            <div className="relative inline-block mb-3">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden"
              >
                {partner?.avatar_url ? (
                  <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{isPaired ? '💕' : '👤'}</span>
                )}
              </motion.div>
              {/* Online dot */}
              {isPaired && partnerOnline && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-400 border-2 border-white shadow-md"
                >
                  <motion.div
                    animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute inset-0 rounded-full bg-green-400"
                  />
                </motion.div>
              )}
            </div>

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

            {isPaired && (
              <motion.div
                key={presenceLabel}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2"
              >
                <span className={`text-xs font-medium ${partnerTyping ? 'text-pink-200' : 'text-white/70'}`}>
                  {presenceLabel}
                </span>
              </motion.div>
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

function timeAgoShort(date) {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return 'now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  return `${day}d ago`;
}
