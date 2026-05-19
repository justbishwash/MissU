import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import ParticleBurst from './ParticleBurst';
import { playSound, triggerHaptic } from '../lib/sounds';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';
import { useCoupleStore } from '../store/useCoupleStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { sendPushNotification } from '../services/onesignal';

export default function MissYouButton() {
  const [pressed, setPressed] = useState(false);
  const [burstTrigger, setBurstTrigger] = useState(0);
  const [sending, setSending] = useState(false);
  
  const { user } = useAuthStore();
  const { partner } = useCoupleStore();
  const { sendMissYou, cooldownActive } = useNotificationStore();
  const { sound, vibration } = useSettingsStore();

  const handlePress = useCallback(async () => {
    if (sending || cooldownActive) return;
    
    setSending(true);
    setPressed(true);
    setBurstTrigger((prev) => prev + 1);
    
    // Haptic + sound immediately for responsiveness
    if (vibration) triggerHaptic('heartbeat');
    if (sound) playSound('missYou');
    
    // Send notification
    if (user?.id && partner?.id) {
      await sendMissYou(user.id, partner.id, 'miss');
      
      // Trigger push notification via OneSignal
      if (partner.onesignal_player_id) {
        await sendPushNotification(
          partner.onesignal_player_id,
          '❤️ Someone misses you',
          `${user.nickname || 'Your person'} misses you badly right now...`,
          { type: 'miss', senderId: user.id }
        );
      }
    }
    
    setTimeout(() => {
      setPressed(false);
      setSending(false);
    }, 1000);
  }, [user, partner, sendMissYou, sending, cooldownActive, sound, vibration]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      {/* Glow ring behind button */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-52 h-52 rounded-full bg-gradient-to-r from-pink-400 to-purple-400 blur-xl opacity-40"
      />
      
      {/* Second glow ring */}
      <motion.div
        animate={{
          scale: [1.1, 1, 1.1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute w-60 h-60 rounded-full bg-gradient-to-r from-rose-300 to-pink-400 blur-2xl opacity-30"
      />

      {/* Main button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        animate={pressed ? {
          scale: [1, 1.15, 0.95, 1.05, 1],
        } : {
          scale: [1, 1.03, 1],
        }}
        transition={pressed ? {
          duration: 0.6,
          ease: 'easeOut',
        } : {
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        onClick={handlePress}
        disabled={sending || cooldownActive}
        className={`
          relative z-10 w-44 h-44 rounded-full
          bg-gradient-to-br from-pink-400 via-rose-400 to-purple-500
          shadow-2xl shadow-pink-400/50
          flex flex-col items-center justify-center
          no-select cursor-pointer
          transition-all duration-300
          ${pressed ? 'animate-glow-pulse' : ''}
          ${cooldownActive ? 'opacity-70' : ''}
          active:shadow-pink-500/70
        `}
      >
        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 to-transparent" />
        
        {/* Heart emoji */}
        <motion.span
          animate={pressed ? { scale: [1, 1.5, 1], rotate: [0, 10, -10, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="text-5xl mb-1 relative z-10"
        >
          ❤️
        </motion.span>
        
        {/* Text */}
        <span className="text-white font-bold text-sm tracking-wide relative z-10">
          Missing You
        </span>
      </motion.button>

      {/* Particle burst */}
      <div className="absolute inset-0 flex items-center justify-center">
        <ParticleBurst trigger={burstTrigger} x={50} y={50} />
      </div>

      {/* Cooldown indicator */}
      {cooldownActive && (
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-pink-400 text-xs mt-4 font-medium"
        >
          Sending love... ✨
        </motion.p>
      )}
    </div>
  );
}
