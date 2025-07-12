import { useState, useEffect } from 'react';

export function useTheme() {
  const getCurrent = () =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light';

  const [theme, setThemeState] = useState<'light' | 'dark'>(getCurrent());

  const setTheme = (mode: 'light' | 'dark') => {
    const doc = document.documentElement;
    doc.classList.toggle('dark', mode === 'dark');
    doc.classList.toggle('light', mode === 'light');
    localStorage.setItem('theme', mode);
    setThemeState(mode);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'theme' && e.newValue) {
        setThemeState(e.newValue as 'light' | 'dark');
        const docEl = document.documentElement;
        docEl.classList.toggle('dark', e.newValue === 'dark');
        docEl.classList.toggle('light', e.newValue === 'light');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  return { theme, setTheme, toggleTheme };
} 