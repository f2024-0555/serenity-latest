'use client';
import { useState } from 'react';
import Sidebar from './Sidebar';
import AudioPlayer from '../media/AudioPlayer';
import { usePlayerStore } from '@/lib/player-store';
import { motion, AnimatePresence } from 'framer-motion';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { showPlayer, currentMedia } = usePlayerStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-void overflow-hidden">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 lg:relative lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 glass border-b border-dusk/30">
          <button onClick={() => setSidebarOpen(true)} className="text-twilight hover:text-star transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-display text-xl text-star">Serenity</span>
          <div className="w-6" />
        </div>

        {/* Page content */}
        <main className={`flex-1 overflow-y-auto transition-all duration-300 ${showPlayer && currentMedia?.type === 'audio' ? 'pb-28' : ''}`}>
          {children}
        </main>

        {/* Audio Player */}
        <AnimatePresence>
          {showPlayer && currentMedia?.type === 'audio' && (
            <AudioPlayer />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
