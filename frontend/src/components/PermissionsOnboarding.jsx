import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, MapPin, Camera, Mic, Check, ChevronRight } from 'lucide-react';
import { useCoupleStore } from '../store/useCoupleStore';
import { useAuthStore } from '../store/useAuthStore';
import { requestNotificationPermission } from '../services/onesignal';

const STORAGE_KEY = 'missu-permissions-onboarded';

/**
 * Unified, iOS-style permissions onboarding.
 *
 * Shows once after a user is signed in. Walks through the four permissions
 * MissU uses (notifications, location, camera, microphone) one at a time,
 * with explanations. Each can be skipped — they're requested again later
 * on-demand at the relevant feature.
 *
 * Why one-at-a-time and not all upfront? Browsers reject simultaneous
 * permission requests and the user can only see one native prompt at a
 * time. This presents context first, then the prompt.
 */
const PERMISSIONS = [
  {
    id: 'notifications',
    Icon: Bell,
    title: 'Notifications',
    body: 'Get notified the moment your person misses you — even when MissU is closed.',
    color: 'from-pink-400 to-rose-500',
  },
  {
    id: 'location',
    Icon: MapPin,
    title: 'Location',
    body: 'See how far apart you are in real time. You can switch to approximate or hidden mode anytime.',
    color: 'from-blue-400 to-indigo-500',
  },
  {
    id: 'camera',
    Icon: Camera,
    title: 'Camera',
    body: "Scan your partner's QR code to pair, or capture a moment for your shared scrapbook.",
    color: 'from-amber-400 to-orange-500',
  },
  {
    id: 'microphone',
    Icon: Mic,
    title: 'Microphone',
    body: 'Record voice notes for your shared scrapbook. Only saved when you tap save.',
    color: 'from-purple-400 to-pink-500',
  },
];

async function checkExisting(id) {
  try {
    if (id === 'notifications') {
      return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
    }
    if (!navigator.permissions?.query) return 'default';
    const map = { location: 'geolocation', camera: 'camera', microphone: 'microphone' };
    const status = await navigator.permissions.query({ name: map[id] });
    // 'granted' | 'denied' | 'prompt'
    return status.state === 'prompt' ? 'default' : status.state;
  } catch {
    return 'default';
  }
}

async function requestPermission(id) {
  try {
    if (id === 'notifications') {
      return await requestNotificationPermission();
    }
    if (id === 'location') {
      return await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve('denied');
        navigator.geolocation.getCurrentPosition(
          () => resolve('granted'),
          () => resolve('denied'),
          { timeout: 10000 }
        );
      });
    }
    if (id === 'camera') {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      return 'granted';
    }
    if (id === 'microphone') {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      return 'granted';
    }
    return 'default';
  } catch {
    return 'denied';
  }
}

export default function PermissionsOnboarding() {
  const { user } = useAuthStore();
  const { isPaired } = useCoupleStore();

  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0); // 0..PERMISSIONS.length (last = done)
  const [statuses, setStatuses] = useState({}); // id -> 'granted'|'denied'|'default'
  const [requesting, setRequesting] = useState(false);

  // Decide whether to show. Trigger AFTER pairing so users have context.
  useEffect(() => {
    if (!user) return;
    if (!isPaired) return; // wait until they've connected, motivation higher
    if (localStorage.getItem(STORAGE_KEY) === '1') return;

    let cancelled = false;
    (async () => {
      // Check current state of each so we can skip already-granted
      const initial = {};
      for (const p of PERMISSIONS) {
        initial[p.id] = await checkExisting(p.id);
      }
      if (cancelled) return;
      setStatuses(initial);

      // If everything's already granted/denied, mark onboarded and skip
      if (PERMISSIONS.every((p) => initial[p.id] !== 'default')) {
        localStorage.setItem(STORAGE_KEY, '1');
        return;
      }

      // Brief delay so home screen settles
      setTimeout(() => setShow(true), 1500);
    })();
    return () => { cancelled = true; };
  }, [user, isPaired]);

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  const handleAllow = async () => {
    if (requesting) return;
    const p = PERMISSIONS[step];
    setRequesting(true);
    const result = await requestPermission(p.id);
    setStatuses((s) => ({ ...s, [p.id]: result }));
    setRequesting(false);

    // Brief pause so the user sees the checkmark, then advance.
    setTimeout(() => {
      if (step + 1 >= PERMISSIONS.length) finish();
      else setStep(step + 1);
    }, 600);
  };

  const handleSkip = () => {
    if (step + 1 >= PERMISSIONS.length) finish();
    else setStep(step + 1);
  };

  const current = PERMISSIONS[step];
  const currentStatus = current ? statuses[current.id] : null;

  return (
    <AnimatePresence>
      {show && current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[58] bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 flex flex-col"
        >
          <div className="max-w-md mx-auto w-full px-6 pt-12 pb-8 flex-1 flex flex-col">
            {/* Step indicator */}
            <div className="flex justify-center gap-1.5 mb-10">
              {PERMISSIONS.map((p, i) => (
                <div
                  key={p.id}
                  className={`h-1 rounded-full transition-all ${
                    i < step
                      ? 'w-6 bg-white'
                      : i === step
                      ? 'w-10 bg-white'
                      : 'w-6 bg-white/30'
                  }`}
                />
              ))}
            </div>

            {/* Card */}
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex-1 flex flex-col items-center text-center pt-8"
            >
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${current.color} flex items-center justify-center shadow-xl mb-6 relative`}
              >
                <current.Icon size={44} strokeWidth={2.2} className="text-white" />
                {currentStatus === 'granted' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-emerald-400 border-4 border-pink-500 flex items-center justify-center"
                  >
                    <Check size={18} strokeWidth={3} className="text-white" />
                  </motion.div>
                )}
              </motion.div>

              <h2 className="text-white text-3xl font-bold mb-3 tracking-tight">
                {current.title}
              </h2>
              <p className="text-white/85 text-base leading-relaxed max-w-sm mb-2">
                {current.body}
              </p>
              <p className="text-white/55 text-xs mt-2">
                Step {step + 1} of {PERMISSIONS.length}
              </p>
            </motion.div>

            {/* Actions */}
            <div className="flex flex-col gap-2 pb-2">
              {currentStatus === 'granted' ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSkip}
                  className="w-full bg-white text-pink-600 font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight size={18} strokeWidth={2.6} />
                </motion.button>
              ) : (
                <>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleAllow}
                    disabled={requesting}
                    className="w-full bg-white text-pink-600 font-bold py-4 rounded-2xl shadow-xl disabled:opacity-60"
                  >
                    {requesting ? 'Asking your browser...' : 'Allow'}
                  </motion.button>
                  <button
                    onClick={handleSkip}
                    className="w-full text-white/75 text-sm py-2.5 hover:text-white transition-colors"
                  >
                    Maybe later
                  </button>
                </>
              )}
            </div>

            {/* Footer */}
            <p className="text-white/40 text-[11px] text-center mt-3 leading-relaxed max-w-xs mx-auto">
              You can change these anytime in Settings or your browser's site permissions.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
