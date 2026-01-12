import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { Icons } from '../../components/Icons';
import { useNavigate } from 'react-router-dom';

// Інтерфейс для даних з View
interface AdminReportViewItem {
  report_id: number;
  shift_id: number;
  report_submitted_at: string;
  shift_date: string;
  post_name: string | null;
  suspicious_swimmers_count: number;
  people_on_beach_estimated: number;
  people_in_water_estimated: number;
  count_ambulance: number;
  count_police: number;
  count_first_aid: number;
  count_lost_child: number;
}

export const AdminReports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<AdminReportViewItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Стан для пошуку
  const [searchQuery, setSearchQuery] = useState('');

  // Пагінація
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchReports();
  }, [page, pageSize]); // Re-fetch when page or pageSize changes

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (page !== 0) {
        setPage(0); // Reset to first page on search change
      } else {
        fetchReports();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchReports = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('view_admin_reports')
        .select('*', { count: 'exact' });

      // Apply search filter if exists
      if (searchQuery) {
        if (!isNaN(Number(searchQuery))) {
          // If it's a number, try to match IDs
          query = query.or(`shift_id.eq.${searchQuery},report_id.eq.${searchQuery}`);
        } else {
          // Text search
          query = query.ilike('post_name', `%${searchQuery}%`);
        }
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('shift_date', { ascending: false })
        .range(from, to);

      if (error) throw error;

      if (data) {
        setReports(data as unknown as AdminReportViewItem[]);
        if (count !== null) setTotalCount(count);
      }
    } catch (error) {
      console.error('Error fetching admin reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (reportId: number) => {
    navigate(`/admin/reports/${reportId}`);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage * pageSize < totalCount) {
      setPage(newPage);
    }
  };

  const ZeroFade = ({ value, className = "" }: { value: number, className?: string }) => (
    <span className={`${value === 0 ? 'text-gray-300 dark:text-gray-700' : 'font-bold text-gray-800 dark:text-white'} ${className}`}>
      {value}
    </span>
  );

  return (
    <div className="space-y-6 animate-fade-in-up pb-24">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Звіти та Інциденти</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Архів звітів змін</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Поле пошуку */}
          <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-400">🔍</span>
            </div>
            <input
              type="text"
              placeholder="Пошук (ID зміни, ID звіту, Пост)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition w-full shadow-sm text-sm"
            />
          </div>

          <button
            onClick={fetchReports}
            className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm text-gray-600 dark:text-gray-300"
            title="Оновити дані"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
              <tr>
                {/* Оновлені заголовки */}
                <th className="px-4 py-4 font-semibold text-gray-600 dark:text-gray-400 w-24">Shift ID</th>
                <th className="px-4 py-4 font-semibold text-gray-600 dark:text-gray-400 w-24">Звіт ID</th>
                <th className="px-4 py-4 font-semibold text-gray-600 dark:text-gray-400 w-32">Дата</th>
                <th className="px-4 py-4 font-semibold text-gray-600 dark:text-gray-400">Пост</th>
                <th className="px-2 py-4 font-semibold text-gray-600 dark:text-gray-400 text-center" title="Критичні плавці">🏊‍♂️</th>
                <th className="px-2 py-4 font-semibold text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/10 border-l border-r border-red-100 dark:border-red-900/20" title="Швидка">🚑</th>
                <th className="px-2 py-4 font-semibold text-blue-600 dark:text-blue-400 text-center bg-blue-50 dark:bg-blue-900/10 border-r border-blue-100 dark:border-blue-900/20" title="Поліція">🚓</th>
                <th className="px-2 py-4 font-semibold text-green-600 dark:text-green-400 text-center bg-green-50 dark:bg-green-900/10 border-r border-green-100 dark:border-green-900/20" title="Допомога">❤️</th>
                <th className="px-2 py-4 font-semibold text-orange-600 dark:text-orange-400 text-center bg-orange-50 dark:bg-orange-900/10 border-r border-orange-100 dark:border-orange-900/20" title="Діти">👶</th>
                <th className="px-4 py-4 font-semibold text-gray-600 dark:text-gray-400 text-center">Люди</th>
                <th className="px-4 py-4 font-semibold text-gray-600 dark:text-gray-400 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <span className="animate-spin text-2xl">⏳</span>
                      <span>Завантаження звітів...</span>
                    </div>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-12 text-gray-500">
                    {searchQuery ? 'За вашим запитом нічого не знайдено' : 'Звітів поки немає'}
                  </td>
                </tr>
              ) : (
                reports.map((row) => (
                  <tr key={row.report_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group">
                    {/* Shift ID - Сірим */}
                    <td className="px-4 py-4 font-mono text-xs text-gray-500 dark:text-gray-400">
                      #{row.shift_id}
                    </td>

                    {/* Report ID - Виділеним (бо це основна сутність тут) */}
                    <td className="px-4 py-4 font-mono text-xs text-blue-600 dark:text-blue-400 font-bold">
                      R-{row.report_id}
                    </td>

                    {/* Дата */}
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 dark:text-white text-sm">
                          {new Date(row.shift_date).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(row.shift_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>

                    {/* Пост */}
                    <td className="px-4 py-4 text-gray-600 dark:text-gray-300 font-medium text-sm">
                      {row.post_name || 'Не вказано'}
                    </td>

                    {/* Показники */}
                    <td className="px-2 py-4 text-center"><ZeroFade value={row.suspicious_swimmers_count} /></td>

                    {/* Інциденти (кольорові колонки) */}
                    <td className="px-2 py-4 text-center bg-red-50/30 dark:bg-red-900/5 border-l border-r border-gray-50 dark:border-gray-800">
                      <ZeroFade value={row.count_ambulance} className="text-red-600 dark:text-red-400" />
                    </td>
                    <td className="px-2 py-4 text-center bg-blue-50/30 dark:bg-blue-900/5 border-r border-gray-50 dark:border-gray-800">
                      <ZeroFade value={row.count_police} className="text-blue-600 dark:text-blue-400" />
                    </td>
                    <td className="px-2 py-4 text-center bg-green-50/30 dark:bg-green-900/5 border-r border-gray-50 dark:border-gray-800">
                      <ZeroFade value={row.count_first_aid} className="text-green-600 dark:text-green-400" />
                    </td>
                    <td className="px-2 py-4 text-center bg-orange-50/30 dark:bg-orange-900/5 border-r border-gray-50 dark:border-gray-800">
                      <ZeroFade value={row.count_lost_child} className="text-orange-600 dark:text-orange-400" />
                    </td>

                    {/* Люди (Вода / Пляж) */}
                    <td className="px-4 py-4 text-center">
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                        {row.people_in_water_estimated} / {row.people_on_beach_estimated}
                      </span>
                    </td>

                    {/* Дії */}
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleViewDetails(row.report_id)}
                        className="text-gray-500 hover:text-primary hover:bg-primary/10 p-2 rounded-full transition-colors"
                        title="Детальний перегляд"
                      >
                        <Icons.Eye />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-gray-700/20">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Показати:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-brand-500 outline-none"
            >
              <option value="15">15</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 0}
              className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Назад
            </button>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
              Сторінка {page + 1} з {Math.ceil(totalCount / pageSize) || 1}
            </span>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={(page + 1) * pageSize >= totalCount}
              className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Вперед
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;