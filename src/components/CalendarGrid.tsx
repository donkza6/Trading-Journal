'use client';

import React from 'react';
import { useTrades } from '@/context/TradeContext';

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
  const { dailyLogs } = useTrades();

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
    if (pnl > 0) {
      bgClass = 'bg-profit-bg';
      borderClass = 'border-profit/20';
      pnlColor = 'text-profit';
    } else if (pnl < 0) {
      bgClass = 'bg-loss-bg';
      borderClass = 'border-loss/20';
      pnlColor = 'text-loss';
    } else {
      bgClass = 'bg-breakeven-bg';
      borderClass = 'border-breakeven/15';
      pnlColor = 'text-breakeven';
    }
  }

  if (isToday) {
    borderClass = 'border-journal-text';
    bgClass = 'bg-journal-elevated';
  }

  if (isSelected) {
    borderClass = 'border-accent-blue';
    bgClass = 'bg-accent-blue-bg';
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
        rounded-[var(--radius-button)] border-[1.5px] p-1
        transition-all duration-150 ease-out cursor-pointer
        hover:not-disabled:-translate-y-0.5 hover:not-disabled:shadow-card-hover
        hover:not-disabled:border-border-medium
        active:not-disabled:scale-[0.97]
        disabled:cursor-default disabled:opacity-40
        max-md:min-h-[56px] max-md:aspect-auto
        max-sm:min-h-[48px] max-sm:rounded-md max-sm:gap-px
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
          ${isToday ? 'bg-journal-text text-journal-text-inverse w-6 h-6 rounded-full flex items-center justify-center text-[0.78rem] max-sm:w-5 max-sm:h-5 max-sm:text-[0.68rem]' : ''}
        `}
      >
        {day}
      </span>

      {/* P&L display */}
      {hasTrades && pnl !== null && (
        <span
          className={`font-mono text-[0.68rem] font-bold leading-none tracking-tight max-md:text-[0.6rem] max-sm:text-[0.55rem] ${pnlColor}`}
        >
          {pnl >= 0 ? '+' : ''}
          {pnl.toFixed(0)}
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
                  ? 'bg-profit'
                  : pnl !== null && pnl < 0
                    ? 'bg-loss'
                    : 'bg-journal-text-muted'
              }`}
            />
          ))}
          {tradeCount > 4 && (
            <span className="text-[0.55rem] font-bold text-journal-text-muted leading-none">
              +
            </span>
          )}
        </div>
      )}
    </button>
  );
}
