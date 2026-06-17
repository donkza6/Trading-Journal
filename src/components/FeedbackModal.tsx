'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { X, Bug, Lightbulb, MessageSquare, Loader2, Send } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FeedbackCategory = 'BUG' | 'FEATURE' | 'GENERAL';

const CATEGORIES: { id: FeedbackCategory; label: string; icon: React.ReactNode; placeholder: string }[] = [
  {
    id: 'BUG',
    label: 'Bug',
    icon: <Bug className="w-4 h-4" />,
    placeholder: 'Describe the bug you found. What did you expect to happen?',
  },
  {
    id: 'FEATURE',
    label: 'Feature',
    icon: <Lightbulb className="w-4 h-4" />,
    placeholder: 'What feature would you like to see added to the Trading Journal?',
  },
  {
    id: 'GENERAL',
    label: 'General',
    icon: <MessageSquare className="w-4 h-4" />,
    placeholder: 'Any general thoughts or feedback?',
  },
];

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [category, setCategory] = useState<FeedbackCategory>('FEATURE');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user?.id) {
        throw new Error('You must be logged in to submit feedback.');
      }

      const { error } = await supabase
        .from('user_feedbacks')
        .insert({
          user_id: session.user.id,
          category,
          message: message.trim(),
        });

      if (error) throw error;

      toast.success('Thank you for your feedback! 🚀');
      setMessage('');
      setCategory('FEATURE');
      onClose();
    } catch (error: any) {
      console.error('[Feedback Error]:', error);
      toast.error(error.message || 'Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCategoryObj = CATEGORIES.find((c) => c.id === category)!;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-journal-bg rounded-2xl shadow-modal flex flex-col overflow-hidden border border-border-light animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light bg-journal-card">
          <h2 className="text-lg font-black tracking-tight text-journal-text flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Send Feedback
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-5">
          {/* Category Toggle */}
          <div className="flex flex-col gap-2">
            <label className="text-[0.75rem] font-bold text-journal-text-secondary uppercase tracking-wider">
              Category
            </label>
            <div className="grid grid-cols-3 gap-2 bg-journal-card p-1 rounded-xl border border-border-light">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-[0.8rem] font-bold transition-all ${
                    category === cat.id
                      ? 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 shadow-sm'
                      : 'bg-transparent text-journal-text-muted hover:text-journal-text hover:bg-neutral-50 dark:hover:bg-neutral-800'
                  }`}
                >
                  {cat.icon}
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Message Textarea */}
          <div className="flex flex-col gap-2">
            <label className="text-[0.75rem] font-bold text-journal-text-secondary uppercase tracking-wider">
              Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={activeCategoryObj.placeholder}
              className="w-full min-h-[120px] p-3 text-[0.85rem] font-medium bg-journal-bg border border-border-light rounded-xl outline-none focus:border-neutral-400 focus:shadow-[0_0_0_3px_rgba(42,38,38,0.08)] transition-all resize-none placeholder:text-neutral-400"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-[0.85rem] hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Feedback
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
