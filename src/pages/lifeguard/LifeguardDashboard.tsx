
import { useAuth } from '../../contexts/AuthContext';

export const LifeguardDashboard = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Приветствие */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Вітаємо, {profile?.full_name?.split(' ')[1]}! 👋
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Гарної зміни та спокійного чергування.
        </p>
      </div>

      {/* Статус смены (Карточка действия) */}
      <div className="bg-gradient-to-br from-brand-600 to-brand-500 rounded-3xl p-8 text-white shadow-xl shadow-brand-500/30 text-center relative overflow-hidden">
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2">Зміна не розпочата</h2>
          <p className="text-brand-100 text-sm mb-6">
            Для початку роботи прикладіть телефон до NFC-мітки на посту.
          </p>
          
          {/* Кнопка симуляции сканирования (для теста без метки) */}
          <button className="px-6 py-3 bg-white text-brand-600 font-bold rounded-xl shadow-sm active:scale-95 transition-transform w-full sm:w-auto">
            Эмуляция NFC (Тест)
          </button>
        </div>
        
        {/* Декор */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl -ml-5 -mb-5"></div>
      </div>

      {/* Быстрая статистика */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-3xl font-bold text-gray-900 dark:text-white">0</p>
          <p className="text-xs text-gray-500 uppercase font-bold mt-1">Годин цього місяця</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-3xl font-bold text-accent-500">0</p>
          <p className="text-xs text-gray-500 uppercase font-bold mt-1">Нараховано балів</p>
        </div>
      </div>
    </div>
  );
};