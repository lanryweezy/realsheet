import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PowerHour as PowerHourType, CriticalHit as CriticalHitType } from '../hooks/useGamification';

// ─────────────────────────────────────────────
// POWER HOUR BANNER — countdown timer, pulsing
// ─────────────────────────────────────────────
export const PowerHourBanner: React.FC<{ powerHour: PowerHourType }> = ({ powerHour }) => {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!powerHour.active) return;
    const tick = () => {
      const ms = powerHour.expiresAt - Date.now();
      if (ms <= 0) { setRemaining('00:00'); return; }
      const m = Math.floor(ms / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setRemaining(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [powerHour]);

  return (
    <AnimatePresence>
      {powerHour.active && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="fixed top-12 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none"
        >
          <div className="flex items-center gap-3 bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2.5 rounded-full shadow-[0_0_30px_rgba(239,68,68,0.5)] border border-orange-400/40">
            <span className="animate-pulse text-lg">⚡</span>
            <span className="font-black text-sm uppercase tracking-widest">2× DATA FLOW</span>
            <span className="font-mono font-black bg-black/20 px-2 py-0.5 rounded-md text-sm">{remaining}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────
// CRITICAL HIT FLASH — slot machine payoff
// ─────────────────────────────────────────────
export const CriticalHitFlash: React.FC<{ criticalHit: CriticalHitType }> = ({ criticalHit }) => {
  return (
    <AnimatePresence>
      {criticalHit.active && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [0.5, 1.4, 1], opacity: [0, 1, 1] }}
          exit={{ scale: 1.5, opacity: 0, y: -30 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-28 right-8 z-[9999] pointer-events-none"
        >
          <div className="relative">
            {/* Glow ring */}
            <div className="absolute inset-0 rounded-full bg-cyan-400/30 blur-xl scale-150 animate-pulse" />
            <div className="relative bg-gradient-to-br from-cyan-400 to-blue-500 text-white px-6 py-3 rounded-2xl shadow-2xl border-2 border-cyan-300/50">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-0.5">DATA SURGE!</p>
              <p className="text-3xl font-black tracking-tighter">+{criticalHit.amount.toLocaleString()} XP</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─────────────────────────────────────────────
// STREAK GUARD — Snapchat loss-aversion
// ─────────────────────────────────────────────
export const StreakGuard: React.FC<{ streak: number }> = ({ streak }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show if user hasn't interacted yet today
    const lastSeen = localStorage.getItem('realsheet-last-streak-check');
    const today = new Date().toDateString();
    if (lastSeen !== today && streak >= 1) {
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [streak]);

  const dismiss = () => {
    localStorage.setItem('realsheet-last-streak-check', new Date().toDateString());
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-8 max-w-sm mx-4 text-center shadow-[0_0_60px_rgba(6,182,212,0.3)]"
          >
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-black text-white mb-2">
              {streak}-Day Data Streak!
            </h2>
            <p className="text-slate-400 mb-2 text-sm">
              Your streak is <span className="text-cyan-400 font-bold">protected for today</span>. Keep it alive by writing a formula or cleaning data.
            </p>
            <div className="flex items-center justify-center gap-1 mb-6">
              {Array.from({ length: Math.min(streak, 7) }).map((_, i) => (
                <div key={i} className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-[10px] shadow-md">
                  🔥
                </div>
              ))}
              {streak > 7 && <span className="text-cyan-400 font-black text-sm ml-1">+{streak - 7}</span>}
            </div>
            <button
              onClick={dismiss}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              Analyze Data 🚀
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
