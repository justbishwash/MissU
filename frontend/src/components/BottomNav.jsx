import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const ITEMS = [
  { id: 'home',     icon: '🏠', label: 'Home',     to: '/home' },
  { id: 'memories', icon: '💌', label: 'Memories', to: '/memories' },
  { id: 'stats',    icon: '📊', label: 'Stats',    to: '/stats' },
  { id: 'settings', icon: '⚙️', label: 'Settings', to: '/settings' },
];

/**
 * Shared bottom navigation. Pass the `active` prop matching one of
 * 'home' | 'memories' | 'stats' | 'settings'.
 */
export default function BottomNav({ active }) {
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="fixed bottom-0 left-0 right-0 z-30"
    >
      <div className="max-w-md mx-auto px-3 pb-2">
        <div className="glass-strong rounded-2xl border border-white/15 px-2 py-2 flex justify-around items-center shadow-xl">
          {ITEMS.map((item) => {
            const isActive = active === item.id;
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate(item.to)}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive ? 'bg-white/15' : ''
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-white/55'}`}>
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
