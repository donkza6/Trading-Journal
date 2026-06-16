'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfiles, useTrades, AVATARS } from '@/context/ProfileContext';
import CalendarGrid from '@/components/CalendarGrid';
import TradeModal from '@/components/TradeModal';
import {
  TrendingUp,
  Target,
  BarChart3,
  Scale,
  Users,
  Flame,
  Snowflake,
  ChevronLeft,
  ChevronRight,
  Activity
} from 'lucide-react';

/* ═══════════════════════════════════════════
   Main Journal Page (Active Profile Context)
   ═══════════════════════════════════════════ */

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
] as const;

export default function JournalPage() {
  const { activeProfile, activeProfileId, selectProfile, isLoaded } = useProfiles();
  const router = useRouter();

  // Guard routing - redirect to profile selection if not logged in
  useEffect(() => {
    if (isLoaded && !activeProfileId) {
      router.replace('/');
    }
  }, [isLoaded, activeProfileId, router]);

  const { metrics, dailyLogs } = useTrades(activeProfileId);

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  /* ── Month navigation ── */
  const goPrev = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };
  const goToday = () => {
    setMonth(today.getMonth());
    setYear(today.getFullYear());
  };

  const isCurrentMonth =
    month === today.getMonth() && year === today.getFullYear();

  /* ── Monthly aggregates ── */
  const { monthlyPnl, monthlyCount } = useMemo(() => {
    let pnl = 0;
    let count = 0;
    for (const [key, log] of dailyLogs) {
      const [y, m] = key.split('-').map(Number);
      if (y === year && m === month + 1) {
        pnl += log.totalPnl;
        count += log.trades.length;
      }
    }
    return { monthlyPnl: pnl, monthlyCount: count };
  }, [dailyLogs, month, year]);

  /* ── Day click ── */
  const handleDayClick = (date: string) => {
    setSelectedDate(date);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedDate(null);
  };

  const activeAvatar = useMemo(() => {
    if (!activeProfile) return null;
    return AVATARS.find((av) => av.id === activeProfile.avatarUrl) || AVATARS[0];
  }, [activeProfile]);

  /* ── Dashboard cards data ── */
  const cards = useMemo(() => {
    return [
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
  }, [metrics]);

  if (!isLoaded || !activeProfile) {
    return (
      <div className="min-h-screen bg-journal-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-journal-text border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-[1100px] mx-auto px-6 pb-12 pt-6 max-md:px-4 max-sm:px-3 max-sm:pt-3 max-sm:pb-8 animate-fade-in">
      {/* ═══ App Header ═══ */}
      <header className="flex items-center justify-between mb-8 pb-6 border-b border-neutral-200/50 max-md:flex-col max-md:items-start max-md:gap-4 max-md:mb-6 max-md:pb-4">
        {/* Left Side: Logo & Active Profile Info */}
        <div className="flex items-center gap-4 max-md:w-full max-md:justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-neutral-800" />
            <h1 className="text-[1.4rem] font-black tracking-tight text-journal-text max-sm:text-[1.15rem]">
              Trading Journal
            </h1>
          </div>
          {/* Active Profile Pill */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200/60 select-none text-[0.82rem] font-bold"
            style={{ backgroundColor: activeAvatar?.bg }}
          >
            <span className="w-5 h-5 rounded-full text-[0.65rem] font-black tracking-wider flex items-center justify-center select-none" style={{ backgroundColor: activeAvatar?.bg, color: activeAvatar?.color }}>
              {activeAvatar?.initials}
            </span>
            <span className="truncate max-w-[100px]" style={{ color: activeAvatar?.color }}>
              {activeProfile.name}
            </span>
          </div>
        </div>

        {/* Right Side: Switch Profile button */}
        <div className="flex items-center gap-4 max-md:w-full max-md:justify-between">
          {metrics.totalTrades > 0 && (
            <div className="flex flex-col items-end gap-0.5 max-md:items-start">
              <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-journal-text-muted">
                Profile P&L
              </span>
              <span
                className={`font-mono text-[1.05rem] font-extrabold ${metrics.totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {metrics.totalPnl >= 0 ? '+' : ''}${metrics.totalPnl.toFixed(2)}
              </span>
            </div>
          )}
          <button
            onClick={() => {
              selectProfile(null);
              router.push('/');
            }}
            className="text-[0.8rem] font-bold px-4 py-2 rounded-xl bg-journal-card border border-neutral-200/60 text-journal-text cursor-pointer hover:-translate-y-0.5 hover:shadow-sm transition-all active:scale-[0.97] flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Switch Profile
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-6">
        {/* ═══ Dashboard Summary ═══ */}
        <section className="mb-2">
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

          {/* Equity Curve */}
          {metrics.equityCurve.length > 1 && (
            <div
              className="mt-6 bg-journal-card rounded-2xl border border-neutral-200/50 shadow-sm p-6 animate-slide-up hover:shadow-md hover:border-neutral-300/80 transition-all duration-200 max-sm:p-4"
              style={{ animationDelay: '350ms' }}
            >
              <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-4">
                Equity Curve
              </h3>
              <EquityCurve data={metrics.equityCurve} />
            </div>
          )}
        </section>

        {/* ═══ Calendar Section ═══ */}
        <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          {/* Calendar header */}
          <div className="flex items-center justify-between mb-4 max-sm:flex-col max-sm:items-start max-sm:gap-2">
            <div className="flex items-center gap-1">
              <NavButton onClick={goPrev} label="Previous month">
                <ChevronLeft className="w-4 h-4" />
              </NavButton>
              <h2 className="text-lg font-bold min-w-[200px] text-center tracking-tight max-md:min-w-[160px] max-sm:text-base">
                {MONTH_NAMES[month]} {year}
              </h2>
              <NavButton onClick={goNext} label="Next month">
                <ChevronRight className="w-4 h-4" />
              </NavButton>
            </div>

            <div className="flex items-center gap-4">
              {monthlyCount > 0 && (
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-sm font-bold ${monthlyPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                  >
                    {monthlyPnl >= 0 ? '+' : ''}${monthlyPnl.toFixed(2)}
                  </span>
                  <span className="text-[0.78rem] text-journal-text-muted font-semibold">
                    {monthlyCount} trades
                  </span>
                </div>
              )}
              {!isCurrentMonth && (
                <button
                  onClick={goToday}
                  className="text-[0.8rem] font-semibold px-3.5 py-1.5 rounded-[var(--radius-button)] bg-transparent border-[1.5px] border-border-medium text-journal-text cursor-pointer hover:bg-journal-card hover:border-border-strong transition-all active:scale-[0.97]"
                >
                  Today
                </button>
              )}
            </div>
          </div>

          {/* Calendar card */}
          <div className="bg-journal-card rounded-2xl p-6 border border-neutral-200/50 shadow-sm hover:shadow-md hover:border-neutral-300/80 transition-all duration-300 max-md:p-4 max-sm:p-2">
            <CalendarGrid
              year={year}
              month={month}
              onDayClick={handleDayClick}
              selectedDate={selectedDate}
            />
          </div>
        </section>
      </main>

      {/* ═══ Trade Modal ═══ */}
      {showModal && selectedDate && (
        <TradeModal date={selectedDate} onClose={closeModal} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   Nav Button (arrow)
   ═══════════════════════════════════════════ */

function NavButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-button)] bg-transparent text-journal-text-secondary cursor-pointer hover:bg-journal-text/6 hover:text-journal-text transition-colors active:scale-[0.95]"
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════
   Equity Curve (SVG)
   ═══════════════════════════════════════════ */

function EquityCurve({
  data,
}: {
  data: { date: string; cumPnl: number }[];
}) {
  if (data.length < 2) return null;

  const W = 800;
  const H = 200;
  const pad = { t: 20, r: 20, b: 30, l: 60 };

  const vals = data.map((d) => d.cumPnl);
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals, 0);
  const range = max - min || 1;

  const x = (i: number) =>
    pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r);
  const y = (v: number) =>
    pad.t + (1 - (v - min) / range) * (H - pad.t - pad.b);

  const line = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d.cumPnl)}`)
    .join(' ');
  const area =
    line +
    ` L ${x(data.length - 1)} ${y(0)} L ${x(0)} ${y(0)} Z`;

  const positive = data[data.length - 1].cumPnl >= 0;
  const stroke = positive ? 'var(--color-profit)' : 'var(--color-loss)';

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      <defs>
        <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Zero line */}
      <line
        x1={pad.l}
        x2={W - pad.r}
        y1={y(0)}
        y2={y(0)}
        stroke="var(--color-border-medium)"
        strokeDasharray="4 4"
        strokeWidth="1"
      />
      <text
        x={pad.l - 8}
        y={y(0) + 4}
        textAnchor="end"
        fill="var(--color-journal-text-muted)"
        fontSize="11"
        fontFamily="var(--font-mono)"
      >
        $0
      </text>

      {/* Area */}
      <path d={area} fill="url(#eqGrad)" />

      {/* Line */}
      <path
        d={line}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* End dot */}
      <circle
        cx={x(data.length - 1)}
        cy={y(data[data.length - 1].cumPnl)}
        r="5"
        fill={stroke}
        stroke="var(--color-journal-card)"
        strokeWidth="2"
      />

      {/* Labels */}
      <text
        x={pad.l - 8}
        y={pad.t + 4}
        textAnchor="end"
        fill="var(--color-journal-text-muted)"
        fontSize="11"
        fontFamily="var(--font-mono)"
      >
        ${max.toFixed(0)}
      </text>
      <text
        x={pad.l - 8}
        y={H - pad.b + 4}
        textAnchor="end"
        fill="var(--color-journal-text-muted)"
        fontSize="11"
        fontFamily="var(--font-mono)"
      >
        ${min.toFixed(0)}
      </text>
      <text
        x={x(0)}
        y={H - 6}
        textAnchor="start"
        fill="var(--color-journal-text-muted)"
        fontSize="10"
        fontFamily="var(--font-mono)"
      >
        {data[0].date.slice(5)}
      </text>
      <text
        x={x(data.length - 1)}
        y={H - 6}
        textAnchor="end"
        fill="var(--color-journal-text-muted)"
        fontSize="10"
        fontFamily="var(--font-mono)"
      >
        {data[data.length - 1].date.slice(5)}
      </text>
    </svg>
  );
}
