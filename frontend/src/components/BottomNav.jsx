import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, MessageCircleHeart, BarChart3, Settings as SettingsIcon } from 'lucide-react';

const ITEMS = [
  { id: 'home',     Icon: Home,                label: 'Home',     to: '/home' },
  { id: 'memories', Icon: MessageCircleHeart,  label: 'Memories', to: '/memories' },
  { id: 'stats',    Icon: BarChart3,           label: 'Stats',    to: '/stats' },
  { id: 'settings', Icon: SettingsIcon,        label: 'Settings', to: '/settings' },
];

/**
 * Shared bottom nav. Pass `active` ∈ {'home','memories','stats','settings'}.
 */
export default function BottomNav({ active }) {
  const navigate = useNavigate();

  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="fixed bottom-0 left-0 right-0 z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-md mx-auto px-3 pb-2">
        <div className="glass-strong rounded-2xl border border-white/15 px-2 py-2 flex justify-around items-center shadow-xl">
          {ITEMS.map(({ id, Icon, label, to }) => {
            const isActive = active === id;
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.88 }}
                onClick={() => navigate(to)}
                className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive ? 'bg-white/15' : ''
                }`}
                aria-label={label}
              >
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.4 : 2}
                  className={isActive ? 'text-white' : 'text-white/65'}
                  fill={isActive ? 'rgba(255,255,255,0.15)' : 'none'}
                />
                <span className={`text-[10px] font-medium ${isActive ? 'text-white' : 'text-white/55'}`}>
                  {label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
