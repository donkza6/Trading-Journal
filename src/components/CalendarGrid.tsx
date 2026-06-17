'use client';

import React from 'react';
import { useProfiles, useTrades } from '@/context/ProfileContext';

/* ═══════════════════════════════════════════
   CalendarGrid – Monthly calendar with P&L
   ═══════════════════════════════════════════ */

interface CalendarGridProps {
  year: number;
  month: number; // 0‐indexed
  onDayClick: (date: string) => void;
  selectedDate: string | null;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export default function CalendarGrid({
  year,
  month,
  onDayClick,
  selectedDate,
}: CalendarGridProps) {
  const { activeProfileId } = useProfiles();
  const { dailyLogs } = useTrades(activeProfileId);

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDow = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Build cell array (null = empty leading/trailing slots)
  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="animate-fade-in">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="text-center text-[0.7rem] font-bold uppercase tracking-widest text-journal-text-muted py-2 select-none"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-[3px]">
        {cells.map((day, i) => {
          if (day === null) {
            return (
              <div
                key={`empty-${i}`}
                className="aspect-square min-h-[72px] rounded-[var(--radius-button)] md:min-h-[56px] sm-phone:min-h-[48px]"
              />
            );
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const log = dailyLogs.get(dateStr);
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;
          const isFuture = new Date(dateStr) > now;
          const pnl = log?.totalPnl ?? null;
          const count = log?.trades.length ?? 0;
          const hasTrades = count > 0;

          return (
            <DayCell
              key={dateStr}
              day={day}
              pnl={pnl}
              tradeCount={count}
              hasTrades={hasTrades}
              isToday={isToday}
              isSelected={isSelected}
              isFuture={isFuture}
              onClick={() => onDayClick(dateStr)}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   DayCell – Individual calendar cell
   ═══════════════════════════════════════════ */

interface DayCellProps {
  day: number;
  pnl: number | null;
  tradeCount: number;
  hasTrades: boolean;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
  onClick: () => void;
}

function DayCell({
  day,
  pnl,
  tradeCount,
  hasTrades,
  isToday,
  isSelected,
  isFuture,
  onClick,
}: DayCellProps) {
  // Compute dynamic classes
  let bgClass = 'bg-journal-card';
  let borderClass = 'border-transparent';
  let pnlColor = '';

  if (hasTrades && pnl !== null) {
    if (pnl > 0.01) {
      bgClass = 'bg-emerald-50 dark:bg-emerald-900/20';
      borderClass = 'border-emerald-200 dark:border-emerald-800/50';
      pnlColor = 'text-emerald-600 dark:text-emerald-400 font-bold';
    } else if (pnl < -0.01) {
      bgClass = 'bg-rose-50 dark:bg-rose-900/20';
      borderClass = 'border-rose-200 dark:border-rose-800/50';
      pnlColor = 'text-rose-600 dark:text-rose-400 font-bold';
    } else {
      bgClass = 'bg-amber-50 dark:bg-amber-900/20';
      borderClass = 'border-amber-200 dark:border-amber-800/50';
      pnlColor = 'text-amber-600 dark:text-amber-400 font-bold';
    }
  }

  if (isToday) {
    borderClass = 'border-neutral-800';
    bgClass = 'bg-neutral-100';
  }

  if (isSelected) {
    borderClass = 'border-neutral-900 ring-2 ring-neutral-900/15';
    bgClass = 'bg-neutral-50';
  }

  if (isFuture) {
    bgClass = 'bg-transparent';
    borderClass = 'border-transparent';
  }

  return (
    <button
      onClick={onClick}
      disabled={isFuture}
      className={`
        relative aspect-square min-h-[72px] flex flex-col items-center justify-center gap-0.5
        rounded-xl border-[1.5px] p-1.5
        transition-all duration-200 ease-out cursor-pointer
        hover:not-disabled:-translate-y-1 hover:not-disabled:shadow-md
        hover:not-disabled:border-neutral-300
        active:not-disabled:scale-[0.97]
        disabled:cursor-default disabled:opacity-40
        max-md:min-h-[56px] max-md:aspect-auto
        max-sm:min-h-[48px] max-sm:rounded-lg max-sm:gap-px
        ${bgClass} ${borderClass}
      `}
      aria-label={`Day ${day}${hasTrades ? `, ${tradeCount} trades, P&L $${pnl?.toFixed(2)}` : ''}`}
    >
      {/* Day number */}
      <span
        className={`
          text-[0.85rem] font-semibold leading-none
          max-md:text-[0.78rem] max-sm:text-[0.72rem]
          ${isFuture ? 'text-journal-text-muted' : 'text-journal-text'}
          ${isToday ? 'bg-neutral-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-[0.75rem] max-sm:w-5 max-sm:h-5 max-sm:text-[0.68rem]' : ''}
        `}
      >
        {day}
      </span>

      {/* P&L display */}
      {hasTrades && pnl !== null && (
        <span
          className={`font-mono text-[10px] tracking-tight max-md:text-[9px] max-sm:text-[8px] ${pnlColor}`}
        >
          {pnl >= 0 ? '+$' : '-$'}{Math.abs(pnl).toFixed(2)}
        </span>
      )}

      {/* Trade count dots */}
      {hasTrades && (
        <div className="flex items-center gap-0.5 mt-px max-md:hidden">
          {Array.from({ length: Math.min(tradeCount, 4) }).map((_, i) => (
            <span
              key={i}
              className={`w-1 h-1 rounded-full ${
                pnl !== null && pnl > 0
                  ? 'bg-emerald-500'
                  : pnl !== null && pnl < 0
                    ? 'bg-rose-500'
                    : 'bg-neutral-400'
              }`}
            />
          ))}
          {tradeCount > 4 && (
            <span className="text-[0.55rem] font-bold text-neutral-400 leading-none">
              +
            </span>
          )}
        </div>
      )}
    </button>
  );
}
