'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProfiles, AVATARS } from '@/context/ProfileContext';

export default function ProfileSelection() {
  const { profiles, selectProfile, createProfile, isLoaded } = useProfiles();
  const router = useRouter();

  const [showAddForm, setShowAddForm] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>(AVATARS[0].id);

  const handleSelect = (profileId: string) => {
    selectProfile(profileId);
    router.push('/journal');
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;

    createProfile(newProfileName.trim(), selectedAvatarId);
    setNewProfileName('');
    setSelectedAvatarId(AVATARS[0].id);
    setShowAddForm(false);
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-journal-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-journal-text border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-journal-bg flex flex-col items-center justify-center p-6 text-journal-text select-none animate-fade-in">
      <div className="max-w-[720px] w-full text-center">
        {/* Title */}
        <h1 className="text-3xl font-extrabold tracking-tight mb-2 max-sm:text-2.5xl">
          Who's trading today?
        </h1>
        <p className="text-journal-text-secondary text-sm font-semibold mb-12 max-sm:mb-8">
          Select a profile to access your personalized trading journal.
        </p>

        {/* Netflix-style profile grid */}
        <div className="flex flex-wrap items-stretch justify-center gap-6 max-sm:gap-4">
          {profiles.map((p) => {
            const avatar = AVATARS.find((av) => av.id === p.avatarUrl) || AVATARS[0];
            return (
              <div
                key={p.id}
                className="group flex flex-col items-center gap-3 w-36 max-sm:w-28 cursor-pointer"
                onClick={() => handleSelect(p.id)}
              >
                {/* Avatar Box */}
                <div
                  className="w-32 h-32 max-sm:w-24 max-sm:h-24 rounded-2xl flex items-center justify-center text-5xl shadow-card transition-all duration-300 group-hover:scale-105 group-hover:shadow-card-hover border-4 border-transparent group-hover:border-journal-text active:scale-[0.98]"
                  style={{ backgroundColor: avatar.bg }}
                >
                  {avatar.emoji}
                </div>
                {/* Name */}
                <span className="font-bold text-[0.95rem] text-journal-text-secondary group-hover:text-journal-text transition-colors truncate max-w-full">
                  {p.name}
                </span>
              </div>
            );
          })}

          {/* Add Profile Card */}
          {!showAddForm ? (
            <div
              className="group flex flex-col items-center gap-3 w-36 max-sm:w-28 cursor-pointer"
              onClick={() => setShowAddForm(true)}
            >
              <div className="w-32 h-32 max-sm:w-24 max-sm:h-24 rounded-2xl bg-journal-card border-[3px] border-dashed border-journal-text-muted/40 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 group-hover:scale-105 group-hover:border-journal-text group-hover:bg-journal-card/80 active:scale-[0.98]">
                <span className="text-3xl text-journal-text-muted group-hover:text-journal-text transition-colors">
                  +
                </span>
                <span className="text-[0.68rem] font-bold text-journal-text-muted group-hover:text-journal-text uppercase tracking-wider transition-colors">
                  Add Profile
                </span>
              </div>
              <span className="font-bold text-[0.95rem] text-transparent">
                Add Profile
              </span>
            </div>
          ) : null}
        </div>

        {/* Inline Add Profile Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreate}
            className="mt-12 bg-journal-card rounded-[20px] p-6 border border-border-light shadow-card text-left flex flex-col gap-6 animate-scale-in max-sm:mt-8 max-sm:p-4"
          >
            <div className="flex items-center justify-between border-b border-border-light pb-3">
              <h3 className="text-lg font-black tracking-tight">Create Profile</h3>
              <button
                type="button"
                className="text-journal-text-secondary text-sm font-semibold hover:text-journal-text cursor-pointer"
                onClick={() => setShowAddForm(false)}
              >
                ✕
              </button>
            </div>

            {/* Profile name */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[0.78rem] font-bold uppercase tracking-wider text-journal-text-secondary">
                Profile Name
              </span>
              <input
                className="w-full text-[0.9rem] py-2.5 px-3.5 rounded-[var(--radius-button)] border-[1.5px] border-border-medium bg-journal-elevated text-journal-text outline-none transition-all duration-150 focus:border-journal-text focus:shadow-[0_0_0_3px_rgba(42,38,38,0.08)] placeholder:text-journal-text-muted"
                type="text"
                placeholder="Enter trader name"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                maxLength={12}
                required
                autoFocus
              />
            </div>

            {/* Select avatar */}
            <div className="flex flex-col gap-2">
              <span className="text-[0.78rem] font-bold uppercase tracking-wider text-journal-text-secondary">
                Select Avatar
              </span>
              <div className="flex flex-wrap gap-3">
                {AVATARS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center cursor-pointer transition-all border-2 ${
                      selectedAvatarId === av.id
                        ? 'border-journal-text scale-105 shadow-card'
                        : 'border-transparent hover:scale-102 hover:border-border-strong'
                    }`}
                    style={{ backgroundColor: av.bg }}
                    onClick={() => setSelectedAvatarId(av.id)}
                    aria-label={`Select avatar ${av.name}`}
                  >
                    {av.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Form actions */}
            <div className="flex gap-2 justify-end border-t border-border-light pt-4">
              <button
                type="button"
                className="px-5 py-2.5 rounded-[var(--radius-button)] bg-transparent border-[1.5px] border-border-medium text-journal-text font-semibold text-[0.875rem] cursor-pointer hover:bg-journal-card hover:border-border-strong transition-all active:scale-[0.97]"
                onClick={() => setShowAddForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newProfileName.trim()}
                className="px-5 py-2.5 rounded-[var(--radius-button)] bg-journal-text text-journal-text-inverse font-semibold text-[0.875rem] cursor-pointer hover:bg-[#1a1616] hover:shadow-card-hover transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save Profile
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
