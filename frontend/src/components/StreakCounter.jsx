import { motion } from 'framer-motion';

export default function StreakCounter({ streak }) {
  const currentStreak = streak?.current_streak || 0;
  const longestStreak = streak?.longest_streak || 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="glass rounded-2xl p-4 flex items-center justify-between"
    >
      <div className="flex items-center gap-3">
        <motion.span
          animate={{ 
            scale: currentStreak > 0 ? [1, 1.2, 1] : 1,
            rotate: currentStreak > 0 ? [0, 5, -5, 0] : 0,
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-3xl"
        >
          🔥
        </motion.span>
        <div>
          <p className="text-white font-bold text-lg">{currentStreak} Day Streak</p>
          <p className="text-white/60 text-xs">Best: {longestStreak} days</p>
        </div>
      </div>
      
      {/* Streak milestones */}
      {currentStreak >= 7 && (
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          className="text-2xl"
        >
          {currentStreak >= 30 ? '💎' : currentStreak >= 14 ? '⭐' : '✨'}
        </motion.div>
      )}
    </motion.div>
  );
}
