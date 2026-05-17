'use client';
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import MediaCard from '@/components/media/MediaCard';
import { useAuth } from '@/lib/auth-context';
import { getAllMedia, getUserFavorites, getUserHistory } from '@/lib/db';
import { MediaItem, History } from '@/types';

const CATEGORIES = [
  { id: 'walking', name: 'Walking Meditation', icon: '🚶', color: 'from-green-900/40 to-emerald-900/40' },
  { id: 'kaleidoscope', name: 'Kaleidoscope', icon: '🔮', color: 'from-purple-900/40 to-violet-900/40' },
  { id: 'lectures', name: 'Lectures', icon: '📖', color: 'from-blue-900/40 to-indigo-900/40' },
  { id: 'guided', name: 'Guided Meditations', icon: '🧘', color: 'from-amber-900/40 to-orange-900/40' },
];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

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

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06 } },
  };
  const item = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">

          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl p-8 lg:p-12 mb-10"
            style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 50%, #07070f 100%)' }}
          >
            <div className="orb w-64 h-64 bg-aurora/15 top-[-20%] right-[-5%]" />
            <div className="orb w-48 h-48 bg-nebula/10 bottom-[-20%] left-[10%]" />
            <div className="relative z-10">
              <p className="text-twilight text-sm mb-1">{getGreeting()},</p>
              <h1 className="font-display text-3xl lg:text-5xl font-light text-star mb-3">
                {appUser?.displayName?.split(' ')[0] || 'Traveler'}
              </h1>
              <p className="text-moon/70 text-base max-w-md">
                Find your inner peace. Your sanctuary awaits.
              </p>
              <div className="mt-6 flex gap-4">
                <div className="text-center">
                  <p className="text-2xl font-medium text-star">{allMedia.length}</p>
                  <p className="text-xs text-twilight">Sessions</p>
                </div>
                <div className="w-px bg-dusk/50" />
                <div className="text-center">
                  <p className="text-2xl font-medium text-star">{favorites.length}</p>
                  <p className="text-xs text-twilight">Favorites</p>
                </div>
                <div className="w-px bg-dusk/50" />
                <div className="text-center">
                  <p className="text-2xl font-medium text-star">{history.length}</p>
                  <p className="text-xs text-twilight">Listened</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Categories */}
          <section className="mb-10">
            <h2 className="text-lg font-medium text-star mb-4">Browse Categories</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {CATEGORIES.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    setSelectedCategory(
                      selectedCategory === cat.name ? null : cat.name
                    )
                  }
                  className={`bg-gradient-to-br ${cat.color} border rounded-2xl p-5 cursor-pointer text-center transition-all duration-200 ${
                    selectedCategory === cat.name
                      ? 'border-aurora shadow-lg shadow-aurora/20 scale-105'
                      : 'border-dusk/30 hover:border-dusk/60'
                  }`}
                >
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <p className="text-sm font-medium text-moon leading-tight">{cat.name}</p>
                  {selectedCategory === cat.name && (
                    <div className="mt-2 w-1.5 h-1.5 rounded-full bg-aurora mx-auto" />
                  )}
                </motion.div>
              ))}
            </div>
          </section>

          {/* Continue Listening */}
          {recentMedia.length > 0 && !selectedCategory && (
            <section className="mb-10">
              <h2 className="text-lg font-medium text-star mb-4">Continue Listening</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            </section>
          )}

          {/* Media Grid */}
          <section>
            {/* Heading */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-star">
                {selectedCategory ? selectedCategory : 'All Sessions'}
                {selectedCategory && (
                  <span className="text-sm text-twilight ml-2 font-normal">
                    ({filteredMedia.length} sessions)
                  </span>
                )}
              </h2>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory(null)}
                  className="text-sm text-aurora hover:text-aurora-light transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Show All
                </button>
              )}
            </div>

            {/* Loading skeleton */}
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
              <div className="text-center py-20 text-twilight">
                <div className="text-5xl mb-4">
                  {selectedCategory
                    ? CATEGORIES.find((c) => c.name === selectedCategory)?.icon || '🔍'
                    : '🎵'}
                </div>
                <p className="text-star font-medium mb-1">
                  {selectedCategory ? `No ${selectedCategory} yet` : 'No media yet'}
                </p>
                <p className="text-sm">
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