'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfiles, useTrades } from '@/context/ProfileContext';
import { ArrowUpRight, ArrowDownRight, Plus, X, Zap, Edit2, Trash2, Target, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import type { Trade } from '@/types';
import TradeModal from '@/components/TradeModal';
import { supabase } from '@/lib/supabase';

const PLACEHOLDER_SVG = encodeURIComponent(`
       <svg xmlns='http://www.w3.org/2000/svg' width='800' height='450' viewBox='0 0 800 450'>
              <rect width='100%' height='100%' fill='%23f3f4f6' />
              <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%238B8B8B' font-family='Inter, Arial, sans-serif' font-size='20'>No preview</text>
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

export default function PlansPage() {
       const router = useRouter();
       const [showModal, setShowModal] = useState(false);
       const [editTrade, setEditTrade] = useState<Trade | null>(null);
       const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
       const [executeTarget, setExecuteTarget] = useState<Trade | null>(null);
       const [showExecuteConfirm, setShowExecuteConfirm] = useState(false);

       const { activeProfile, activeProfileId } = useProfiles();
       const { trades, updateTrade, deleteTrade, loading } = useTrades(activeProfileId);
       const [expandedImage, setExpandedImage] = useState<string | null>(null);
       const [selectedPlan, setSelectedPlan] = useState<Trade | null>(null);

       if (!activeProfile) return null;

       const plans = trades.filter((t) => t.status === 'PLAN');

       const executePlan = async (trade: Trade) => {
              setExecuteTarget(trade);
              setShowExecuteConfirm(true);
       };

       const confirmExecute = async () => {
              if (!executeTarget) return;
              try {
                     await updateTrade(executeTarget.id, {
                            pair: executeTarget.pair,
                            direction: executeTarget.direction,
                            entryPrice: executeTarget.entryPrice || 0,
                            exitPrice: null,
                            positionSize: executeTarget.positionSize || 0,
                            profitLevel: executeTarget.profitLevel,
                            stopLevel: executeTarget.stopLevel,
                            riskReward: executeTarget.riskReward || 0,
                            notes: executeTarget.notes || '',
                            images: executeTarget.images || [],
                            image_url: executeTarget.image_url || '',
                            createdAt: new Date().toISOString(),
                            status: 'OPEN',
                     });
                     setShowExecuteConfirm(false);
                     setExecuteTarget(null);
                     toast.success('Trade plan executed successfully!');
                     router.push('/journal');
              } catch (err) {
                     console.error('Failed to execute plan', err);
                     toast.error('Failed to execute plan. See console for details.');
              }
       };

       const today = new Date().toISOString().split('T')[0];

       return (
              <div className="min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
			<header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Trade Plans</h1>
					<p className="text-sm text-gray-500 mt-1">Watchlist &amp; setups — plan your trades before execution</p>
				</div>

				<div className="flex items-center gap-3">
					<button
						onClick={() => { setEditTrade(null); setShowModal(true); }}
						className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
					>
						<Plus className="w-4 h-4" /> Add New Plan
					</button>

					<button
						onClick={() => router.push('/journal')}
						className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-sm font-medium rounded-lg shadow-sm transition-colors"
					>
						Back to Journal
					</button>
				</div>
			</header>

			<main>
				{loading ? (
					<div className="py-20 text-center text-gray-400">Loading...</div>
				) : plans.length === 0 ? (
					<div className="text-center py-20">
						<div className="text-lg font-semibold text-gray-700 mb-3">No trade plans yet</div>
						<div className="text-sm text-gray-500">Create a plan to capture your setups and ideas.</div>
						<div className="mt-6">
							<button
								onClick={() => { setEditTrade(null); setShowModal(true); }}
								className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
							>
								<Plus className="w-4 h-4" /> Add New Plan
							</button>
						</div>
					</div>
				) : (
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                          {plans.map((p) => (
                                                 <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col gap-4">
                                                        {/* Header: Direction pill + Asset name */}
                                                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                                               <div className="flex items-center gap-3">
                                                                      <div className={`w-8 h-8 flex items-center justify-center rounded-lg ${p.direction === 'Long' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                             {p.direction === 'Long' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                                                      </div>
                                                                      <span className="text-gray-900 font-bold text-base">{p.pair}</span>
                                                               </div>
                                                               <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.direction === 'Long' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                                                                      {p.direction}
                                                               </span>
                                                        </div>

                                                        {/* Data Grid: Entry / TP / SL */}
                                                        <div className="grid grid-cols-3 gap-4 border-b border-gray-100 pb-3">
                                                               <div className="flex flex-col gap-0.5">
                                                                      <span className="text-gray-500 text-xs uppercase font-semibold tracking-wide flex items-center gap-1">
                                                                             <Target className="w-3 h-3" /> Entry
                                                                      </span>
                                                                      <span className="text-gray-900 font-medium text-sm">{p.entryPrice ? `$${p.entryPrice}` : '—'}</span>
                                                               </div>
                                                               <div className="flex flex-col gap-0.5">
                                                                      <span className="text-gray-500 text-xs uppercase font-semibold tracking-wide flex items-center gap-1">
                                                                             <Target className="w-3 h-3" /> TP
                                                                      </span>
                                                                      <span className="text-green-600 font-medium text-sm">{p.profitLevel ? `$${p.profitLevel}` : '—'}</span>
                                                               </div>
                                                               <div className="flex flex-col gap-0.5">
                                                                      <span className="text-gray-500 text-xs uppercase font-semibold tracking-wide flex items-center gap-1">
                                                                             <ShieldAlert className="w-3 h-3" /> SL
                                                                      </span>
                                                                      <span className="text-rose-500 font-medium text-sm">{p.stopLevel ? `$${p.stopLevel}` : '—'}</span>
                                                               </div>
                                                        </div>

                                                        {/* Notes */}
                                                        {p.notes && (
                                                               <p className="text-sm text-gray-600 italic leading-relaxed">{p.notes}</p>
                                                        )}

                                                        {/* Images */}
                                                        {(p.image_url || (p.images && p.images.length > 0)) && (
                                                               <div className="flex gap-2 overflow-x-auto py-1">
                                                                      {[...(p.image_url ? [p.image_url] : []), ...(p.images ?? [])].map((src, i) => (
                                                                             <button
                                                                                    key={i}
                                                                                    type="button"
                                                                                    onClick={() => { setExpandedImage(resolveImageSrc(src)); setSelectedPlan(p); }}
                                                                                    className="flex-shrink-0 rounded-lg overflow-hidden border border-gray-100 cursor-pointer hover:shadow-md hover:scale-[1.02] transition-all bg-transparent p-0"
                                                                             >
                                                                                    <img
                                                                                           src={resolveImageSrc(src)}
                                                                                           alt={`chart-${i}`}
                                                                                           className="h-28 rounded-lg object-cover"
                                                                                           onError={(e) => { (e.target as HTMLImageElement).src = PLACEHOLDER; }}
                                                                                    />
                                                                             </button>
                                                                      ))}
                                                               </div>
                                                        )}

                                                        {/* Action Bar */}
                                                        <div className="flex justify-between items-center w-full pt-2 mt-auto">
                                                               <button
                                                                      type="button"
                                                                      onClick={() => executePlan(p)}
                                                                      className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
                                                               >
                                                                      <Zap className="w-4 h-4" /> Execute Trade
                                                               </button>
                                                               <div className="flex items-center gap-1">
                                                                      <button
                                                                             type="button"
                                                                             onClick={() => { setEditTrade(p); setShowModal(true); }}
                                                                             className="px-2 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                                                                      >
                                                                             <Edit2 className="w-3.5 h-3.5 inline mr-1" />Edit
                                                                      </button>
                                                                      <button
                                                                             type="button"
                                                                             onClick={() => setDeleteTargetId(p.id)}
                                                                             className="px-2 py-1.5 rounded-md text-xs font-medium text-gray-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                                                      >
                                                                             <Trash2 className="w-3.5 h-3.5 inline mr-1" />Delete
                                                                      </button>
                                                               </div>
                                                        </div>
                                                 </div>
                                          ))}
                                   </div>
                            )}

                            {expandedImage && selectedPlan && (
                                   <div
                                          className="fixed inset-0 z-[2000] flex items-center justify-center p-6 animate-fade-in"
                                          style={{ background: 'rgba(0,0,0,0.85)' }}
                                          onClick={() => { setExpandedImage(null); setSelectedPlan(null); }}
                                   >
                                          <div className="relative max-w-[90%] max-h-[90%]">
                                                 <img src={expandedImage} alt="expanded" className="max-w-[90vw] max-h-[70vh] object-contain rounded-md shadow-md" />
                                                 <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); setExpandedImage(null); setSelectedPlan(null); }}
                                                        className="absolute top-3 right-3 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
                                                 >
                                                        <X className="w-5 h-5" />
                                                 </button>

                                                 <div className="mt-3 bg-white rounded-xl p-4 shadow-lg border border-gray-200" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center justify-between gap-4">
                                                               <div>
                                                                      <div className="font-mono font-bold text-gray-900 text-base">{selectedPlan.pair}</div>
                                                                      <div className="text-sm text-gray-500">{selectedPlan.direction} — Entry: {selectedPlan.entryPrice ? `$${selectedPlan.entryPrice}` : '—'}</div>
                                                               </div>
                                                               <div className="text-sm font-semibold text-gray-700 text-right">
                                                                      <span className="text-green-600">TP: {selectedPlan.profitLevel ? `$${selectedPlan.profitLevel}` : '—'}</span>
                                                                      <span className="mx-1 text-gray-300">·</span>
                                                                      <span className="text-rose-500">SL: {selectedPlan.stopLevel ? `$${selectedPlan.stopLevel}` : '—'}</span>
                                                               </div>
                                                        </div>
                                                        {selectedPlan.notes && <p className="mt-2 text-sm text-gray-600 italic leading-relaxed">{selectedPlan.notes}</p>}
                                                 </div>
                                          </div>
                                   </div>
                            )}

                            {showModal && (
                                   <TradeModal
                                          date={today}
                                          onClose={() => { setShowModal(false); setEditTrade(null); }}
                                          initialMode="PLAN"
                                          initialTrade={editTrade ?? null}
                                   />
                            )}

                            {/* Execute confirmation modal */}
                            {showExecuteConfirm && executeTarget && (
                                   <div
                                          className="fixed inset-0 z-[2200] flex items-center justify-center p-6 animate-fade-in"
                                          style={{ background: 'rgba(0,0,0,0.5)' }}
                                   >
                                          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 max-w-md w-full p-6">
                                                 <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Execute Trade Plan?</h3>
                                                 <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">This will move <span className="font-mono font-bold">{executeTarget.pair}</span> to your Active Positions.</p>
                                                 <div className="flex justify-between items-center w-full">
                                                        <button className="px-4 py-2 rounded-md bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700" onClick={() => { setShowExecuteConfirm(false); setExecuteTarget(null); }}>Cancel</button>
                                                        <button className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm" onClick={confirmExecute}>Confirm Execution</button>
                                                 </div>
                                          </div>
                                   </div>
                            )}

                            {/* Delete confirmation modal */}
                            {deleteTargetId && (
                                   <div
                                          className="fixed inset-0 z-[2200] flex items-center justify-center p-6 animate-fade-in"
                                          style={{ background: 'rgba(0,0,0,0.5)' }}
                                   >
                                          <div className="bg-white dark:bg-neutral-900 rounded-xl shadow-lg border border-neutral-200 dark:border-neutral-800 max-w-md w-full p-6">
                                                 <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2">Delete Trade Plan?</h3>
                                                 <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4">Are you sure you want to permanently delete this plan? This action cannot be undone.</p>
                                                 <div className="flex justify-between items-center w-full">
                                                        <button className="px-4 py-2 rounded-md bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-700" onClick={() => setDeleteTargetId(null)}>Cancel</button>
                                                        <button className="px-4 py-2 rounded-md bg-rose-600 text-white text-sm" onClick={async () => {
                                                               try {
                                                                      await deleteTrade(deleteTargetId);
                                                                      setDeleteTargetId(null);
                                                                      toast.success('Trade plan deleted');
                                                               } catch (err) {
                                                                      console.error('Failed deleting plan', err);
                                                                      toast.error('Failed to delete plan. See console for details.');
                                                               }
                                                        }}>Delete</button>
                                                 </div>
                                          </div>
                                   </div>
                            )}
                     </main>
              </div>
       );
}