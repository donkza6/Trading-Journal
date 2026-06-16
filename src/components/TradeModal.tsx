'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
} from 'react';
import { useProfiles, useTrades } from '@/context/ProfileContext';
import type { TradeDirection, TradeOutcome, Trade } from '@/types';

/* ═══════════════════════════════════════════
   TradeModal – Day detail view + trade form
   ═══════════════════════════════════════════ */

interface TradeModalProps {
  date: string;
  onClose: () => void;
}

export default function TradeModal({ date, onClose }: TradeModalProps) {
  const { activeProfileId } = useProfiles();
  const { getDayLog, deleteTrade } = useTrades(activeProfileId);
  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const dayLog = getDayLog(date);
  const trades = dayLog?.trades ?? [];

  // Keyboard shortcut — Escape closes layers
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expandedImage) setExpandedImage(null);
        else if (editingTrade) setEditingTrade(null);
        else if (showForm) setShowForm(false);
        else onClose();
      }
    },
    [onClose, showForm, editingTrade, expandedImage]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [handleKey]);

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString(
    'en-US',
    { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }
  );

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      {/* Modal card */}
      <div
        className="relative bg-journal-card rounded-[var(--radius-card)] shadow-modal w-full max-w-[580px] max-h-[90vh] flex flex-col overflow-hidden animate-scale-in max-sm:max-h-[95vh] max-sm:rounded-xl max-sm:m-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-border-light max-sm:px-4 max-sm:pt-4 max-sm:pb-3">
          <div>
            <h2 className="text-[1.1rem] font-extrabold tracking-tight">
              {formattedDate}
            </h2>
            {dayLog && (
              <div className="flex items-center gap-4 mt-1">
                <span
                  className={`font-mono text-[1.15rem] font-extrabold ${dayLog.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}
                >
                  {dayLog.totalPnl >= 0 ? '+' : ''}$
                  {dayLog.totalPnl.toFixed(2)}
                </span>
                <span className="text-[0.8rem] text-journal-text-muted font-semibold">
                  {trades.length} trade{trades.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-[var(--radius-button)] text-journal-text-secondary hover:bg-journal-text/6 transition-colors text-lg cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div className="p-6 overflow-y-auto flex-1 max-sm:p-4">
          {showForm || editingTrade ? (
            <TradeForm
              date={date}
              onClose={() => {
                setShowForm(false);
                setEditingTrade(null);
              }}
              editingTrade={editingTrade}
            />
          ) : (
            <>
              {/* Trade list */}
              {trades.length > 0 ? (
                <div className="flex flex-col gap-4">
                  {trades.map((trade, i) => (
                    <div
                      key={trade.id}
                      className="bg-journal-elevated rounded-[var(--radius-button)] p-4 border border-border-light flex flex-col gap-2 animate-slide-up hover:shadow-card transition-shadow"
                      style={{ animationDelay: `${i * 60}ms` }}
                    >
                      {/* Pair + P&L */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-extrabold ${
                              trade.direction === 'Long'
                                ? 'bg-profit-bg text-profit'
                                : 'bg-loss-bg text-loss'
                            }`}
                          >
                            {trade.direction === 'Long' ? '↑' : '↓'}
                          </span>
                          <span className="font-bold text-[0.95rem] font-mono">
                            {trade.pair}
                          </span>
                        </div>
                        <span
                          className={`font-mono font-extrabold text-base ${trade.pnl >= 0 ? 'text-profit' : 'text-loss'}`}
                        >
                          {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                        </span>
                      </div>

                      {/* Detail grid */}
                      <div className="grid grid-cols-3 gap-x-2 gap-y-3 py-2.5 border-y border-border-light max-sm:grid-cols-2">
                        {[
                          { label: 'Entry', val: `$${trade.entryPrice.toLocaleString()}` },
                          { label: 'Exit', val: `$${trade.exitPrice.toLocaleString()}` },
                          { label: 'Size', val: trade.positionSize.toString() },
                          {
                            label: 'Profit Lvl',
                            val: trade.profitLevel !== undefined && trade.profitLevel !== null ? `$${trade.profitLevel.toLocaleString()}` : '—',
                            color: trade.profitLevel !== undefined && trade.profitLevel !== null ? 'text-profit font-bold' : ''
                          },
                          {
                            label: 'Stop Lvl',
                            val: trade.stopLevel !== undefined && trade.stopLevel !== null ? `$${trade.stopLevel.toLocaleString()}` : '—',
                            color: trade.stopLevel !== undefined && trade.stopLevel !== null ? 'text-loss font-bold' : ''
                          },
                          { label: 'R:R', val: trade.riskReward > 0 ? `${trade.riskReward.toFixed(1)}` : '—' },
                        ].map((d) => (
                          <div key={d.label} className="flex flex-col gap-0.5">
                            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-journal-text-muted">
                              {d.label}
                            </span>
                            <span className={`font-mono text-[0.82rem] font-semibold ${d.color || ''}`}>
                              {d.val}
                            </span>
                          </div>
                        ))}
                      </div>



                      {/* Notes */}
                      {trade.notes && (
                        <p className="text-[0.82rem] text-journal-text-secondary leading-relaxed italic">
                          {trade.notes}
                        </p>
                      )}

                      {/* Images */}
                      {trade.images.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {trade.images.map((img, idx) => (
                            <button
                              key={idx}
                              className="w-16 h-16 rounded-md overflow-hidden border border-border-light cursor-pointer hover:scale-105 transition-transform p-0 bg-transparent"
                              onClick={() => setExpandedImage(img)}
                            >
                              <img
                                src={img}
                                alt={`Chart ${idx + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Actions (Edit & Delete) */}
                      <div className="self-end flex items-center gap-3">
                        {!deleteConfirmId && (
                          <button
                            className="text-[0.72rem] font-semibold text-journal-text-muted bg-transparent border-none cursor-pointer px-2 py-1 rounded-md hover:text-journal-text hover:bg-border-light transition-colors"
                            onClick={() => setEditingTrade(trade)}
                          >
                            ✏️ Edit
                          </button>
                        )}
                        {deleteConfirmId === trade.id ? (
                          <div className="flex items-center gap-2 animate-fade-in">
                            <span className="text-[0.7rem] font-bold text-loss">Delete this trade?</span>
                            <button
                              className="text-[0.72rem] font-bold text-loss bg-loss-bg px-2.5 py-1 rounded-md cursor-pointer hover:bg-loss/20 transition-colors"
                              onClick={() => {
                                deleteTrade(trade.id);
                                setDeleteConfirmId(null);
                              }}
                            >
                              Yes
                            </button>
                            <button
                              className="text-[0.72rem] font-semibold text-journal-text-secondary bg-journal-bg px-2.5 py-1 rounded-md cursor-pointer hover:bg-border-light transition-colors"
                              onClick={() => setDeleteConfirmId(null)}
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            className="text-[0.72rem] font-semibold text-journal-text-muted bg-transparent border-none cursor-pointer px-2 py-1 rounded-md hover:text-loss hover:bg-loss-bg transition-colors"
                            onClick={() => setDeleteConfirmId(trade.id)}
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <span className="text-5xl mb-4 opacity-60">📝</span>
                  <p className="text-base font-bold text-journal-text">
                    No trades recorded for this day
                  </p>
                  <p className="text-sm text-journal-text-muted mt-1">
                    Add your first trade to start tracking
                  </p>
                </div>
              )}

              {/* Add button */}
              <button
                className="w-full mt-4 py-3.5 rounded-[var(--radius-button)] bg-journal-text text-journal-text-inverse font-bold text-[0.9rem] cursor-pointer hover:bg-[#1a1616] hover:shadow-card-hover transition-all active:scale-[0.97]"
                onClick={() => setShowForm(true)}
              >
                + Add New Trade
              </button>
            </>
          )}
        </div>

        {/* Lightbox */}
        {expandedImage && (
          <div
            className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-fade-in cursor-pointer"
            style={{ background: 'rgba(0,0,0,0.85)' }}
            onClick={() => setExpandedImage(null)}
          >
            <img
              src={expandedImage}
              alt="Expanded chart"
              className="max-w-[90%] max-h-[90%] rounded-[var(--radius-card)] shadow-modal object-contain"
            />
            <button
              className="absolute top-5 right-5 w-10 h-10 rounded-full border-none bg-white/15 text-white text-xl cursor-pointer flex items-center justify-center hover:bg-white/30 transition-colors"
              onClick={() => setExpandedImage(null)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TradeForm – Inline form inside the modal
   ═══════════════════════════════════════════════ */



interface TradeFormProps {
  date: string;
  onClose: () => void;
  editingTrade?: Trade | null;
}

function TradeForm({ date, onClose, editingTrade }: TradeFormProps) {
  const { activeProfileId } = useProfiles();
  const { addTrade, updateTrade } = useTrades(activeProfileId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [pair, setPair] = useState(editingTrade?.pair ?? '');
  const [direction, setDirection] = useState<TradeDirection>(editingTrade?.direction ?? 'Long');
  const [entryPrice, setEntryPrice] = useState(editingTrade?.entryPrice ? editingTrade.entryPrice.toString() : '');
  const [tpPrice, setTpPrice] = useState(editingTrade?.profitLevel ? editingTrade.profitLevel.toString() : '');
  const [tpPips, setTpPips] = useState('');
  const [tpPoints, setTpPoints] = useState('');
  const [slPrice, setSlPrice] = useState(editingTrade?.stopLevel ? editingTrade.stopLevel.toString() : '');
  const [slPips, setSlPips] = useState('');
  const [slPoints, setSlPoints] = useState('');
  const [positionSize, setPositionSize] = useState(editingTrade?.positionSize ? editingTrade.positionSize.toString() : '');
  const [riskReward, setRiskReward] = useState(editingTrade?.riskReward ? editingTrade.riskReward.toString() : '');
  const [outcome, setOutcome] = useState<TradeOutcome>(editingTrade?.outcome ?? 'Win');
  const [notes, setNotes] = useState(editingTrade?.notes ?? '');
  const [images, setImages] = useState<string[]>(editingTrade?.images ?? []);
  const [saving, setSaving] = useState(false);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => {
      const r = new FileReader();
      r.onload = (ev) => {
        if (ev.target?.result)
          setImages((p) => [...p, ev.target!.result as string]);
      };
      r.readAsDataURL(f);
    });
  };

  const removeImage = (idx: number) =>
    setImages((p) => p.filter((_, i) => i !== idx));

  // Helper to guess pip size
  const getPipSize = useCallback((entry: number) => {
    if (entry <= 0 || isNaN(entry)) return 0.0001;
    if (entry < 5) return 0.0001; // Forex major e.g. EUR/USD
    if (entry < 500) return 0.01;   // JPY or stocks
    return 1.0;                    // Crypto, Gold, Indices
  }, []);

  // Initialize TP/SL pips/points if editing
  useEffect(() => {
    if (editingTrade && editingTrade.entryPrice > 0) {
      const entry = editingTrade.entryPrice;
      const pipSize = getPipSize(entry);

      if (editingTrade.profitLevel) {
        const diff = editingTrade.direction === 'Long'
          ? editingTrade.profitLevel - entry
          : entry - editingTrade.profitLevel;
        const pips = diff / pipSize;
        setTpPips(Number(pips.toFixed(2)).toString());
        setTpPoints(Number((pips * 10).toFixed(1)).toString());
      }

      if (editingTrade.stopLevel) {
        const diff = editingTrade.direction === 'Long'
          ? entry - editingTrade.stopLevel
          : editingTrade.stopLevel - entry;
        const pips = diff / pipSize;
        setSlPips(Number(pips.toFixed(2)).toString());
        setSlPoints(Number((pips * 10).toFixed(1)).toString());
      }
    }
  }, [editingTrade, getPipSize]);

  const handleEntryChange = (val: string) => {
    setEntryPrice(val);
    const entryNum = parseFloat(val);
    if (isNaN(entryNum) || entryNum <= 0) return;

    const pipSize = getPipSize(entryNum);

    // Sync TP if TP Price exists
    const tpPriceNum = parseFloat(tpPrice);
    if (!isNaN(tpPriceNum)) {
      const diff = direction === 'Long' ? tpPriceNum - entryNum : entryNum - tpPriceNum;
      const pips = diff / pipSize;
      setTpPips(Number(pips.toFixed(2)).toString());
      setTpPoints(Number((pips * 10).toFixed(1)).toString());
    }

    // Sync SL if SL Price exists
    const slPriceNum = parseFloat(slPrice);
    if (!isNaN(slPriceNum)) {
      const diff = direction === 'Long' ? entryNum - slPriceNum : slPriceNum - entryNum;
      const pips = diff / pipSize;
      setSlPips(Number(pips.toFixed(2)).toString());
      setSlPoints(Number((pips * 10).toFixed(1)).toString());
    }
  };

  const handleDirectionChange = (dir: TradeDirection) => {
    setDirection(dir);
    const entryNum = parseFloat(entryPrice);
    if (isNaN(entryNum) || entryNum <= 0) return;

    const pipSize = getPipSize(entryNum);

    const tpPipsNum = parseFloat(tpPips);
    if (!isNaN(tpPipsNum)) {
      const price = dir === 'Long' ? entryNum + (tpPipsNum * pipSize) : entryNum - (tpPipsNum * pipSize);
      setTpPrice(Number(price.toFixed(5)).toString());
    }

    const slPipsNum = parseFloat(slPips);
    if (!isNaN(slPipsNum)) {
      const price = dir === 'Long' ? entryNum - (slPipsNum * pipSize) : entryNum + (slPipsNum * pipSize);
      setSlPrice(Number(price.toFixed(5)).toString());
    }
  };

  const handleTpPriceChange = (val: string) => {
    setTpPrice(val);
    const priceNum = parseFloat(val);
    const entryNum = parseFloat(entryPrice);
    if (isNaN(priceNum) || isNaN(entryNum) || entryNum <= 0) {
      setTpPips('');
      setTpPoints('');
      return;
    }
    const pipSize = getPipSize(entryNum);
    const diff = direction === 'Long' ? priceNum - entryNum : entryNum - priceNum;
    const pips = diff / pipSize;
    setTpPips(Number(pips.toFixed(2)).toString());
    setTpPoints(Number((pips * 10).toFixed(1)).toString());
  };

  const handleTpPipsChange = (val: string) => {
    setTpPips(val);
    const pipsNum = parseFloat(val);
    const entryNum = parseFloat(entryPrice);
    if (isNaN(pipsNum) || isNaN(entryNum) || entryNum <= 0) {
      setTpPrice('');
      setTpPoints('');
      return;
    }
    const pipSize = getPipSize(entryNum);
    const price = direction === 'Long' ? entryNum + (pipsNum * pipSize) : entryNum - (pipsNum * pipSize);
    setTpPrice(Number(price.toFixed(5)).toString());
    setTpPoints(Number((pipsNum * 10).toFixed(1)).toString());
  };

  const handleTpPointsChange = (val: string) => {
    setTpPoints(val);
    const pointsNum = parseFloat(val);
    const entryNum = parseFloat(entryPrice);
    if (isNaN(pointsNum) || isNaN(entryNum) || entryNum <= 0) {
      setTpPrice('');
      setTpPips('');
      return;
    }
    const pips = pointsNum / 10;
    setTpPips(Number(pips.toFixed(2)).toString());
    const pipSize = getPipSize(entryNum);
    const price = direction === 'Long' ? entryNum + (pips * pipSize) : entryNum - (pips * pipSize);
    setTpPrice(Number(price.toFixed(5)).toString());
  };

  const handleSlPriceChange = (val: string) => {
    setSlPrice(val);
    const priceNum = parseFloat(val);
    const entryNum = parseFloat(entryPrice);
    if (isNaN(priceNum) || isNaN(entryNum) || entryNum <= 0) {
      setSlPips('');
      setSlPoints('');
      return;
    }
    const pipSize = getPipSize(entryNum);
    const diff = direction === 'Long' ? entryNum - priceNum : priceNum - entryNum;
    const pips = diff / pipSize;
    setSlPips(Number(pips.toFixed(2)).toString());
    setSlPoints(Number((pips * 10).toFixed(1)).toString());
  };

  const handleSlPipsChange = (val: string) => {
    setSlPips(val);
    const pipsNum = parseFloat(val);
    const entryNum = parseFloat(entryPrice);
    if (isNaN(pipsNum) || isNaN(entryNum) || entryNum <= 0) {
      setSlPrice('');
      setSlPoints('');
      return;
    }
    const pipSize = getPipSize(entryNum);
    const price = direction === 'Long' ? entryNum - (pipsNum * pipSize) : entryNum + (pipsNum * pipSize);
    setSlPrice(Number(price.toFixed(5)).toString());
    setSlPoints(Number((pipsNum * 10).toFixed(1)).toString());
  };

  const handleSlPointsChange = (val: string) => {
    setSlPoints(val);
    const pointsNum = parseFloat(val);
    const entryNum = parseFloat(entryPrice);
    if (isNaN(pointsNum) || isNaN(entryNum) || entryNum <= 0) {
      setSlPrice('');
      setSlPips('');
      return;
    }
    const pips = pointsNum / 10;
    setSlPips(Number(pips.toFixed(2)).toString());
    const pipSize = getPipSize(entryNum);
    const price = direction === 'Long' ? entryNum - (pips * pipSize) : entryNum + (pips * pipSize);
    setSlPrice(Number(price.toFixed(5)).toString());
  };

  // Live P&L preview based on selected outcome
  const previewPnl = (() => {
    const e = parseFloat(entryPrice);
    const s = parseFloat(positionSize);
    if (isNaN(e) || isNaN(s)) return null;

    if (outcome === 'Win') {
      const tp = parseFloat(tpPrice);
      if (isNaN(tp)) return null;
      return (direction === 'Long' ? tp - e : e - tp) * s;
    } else if (outcome === 'Loss') {
      const sl = parseFloat(slPrice);
      if (isNaN(sl)) return null;
      return (direction === 'Long' ? sl - e : e - sl) * s;
    }
    return 0;
  })();

  // Auto-calculate Risk/Reward based on tpPrice & slPrice
  useEffect(() => {
    const entry = parseFloat(entryPrice);
    const profit = parseFloat(tpPrice);
    const stop = parseFloat(slPrice);
    if (!isNaN(entry) && !isNaN(profit) && !isNaN(stop)) {
      const risk = direction === 'Long' ? entry - stop : stop - entry;
      const reward = direction === 'Long' ? profit - entry : entry - profit;
      if (risk > 0) {
        const rr = reward / risk;
        if (rr > 0) {
          const formattedRr = Number(rr.toFixed(2)).toString();
          setRiskReward(formattedRr);
        } else {
          setRiskReward('');
        }
      } else {
        setRiskReward('');
      }
    }
  }, [entryPrice, tpPrice, slPrice, direction]);

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!pair || !entryPrice || !positionSize) return;
    setSaving(true);

    const entryNum = parseFloat(entryPrice);
    const tpPriceNum = parseFloat(tpPrice) || entryNum;
    const slPriceNum = parseFloat(slPrice) || entryNum;

    let computedExitPrice = entryNum;
    if (outcome === 'Win') {
      computedExitPrice = tpPriceNum;
    } else if (outcome === 'Loss') {
      computedExitPrice = slPriceNum;
    } else {
      computedExitPrice = entryNum;
    }

    const tradeData = {
      pair: pair.toUpperCase(),
      direction,
      entryPrice: entryNum,
      exitPrice: computedExitPrice,
      positionSize: parseFloat(positionSize),
      profitLevel: tpPriceNum,
      stopLevel: slPriceNum,
      riskReward: parseFloat(riskReward) || 0,
      notes,
      images,
      createdAt: date + 'T12:00:00',
    };

    if (editingTrade) {
      updateTrade(editingTrade.id, tradeData);
    } else {
      addTrade(tradeData);
    }

    setTimeout(() => {
      setSaving(false);
      onClose();
    }, 250);
  };

  const dateLabel = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  /* shared input class */
  const inputCls =
    'w-full text-[0.9rem] py-2.5 px-3.5 rounded-[var(--radius-button)] border-[1.5px] border-border-medium bg-journal-elevated text-journal-text outline-none transition-all duration-150 focus:border-journal-text focus:shadow-[0_0_0_3px_rgba(42,38,38,0.08)] placeholder:text-journal-text-muted';

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-[1.15rem] font-extrabold">
          {editingTrade ? 'Edit Trade' : 'Add New Trade'}
        </h3>
        <span className="text-[0.82rem] font-semibold text-journal-text-muted bg-journal-bg px-3 py-1 rounded-full">
          {dateLabel}
        </span>
      </div>

      {/* Direction toggle */}
      <div className="grid grid-cols-2 gap-2 bg-journal-bg p-1 rounded-[var(--radius-button)]">
        <button
          type="button"
          onClick={() => handleDirectionChange('Long')}
          className={`text-[0.85rem] font-bold py-2.5 border-none rounded-md cursor-pointer transition-all ${
            direction === 'Long'
              ? 'bg-profit-bg text-profit shadow-card'
              : 'bg-transparent text-journal-text-secondary'
          }`}
        >
          ↑ Long
        </button>
        <button
          type="button"
          onClick={() => handleDirectionChange('Short')}
          className={`text-[0.85rem] font-bold py-2.5 border-none rounded-md cursor-pointer transition-all ${
            direction === 'Short'
              ? 'bg-loss-bg text-loss shadow-card'
              : 'bg-transparent text-journal-text-secondary'
          }`}
        >
          ↓ Short
        </button>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-4">
        <Field label="Trading Pair / Asset">
          <input
            className={inputCls}
            type="text"
            placeholder="e.g. BTC/USDT, EUR/USD, AAPL"
            value={pair}
            onChange={(e) => setPair(e.target.value)}
            required
          />
        </Field>

        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 max-sm:gap-3">
          <Field label="Entry Price">
            <input
              className={inputCls}
              type="number"
              step="any"
              placeholder="0.00"
              value={entryPrice}
              onChange={(e) => handleEntryChange(e.target.value)}
              required
            />
          </Field>
          <Field label="Position Size">
            <input
              className={inputCls}
              type="number"
              step="any"
              placeholder="Qty / Units"
              value={positionSize}
              onChange={(e) => setPositionSize(e.target.value)}
              required
            />
          </Field>
        </div>

        {/* Take Profit (TP) Price, Pips, Points */}
        <div className="flex flex-col gap-1.5 animate-fade-in">
          <span className="text-[0.78rem] font-bold uppercase tracking-wider text-journal-text-secondary">
            Take Profit (TP)
          </span>
          <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-1 max-sm:gap-2">
            <div>
              <label className="text-[0.65rem] font-bold text-journal-text-muted block mb-1">PRICE</label>
              <input
                className={inputCls}
                type="number"
                step="any"
                placeholder="Level"
                value={tpPrice}
                onChange={(e) => handleTpPriceChange(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[0.65rem] font-bold text-journal-text-muted block mb-1">PIPS</label>
              <input
                className={inputCls}
                type="number"
                step="any"
                placeholder="Pips"
                value={tpPips}
                onChange={(e) => handleTpPipsChange(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[0.65rem] font-bold text-journal-text-muted block mb-1">POINTS</label>
              <input
                className={inputCls}
                type="number"
                step="any"
                placeholder="Points"
                value={tpPoints}
                onChange={(e) => handleTpPointsChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Stop Loss (SL) Price, Pips, Points */}
        <div className="flex flex-col gap-1.5 animate-fade-in">
          <span className="text-[0.78rem] font-bold uppercase tracking-wider text-journal-text-secondary">
            Stop Loss (SL)
          </span>
          <div className="grid grid-cols-3 gap-2 max-sm:grid-cols-1 max-sm:gap-2">
            <div>
              <label className="text-[0.65rem] font-bold text-journal-text-muted block mb-1">PRICE</label>
              <input
                className={inputCls}
                type="number"
                step="any"
                placeholder="Level"
                value={slPrice}
                onChange={(e) => handleSlPriceChange(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[0.65rem] font-bold text-journal-text-muted block mb-1">PIPS</label>
              <input
                className={inputCls}
                type="number"
                step="any"
                placeholder="Pips"
                value={slPips}
                onChange={(e) => handleSlPipsChange(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[0.65rem] font-bold text-journal-text-muted block mb-1">POINTS</label>
              <input
                className={inputCls}
                type="number"
                step="any"
                placeholder="Points"
                value={slPoints}
                onChange={(e) => handleSlPointsChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 max-sm:gap-3">
          <Field label="Risk / Reward">
            <input
              className={inputCls}
              type="number"
              step="any"
              placeholder="e.g. 2.5"
              value={riskReward}
              onChange={(e) => setRiskReward(e.target.value)}
            />
          </Field>
          <Field label="Outcome">
            <select
              className={inputCls}
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as TradeOutcome)}
            >
              <option value="Win">🏆 Win (hits TP)</option>
              <option value="Loss">❌ Loss (hits SL)</option>
              <option value="Breakeven">⚖️ Breakeven</option>
            </select>
          </Field>
        </div>

        {/* P&L preview */}
        {previewPnl !== null && (
          <div
            className={`flex items-center justify-between px-4 py-3 rounded-[var(--radius-button)] animate-fade-in border ${
              previewPnl >= 0
                ? 'bg-profit-bg border-profit/20'
                : 'bg-loss-bg border-loss/20'
            }`}
          >
            <span className="text-[0.8rem] font-semibold text-journal-text-secondary">
              Estimated P&L ({outcome})
            </span>
            <span
              className={`font-mono text-[1.1rem] font-extrabold ${previewPnl >= 0 ? 'text-profit' : 'text-loss'}`}
            >
              {previewPnl >= 0 ? '+' : ''}${previewPnl.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Notes */}
      <Field label="Notes & Reasoning">
        <textarea
          className={`${inputCls} resize-y min-h-[80px]`}
          placeholder="What was your reasoning? What did you learn?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </Field>

      {/* Image upload */}
      <div className="flex flex-col gap-2">
        <span className="text-[0.78rem] font-bold uppercase tracking-wider text-journal-text-secondary">
          Chart Screenshots
        </span>
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative w-20 h-20 rounded-[var(--radius-button)] overflow-hidden border border-border-light"
            >
              <img
                src={img}
                alt={`Chart ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full border-none bg-black/60 text-white text-[0.65rem] cursor-pointer flex items-center justify-center hover:bg-loss/90 transition-colors"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-20 h-20 rounded-[var(--radius-button)] border-2 border-dashed border-border-medium bg-transparent flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-journal-text hover:bg-journal-bg transition-all"
          >
            <span className="text-xl">📷</span>
            <span className="text-[0.6rem] font-semibold text-journal-text-muted">
              Add Image
            </span>
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={handleImages}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-border-light">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-[var(--radius-button)] bg-transparent border-[1.5px] border-border-medium text-journal-text font-semibold text-[0.875rem] cursor-pointer hover:bg-journal-card hover:border-border-strong transition-all active:scale-[0.97]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!pair || !entryPrice || !positionSize || saving}
          className="px-5 py-2.5 rounded-[var(--radius-button)] bg-journal-text text-journal-text-inverse font-semibold text-[0.875rem] cursor-pointer hover:bg-[#1a1616] hover:shadow-card-hover transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Trade'}
        </button>
      </div>
    </form>
  );
}

/* ═══════════════════════════════════════════
   Tiny Shared Sub-Components
   ═══════════════════════════════════════════ */

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[0.78rem] font-bold uppercase tracking-wider text-journal-text-secondary">
        {label}
      </span>
      {children}
    </div>
  );
}


