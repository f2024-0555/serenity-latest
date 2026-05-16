'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function AuthGuard({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { user, appUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else if (adminOnly && appUser?.role !== 'admin') {
        router.replace('/dashboard');
      }
    }
  }, [user, appUser, loading, router, adminOnly]);

  if (loading) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-aurora border-t-transparent animate-spin" />
          <p className="text-twilight text-sm">Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return null;
  if (adminOnly && appUser?.role !== 'admin') return null;

  return <>{children}</>;
}
