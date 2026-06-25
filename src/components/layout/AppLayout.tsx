'use client';
import { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import AudioPlayer from '../media/AudioPlayer';
import { usePlayerStore } from '@/lib/player-store';
import { motion, AnimatePresence } from 'framer-motion';

function CosmicBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const stars = Array.from({ length: 300 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.2,
      alpha: Math.random(),
      speed: Math.random() * 0.008 + 0.002,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    const shootingStars: { x: number; y: number; len: number; speed: number; alpha: number; angle: number; active: boolean }[] =
      Array.from({ length: 5 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height * 0.5,
        len: Math.random() * 120 + 60,
        speed: Math.random() * 8 + 6,
        alpha: 0,
        angle: Math.PI / 5,
        active: false,
      }));

    const orbs = [
      { x: canvas.width * 0.15, y: canvas.height * 0.3, r: 280, color: '88, 28, 135', pulse: 0 },
      { x: canvas.width * 0.85, y: canvas.height * 0.7, r: 220, color: '49, 10, 101', pulse: 1 },
      { x: canvas.width * 0.5, y: canvas.height * 0.1, r: 180, color: '109, 40, 217', pulse: 2 },
      { x: canvas.width * 0.9, y: canvas.height * 0.2, r: 150, color: '76, 29, 149', pulse: 3 },
      { x: canvas.width * 0.1, y: canvas.height * 0.8, r: 160, color: '124, 58, 237', pulse: 4 },
    ];

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      alpha: Math.random() * 0.5 + 0.1,
      color: Math.random() > 0.5 ? '167, 139, 250' : '196, 181, 253',
    }));

    let mouseX = canvas.width / 2;
    let mouseY = canvas.height / 2;
    const handleMouseMove = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };
    window.addEventListener('mousemove', handleMouseMove);

    let animFrame: number;
    let t = 0;

    setInterval(() => {
      const star = shootingStars[Math.floor(Math.random() * shootingStars.length)];
      if (!star.active) {
        star.x = Math.random() * canvas.width * 0.7;
        star.y = Math.random() * canvas.height * 0.4;
        star.alpha = 1;
        star.active = true;
      }
    }, 2500);

    function draw() {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const bgGrad = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width * 0.8);
      bgGrad.addColorStop(0, '#0d0a1a');
      bgGrad.addColorStop(1, '#03020a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      orbs.forEach((orb) => {
        const pulse = Math.sin(t * 0.01 + orb.pulse) * 20;
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, orb.r + pulse);
        grad.addColorStop(0, `rgba(${orb.color}, 0.25)`);
        grad.addColorStop(0.5, `rgba(${orb.color}, 0.1)`);
        grad.addColorStop(1, `rgba(${orb.color}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(orb.x, orb.y, orb.r + pulse, 0, Math.PI * 2);
        ctx.fill();
      });

      const mouseGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 150);
      mouseGrad.addColorStop(0, 'rgba(139, 92, 246, 0.08)');
      mouseGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
      ctx.fillStyle = mouseGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star) => {
        const twinkle = Math.sin(t * star.speed + star.twinkleOffset);
        const alpha = 0.3 + twinkle * 0.4;
        const size = star.r + twinkle * 0.5;
        if (star.r > 1.2) {
          const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, size * 4);
          glow.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.3})`);
          glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(star.x, star.y, size * 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(star.x, star.y, Math.max(0.1, size), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.fill();
      });

      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        const pulse = Math.sin(t * 0.02 + p.x) * 0.2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color}, ${p.alpha + pulse})`;
        ctx.fill();
      });

      shootingStars.forEach((star) => {
        if (!star.active) return;
        star.x += star.speed;
        star.y += star.speed * Math.tan(star.angle);
        star.alpha -= 0.015;
        if (star.alpha <= 0) { star.active = false; return; }
        ctx.save();
        ctx.globalAlpha = star.alpha;
        const grad = ctx.createLinearGradient(star.x, star.y, star.x - star.len * Math.cos(star.angle), star.y - star.len * Math.sin(star.angle));
        grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(star.x - star.len * Math.cos(star.angle), star.y - star.len * Math.sin(star.angle));
        ctx.stroke();
        ctx.restore();
      });

      t++;
      animFrame = requestAnimationFrame(draw);
    }

    draw();

    const handleResize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrame);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { showPlayer, currentMedia } = usePlayerStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'transparent' }}>

      {/* Cosmic Background */}
      <CosmicBackground />

      {/* Mobile overlay — z-40 (above content, below sidebar) */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/70 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — z-50 on mobile so it slides OVER the overlay */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 lg:relative lg:z-10 lg:translate-x-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <div
          className="lg:hidden flex items-center justify-between p-4 border-b"
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <button onClick={() => setSidebarOpen(true)} className="text-white/50 hover:text-white transition-colors">
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

        {/* Audio Player — z-[999] always on top */}
        <AnimatePresence>
          {showPlayer && currentMedia?.type === 'audio' && (
            <div className="fixed bottom-0 left-0 right-0 z-[999]">
              <AudioPlayer />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}