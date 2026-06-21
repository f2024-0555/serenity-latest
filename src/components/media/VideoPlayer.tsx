'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MediaItem } from '@/types';
import { usePlayerStore } from '@/lib/player-store';
import { useAuth } from '@/lib/auth-context';
import { saveProgress, incrementPlayCount } from '@/lib/db';
import { isYouTubeEmbed } from '@/lib/youtube';

interface Props {
  media: MediaItem;
  queue?: MediaItem[];
  onClose: () => void;
}

/** Returns true if the URL is a YouTube embed URL */
function isVideoEmbed(url: string): boolean {
  return isYouTubeEmbed(url) || url.includes('youtube.com/embed/');
}

export default function VideoPlayer({ media, queue = [], onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimeout = useRef<NodeJS.Timeout>();
  const { user } = useAuth();
  const { setQueue } = usePlayerStore();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [currentMedia, setCurrentMedia] = useState<MediaItem>(media);

  const isEmbed = isVideoEmbed(currentMedia.url);

  useEffect(() => {
    if (queue.length > 0) setQueue(queue);
    incrementPlayCount(media.id);
  }, []);

  // For regular video: reload when media changes
  useEffect(() => {
    if (isEmbed) return;
    const video = videoRef.current;
    if (!video) return;
    video.src = currentMedia.url;
    video.load();
    video.play().catch(() => {});
    setIsPlaying(true);
  }, [currentMedia, isEmbed]);

  const togglePlay = () => {
    if (isEmbed) return; // YouTube iframe controls its own playback
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) video.pause();
    else video.play();
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value);
    setCurrentTime(t);
    if (videoRef.current) videoRef.current.currentTime = t;
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(hideTimeout.current);
    // For embeds keep controls always visible; for native video hide after 3s
    if (!isEmbed) {
      hideTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleEnded = () => {
    if (user && currentMedia) {
      saveProgress(user.uid, currentMedia.id, duration, true);
    }
    const idx = queue.findIndex((q) => q.id === currentMedia.id);
    if (idx < queue.length - 1) setCurrentMedia(queue[idx + 1]);
  };

  const navigatePrev = () => {
    const idx = queue.findIndex((q) => q.id === currentMedia.id);
    if (idx > 0) setCurrentMedia(queue[idx - 1]);
  };

  const navigateNext = () => {
    const idx = queue.findIndex((q) => q.id === currentMedia.id);
    if (idx < queue.length - 1) setCurrentMedia(queue[idx + 1]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 bg-black flex flex-col"
      ref={containerRef}
      onMouseMove={handleMouseMove}
    >
      {/* ── Video area ─────────────────────────────────────────────────────── */}
      <div
        className="relative flex-1 flex items-center justify-center"
        onClick={!isEmbed ? togglePlay : undefined}
      >
        {isEmbed ? (
          /* YouTube iframe — uses its own native controls */
          <iframe
            src={`${currentMedia.url}?autoplay=1&rel=0&modestbranding=1`}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 'none', aspectRatio: '16/9', maxHeight: '100%' }}
          />
        ) : (
          /* Native HTML5 video */
          <>
            <video
              ref={videoRef}
              className="max-w-full max-h-full"
              onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
              onLoadedMetadata={(e) => setDuration((e.target as HTMLVideoElement).duration)}
              onEnded={handleEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />

            {/* Play overlay for native video */}
            <AnimatePresence>
              {!isPlaying && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="absolute w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center pointer-events-none"
                >
                  <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {/* ── Controls overlay ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-0 left-0 right-0 p-4"
            style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Title row */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white">{currentMedia.title}</h3>
                  {isEmbed && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                      YouTube
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/60">{currentMedia.category}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/60 hover:text-white transition-colors p-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress bar — only for native video */}
            {!isEmbed && (
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs text-white/60">{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min={0}
                  max={duration || 100}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, #a78bfa ${(currentTime / (duration || 1)) * 100}%, rgba(255,255,255,0.2) ${(currentTime / (duration || 1)) * 100}%)`,
                  }}
                />
                <span className="text-xs text-white/60">{formatTime(duration)}</span>
              </div>
            )}

            {/* Button row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Prev */}
                <button onClick={navigatePrev} className="text-white/70 hover:text-white p-1.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                  </svg>
                </button>

                {/* Skip back 10s */}
                {!isEmbed && (
                  <button
                    onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10); }}
                    className="text-white/70 hover:text-white p-1.5 relative"
                    title="Back 10s"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.5 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7V3z"/>
                      <path d="M12.5 3V0l-4 4 4 4V5a7 7 0 0 1 0 14 7 7 0 0 1-7-7h-2a9 9 0 0 0 9 9 9 9 0 0 0 0-18z" style={{display:'none'}}/>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold mt-0.5">-10</span>
                  </button>
                )}

                {/* Play/Pause — only for native video */}
                {!isEmbed && (
                  <button
                    onClick={togglePlay}
                    className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30"
                  >
                    {isPlaying ? (
                      <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>
                )}

                {/* Skip forward 10s */}
                {!isEmbed && (
                  <button
                    onClick={() => { if (videoRef.current) videoRef.current.currentTime = Math.min(duration, videoRef.current.currentTime + 10); }}
                    className="text-white/70 hover:text-white p-1.5 relative"
                    title="Forward 10s"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.5 3a9 9 0 1 1-9 9h2a7 7 0 1 0 7-7V3z"/>
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold mt-0.5">+10</span>
                  </button>
                )}

                {/* Next */}
                <button onClick={navigateNext} className="text-white/70 hover:text-white p-1.5">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                  </svg>
                </button>

                {/* Volume — only for native video */}
                {!isEmbed && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setIsMuted(!isMuted);
                        if (videoRef.current) videoRef.current.muted = !isMuted;
                      }}
                      className="text-white/70 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isMuted ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6l4.72-4.72a.75.75 0 011.28.531V19.94a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.506-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                        )}
                      </svg>
                    </button>
                    <input
                      type="range" min={0} max={1} step={0.05}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setVolume(v);
                        if (videoRef.current) videoRef.current.volume = v;
                      }}
                      className="w-20"
                    />
                  </div>
                )}

                {/* Info label for embed */}
                {isEmbed && (
                  <span className="text-xs text-white/40 italic">
                    Use the YouTube player controls to adjust volume &amp; speed
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {/* Speed — only for native video */}
                {!isEmbed && (
                  <select
                    value={speed}
                    onChange={(e) => {
                      const s = parseFloat(e.target.value);
                      setSpeed(s);
                      if (videoRef.current) videoRef.current.playbackRate = s;
                    }}
                    className="bg-white/10 text-white text-xs rounded-lg px-2 py-1 border border-white/20"
                  >
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <option key={s} value={s} className="bg-ink">{s}×</option>
                    ))}
                  </select>
                )}

                {/* Fullscreen */}
                <button onClick={toggleFullscreen} className="text-white/70 hover:text-white p-1.5">
                  {isFullscreen ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}