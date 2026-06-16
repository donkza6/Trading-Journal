'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfiles, useTrades, AVATARS } from '@/context/ProfileContext';
import CalendarGrid from '@/components/CalendarGrid';
import TradeModal from '@/components/TradeModal';
import DashboardSummary from '@/components/DashboardSummary';
import DataManagement from '@/components/DataManagement';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Activity,
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

  useEffect(() => {
    if (isLoaded && !activeProfileId) {
      router.replace('/');
    }
  }, [isLoaded, activeProfileId, router]);

  const { trades, metrics, dailyLogs } = useTrades(activeProfileId);

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

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
        <div className="flex items-center gap-4 max-md:w-full max-md:justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-neutral-800" />
            <h1 className="text-[1.4rem] font-black tracking-tight text-journal-text max-sm:text-[1.15rem]">
              Trading Journal
            </h1>
          </div>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200/60 select-none text-[0.82rem] font-bold"
            style={{ backgroundColor: activeAvatar?.bg }}
          >
            <span
              className="w-5 h-5 rounded-full text-[0.65rem] font-black tracking-wider flex items-center justify-center select-none"
              style={{ backgroundColor: activeAvatar?.bg, color: activeAvatar?.color }}
            >
              {activeAvatar?.initials}
            </span>
            <span className="truncate max-w-[100px]" style={{ color: activeAvatar?.color }}>
              {activeProfile.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 max-md:w-full max-md:justify-between max-md:flex-wrap">
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
          <DataManagement />
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
        <DashboardSummary trades={trades} />

        {/* ═══ Calendar Section ═══ */}
        <section className="animate-fade-in" style={{ animationDelay: '200ms' }}>
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

      {showModal && selectedDate && (
        <TradeModal date={selectedDate} onClose={closeModal} />
      )}
    </div>
  );
}

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
