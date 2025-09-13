'use client';

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark theme
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Check for saved theme preference or default to dark
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
      setTheme(savedTheme);
    } else {
      // Default to dark theme
      setTheme('dark');
      localStorage.setItem('theme', 'dark');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Apply theme to document
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      console.log('Theme: Dark mode activated');
    } else {
      root.classList.remove('dark');
      console.log('Theme: Light mode activated');
    }
    
    // Save theme preference
    localStorage.setItem('theme', theme);
    console.log('Theme changed to:', theme);
  }, [theme, mounted]);

  const toggleTheme = () => {
  console.log('[ACTION] Theme toggle clicked! Current theme:', theme);
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
  console.log('[ACTION] Switching theme from', prev, 'to', newTheme);
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
