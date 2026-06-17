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
import { useRouter, usePathname } from 'next/navigation';
import type { Profile, Trade, FundingTransaction } from '@/types';
import { supabase } from '@/lib/supabase';
import { buildDailyLogs, buildMetrics } from '@/lib/metrics';

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
   Context Definition
   ═══════════════════════════════════════════ */

interface ProfileContextValue {
  profiles: Profile[];
  activeProfile: Profile | null;
  activeProfileId: string | null;
  selectProfile: (id: string | null) => void;
  createProfile: (name: string, avatarUrl: string) => Promise<void>;
  updateProfileCurrency: (id: string, currency: 'USD' | 'CENT') => Promise<void>;
  isLoaded: boolean;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [session, setSession] = useState<any>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) {
        setActiveProfileId(session.user.id);
      }
      setAuthChecked(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        setActiveProfileId(session.user.id);
      } else {
        setActiveProfileId(null);
        setProfiles([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (authChecked && !session && pathname !== '/login') {
      router.replace('/login');
    }
  }, [authChecked, session, pathname, router]);

  // Sync profiles from Supabase and listen for realtime updates
  const fetchProfiles = useCallback(async () => {
    if (!session?.user?.id) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[Supabase] Error fetching profiles:', error.message, error.details, error.hint);
    } else if (data) {
      setProfiles(
        data.map((p) => ({
          id: p.id,
          name: p.name,
          avatarUrl: p.avatar_url,
          accountCurrency: p.account_currency || 'USD',
          createdAt: p.created_at,
        }))
      );
    }
    setIsLoaded(true);
  }, [session]);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    fetchProfiles();

    // Subscribe to realtime profiles updates
    const channel = supabase
      .channel('realtime_profiles_' + Math.random().toString(36).substring(2, 9))
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
  }, [session, fetchProfiles]);

  const selectProfile = useCallback((id: string | null) => {
    // No longer functional in SaaS mode, the profile is rigidly tied to the user
    setActiveProfileId(id);
  }, []);

  const createProfile = async (name: string, avatarUrl: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .insert({ name, avatar_url: avatarUrl })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error creating profile:', error.message);
      throw error;
    }

    if (data) {
      setActiveProfileId(data.id);
      await fetchProfiles();
    }
  };

  const updateProfileCurrency = async (id: string, currency: 'USD' | 'CENT') => {
    const { error } = await supabase
      .from('profiles')
      .update({ account_currency: currency })
      .eq('id', id);

    if (error) {
      console.error('[Supabase] Error updating profile currency:', error.message);
      throw error;
    }

    await fetchProfiles();
  };

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
      updateProfileCurrency,
      isLoaded,
    }),
    [profiles, activeProfile, activeProfileId, selectProfile, createProfile, updateProfileCurrency, isLoaded]
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
      console.error('[Supabase] Error fetching trades:', error.message, error.details, error.hint);
    } else if (data) {
      setTrades(
        data.map((t) => ({
          id: t.id,
          profileId: t.profile_id,
          pair: t.pair,
          direction: t.direction as 'Long' | 'Short',
          entryPrice: Number(t.entry_price),
          exitPrice: t.exit_price !== null && t.exit_price !== undefined ? Number(t.exit_price) : undefined,
          positionSize: Number(t.position_size),
          profitLevel: t.profit_level ? Number(t.profit_level) : undefined,
          stopLevel: t.stop_level ? Number(t.stop_level) : undefined,
          pnl: t.pnl !== null && t.pnl !== undefined ? Number(t.pnl) : undefined,
          outcome: t.outcome as 'Win' | 'Loss' | 'Breakeven',
          riskReward: Number(t.risk_reward),
          notes: t.notes || '',
          images: t.images || [],
          image_url: t.image_url || '',
          entryTime: t.entry_time || undefined,
          exitTime: t.exit_time || undefined,
          session: t.session || undefined,
          emotion: t.emotion as any || undefined,
          status: (t.status as 'OPEN' | 'CLOSED' | 'PLAN') || 'CLOSED',
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
      .channel(`realtime_trades_${profileId}_` + Math.random().toString(36).substring(2, 9))
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
    async (tradeInput: Omit<Trade, 'id' | 'profileId' | 'pnl' | 'outcome'> & { status?: 'OPEN' | 'CLOSED' | 'PLAN' }) => {
      if (!profileId) return;
      const { direction, entryPrice, exitPrice, positionSize, status } = tradeInput;

      // If creating an OPEN trade, do not compute pnl or outcome and store nulls
      let pnl: number | null = null;
      let outcome: 'Win' | 'Loss' | 'Breakeven' = 'Breakeven';

      if (status !== 'OPEN' && exitPrice !== undefined && exitPrice !== null) {
        const rawPnl = direction === 'Long'
          ? (exitPrice - entryPrice) * positionSize
          : (entryPrice - exitPrice) * positionSize;
        pnl = Number(rawPnl.toFixed(2));

        if (pnl > 0.005) outcome = 'Win';
        else if (pnl < -0.005) outcome = 'Loss';
        else outcome = 'Breakeven';
      }

      const { error } = await supabase
        .from('trades')
        .insert([
          {
            profile_id: profileId,
            pair: tradeInput.pair,
            direction,
            entry_price: entryPrice,
            exit_price: status === 'OPEN' || status === 'PLAN' ? null : exitPrice,
            position_size: positionSize,
            profit_level: tradeInput.profitLevel ?? null,
            stop_level: tradeInput.stopLevel ?? null,
            pnl: pnl,
            outcome: status === 'OPEN' || status === 'PLAN' ? null : outcome,
            risk_reward: tradeInput.riskReward,
            notes: tradeInput.notes,
            images: tradeInput.images ?? [],
            image_url: tradeInput.image_url ?? '',
            entry_time: tradeInput.entryTime ?? null,
            exit_time: tradeInput.exitTime ?? null,
            session: tradeInput.session ?? null,
            emotion: tradeInput.emotion ?? null,
            status: status ?? 'CLOSED',
            created_at: tradeInput.createdAt,
          },
        ]);

      if (error) {
        console.error('[Supabase] Error saving trade:', error.message, error.details, error.hint);
        throw error;
      }
    },
    [profileId]
  );

  const updateTrade = useCallback(
    async (id: string, tradeInput: Omit<Trade, 'id' | 'profileId' | 'pnl' | 'outcome'> & { status?: 'OPEN' | 'CLOSED' | 'PLAN' }) => {
      const { direction, entryPrice, exitPrice, positionSize, status } = tradeInput;

      let pnl: number | null = null;
      let outcome: 'Win' | 'Loss' | 'Breakeven' | null = null;

      if (status !== 'OPEN' && exitPrice !== undefined && exitPrice !== null) {
        const rawPnl = direction === 'Long'
          ? (exitPrice - entryPrice) * positionSize
          : (entryPrice - exitPrice) * positionSize;
        pnl = Number(rawPnl.toFixed(2));

        if (pnl > 0.005) outcome = 'Win';
        else if (pnl < -0.005) outcome = 'Loss';
        else outcome = 'Breakeven';
      }

      const { error } = await supabase
        .from('trades')
        .update({
          pair: tradeInput.pair,
          direction,
          entry_price: entryPrice,
          exit_price: status === 'OPEN' || status === 'PLAN' ? null : exitPrice,
          position_size: positionSize,
          profit_level: tradeInput.profitLevel ?? null,
          stop_level: tradeInput.stopLevel ?? null,
          pnl: pnl,
          outcome: status === 'OPEN' || status === 'PLAN' ? null : outcome,
          risk_reward: tradeInput.riskReward,
          notes: tradeInput.notes,
          images: tradeInput.images ?? [],
          image_url: tradeInput.image_url ?? '',
          entry_time: tradeInput.entryTime ?? null,
          exit_time: tradeInput.exitTime ?? null,
          session: tradeInput.session ?? null,
          emotion: tradeInput.emotion ?? null,
          status: status ?? 'CLOSED',
          created_at: tradeInput.createdAt,
        })
        .eq('id', id);

      if (error) {
        console.error('[Supabase] Error updating trade:', error.message, error.details, error.hint);
        throw error;
      }
    },
    []
  );

  const bulkImportTrades = useCallback(
    async (rows: Omit<Trade, 'id' | 'profileId' | 'pnl' | 'outcome'>[]) => {
      if (!profileId || rows.length === 0) return;

      const payload = rows.map((tradeInput) => {
        const { direction, entryPrice, exitPrice, positionSize } = tradeInput;
        const exitVal = exitPrice ?? entryPrice;
        const rawPnl =
          direction === 'Long'
            ? (exitVal - entryPrice) * positionSize
            : (entryPrice - exitVal) * positionSize;
        const pnl = Number(rawPnl.toFixed(2));

        let outcome: 'Win' | 'Loss' | 'Breakeven' = 'Breakeven';
        if (pnl > 0.005) outcome = 'Win';
        else if (pnl < -0.005) outcome = 'Loss';

        return {
          profile_id: profileId,
          pair: tradeInput.pair,
          direction,
          entry_price: entryPrice,
          exit_price: exitPrice,
          position_size: positionSize,
          profit_level: tradeInput.profitLevel ?? null,
          stop_level: tradeInput.stopLevel ?? null,
          pnl,
          outcome,
          risk_reward: tradeInput.riskReward,
          notes: tradeInput.notes || '',
          images: tradeInput.images || [],
          image_url: tradeInput.image_url || '',
          entry_time: tradeInput.entryTime ?? null,
          exit_time: tradeInput.exitTime ?? null,
          session: tradeInput.session ?? null,
          emotion: tradeInput.emotion ?? null,
          created_at: tradeInput.createdAt,
        };
      });

      const { error } = await supabase.from('trades').insert(payload);

      if (error) {
        console.error('[Supabase] Bulk import error:', error.message, error.details, error.hint);
        throw error;
      }
    },
    [profileId]
  );

  const deleteTrade = useCallback(async (id: string) => {
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Supabase] Error deleting trade:', error.message, error.details, error.hint);
      throw error;
    }
  }, []);

  // Only CLOSED trades feed into performance metrics, daily logs, calendar, and equity curve
  const closedTrades = useMemo(() => trades.filter(t => t.status === 'CLOSED'), [trades]);
  const dailyLogs = useMemo(() => buildDailyLogs(closedTrades), [closedTrades]);
  const metrics = useMemo(() => buildMetrics(closedTrades, dailyLogs), [closedTrades, dailyLogs]);

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
    bulkImportTrades,
    deleteTrade,
    getDayLog,
  };
}

