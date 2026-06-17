'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfiles, useTrades, AVATARS } from '@/context/ProfileContext';
import CalendarGrid from '@/components/CalendarGrid';
import TradeModal from '@/components/TradeModal';
import TradeDetailModal from '@/components/TradeDetailModal';
import WalletModal from '@/components/WalletModal';
import DashboardSummary from '@/components/DashboardSummary';
import DataManagement from '@/components/DataManagement';
import ActivePositions from '@/components/ActivePositions';
import FeedbackModal from '@/components/FeedbackModal';
import SettingsModal from '@/components/SettingsModal';
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Activity,
  Wallet,
  Download,
  LogOut,
  MessageSquarePlus,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Papa from 'papaparse';
import { toast } from 'sonner';

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
  const [modalTrade, setModalTrade] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailTrade, setDetailTrade] = useState<any | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<'All' | 'Asian' | 'London' | 'New York' | 'Overlap' | 'None'>('All');

  const dashboardTrades = useMemo(() => {
    let closed = trades.filter(t => t.status === 'CLOSED');
    if (sessionFilter !== 'All') {
      closed = closed.filter(t => t.session === sessionFilter);
    }
    return closed;
  }, [trades, sessionFilter]);

  const exportToCSV = () => {
    if (dashboardTrades.length === 0) {
      toast.error('No closed trades to export.');
      return;
    }

    const exportData = dashboardTrades.map(trade => ({
      Date: new Date(trade.createdAt).toISOString().split('T')[0],
      Pair: trade.pair,
      Direction: trade.direction,
      Status: trade.status,
      'Entry Price': trade.entryPrice,
      'Exit Price': trade.exitPrice || '',
      Size: trade.positionSize,
      'P&L': trade.pnl || '',
      Session: trade.session || '',
      Emotion: trade.emotion || '',
      Notes: trade.notes || '',
    }));

    const csv = Papa.unparse(exportData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeProfile?.name?.replace(/\s+/g, '_') || 'Profile'}_TradingJournal_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('CSV Exported successfully!');
  };

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
  const handleRequestClose = (trade: any) => {
    // Open modal for the trade's created date and pass the trade for editing/closing
    const d = trade.createdAt ? trade.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
    setSelectedDate(d);
    setModalTrade(trade);
    setShowModal(true);
  };
  const handleViewTrade = (trade: any) => {
    setDetailTrade(trade);
    setShowDetailModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedDate(null);
    setModalTrade(null);
  };
  const closeDetailModal = () => {
    setShowDetailModal(false);
    setDetailTrade(null);
  };
  const handleDetailEdit = (trade: any) => {
    closeDetailModal();
    const d = trade.createdAt ? trade.createdAt.split('T')[0] : new Date().toISOString().split('T')[0];
    setSelectedDate(d);
    setModalTrade(trade);
    setShowModal(true);
  };
  const handleDetailClosePosition = (trade: any) => {
    closeDetailModal();
    handleRequestClose(trade);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-journal-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-journal-text border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!activeProfile) {
    return (
      <div className="min-h-screen bg-journal-bg flex flex-col items-center justify-center gap-4">
        <p className="text-journal-text-muted font-semibold">Profile not found.</p>
        <button 
          onClick={() => router.replace('/login')} 
          className="px-4 py-2 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 transition-colors"
        >
          Return to Login
        </button>
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
          <button
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-neutral-200/60 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors select-none text-[0.82rem] font-bold cursor-pointer shadow-sm active:scale-95"
            title="User Settings"
          >
            {activeProfile.avatarUrl?.startsWith('http') ? (
              <img src={activeProfile.avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[0.65rem] font-black uppercase tracking-wider">
                {(activeProfile.displayName || activeProfile.name || 'TR').substring(0, 2)}
              </div>
            )}
            <span className="truncate max-w-[100px] text-neutral-800 dark:text-neutral-200">
              {activeProfile.displayName || activeProfile.name || 'Trader'}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 max-md:w-full max-md:justify-between max-md:flex-wrap">
          {metrics.totalTrades > 0 && (
            <div className="flex flex-col items-end gap-0.5 max-md:items-start">
              <div className="flex items-center gap-2">
                {activeProfile?.accountCurrency === 'CENT' && (
                  <span className="px-1.5 py-0.5 bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded text-[0.6rem] font-bold uppercase tracking-wider">
                    CENT
                  </span>
                )}
                <span className="text-[0.68rem] font-semibold uppercase tracking-wider text-journal-text-muted">
                  Profile P&L
                </span>
              </div>
              <span
                className={`font-mono text-[1.05rem] font-extrabold ${metrics.totalPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
              >
                {metrics.totalPnl >= 0 ? '+' : ''}${Math.abs(metrics.totalPnl).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <button
            onClick={() => setShowWalletModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-[0.8rem] font-bold hover:bg-neutral-800 transition-colors shadow-sm active:scale-95"
            title="Open Portfolio Wallet"
          >
            <Wallet className="w-4 h-4" /> Wallet
          </button>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-transparent text-journal-text-muted border border-neutral-200/60 hover:bg-neutral-100 hover:text-neutral-900 hover:border-neutral-300 transition-colors text-[0.8rem] font-bold active:scale-95"
            title="Export trades to CSV"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={() => setIsFeedbackModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-transparent text-journal-text-muted border border-neutral-200/60 hover:bg-neutral-100 hover:text-neutral-900 hover:border-neutral-300 transition-colors text-[0.8rem] font-bold active:scale-95"
            title="Send Feedback"
          >
            <MessageSquarePlus className="w-4 h-4" /> Feedback
          </button>
          <DataManagement />
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push('/login');
            }}
            className="text-[0.8rem] font-bold px-4 py-2 rounded-xl bg-journal-card border border-neutral-200/60 text-journal-text cursor-pointer hover:-translate-y-0.5 hover:shadow-sm transition-all active:scale-[0.97] flex items-center gap-1.5"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            Log Out
          </button>
        </div>
      </header>

      <main className="flex flex-col gap-6">
        <div className="flex items-center justify-between -mb-2">
          <h2 className="text-lg font-extrabold tracking-tight">Performance Summary</h2>
          <div className="flex items-center gap-2">
            <span className="text-[0.7rem] font-bold text-neutral-400 uppercase tracking-wider">Session</span>
            <select
              className="text-sm font-semibold bg-white border border-neutral-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 cursor-pointer shadow-sm text-neutral-800"
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value as any)}
            >
              <option value="All">All Sessions</option>
              <option value="Asian">Asian</option>
              <option value="London">London</option>
              <option value="New York">New York</option>
              <option value="Overlap">Overlap</option>
              <option value="None">None</option>
            </select>
          </div>
        </div>
        <DashboardSummary trades={dashboardTrades} />

        <ActivePositions onRequestClose={handleRequestClose} onView={handleViewTrade} />

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
        <TradeModal date={selectedDate} onClose={closeModal} initialTrade={modalTrade} />
      )}
      {showDetailModal && detailTrade && (
        <TradeDetailModal 
          trade={detailTrade} 
          onClose={closeDetailModal} 
          onEdit={handleDetailEdit} 
          onClosePosition={handleDetailClosePosition} 
        />
      )}
      {showWalletModal && (
        <WalletModal 
          onClose={() => setShowWalletModal(false)} 
          totalRealizedPnl={metrics.totalPnl} 
        />
      )}
      <FeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
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
