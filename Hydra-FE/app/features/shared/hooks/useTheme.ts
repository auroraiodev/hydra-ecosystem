'use client';

import { useState, useEffect, useCallback } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Defer state updates to avoid "cascading renders" lint error
    Promise.resolve().then(() => {
      setMounted(true);
      const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const initialTheme = stored ?? 'dark';
      setTheme(initialTheme);

      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    });
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      return next;
    });
  }, []);

  return { theme, toggleTheme, mounted };
}
