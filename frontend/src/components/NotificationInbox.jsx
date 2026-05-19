import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useReceivedStore } from '../store/useReceivedStore';
import { useAuthStore } from '../store/useAuthStore';
import { useCoupleStore } from '../store/useCoupleStore';
import { getMoodMeta } from '../lib/moodMeta';

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  const hr = Math.floor(diff / 3600000);
  const day = Math.floor(diff / 86400000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  if (hr < 24) return `${hr}h ago`;
  return `${day}d ago`;
}

export default function NotificationInbox() {
  const { inboxOpen, setInboxOpen, inbox, fetchInbox } = useReceivedStore();
  const { user } = useAuthStore();
  const { partner } = useCoupleStore();

  useEffect(() => {
    if (inboxOpen && user?.id) fetchInbox(user.id);
  }, [inboxOpen, user, fetchInbox]);

  return (
    <AnimatePresence>
      {inboxOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setInboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end justify-center"
        >
          <motion.div
            initial={{ y: 600 }}
            animate={{ y: 0 }}
            exit={{ y: 600 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-t-3xl p-5 w-full max-w-md max-h-[80vh] flex flex-col"
          >
            <div className="w-12 h-1.5 bg-white/40 rounded-full mx-auto mb-4 flex-shrink-0" />
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <h3 className="text-white font-bold text-lg">Inbox 💌</h3>
              <button
                onClick={() => setInboxOpen(false)}
                className="text-white/60 text-sm"
              >
                Close
              </button>
            </div>

            {inbox.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <p className="text-5xl mb-3">📭</p>
                <p className="text-white/70 text-sm">No notifications yet</p>
                <p className="text-white/40 text-xs mt-1">Their first miss will appear here</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {inbox.map((n) => {
                  const meta = getMoodMeta(n.type);
                  const isOwn = n.sender_id === user?.id;
                  return (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`glass rounded-2xl p-3 flex items-center gap-3 ${
                        !n.opened && !isOwn ? 'border-2 border-pink-300/40' : ''
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center flex-shrink-0 text-xl`}
                      >
                        {meta.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">
                          {isOwn ? 'You sent' : `${partner?.nickname || 'They'} sent`} {meta.label}
                        </p>
                        <p className="text-white/50 text-xs truncate">{n.message}</p>
                      </div>
                      <div className="text-white/40 text-[10px] flex-shrink-0">
                        {timeAgo(n.sent_at)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
