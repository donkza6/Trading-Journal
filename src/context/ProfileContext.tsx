'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { Profile, Trade, DailyLog, PortfolioMetrics } from '@/types';

/* ═══════════════════════════════════════════
   Predefined Sleek Avatars
   ═══════════════════════════════════════════ */
export const AVATARS = [
  { id: 'avatar-red', name: 'Ruby', initials: 'RU', bg: '#fee2e2', color: '#dc2626' },
  { id: 'avatar-blue', name: 'Ocean', initials: 'OC', bg: '#dbeafe', color: '#2563eb' },
  { id: 'avatar-green', name: 'Emerald', initials: 'EM', bg: '#dcfce7', color: '#16a34a' },
  { id: 'avatar-purple', name: 'Amethyst', initials: 'AM', bg: '#f3e8ff', color: '#7c3aed' },
  { id: 'avatar-orange', name: 'Amber', initials: 'AB', bg: '#fef3c7', color: '#d97706' },
  { id: 'avatar-dark', name: 'Obsidian', initials: 'OB', bg: '#f3f4f6', color: '#1f2937' },
] as const;

/* ═══════════════════════════════════════════
   Simulated Real-Time Cloud Database Setup
   ═══════════════════════════════════════════ */

type ListenerCallback = () => void;

class RealtimeDatabase {
  private listeners: Set<ListenerCallback> = new Set();
  private profiles: Profile[] = [];
  private trades: Trade[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const rawProfiles = localStorage.getItem('trading-journal-profiles-v2');
        const rawTrades = localStorage.getItem('trading-journal-trades-v2');
        
        if (rawProfiles) {
          this.profiles = JSON.parse(rawProfiles);
        } else {
          // Seed default profiles
          this.profiles = [
            { id: 'profile-a', name: 'User A', avatarUrl: 'avatar-red', createdAt: new Date().toISOString() },
            { id: 'profile-b', name: 'User B', avatarUrl: 'avatar-blue', createdAt: new Date().toISOString() },
          ];
          this.saveProfiles();
        }

        if (rawTrades) {
          this.trades = JSON.parse(rawTrades);
        } else {
          // Seed default mock trades for User A
          this.trades = [
            {
              id: 'trade-1',
              profileId: 'profile-a',
              pair: 'EUR/USD',
              direction: 'Long',
              entryPrice: 1.1000,
              exitPrice: 1.1050,
              positionSize: 100000,
              profitLevel: 1.1050,
              stopLevel: 1.0980,
              pnl: 500,
              outcome: 'Win',
              riskReward: 2.5,
              notes: 'Hit take profit target cleanly on breakout.',
              images: [],
              createdAt: new Date().toISOString().slice(0, 10) + 'T12:00:00',
            },
            {
              id: 'trade-2',
              profileId: 'profile-a',
              pair: 'BTC/USDT',
              direction: 'Short',
              entryPrice: 60000,
              exitPrice: 59000,
              positionSize: 0.5,
              profitLevel: 57000,
              stopLevel: 61000,
              pnl: 500,
              outcome: 'Win',
              riskReward: 3.0,
              notes: 'Riding the rejection at the psychological 60k level.',
              images: [],
              createdAt: new Date().toISOString().slice(0, 10) + 'T12:00:00',
            }
          ];
          this.saveTrades();
        }
      } catch (err) {
        console.error('[Database] Failed to initialize:', err);
      }
    }
  }

  private saveProfiles() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('trading-journal-profiles-v2', JSON.stringify(this.profiles));
    }
  }

  private saveTrades() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('trading-journal-trades-v2', JSON.stringify(this.trades));
    }
  }

  public subscribe(cb: ListenerCallback): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener();
    }
  }

  // Profiles operations
  public getProfiles(): Profile[] {
    return [...this.profiles];
  }

  public addProfile(name: string, avatarUrl: string): Profile {
    const newProfile: Profile = {
      id: 'profile-' + Math.random().toString(36).substring(2, 9),
      name,
      avatarUrl,
      createdAt: new Date().toISOString(),
    };
    this.profiles.push(newProfile);
    this.saveProfiles();
    this.notify();
    return newProfile;
  }

  // Trades operations
  public getTrades(profileId: string): Trade[] {
    return this.trades.filter((t) => t.profileId === profileId);
  }

  public addTrade(trade: Omit<Trade, 'id'>): Trade {
    const newTrade: Trade = {
      ...trade,
      id: 'trade-' + Math.random().toString(36).substring(2, 9),
    };
    this.trades.push(newTrade);
    this.saveTrades();
    this.notify();
    return newTrade;
  }

  public updateTrade(id: string, updatedFields: Omit<Trade, 'id' | 'profileId'>) {
    this.trades = this.trades.map((t) => t.id === id ? { ...t, ...updatedFields } : t);
    this.saveTrades();
    this.notify();
  }

  public deleteTrade(id: string) {
    this.trades = this.trades.filter((t) => t.id !== id);
    this.saveTrades();
    this.notify();
  }
}

