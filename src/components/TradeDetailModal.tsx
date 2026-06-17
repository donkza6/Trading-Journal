'use client';

import React, { useState } from 'react';
import type { Trade } from '@/types';
import { X, ArrowUpRight, ArrowDownRight, Edit2, Target, Calendar, Clock, AlertTriangle, Share } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface TradeDetailModalProps {
  trade: Trade;
  onClose: () => void;
  onEdit: (trade: Trade) => void;
  onClosePosition: (trade: Trade) => void;
}

const PLACEHOLDER_SVG = encodeURIComponent(`
<svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
  <rect width='100%' height='100%' fill='%23f3f4f6' />
  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%238B8B8B' font-family='Inter, Arial, sans-serif' font-size='20'>No Image</text>
</svg>
`);
const PLACEHOLDER = `data:image/svg+xml;utf8,${PLACEHOLDER_SVG}`;

function resolveImageSrc(raw?: string | null) {
  if (!raw) return PLACEHOLDER;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.includes('/')) return raw;
  if (/\.[a-zA-Z0-9]{1,5}$/.test(raw)) {
    try {
      const { data } = supabase.storage.from('trade-images').getPublicUrl(raw);
      if (data && (data as any).publicUrl) return (data as any).publicUrl as string;
    } catch (e) {
      return PLACEHOLDER;
    }
  }
  return PLACEHOLDER;
}

export default function TradeDetailModal({ trade, onClose, onEdit, onClosePosition }: TradeDetailModalProps) {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const images = trade.images && trade.images.length > 0 ? trade.images : (trade.image_url ? [trade.image_url] : []);

  const exportCardToImage = async () => {
    const el = document.getElementById('trade-card-export');
    if (!el) return;

    // Temporarily remove constraints to capture the full content if it scrolls
    const originalMaxHeight = el.style.maxHeight;
    const originalOverflow = el.style.overflow;
    el.style.maxHeight = 'none';
    el.style.overflow = 'visible';

    const bodyEl = document.getElementById('trade-card-body');
    let originalBodyOverflow = '';
    if (bodyEl) {
      originalBodyOverflow = bodyEl.style.overflow;
      bodyEl.style.overflow = 'visible';
    }

    // Small delay to ensure styles apply
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const canvas = await html2canvas(el, {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#0a0a0a' : '#f5f5f5',
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${trade.pair}-Setup-${new Date(trade.createdAt).toISOString().split('T')[0]}.png`;
      link.href = dataUrl;
      link.click();

      toast.success('Trade card exported to image!');
    } catch (error) {
      console.error('Failed to export image:', error);
      toast.error('Failed to export image. Please try again.');
    } finally {
      el.style.maxHeight = originalMaxHeight;
      el.style.overflow = originalOverflow;
      if (bodyEl) {
        bodyEl.style.overflow = originalBodyOverflow;
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 max-sm:p-2 sm:p-6 bg-black/40 backdrop-blur-sm animate-fade-in overflow-hidden">
        <div id="trade-card-export" className="relative bg-journal-bg w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[calc(var(--radius-panel)*1.2)] shadow-modal overflow-hidden transform transition-all duration-300 scale-100 border border-neutral-200/60 dark:border-neutral-800">
          
          {/* Header */}
          <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-border-light bg-journal-card max-sm:px-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-journal-text">{trade.pair}</h2>
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-md ${trade.direction === 'Long' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {trade.direction === 'Long' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {trade.direction}
                </span>
                {trade.session && trade.session !== 'None' && (
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md text-[10px] font-bold tracking-wider uppercase">
                    {trade.session}
                  </span>
                )}
                {trade.status === 'OPEN' && (
                  <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-md text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> LIVE
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2" data-html2canvas-ignore="true">
              <button
                onClick={exportCardToImage}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                title="Export as Image"
              >
                <Share className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div id="trade-card-body" className="flex-1 overflow-y-auto p-6 max-sm:p-4 flex flex-col gap-6">
            
            {/* The Levels Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white/80 dark:bg-white/5 backdrop-blur-sm rounded-[0.85rem] border border-neutral-200/60 dark:border-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
              <div className="flex flex-col gap-1">
                <span className="text-[0.65rem] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1"><Target className="w-3 h-3" /> Entry</span>
                <span className="font-mono text-[1.05rem] font-extrabold text-journal-text">${trade.entryPrice}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[0.65rem] font-bold text-emerald-600/70 uppercase tracking-wider flex items-center gap-1"><Target className="w-3 h-3" /> Take Profit</span>
                <span className="font-mono text-[1.05rem] font-extrabold text-emerald-600">{trade.profitLevel ? `$${trade.profitLevel}` : '—'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[0.65rem] font-bold text-rose-600/70 uppercase tracking-wider flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Stop Loss</span>
                <span className="font-mono text-[1.05rem] font-extrabold text-rose-600">{trade.stopLevel ? `$${trade.stopLevel}` : '—'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[0.65rem] font-bold text-neutral-500 uppercase tracking-wider">Position Size</span>
                <span className="font-mono text-[1.05rem] font-extrabold text-journal-text">{trade.positionSize} units</span>
              </div>
            </div>

            {/* Time / Dates */}
            <div className="flex items-center gap-6 text-sm text-neutral-500 font-medium px-1">
              <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Opened: {new Date(trade.createdAt).toLocaleDateString()}</span>
              {trade.entryTime && <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> Time: {trade.entryTime}</span>}
            </div>

            {/* Notes & Reasoning */}
            {trade.notes && (
              <div className="flex flex-col gap-2">
                <h3 className="text-[0.78rem] font-bold uppercase tracking-wider text-neutral-400 px-1">Notes & Reasoning</h3>
                <div className="bg-white/80 dark:bg-white/5 backdrop-blur-sm border border-neutral-200/60 dark:border-white/10 rounded-[0.85rem] p-4 text-[0.9rem] text-journal-text font-medium leading-relaxed whitespace-pre-wrap shadow-[0_4px_16px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.2)]">
                  {trade.notes}
                </div>
              </div>
            )}

            {/* Charts */}
            {images.length > 0 && (
              <div className="flex flex-col gap-2">
                <h3 className="text-[0.78rem] font-bold uppercase tracking-wider text-neutral-400 px-1">Chart Images</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {images.map((img, i) => {
                    const src = resolveImageSrc(img);
                    return (
                      <button 
                        key={i} 
                        onClick={() => setExpandedImage(src)}
                        className="group relative rounded-xl overflow-hidden border border-neutral-200/60 dark:border-neutral-800 aspect-video block w-full hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
                      >
                        <img 
                          src={src} 
                          alt="Chart" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div data-html2canvas-ignore="true" className="shrink-0 flex items-center justify-between px-6 py-4 border-t border-border-light bg-journal-card max-sm:px-4">
            <button
              onClick={() => onEdit(trade)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[0.875rem] font-bold text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Edit Trade
            </button>
            
            <button
              onClick={() => onClosePosition(trade)}
              className="px-6 py-2.5 rounded-xl bg-neutral-900 text-white font-bold text-[0.875rem] hover:bg-neutral-800 hover:shadow-lg transition-all active:scale-[0.97] flex items-center gap-2"
            >
              Close Position
            </button>
          </div>

        </div>
      </div>

      {/* Lightbox */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 sm:p-8 animate-fade-in"
          onClick={() => setExpandedImage(null)}
        >
          <button
            onClick={() => setExpandedImage(null)}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={expandedImage} 
            alt="Expanded Chart" 
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
