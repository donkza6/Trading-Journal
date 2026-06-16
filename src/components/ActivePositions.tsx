"use client";

import React from 'react';
import { useTrades, useProfiles } from '@/context/ProfileContext';
import type { Trade } from '@/types';
import { X, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface ActivePositionsProps {
       onRequestClose?: (trade: Trade) => void;
}

export default function ActivePositions({ onRequestClose }: ActivePositionsProps) {
       const { activeProfileId } = useProfiles();
       const { trades } = useTrades(activeProfileId);
       const openTrades = trades.filter((t) => t.status === 'OPEN');

       if (openTrades.length === 0) return null;

       return (
              <section className="animate-fade-in">
                     <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-extrabold">Active Positions</h3>
                            <span className="text-sm text-journal-text-muted font-semibold">{openTrades.length} open</span>
                     </div>

                     <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
                            {openTrades.map((trade) => (
                                   <div key={trade.id} className="bg-journal-card p-4 rounded-2xl border border-neutral-200/50 shadow-sm hover:shadow-md transition-all">
                                          <div className="flex items-start justify-between gap-3">
                                                 <div>
                                                        <div className="flex items-center gap-2">
                                                               <span className="font-mono font-extrabold text-lg">{trade.pair}</span>
                                                               <span className={`text-xs font-bold px-2 py-1 rounded-full ${trade.direction === 'Long' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                                      {trade.direction === 'Long' ? (
                                                                             <span className="flex items-center gap-1"><ArrowUpRight className="w-3 h-3" /> Buy</span>
                                                                      ) : (
                                                                             <span className="flex items-center gap-1"><ArrowDownRight className="w-3 h-3" /> Sell</span>
                                                                      )}
                                                               </span>
                                                        </div>
                                                        <div className="mt-2 text-sm text-journal-text-muted">
                                                               <div>Entry: <span className="font-mono font-semibold">${trade.entryPrice.toLocaleString()}</span></div>
                                                               <div className="mt-1">Opened: <span className="font-semibold">{new Date(trade.createdAt).toLocaleDateString()}</span></div>
                                                        </div>
                                                 </div>

                                                 <div className="flex flex-col items-end gap-2">
                                                        <button
                                                               onClick={() => onRequestClose && onRequestClose(trade)}
                                                               className="text-[0.85rem] font-bold px-3 py-2 rounded-lg bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 transition-all"
                                                        >
                                                               Close Position
                                                        </button>
                                                 </div>
                                          </div>
                                   </div>
                            ))}
                     </div>
              </section>
       );
}
