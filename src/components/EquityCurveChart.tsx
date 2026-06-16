'use client';

import React, { useMemo } from 'react';
import type { Trade } from '@/types';
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface EquityCurveChartProps {
  trades: Trade[];
}

interface ChartPoint {
  label: string;
  date: string;
  cumPnl: number;
  pnl: number;
}

export default function EquityCurveChart({ trades }: EquityCurveChartProps) {
  const { data, isPositive } = useMemo(() => {
    const sorted = [...trades].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    let cumPnl = 0;
    const points: ChartPoint[] = sorted.map((trade, index) => {
      cumPnl += trade.pnl;
      return {
        label: `#${index + 1}`,
        date: trade.createdAt.slice(0, 10),
        cumPnl: Number(cumPnl.toFixed(2)),
        pnl: trade.pnl,
      };
    });

    return {
      data: points,
      isPositive: points.length > 0 ? points[points.length - 1].cumPnl >= 0 : true,
    };
  }, [trades]);

  if (data.length === 0) {
    return (
      <p className="text-sm text-journal-text-muted text-center py-8">
        No trade data to chart yet.
      </p>
    );
  }

  const strokeColor = isPositive ? '#16a34a' : '#dc2626';
  const fillColor = isPositive ? '#16a34a' : '#dc2626';

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} stopOpacity={0.22} />
            <stop offset="100%" stopColor={fillColor} stopOpacity={0} />
          </linearGradient>
        </defs>

        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#8a8585', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          dy={8}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          tick={{ fill: '#8a8585', fontSize: 11, fontFamily: 'var(--font-mono)' }}
          tickFormatter={(v: number) => `$${v}`}
          width={56}
        />

        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const point = payload[0].payload as ChartPoint;
            return (
              <div className="bg-journal-elevated border border-neutral-200/80 rounded-xl px-3 py-2 shadow-md text-[0.78rem]">
                <p className="font-semibold text-journal-text">{point.date}</p>
                <p className="font-mono text-journal-text-secondary">
                  Trade P&L: {point.pnl >= 0 ? '+' : ''}${point.pnl.toFixed(2)}
                </p>
                <p
                  className={`font-mono font-bold ${point.cumPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  Cumulative: {point.cumPnl >= 0 ? '+' : ''}${point.cumPnl.toFixed(2)}
                </p>
              </div>
            );
          }}
        />

        <Area
          type="monotone"
          dataKey="cumPnl"
          stroke={strokeColor}
          strokeWidth={2.5}
          fill="url(#equityGradient)"
          dot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: strokeColor, stroke: '#e8e8e8', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
