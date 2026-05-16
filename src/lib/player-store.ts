import { create } from 'zustand';
import { MediaItem, PlayerState } from '@/types';

interface PlayerStore extends PlayerState {
  setCurrentMedia: (media: MediaItem) => void;
  setQueue: (queue: MediaItem[]) => void;
  addToQueue: (media: MediaItem) => void;
  togglePlay: () => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setPlaybackSpeed: (speed: number) => void;
  nextTrack: () => void;
  prevTrack: () => void;
  closePlayer: () => void;
  playMedia: (media: MediaItem, queue?: MediaItem[]) => void;
}

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  currentMedia: null,
  queue: [],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.8,
  isMuted: false,
  shuffle: false,
  repeat: 'none',
  playbackSpeed: 1,
  showPlayer: false,

  playMedia: (media, queue = []) => {
    set({
      currentMedia: media,
      queue: queue.length > 0 ? queue : [media],
      isPlaying: true,
      showPlayer: true,
      currentTime: 0,
    });
  },

  setCurrentMedia: (media) => set({ currentMedia: media, currentTime: 0 }),
  setQueue: (queue) => set({ queue }),
  addToQueue: (media) => set((s) => ({ queue: [...s.queue, media] })),
  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setVolume: (volume) => set({ volume, isMuted: volume === 0 }),
  toggleMute: () => set((s) => ({ isMuted: !s.isMuted })),
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  cycleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === 'none' ? 'all' : s.repeat === 'all' ? 'one' : 'none',
    })),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),

  nextTrack: () => {
    const { queue, currentMedia, shuffle } = get();
    if (!currentMedia || queue.length === 0) return;
    const currentIndex = queue.findIndex((m) => m.id === currentMedia.id);
    let nextIndex: number;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = (currentIndex + 1) % queue.length;
    }
    set({ currentMedia: queue[nextIndex], currentTime: 0, isPlaying: true });
  },

  prevTrack: () => {
    const { queue, currentMedia, currentTime } = get();
    if (!currentMedia) return;
    if (currentTime > 3) {
      set({ currentTime: 0 });
      return;
    }
    const currentIndex = queue.findIndex((m) => m.id === currentMedia.id);
    const prevIndex = currentIndex === 0 ? queue.length - 1 : currentIndex - 1;
    set({ currentMedia: queue[prevIndex], currentTime: 0, isPlaying: true });
  },

  closePlayer: () => set({ showPlayer: false, isPlaying: false, currentMedia: null }),
}));
