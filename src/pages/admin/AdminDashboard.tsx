import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    activeShifts: 0,
    pendingPhotos: 0,
    peopleOnShift: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { count: activeCount } = await supabase
        .from('shifts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');

      const { count: pendingCount } = await supabase
        .from('shifts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'closed')
        .is('photo_close_approved', null); 

      setStats({
        activeShifts: activeCount || 0,
        pendingPhotos: pendingCount || 0,
        peopleOnShift: activeCount || 0 
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-full space-y-6 animate-fade-in-up overflow-x-hidden">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white truncate">Панель керування</h1>
      
      {/* KPI Cards Grid - додано min-w-0 щоб запобігти розтягуванню flex-елементів */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1 */}
        <Link to="/admin/schedule" className="block group min-w-0">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all group-hover:shadow-md group-hover:border-brand-200 dark:group-hover:border-brand-900 h-full relative overflow-hidden">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium truncate">Активні зміни</h3>
            <div className="flex items-end justify-between mt-2">
              <p className="text-4xl font-bold text-brand-600">{loading ? '-' : stats.activeShifts}</p>
              <div className="w-2 h-2 rounded-full bg-green-500 mb-2 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            </div>
            <p className="text-xs text-gray-400 mt-2 group-hover:text-brand-600 transition-colors">Переглянути графік →</p>
          </div>
        </Link>

        {/* Card 2 */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-w-0 h-full">
          <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium truncate">Очікують підтвердження</h3>
          <p className="text-4xl font-bold text-orange-500 mt-2">{loading ? '-' : stats.pendingPhotos}</p>
          <p className="text-xs text-gray-400 mt-1 truncate">Фотозвіти закриття</p>
        </div>

        {/* Card 3 */}
        <Link to="/admin/users" className="block group min-w-0">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-all group-hover:shadow-md h-full">
            <h3 className="text-gray-500 dark:text-gray-400 text-sm font-medium truncate">Лайфгардів на посту</h3>
            <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2">{loading ? '-' : stats.peopleOnShift}</p>
            <p className="text-xs text-gray-400 mt-2 truncate">Всього активних зараз</p>
          </div>
        </Link>
      </div>

      {/* Map Placeholder */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 min-h-[300px] flex flex-col justify-center items-center text-center overflow-hidden">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-full mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Мапа постів</h3>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm mt-2 text-sm">
          Інтерактивна мапа з розташуванням постів та статусами буде додана в наступному оновленні.
        </p>
      </div>
    </div>
  );
};