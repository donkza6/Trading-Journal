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
import type { Trade, DailyLog, PortfolioMetrics } from '@/types';

/* ═══════════════════════════════════════════
   Helper Functions
   ═══════════════════════════════════════════ */

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function calculatePnl(
  trade: Pick<Trade, 'direction' | 'entryPrice' | 'exitPrice' | 'positionSize'>
): number {
  const exit = trade.exitPrice !== undefined && trade.exitPrice !== null ? trade.exitPrice : trade.entryPrice;
  const diff =
    trade.direction === 'Long' ? exit - trade.entryPrice : trade.entryPrice - exit;
  return diff * trade.positionSize;
}

function getOutcome(pnl: number): Trade['outcome'] {
  if (pnl > 0.01) return 'Win';
  if (pnl < -0.01) return 'Loss';
  return 'Breakeven';
}

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
    log.totalPnl += trade.pnl ?? 0;
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
  const totalPnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
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

interface TradeContextValue {
  trades: Trade[];
  dailyLogs: Map<string, DailyLog>;
  metrics: PortfolioMetrics;
  addTrade: (
    input: Omit<Trade, 'id' | 'pnl' | 'outcome' | 'createdAt'> & {
      date: string;
    }
  ) => void;
  deleteTrade: (id: string) => void;
  getDayLog: (date: string) => DailyLog | undefined;
  isLoaded: boolean;
}

const TradeContext = createContext<TradeContextValue | null>(null);
const STORAGE_KEY = 'trading-journal-trades';

/* ═══════════════════════════════════════════
   Provider
   ═══════════════════════════════════════════ */

export function TradeProvider({ children }: { children: ReactNode }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTrades(JSON.parse(raw));
    } catch {
      console.warn('[TradeProvider] Failed to load from localStorage');
    }
    setIsLoaded(true);
  }, []);

  // Persist on change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trades));
    } catch {
      console.warn('[TradeProvider] Failed to persist to localStorage');
    }
  }, [trades, isLoaded]);

  const dailyLogs = useMemo(() => buildDailyLogs(trades), [trades]);
  const metrics = useMemo(
    () => buildMetrics(trades, dailyLogs),
    [trades, dailyLogs]
  );

  const addTrade = useCallback(
    (
      input: Omit<Trade, 'id' | 'pnl' | 'outcome' | 'createdAt'> & {
        date: string;
      }
    ) => {
      const pnl = calculatePnl(input);
      const outcome = getOutcome(pnl);
      const newTrade: Trade = {
        ...input,
        id: generateId(),
        pnl,
        outcome,
        createdAt: input.date + 'T12:00:00',
      };
      setTrades((prev) => [...prev, newTrade]);
    },
    []
  );

  const deleteTrade = useCallback((id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getDayLog = useCallback(
    (date: string) => dailyLogs.get(date),
    [dailyLogs]
  );

  const value = useMemo<TradeContextValue>(
    () => ({
      trades,
      dailyLogs,
      metrics,
      addTrade,
      deleteTrade,
      getDayLog,
      isLoaded,
    }),
    [trades, dailyLogs, metrics, addTrade, deleteTrade, getDayLog, isLoaded]
  );

  return (
    <TradeContext.Provider value={value}>{children}</TradeContext.Provider>
  );
}

/* ═══════════════════════════════════════════
   Hook
   ═══════════════════════════════════════════ */

export function useTrades(): TradeContextValue {
  const ctx = useContext(TradeContext);
  if (!ctx) throw new Error('useTrades must be used within a TradeProvider');
  return ctx;
}
