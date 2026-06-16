"use client";

import React from 'react';
import { ThemeProvider } from 'next-themes';

export default function ThemeProviderClient({ children }: { children: React.ReactNode }) {
       return (
              <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                     {children}
              </ThemeProvider>
       );
}
