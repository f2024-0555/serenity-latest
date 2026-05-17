'use client';
import { useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { usePlayerStore } from '@/lib/player-store';
import { useAuth } from '@/lib/auth-context';
import { saveProgress, incrementPlayCount } from '@/lib/db';

export default function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user } = useAuth();
  const {
    currentMedia, isPlaying, currentTime, duration, volume, isMuted,
    shuffle, repeat, playbackSpeed,
    setIsPlaying, setCurrentTime, setDuration, setVolume,
    togglePlay, toggleMute, toggleShuffle, cycleRepeat, setPlaybackSpeed,
    nextTrack, prevTrack, closePlayer,
  } = usePlayerStore();

  const queue = usePlayerStore((s) => s.queue);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentMedia) return;
    audio.src = currentMedia.url;
    audio.load();
    if (isPlaying) audio.play().catch(() => {});
    incrementPlayCount(currentMedia.id);
  }, [currentMedia]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  const handleTimeUpdate = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrentTime(audio.currentTime);
    if (currentMedia && user && Math.floor(audio.currentTime) % 15 === 0) {
      saveProgress(user.uid, currentMedia.id, audio.currentTime, audio.currentTime >= audio.duration - 5);
    }
  }, [currentMedia, user, setCurrentTime]);

  const handleEnded = useCallback(() => {
    if (repeat === 'one') audioRef.current?.play();
    else nextTrack();
  }, [repeat, nextTrack]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    setCurrentTime(t);
    if (audioRef.current) audioRef.current.currentTime = t;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!currentMedia) return null;

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      exit={{ y: 100 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-dusk/40"
      style={{ background: 'rgba(7,7,15,0.97)' }}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onEnded={handleEnded}
      />

      {/* Progress bar */}
      <input
        type="range"
        min={0}
        max={duration || 100}
        value={currentTime}
        onChange={handleSeek}
        className="w-full h-1 cursor-pointer"
        style={{
          background: `linear-gradient(to right, #a78bfa ${progress}%, #3d3d5c ${progress}%)`,
        }}
      />

      <div className="flex items-center gap-3 px-4 py-3">

        {/* Thumbnail + Track info */}
        <div className="flex items-center gap-3 w-1/4 min-w-0">
          <div className="relative w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden">
            {currentMedia.thumbnailUrl ? (
              <>
                <img
                  src={currentMedia.thumbnailUrl}
                  alt={currentMedia.title}
                  className="w-full h-full object-cover"
                />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="flex items-end gap-0.5">
                      {[1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="w-0.5 bg-aurora rounded-full animate-pulse"
                          style={{
                            height: `${4 + i * 2}px`,
                            animationDelay: `${i * 0.15}s`,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-nebula to-aurora flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                </svg>
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-star truncate">{currentMedia.title}</p>
            <p className="text-xs text-twilight mt-0.5">{currentMedia.category}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 flex items-center justify-center gap-3">
          <button onClick={toggleShuffle} className={`p-1.5 rounded-lg transition-colors hidden sm:block ${shuffle ? 'text-aurora' : 'text-dusk hover:text-moon'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5" />
            </svg>
          </button>
          <button onClick={prevTrack} className="text-moon hover:text-star transition-colors p-1.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
            </svg>
          </button>
          <button
            onClick={togglePlay}
            className="w-10 h-10 rounded-full bg-aurora flex items-center justify-center hover:bg-aurora-dark transition-colors shadow-lg shadow-aurora/30"
          >
            {isPlaying ? (
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button onClick={nextTrack} className="text-moon hover:text-star transition-colors p-1.5">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
            </svg>
          </button>
          <button onClick={cycleRepeat} className={`p-1.5 rounded-lg transition-colors hidden sm:block ${repeat !== 'none' ? 'text-aurora' : 'text-dusk hover:text-moon'}`}>
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
            </svg>
          </button>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2 w-1/4 justify-end">
          <span className="text-xs text-twilight hidden sm:block whitespace-nowrap">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="bg-ink border border-dusk rounded-lg text-xs text-moon px-2 py-1 focus:outline-none focus:border-aurora hidden md:block"
          >
            {speeds.map((s) => <option key={s} value={s}>{s}×</option>)}
          </select>
          <div className="hidden sm:flex items-center gap-1">
            <button onClick={toggleMute} className="text-dusk hover:text-moon transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMuted || volume === 0 ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                )}
              </svg>
            </button>
            <input
              type="range" min={0} max={1} step={0.01}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-16"
              style={{
                background: `linear-gradient(to right, #a78bfa ${(isMuted ? 0 : volume) * 100}%, #3d3d5c ${(isMuted ? 0 : volume) * 100}%)`,
              }}
            />
          </div>
          <button onClick={closePlayer} className="text-dusk hover:text-star transition-colors p-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}