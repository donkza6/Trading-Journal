'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { X, Upload, Loader2, User, Save } from 'lucide-react';
import { useProfiles } from '@/context/ProfileContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { activeProfile, updateProfileData } = useProfiles();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeProfile && isOpen) {
      setDisplayName(activeProfile.displayName || activeProfile.name || '');
      setAvatarUrl(activeProfile.avatarUrl || '');
    }
  }, [activeProfile, isOpen]);

  if (!isOpen || !activeProfile) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }

    setIsUploading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Not authenticated');

      const userId = session.user.id;
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;

      // Upload to 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      toast.success('Avatar uploaded successfully!');
    } catch (error: any) {
      console.error('[Avatar Upload Error]:', error);
      toast.error(error.message || 'Failed to upload avatar.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await updateProfileData({
        displayName: displayName.trim(),
        avatarUrl,
      });
      toast.success('Settings saved successfully!');
      onClose();
    } catch (error: any) {
      console.error('[Settings Save Error]:', error);
      toast.error(error.message || 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if current avatarUrl is an HTTP URL or a predefined ID
  const isHttpUrl = avatarUrl.startsWith('http');

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-journal-bg rounded-2xl shadow-modal flex flex-col overflow-hidden border border-border-light animate-scale-in">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light bg-journal-card">
          <h2 className="text-lg font-black tracking-tight text-journal-text flex items-center gap-2">
            <User className="w-5 h-5" />
            User Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="p-6 flex flex-col gap-6 items-center">
          
          {/* Avatar Upload Dropzone */}
          <div className="flex flex-col items-center gap-3 w-full">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="relative w-24 h-24 rounded-full border-2 border-dashed border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center overflow-hidden hover:border-neutral-400 dark:hover:border-neutral-500 transition-all group"
            >
              {isUploading ? (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-10">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              ) : null}

              {isHttpUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : avatarUrl ? (
                <div className="w-full h-full flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold text-xl uppercase">
                  {displayName.substring(0, 2) || 'TR'}
                </div>
              ) : (
                <User className="w-8 h-8 text-neutral-400" />
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white z-0">
                <Upload className="w-5 h-5" />
              </div>
            </button>
            <span className="text-[0.7rem] font-medium text-journal-text-muted">
              Click to change avatar
            </span>
          </div>

          {/* Display Name Input */}
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[0.75rem] font-bold text-journal-text-secondary uppercase tracking-wider">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full px-3 py-2.5 text-[0.85rem] font-semibold bg-journal-bg border border-border-light rounded-xl outline-none focus:border-neutral-400 focus:shadow-[0_0_0_3px_rgba(42,38,38,0.08)] transition-all"
              required
            />
          </div>

          {/* Save Button */}
          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="w-full mt-2 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-bold text-[0.85rem] hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all shadow-sm active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
