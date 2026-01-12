import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation, Link, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { DebugOverlay } from './components/DebugOverlay';
import { Login } from './pages/Login';
import { Settings } from './pages/Settings';
import { RoleRoute } from './components/RoleRoute';
import logo from './assets/logo.png';

import { Icons } from './components/Icons';

// --- ADMIN PAGES ---
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminShiftDetails } from './pages/admin/AdminShiftDetails';
import { AdminUsers } from './pages/admin/AdminUsers';
import { AdminReportDetails } from './pages/admin/AdminReportDetails';
// 🔥 НОВЫЕ И ОБНОВЛЕННЫЕ СТРАНИЦЫ
import { AdminShiftHistory } from './pages/admin/AdminShiftHistory'; // Наш Комбайн
import { AdminReports } from './pages/admin/AdminReports';           // Новая аналитика
import { AdminApplications } from './pages/admin/AdminApplications';
import { AdminPosts } from './pages/admin/AdminPosts';
import { AdminPayroll } from './pages/admin/AdminPayroll';
import { AdminRating } from './pages/admin/AdminRating';
import { AdminPostAnalytics } from './pages/admin/AdminPostAnalytics';
import { AdminAcademy } from './pages/admin/AdminAcademy';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';

import { LifeguardDashboard } from './pages/lifeguard/LifeguardDashboard';

const LIFEGUARD_MENU = [
  { name: 'Зміна', path: '/lifeguard', icon: <Icons.Dashboard /> },
  { name: 'Графік', path: '/lifeguard/schedule', icon: <Icons.Schedule /> },
];

// 🔥 ОБНОВЛЕННАЯ СТРУКТУРА МЕНЮ
const ADMIN_MENU_GROUPS = [
  {
    title: 'Головна',
    items: [
      { name: 'Статус Змін', path: '/admin', icon: <Icons.Dashboard /> },
    ]
  },
  {
    title: 'Операційна діяльність',
    items: [
      // Комбайн: История + График + Управление
      { name: 'Історія змін', path: '/admin/shifts-history', icon: <Icons.Schedule /> },
      // Аналитика отчетов (вместо старого управления сменами)
      { name: 'Історія Звітів', path: '/admin/reports', icon: <Icons.Analytics /> },
    ]
  },
  {
    title: 'Управління ресурсами',
    items: [
      { name: 'Користувачі', path: '/admin/users', icon: <Icons.Users /> },
      { name: 'Кер. Постами', path: '/admin/posts', icon: <Icons.Posts /> },
    ]
  },

  {
    title: 'Фінанси та Аналітика',
    items: [
      { name: 'Аналітика відвідування', path: '/admin/beach-analytics', icon: <Icons.Analytics /> },
      { name: 'Аналітика Постів', path: '/admin/analytics', icon: <Icons.Analytics /> },
      { name: 'Зарплати', path: '/admin/payroll', icon: <Icons.Money /> },
      { name: 'Рейтинг', path: '/admin/rating', icon: <Icons.Rating /> },

    ]
  },
  {
    title: 'HR та Навчання',
    items: [
      { name: 'Академія', path: '/admin/academy', icon: <Icons.Academy /> },
      { name: 'Заявки', path: '/admin/applications', icon: <Icons.Applications /> },
    ]
  }
];

// --- COMPONENTS ---

const LuxurySkeleton = () => (
  <div className="animate-pulse space-y-6 pt-4">
    <div className="h-8 w-1/3 bg-gray-200 dark:bg-gray-800 rounded-lg opacity-50"></div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="h-32 bg-gray-200 dark:bg-gray-800 rounded-2xl opacity-40"></div>
      ))}
    </div>
    <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-2xl opacity-30"></div>
  </div>
);

