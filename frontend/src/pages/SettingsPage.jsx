import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCoupleStore } from '../store/useCoupleStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { useThemeStore } from '../store/useThemeStore';
import ThemeBackground from '../components/ThemeBackground';
import BottomNav from '../components/BottomNav';
import AvatarUpload from '../components/AvatarUpload';
import AnniversaryEditor from '../components/AnniversaryEditor';
import NicknameEditor from '../components/NicknameEditor';
import { THEMES, isThemeUnlocked, getThemeUnlockText } from '../lib/themes';
import { MOOD_META } from '../lib/moodMeta';

function ToggleRow({ emoji, label, desc, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <span className="text-lg">{emoji}</span>
        <div>
          <p className="text-white font-medium text-sm">{label}</p>
          {desc && <p className="text-white/40 text-xs">{desc}</p>}
        </div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-12 h-7 rounded-full transition-all duration-300 relative ${
          value ? 'bg-pink-400' : 'bg-white/20'
        }`}
      >
        <motion.div
          animate={{ x: value ? 20 : 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
        />
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();
  const { partner, couple, streak, disconnect, isPaired } = useCoupleStore();
  const {
    notifications, locationSharing, approximateMode, vibration, sound,
    mutedMoods, toggleMoodMute,
    setNotifications, setLocationSharing, setApproximateMode, setVibration, setSound,
  } = useSettingsStore();
  const { activeTheme, setTheme } = useThemeStore();

  const daysTogether = couple?.paired_at
    ? Math.floor((Date.now() - new Date(couple.paired_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const currentStreak = streak?.current_streak || 0;

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleDisconnect = async () => {
    if (window.confirm('Disconnect from your partner? This cannot be undone.')) {
      await disconnect();
    }
  };

  const handleThemeSelect = (themeId) => {
    const result = setTheme(themeId, { streak: currentStreak, daysTogether });
    if (result?.error) {
      alert(`Locked! Reach ${getThemeUnlockText(themeId)} to unlock this theme 🔒`);
    }
  };

  const moodEntries = Object.entries(MOOD_META).filter(([k]) => k !== 'attention');

  return (
    <ThemeBackground>
      <div className="px-6 py-8 pb-24">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-6"
          >
            <button onClick={() => navigate('/home')} className="text-white/60 text-2xl">←</button>
            <h1 className="text-white font-bold text-xl">Settings ⚙️</h1>
            <div className="w-8" />
          </motion.div>

          {/* Profile with avatar upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-4 mb-4"
          >
            <div className="flex items-center gap-4">
              <AvatarUpload size={64} />
              <div className="flex-1 min-w-0">
                <NicknameEditor />
                <p className="text-white/50 text-xs mt-0.5">
                  {isPaired ? `Paired with ${partner?.nickname || 'partner'}` : 'Not paired yet'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Anniversary */}
          {isPaired && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="glass rounded-2xl p-4 mb-4"
            >
              <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Relationship</h3>
              <AnniversaryEditor />
            </motion.div>
          )}

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-4 mb-4"
          >
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Notifications</h3>
            <ToggleRow emoji="🔔" label="Push Notifications" desc="Get notified when missed" value={notifications} onChange={setNotifications} />
            <ToggleRow emoji="📳" label="Vibration" desc="Haptic feedback" value={vibration} onChange={setVibration} />
            <ToggleRow emoji="🔊" label="Sound" desc="Cute notification sounds" value={sound} onChange={setSound} />
          </motion.div>

          {/* Per-mood mute */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass rounded-2xl p-4 mb-4"
          >
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-1">Mute by Mood</h3>
            <p className="text-white/40 text-xs mb-3">Silence sound + haptic for specific moods (overlay still shows)</p>
            <div className="grid grid-cols-3 gap-2">
              {moodEntries.map(([type, meta]) => {
                const muted = (mutedMoods || []).includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleMoodMute(type)}
                    className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                      muted ? 'bg-white/5 opacity-50' : 'bg-white/10'
                    }`}
                  >
                    <span className="text-xl">{meta.emoji}</span>
                    <span className="text-white text-[10px] truncate w-full text-center">
                      {meta.label}
                    </span>
                    <span className="text-white/50 text-[9px]">
                      {muted ? '🔇 muted' : '🔊 on'}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Location */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-4 mb-4"
          >
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Location</h3>
            <ToggleRow emoji="📍" label="Share Location" desc="Show distance to partner" value={locationSharing} onChange={setLocationSharing} />
            <ToggleRow emoji="🌐" label="Approximate Mode" desc="Hide exact location (~1km)" value={approximateMode} onChange={setApproximateMode} />
          </motion.div>

          {/* Theme */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass rounded-2xl p-4 mb-4"
          >
            <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Theme</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(THEMES).map((t) => {
                const unlocked = isThemeUnlocked(t.id, { streak: currentStreak, daysTogether });
                const isActive = activeTheme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleThemeSelect(t.id)}
                    className={`relative flex items-center gap-2 p-2.5 rounded-xl transition-all ${
                      isActive ? 'ring-2 ring-white bg-white/10' : 'bg-white/5'
                    } ${!unlocked ? 'opacity-60' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.bgGradient} flex-shrink-0`} />
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">
                        {t.emoji} {t.name}
                      </p>
                      {!unlocked && (
                        <p className="text-white/50 text-[10px]">🔒 {getThemeUnlockText(t.id)}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Danger zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-4 space-y-3"
          >
            {isPaired && (
              <button
                onClick={handleDisconnect}
                className="w-full text-rose-300 text-sm font-medium py-2 rounded-xl border border-rose-300/30"
              >
                Disconnect Partner 💔
              </button>
            )}
            <button onClick={handleSignOut} className="w-full text-white/50 text-sm py-2">
              Sign Out
            </button>
          </motion.div>
        </div>

      </div>
      <BottomNav active="settings" />
    </ThemeBackground>
  );
}
