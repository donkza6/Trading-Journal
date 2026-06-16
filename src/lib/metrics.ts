import type { Trade, DailyLog, PortfolioMetrics } from '@/types';

export function buildDailyLogs(trades: Trade[]): Map<string, DailyLog> {
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

export function buildMetrics(
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

export function computeMetrics(trades: Trade[]): PortfolioMetrics {
  const dailyLogs = buildDailyLogs(trades);
  return buildMetrics(trades, dailyLogs);
}