// Global single database instance
const db = new RealtimeDatabase();

/* ═══════════════════════════════════════════
   Helper Metrics calculations
   ═══════════════════════════════════════════ */

function buildDailyLogs(trades: Trade[]): Map<string, DailyLog> {
  const map = new Map<string, DailyLog>();

  for (const trade of trades) {
    const dateKey = trade.createdAt.slice(0, 10);
    if (!map.has(dateKey)) {
      map.set(dateKey, {
        date: dateKey,
        trades: [],
        totalPnl: 0,
        winCount: 0,
        lossCount: 0,
        breakevenCount: 0,
      });
    }
    const log = map.get(dateKey)!;
    log.trades.push(trade);
    log.totalPnl += trade.pnl;
    if (trade.outcome === 'Win') log.winCount++;
    else if (trade.outcome === 'Loss') log.lossCount++;
    else log.breakevenCount++;
  }

  return map;
}

function buildMetrics(
  trades: Trade[],
  dailyLogs: Map<string, DailyLog>
): PortfolioMetrics {
  const total = trades.length;
  const wins = trades.filter((t) => t.outcome === 'Win').length;
  const winRate = total > 0 ? (wins / total) * 100 : 0;
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const avgRR =
    total > 0 ? trades.reduce((s, t) => s + t.riskReward, 0) / total : 0;

  let bestDay: PortfolioMetrics['bestDay'] = null;
  let worstDay: PortfolioMetrics['worstDay'] = null;
  for (const [, log] of dailyLogs) {
    if (!bestDay || log.totalPnl > bestDay.pnl)
      bestDay = { date: log.date, pnl: log.totalPnl };
    if (!worstDay || log.totalPnl < worstDay.pnl)
      worstDay = { date: log.date, pnl: log.totalPnl };
  }

  const sortedDates = Array.from(dailyLogs.keys()).sort();
  let cumPnl = 0;
  const equityCurve = sortedDates.map((date) => {
    cumPnl += dailyLogs.get(date)!.totalPnl;
    return { date, cumPnl };
  });

  let streak: PortfolioMetrics['currentStreak'] = { type: 'None', count: 0 };
  const sorted = [...trades].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  if (sorted.length > 0) {
    const first = sorted[0].outcome;
    if (first === 'Win' || first === 'Loss') {
      streak = { type: first, count: 0 };
      for (const t of sorted) {
        if (t.outcome === first) streak.count++;
        else break;
      }
    }
  }

  return {
    totalTrades: total,
    winRate,
    totalPnl,
    avgRiskReward: avgRR,
    bestDay,
    worstDay,
    currentStreak: streak,
    equityCurve,
  };
}

/* ═══════════════════════════════════════════
   Context Definition
   ═══════════════════════════════════════════ */

