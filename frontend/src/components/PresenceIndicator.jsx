import { motion } from 'framer-motion';

export default function PresenceIndicator({ partner }) {
  if (!partner) return null;

  const isOnline = partner.is_online;
  const lastSeen = partner.last_seen ? new Date(partner.last_seen) : null;
  
  const getPresenceText = () => {
    if (isOnline) return '🌙 Online now';
    if (!lastSeen) return '💫 Away';
    
    const diff = Date.now() - lastSeen.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 5) return '✨ Just here';
    if (minutes < 60) return `💭 Active ${minutes}m ago`;
    if (hours < 24) return `🌙 ${hours}h ago`;
    return '💫 Away';
  };

  const getBatteryIcon = () => {
    if (!partner.battery_level) return null;
    if (partner.battery_level < 20) return '🔋';
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2"
    >
      {/* Online dot */}
      <div className="relative">
        <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-400'}`} />
        {isOnline && (
          <motion.div
            animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-400"
          />
        )}
      </div>
      
      <span className="text-white/70 text-xs font-medium">
        {getPresenceText()}
      </span>
      
      {getBatteryIcon() && (
        <span className="text-xs">{getBatteryIcon()} Low battery</span>
      )}
    </motion.div>
  );
}
