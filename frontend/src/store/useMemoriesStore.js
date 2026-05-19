import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useMemoriesStore = create((set, get) => ({
  memories: [],
  loading: false,
  uploading: false,

  fetchMemories: async (coupleId) => {
    if (!coupleId) return;
    set({ loading: true });
    const { data, error } = await supabase
      .from('memories')
      .select('*')
      .eq('couple_id', coupleId)
      .order('memory_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (!error) set({ memories: data || [] });
    set({ loading: false });
    return { data, error };
  },

  uploadFile: async (userId, file, kind = 'image') => {
    set({ uploading: true });
    try {
      const ext = file.name?.split('.').pop() || (kind === 'voice' ? 'webm' : 'jpg');
      const filename = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('memories')
        .upload(filename, file, { contentType: file.type });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('memories')
        .getPublicUrl(filename);

      return { url: urlData.publicUrl };
    } catch (err) {
      console.error('Upload failed:', err);
      return { error: err };
    } finally {
      set({ uploading: false });
    }
  },

  addMemory: async ({ coupleId, userId, type, title, body, mediaUrl, memoryDate }) => {
    const { data, error } = await supabase
      .from('memories')
      .insert({
        couple_id: coupleId,
        created_by: userId,
        type,
        title: title || null,
        body: body || null,
        media_url: mediaUrl || null,
        memory_date: memoryDate || new Date().toISOString().slice(0, 10),
      })
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ memories: [data, ...state.memories] }));
    }
    return { data, error };
  },

  deleteMemory: async (memoryId) => {
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', memoryId);

    if (!error) {
      set((state) => ({
        memories: state.memories.filter((m) => m.id !== memoryId),
      }));
    }
    return { error };
  },
}));
