import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playSound, triggerHaptic } from '../lib/sounds';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { useCoupleStore } from '../store/useCoupleStore';
import { useSettingsStore } from '../store/useSettingsStore';

const MOODS = [
  { type: 'miss', emoji: '❤️', label: 'Missing You', color: 'from-pink-400 to-rose-500' },
  { type: 'thinking', emoji: '💭', label: 'Thinking of You', color: 'from-purple-400 to-indigo-500' },
  { type: 'hug', emoji: '🫂', label: 'Need Hug', color: 'from-amber-300 to-orange-400' },
  { type: 'sleepy', emoji: '😴', label: 'Sleepy', color: 'from-indigo-300 to-blue-500' },
  { type: 'angry', emoji: '😤', label: 'Angry', color: 'from-red-400 to-rose-600' },
  { type: 'love_attack', emoji: '💘', label: 'Love Attack', color: 'from-pink-500 to-red-500' },
];

export default function MoodPicker({ isOpen, onClose }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [sending, setSending] = useState(false);
  
  const { user } = useAuthStore();
  const { partner } = useCoupleStore();
  const { sendMissYou } = useNotificationStore();
  const { sound, vibration } = useSettingsStore();

  const handleMoodSelect = async (mood) => {
    if (sending) return;
    
    setSelectedMood(mood.type);
    setSending(true);
    
    if (sound) playSound('sparkle');
    if (vibration) triggerHaptic('gentle');
    
    if (user?.id && partner?.id) {
      await sendMissYou(user.id, partner.id, mood.type);
    }
    
    setTimeout(() => {
      setSending(false);
      setSelectedMood(null);
      onClose();
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-end justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-3xl p-6 w-full max-w-sm mb-4"
          >
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-white/40 rounded-full mx-auto mb-4" />
            
            <h3 className="text-white font-bold text-lg text-center mb-4">
              Send a mood ✨
            </h3>
            
            <div className="grid grid-cols-3 gap-3">
              {MOODS.map((mood, index) => (
                <motion.button
                  key={mood.type}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleMoodSelect(mood)}
                  disabled={sending}
                  className={`
                    flex flex-col items-center justify-center p-4 rounded-2xl
                    bg-gradient-to-br ${mood.color}
                    shadow-lg transition-all duration-200
                    ${selectedMood === mood.type ? 'ring-2 ring-white scale-110' : ''}
                  `}
                >
                  <motion.span
                    animate={selectedMood === mood.type ? { 
                      scale: [1, 1.5, 1],
                      rotate: [0, 15, -15, 0],
                    } : {}}
                    className="text-2xl mb-1"
                  >
                    {mood.emoji}
                  </motion.span>
                  <span className="text-white text-xs font-medium text-center leading-tight">
                    {mood.label}
                  </span>
                </motion.button>
              ))}
            </div>
            
            {/* Send feedback */}
            <AnimatePresence>
              {selectedMood && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-white/80 text-sm text-center mt-4"
                >
                  Sent! 💌
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
