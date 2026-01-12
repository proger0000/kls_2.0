import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

import logo from '../assets/logo.png';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { session, initialHydrated } = useAuth();
  const navigate = useNavigate();


  // Если мы уже авторизованы — сразу кидаем внутрь
  useEffect(() => {
    if (initialHydrated && session) {
      navigate('/', { replace: true });
    }
  }, [session, initialHydrated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      // Редирект сработает автоматически через useEffect
    } catch (err: any) {
      setError(err.message);
      setLocalLoading(false);
    }
  };

  // 🔥 ФУНКЦИЯ БЫСТРОГО ВХОДА (DEV)
  const devLogin = async (e: string, p: string) => {
    setLocalLoading(true);
    setEmail(e);
    setPassword(p);
    setError(null);
    try {
        const { error } = await supabase.auth.signInWithPassword({ email: e, password: p });
        if (error) throw error;
    } catch (err: any) {
        setError(err.message);
        setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300 p-4">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-850 p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
        
        {/* Header */}
        <div className="text-center">
          <img className="mx-auto h-12 w-auto" src={logo} alt="Lifeguard" />
          <h2 className="mt-4 text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Lifeguard System
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Вхід в систему управління
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2 animate-pulse">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Пароль
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-4 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-400 text-gray-900 dark:text-white dark:bg-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={localLoading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all shadow-lg hover:shadow-brand-500/30
                ${localLoading ? 'opacity-75 cursor-not-allowed' : ''}
              `}
            >
              {localLoading ? (
                 <span className="flex items-center gap-2">
                   <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                   Вхід...
                 </span>
              ) : 'Увійти'}
            </button>
          </div>
        </form>

        {/* 🔥 DEV TOOLS SECTION */}
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
           <p className="text-[10px] font-mono uppercase tracking-widest text-center text-gray-400 mb-3">
              ⚡ Dev Quick Login
           </p>
           <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => devLogin('proger0000@gmail.com', 'deadpool')}
                disabled={localLoading}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors border border-purple-200 dark:border-purple-800/50"
              >
                 <span className="font-bold text-xs">ADMIN</span>
                 <span className="text-[10px] opacity-70">proger0000</span>
              </button>

              <button 
                onClick={() => devLogin('life@gmail.com', '000000')}
                disabled={localLoading}
                className="flex flex-col items-center justify-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors border border-emerald-200 dark:border-emerald-800/50"
              >
                 <span className="font-bold text-xs">LIFEGUARD</span>
                 <span className="text-[10px] opacity-70">life@gmail.com</span>
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};