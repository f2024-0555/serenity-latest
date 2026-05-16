'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { MediaItem } from '@/types';
import { usePlayerStore } from '@/lib/player-store';
import { toggleFavorite } from '@/lib/db';
import { useAuth } from '@/lib/auth-context';
import { AnimatePresence } from 'framer-motion';
import VideoPlayer from './VideoPlayer';

interface Props {
  item: MediaItem;
  queue?: MediaItem[];
  isFavorite?: boolean;
  onFavoriteChange?: () => void;
}

export default function MediaCard({ item, queue = [], isFavorite = false, onFavoriteChange }: Props) {
  const { user } = useAuth();
  const { playMedia, currentMedia, isPlaying } = usePlayerStore();
  const [fav, setFav] = useState(isFavorite);
  const [showVideo, setShowVideo] = useState(false);

  const isCurrentlyPlaying = currentMedia?.id === item.id && isPlaying;

  const handlePlay = () => {
    if (item.type === 'video') {
      setShowVideo(true);
    } else {
      playMedia(item, queue.length > 0 ? queue : [item]);
    }
  };

  const handleFav = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    await toggleFavorite(user.uid, item.id, fav);
    setFav(!fav);
    onFavoriteChange?.();
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        className="media-card group cursor-pointer"
        onClick={handlePlay}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-ink rounded-xl overflow-hidden">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-nebula/40 to-aurora/40 flex items-center justify-center">
              {item.type === 'audio' ? (
                <svg className="w-10 h-10 text-aurora/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-cosmos/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
              )}
            </div>
          )}

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
            <div className={`w-12 h-12 rounded-full bg-white/90 flex items-center justify-center transition-all duration-300 ${isCurrentlyPlaying ? 'opacity-100 scale-100' : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100'}`}>
              {isCurrentlyPlaying ? (
                <svg className="w-5 h-5 text-ink" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-ink ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex gap-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${item.type === 'audio' ? 'bg-aurora/80 text-white' : 'bg-cosmos/80 text-white'}`}>
              {item.type}
            </span>
          </div>

          {/* Duration */}
          <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-lg">
            {formatDuration(item.duration)}
          </div>

          {/* Playing indicator */}
          {isCurrentlyPlaying && (
            <div className="absolute bottom-2 left-2 flex items-end gap-0.5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-1 bg-aurora rounded-full animate-pulse" style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mt-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-medium text-star text-sm truncate">{item.title}</h3>
            <p className="text-xs text-twilight mt-0.5">{item.category}</p>
          </div>
          <button
            onClick={handleFav}
            className="flex-shrink-0 text-dusk hover:text-aurora transition-colors mt-0.5"
          >
            <svg className={`w-4 h-4 ${fav ? 'text-aurora fill-aurora' : ''}`} fill={fav ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showVideo && (
          <VideoPlayer media={item} queue={queue} onClose={() => setShowVideo(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
