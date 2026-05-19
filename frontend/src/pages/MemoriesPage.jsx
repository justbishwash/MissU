import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import ThemeBackground from '../components/ThemeBackground';
import BottomNav from '../components/BottomNav';
import PageHeader from '../components/PageHeader';
import { useAuthStore } from '../store/useAuthStore';
import { useCoupleStore } from '../store/useCoupleStore';
import { useMemoriesStore } from '../store/useMemoriesStore';

function MemoryCard({ memory, onDelete, isOwn, partnerName, ownName, index }) {
  const date = new Date(memory.memory_date || memory.created_at);
  const formatted = date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="glass rounded-2xl p-4 mb-3 relative group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">
            {memory.type === 'image' ? '📸' :
             memory.type === 'voice' ? '🎙️' :
             memory.type === 'anniversary' ? '💍' : '📝'}
          </span>
          <span className="text-white/70 text-xs font-medium">
            {isOwn ? ownName : partnerName} • {formatted}
          </span>
        </div>
        {isOwn && (
          <button
            onClick={() => onDelete(memory.id)}
            className="text-white/30 hover:text-rose-300 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Delete
          </button>
        )}
      </div>

      {memory.title && (
        <p className="text-white font-bold text-sm mb-1">{memory.title}</p>
      )}

      {memory.type === 'image' && memory.media_url && (
        <img
          src={memory.media_url}
          alt={memory.title || 'memory'}
          className="w-full max-h-72 object-cover rounded-xl mb-2"
          loading="lazy"
        />
      )}

      {memory.type === 'voice' && memory.media_url && (
        <audio controls src={memory.media_url} className="w-full mt-1" />
      )}

      {memory.body && (
        <p className="text-white/85 text-sm leading-relaxed whitespace-pre-wrap">
          {memory.body}
        </p>
      )}
    </motion.div>
  );
}

