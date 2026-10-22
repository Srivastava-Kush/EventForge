import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('eventforge-theme');
      if (saved === 'light' || saved === 'dark') return saved;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light';
      }
    }
    return 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('eventforge-theme', theme);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const isLight = theme === 'light';

  return (
    <button
      type="button"
      className="theme-toggle-btn"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isLight}
      aria-label={`Switch to ${isLight ? 'dark midnight' : 'warm beige light'} theme (currently ${theme})`}
      title={`Switch to ${isLight ? 'Dark Midnight' : 'Warm Beige Light'} theme`}
    >
      <span className="theme-toggle-track" aria-hidden="true">
        <span className={`theme-toggle-thumb ${isLight ? 'theme-toggle-thumb-light' : 'theme-toggle-thumb-dark'}`}>
          {isLight ? (
            <Sun size={14} className="text-amber-600" />
          ) : (
            <Moon size={14} className="text-violet-300" />
          )}
        </span>
      </span>
      <span className="theme-toggle-label text-xs font-semibold hidden md:inline">
        {isLight ? 'Beige Light' : 'Midnight Dark'}
      </span>
    </button>
  );
}
