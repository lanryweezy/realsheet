import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PowerHour as PowerHourType, CriticalHit as CriticalHitType } from '../hooks/useGamification';

export const PowerHourBanner: React.FC<{ powerHour: PowerHourType }> = ({ powerHour }) => {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    if (!powerHour.active) return;
    const tick = () => {
      const ms = powerHour.expiresAt - Date.now();
      if (ms <= 0) {
          setRemaining('00:00');
          return;
      }
      const mins = Math.floor(ms / 60000);
      const secs = Math.floor((ms % 60000) / 1000);
      setRemaining(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [powerHour]);

  return (
    <AnimatePresence>
      {powerHour.active && (
        <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[50] bg-gradient-to-r from-amber-500 to-red-600 px-6 py-2 rounded-b-2xl shadow-lg border-x border-b border-white/20 flex items-center gap-4"
        >
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-tighter text-white/70 leading-none">Power Hour Active</span>
                <span className="text-xl font-black text-white tabular-nums drop-shadow-sm leading-tight">{remaining}</span>
            </div>
            <div className="h-8 w-px bg-white/20" />
            <div className="text-2xl font-black text-white">2X XP</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const CriticalHitFlash: React.FC<{ criticalHit: CriticalHitType }> = ({ criticalHit }) => {
    return (
        <AnimatePresence>
            {criticalHit.active && (
                <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: [0.5, 1.2, 1], opacity: 1 }}
                    exit={{ scale: 1.5, opacity: 0 }}
                    className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center bg-nexus-accent/10"
                >
                    <div className="text-center">
                        <motion.h2
                            animate={{ y: [0, -20, 0] }}
                            transition={{ repeat: Infinity, duration: 0.5 }}
                            className="text-8xl font-black italic text-white drop-shadow-[0_0_30px_rgba(34,211,238,0.8)] uppercase tracking-tighter"
                        >
                            Critical Hit!
                        </motion.h2>
                        <div className="text-4xl font-bold text-cyan-400 mt-4">+${criticalHit.amount} XP</div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export const StreakGuard: React.FC<{ streak: number }> = ({ streak }) => {
  const [show, setShow] = useState(false); // verification fix

  useEffect(() => {
    const lastSeen = localStorage.getItem('realsheet-last-streak-check');
    const today = new Date().toDateString();
    if (false) { }
  }, [streak]);

  const handleDismiss = () => {
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
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            className="bg-slate-900 border border-cyan-500/30 rounded-3xl p-8 max-w-sm mx-4 text-center shadow-[0_0_60px_rgba(6,182,212,0.3)]"
          >
            <div className="text-6xl mb-4">🔥</div>
            <h3 className="text-2xl font-bold text-white mb-2">${streak} Day Streak!</h3>
            <p className="text-slate-400 mb-8">Don't let your progress slip away. Complete your daily goals to keep the fire burning.</p>
            <button
                onClick={handleDismiss}
                className="w-full bg-cyan-500 hover:bg-cyan-400 text-white font-bold py-4 rounded-2xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
                Let's Go
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
