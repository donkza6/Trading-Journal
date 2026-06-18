'use client';

import React, { useState } from 'react';
import { X, Plus, Trash2, ArrowUpRight, ArrowDownRight, Wallet, Settings, Edit2, Save } from 'lucide-react';
import { useWallet, useProfiles } from '@/context/ProfileContext';

interface WalletModalProps {
  onClose: () => void;
  totalRealizedPnl: number;
}

export default function WalletModal({ onClose, totalRealizedPnl }: WalletModalProps) {
  const { activeProfile, updateProfileCurrency } = useProfiles();
  const { 
    transactions, 
    totalDeposits, 
    totalWithdrawals, 
    netFunding, 
    addTransaction, 
    deleteTransaction,
    resetWallet
  } = useWallet(activeProfile?.id || null);

  const [isAdding, setIsAdding] = useState(false);
  const [type, setType] = useState<'DEPOSIT' | 'WITHDRAWAL'>('DEPOSIT');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isEditingBalance, setIsEditingBalance] = useState(false);
  const [newBalanceInput, setNewBalanceInput] = useState('');

  if (!activeProfile) return null;

  const isCent = activeProfile.accountCurrency === 'CENT';

  const formatMoney = (val: number) => {
    return `${val >= 0 ? '' : '-'}$${Math.abs(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const currentBalance = netFunding + totalRealizedPnl;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    await addTransaction(type, Number(amount), notes);
    setIsAdding(false);
    setAmount('');
    setNotes('');
  };

  const handleEditBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBalanceInput || isNaN(Number(newBalanceInput))) return;
    
    const targetBalance = Number(newBalanceInput);
    const difference = targetBalance - currentBalance;
    
    if (Math.abs(difference) > 0.001) {
      if (difference > 0) {
        await addTransaction('DEPOSIT', difference, 'Balance Adjustment');
      } else {
        await addTransaction('WITHDRAWAL', Math.abs(difference), 'Balance Adjustment');
      }
    }
    
    setIsEditingBalance(false);
    setNewBalanceInput('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in overflow-hidden">
      {/* Click outside to close */}
      <div className="absolute inset-0" onClick={onClose} />
      
      <div className="relative w-full max-w-md h-full bg-journal-bg flex flex-col shadow-2xl animate-slide-in-right border-l border-neutral-200/60 dark:border-neutral-800">
        
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-5 border-b border-border-light bg-journal-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shadow-md">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-journal-text leading-tight">Portfolio Wallet</h2>
              <p className="text-xs font-semibold text-journal-text-muted uppercase tracking-wider">{activeProfile.name}'s Ledger</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${showSettings ? 'bg-neutral-100 text-neutral-900' : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50'}`}
              title="Account Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 max-sm:p-4 flex flex-col gap-6">
          
          {/* Settings Panel */}
          {showSettings && (
            <div className="p-4 bg-white dark:bg-neutral-900 border border-neutral-200/60 dark:border-neutral-800 rounded-xl shadow-sm flex flex-col gap-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-journal-text">Account Currency</h4>
                  <p className="text-xs text-journal-text-muted mt-0.5">Change how numbers are formatted.</p>
                </div>
                <div className="flex bg-neutral-100 dark:bg-neutral-800 p-1 rounded-lg">
                  <button
                    onClick={() => updateProfileCurrency(activeProfile.id, 'USD')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${!isCent ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Standard (USD)
                  </button>
                  <button
                    onClick={() => updateProfileCurrency(activeProfile.id, 'CENT')}
                    className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${isCent ? 'bg-white dark:bg-neutral-700 shadow-sm text-neutral-900 dark:text-white' : 'text-neutral-500 hover:text-neutral-700'}`}
                  >
                    Micro (CENT)
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-neutral-200/60 dark:border-neutral-800/60">
                <div>
                  <h4 className="text-sm font-bold text-rose-600">Reset Ledger</h4>
                  <p className="text-xs text-journal-text-muted mt-0.5">Delete all funding transactions.</p>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete ALL funding transactions? This action cannot be undone.')) {
                      resetWallet();
                      setShowSettings(false);
                    }
                  }}
                  className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-600 rounded-lg text-xs font-bold transition-colors shadow-sm active:scale-95"
                >
                  Reset Data
                </button>
              </div>
            </div>
          )}

          {/* Balance Summary */}
          <div className="bg-neutral-900 text-white rounded-2xl p-6 relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="relative z-10 flex flex-col gap-1 items-center text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-1.5">
                  Current Balance
                  <button 
                    onClick={() => { setIsEditingBalance(true); setNewBalanceInput(currentBalance.toString()); }} 
                    className="text-neutral-500 hover:text-white transition-colors" 
                    title="Adjust Balance"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </span>
                {isCent && (
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-md text-[0.65rem] font-bold uppercase tracking-wider">
                    CENT Account
                  </span>
                )}
              </div>
              
              {isEditingBalance ? (
                <form onSubmit={handleEditBalanceSubmit} className="flex items-center gap-2 mt-1">
                  <span className="text-2xl font-bold text-neutral-400">$</span>
                  <input
                    type="number"
                    step="any"
                    value={newBalanceInput}
                    onChange={(e) => setNewBalanceInput(e.target.value)}
                    className="w-32 bg-transparent border-b-2 border-white/20 text-3xl font-black text-center text-white focus:outline-none focus:border-white transition-colors"
                    autoFocus
                  />
                  <button type="submit" title="Save" className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-md hover:bg-emerald-500/40 transition-colors"><Save className="w-4 h-4" /></button>
                  <button type="button" title="Cancel" onClick={() => setIsEditingBalance(false)} className="p-1.5 bg-rose-500/20 text-rose-400 rounded-md hover:bg-rose-500/40 transition-colors"><X className="w-4 h-4" /></button>
                </form>
              ) : (
                <span className="text-4xl sm:text-5xl font-black tracking-tight mt-1">{formatMoney(currentBalance)}</span>
              )}
            </div>
            <div className="relative z-10 grid grid-cols-3 gap-4 mt-8 pt-6 border-t border-white/10 text-center">
              <div>
                <span className="block text-[0.65rem] font-bold text-emerald-400/80 uppercase tracking-wider mb-1">Deposits</span>
                <span className="text-lg font-bold">{formatMoney(totalDeposits)}</span>
              </div>
              <div>
                <span className="block text-[0.65rem] font-bold text-rose-400/80 uppercase tracking-wider mb-1">Withdrawals</span>
                <span className="text-lg font-bold">{formatMoney(totalWithdrawals)}</span>
              </div>
              <div>
                <span className="block text-[0.65rem] font-bold text-blue-400/80 uppercase tracking-wider mb-1">Net P&L</span>
                <span className={`text-lg font-bold ${totalRealizedPnl >= 0 ? 'text-white' : 'text-rose-400'}`}>
                  {totalRealizedPnl >= 0 ? '+' : ''}{formatMoney(totalRealizedPnl)}
                </span>
              </div>
            </div>
          </div>

          {/* Ledger */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold uppercase tracking-wider text-journal-text-secondary">Funding Ledger</h3>
              <button
                onClick={() => setIsAdding(!isAdding)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-bold hover:bg-neutral-800 transition-colors active:scale-95"
              >
                {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {isAdding ? 'Cancel' : 'Add Entry'}
              </button>
            </div>

            {isAdding && (
              <form onSubmit={handleAdd} className="bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex flex-col gap-4 animate-fade-in">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setType('DEPOSIT')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${type === 'DEPOSIT' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-transparent border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}
                  >
                    Deposit
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('WITHDRAWAL')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${type === 'WITHDRAWAL' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-transparent border-neutral-200 text-neutral-500 hover:bg-neutral-50'}`}
                  >
                    Withdrawal
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="px-3 py-2 bg-journal-bg border border-border-light rounded-lg text-sm focus:outline-none focus:border-neutral-400 font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Notes (optional)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="px-3 py-2 bg-journal-bg border border-border-light rounded-lg text-sm focus:outline-none focus:border-neutral-400"
                  />
                </div>
                <button type="submit" className="w-full py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-bold hover:bg-neutral-800 transition-colors active:scale-[0.98]">
                  Save Transaction
                </button>
              </form>
            )}

            <div className="flex flex-col gap-2">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-sm font-semibold text-journal-text-muted border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                  No funding transactions yet.
                </div>
              ) : (
                transactions.map((tx) => (
                  <div key={tx.id} className="group flex items-center justify-between p-3.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${tx.type === 'DEPOSIT' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {tx.type === 'DEPOSIT' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-journal-text">{tx.type}</div>
                        <div className="text-[0.65rem] font-semibold text-journal-text-muted mt-0.5">
                          {new Date(tx.date).toLocaleDateString()} {tx.notes && `• ${tx.notes}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`font-mono font-extrabold ${tx.type === 'DEPOSIT' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.type === 'DEPOSIT' ? '+' : '-'}{formatMoney(tx.amount)}
                      </span>
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="p-1.5 text-neutral-300 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                        title="Delete entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