const Sidebar = () => {
  const { profile, initialHydrated } = useAuth();
  const location = useLocation();

  if (initialHydrated && profile?.role === 'lifeguard') return null;

  return (
    <aside className="hidden md:flex w-64 bg-white dark:bg-gray-850 border-r border-gray-200 dark:border-gray-800 flex-col fixed h-full top-0 left-0 z-30 transition-colors overflow-y-auto">
      <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-gray-800 shrink-0">
        <img src={logo} alt="Logo" className="h-8 w-auto mr-3" />
        <span className="font-bold text-lg tracking-tight text-gray-800 dark:text-white">Lifeguard</span>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-6">
        {ADMIN_MENU_GROUPS.map((group, groupIndex) => (
          <div key={groupIndex}>
            {group.title && (
              // 🔥 ТУТ КРАСНЫЙ ЦВЕТ ЗАГОЛОВКОВ
              <h3 className="px-4 mb-2 text-[10px] font-black uppercase tracking-widest text-red-500 dark:text-red-400">
                {group.title}
              </h3>
            )}
            <div className="space-y-1">
              {group.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
                      ${isActive
                        ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
                      }`}
                  >
                    {item.icon} {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-6 text-xs text-gray-400 text-center dark:text-gray-600 shrink-0">
        v5.0 Enterprise
      </div>
    </aside>
  );
};

const MobileMenu = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeGroupTitle, setActiveGroupTitle] = useState<string | null>(null);

  // Close menu when location changes
  useEffect(() => {
    setActiveGroupTitle(null);
  }, [location.pathname]);

  if (profile?.role === 'lifeguard') {
    return (
      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg dark:bg-gray-850/90 border-t border-gray-200 dark:border-gray-800 flex justify-around px-6 py-3 z-50 shadow-lg pb-safe">
        {LIFEGUARD_MENU.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}`}>
              <div className="w-6 h-6">{item.icon}</div>
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
        <Link to="/settings" className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/settings' ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'}`}>
          <div className="w-6 h-6"><Icons.Profile /></div>
          <span className="text-[10px] font-medium">Профіль</span>
        </Link>
      </div>
    );
  }

  const activeGroup = ADMIN_MENU_GROUPS.find(g => g.title === activeGroupTitle);

  return (
    <>
      {/* Submenu Overlay */}
      {/* Submenu Overlay */}
      {activeGroup && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden transition-opacity"
            onClick={() => setActiveGroupTitle(null)}
          />
          <div className="md:hidden fixed bottom-[84px] left-4 right-4 z-50 animate-slide-up-fade origin-bottom">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              <div className="px-4 pt-5 pb-3">
                <h3 className="text-lg font-semibold tracking-tight text-gray-900 dark:text-gray-50 leading-none">
                  {activeGroup.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                  Оберіть необхідний розділ для переходу
                </p>
              </div>

              <div className="p-2 space-y-1 bg-gray-50/50 dark:bg-gray-800/20">
                {activeGroup.items.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all border ${isActive
                          ? 'bg-white border-brand-200 shadow-sm text-brand-600 dark:bg-gray-800 dark:border-brand-900 dark:text-brand-400'
                          : 'border-transparent text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-800'
                        }`}
                    >
                      <div className={`p-2 rounded-md ${isActive ? 'bg-brand-50 dark:bg-brand-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <div className="w-5 h-5">{item.icon}</div>
                      </div>
                      <span className="font-medium text-sm">{item.name}</span>
                    </Link>
                  );
                })}
              </div>

              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                <button
                  onClick={() => setActiveGroupTitle(null)}
                  className="text-xs font-semibold uppercase tracking-wider text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors px-2 py-1"
                >
                  Закрити
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-lg dark:bg-gray-850/90 border-t border-gray-200 dark:border-gray-800 flex justify-between px-2 py-3 z-50 shadow-lg pb-safe">
        {ADMIN_MENU_GROUPS.map((group, index) => {
          // Check if any item in the group is active
          const isGroupActive = group.items.some(item =>
            location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path))
          );

          const isOpen = activeGroupTitle === group.title;
          const icon = group.items[0]?.icon;

          return (
            <button
              key={index}
              onClick={() => {
                if (group.items.length === 1) {
                  navigate(group.items[0].path);
                  setActiveGroupTitle(null);
                } else {
                  setActiveGroupTitle(isOpen ? null : group.title);
                }
              }}
              className={`flex flex-1 flex-col items-center justify-start gap-1 transition-colors min-w-0 ${(isGroupActive || isOpen) ? 'text-brand-600 dark:text-brand-400' : 'text-gray-400 dark:text-gray-500'
                }`}
            >
              <div className="w-5 h-5 flex-shrink-0">{icon}</div>
              <span className="text-[9px] font-medium text-center leading-tight line-clamp-2 px-0.5 break-words w-full h-[22px] flex items-center justify-center">
                {group.title}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
};

const TopBar = () => {
  const { profile, initialHydrated } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const leftOffset = profile?.role !== 'lifeguard' ? 'md:left-64' : 'left-0';

  return (
    <header className={`h-16 bg-white/80 dark:bg-gray-850/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-800 flex justify-between items-center px-4 md:px-8 fixed top-0 right-0 ${leftOffset} left-0 z-20 transition-all duration-300`}>
      <div className="flex items-center gap-2 md:hidden">
        <img src={logo} alt="Logo" className="h-8 w-auto" />
        <span className="font-bold text-gray-800 dark:text-white">Lifeguard</span>
      </div>

      <div className="hidden md:block text-sm text-gray-500 dark:text-gray-400 font-medium">
        {!initialHydrated ? (
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        ) : (
          profile?.role === 'lifeguard' ? 'Панель Лайфгарда' : 'Панель Адміністратора'
        )}
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-brand-600 dark:text-gray-400 dark:hover:text-white transition-colors">
          {isDark ? <Icons.Sun /> : <Icons.Moon />}
        </button>

        <div
          className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 p-1.5 rounded-lg transition-colors"
          onClick={() => navigate('/settings')}
        >
          {(!initialHydrated || !profile) ? (
            <div className="flex items-center gap-3">
              <div className="hidden md:block h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
            </div>
          ) : (
            <>
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-gray-800 dark:text-white">{profile?.full_name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{profile?.role}</p>
              </div>
              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm ring-2 ring-white dark:ring-gray-800 shadow-sm">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const DashboardLayout = () => {
  const { session, profile, initialHydrated, profileLoading, profileError, signOut } = useAuth();

  if (!initialHydrated) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  if (profileLoading) {
    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <DebugOverlay />
        <Sidebar />
        <TopBar />
        <main className="pt-20 pb-24 md:pb-8 px-4 md:px-8 min-h-screen md:ml-64 transition-all">
          <div className="w-full max-w-[1920px] mx-auto mt-4">
            <LuxurySkeleton />
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 text-center">
        <DebugOverlay />
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Помилка доступу</h2>
        <p className="text-gray-500 mb-6">
          {profileError || `Користувач ${session.user.email} не має профілю в системі.`}
        </p>
        <div className="flex gap-4">
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-brand-600 text-white rounded-xl shadow-lg">Спробувати ще раз</button>
          <button onClick={() => signOut()} className="px-6 py-2 border dark:text-white rounded-xl">Вийти</button>
        </div>
      </div>
    );
  }

  const isSidebarVisible = profile?.role !== 'lifeguard';

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen selection:bg-brand-500 selection:text-white">
      <DebugOverlay />
      <Sidebar />
      <TopBar />

      <main className={`
        pt-20 
        pb-24 md:pb-8 
        px-4 md:px-8 
        min-h-screen 
        transition-all duration-300 ease-in-out
        overflow-x-hidden
        w-auto
        ${isSidebarVisible ? 'md:ml-64' : ''}
      `}>
        <div className="w-full max-w-[1920px] mx-auto mt-4">
          <div className="animate-fade-in-up">
            <Outlet />
          </div>
        </div>
      </main>

      <MobileMenu />
    </div>
  );
};

const RootRedirect = () => {
  const { profile, initialHydrated } = useAuth();
  if (!initialHydrated) return null;
  if (profile?.role === 'lifeguard') return <Navigate to="/lifeguard" replace />;
  if (['admin', 'director', 'duty_officer'].includes(profile?.role || '')) return <Navigate to="/admin" replace />;
  return null;
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SettingsProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />

              <Route element={<DashboardLayout />}>
                <Route path="/" element={<RootRedirect />} />
                <Route path="/settings" element={<Settings />} />

                <Route element={<RoleRoute allowedRoles={['lifeguard']} />}>
                  <Route path="/lifeguard" element={<LifeguardDashboard />} />
                  <Route path="/lifeguard/schedule" element={<div className="dark:text-white p-6">Графік</div>} />
                </Route>

                {/* Админка */}
                <Route element={<RoleRoute allowedRoles={['admin', 'director', 'duty_officer']} />}>
                  <Route path="/admin" element={<AdminDashboard />} />

                  {/* Комбайн */}
                  <Route path="/admin/shifts-history" element={<AdminShiftHistory />} />

                  {/* Новая аналитика отчетов */}
                  <Route path="/admin/reports" element={<AdminReports />} />
                  <Route path="/admin/reports/:id" element={<AdminReportDetails />} />

                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/shift/:id" element={<AdminShiftDetails />} />
                  <Route path="/admin/applications" element={<AdminApplications />} />
                  <Route path="/admin/posts" element={<AdminPosts />} />
                  <Route path="/admin/payroll" element={<AdminPayroll />} />
                  <Route path="/admin/rating" element={<AdminRating />} />
                  <Route path="/admin/analytics" element={<AdminPostAnalytics />} />
                  <Route path="/admin/beach-analytics" element={<AdminAnalyticsPage />} />
                  <Route path="/admin/academy" element={<AdminAcademy />} />
                </Route>
              </Route>
            </Routes>
          </Router>
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;