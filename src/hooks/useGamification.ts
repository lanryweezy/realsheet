import { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';

// --- Local Types ---
export interface PowerHour {
  active: boolean;
  expiresAt: number; // timestamp
  multiplier: number;
}

export interface CriticalHit {
  active: boolean;
  amount: number;
}

export interface DailyGoals {
  xpGoal: number;
  xpCurrent: number;
  scansGoal: number;
  scansCurrent: number;
  questionsGoal: number;
  questionsCurrent: number;
  lastUpdated: string;
}

export interface GamificationState {
  xp: number;
  level: number;
  streak: number;
  momentum: number;
  combo: number;
  lastActionTimestamp: number;
  deepWorkMinutes: number;
  dailyGoals: DailyGoals;
}

const calculateLevel = (xp: number) => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

export const useGamification = () => {
  const [showComboMsg, setShowComboMsg] = useState(false);
  const [powerHour, setPowerHour] = useState<PowerHour>({
    active: false,
    expiresAt: 0,
    multiplier: 2,
  });
  const [criticalHit, setCriticalHit] = useState<CriticalHit>({ active: false, amount: 0 });
  const consecutiveActionsRef = useRef(0);

  const [gameState, setGameState] = useState<GamificationState>(() => {
    const defaultGoals: DailyGoals = {
      xpGoal: 1000,
      xpCurrent: 0,
      scansGoal: 1, // e.g. Magic Cleans
      scansCurrent: 0,
      questionsGoal: 10, // e.g. AI Formulas
      questionsCurrent: 0,
      lastUpdated: new Date().toISOString(),
    };

    const saved = localStorage.getItem('realsheet-gamification');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const state = {
          ...parsed,
          momentum: 0, // Reset on new session
          combo: 0,
          lastActionTimestamp: 0,
          deepWorkMinutes: parsed.deepWorkMinutes || 0,
          dailyGoals: parsed.dailyGoals || defaultGoals,
        };

        const lastDate = new Date(state.dailyGoals.lastUpdated).toDateString();
        const today = new Date().toDateString();
        if (lastDate !== today) {
          state.dailyGoals = { ...defaultGoals, lastUpdated: new Date().toISOString() };
        }

        return state;
      } catch (e) {
        console.error('Failed to load gamification', e);
      }
    }
    return {
      xp: 150,
      level: calculateLevel(150),
      streak: 5,
      momentum: 0,
      combo: 0,
      lastActionTimestamp: 0,
      deepWorkMinutes: 0,
      dailyGoals: defaultGoals,
    };
  });

  // Persist State
  useEffect(() => {
    localStorage.setItem(
      'realsheet-gamification',
      JSON.stringify({
        xp: gameState.xp,
        level: gameState.level,
        streak: gameState.streak,
        dailyGoals: gameState.dailyGoals,
        deepWorkMinutes: gameState.deepWorkMinutes,
      })
    );
  }, [
    gameState.xp,
    gameState.level,
    gameState.streak,
    gameState.dailyGoals,
    gameState.deepWorkMinutes,
  ]);

  // Tick: Momentum Decay + Power Hour expiry check + Deep Work tracking
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev: GamificationState) => {
        const decay = prev.momentum > 80 ? 0.5 : 1.5;
        const newMomentum = Math.max(0, prev.momentum - decay);

        let newDeepWork = prev.deepWorkMinutes;
        let xpBonus = 0;

        if (prev.momentum > 75) {
          const addedMinutes = 10 / 60; // 10 seconds in minutes
          newDeepWork += addedMinutes;

          if (
            Math.floor(newDeepWork) > Math.floor(prev.deepWorkMinutes) &&
            Math.floor(newDeepWork) % 5 === 0
          ) {
            xpBonus = 100; // Bonus every 5 minutes of deep focus
          }
        }

        return {
          ...prev,
          momentum: newMomentum,
          deepWorkMinutes: newDeepWork,
          xp: prev.xp + xpBonus,
        };
      });

      // Check Power Hour expiry
      setPowerHour((prev) => {
        if (prev.active && Date.now() > prev.expiresAt) {
          return { active: false, expiresAt: 0, multiplier: 2 };
        }
        return prev;
      });
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Dismiss critical hit flash after 2.5s
  useEffect(() => {
    if (criticalHit.active) {
      const t = setTimeout(() => setCriticalHit({ active: false, amount: 0 }), 2500);
      return () => clearTimeout(t);
    }
  }, [criticalHit.active]);

  const triggerPowerHour = useCallback(() => {
    const durationMs = 15 * 60 * 1000; // 15 minutes
    setPowerHour({ active: true, expiresAt: Date.now() + durationMs, multiplier: 2 });
    confetti({
      particleCount: 120,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#F59E0B', '#EF4444', '#FBBF24'],
    });
  }, []);

  const addXP = useCallback(
    (amount: number, type: 'xp' | 'scan' | 'question' = 'xp') => {
      setGameState((prev: GamificationState) => {
        const now = Date.now();
        const isCombo = now - prev.lastActionTimestamp < 30000;
        const newCombo = isCombo ? prev.combo + 1 : 1;

        // --- Slot Machine: CRITICAL HIT (5% base, boosted during Power Hour) ---
        const critChance = powerHour.active ? 0.12 : 0.05;
        const isCritical = Math.random() < critChance;
        const criticalMultiplier = isCritical ? 10 : 1;
        const comboMultiplier = 1 + Math.min(prev.combo * 0.1, 1);
        const powerHourMultiplier = powerHour.active ? powerHour.multiplier : 1;

        const finalAmount = Math.round(
          amount * criticalMultiplier * comboMultiplier * powerHourMultiplier
        );
        const momentumBoost = amount >= 50 ? 15 : 5;
        const newMomentum = Math.min(100, prev.momentum + momentumBoost);

        const newXP = prev.xp + finalAmount;

        const newDailyGoals = { ...prev.dailyGoals };
        if (type === 'xp') newDailyGoals.xpCurrent += amount;
        if (type === 'scan') {
          newDailyGoals.scansCurrent += 1;
          newDailyGoals.xpCurrent += amount;
        }
        if (type === 'question') {
          newDailyGoals.questionsCurrent += 1;
          newDailyGoals.xpCurrent += amount;
        }

        let bonusXP = 0;
        const wasComplete =
          prev.dailyGoals.xpCurrent >= prev.dailyGoals.xpGoal &&
          prev.dailyGoals.scansCurrent >= prev.dailyGoals.scansGoal &&
          prev.dailyGoals.questionsCurrent >= prev.dailyGoals.questionsGoal;

        const isComplete =
          newDailyGoals.xpCurrent >= newDailyGoals.xpGoal &&
          newDailyGoals.scansCurrent >= newDailyGoals.scansGoal &&
          newDailyGoals.questionsCurrent >= newDailyGoals.questionsGoal;

        let newStreak = prev.streak;
        if (isComplete && !wasComplete) {
          bonusXP = 500;
          newStreak += 1;

          setTimeout(() => {
            confetti({
              particleCount: 300,
              spread: 160,
              origin: { y: 0.6 },
              colors: ['#10B981', '#34D399', '#FCD34D'],
            });
          }, 500);
        }

        const totalNewXP = newXP + bonusXP;
        const newLevel = calculateLevel(totalNewXP);

        if (newLevel > prev.level) {
          confetti({
            particleCount: 200,
            spread: 90,
            origin: { y: 0.8 },
            colors: ['#3B82F6', '#22D3EE', '#FCD34D', '#A855F7'],
          });
        }

        if (isCritical) {
          setCriticalHit({ active: true, amount: finalAmount });
          confetti({
            particleCount: 150,
            spread: 100,
            origin: { y: 0.3 },
            colors: ['#F59E0B', '#EF4444', '#EC4899'],
          });
        }

        if (newCombo % 5 === 0) {
          setShowComboMsg(true);
          setTimeout(() => setShowComboMsg(false), 3000);
        }

        return {
          ...prev,
          xp: totalNewXP,
          level: newLevel,
          streak: newStreak,
          momentum: newMomentum,
          combo: newCombo,
          lastActionTimestamp: now,
          dailyGoals: newDailyGoals,
        };
      });

      // --- Power Hour trigger: every 5 consecutive actions ---
      consecutiveActionsRef.current += 1;
      if (consecutiveActionsRef.current % 5 === 0 && !powerHour.active) {
        triggerPowerHour();
      }
    },
    [powerHour.active, triggerPowerHour]
  );

  return {
    gameState,
    addXP,
    showComboMsg,
    setShowComboMsg,
    powerHour,
    criticalHit,
  };
};
