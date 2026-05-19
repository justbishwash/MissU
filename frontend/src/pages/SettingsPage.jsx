import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { useCoupleStore } from '../store/useCoupleStore';
import { useSettingsStore } from '../store/useSettingsStore';

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

const THEMES = [
  { id: 'pink-love', name: 'Pink Love', emoji: '🩷', color: 'from-pink-400 to-rose-500' },
  { id: 'midnight', name: 'Midnight', emoji: '🌙', color: 'from-indigo-600 to-purple-800' },
  { id: 'sunset', name: 'Cozy Sunset', emoji: '🌅', color: 'from-orange-400 to-pink-500' },
  { id: 'sakura', name: 'Sakura Dream', emoji: '🌸', color: 'from-pink-300 to-purple-400' },
  { id: 'galaxy', name: 'Galaxy Hearts', emoji: '🌌', color: 'from-purple-600 to-blue-800' },
];

export default function SettingsPage() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuthStore();
  const { partner, disconnect, isPaired } = useCoupleStore();
  const {
    notifications, locationSharing, approximateMode, vibration, sound, theme,
    setNotifications, setLocationSharing, setApproximateMode, setVibration, setSound, setTheme,
  } = useSettingsStore();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const handleDisconnect = async () => {
    if (window.confirm('Disconnect from your partner? This cannot be undone.')) {
      await disconnect();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500 animate-gradient px-6 py-8 pb-24">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <button onClick={() => navigate('/home')} className="text-white/60 text-2xl">←</button>
          <h1 className="text-white font-bold text-xl">Settings ⚙️</h1>
          <div className="w-8" />
        </motion.div>

        {/* Profile section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-4 mb-4"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                <span className="text-xl">😊</span>
              )}
            </div>
            <div>
              <p className="text-white font-bold">{profile?.nickname || 'You'}</p>
              <p className="text-white/50 text-xs">
                {isPaired ? `Paired with ${partner?.nickname || 'partner'}` : 'Not paired yet'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Notification settings */}
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

        {/* Location settings */}
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

        {/* Theme selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-4 mb-4"
        >
          <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider mb-3">Theme</h3>
          <div className="grid grid-cols-5 gap-2">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  theme === t.id ? 'ring-2 ring-white scale-105' : ''
                }`}
              >
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${t.color}`} />
                <span className="text-white/60 text-[9px]">{t.emoji}</span>
              </button>
            ))}
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
          <button
            onClick={handleSignOut}
            className="w-full text-white/50 text-sm py-2"
          >
            Sign Out
          </button>
        </motion.div>
      </div>

      {/* Bottom nav */}
      <motion.nav
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
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
          <span className="text-white/80 text-[10px] font-bold">Settings</span>
        </button>
      </motion.nav>
    </div>
  );
}