/* ═══════════════════════════════════════════
   Wallet Hook
   ═══════════════════════════════════════════ */

export function useWallet(profileId: string | null) {
  const [transactions, setTransactions] = useState<import('@/types').FundingTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!profileId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('funding_transactions')
      .select('*')
      .eq('profile_id', profileId)
      .order('date', { ascending: false });

    if (error) {
      console.error('[Supabase] Error fetching wallet:', error.message);
    } else if (data) {
      setTransactions(
        data.map((t) => ({
          id: t.id,
          profileId: t.profile_id,
          type: t.type as 'DEPOSIT' | 'WITHDRAWAL',
          amount: Number(t.amount),
          date: t.date,
          notes: t.notes,
        }))
      );
    }
    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    fetchTransactions();

    if (!profileId) return;

    const channel = supabase
      .channel('realtime_funding_' + profileId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'funding_transactions', filter: `profile_id=eq.${profileId}` },
        () => fetchTransactions()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTransactions, profileId]);

  const addTransaction = useCallback(async (type: 'DEPOSIT' | 'WITHDRAWAL', amount: number, notes?: string) => {
    if (!profileId) return;
    const { error } = await supabase.from('funding_transactions').insert({
      profile_id: profileId,
      type,
      amount,
      notes,
    });
    if (error) {
      console.error('[Supabase] Error adding transaction:', error.message);
      throw error;
    }
  }, [profileId]);

  const deleteTransaction = useCallback(async (id: string) => {
    const { error } = await supabase.from('funding_transactions').delete().eq('id', id);
    if (error) {
      console.error('[Supabase] Error deleting transaction:', error.message);
      throw error;
    }
  }, []);

  const { totalDeposits, totalWithdrawals, netFunding } = useMemo(() => {
    let dep = 0;
    let wit = 0;
    transactions.forEach(t => {
      if (t.type === 'DEPOSIT') dep += t.amount;
      if (t.type === 'WITHDRAWAL') wit += t.amount;
    });
    return {
      totalDeposits: dep,
      totalWithdrawals: wit,
      netFunding: dep - wit,
    };
  }, [transactions]);

  return {
    transactions,
    loading,
    totalDeposits,
    totalWithdrawals,
    netFunding,
    addTransaction,
    deleteTransaction,
  };
}
