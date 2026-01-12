import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { Icons } from '../../components/Icons';
import { useNavigate } from 'react-router-dom';
import { formatDateLocal, formatTimeLocal } from '../../utils/date';

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

interface PostOption {
  id: number;
  name: string | null;
}

export const AdminReports: React.FC = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState<AdminReportViewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostOption[]>([]);

  // Стан для пошуку
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPostId, setFilterPostId] = useState('all');
  const [filterIncidents, setFilterIncidents] = useState('all');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  // Пагінація
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [pageInput, setPageInput] = useState('1');

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [page, pageSize]); // Re-fetch when page or pageSize changes

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(page + 1, totalPages);
    setPageInput(String(safePage));
  }, [page, pageSize, totalCount]);

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
  }, [searchQuery, filterPostId, filterIncidents, filterStartDate, filterEndDate]);

  const fetchPosts = async () => {
    const { data, error } = await supabase.from('posts').select('id, name').order('name');
    if (error) {
      console.error('Error fetching posts:', error);
      return;
    }
    setPosts(data || []);
  };

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

      if (filterPostId !== 'all') {
        const selectedPost = posts.find((post) => post.id === Number(filterPostId));
        if (selectedPost?.name) {
          query = query.eq('post_name', selectedPost.name);
        }
      }

      if (filterStartDate) {
        const normalizedStart = formatDateLocal(new Date(filterStartDate));
        query = query.gte('shift_date', normalizedStart);
      }

      if (filterEndDate) {
        const normalizedEnd = formatDateLocal(new Date(filterEndDate));
        query = query.lte('shift_date', normalizedEnd);
      }

      if (filterIncidents === 'with') {
        query = query.or(
          'count_ambulance.gt.0,count_police.gt.0,count_first_aid.gt.0,count_lost_child.gt.0'
        );
      }

      if (filterIncidents === 'without') {
        query = query
          .eq('count_ambulance', 0)
          .eq('count_police', 0)
          .eq('count_first_aid', 0)
          .eq('count_lost_child', 0);
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

  const handlePageJump = () => {
    const target = Number(pageInput);
    if (!Number.isFinite(target)) return;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const nextPage = Math.min(Math.max(1, target), totalPages) - 1;
    setPage(nextPage);
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

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="md:col-span-4">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Пост</label>
          <select
            value={filterPostId}
            onChange={(e) => { setFilterPostId(e.target.value); setPage(0); }}
            className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Всі пости</option>
            {posts.map((post) => (
              <option key={post.id} value={post.id}>
                {post.name || `Пост #${post.id}`}
              </option>
            ))}
          </select>
        </div>
        <div className="md:col-span-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Інциденти</label>
          <select
            value={filterIncidents}
            onChange={(e) => { setFilterIncidents(e.target.value); setPage(0); }}
            className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Усі</option>
            <option value="with">Тільки з інцидентами</option>
            <option value="without">Без інцидентів</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Початок</label>
          <input
            type="date"
            value={filterStartDate}
            onChange={(e) => { setFilterStartDate(e.target.value); setPage(0); }}
            className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Кінець</label>
          <input
            type="date"
            value={filterEndDate}
            onChange={(e) => { setFilterEndDate(e.target.value); setPage(0); }}
            className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="md:col-span-1 flex items-end">
          <button
            onClick={() => {
              setFilterPostId('all');
              setFilterIncidents('all');
              setFilterStartDate('');
              setFilterEndDate('');
              setPage(0);
            }}
            className="w-full py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 text-sm font-medium transition"
          >
            Скинути
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
                          {formatDateLocal(new Date(row.shift_date))}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatTimeLocal(new Date(row.shift_date))}
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
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Перейти:</span>
            <input
              type="number"
              min={1}
              max={Math.max(1, Math.ceil(totalCount / pageSize))}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onBlur={handlePageJump}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handlePageJump();
              }}
              className="w-20 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
