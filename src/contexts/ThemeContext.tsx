import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  // 1. Инициализация состояния
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    // Если в хранилище есть валидное значение - используем его, иначе 'light'
    return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'light';
  });

  // 2. Эффект для применения темы к HTML тегу
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Удаляем возможные конфликтующие классы и ставим текущий
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Сохраняем выбор пользователя
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 3. Функция переключения
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};