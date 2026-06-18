'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Note } from '@/types';
import { toast } from 'sonner';

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
        setNotes([]);
        setLoading(false);
      }
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user?.id) {
        setUserId(session.user.id);
      } else {
        setUserId(null);
        setNotes([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchNotes = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('[Supabase] Error fetching notes:', error);
      toast.error('Failed to load notes.');
    } else if (data) {
      setNotes(data as Note[]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchNotes();
    }
  }, [userId, fetchNotes]);

  const addNote = useCallback(async (title: string, content: string) => {
    if (!userId) return null;
    const { data, error } = await supabase
      .from('notes')
      .insert({ user_id: userId, title, content })
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error adding note:', error);
      toast.error('Failed to add note.');
      return null;
    }
    if (data) {
      setNotes((prev) => [data as Note, ...prev]);
      toast.success('Note saved successfully.');
      return data as Note;
    }
  }, [userId]);

  const updateNote = useCallback(async (id: string, title: string, content: string) => {
    if (!userId) return null;
    // Updated_at is handled by the database trigger
    const { data, error } = await supabase
      .from('notes')
      .update({ title, content })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('[Supabase] Error updating note:', error);
      toast.error('Failed to update note.');
      return null;
    }
    if (data) {
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? (data as Note) : n)).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      );
      toast.success('Note updated successfully.');
      return data as Note;
    }
  }, [userId]);

  const deleteNote = useCallback(async (id: string) => {
    if (!userId) return;
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[Supabase] Error deleting note:', error);
      toast.error('Failed to delete note.');
      return false;
    }
    setNotes((prev) => prev.filter((n) => n.id !== id));
    toast.success('Note deleted.');
    return true;
  }, [userId]);

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    refreshNotes: fetchNotes,
  };
}
