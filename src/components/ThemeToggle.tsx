"use client";

import React from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
       const { theme, setTheme, resolvedTheme } = useTheme();

       const isDark = (theme === 'dark' || resolvedTheme === 'dark');

       return (
              <button
                     aria-label="Toggle theme"
                     onClick={() => setTheme(isDark ? 'light' : 'dark')}
                     className="p-2 rounded-md bg-journal-card border border-neutral-200/40 hover:shadow-sm transition-colors flex items-center justify-center"
              >
                     {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
       );
}
