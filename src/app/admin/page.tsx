'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from '@/components/layout/AppLayout';
import AuthGuard from '@/components/auth/AuthGuard';
import UploadMedia from '@/components/admin/UploadMedia';
import { getAllMedia, deleteMedia, getAllUsers, updateUserStatus, updateUserRole, deleteUser } from '@/lib/db';
import { MediaItem, AppUser } from '@/types';
import toast from 'react-hot-toast';

type Tab = 'upload' | 'media' | 'users';

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>('upload');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [editItem, setEditItem] = useState<MediaItem | null>(null);

  const loadMedia = async () => {
    setLoading(true);
    const data = await getAllMedia();
    setMedia(data);
    setLoading(false);
  };

  const loadUsers = async () => {
    const data = await getAllUsers();
    setUsers(data);
  };

  useEffect(() => {
    if (tab === 'media') loadMedia();
    if (tab === 'users') loadUsers();
  }, [tab]);

  const handleDeleteMedia = async (item: MediaItem) => {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await deleteMedia(item.id, item.url, item.thumbnailUrl);
    toast.success('Deleted.');
    setMedia((m) => m.filter((x) => x.id !== item.id));
  };

  const handleUserStatus = async (uid: string, status: AppUser['status']) => {
    await updateUserStatus(uid, status);
    setUsers((u) => u.map((x) => x.uid === uid ? { ...x, status } : x));
    toast.success('User updated.');
  };

  const handleUserRole = async (uid: string, role: AppUser['role']) => {
    await updateUserRole(uid, role);
    setUsers((u) => u.map((x) => x.uid === uid ? { ...x, role } : x));
    toast.success('Role updated.');
  };

  const handleDeleteUser = async (uid: string) => {
    if (!confirm('Delete this user?')) return;
    await deleteUser(uid);
    setUsers((u) => u.filter((x) => x.uid !== uid));
    toast.success('User removed.');
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'upload', label: 'Upload',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" /></svg>,
    },
    {
      id: 'media', label: 'Manage Media',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
    },
    {
      id: 'users', label: 'Users',
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
    },
  ];

  return (
    <AuthGuard adminOnly>
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-6xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-nebula to-aurora flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h1 className="font-display text-3xl font-light text-star">Admin Panel</h1>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="glass rounded-xl p-4">
                <p className="text-2xl font-medium text-star">{media.length}</p>
                <p className="text-xs text-twilight mt-1">Total Media</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-2xl font-medium text-star">{users.filter((u) => u.status === 'active').length || users.length}</p>
                <p className="text-xs text-twilight mt-1">Active Users</p>
              </div>
              <div className="glass rounded-xl p-4">
                <p className="text-2xl font-medium text-star">{users.filter((u) => u.status === 'pending').length}</p>
                <p className="text-xs text-twilight mt-1">Pending</p>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 bg-ink border border-dusk rounded-xl p-1 w-fit">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === t.id ? 'bg-aurora text-white' : 'text-twilight hover:text-moon'}`}
              >
                {t.icon}
                <span className="hidden sm:block">{t.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {tab === 'upload' && (
              <motion.div key="upload" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="glass rounded-2xl p-6">
                  <UploadMedia onSuccess={loadMedia} />
                </div>
              </motion.div>
            )}

            {tab === 'media' && (
              <motion.div key="media" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="glass rounded-2xl overflow-hidden">
                  {loading ? (
                    <div className="p-8 text-center text-twilight">Loading…</div>
                  ) : media.length === 0 ? (
                    <div className="p-8 text-center text-twilight">No media uploaded yet.</div>
                  ) : (
                    <div className="divide-y divide-dusk/30">
                      {media.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-4 hover:bg-mist/50 transition-colors">
                          {/* Thumbnail */}
                          <div className="w-14 h-10 rounded-lg bg-ink overflow-hidden flex-shrink-0">
                            {item.thumbnailUrl ? (
                              <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${item.type === 'audio' ? 'bg-aurora/20' : 'bg-cosmos/20'}`}>
                                <span className="text-xs">{item.type === 'audio' ? '🎵' : '🎥'}</span>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-star truncate">{item.title}</p>
                            <p className="text-xs text-twilight">{item.category} · {formatBytes(item.fileSize || 0)} · {item.playCount || 0} plays</p>
                          </div>

                          {/* Badge */}
                          <span className={`text-xs px-2 py-0.5 rounded-full hidden sm:block ${item.type === 'audio' ? 'bg-aurora/20 text-aurora' : 'bg-cosmos/20 text-cosmos'}`}>
                            {item.type}
                          </span>

                          {/* Actions */}
                          <button
                            onClick={() => handleDeleteMedia(item)}
                            className="text-dusk hover:text-red-400 transition-colors p-2 flex-shrink-0"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {tab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="glass rounded-2xl overflow-hidden">
                  {users.length === 0 ? (
                    <div className="p-8 text-center text-twilight">No users found.</div>
                  ) : (
                    <div className="divide-y divide-dusk/30">
                      {users.map((u) => (
                        <div key={u.uid} className="flex items-center gap-4 p-4 hover:bg-mist/50 transition-colors">
                          {/* Avatar */}
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-nebula to-aurora flex items-center justify-center text-sm font-medium text-white flex-shrink-0">
                            {u.displayName?.[0]?.toUpperCase() || 'U'}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-star truncate">{u.displayName}</p>
                            <p className="text-xs text-twilight truncate">{u.email}</p>
                          </div>

                          {/* Status badge */}
                          <span className={`text-xs px-2 py-0.5 rounded-full hidden sm:block ${
                            u.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            u.status === 'blocked' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {u.status}
                          </span>

                          {/* Role */}
                          <span className="text-xs px-2 py-0.5 rounded-full bg-aurora/20 text-aurora hidden md:block">
                            {u.role}
                          </span>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {u.status !== 'active' && (
                              <button onClick={() => handleUserStatus(u.uid, 'active')} className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors">Approve</button>
                            )}
                            {u.status !== 'blocked' && (
                              <button onClick={() => handleUserStatus(u.uid, 'blocked')} className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">Block</button>
                            )}
                            {u.role !== 'admin' && (
                              <button onClick={() => handleUserRole(u.uid, 'admin')} className="text-xs px-2 py-1 bg-aurora/20 text-aurora rounded-lg hover:bg-aurora/30 transition-colors hidden lg:block">Make Admin</button>
                            )}
                            <button onClick={() => handleDeleteUser(u.uid)} className="text-dusk hover:text-red-400 transition-colors p-1.5">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </AppLayout>
    </AuthGuard>
  );
}
