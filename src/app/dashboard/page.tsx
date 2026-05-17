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
  { id: 'walking', name: 'Walking Meditation', icon: '🚶', color: 'from-green-900/40 to-emerald-900/40' },
  { id: 'kaleidoscope', name: 'Kaleidoscope', icon: '🔮', color: 'from-purple-900/40 to-violet-900/40' },
  { id: 'lectures', name: 'Lectures', icon: '📖', color: 'from-blue-900/40 to-indigo-900/40' },
  { id: 'guided', name: 'Guided Meditations', icon: '🧘', color: 'from-amber-900/40 to-orange-900/40' },
];

const greetings = ['Good morning', 'Good afternoon', 'Good evening'];
const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return greetings[0];
  if (h < 18) return greetings[1];
  return greetings[2];
};

export default function DashboardPage() {
  const { appUser, user } = useAuth();
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);

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
  const recentMedia = recentIds.map((id) => allMedia.find((m) => m.id === id)).filter(Boolean) as MediaItem[];
  const featuredMedia = allMedia.slice(0, 6);

  const container = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
              {CATEGORIES.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.03 }}
                  className={`bg-gradient-to-br ${cat.color} border border-dusk/30 rounded-2xl p-4 cursor-pointer text-center hover:border-dusk/60 transition-all duration-200`}
                >
                  <div className="text-2xl mb-2">{cat.icon}</div>
                  <p className="text-xs font-medium text-moon leading-tight">{cat.name}</p>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Continue Listening */}
          {recentMedia.length > 0 && (
            <section className="mb-10">
              <h2 className="text-lg font-medium text-star mb-4">Continue Listening</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {recentMedia.map((m) => (
                  <MediaCard
                    key={m.id}
                    item={m}
                    queue={recentMedia}
                    isFavorite={favorites.includes(m.id)}
                    onFavoriteChange={() => setFavorites((f) => f.includes(m.id) ? f.filter((id) => id !== m.id) : [...f, m.id])}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Featured */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="rounded-xl overflow-hidden">
                  <div className="aspect-video shimmer" />
                  <div className="mt-3 space-y-2">
                    <div className="h-4 shimmer rounded w-3/4" />
                    <div className="h-3 shimmer rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <section>
              <h2 className="text-lg font-medium text-star mb-4">
                {allMedia.length > 0 ? 'All Sessions' : 'No media yet'}
              </h2>
              {allMedia.length === 0 ? (
                <div className="text-center py-16 text-twilight">
                  <svg className="w-16 h-16 mx-auto mb-4 text-dusk" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
                  </svg>
                  <p>No media uploaded yet. Visit the Admin panel to add content.</p>
                </div>
              ) : (
                <motion.div
                  variants={container}
                  initial="hidden"
                  animate="visible"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                >
                  {featuredMedia.map((m) => (
                    <motion.div key={m.id} variants={item}>
                      <MediaCard
                        item={m}
                        queue={allMedia}
                        isFavorite={favorites.includes(m.id)}
                        onFavoriteChange={() => setFavorites((f) => f.includes(m.id) ? f.filter((id) => id !== m.id) : [...f, m.id])}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </section>
          )}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
