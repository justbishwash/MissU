import { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import MissYouButton from '../components/MissYouButton';
import FloatingHearts from '../components/FloatingHearts';
import MoodPicker from '../components/MoodPicker';
import DistanceCard from '../components/DistanceCard';
import StreakCounter from '../components/StreakCounter';
import EmergencyAttention from '../components/EmergencyAttention';
import PairingCta from '../components/PairingCta';
import RelationshipDuration from '../components/RelationshipDuration';
import ThemeBackground from '../components/ThemeBackground';
import BottomNav from '../components/BottomNav';
import { useAuthStore } from '../store/useAuthStore';
import { useCoupleStore } from '../store/useCoupleStore';
import { useReceivedStore } from '../store/useReceivedStore';
import { useMilestonesStore } from '../store/useMilestonesStore';
import { useRealtime } from '../hooks/useRealtime';
import { usePresence } from '../hooks/usePresence';

const MiniMapCard = lazy(() => import('../components/MiniMapCard'));

export default function HomePage() {
  const [moodOpen, setMoodOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const { user, profile } = useAuthStore();
  const { partner, couple, streak, isPaired, fetchCouple } = useCoupleStore();
  const { setInboxOpen, inbox } = useReceivedStore();
  const { checkPending, showNext, current: currentMilestone } = useMilestonesStore();

  useRealtime(user?.id);
  const { partnerOnline, partnerTyping } = usePresence({
    coupleId: couple?.id,
    userId: user?.id,
    partnerId: partner?.id,
  });

  useEffect(() => {
    if (user?.id) fetchCouple(user.id);
  }, [user, fetchCouple]);

  useEffect(() => {
    if (!couple?.id) return;
    let cancelled = false;
    (async () => {
      const pending = await checkPending(couple.id);
      if (cancelled) return;
      if (pending.length > 0 && !currentMilestone) {
        setTimeout(() => showNext(), 1500);
      }
    })();
    return () => { cancelled = true; };
  }, [couple?.id, streak?.current_streak, checkPending, showNext, currentMilestone]);

  const unreadCount = inbox.filter((n) => !n.opened && n.receiver_id === user?.id).length;
  const anniversary = couple?.anniversary_at || couple?.anniversary_date;

  const presenceLabel = partnerTyping
    ? '💬 typing...'
    : partnerOnline
    ? 'Online now'
    : partner?.last_seen
    ? `Active ${timeAgoShort(partner.last_seen)}`
    : 'Away';

  return (
    <ThemeBackground>
      <div className="relative overflow-hidden min-h-screen">
        <FloatingHearts intensity={isPaired ? 'medium' : 'low'} />

        <div className="relative z-10 px-5 pt-6 pb-28 max-w-md mx-auto min-h-screen flex flex-col">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/50 text-[11px] uppercase tracking-wider font-semibold">
                MissU
              </p>
              <p className="text-white text-lg font-bold">
                Hi, {profile?.nickname || 'love'} 👋
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setInboxOpen(true)}
              className="relative glass rounded-full w-11 h-11 flex items-center justify-center"
              aria-label="Inbox"
            >
              <span className="text-base">💌</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center border-2 border-white/30">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </motion.button>
          </div>

          {!isPaired ? (
            <PairingCta />
          ) : (
            <>
              {/* Partner card */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-strong rounded-3xl p-5 mb-4 border border-white/20"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-white/15 border border-white/30 flex items-center justify-center overflow-hidden">
                      {partner?.avatar_url ? (
                        <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xl">💕</span>
                      )}
                    </div>
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white/30 ${
                        partnerOnline ? 'bg-emerald-400' : 'bg-white/30'
                      }`}
                    >
                      {partnerOnline && (
                        <motion.div
                          animate={{ scale: [1, 2, 1], opacity: [1, 0, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 rounded-full bg-emerald-400"
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate">
                      {partner?.nickname || 'Your person'}
                    </p>
                    <p className={`text-[11px] font-medium ${partnerTyping ? 'text-pink-200' : 'text-white/60'}`}>
                      {presenceLabel}
                    </p>
                  </div>
                </div>

                {/* Live duration ticker */}
                {anniversary ? (
                  <div className="mt-4">
                    <p className="text-white/55 text-[10px] uppercase tracking-wider font-semibold mb-2 text-center">
                      Together since {new Date(anniversary).toLocaleDateString(undefined, { month:'short', day:'numeric', year:'numeric' })}
                    </p>
                    <RelationshipDuration anniversary={anniversary} />
                  </div>
                ) : (
                  <p className="text-white/50 text-xs text-center mt-3 italic">
                    Set your first-met date to count every second ✨
                  </p>
                )}
              </motion.div>

              {/* Distance */}
              <DistanceCard />

              {/* Map toggle */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowMap((v) => !v)}
                className="text-white/55 text-xs text-center my-3 underline"
              >
                {showMap ? 'Hide map' : 'Show love map 🗺️'}
              </motion.button>

              {showMap && (
                <Suspense fallback={
                  <div className="glass rounded-2xl p-6 text-center text-white/60 text-sm mb-3">
                    Loading map...
                  </div>
                }>
                  <div className="mb-3"><MiniMapCard /></div>
                </Suspense>
              )}
            </>
          )}

          {/* Main button */}
          <div className="flex-1 flex items-center justify-center my-4 min-h-[200px]">
            <MissYouButton />
          </div>

          {/* Bottom controls */}
          {isPaired && (
            <div className="space-y-2.5">
              <StreakCounter streak={streak} />

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setMoodOpen(true)}
                className="w-full glass rounded-2xl p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">💭</span>
                  <span className="text-white font-medium text-sm">Send a mood</span>
                </div>
                <span className="text-white/40 text-sm">→</span>
              </motion.button>

              <EmergencyAttention />
            </div>
          )}
        </div>

        <BottomNav active="home" />
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
