'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import MediaCard from '@/components/media/MediaCard';
import { useAuth } from '@/lib/auth-context';
import { getAllMedia, getUserFavorites, getUserHistory } from '@/lib/db';
import { MediaItem, History } from '@/types';

const CATEGORIES = [
  { id: 'walking', name: 'Walking Meditation', icon: '🚶', glow: '34,197,94' },
  { id: 'kaleidoscope', name: 'Kaleidoscope', icon: '🔮', glow: '139,92,246' },
  { id: 'lectures', name: 'Lectures', icon: '📖', glow: '59,130,246' },
  { id: 'guided', name: 'Guided Meditations', icon: '🧘', glow: '245,158,11' },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

// Dim liquid glass — very subtle, dark, transparent
const liquidGlass = (glowColor = '255,255,255', active = false) => ({
  background: active
    ? 'rgba(255,255,255,0.04)'
    : 'rgba(255,255,255,0.02)',
  backdropFilter: 'blur(16px) saturate(150%)',
  WebkitBackdropFilter: 'blur(16px) saturate(150%)',
  border: '1.5px solid transparent',
  backgroundImage: active
    ? `linear-gradient(rgba(255,255,255,0.04), rgba(255,255,255,0.01)),
       linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.0) 60%, rgba(255,255,255,0.06) 100%)`
    : `linear-gradient(rgba(255,255,255,0.02), rgba(255,255,255,0.005)),
       linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.01) 40%, rgba(0,0,0,0.0) 60%, rgba(255,255,255,0.04) 100%)`,
  backgroundOrigin: 'border-box',
  backgroundClip: 'padding-box, border-box',
  boxShadow: `
    inset 0 1px 0 rgba(255,255,255,0.08),
    inset 0 -1px 0 rgba(0,0,0,0.2),
    0 8px 32px rgba(0,0,0,0.4),
    0 2px 8px rgba(0,0,0,0.3)
    ${active ? `, 0 0 20px rgba(${glowColor},0.06)` : ''}
  `,
});

export default function DashboardPage() {
  const { appUser, user } = useAuth();
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const [media, favs, hist] = await Promise.all([
        getAllMedia(),
        user ? getUserFavorites(user.uid) : Promise.resolve([]),
        user ? getUserHistory(user.uid) : Promise.resolve([]),
      ]);
      setAllMedia(media);
      setFavorites(favs);
      setHistory(hist);
      setLoading(false);
    };
    load();
  }, [user]);

  const recentIds = history.slice(0, 5).map((h) => h.mediaId);
  const recentMedia = recentIds
    .map((id) => allMedia.find((m) => m.id === id))
    .filter(Boolean) as MediaItem[];

  const filteredMedia = selectedCategory
    ? allMedia.filter((m) => m.category === selectedCategory)
    : allMedia;

  const container = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl p-8 lg:p-12 mb-10"
            style={liquidGlass('139,92,246', false)}
          >
            <div className="pointer-events-none absolute inset-0 rounded-3xl overflow-hidden">
              <div
                className="absolute -top-10 -left-10 w-48 h-24 rounded-full"
                style={{
                  background: 'radial-gradient(ellipse, rgba(255,255,255,0.06) 0%, transparent 70%)',
                  filter: 'blur(10px)',
                }}
              />
              <div
                className="absolute top-3 left-6 w-28 h-4 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)',
                  filter: 'blur(3px)',
                }}
              />
            </div>

            <div className="relative z-10">
              <p className="text-white/30 text-sm mb-1 tracking-widest uppercase">{getGreeting()},</p>
              <h1 className="font-display text-3xl lg:text-5xl font-light text-white/90 mb-3">
                {appUser?.displayName?.split(' ')[0] || 'Traveler'}
              </h1>
              <p className="text-white/30 text-base max-w-md">
                Find your inner peace. Your sanctuary awaits.
              </p>
              <div className="mt-8 flex gap-8">
                {[
                  { label: 'Sessions', value: allMedia.length },
                  { label: 'Favorites', value: favorites.length },
                  { label: 'Listened', value: history.length },
                ].map((stat, i) => (
                  <div key={i} className="flex items-center gap-8">
                    {i > 0 && <div className="w-px h-8 bg-white/[0.06]" />}
                    <div className="text-center">
                      <p className="text-2xl font-medium text-white/80">{stat.value}</p>
                      <p className="text-xs text-white/20 mt-0.5">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Categories */}
          <section className="mb-10">
            <h2 className="text-lg font-medium text-white/40 mb-4">Browse Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORIES.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedCategory(selectedCategory === cat.name ? null : cat.name)}
                  className="relative overflow-hidden rounded-2xl p-5 cursor-pointer text-center"
                  style={liquidGlass(cat.glow, selectedCategory === cat.name)}
                >
                  <div className="pointer-events-none absolute inset-0 rounded-2xl overflow-hidden">
                    <div
                      className="absolute -top-4 -left-4 w-24 h-12 rounded-full"
                      style={{
                        background: 'radial-gradient(ellipse, rgba(255,255,255,0.07) 0%, transparent 70%)',
                        filter: 'blur(6px)',
                      }}
                    />
                  </div>
                  <div className="relative z-10">
                    <div className="text-3xl mb-2 opacity-80">{cat.icon}</div>
                    <p className="text-sm font-medium text-white/50 leading-tight">{cat.name}</p>
                    {selectedCategory === cat.name && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="mt-2 w-1.5 h-1.5 rounded-full bg-white/40 mx-auto"
                      />
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Continue Listening */}
          {recentMedia.length > 0 && !selectedCategory && (
            <section className="mb-10">
              <h2 className="text-lg font-medium text-white/40 mb-4">Continue Listening</h2>
              <div
                className="relative overflow-hidden rounded-2xl p-4"
                style={liquidGlass('255,255,255', false)}
              >
                <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {recentMedia.map((m) => (
                    <MediaCard
                      key={m.id}
                      item={m}
                      queue={recentMedia}
                      isFavorite={favorites.includes(m.id)}
                      onFavoriteChange={() =>
                        setFavorites((f) =>
                          f.includes(m.id) ? f.filter((id) => id !== m.id) : [...f, m.id]
                        )
                      }
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* All Sessions */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-white/40">
                {selectedCategory ?? 'All Sessions'}
                {selectedCategory && (
                  <span className="text-sm text-white/20 ml-2 font-normal">
                    ({filteredMedia.length} sessions)
                  </span>
                )}
              </h2>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-sm text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Show All
                </button>
              )}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="rounded-xl overflow-hidden">
                    <div className="aspect-video shimmer" />
                    <div className="mt-3 space-y-2">
                      <div className="h-4 shimmer rounded w-3/4" />
                      <div className="h-3 shimmer rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredMedia.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4 opacity-40">
                  {selectedCategory
                    ? CATEGORIES.find((c) => c.name === selectedCategory)?.icon || '🔍'
                    : '🎵'}
                </div>
                <p className="text-white/30 font-medium mb-1">
                  {selectedCategory ? `No ${selectedCategory} yet` : 'No media yet'}
                </p>
                <p className="text-sm text-white/15">
                  {selectedCategory
                    ? 'Upload some files in this category from the Admin panel.'
                    : 'Visit the Admin panel to upload your first file.'}
                </p>
              </div>
            ) : (
              <motion.div
                variants={container}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {filteredMedia.map((m) => (
                  <motion.div key={m.id} variants={item}>
                    <MediaCard
                      item={m}
                      queue={filteredMedia}
                      isFavorite={favorites.includes(m.id)}
                      onFavoriteChange={() =>
                        setFavorites((f) =>
                          f.includes(m.id)
                            ? f.filter((id) => id !== m.id)
                            : [...f, m.id]
                        )
                      }
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </section>

        </div>
      </AppLayout>
    </AuthGuard>
  );
}