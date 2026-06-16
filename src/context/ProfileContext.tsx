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
import { supabase } from '@/lib/supabase';

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
  createProfile: (name: string, avatarUrl: string) => Promise<void>;
  isLoaded: boolean;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Sync profiles from Supabase and listen for realtime updates
  const fetchProfiles = useCallback(async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Supabase] Error fetching profiles:', error);
    } else if (data) {
      setProfiles(
        data.map((p) => ({
          id: p.id,
          name: p.name,
          avatarUrl: p.avatar_url,
          createdAt: p.created_at,
        }))
      );
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    fetchProfiles();

    // Load active profile from localStorage if any
    const savedActiveId = localStorage.getItem('trading-journal-active-profile-id');
    if (savedActiveId) {
      setActiveProfileId(savedActiveId);
    }

    // Subscribe to realtime profiles updates
    const channel = supabase
      .channel('realtime_profiles')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles' },
        () => {
          fetchProfiles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchProfiles]);

  const selectProfile = useCallback((id: string | null) => {
    setActiveProfileId(id);
    if (id) {
      localStorage.setItem('trading-journal-active-profile-id', id);
    } else {
      localStorage.removeItem('trading-journal-active-profile-id');
    }
  }, []);

  const createProfile = useCallback(async (name: string, avatarUrl: string) => {
    const { error } = await supabase
      .from('profiles')
      .insert([{ name, avatar_url: avatarUrl }]);

    if (error) {
      console.error('[Supabase] Error creating profile:', error);
      throw error;
    }
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
   Real-Time custom hook for trades linked to Supabase
   ═══════════════════════════════════════════ */

export function useTrades(profileId: string | null) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTrades = useCallback(async () => {
    if (!profileId) {
      setTrades([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from('trades')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error fetching trades:', error);
    } else if (data) {
      setTrades(
        data.map((t) => ({
          id: t.id,
          profileId: t.profile_id,
          pair: t.pair,
          direction: t.direction as 'Long' | 'Short',
          entryPrice: Number(t.entry_price),
          exitPrice: Number(t.exit_price),
          positionSize: Number(t.position_size),
          profitLevel: t.profit_level ? Number(t.profit_level) : undefined,
          stopLevel: t.stop_level ? Number(t.stop_level) : undefined,
          pnl: Number(t.pnl),
          outcome: t.outcome as 'Win' | 'Loss' | 'Breakeven',
          riskReward: Number(t.risk_reward),
          notes: t.notes || '',
          images: t.images || [],
          createdAt: t.created_at,
        }))
      );
    }
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    setLoading(true);
    fetchTrades();

    if (!profileId) return;

    // Subscribe to realtime trades updates filtered by profile ID
    const channel = supabase
      .channel(`realtime_trades_${profileId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trades', filter: `profile_id=eq.${profileId}` },
        () => {
          fetchTrades();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profileId, fetchTrades]);

  const addTrade = useCallback(
    async (tradeInput: Omit<Trade, 'id' | 'profileId' | 'pnl' | 'outcome'>) => {
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

      const { error } = await supabase
        .from('trades')
        .insert([
          {
            profile_id: profileId,
            pair: tradeInput.pair,
            direction,
            entry_price: entryPrice,
            exit_price: exitPrice,
            position_size: positionSize,
            profit_level: tradeInput.profitLevel,
            stop_level: tradeInput.stopLevel,
            pnl,
            outcome,
            risk_reward: tradeInput.riskReward,
            notes: tradeInput.notes,
            images: tradeInput.images,
            created_at: tradeInput.createdAt,
          },
        ]);

      if (error) {
        console.error('[Supabase] Error saving trade:', error);
        throw error;
      }
    },
    [profileId]
  );

  const updateTrade = useCallback(
    async (id: string, tradeInput: Omit<Trade, 'id' | 'profileId' | 'pnl' | 'outcome'>) => {
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

      const { error } = await supabase
        .from('trades')
        .update({
          pair: tradeInput.pair,
          direction,
          entry_price: entryPrice,
          exit_price: exitPrice,
          position_size: positionSize,
          profit_level: tradeInput.profitLevel,
          stop_level: tradeInput.stopLevel,
          pnl,
          outcome,
          risk_reward: tradeInput.riskReward,
          notes: tradeInput.notes,
          images: tradeInput.images,
          created_at: tradeInput.createdAt,
        })
        .eq('id', id);

      if (error) {
        console.error('[Supabase] Error updating trade:', error);
        throw error;
      }
    },
    []
  );

  const deleteTrade = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Supabase] Error deleting trade:', error);
      throw error;
    }
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
