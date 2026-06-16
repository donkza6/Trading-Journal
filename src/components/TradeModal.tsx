'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  type FormEvent,
} from 'react';
import { useTrades } from '@/context/TradeContext';
import type { StrategyTag, EmotionTag, TradeDirection } from '@/types';

/* ═══════════════════════════════════════════
   TradeModal – Day detail view + trade form
   ═══════════════════════════════════════════ */

interface TradeModalProps {
  date: string;
  onClose: () => void;
}

export default function TradeModal({ date, onClose }: TradeModalProps) {
  const { getDayLog, deleteTrade } = useTrades();
  const [showForm, setShowForm] = useState(false);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const dayLog = getDayLog(date);
  const trades = dayLog?.trades ?? [];

  // Keyboard shortcut — Escape closes layers
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expandedImage) setExpandedImage(null);
        else if (showForm) setShowForm(false);
        else onClose();
      }
    },
    [onClose, showForm, expandedImage]
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
          {showForm ? (
            <TradeForm date={date} onClose={() => setShowForm(false)} />
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

                      {/* Tags */}
                      {(trade.strategyTags.length > 0 ||
                        trade.emotionTags.length > 0) && (
                        <div className="flex flex-wrap gap-1">
                          {trade.strategyTags.map((t) => (
                            <span
                              key={t}
                              className="text-[0.68rem] font-semibold px-2 py-0.5 rounded-full bg-accent-blue-bg text-accent-blue"
                            >
                              {t}
                            </span>
                          ))}
                          {trade.emotionTags.map((t) => (
                            <span
                              key={t}
                              className="text-[0.68rem] font-semibold px-2 py-0.5 rounded-full bg-[rgba(124,58,237,0.08)] text-accent-purple"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

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

                      {/* Delete */}
                      {deleteConfirmId === trade.id ? (
                        <div className="self-end flex items-center gap-2 animate-fade-in">
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
                          className="self-end text-[0.72rem] font-semibold text-journal-text-muted bg-transparent border-none cursor-pointer px-2 py-1 rounded-md hover:text-loss hover:bg-loss-bg transition-colors"
                          onClick={() => setDeleteConfirmId(trade.id)}
                        >
                          🗑️ Delete
                        </button>
                      )}
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

const STRATEGY_TAGS: StrategyTag[] = [
  'Breakout', 'Breakdown', 'Trend Following', 'Reversal', 'Scalping',
  'Swing', 'RSI', 'MACD', 'Support/Resistance', 'Supply/Demand',
  'News Play', 'Gap Fill',
];

const EMOTION_TAGS: EmotionTag[] = [
  'Confident', 'Neutral', 'Anxious', 'FOMO', 'Greedy',
  'Fearful', 'Revenge', 'Patient', 'Disciplined', 'Impulsive',
];

const EMOTION_ICONS: Record<EmotionTag, string> = {
  Confident: '💪', Neutral: '😐', Anxious: '😰', FOMO: '🏃',
  Greedy: '🤑', Fearful: '😨', Revenge: '😤', Patient: '🧘',
  Disciplined: '🎯', Impulsive: '⚡',
};

interface TradeFormProps {
  date: string;
  onClose: () => void;
}

function TradeForm({ date, onClose }: TradeFormProps) {
  const { addTrade } = useTrades();
  const fileRef = useRef<HTMLInputElement>(null);

  const [pair, setPair] = useState('');
  const [direction, setDirection] = useState<TradeDirection>('Long');
  const [entryPrice, setEntryPrice] = useState('');
  const [exitPrice, setExitPrice] = useState('');
  const [profitLevel, setProfitLevel] = useState('');
  const [stopLevel, setStopLevel] = useState('');
  const [positionSize, setPositionSize] = useState('');
  const [riskReward, setRiskReward] = useState('');
  const [strategyTags, setStrategyTags] = useState<StrategyTag[]>([]);
  const [emotionTags, setEmotionTags] = useState<EmotionTag[]>([]);
  const [notes, setNotes] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleStrat = (t: StrategyTag) =>
    setStrategyTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  const toggleEmo = (t: EmotionTag) =>
    setEmotionTags((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));

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

  // Live P&L preview
  const previewPnl = (() => {
    const e = parseFloat(entryPrice);
    const x = parseFloat(exitPrice);
    const s = parseFloat(positionSize);
    if (isNaN(e) || isNaN(x) || isNaN(s)) return null;
    return (direction === 'Long' ? x - e : e - x) * s;
  })();

  // Auto-calculate Risk/Reward based on Profit Level & Stop Level
  useEffect(() => {
    const entry = parseFloat(entryPrice);
    const profit = parseFloat(profitLevel);
    const stop = parseFloat(stopLevel);
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
  }, [entryPrice, profitLevel, stopLevel, direction]);

  const handleSubmit = (ev: FormEvent) => {
    ev.preventDefault();
    if (!pair || !entryPrice || !exitPrice || !positionSize) return;
    setSaving(true);

    addTrade({
      pair: pair.toUpperCase(),
      direction,
      entryPrice: parseFloat(entryPrice),
      exitPrice: parseFloat(exitPrice),
      positionSize: parseFloat(positionSize),
      profitLevel: profitLevel ? parseFloat(profitLevel) : undefined,
      stopLevel: stopLevel ? parseFloat(stopLevel) : undefined,
      riskReward: parseFloat(riskReward) || 0,
      strategyTags,
      emotionTags,
      notes,
      images,
      date,
    });

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
        <h3 className="text-[1.15rem] font-extrabold">Add New Trade</h3>
        <span className="text-[0.82rem] font-semibold text-journal-text-muted bg-journal-bg px-3 py-1 rounded-full">
          {dateLabel}
        </span>
      </div>

      {/* Direction toggle */}
      <div className="grid grid-cols-2 gap-2 bg-journal-bg p-1 rounded-[var(--radius-button)]">
        <button
          type="button"
          onClick={() => setDirection('Long')}
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
          onClick={() => setDirection('Short')}
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
              onChange={(e) => setEntryPrice(e.target.value)}
              required
            />
          </Field>
          <Field label="Exit Price">
            <input
              className={inputCls}
              type="number"
              step="any"
              placeholder="0.00"
              value={exitPrice}
              onChange={(e) => setExitPrice(e.target.value)}
              required
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 max-sm:gap-3">
          <Field label="Profit Level (TP)">
            <input
              className={inputCls}
              type="number"
              step="any"
              placeholder="Target Price"
              value={profitLevel}
              onChange={(e) => setProfitLevel(e.target.value)}
            />
          </Field>
          <Field label="Stop Level (SL)">
            <input
              className={inputCls}
              type="number"
              step="any"
              placeholder="Stop Loss Price"
              value={stopLevel}
              onChange={(e) => setStopLevel(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 max-sm:gap-3">
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
              Estimated P&L
            </span>
            <span
              className={`font-mono text-[1.1rem] font-extrabold ${previewPnl >= 0 ? 'text-profit' : 'text-loss'}`}
            >
              {previewPnl >= 0 ? '+' : ''}${previewPnl.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Strategy tags */}
      <TagSection label="Strategy">
        {STRATEGY_TAGS.map((t) => (
          <TagButton
            key={t}
            label={t}
            active={strategyTags.includes(t)}
            onClick={() => toggleStrat(t)}
          />
        ))}
      </TagSection>

      {/* Emotion tags */}
      <TagSection label="Emotions">
        {EMOTION_TAGS.map((t) => (
          <TagButton
            key={t}
            label={`${EMOTION_ICONS[t]} ${t}`}
            active={emotionTags.includes(t)}
            onClick={() => toggleEmo(t)}
          />
        ))}
      </TagSection>

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
          disabled={!pair || !entryPrice || !exitPrice || !positionSize || saving}
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

function TagSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[0.78rem] font-bold uppercase tracking-wider text-journal-text-secondary">
        {label}
      </span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function TagButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-[0.75rem] font-semibold px-2.5 py-1 rounded-full border cursor-pointer transition-all select-none ${
        active
          ? 'bg-journal-text text-journal-text-inverse border-journal-text'
          : 'bg-journal-elevated text-journal-text-secondary border-border-light hover:border-border-strong hover:bg-journal-card'
      }`}
    >
      {label}
    </button>
  );
}
