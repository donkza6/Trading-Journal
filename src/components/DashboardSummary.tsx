'use client';

import React, { useMemo, useState } from 'react';
import type { Trade } from '@/types';
import { computeMetrics } from '@/lib/metrics';
import EquityCurveChart from '@/components/EquityCurveChart';
import {
  Filter,
  BarChart3,
  Target,
  TrendingUp,
  Scale,
  Flame,
  Snowflake,
  TrendingDown,
  Activity,
} from 'lucide-react';

type AssetFilter = 'all' | string;
type TypeFilter = 'all' | 'Long' | 'Short';
type PnlFilter = 'all' | 'win' | 'loss';

interface DashboardSummaryProps {
  trades: Trade[];
}

export default function DashboardSummary({ trades }: DashboardSummaryProps) {
  const [assetFilter, setAssetFilter] = useState<AssetFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [pnlFilter, setPnlFilter] = useState<PnlFilter>('all');

  const assets = useMemo(() => {
    const unique = [...new Set(trades.map((t) => t.pair))].sort();
    return unique;
  }, [trades]);

  const filteredTrades = useMemo(() => {
    return trades.filter((trade) => {
      if (assetFilter !== 'all' && trade.pair !== assetFilter) return false;
      if (typeFilter !== 'all' && trade.direction !== typeFilter) return false;
      if (pnlFilter === 'win' && trade.outcome !== 'Win') return false;
      if (pnlFilter === 'loss' && trade.outcome !== 'Loss') return false;
      return true;
    });
  }, [trades, assetFilter, typeFilter, pnlFilter]);

  const metrics = useMemo(
    () => computeMetrics(filteredTrades),
    [filteredTrades]
  );

  const advancedStats = useMemo(() => {
    // Max Drawdown from equity curve
    let maxDrawdown = 0;
    let peak = -Infinity;
    for (const p of metrics.equityCurve) {
      if (p.cumPnl > peak) peak = p.cumPnl;
      const dd = peak - p.cumPnl;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    const winningTrades = filteredTrades.filter((t) => t.outcome === 'Win');
    const losingTrades = filteredTrades.filter((t) => t.outcome === 'Loss');
    const avgWin = winningTrades.length > 0 ? winningTrades.reduce((s, t) => s + t.pnl, 0) / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((s, t) => s + t.pnl, 0) / losingTrades.length : 0;

    // Longest losing streak (consecutive losing trades)
    const sortedByTime = [...filteredTrades].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    let longestLossStreak = 0;
    let cur = 0;
    for (const t of sortedByTime) {
      if (t.outcome === 'Loss') {
        cur += 1;
        if (cur > longestLossStreak) longestLossStreak = cur;
      } else {
        cur = 0;
      }
    }

    return {
      maxDrawdown,
      avgWin,
      avgLoss,
      longestLossStreak,
    };
  }, [metrics.equityCurve, filteredTrades]);

  const hasActiveFilters =
    assetFilter !== 'all' || typeFilter !== 'all' || pnlFilter !== 'all';

  const cards = [
    {
      icon: BarChart3,
      label: 'Total Trades',
      value: metrics.totalTrades.toString(),
      color: '',
    },
    {
      icon: Target,
      label: 'Win Rate',
      value: `${metrics.winRate.toFixed(1)}%`,
      color:
        metrics.winRate >= 50
          ? 'text-emerald-600'
          : metrics.winRate > 0
            ? 'text-rose-600'
            : '',
    },
    {
      icon: TrendingUp,
      label: 'Total P&L',
      value: `${metrics.totalPnl >= 0 ? '+' : ''}$${metrics.totalPnl.toFixed(2)}`,
      color: metrics.totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600',
    },
    {
      icon: Scale,
      label: 'Avg R:R',
      value: metrics.avgRiskReward.toFixed(2),
      color:
        metrics.avgRiskReward >= 1
          ? 'text-emerald-600'
          : metrics.avgRiskReward > 0
            ? 'text-amber-600'
            : '',
    },
  ];

  const selectCls =
    'text-[0.78rem] font-semibold py-2 px-3 rounded-xl border border-neutral-200/60 bg-journal-elevated text-journal-text outline-none cursor-pointer hover:border-neutral-300 transition-colors focus:border-journal-text focus:shadow-[0_0_0_3px_rgba(42,38,38,0.08)]';

  return (
    <section className="mb-2">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4 p-4 bg-journal-card rounded-2xl border border-neutral-200/50 shadow-sm max-sm:p-3">
        <div className="flex items-center gap-2 text-journal-text-secondary">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Filters</span>
        </div>

        <select
          value={assetFilter}
          onChange={(e) => setAssetFilter(e.target.value)}
          className={selectCls}
          aria-label="Filter by asset"
        >
          <option value="all">All Assets</option>
          {assets.map((asset) => (
            <option key={asset} value={asset}>
              {asset}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
          className={selectCls}
          aria-label="Filter by type"
        >
          <option value="all">All Types</option>
          <option value="Long">Buy (Long)</option>
          <option value="Short">Sell (Short)</option>
        </select>

        <select
          value={pnlFilter}
          onChange={(e) => setPnlFilter(e.target.value as PnlFilter)}
          className={selectCls}
          aria-label="Filter by P&L status"
        >
          <option value="all">All Trades</option>
          <option value="win">Winning Trades</option>
          <option value="loss">Losing Trades</option>
        </select>

        {hasActiveFilters && (
          <span className="text-[0.72rem] font-semibold text-journal-text-muted ml-auto">
            Showing {filteredTrades.length} of {trades.length} trades
          </span>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1 max-sm:gap-2">
        {cards.map((card, i) => {
          const IconComponent = card.icon;
          return (
            <div
              key={card.label}
              className="bg-journal-card rounded-2xl p-6 border border-neutral-200/50 shadow-sm animate-slide-up hover:-translate-y-1 hover:shadow-md hover:border-neutral-300/80 transition-all duration-200 max-sm:p-4"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <IconComponent className="w-4 h-4 text-neutral-500" />
                <span className="text-gray-500 text-xs font-semibold uppercase tracking-wider">
                  {card.label}
                </span>
              </div>
              <div
                className={`font-mono text-3xl font-bold tracking-tight ${card.color || 'text-journal-text'} max-sm:text-2xl`}
              >
                {card.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* Streak badge */}
      {metrics.currentStreak.type !== 'None' && metrics.currentStreak.count > 1 && (
        <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-journal-card rounded-full border border-neutral-200/50 shadow-sm animate-fade-in hover:shadow-md hover:border-neutral-300 transition-all duration-200">
          {metrics.currentStreak.type === 'Win' ? (
            <Flame className="w-4 h-4 text-orange-500 animate-pulse" />
          ) : (
            <Snowflake className="w-4 h-4 text-blue-500" />
          )}
          <span className="text-xs font-semibold text-neutral-600">
            {metrics.currentStreak.count} {metrics.currentStreak.type} streak
          </span>
        </div>
      )}

      {/* Equity curve */}
      {filteredTrades.length >= 1 && (
        <div
          className="mt-6 bg-journal-card rounded-2xl border border-neutral-200/50 shadow-sm p-6 animate-slide-up hover:shadow-md hover:border-neutral-300/80 transition-all duration-200 max-sm:p-4"
          style={{ animationDelay: '350ms' }}
        >
          <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4">
            Equity Curve
          </h3>
          <EquityCurveChart trades={filteredTrades} />
        </div>
      )}

      {/* Advanced psychological metrics row */}
      <div className="grid grid-cols-4 gap-4 mt-4 max-lg:grid-cols-2 max-sm:grid-cols-1">
        <div className="bg-journal-card rounded-2xl p-4 border border-neutral-200/50 shadow-sm flex items-center gap-3">
          <TrendingDown className="w-5 h-5 text-neutral-500" />
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Max Drawdown</div>
            <div className="font-mono font-bold text-lg">${advancedStats.maxDrawdown.toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-journal-card rounded-2xl p-4 border border-neutral-200/50 shadow-sm flex items-center gap-3">
          <Flame className="w-5 h-5 text-neutral-500" />
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Average Win</div>
            <div className="font-mono font-bold text-lg">${advancedStats.avgWin.toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-journal-card rounded-2xl p-4 border border-neutral-200/50 shadow-sm flex items-center gap-3">
          <Scale className="w-5 h-5 text-neutral-500" />
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Average Loss</div>
            <div className="font-mono font-bold text-lg">${advancedStats.avgLoss.toFixed(2)}</div>
          </div>
        </div>

        <div className="bg-journal-card rounded-2xl p-4 border border-neutral-200/50 shadow-sm flex items-center gap-3">
          <Activity className="w-5 h-5 text-neutral-500" />
          <div>
            <div className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Longest Losing Streak</div>
            <div className="font-mono font-bold text-lg">{advancedStats.longestLossStreak}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
