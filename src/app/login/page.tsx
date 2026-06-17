'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Activity, Mail, Lock, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        
        toast.success('Successfully logged in!');
        router.push('/journal');
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;
        
        toast.success('Account created! Please check your email or proceed to login.');
        setIsLogin(true);
      }
    } catch (err: any) {
      console.error('[Auth Error]:', err);
      const msg = err?.message === '{}' || !err?.message ? 'Invalid email or password.' : err.message;
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-journal-bg animate-fade-in">
      <div className="w-full max-w-[400px] flex flex-col gap-6">
        {/* Brand / Logo */}
        <div className="flex flex-col items-center justify-center gap-3 text-center mb-2">
          <div className="w-12 h-12 rounded-2xl bg-neutral-900 flex items-center justify-center text-white shadow-lg">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-journal-text">
              Trading Journal
            </h1>
            <p className="text-[0.85rem] font-semibold text-journal-text-muted mt-1">
              Track, Analyze, Improve.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-journal-card p-6 rounded-2xl border border-border-light shadow-modal flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-extrabold text-journal-text">
              {isLogin ? 'Welcome back' : 'Create an account'}
            </h2>
            <p className="text-[0.8rem] text-journal-text-muted font-medium">
              {isLogin
                ? 'Enter your credentials to access your journal.'
                : 'Sign up to start tracking your trading performance.'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-bold text-journal-text-secondary uppercase tracking-wider">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-9 pr-3 py-2.5 text-[0.85rem] font-semibold bg-journal-bg border border-border-light rounded-xl outline-none focus:border-neutral-400 focus:shadow-[0_0_0_3px_rgba(42,38,38,0.08)] transition-all"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[0.75rem] font-bold text-journal-text-secondary uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 text-[0.85rem] font-semibold bg-journal-bg border border-border-light rounded-xl outline-none focus:border-neutral-400 focus:shadow-[0_0_0_3px_rgba(42,38,38,0.08)] transition-all"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full flex items-center justify-center py-2.5 px-4 rounded-xl bg-neutral-900 text-white font-bold text-[0.85rem] hover:bg-neutral-800 transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

        {/* Toggle */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-[0.8rem] font-bold text-journal-text-muted hover:text-journal-text transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
