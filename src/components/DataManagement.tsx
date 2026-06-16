'use client';

import React, { useRef, useState } from 'react';
import Papa from 'papaparse';
import { useProfiles, useTrades } from '@/context/ProfileContext';
import type { Trade, TradeDirection } from '@/types';
import { Download, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

type Toast = { type: 'success' | 'error'; message: string } | null;

const CSV_HEADERS = [
  'pair',
  'direction',
  'entry_price',
  'exit_price',
  'position_size',
  'profit_level',
  'stop_level',
  'risk_reward',
  'notes',
  'created_at',
] as const;

function tradesToCsv(trades: Trade[]): string {
  const rows = trades.map((t) => ({
    pair: t.pair,
    direction: t.direction,
    entry_price: t.entryPrice,
    exit_price: t.exitPrice,
    position_size: t.positionSize,
    profit_level: t.profitLevel ?? '',
    stop_level: t.stopLevel ?? '',
    risk_reward: t.riskReward,
    notes: t.notes,
    created_at: t.createdAt,
  }));
  return Papa.unparse(rows, { columns: [...CSV_HEADERS] });
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function parseDirection(value: string): TradeDirection | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'long' || normalized === 'buy') return 'Long';
  if (normalized === 'short' || normalized === 'sell') return 'Short';
  return null;
}

function parseCsvRow(
  row: Record<string, string>
): Omit<Trade, 'id' | 'profileId' | 'pnl' | 'outcome'> | null {
  const pair = row.pair?.trim();
  const direction = parseDirection(row.direction || '');
  const entryPrice = parseFloat(row.entry_price);
  const exitPrice = parseFloat(row.exit_price);
  const positionSize = parseFloat(row.position_size);

  if (!pair || !direction || isNaN(entryPrice) || isNaN(exitPrice) || isNaN(positionSize)) {
    return null;
  }

  const profitLevel = row.profit_level ? parseFloat(row.profit_level) : undefined;
  const stopLevel = row.stop_level ? parseFloat(row.stop_level) : undefined;
  const riskReward = row.risk_reward ? parseFloat(row.risk_reward) : 0;
  const notes = row.notes?.trim() || '';
  const createdAt = row.created_at?.trim() || new Date().toISOString();

  return {
    pair: pair.toUpperCase(),
    direction,
    entryPrice,
    exitPrice,
    positionSize,
    profitLevel: isNaN(profitLevel!) ? undefined : profitLevel,
    stopLevel: isNaN(stopLevel!) ? undefined : stopLevel,
    riskReward: isNaN(riskReward) ? 0 : riskReward,
    notes,
    images: [],
    image_url: '',
    status: 'CLOSED',
    createdAt,
  };
}

export default function DataManagement() {
  const { activeProfileId, activeProfile } = useProfiles();
  const { trades, bulkImportTrades } = useTrades(activeProfileId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [toast, setToast] = useState<Toast>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleExport = async () => {
    if (trades.length === 0) {
      showToast('error', 'No trades to export.');
      return;
    }

    setExporting(true);
    try {
      const csv = tradesToCsv(trades);
      const profileSlug = activeProfile?.name.replace(/\s+/g, '_').toLowerCase() || 'profile';
      downloadCsv(csv, `trades_backup_${profileSlug}.csv`);
      showToast('success', `Exported ${trades.length} trades successfully.`);
    } catch {
      showToast('error', 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = (file: File) => {
    setImporting(true);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsed = results.data
            .map(parseCsvRow)
            .filter((row): row is NonNullable<typeof row> => row !== null);

          if (parsed.length === 0) {
            showToast('error', 'No valid trades found in the CSV file.');
            return;
          }

          await bulkImportTrades(parsed);
          showToast('success', `Imported ${parsed.length} trades successfully.`);
        } catch {
          showToast('error', 'Import failed. Check your CSV format and try again.');
        } finally {
          setImporting(false);
          if (fileRef.current) fileRef.current.value = '';
        }
      },
      error: () => {
        showToast('error', 'Could not read the CSV file.');
        setImporting(false);
        if (fileRef.current) fileRef.current.value = '';
      },
    });
  };

  const btnCls =
    'text-[0.78rem] font-bold px-3.5 py-2 rounded-xl bg-journal-card border border-neutral-200/60 text-journal-text cursor-pointer hover:-translate-y-0.5 hover:shadow-sm transition-all active:scale-[0.97] flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0';

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={handleExport}
        disabled={exporting || importing}
        className={btnCls}
        title="Export trades to CSV"
      >
        {exporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Download className="w-3.5 h-3.5" />
        )}
        Export
      </button>

      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={exporting || importing}
        className={btnCls}
        title="Import trades from CSV"
      >
        {importing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Upload className="w-3.5 h-3.5" />
        )}
        Import
      </button>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,text/csv"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImport(file);
        }}
      />

      {toast && (
        <div
          className={`absolute top-full right-0 mt-2 z-50 flex items-center gap-2 px-3.5 py-2.5 rounded-xl border shadow-md text-[0.78rem] font-semibold whitespace-nowrap animate-slide-down ${toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
