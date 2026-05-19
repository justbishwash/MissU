// Centralized mood metadata used by overlay, picker, and inbox

export const MOOD_META = {
  miss: {
    emoji: '❤️',
    label: 'Missing You',
    gradient: 'from-pink-500 via-rose-400 to-pink-300',
    glow: 'rgba(255, 107, 157, 0.6)',
    sound: 'missYou',
    haptic: 'heartbeat',
    overlayTitle: 'They miss you',
    overlayBody: 'is missing you right now ❤️',
  },
  thinking: {
    emoji: '💭',
    label: 'Thinking of You',
    gradient: 'from-purple-500 via-indigo-400 to-purple-300',
    glow: 'rgba(167, 139, 250, 0.6)',
    sound: 'sparkle',
    haptic: 'gentle',
    overlayTitle: 'On their mind',
    overlayBody: 'is thinking about you 💭',
  },
  hug: {
    emoji: '🫂',
    label: 'Need Hug',
    gradient: 'from-amber-400 via-orange-400 to-yellow-300',
    glow: 'rgba(251, 146, 60, 0.6)',
    sound: 'sparkle',
    haptic: 'miss',
    overlayTitle: 'Hug incoming',
    overlayBody: 'wants a hug 🫂',
  },
  sleepy: {
    emoji: '😴',
    label: 'Sleepy',
    gradient: 'from-indigo-500 via-blue-500 to-purple-400',
    glow: 'rgba(99, 102, 241, 0.6)',
    sound: 'receive',
    haptic: 'gentle',
    overlayTitle: 'Sleepy thoughts',
    overlayBody: 'is sleepy and thinking of you 😴',
  },
  angry: {
    emoji: '😤',
    label: 'A bit upset',
    gradient: 'from-red-500 via-rose-500 to-orange-400',
    glow: 'rgba(244, 63, 94, 0.6)',
    sound: 'attention',
    haptic: 'attention',
    overlayTitle: 'Need attention',
    overlayBody: 'could use some love right now 😤',
  },
  love_attack: {
    emoji: '💘',
    label: 'Love Attack',
    gradient: 'from-pink-600 via-red-500 to-pink-400',
    glow: 'rgba(236, 72, 153, 0.7)',
    sound: 'missYou',
    haptic: 'heartbeat',
    overlayTitle: 'LOVE ATTACK!',
    overlayBody: 'is sending an avalanche of love 💘',
  },
  attention: {
    emoji: '🚨',
    label: 'Need Attention',
    gradient: 'from-rose-600 via-red-500 to-orange-500',
    glow: 'rgba(244, 63, 94, 0.7)',
    sound: 'attention',
    haptic: 'attention',
    overlayTitle: 'Needs you NOW',
    overlayBody: 'really needs you right now 🚨',
  },
};

export function getMoodMeta(type) {
  return MOOD_META[type] || MOOD_META.miss;
}
