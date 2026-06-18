'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useNotes } from '@/hooks/useNotes';
import { Plus, Trash2, Edit2, X, FileText, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Note } from '@/types';

export default function NotesPage() {
  const { notes, loading, addNote, updateNote, deleteNote } = useNotes();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleOpenNew = () => {
    setEditingNote(null);
    setTitle('');
    setContent('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
    setTitle('');
    setContent('');
  };

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    
    setSaving(true);
    if (editingNote) {
      await updateNote(editingNote.id, title, content);
    } else {
      await addNote(title, content);
    }
    setSaving(false);
    handleCloseModal();
  };

  return (
    <div className="flex flex-col min-h-screen bg-journal-bg transition-colors duration-300">
      <main className="flex-1 max-w-[1100px] w-full mx-auto px-6 py-10 max-md:px-4 flex flex-col gap-8">
        
        {/* Header */}
        <header className="flex items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-journal-text flex items-center gap-2">
              <FileText className="w-7 h-7 text-neutral-800 dark:text-neutral-200" />
              Personal Notes
            </h1>
            <p className="text-sm font-semibold text-journal-text-muted mt-1.5 max-w-xl">
              A distraction-free space for your trading psychology, session reviews, and random thoughts.
            </p>
          </div>
          <button
            onClick={handleOpenNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            Create Note
          </button>
        </header>

        {/* Notes Grid */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] bg-journal-card rounded-3xl border border-dashed border-neutral-300 dark:border-neutral-800 animate-fade-in">
            <div className="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-neutral-400" />
            </div>
            <h3 className="text-xl font-black text-journal-text mb-2">No notes yet</h3>
            <p className="text-sm text-journal-text-muted mb-6">Start writing your first thought or trading reminder.</p>
            <button
              onClick={handleOpenNew}
              className="px-6 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-journal-text rounded-xl font-bold text-sm transition-colors"
            >
              Write a note
            </button>
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {notes.map((note) => (
              <div 
                key={note.id} 
                className="break-inside-avoid bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group flex flex-col gap-3 relative animate-slide-up"
              >
                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleOpenEdit(note)}
                    className="p-1.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 rounded-md transition-colors"
                    title="Edit Note"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button 
                    onClick={() => {
                      if(window.confirm('Are you sure you want to delete this note?')) {
                        deleteNote(note.id);
                      }
                    }}
                    className="p-1.5 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 rounded-md transition-colors"
                    title="Delete Note"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                
                {note.title && (
                  <h3 className="text-lg font-bold text-journal-text pr-14 leading-tight">
                    {note.title}
                  </h3>
                )}
                
                {note.content && (
                  <p className="text-[0.9rem] text-journal-text-secondary leading-relaxed whitespace-pre-wrap line-clamp-6">
                    {note.content}
                  </p>
                )}
                
                <div className="mt-auto pt-3 flex items-center justify-between text-[0.65rem] font-semibold text-neutral-400 uppercase tracking-wider">
                  <span>Created: {format(new Date(note.created_at), 'MMM d, yyyy')}</span>
                  {note.updated_at !== note.created_at && (
                    <span>Edited: {format(new Date(note.updated_at), 'MMM d')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Editor Slide-over / Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/30 backdrop-blur-[2px] animate-fade-in overflow-hidden">
          <div className="absolute inset-0" onClick={handleCloseModal} />
          
          <div className="relative w-full max-w-2xl h-full bg-journal-bg flex flex-col shadow-2xl animate-slide-in-right border-l border-border-light">
            {/* Modal Header */}
            <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border-light bg-journal-card">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCloseModal}
                  className="p-2 -ml-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="font-bold text-sm text-journal-text-muted">
                  {editingNote ? 'Edit Note' : 'New Note'}
                </span>
              </div>
              <button
                onClick={handleSave}
                disabled={saving || (!title.trim() && !content.trim())}
                className="px-5 py-2 bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-bold rounded-lg disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-8 max-sm:p-5 flex flex-col gap-6 custom-scrollbar">
              <input
                type="text"
                placeholder="Note Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-3xl sm:text-4xl font-black text-journal-text placeholder:text-neutral-300 dark:placeholder:text-neutral-700 focus:outline-none"
                autoFocus
              />
              <textarea
                ref={textareaRef}
                placeholder="Start typing your thoughts..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full flex-1 bg-transparent text-base sm:text-lg text-journal-text-secondary leading-relaxed placeholder:text-neutral-400 dark:placeholder:text-neutral-600 focus:outline-none resize-none min-h-[300px]"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
