import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useNavigate } from 'react-router-dom';
import { Icons } from '../components/Icons';

// Компонент переключателя (Toggle)
const ToggleSwitch = ({ checked, onChange }: { checked: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 dark:focus:ring-offset-gray-800 ${
      checked ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-600'
    }`}
  >
    <div
      className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${
        checked ? 'translate-x-6' : 'translate-x-0'
      }`}
    />
  </button>
);

export const Settings = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { debugMode, toggleDebugMode } = useSettings();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up pb-24 md:pb-10">
      
      {/* Заголовок */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Налаштування</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Керуйте своїм профілем та параметрами системи</p>
      </div>

      {/* 1. Profile Hero Card */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-lg border border-gray-100 dark:border-gray-700">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-brand-500/20 to-purple-500/20 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
             <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-brand-500 to-purple-600 p-[3px] shadow-xl">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-4xl font-bold text-gray-800 dark:text-white">
                    {profile?.full_name?.charAt(0) || 'U'}
                </div>
             </div>
             <div className="absolute bottom-1 right-1 w-6 h-6 bg-green-500 border-4 border-white dark:border-gray-800 rounded-full"></div>
          </div>

          <div className="text-center md:text-left space-y-2 flex-1">
            <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile?.full_name}</h2>
                <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                    <span className="px-3 py-1 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-xs font-bold uppercase tracking-wide rounded-full border border-brand-200 dark:border-brand-800">
                        {profile?.role}
                    </span>
                    <span className="text-gray-400 text-sm">ID: {profile?.id}</span>
                </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
                {profile?.email}
            </p>
          </div>

          <div className="flex flex-col gap-3 min-w-[140px]">
            <button className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-white rounded-xl text-sm font-medium transition-colors">
                Редагувати
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. Интерфейс */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                    <Icons.Sun /> {/* Можно заменить на иконку Глаза или Компьютера */}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">Інтерфейс</h3>
            </div>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Темна тема</p>
                        <p className="text-xs text-gray-500 mt-0.5">Зменшує навантаження на очі</p>
                    </div>
                    <ToggleSwitch checked={isDark} onChange={toggleTheme} />
                </div>
                {/* Заглушка для будущих фич */}
                <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Компактний режим</p>
                        <p className="text-xs text-gray-500 mt-0.5">Зменшити відступи в таблицях</p>
                    </div>
                    <ToggleSwitch checked={false} onChange={() => {}} />
                </div>
            </div>
        </div>

        {/* 3. Система / Developer Mode */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">Система</h3>
            </div>
            <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Режим розробника</p>
                        <p className="text-xs text-gray-500 mt-0.5">Показувати технічні дані (Debug Overlay)</p>
                    </div>
                    <ToggleSwitch checked={debugMode} onChange={toggleDebugMode} />
                </div>
                 <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-900 dark:text-white">Сповіщення</p>
                        <p className="text-xs text-gray-500 mt-0.5">Push-сповіщення у браузері</p>
                    </div>
                    <ToggleSwitch checked={true} onChange={() => {}} />
                </div>
            </div>
        </div>

        {/* 4. Безопасность */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg">
                     <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white">Безпека</h3>
            </div>
            <div className="p-6 space-y-4">
               <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Змінити пароль</label>
                  <input type="password" placeholder="Новий пароль" className="w-full mt-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white transition-all" />
               </div>
               <button className="w-full py-2.5 bg-white border border-gray-300 dark:bg-gray-700 dark:border-gray-600 text-gray-700 dark:text-white font-medium rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors text-sm">
                 Оновити
               </button>
            </div>
        </div>

      </div>

      {/* Danger Zone */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
           <div>
              <h3 className="text-red-800 dark:text-red-400 font-bold text-lg">Вихід із системи</h3>
              <p className="text-red-600/70 dark:text-red-400/70 text-sm">Це завершить вашу поточну сесію на цьому пристрої.</p>
           </div>
           <button
              onClick={handleLogout}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-lg shadow-red-600/30 transition-all active:scale-95 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              Вийти зараз
            </button>
        </div>
      </div>

    </div>
  );
};