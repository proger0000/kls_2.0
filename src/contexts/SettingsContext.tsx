import React, { createContext, useContext, useEffect, useState } from 'react';

interface SettingsContextType {
  debugMode: boolean;
  toggleDebugMode: () => void;
  // Сюда можно добавлять другие глобальные настройки (звук, анимации и т.д.)
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
  const [debugMode, setDebugMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_debug_mode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('app_debug_mode', String(debugMode));
  }, [debugMode]);

  const toggleDebugMode = () => {
    setDebugMode((prev) => !prev);
  };

  return (
    <SettingsContext.Provider value={{ debugMode, toggleDebugMode }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};