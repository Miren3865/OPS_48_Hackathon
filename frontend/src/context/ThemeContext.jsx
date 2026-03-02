import { createContext, useContext, useEffect, useState } from 'react';

const THEMES = ['theme-dark', 'theme-light', 'theme-neon', 'theme-midnight'];
const DEFAULT_THEME = 'theme-dark';
const STORAGE_KEY = 'opsboard-theme';

const ThemeContext = createContext({
  theme: DEFAULT_THEME,
  changeTheme: () => {},
  themes: THEMES,
});

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(DEFAULT_THEME);

  // On mount: read saved theme and apply to <html>
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
    applyTheme(saved);
    setTheme(saved);
  }, []);

  function applyTheme(newTheme) {
    // Safely remove ALL theme classes, then add the chosen one
    document.documentElement.classList.remove(...THEMES);
    document.documentElement.classList.add(newTheme);
  }

  function changeTheme(newTheme) {
    if (!THEMES.includes(newTheme)) return;
    applyTheme(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    setTheme(newTheme);
  }

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
