'use client';
import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import MediaCard from '@/components/media/MediaCard';
import { useAuth } from '@/lib/auth-context';
import { getAllMedia, getUserFavorites } from '@/lib/db';
import { MediaItem } from '@/types';

const CATEGORIES = ['All', 'Sleep Meditation', 'Relaxation', 'Focus Music', 'Healing Sounds', 'Nature Sounds', 'Guided Meditation', 'Videos'];
const SORTS = ['Newest', 'Oldest', 'A-Z', 'Most Played'];

export default function LibraryPage() {
  const { user } = useAuth();
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'audio' | 'video'>('all');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('Newest');

  useEffect(() => {
    const load = async () => {
      const [media, favs] = await Promise.all([
        getAllMedia(),
        user ? getUserFavorites(user.uid) : Promise.resolve([]),
      ]);
      setAllMedia(media);
      setFavorites(favs);
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = useMemo(() => {
    let result = [...allMedia];
    if (search) result = result.filter((m) => m.title.toLowerCase().includes(search.toLowerCase()) || m.description?.toLowerCase().includes(search.toLowerCase()));
    if (typeFilter !== 'all') result = result.filter((m) => m.type === typeFilter);
    if (category !== 'All') result = result.filter((m) => m.category === category);
    if (sort === 'Newest') result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    else if (sort === 'Oldest') result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    else if (sort === 'A-Z') result.sort((a, b) => a.title.localeCompare(b.title));
    else if (sort === 'Most Played') result.sort((a, b) => (b.playCount || 0) - (a.playCount || 0));
    return result;
  }, [allMedia, search, typeFilter, category, sort]);

  return (
    <AuthGuard>
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="font-display text-3xl lg:text-4xl font-light text-star mb-2">Media Library</h1>
            <p className="text-twilight">{allMedia.length} sessions available</p>
          </motion.div>

          {/* Search */}
          <div className="relative mb-6">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-twilight" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search sessions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field pl-11"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-8">
            {/* Type filter */}
            <div className="flex bg-ink border border-dusk rounded-xl p-1 gap-1">
              {(['all', 'audio', 'video'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${typeFilter === t ? 'bg-aurora text-white' : 'text-twilight hover:text-moon'}`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Category */}
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-ink border border-dusk rounded-xl px-4 py-2 text-sm text-moon focus:outline-none focus:border-aurora"
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>

            {/* Sort */}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-ink border border-dusk rounded-xl px-4 py-2 text-sm text-moon focus:outline-none focus:border-aurora"
            >
              {SORTS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* Results count */}
            <div className="ml-auto flex items-center">
              <span className="text-sm text-twilight">{filtered.length} results</span>
            </div>
          </div>

          {/* Grid */}
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
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 text-twilight">
              <svg className="w-16 h-16 mx-auto mb-4 text-dusk" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>No sessions match your filters.</p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            >
              {filtered.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}>
                  <MediaCard
                    item={m}
                    queue={filtered}
                    isFavorite={favorites.includes(m.id)}
                    onFavoriteChange={() => setFavorites((f) => f.includes(m.id) ? f.filter((id) => id !== m.id) : [...f, m.id])}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