interface ProfileContextValue {
  profiles: Profile[];
  activeProfile: Profile | null;
  activeProfileId: string | null;
  selectProfile: (id: string | null) => void;
  createProfile: (name: string, avatarUrl: string) => Profile;
  isLoaded: boolean;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync profiles and handle hydration
  useEffect(() => {
    setProfiles(db.getProfiles());

    // Load active profile from localStorage if any
    const savedActiveId = localStorage.getItem('trading-journal-active-profile-id');
    if (savedActiveId) {
      setActiveProfileId(savedActiveId);
    }
    setIsLoaded(true);

    // Subscribe to DB changes
    const unsubscribe = db.subscribe(() => {
      setProfiles(db.getProfiles());
    });
    return () => unsubscribe();
  }, []);

  const selectProfile = useCallback((id: string | null) => {
    setActiveProfileId(id);
    if (id) {
      localStorage.setItem('trading-journal-active-profile-id', id);
    } else {
      localStorage.removeItem('trading-journal-active-profile-id');
    }
  }, []);

  const createProfile = useCallback((name: string, avatarUrl: string) => {
    return db.addProfile(name, avatarUrl);
  }, []);

  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId) || null;
  }, [profiles, activeProfileId]);

  const value = useMemo(
    () => ({
      profiles,
      activeProfile,
      activeProfileId,
      selectProfile,
      createProfile,
      isLoaded,
    }),
    [profiles, activeProfile, activeProfileId, selectProfile, createProfile, isLoaded]
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfiles() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfiles must be used within a ProfileProvider');
  return ctx;
}

/* ═══════════════════════════════════════════
   Real-Time custom hook for trades
   ═══════════════════════════════════════════ */

export function useTrades(profileId: string | null) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAndSync = useCallback(() => {
    if (!profileId) {
      setTrades([]);
      setLoading(false);
      return;
    }
    setTrades(db.getTrades(profileId));
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    setLoading(true);
    fetchAndSync();

    // Subscribe to real-time sync database notifications
    const unsubscribe = db.subscribe(() => {
      fetchAndSync();
    });

    return () => unsubscribe();
  }, [fetchAndSync]);

  const addTrade = useCallback(
    (tradeInput: Omit<Trade, 'id' | 'profileId' | 'pnl' | 'outcome'>) => {
      if (!profileId) return;
      const { direction, entryPrice, exitPrice, positionSize } = tradeInput;
      const rawPnl = direction === 'Long'
        ? (exitPrice - entryPrice) * positionSize
        : (entryPrice - exitPrice) * positionSize;
      const pnl = Number(rawPnl.toFixed(2));

      let outcome: 'Win' | 'Loss' | 'Breakeven' = 'Breakeven';
      if (pnl > 0.005) {
        outcome = 'Win';
      } else if (pnl < -0.005) {
        outcome = 'Loss';
      }

      db.addTrade({
        ...tradeInput,
        profileId,
        pnl,
        outcome,
      });
    },
    [profileId]
  );

  const updateTrade = useCallback(
    (id: string, tradeInput: Omit<Trade, 'id' | 'profileId' | 'pnl' | 'outcome'>) => {
      const { direction, entryPrice, exitPrice, positionSize } = tradeInput;
      const rawPnl = direction === 'Long'
        ? (exitPrice - entryPrice) * positionSize
        : (entryPrice - exitPrice) * positionSize;
      const pnl = Number(rawPnl.toFixed(2));

      let outcome: 'Win' | 'Loss' | 'Breakeven' = 'Breakeven';
      if (pnl > 0.005) {
        outcome = 'Win';
      } else if (pnl < -0.005) {
        outcome = 'Loss';
      }

      db.updateTrade(id, {
        ...tradeInput,
        pnl,
        outcome,
      });
    },
    []
  );

  const deleteTrade = useCallback((id: string) => {
    db.deleteTrade(id);
  }, []);

  const dailyLogs = useMemo(() => buildDailyLogs(trades), [trades]);
  const metrics = useMemo(() => buildMetrics(trades, dailyLogs), [trades, dailyLogs]);

  const getDayLog = useCallback(
    (date: string) => dailyLogs.get(date),
    [dailyLogs]
  );

  return {
    trades,
    loading,
    metrics,
    dailyLogs,
    addTrade,
    updateTrade,
    deleteTrade,
    getDayLog,
  };
}
