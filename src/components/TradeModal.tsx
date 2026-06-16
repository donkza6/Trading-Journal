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
import { supabase } from '@/lib/supabase';
import {
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
  Edit2,
  X,
  Plus,
  FileText,
  Image as ImageIcon,
  Trophy,
  Activity,
  ImagePlus,
  Upload,
  Loader2,
  Target,
  ShieldAlert,
  LogIn,
  LogOut,
  Layers,
  Scale,
  Calculator,
  Megaphone,
} from 'lucide-react';

/* ═══════════════════════════════════════════
   TradeModal – Day detail view + trade form
   ═══════════════════════════════════════════ */

function getTradeImages(trade: Trade): string[] {
  const urls: string[] = [];
  if (trade.image_url) urls.push(trade.image_url);
  if (trade.images?.length) {
    for (const img of trade.images) {
      if (img && !urls.includes(img)) urls.push(img);
    }
  }
  return urls;
}

async function uploadTradeImage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'png';
  const uniqueId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const fileName = `${uniqueId}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from('trade-images')
    .upload(fileName, file, { cacheControl: '3600', upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const {
    data: { publicUrl },
  } = supabase.storage.from('trade-images').getPublicUrl(fileName);
  return publicUrl;
}

interface TradeModalProps {
  date: string;
  onClose: () => void;
  initialTrade?: Trade | null;
}

export default function TradeModal({ date, onClose, initialTrade = null }: TradeModalProps) {
  const { activeProfileId } = useProfiles();
  const { getDayLog, deleteTrade } = useTrades(activeProfileId);
  const [showForm, setShowForm] = useState(false);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [imageEditingTradeId, setImageEditingTradeId] = useState<string | null>(null);

  const dayLog = getDayLog(date);
  const trades = dayLog?.trades ?? [];

  useEffect(() => {
    if (initialTrade) {
      setEditingTrade(initialTrade);
      setShowForm(true);
    }
  }, [initialTrade]);

  // Keyboard shortcut — Escape closes layers
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (expandedImage) setExpandedImage(null);
        else if (imageEditingTradeId) setImageEditingTradeId(null);
        else if (editingTrade) setEditingTrade(null);
        else if (showForm) setShowForm(false);
        else onClose();
      }
    },
    [onClose, showForm, editingTrade, expandedImage, imageEditingTradeId]
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
        {/* ── Header (sticky) ── */}
        <div className="shrink-0 flex items-start justify-between px-6 pt-6 pb-4 border-b border-border-light max-sm:px-4 max-sm:pt-4 max-sm:pb-3">
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
            className="w-9 h-9 flex items-center justify-center rounded-xl text-journal-text-secondary hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex flex-col flex-1 min-h-0">
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
              <div className="flex-1 overflow-y-auto custom-scrollbar p-6 max-sm:p-4">
                {/* Trade list */}
                {trades.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {trades.map((trade, i) => {
                      const tradeImages = getTradeImages(trade);
                      return (
                        <div
                          key={trade.id}
                          className="bg-journal-elevated rounded-[var(--radius-button)] p-4 border border-border-light flex flex-col gap-2 animate-slide-up hover:shadow-card transition-shadow"
                          style={{ animationDelay: `${i * 60}ms` }}
                        >
                          {/* Pair + P&L */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span
                                className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-extrabold ${trade.direction === 'Long'
                                  ? 'bg-emerald-500/10 text-emerald-600'
                                  : 'bg-rose-500/10 text-rose-600'
                                  }`}
                              >
                                {trade.direction === 'Long' ? (
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                ) : (
                                  <ArrowDownRight className="w-3.5 h-3.5" />
                                )}
                              </span>
                              <span className="font-bold text-[0.95rem] font-mono">
                                {trade.pair}
                              </span>
                            </div>
                            <span
                              className={`font-mono font-extrabold text-base ${trade.pnl !== undefined && trade.pnl !== null && trade.pnl >= 0 ? 'text-emerald-600' : (trade.pnl !== undefined && trade.pnl !== null ? 'text-rose-600' : 'text-journal-text-muted')}`}
                            >
                              {trade.pnl !== undefined && trade.pnl !== null ? `${trade.pnl >= 0 ? '+' : ''}$${trade.pnl.toFixed(2)}` : '—'}
                            </span>
                          </div>

                          {/* Detail grid */}
                          <div className="grid grid-cols-3 gap-x-2 gap-y-3 py-2.5 border-y border-border-light max-sm:grid-cols-2">
                            {[
                              { label: 'Entry', val: `$${trade.entryPrice.toLocaleString()}`, icon: LogIn },
                              { label: 'Exit', val: trade.exitPrice !== undefined && trade.exitPrice !== null ? `$${trade.exitPrice.toLocaleString()}` : '—', icon: LogOut },
                              { label: 'Size', val: trade.positionSize.toString(), icon: Layers },
                              {
                                label: 'Profit Lvl',
                                val: trade.profitLevel !== undefined && trade.profitLevel !== null ? `$${trade.profitLevel.toLocaleString()}` : '—',
                                color: trade.profitLevel !== undefined && trade.profitLevel !== null ? 'text-profit font-bold' : '',
                                icon: Target,
                              },
                              {
                                label: 'Stop Lvl',
                                val: trade.stopLevel !== undefined && trade.stopLevel !== null ? `$${trade.stopLevel.toLocaleString()}` : '—',
                                color: trade.stopLevel !== undefined && trade.stopLevel !== null ? 'text-loss font-bold' : '',
                                icon: ShieldAlert,
                              },
                              { label: 'R:R', val: trade.riskReward > 0 ? `${trade.riskReward.toFixed(1)}` : '—', icon: Scale },
                            ].map((d) => {
                              const DetailIcon = d.icon;
                              return (
                                <div key={d.label} className="flex flex-col gap-0.5">
                                  <span className="text-[0.65rem] font-bold uppercase tracking-wider text-journal-text-muted flex items-center gap-1">
                                    <DetailIcon className="w-3 h-3 opacity-60" />
                                    {d.label}
                                  </span>
                                  <span className={`font-mono text-[0.82rem] font-semibold ${d.color || ''}`}>
                                    {d.val}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Notes */}
                          {trade.notes && (
                            <p className="text-[0.82rem] text-journal-text-secondary leading-relaxed italic">
                              {trade.notes}
                            </p>
                          )}

                          {/* Chart screenshots */}
                          {imageEditingTradeId === trade.id ? (
                            <TradeImageEditor
                              trade={trade}
                              onClose={() => setImageEditingTradeId(null)}
                            />
                          ) : (
                            <>
                              {tradeImages.length > 0 && (
                                <div
                                  className={`mt-2 grid gap-2 ${tradeImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                                    }`}
                                >
                                  {tradeImages.map((img, idx) => (
                                    <button
                                      key={`${img}-${idx}`}
                                      type="button"
                                      className="rounded-xl overflow-hidden border border-neutral-200 cursor-pointer hover:scale-[1.01] hover:shadow-sm transition-all p-0 bg-transparent w-full aspect-[16/10]"
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
                            </>
                          )}

                          {/* Actions (Edit & Delete) */}
                          <div className="self-end flex items-center gap-3 flex-wrap justify-end">
                            {!deleteConfirmId && imageEditingTradeId !== trade.id && (
                              <button
                                className="text-[0.72rem] font-semibold text-journal-text-muted bg-transparent border-none cursor-pointer px-2 py-1 rounded-md hover:text-journal-text hover:bg-neutral-100 transition-colors flex items-center gap-1"
                                onClick={() => {
                                  setDeleteConfirmId(null);
                                  setImageEditingTradeId(trade.id);
                                }}
                              >
                                <ImagePlus className="w-3 h-3" />
                                {tradeImages.length > 0 ? 'Edit Images' : 'Add Image'}
                              </button>
                            )}
                            {!deleteConfirmId && imageEditingTradeId !== trade.id && (
                              <button
                                className="text-[0.72rem] font-semibold text-journal-text-muted bg-transparent border-none cursor-pointer px-2 py-1 rounded-md hover:text-journal-text hover:bg-neutral-100 transition-colors flex items-center gap-1"
                                onClick={() => {
                                  setImageEditingTradeId(null);
                                  setEditingTrade(trade);
                                }}
                              >
                                <Edit2 className="w-3 h-3" /> Edit
                              </button>
                            )}
                            {deleteConfirmId === trade.id ? (
                              <div className="flex items-center gap-2 animate-fade-in">
                                <span className="text-[0.7rem] font-bold text-rose-600">Delete this trade?</span>
                                <button
                                  className="text-[0.72rem] font-bold text-rose-600 bg-rose-500/10 px-2.5 py-1 rounded-md cursor-pointer hover:bg-rose-500/20 transition-colors"
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
                            ) : imageEditingTradeId !== trade.id ? (
                              <button
                                className="text-[0.72rem] font-semibold text-journal-text-muted bg-transparent border-none cursor-pointer px-2 py-1 rounded-md hover:text-rose-600 hover:bg-rose-500/10 transition-colors flex items-center gap-1"
                                onClick={() => {
                                  setImageEditingTradeId(null);
                                  setDeleteConfirmId(trade.id);
                                }}
                              >
                                <Trash2 className="w-3 h-3" /> Delete
                              </button>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                    <div className="w-20 h-20 rounded-2xl bg-neutral-100 border border-neutral-200/60 flex items-center justify-center mb-4">
                      <FileText className="w-10 h-10 text-neutral-400" />
                    </div>
                    <p className="text-lg font-extrabold text-journal-text tracking-tight">
                      No trades logged today
                    </p>
                    <p className="text-sm text-journal-text-muted mt-2 max-w-[280px] leading-relaxed">
                      Add your first trade to start tracking your performance for this day.
                    </p>
                  </div>
                )}
              </div>

              {/* Sticky footer */}
              <div className="shrink-0 px-6 py-4 border-t border-border-light bg-journal-card max-sm:px-4">
                <button
                  className="w-full py-3.5 rounded-[var(--radius-button)] bg-journal-text text-journal-text-inverse font-bold text-[0.9rem] cursor-pointer hover:bg-[#1a1616] hover:shadow-card-hover transition-all active:scale-[0.97]"
                  onClick={() => setShowForm(true)}
                >
                  + Add New Trade
                </button>
              </div>
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
              className="absolute top-5 right-5 w-10 h-10 rounded-full border-none bg-white/15 text-white cursor-pointer flex items-center justify-center hover:bg-white/30 transition-colors"
              onClick={() => setExpandedImage(null)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   TradeImageEditor – Add / edit chart screenshots
   ═══════════════════════════════════════════════ */

interface TradeImageEditorProps {
  trade: Trade;
  onClose: () => void;
}

function TradeImageEditor({ trade, onClose }: TradeImageEditorProps) {
  const { activeProfileId } = useProfiles();
  const { updateTrade } = useTrades(activeProfileId);
  const fileRef = useRef<HTMLInputElement>(null);

  const [imageList, setImageList] = useState<string[]>(() => getTradeImages(trade));
  const [pendingPreviews, setPendingPreviews] = useState<string[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [saving, setSaving] = useState(false);


  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const addFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;
    setPendingFiles((prev) => [...prev, ...fileArray]);
    setPendingPreviews((prev) => [
      ...prev,
      ...fileArray.map((f) => URL.createObjectURL(f)),
    ]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) addFiles(e.target.files);
    e.target.value = '';
  };

  const removeSavedImage = (index: number) => {
    setImageList((prev) => prev.filter((_, i) => i !== index));
  };

  const removePendingImage = (index: number) => {
    setPendingPreviews((prev) => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of pendingFiles) {
        uploadedUrls.push(await uploadTradeImage(file));
      }

      const finalList = [...imageList, ...uploadedUrls];

      await updateTrade(trade.id, {
        pair: trade.pair,
        direction: trade.direction,
        entryPrice: trade.entryPrice,
        exitPrice: trade.exitPrice,
        positionSize: trade.positionSize,
        profitLevel: trade.profitLevel,
        stopLevel: trade.stopLevel,
        riskReward: trade.riskReward,
        notes: trade.notes,
        image_url: finalList[0] || '',
        images: finalList.slice(1),
        createdAt: trade.createdAt,
        status: trade.status,
      });

      onClose();
    } catch (err) {
      console.error('[TradeImageEditor] Save failed:', err);
      alert('Failed to save images. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const allPreviews = [...imageList, ...pendingPreviews];

  return (
    <div className="mt-2 p-3 rounded-xl border border-border-light bg-journal-bg/50 flex flex-col gap-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-[0.78rem] font-bold uppercase tracking-wider text-journal-text-secondary flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5" />
          Chart Screenshots
        </span>
        <button
          type="button"
          onClick={onClose}
          className="text-[0.72rem] font-semibold text-journal-text-muted bg-transparent border-none cursor-pointer px-2 py-1 rounded-md hover:text-journal-text hover:bg-neutral-100 transition-colors"
        >
          Cancel
        </button>
      </div>

      {allPreviews.length > 0 && (
        <div
          className={`grid gap-2 ${allPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
            }`}
        >
          {imageList.map((img, idx) => (
            <div
              key={`saved-${img}-${idx}`}
              className="relative rounded-xl overflow-hidden border border-neutral-200 aspect-[16/10] bg-neutral-50"
            >
              <img
                src={img}
                alt={`Chart ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => removeSavedImage(idx)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full border-none bg-black/60 text-white cursor-pointer flex items-center justify-center hover:bg-rose-600 transition-colors"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
          {pendingPreviews.map((img, idx) => (
            <div
              key={`pending-${idx}`}
              className="relative rounded-xl overflow-hidden border border-dashed border-neutral-300 aspect-[16/10] bg-neutral-50"
            >
              <img
                src={img}
                alt={`New chart ${idx + 1}`}
                className="w-full h-full object-cover opacity-90"
              />
              <span className="absolute top-2 left-2 text-[0.6rem] font-bold uppercase tracking-wide bg-journal-text text-white px-1.5 py-0.5 rounded">
                New
              </span>
              <button
                type="button"
                onClick={() => removePendingImage(idx)}
                className="absolute top-2 right-2 w-7 h-7 rounded-full border-none bg-black/60 text-white cursor-pointer flex items-center justify-center hover:bg-rose-600 transition-colors"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`w-full min-h-[100px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer p-4 text-center transition-all duration-200 ${dragActive
          ? 'border-journal-text bg-journal-bg/50'
          : 'border-neutral-300 bg-transparent hover:border-neutral-400 hover:bg-neutral-50/50'
          }`}
      >
        <Upload className="w-4 h-4 text-neutral-500" />
        <p className="text-[0.72rem] font-semibold text-neutral-700">
          Click or drag to add screenshot
        </p>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="self-end px-4 py-2 rounded-lg bg-journal-text text-journal-text-inverse font-semibold text-[0.78rem] cursor-pointer hover:bg-[#1a1616] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
      >
        {saving ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Images'
        )}
      </button>
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
  const [saving, setSaving] = useState(false);

  // Storage upload states (support multiple files)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>(() => (editingTrade?.image_url ? [editingTrade.image_url, ...(editingTrade.images ?? [])] : []));
  const [dragActive, setDragActive] = useState(false);

  // Position sizing calculator states
  const [showSizing, setShowSizing] = useState(false);
  const [accountBalance, setAccountBalance] = useState(editingTrade ? '' : '');
  const [riskPercent, setRiskPercent] = useState('1');
  const [stopLossPipsCalc, setStopLossPipsCalc] = useState('');

  // Pre-trade checklist & grade
  const [followedPlan, setFollowedPlan] = useState(false);
  const [notEmotional, setNotEmotional] = useState(false);
  const [riskDefined, setRiskDefined] = useState(false);
  const [setupGrade, setSetupGrade] = useState<string | null>(editingTrade?.setup_grade ?? null);

  // Advanced info (news event)
  const [showAdvancedInfo, setShowAdvancedInfo] = useState(false);
  const [newsEvent, setNewsEvent] = useState<string>(editingTrade?.news_event ?? 'None');
  const [isActiveEntry, setIsActiveEntry] = useState(false);
  const [closeExitPrice, setCloseExitPrice] = useState('');
  const [closePnl, setClosePnl] = useState('');
  const [breakevenPrice, setBreakevenPrice] = useState<string>(editingTrade?.exitPrice ? String(editingTrade.exitPrice) : '');

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'));
      if (files.length === 0) return;
      setSelectedFiles((prev) => [...prev, ...files]);
      setPreviewUrls((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'));
      if (files.length === 0) return;
      setSelectedFiles((prev) => [...prev, ...files]);
      setPreviewUrls((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
    }
    if (e.target) e.target.value = '';
  };

  const handleRemoveImage = (index: number) => {
    setPreviewUrls((prev) => {
      const url = prev[index];
      try { if (url && url.startsWith('blob:')) URL.revokeObjectURL(url); } catch (e) { }
      return prev.filter((_, i) => i !== index);
    });
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Persist last used pair to localStorage so user doesn't retype it
  useEffect(() => {
    if (!editingTrade) {
      try {
        const last = localStorage.getItem('journal.lastPair');
        if (last) setPair(last);
      } catch (e) { }
    }
  }, [editingTrade]);

  useEffect(() => {
    try {
      if (pair) localStorage.setItem('journal.lastPair', pair);
    } catch (e) { }
  }, [pair]);

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

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!pair || !entryPrice || !positionSize) return;
    if (!setupGrade) {
      alert('Please select a Setup Grade (A, B, or C) before saving.');
      return;
    }
    setSaving(true);

    try {
      // Upload any newly selected files to Supabase Storage and build final image list
      const uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        try {
          for (const f of selectedFiles) {
            uploadedUrls.push(await uploadTradeImage(f));
          }
        } catch (uploadError) {
          const message = uploadError instanceof Error ? uploadError.message : 'Unknown upload error';
          console.error('[Supabase Storage] Upload error:', message);
          alert('Failed to upload chart image to storage: ' + message);
          setSaving(false);
          return;
        }
      }

      // Combine existing images (if editing) with newly uploaded ones
      const existing = editingTrade
        ? ([editingTrade.image_url, ...(editingTrade.images ?? [])].filter((x): x is string => Boolean(x)))
        : (previewUrls.filter(Boolean) as string[]);
      const finalList = ([...existing, ...uploadedUrls].filter(Boolean) as string[]);
      const finalImageUrl = finalList[0] || '';


      const entryNum = parseFloat(entryPrice);
      const tpPriceNum = parseFloat(tpPrice) || undefined;
      const slPriceNum = parseFloat(slPrice) || undefined;

      // Determine status
      let status: 'OPEN' | 'CLOSED' = isActiveEntry ? 'OPEN' : 'CLOSED';

      // If editing an existing OPEN trade and the user provided close values, treat as close
      if (editingTrade && editingTrade.status === 'OPEN' && closeExitPrice) {
        status = 'CLOSED';
      }

      let exitPriceForSave: number | null = null;
      let pnlForSave: number | null = null;

      if (status === 'OPEN') {
        exitPriceForSave = null;
        pnlForSave = null;
      } else {
        // Closed trade — compute exitPrice/pnl either from outcome/TP/SL or from explicit close fields
        if (editingTrade && editingTrade.status === 'OPEN' && closeExitPrice) {
          exitPriceForSave = parseFloat(closeExitPrice);
          pnlForSave = closePnl ? Number(parseFloat(closePnl).toFixed(2)) : null;
        } else {
          const breakevenPriceNum = parseFloat(breakevenPrice);
          const computedExitPrice = outcome === 'Win'
            ? (tpPriceNum ?? entryNum)
            : outcome === 'Loss'
              ? (slPriceNum ?? entryNum)
              : (!isNaN(breakevenPriceNum) ? breakevenPriceNum : entryNum);
          exitPriceForSave = computedExitPrice;
          const rawPnl = direction === 'Long' ? (exitPriceForSave - entryNum) * parseFloat(positionSize) : (entryNum - exitPriceForSave) * parseFloat(positionSize);
          pnlForSave = Number(rawPnl.toFixed(2));
        }
      }

      const tradeData = {
        pair: pair.toUpperCase(),
        direction,
        entryPrice: entryNum,
        exitPrice: exitPriceForSave,
        positionSize: parseFloat(positionSize),
        profitLevel: tpPriceNum,
        stopLevel: slPriceNum,
        riskReward: parseFloat(riskReward) || 0,
        notes,
        images: finalList.slice(1),
        image_url: finalImageUrl,
        setup_grade: setupGrade,
        news_event: newsEvent,
        createdAt: date + 'T12:00:00',
        status,
      };

      if (editingTrade) {
        await updateTrade(editingTrade.id, tradeData);
        // If we computed pnlForSave manually for closing, update the row directly for pnl/outcome consistency
        if (status === 'CLOSED' && pnlForSave !== null) {
          // updateTrade already sets pnl/outcome when status is CLOSED
        }
      } else {
        await addTrade(tradeData);
      }

      onClose();
    } catch (error: any) {
      console.error('Supabase Insert Error:', error);
      // also keep the original logging for context
      console.error('[Trade Form] Submission failed:', error);
      alert('Error: ' + (error?.message || String(error)));
    } finally {
      setSaving(false);
    }
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
    <form className="flex flex-col flex-1 min-h-0" onSubmit={handleSubmit}>
      <div className="flex-1 overflow-y-auto max-h-[60vh] custom-scrollbar px-6 py-4 max-sm:px-4 flex flex-col gap-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-[1.15rem] font-extrabold">
            {editingTrade ? 'Edit Trade' : 'Add New Trade'}
          </h3>
          <span className="text-[0.82rem] font-semibold text-journal-text-muted bg-journal-bg px-3 py-1 rounded-full">
            {dateLabel}
          </span>
        </div>

        {/* Create mode toggle: Closed vs Active */}
        {!editingTrade && (
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsActiveEntry(false)}
              className={`px-3 py-1.5 rounded-md font-semibold ${!isActiveEntry ? 'bg-journal-text text-journal-text-inverse' : 'bg-transparent text-journal-text-muted'}`}>
              Log Closed Trade
            </button>
            <button
              type="button"
              onClick={() => setIsActiveEntry(true)}
              className={`px-3 py-1.5 rounded-md font-semibold ${isActiveEntry ? 'bg-emerald-50 text-emerald-700' : 'bg-transparent text-journal-text-muted'}`}>
              Enter Active Trade
            </button>
          </div>
        )}

        {/* Close existing OPEN trade */}
        {editingTrade && editingTrade.status === 'OPEN' && (
          <div className="mt-3 p-3 rounded-lg border border-border-light bg-journal-bg/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold">Close Position</span>
              <span className="text-sm text-journal-text-muted">Provide final exit and P&L</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[0.75rem] text-journal-text-muted block mb-1">Exit Price</label>
                <input className={inputCls} type="number" step="any" value={closeExitPrice} onChange={(e) => setCloseExitPrice(e.target.value)} placeholder="e.g. 1234.56" />
              </div>
              <div>
                <label className="text-[0.75rem] text-journal-text-muted block mb-1">Final P&L ($)</label>
                <input className={inputCls} type="number" step="any" value={closePnl} onChange={(e) => setClosePnl(e.target.value)} placeholder="e.g. 12.34" />
              </div>
            </div>
          </div>
        )}

        {/* Direction toggle */}
        <div className="grid grid-cols-2 gap-2 bg-journal-bg p-1 rounded-[var(--radius-button)]">
          <button
            type="button"
            onClick={() => handleDirectionChange('Long')}
            className={`text-[0.85rem] font-bold py-2.5 border-none rounded-md cursor-pointer transition-all flex items-center justify-center gap-1 ${direction === 'Long'
              ? 'bg-emerald-500/10 text-emerald-700 shadow-sm'
              : 'bg-transparent text-journal-text-secondary'
              }`}
          >
            <ArrowUpRight className="w-4 h-4" /> Long
          </button>
          <button
            type="button"
            onClick={() => handleDirectionChange('Short')}
            className={`text-[0.85rem] font-bold py-2.5 border-none rounded-md cursor-pointer transition-all flex items-center justify-center gap-1 ${direction === 'Short'
              ? 'bg-rose-500/10 text-rose-700 shadow-sm'
              : 'bg-transparent text-journal-text-secondary'
              }`}
          >
            <ArrowDownRight className="w-4 h-4" /> Short
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

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[0.78rem] font-bold uppercase tracking-wider text-journal-text-secondary">
                  Position Size
                </span>
                <button
                  type="button"
                  onClick={() => setShowSizing((s) => !s)}
                  className="p-2 rounded-md bg-transparent hover:bg-neutral-100 transition-colors flex items-center gap-2 text-journal-text-muted"
                  title="Open position sizing calculator"
                >
                  <Calculator className="w-4 h-4" />
                </button>
              </div>

              <input
                className={inputCls}
                type="number"
                step="any"
                placeholder="Qty / Units"
                value={positionSize}
                onChange={(e) => setPositionSize(e.target.value)}
                required
              />

              {showSizing && (
                <div className="mt-2 p-3 rounded-xl border border-border-light bg-journal-bg/50 flex flex-col gap-3">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[0.65rem] font-bold text-journal-text-muted block mb-1">Account ($)</label>
                      <input
                        className={inputCls}
                        type="number"
                        step="any"
                        placeholder="e.g. 10000"
                        value={accountBalance}
                        onChange={(e) => setAccountBalance(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[0.65rem] font-bold text-journal-text-muted block mb-1">Risk %</label>
                      <input
                        className={inputCls}
                        type="number"
                        step="any"
                        placeholder="e.g. 1"
                        value={riskPercent}
                        onChange={(e) => setRiskPercent(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="text-[0.65rem] font-bold text-journal-text-muted block mb-1">Stop Loss (pips)</label>
                      <input
                        className={inputCls}
                        type="number"
                        step="any"
                        placeholder="e.g. 20"
                        value={stopLossPipsCalc}
                        onChange={(e) => setStopLossPipsCalc(e.target.value)}
                      />
                    </div>
                  </div>

                  <SizingPreview
                    entryPrice={parseFloat(entryPrice || '0')}
                    accountBalance={accountBalance}
                    riskPercent={riskPercent}
                    stopLossPips={stopLossPipsCalc}
                    getPipSize={getPipSize}
                    onApply={(size) => setPositionSize(size)}
                  />
                </div>
              )}
            </div>
          </div>

          <>
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
                  <option value="Win">Win (hits TP)</option>
                  <option value="Loss">Loss (hits SL)</option>
                  <option value="Breakeven">Breakeven</option>
                </select>
              </Field>
              {outcome === 'Breakeven' && (
                <div>
                  <label className="text-[0.65rem] font-bold text-journal-text-muted block mb-1">Breakeven Price</label>
                  <input
                    className={inputCls}
                    type="number"
                    step="any"
                    placeholder="Breakeven price"
                    value={breakevenPrice}
                    onChange={(e) => setBreakevenPrice(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* P&L preview */}
            {previewPnl !== null && (
              <div
                className={`flex items-center justify-between px-4 py-3 rounded-xl animate-fade-in border ${previewPnl >= 0
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-rose-500/10 border-rose-500/20'
                  }`}
              >
                <span className="text-[0.8rem] font-semibold text-journal-text-secondary">
                  Estimated P&L ({outcome})
                </span>
                <span
                  className={`font-mono text-[1.1rem] font-extrabold ${previewPnl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {previewPnl >= 0 ? '+' : ''}${previewPnl.toFixed(2)}
                </span>
              </div>
            )}
          </>
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

        {/* Pre-Trade Checklist & Setup Grade */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[0.78rem] font-bold uppercase tracking-wider text-journal-text-secondary">Pre-Trade Checklist</span>
            <button
              type="button"
              onClick={() => { setFollowedPlan(false); setNotEmotional(false); setRiskDefined(false); setSetupGrade(null); }}
              className="text-[0.72rem] text-journal-text-muted hover:underline"
            >Reset</button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-[0.9rem]"><input type="checkbox" checked={followedPlan} onChange={(e) => setFollowedPlan(e.target.checked)} /> Followed Trading Plan</label>
            <label className="flex items-center gap-2 text-[0.9rem]"><input type="checkbox" checked={notEmotional} onChange={(e) => setNotEmotional(e.target.checked)} /> Not Emotional</label>
            <label className="flex items-center gap-2 text-[0.9rem]"><input type="checkbox" checked={riskDefined} onChange={(e) => setRiskDefined(e.target.checked)} /> Risk Defined</label>
          </div>

          <div>
            <span className="text-[0.78rem] font-bold uppercase tracking-wider text-journal-text-secondary">Setup Grade</span>
            <div className="mt-2 flex items-center gap-3">
              {['A', 'B', 'C'].map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSetupGrade(g)}
                  className={`px-4 py-2 rounded-lg font-bold border ${setupGrade === g ? 'ring-2 ring-offset-2' : 'bg-transparent'} ${g === 'A' ? 'bg-emerald-50 text-emerald-700' : ' '} ${g === 'B' ? 'bg-yellow-50 text-yellow-700' : ' '} ${g === 'C' ? 'bg-rose-50 text-rose-700' : ''}`}
                >{g}</button>
              ))}
            </div>
          </div>

          {/* Advanced Info: News Event */}
          <div className="mt-1">
            <button
              type="button"
              onClick={() => setShowAdvancedInfo((s) => !s)}
              className="flex items-center gap-2 text-[0.85rem] text-journal-text-muted hover:underline"
            >
              <Megaphone className="w-4 h-4" /> Advanced Info
            </button>

            {showAdvancedInfo && (
              <div className="mt-2">
                <select className={inputCls} value={newsEvent} onChange={(e) => setNewsEvent(e.target.value)}>
                  <option>None</option>
                  <option>NFP</option>
                  <option>CPI</option>
                  <option>FOMC</option>
                  <option>Interest Rate Decision</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Chart Screenshot upload dropzone */}
        <div className="flex flex-col gap-2">
          <span className="text-[0.78rem] font-bold uppercase tracking-wider text-journal-text-secondary">
            Chart Screenshot
          </span>

          {previewUrls && previewUrls.length > 0 ? (
            <div className={`grid gap-2 ${previewUrls.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {previewUrls.map((url, idx) => (
                <div key={`${url}-${idx}`} className="relative rounded-2xl overflow-hidden border border-neutral-200 shadow-sm max-w-full aspect-[16/10] bg-neutral-50 flex items-center justify-center">
                  <img src={url} alt={`Chart preview ${idx + 1}`} className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full border-none bg-black/60 text-white cursor-pointer flex items-center justify-center hover:bg-rose-600 transition-colors shadow-sm"
                    title="Remove screenshot"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`w-full min-h-[140px] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2.5 cursor-pointer p-6 text-center transition-all duration-200 ${dragActive
                ? 'border-journal-text bg-journal-bg/50'
                : 'border-neutral-300 bg-transparent hover:border-neutral-400 hover:bg-neutral-50/50'
                }`}
            >
              <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center">
                <ImagePlus className="w-5 h-5 text-neutral-500" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-800">
                  Click to upload or drag & drop
                </p>
                <p className="text-[0.68rem] text-neutral-400 mt-0.5">
                  PNG, JPG, or WEBP chart screenshot (Max 5MB)
                </p>
              </div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Sticky footer */}
      <div className="shrink-0 flex justify-end gap-2 px-6 py-4 border-t border-border-light bg-journal-card max-sm:px-4">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 rounded-[var(--radius-button)] bg-transparent border-[1.5px] border-border-medium text-journal-text font-semibold text-[0.875rem] cursor-pointer hover:bg-journal-card hover:border-border-strong transition-all active:scale-[0.97]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!pair || !entryPrice || !positionSize || !setupGrade || saving}
          className="px-5 py-2.5 rounded-xl bg-journal-text text-journal-text-inverse font-semibold text-[0.875rem] cursor-pointer hover:bg-[#1a1616] hover:shadow-card-hover transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Saving Trade...
            </>
          ) : (
            'Save Trade'
          )}
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

function SizingPreview({
  entryPrice,
  accountBalance,
  riskPercent,
  stopLossPips,
  getPipSize,
  onApply,
}: {
  entryPrice: number;
  accountBalance: string;
  riskPercent: string;
  stopLossPips: string;
  getPipSize: (entry: number) => number;
  onApply: (size: string) => void;
}) {
  const acc = parseFloat(accountBalance || '0');
  const rp = parseFloat(riskPercent || '0');
  const stopPips = parseFloat(stopLossPips || '0');
  const pipSize = getPipSize(entryPrice || 0) || 0.0001;
  const riskAmount = acc * (rp / 100);
  const suggestedSize = stopPips > 0 && pipSize > 0 ? Math.max(0, riskAmount / (stopPips * pipSize)) : 0;

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col">
        <span className="text-[0.75rem] text-journal-text-muted">Risk Amount</span>
        <span className="font-mono font-extrabold">${riskAmount.toFixed(2)}</span>
      </div>
      <div className="flex flex-col">
        <span className="text-[0.75rem] text-journal-text-muted">Suggested Size</span>
        <span className="font-mono font-extrabold">{suggestedSize ? suggestedSize.toFixed(4) : '—'}</span>
      </div>
      <div>
        <button
          type="button"
          onClick={() => onApply(suggestedSize ? suggestedSize.toFixed(4) : '0')}
          className="px-3 py-2 rounded-lg bg-journal-text text-journal-text-inverse font-semibold"
        >
          Apply Size
        </button>
      </div>
    </div>
  );
}


