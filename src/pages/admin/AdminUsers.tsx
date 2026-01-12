import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import type { Database } from '../../database.types';

type User = Database['public']['Tables']['users']['Row'];

// Тип для конфігурації сортування
type SortConfig = {
  key: keyof User;
  direction: 'asc' | 'desc';
};

export const AdminUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // State для фільтрів та сортування
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'id', direction: 'asc' });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [pageInput, setPageInput] = useState('1');

  useEffect(() => {
    fetchUsers();
  }, [page, pageSize, searchQuery, roleFilter, sortConfig]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(page + 1, totalPages);
    setPageInput(String(safePage));
  }, [page, pageSize, totalCount]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let query = supabase.from('users').select('*', { count: 'exact' });

      if (searchQuery) {
        const numericQuery = Number(searchQuery);
        if (!Number.isNaN(numericQuery)) {
          query = query.or(
            `id.eq.${numericQuery},full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,role.ilike.%${searchQuery}%,contract_number.ilike.%${searchQuery}%`
          );
        } else {
          query = query.or(
            `full_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,role.ilike.%${searchQuery}%,contract_number.ilike.%${searchQuery}%`
          );
        }
      }

      if (roleFilter !== 'all') {
        query = query.eq('role', roleFilter);
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order(sortConfig.key, { ascending: sortConfig.direction === 'asc' })
        .range(from, to);

      if (error) throw error;
      setUsers(data || []);
      if (count !== null) setTotalCount(count);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('Не вдалося завантажити список користувачів.');
    } finally {
      setLoading(false);
    }
  };

  // Логіка сортування
  const handleSort = (key: keyof User) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Компонент іконки сортування
  const SortIcon = ({ columnKey }: { columnKey: keyof User }) => {
    if (sortConfig.key !== columnKey) return <span className="text-gray-300 ml-1">⇅</span>;
    return sortConfig.direction === 'asc' 
      ? <span className="text-brand-600 ml-1">↑</span> 
      : <span className="text-brand-600 ml-1">↓</span>;
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 0 && newPage * pageSize < totalCount) setPage(newPage);
  };

  const handlePageJump = () => {
    const target = Number(pageInput);
    if (!Number.isFinite(target)) return;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const nextPage = Math.min(Math.max(1, target), totalPages) - 1;
    setPage(nextPage);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Завантаження команди...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6 animate-fade-in-up w-full max-w-full">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Команда</h1>
        
        <div className="flex w-full md:w-auto gap-3 flex-wrap">
          {/* Smart Search Input */}
          <div className="relative w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Пошук (ID, Ім'я, Роль...)"
              className="pl-10 pr-4 py-2 w-full border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:text-white"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            />
          </div>

          <div className="w-full md:w-44">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all dark:text-white"
            >
              <option value="all">Всі ролі</option>
              <option value="admin">Admin</option>
              <option value="lifeguard">Lifeguard</option>
              <option value="director">Director</option>
              <option value="accountant">Accountant</option>
            </select>
          </div>

          <button className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm whitespace-nowrap">
            + Додати
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 select-none">
              <tr>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors w-20"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">ID <SortIcon columnKey="id" /></div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('full_name')}
                >
                  <div className="flex items-center">Ім'я <SortIcon columnKey="full_name" /></div>
                </th>
                <th 
                  className="px-6 py-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center">Роль <SortIcon columnKey="role" /></div>
                </th>
                <th className="px-6 py-4">Контакти</th>
                <th 
                  className="px-6 py-4 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleSort('base_hourly_rate')}
                >
                  <div className="flex items-center justify-end">Ставка <SortIcon columnKey="base_hourly_rate" /></div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">
                    #{user.id}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {user.full_name || 'Без імені'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                      ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' : 
                        user.role === 'lifeguard' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' :
                        'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                      }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-gray-900 dark:text-gray-200">{user.email}</span>
                      {user.contract_number && (
                        <span className="text-xs text-gray-400 mt-0.5">№ {user.contract_number}</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300">
                    {user.base_hourly_rate ? `${user.base_hourly_rate.toFixed(0)} ₴` : '-'}
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p>Нікого не знайдено за запитом "{searchQuery}"</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-400 px-2">
        <div>Всього: {totalCount}</div>
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
  );
};