function AddMemorySheet({ open, onClose, onSubmit, uploading }) {
  const [type, setType] = useState('note');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const fileRef = useRef(null);

  // Voice recording
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const reset = () => {
    setType('note');
    setTitle('');
    setBody('');
    setFile(null);
    setPreviewUrl(null);
    setRecording(false);
  };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setType(f.type.startsWith('image') ? 'image' : 'voice');
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([blob], `voice-${Date.now()}.webm`, { type: 'audio/webm' });
        setFile(audioFile);
        setPreviewUrl(URL.createObjectURL(blob));
        setType('voice');
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start();
      setRecording(true);
    } catch (err) {
      console.error('Mic access failed:', err);
      alert('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleSubmit = async () => {
    if (!body && !title && !file) return;
    await onSubmit({ type, title, body, file });
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end justify-center"
        >
          <motion.div
            initial={{ y: 400 }}
            animate={{ y: 0 }}
            exit={{ y: 400 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-t-3xl p-6 w-full max-w-md"
          >
            <div className="w-12 h-1.5 bg-white/40 rounded-full mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg text-center mb-4">
              Save a memory ✨
            </h3>

            {/* Type tabs */}
            <div className="flex gap-2 mb-4">
              {[
                { id: 'note', emoji: '📝', label: 'Note' },
                { id: 'image', emoji: '📸', label: 'Photo' },
                { id: 'voice', emoji: '🎙️', label: 'Voice' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setType(t.id);
                    if (t.id === 'image' && !file) fileRef.current?.click();
                  }}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
                    type === t.id ? 'bg-white text-pink-500' : 'bg-white/10 text-white/70'
                  }`}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>

            {/* File input */}
            <input
              ref={fileRef}
              type="file"
              accept={type === 'image' ? 'image/*' : 'audio/*'}
              onChange={handleFile}
              className="hidden"
            />

            {/* Image preview */}
            {type === 'image' && (
              <div className="mb-3">
                {previewUrl ? (
                  <img src={previewUrl} alt="" className="w-full max-h-48 object-cover rounded-xl" />
                ) : (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="w-full h-32 border-2 border-dashed border-white/30 rounded-xl flex items-center justify-center text-white/60"
                  >
                    + Choose photo
                  </button>
                )}
              </div>
            )}

            {/* Voice */}
            {type === 'voice' && (
              <div className="mb-3">
                {previewUrl ? (
                  <audio controls src={previewUrl} className="w-full" />
                ) : (
                  <button
                    onClick={recording ? stopRecording : startRecording}
                    className={`w-full py-4 rounded-xl font-medium transition-all ${
                      recording
                        ? 'bg-rose-500 text-white animate-pulse'
                        : 'bg-white/10 text-white border border-white/30'
                    }`}
                  >
                    {recording ? '⏹️ Stop recording' : '🎙️ Tap to record'}
                  </button>
                )}
              </div>
            )}

            {/* Title */}
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              maxLength={80}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 mb-2 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm"
            />

            {/* Body */}
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Write something sweet..."
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2.5 text-white placeholder-white/40 mb-4 focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm resize-none"
            />

            {/* Submit */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleSubmit}
              disabled={uploading || (!body && !title && !file)}
              className="w-full bg-white text-pink-500 font-bold py-3 rounded-2xl shadow-lg disabled:opacity-50"
            >
              {uploading ? 'Saving...' : 'Save Memory ❤️'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function MemoriesPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const { couple, partner, isPaired } = useCoupleStore();
  const { memories, fetchMemories, addMemory, deleteMemory, uploadFile, uploading } = useMemoriesStore();

  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (couple?.id) fetchMemories(couple.id);
  }, [couple?.id, fetchMemories]);

  const handleAdd = async ({ type, title, body, file }) => {
    if (!couple?.id || !user?.id) return;

    let mediaUrl = null;
    if (file) {
      const { url, error } = await uploadFile(user.id, file, type);
      if (error) {
        alert('Upload failed. Make sure your `memories` storage bucket exists.');
        return;
      }
      mediaUrl = url;
    }

    await addMemory({
      coupleId: couple.id,
      userId: user.id,
      type,
      title,
      body,
      mediaUrl,
    });
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this memory?')) return;
    await deleteMemory(id);
  };

  return (
    <ThemeBackground>
    <div className="px-5 py-6 pb-28">
      <div className="max-w-md mx-auto">
        <PageHeader
          title="Memories"
          right={
            <button
              onClick={() => setSheetOpen(true)}
              disabled={!isPaired}
              aria-label="Add memory"
              className="bg-white text-pink-500 w-9 h-9 rounded-full font-bold shadow-md disabled:opacity-40 flex items-center justify-center active:scale-95 transition-transform"
            >
              <Plus size={20} strokeWidth={2.6} />
            </button>
          }
        />

        {/* Empty state */}
        {!isPaired ? (
          <div className="text-center py-16">
            <p className="text-5xl mb-3">💔</p>
            <p className="text-white/80 font-medium">Connect with your partner first</p>
            <p className="text-white/50 text-sm mt-1">Memories are private to your couple</p>
          </div>
        ) : memories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <motion.p
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-6xl mb-3"
            >
              📔
            </motion.p>
            <p className="text-white font-bold text-lg">Your scrapbook is empty</p>
            <p className="text-white/60 text-sm mt-1 mb-5">
              Save your first photo, voice note, or sweet thought
            </p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSheetOpen(true)}
              className="bg-white text-pink-500 px-6 py-3 rounded-full font-bold shadow-lg"
            >
              Add first memory ✨
            </motion.button>
          </motion.div>
        ) : (
          <div>
            {memories.map((m, i) => (
              <MemoryCard
                key={m.id}
                memory={m}
                onDelete={handleDelete}
                isOwn={m.created_by === user?.id}
                ownName={profile?.nickname || 'You'}
                partnerName={partner?.nickname || 'Them'}
                index={i}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add sheet */}
      <AddMemorySheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={handleAdd}
        uploading={uploading}
      />

    </div>
    <BottomNav active="memories" />
    </ThemeBackground>
  );
}
