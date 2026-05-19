import { motion } from 'framer-motion';
import { calculateDistance, getDistanceMessage } from '../lib/distance';
import { useGeolocation } from '../hooks/useGeolocation';
import { useCoupleStore } from '../store/useCoupleStore';

export default function DistanceCard() {
  const { position } = useGeolocation();
  const { partner } = useCoupleStore();
  
  let distanceKm = null;
  
  if (position && partner?.latitude && partner?.longitude) {
    distanceKm = calculateDistance(
      position.latitude,
      position.longitude,
      partner.latitude,
      partner.longitude
    );
  }

  const { emoji, message, state } = getDistanceMessage(distanceKm);
  
  const stateGradients = {
    'very-close': 'from-pink-500/30 to-rose-400/30',
    'nearby': 'from-pink-400/25 to-purple-400/25',
    'medium': 'from-purple-400/20 to-indigo-400/20',
    'far': 'from-indigo-400/20 to-blue-400/20',
    'very-far': 'from-blue-400/20 to-purple-400/20',
    'unknown': 'from-pink-300/15 to-purple-300/15',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`glass rounded-2xl p-4 bg-gradient-to-r ${stateGradients[state] || stateGradients.unknown}`}
    >
      <div className="flex items-center gap-3">
        <motion.span
          animate={state === 'very-close' ? { 
            scale: [1, 1.2, 1],
          } : {}}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-2xl"
        >
          {emoji}
        </motion.span>
        <div>
          <p className="text-white font-medium text-sm">{message}</p>
          {distanceKm !== null && (
            <p className="text-white/50 text-xs mt-0.5">
              {distanceKm < 1 
                ? `${Math.round(distanceKm * 1000)}m` 
                : `${Math.round(distanceKm)} km`
              }
            </p>
          )}
        </div>
      </div>
      
      {/* Heartbeat line for very close */}
      {state === 'very-close' && (
        <motion.div
          className="mt-2 h-0.5 bg-gradient-to-r from-transparent via-pink-400 to-transparent rounded-full"
          animate={{ opacity: [0.3, 1, 0.3], scaleX: [0.8, 1, 0.8] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
