'use client';
import { useEffect, useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const [showFullPlayer, setShowFullPlayer] = useState(false);

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

  const skip = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = Math.min(Math.max(audio.currentTime + seconds, 0), duration);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (!currentMedia) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
        onEnded={handleEnded}
      />

      {/* Full Screen Player */}
      <AnimatePresence>
        {showFullPlayer && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ background: 'linear-gradient(180deg, #0d0d1a 0%, #07070f 100%)' }}
          >
            {/* Blurred background from thumbnail */}
            {currentMedia.thumbnailUrl && (
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `url(${currentMedia.thumbnailUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(60px)',
                  transform: 'scale(1.2)',
                }}
              />
            )}

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-6 pt-12 pb-4">
              <button
                onClick={() => setShowFullPlayer(false)}
                className="text-moon hover:text-star transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <p className="text-sm text-twilight font-medium uppercase tracking-widest">Now Playing</p>
              <button onClick={closePlayer} className="text-twilight hover:text-star transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Big Thumbnail */}
            <div className="relative z-10 flex justify-center px-8 mt-4">
              <motion.div
                animate={{ scale: isPlaying ? 1 : 0.9 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="w-full max-w-sm aspect-square rounded-3xl overflow-hidden shadow-2xl"
                style={{ boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
              >
                {currentMedia.thumbnailUrl ? (
                  <img
                    src={currentMedia.thumbnailUrl}
                    alt={currentMedia.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-nebula to-aurora flex items-center justify-center">
                    <svg className="w-24 h-24 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                    </svg>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Title & Category */}
            <div className="relative z-10 px-8 mt-8 text-center">
              <h2 className="text-2xl font-medium text-star leading-tight">{currentMedia.title}</h2>
              <p className="text-twilight mt-2 text-sm uppercase tracking-widest">{currentMedia.category}</p>
            </div>

            {/* Progress Bar */}
            <div className="relative z-10 px-8 mt-8">
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="w-full cursor-pointer"
                style={{
                  height: '3px',
                  background: `linear-gradient(to right, #ffffff ${progress}%, rgba(255,255,255,0.2) ${progress}%)`,
                  WebkitAppearance: 'none',
                  borderRadius: '2px',
                }}
              />
              <div className="flex justify-between mt-2">
                <span className="text-xs text-twilight">{formatTime(currentTime)}</span>
                <span className="text-xs text-twilight">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="relative z-10 px-8 mt-8">
              <div className="flex items-center justify-between">
                {/* Shuffle */}
                <button
                  onClick={toggleShuffle}
                  className={`p-2 transition-colors ${shuffle ? 'text-aurora' : 'text-dusk hover:text-moon'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5" />
                  </svg>
                </button>

                {/* Skip back 10s */}
                <button onClick={() => skip(-10)} className="text-moon hover:text-star transition-colors">
                  <div className="relative">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold mt-1">10</span>
                  </div>
                </button>

                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xl hover:scale-105 transition-transform active:scale-95"
                >
                  {isPlaying ? (
                    <svg className="w-8 h-8 text-void" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                  ) : (
                    <svg className="w-8 h-8 text-void ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Skip forward 10s */}
                <button onClick={() => skip(10)} className="text-moon hover:text-star transition-colors">
                  <div className="relative">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold mt-1">10</span>
                  </div>
                </button>

                {/* Repeat */}
                <button
                  onClick={cycleRepeat}
                  className={`p-2 transition-colors ${repeat !== 'none' ? 'text-aurora' : 'text-dusk hover:text-moon'}`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Volume */}
            <div className="relative z-10 px-8 mt-8 flex items-center gap-3">
              <svg className="w-4 h-4 text-twilight flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.114 5.636a9 9 0 010 12.728M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
              <input
                type="range" min={0} max={1} step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="flex-1"
                style={{
                  height: '3px',
                  background: `linear-gradient(to right, rgba(255,255,255,0.8) ${(isMuted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(isMuted ? 0 : volume) * 100}%)`,
                  WebkitAppearance: 'none',
                  borderRadius: '2px',
                }}
              />
              <svg className="w-5 h-5 text-twilight flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mini Player Bar at bottom */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed bottom-0 left-0 right-0 z-[999] border-t border-white/10"
        style={{ background: 'rgba(7,7,15,0.97)' }}
      >
        {/* Progress line */}
        <div className="h-0.5 bg-white/10">
          <div
            className="h-full bg-white/60 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer"
          onClick={() => setShowFullPlayer(true)}
        >
          {/* Thumbnail */}
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative">
            {currentMedia.thumbnailUrl ? (
              <img src={currentMedia.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-nebula to-aurora" />
            )}
            {isPlaying && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="flex items-end gap-0.5">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="w-0.5 bg-white rounded-full animate-pulse"
                      style={{ height: `${4 + i * 2}px`, animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-star truncate">{currentMedia.title}</p>
            <p className="text-xs text-twilight truncate">{currentMedia.category}</p>
          </div>

          {/* Mini controls */}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button onClick={prevTrack} className="text-moon hover:text-star p-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>
            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? (
                <svg className="w-4 h-4 text-void" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-void ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
            <button onClick={nextTrack} className="text-moon hover:text-star p-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
              </svg>
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}