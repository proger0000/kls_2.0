import { createContext, useContext, useEffect, useState, useMemo, useRef, type ReactNode } from 'react';
import { supabase } from '../supabase';
import type { Session, User } from '@supabase/supabase-js';
import type { Database } from '../database.types';

// Тип профиля из нашей базы данных
type UserProfile = Database['public']['Tables']['users']['Row'];

interface AuthContextType {
  session: Session | null;
  user: User | null;

  // Флаг: завершена ли первичная проверка сессии (getSession)
  initialHydrated: boolean;

  // Флаг: идет ли сейчас процесс входа/выхода
  authBusy: boolean;

  // Данные профиля (роль, имя и т.д.)
  profile: UserProfile | null;
  profileLoading: boolean;
  profileError: string | null;

  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Время бездействия (30 минут)
const IDLE_TIMEOUT = 30 * 60 * 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Auth State
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initialHydrated, setInitialHydrated] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);

  // Profile State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Счетчик для предотвращения гонки запросов (Race Condition)
  // Мы используем useRef, чтобы значение сохранялось между рендерами, 
  // но не вызывало ре-рендер само по себе.
  // Поддержка предложила переменную замыкания, но useRef в React надежнее.
  const fetchIdRef = useRef(0);

  // --- 1. INITIALIZATION & LISTENER ---
  useEffect(() => {
    let mounted = true;
    setAuthBusy(true);

    // 1.a Получаем сессию один раз при старте
    supabase.auth.getSession()
      .then(({ data }) => {
        if (!mounted) return;
        setSession(data.session ?? null);
        setUser(data.session?.user ?? null);
        console.debug("[Auth] Initial getSession done:", !!data.session);
      })
      .catch((err) => {
        console.error("[Auth] getSession error", err);
      })
      .finally(() => {
        if (!mounted) return;
        setInitialHydrated(true); // 🔥 Самый важный флаг: мы готовы к рендеру
        setAuthBusy(false);
      });

    // 1.b Подписываемся на изменения в реальном времени
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      console.debug(`[Auth] Event: ${event}`, !!session);

      setSession(session ?? null);
      setUser(session?.user ?? null);

      // Если вышли - очищаем профиль мгновенно
      if (!session) {
        setProfile(null);
        setProfileError(null);
        setProfileLoading(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // --- 2. PROFILE FETCHING ---
  // Запускается каждый раз, когда меняется ID пользователя
  // --- 2. PROFILE FETCHING ---
  // Запускается каждый раз, когда меняется ID пользователя
  useEffect(() => {
    // Если нет сессии - нечего грузить
    if (!session?.user?.id) {
      // Если сессии нет, но профиль остался (например, при логауте) - чистим
      // (хотя onAuthStateChange уже почистил, лишним не будет)
      return;
    }

    // Увеличиваем счетчик запросов
    const currentFetchId = ++fetchIdRef.current;

    setProfileLoading(true);
    setProfileError(null);

    const fetchProfile = async () => {
      console.debug(`[Profile] Fetching for ${session.user.id} (ReqID: ${currentFetchId})`);

      // REMOVED: Unnecessary setTimeout delay which caused race conditions

      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('auth_id', session.user.id)
          .maybeSingle();

        // Check if request is stale
        if (currentFetchId !== fetchIdRef.current) return;

        if (error) {
          throw error;
        }

        if (data) {
          console.debug(`[Profile] Loaded success: ${data.role}`);
          setProfile(data);
        } else {
          // Фолбек на поиск по Email (для старых юзеров или миграции)
          if (session.user.email) {
            console.debug(`[Profile] Fallback fetch by Email...`);
            const { data: dataEmail } = await supabase
              .from('users')
              .select('*')
              .eq('email', session.user.email)
              .maybeSingle();

            if (currentFetchId !== fetchIdRef.current) return;

            if (dataEmail) {
              setProfile(dataEmail);
            } else {
              console.warn("[Profile] Not found in public.users");
              setProfile(null);
              setProfileError("Помилка: Профіль користувача не знайдено.");
            }
          } else {
            // Email нет, и по ID не нашли
            if (currentFetchId === fetchIdRef.current) {
              setProfile(null);
              setProfileError("Помилка: Профіль користувача не знайдено (No Email).");
            }
          }
        }
      } catch (err: any) {
        console.error("[Profile] Error:", err);
        if (currentFetchId === fetchIdRef.current) {
          setProfile(null);
          setProfileError(err.message || "Unknown profile error");
        }
      } finally {
        if (currentFetchId === fetchIdRef.current) {
          setProfileLoading(false);
        }
      }
    };

    fetchProfile();
  }, [session?.user?.id, session?.user?.email]); // Добавил email в зависимости, чтобы если он обновится - перечитали

  // --- 3. AUTO-LOGOUT (IDLE TIMER) ---
  useEffect(() => {
    let idleTimer: ReturnType<typeof setTimeout>;

    const logoutUser = async () => {
      if (session) {
        console.log("[Auth] Idle Timeout. Logging out...");
        await supabase.auth.signOut();
        window.location.reload();
      }
    };

    const resetTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      if (session) idleTimer = setTimeout(logoutUser, IDLE_TIMEOUT);
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    if (session) {
      resetTimer();
      events.forEach(event => window.addEventListener(event, resetTimer));
    }

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [session]);

  // --- HELPERS ---
  const signOut = async () => {
    setAuthBusy(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("SignOut Error", err);
    } finally {
      setAuthBusy(false);
    }
  };

  const refreshProfile = async () => {
    if (!session) return;
    // Трюк: просто обновляем user объект (клон), чтобы триггернуть useEffect
    // Но лучше сделаем явно через вызов той же логики, если нужно.
    // Пока оставим пустым, так как useEffect сам справится при смене сессии.
    // Для ручного обновления можно использовать отдельный триггер.
  };

  const value = useMemo(() => ({
    session,
    user,
    initialHydrated, // 🔥 Используем это для защиты роутов
    authBusy,
    profile,
    profileLoading,
    profileError,
    signOut,
    refreshProfile
  }), [session, user, initialHydrated, authBusy, profile, profileLoading, profileError]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};