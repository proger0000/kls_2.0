import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../supabase';
import type { Database } from '../../database.types';

type User = Database['public']['Tables']['users']['Row'];

// Тип для конфігурації сортування
type SortConfig = {
  key: keyof User;
  direction: 'asc' | 'desc';
};

type DraftUser = {
  full_name: string;
  role: string;
  email: string;
  contract_number: string;
  base_hourly_rate: string;
};

type PendingChange = {
  label: string;
  before: string;
  after: string;
};

const formatRate = (value: number | null) => (value === null ? '-' : `${value.toFixed(0)} ₴`);

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
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [draftUser, setDraftUser] = useState<DraftUser | null>(null);
  const [confirmChanges, setConfirmChanges] = useState<{
    userId: number;
    updates: Partial<User>;
    changes: PendingChange[];
  } | null>(null);
  const [bulkRateModalOpen, setBulkRateModalOpen] = useState(false);
  const [bulkRateInput, setBulkRateInput] = useState('');
  const [bulkRateError, setBulkRateError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const activeUser = useMemo(() => users.find((user) => user.id === editingUserId) || null, [editingUserId, users]);

  const startEdit = (user: User) => {
    setEditingUserId(user.id);
    setDraftUser({
      full_name: user.full_name || '',
      role: user.role || '',
      email: user.email || '',
      contract_number: user.contract_number || '',
      base_hourly_rate: user.base_hourly_rate === null ? '' : String(user.base_hourly_rate),
    });
  };

  const cancelEdit = () => {
    setEditingUserId(null);
    setDraftUser(null);
  };

  const applyDraftChange = (key: keyof DraftUser, value: string) => {
    setDraftUser((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const buildChanges = (user: User, draft: DraftUser) => {
    const updates: Partial<User> = {};
    const changes: PendingChange[] = [];

    if ((user.full_name || '') !== draft.full_name.trim()) {
      updates.full_name = draft.full_name.trim();
      changes.push({
        label: "Ім'я",
        before: user.full_name || 'Без імені',
        after: draft.full_name.trim() || 'Без імені',
      });
    }

    if ((user.role || '') !== draft.role) {
      updates.role = draft.role as User['role'];
      changes.push({
        label: 'Роль',
        before: user.role || '-',
        after: draft.role || '-',
      });
    }

    if ((user.email || '') !== draft.email.trim()) {
      updates.email = draft.email.trim();
      changes.push({
        label: 'Email',
        before: user.email || '-',
        after: draft.email.trim() || '-',
      });
    }

    if ((user.contract_number || '') !== draft.contract_number.trim()) {
      updates.contract_number = draft.contract_number.trim() || null;
      changes.push({
        label: 'Договір',
        before: user.contract_number || '-',
        after: draft.contract_number.trim() || '-',
      });
    }

    const normalizedRate = draft.base_hourly_rate.trim();
    const parsedRate = normalizedRate === '' ? null : Number(normalizedRate);
    const currentRate = user.base_hourly_rate ?? null;
    if ((Number.isFinite(parsedRate) ? parsedRate : null) !== currentRate) {
      updates.base_hourly_rate = Number.isFinite(parsedRate) ? parsedRate : null;
      changes.push({
        label: 'Ставка',
        before: formatRate(currentRate),
        after: formatRate(Number.isFinite(parsedRate) ? parsedRate : null),
      });
    }

    return { updates, changes };
  };

  const handleSaveEdit = () => {
    if (!activeUser || !draftUser) return;
    const { updates, changes } = buildChanges(activeUser, draftUser);
    if (changes.length === 0) {
      cancelEdit();
      return;
    }
    setConfirmChanges({ userId: activeUser.id, updates, changes });
  };

  const confirmEdit = async () => {
    if (!confirmChanges) return;
    try {
      setSaving(true);
      const { error: updateError } = await supabase
        .from('users')
        .update(confirmChanges.updates)
        .eq('id', confirmChanges.userId);
      if (updateError) throw updateError;
      setUsers((prev) =>
        prev.map((user) =>
          user.id === confirmChanges.userId ? { ...user, ...confirmChanges.updates } : user
        )
      );
      cancelEdit();
      setConfirmChanges(null);
    } catch (err: any) {
      console.error('Error updating user:', err);
      window.alert('Не вдалося оновити користувача.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: number) => {
    if (!window.confirm('Видалити користувача?')) return;
    try {
      setSaving(true);
      const { error: deleteError } = await supabase.from('users').delete().eq('id', userId);
      if (deleteError) throw deleteError;
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      setTotalCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      console.error('Error deleting user:', err);
      window.alert('Не вдалося видалити користувача.');
    } finally {
      setSaving(false);
    }
  };

  const applyBulkRate = async () => {
    const normalizedRate = bulkRateInput.trim();
    const parsedRate = Number(normalizedRate);
    if (!Number.isFinite(parsedRate)) {
      setBulkRateError('Вкажіть коректну ставку.');
      return;
    }
    try {
      setSaving(true);
      setBulkRateError(null);
      const { error: updateError } = await supabase.rpc('admin_set_base_hourly_rate', {
        new_rate: parsedRate,
      });
      if (updateError) throw updateError;
      setUsers((prev) => prev.map((user) => ({ ...user, base_hourly_rate: parsedRate })));
      setBulkRateModalOpen(false);
      setBulkRateInput('');
    } catch (err: any) {
      console.error('Error updating rates:', err);
      window.alert('Не вдалося оновити ставки.');
    } finally {
      setSaving(false);
    }
  };

  const resetMonthlyPoints = async () => {
    if (!window.confirm('Скинути усі нараховані бали до 0?')) return;
    try {
      setSaving(true);
      const { error: resetError } = await supabase.rpc('admin_reset_month_points');
      if (resetError) throw resetError;
      setUsers((prev) => prev.map((user) => ({ ...user, current_month_points: 0 })));
    } catch (err: any) {
      console.error('Error resetting points:', err);
      window.alert('Не вдалося скинути бали.');
    } finally {
      setSaving(false);
    }
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

          <button
            onClick={() => {
              setBulkRateModalOpen(true);
              setBulkRateError(null);
            }}
            className="border border-brand-200 text-brand-700 hover:bg-brand-50 dark:border-brand-500/50 dark:text-brand-200 dark:hover:bg-brand-500/10 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            Встановити ставку
          </button>

          <button
            onClick={resetMonthlyPoints}
            className="border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-500/50 dark:text-red-300 dark:hover:bg-red-500/10 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm whitespace-nowrap"
          >
            Скинути бали
          </button>

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
                <th className="px-6 py-4 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-400">
                    #{user.id}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {editingUserId === user.id && draftUser ? (
                      <input
                        type="text"
                        value={draftUser.full_name}
                        onChange={(e) => applyDraftChange('full_name', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-white"
                      />
                    ) : (
                      user.full_name || 'Без імені'
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUserId === user.id && draftUser ? (
                      <select
                        value={draftUser.role}
                        onChange={(e) => applyDraftChange('role', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm"
                      >
                        <option value="admin">Admin</option>
                        <option value="lifeguard">Lifeguard</option>
                        <option value="director">Director</option>
                        <option value="accountant">Accountant</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${user.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' : 
                          user.role === 'lifeguard' ? 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' :
                          'bg-gray-50 text-gray-700 border-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'
                        }`}>
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingUserId === user.id && draftUser ? (
                      <div className="flex flex-col gap-2">
                        <input
                          type="email"
                          value={draftUser.email}
                          onChange={(e) => applyDraftChange('email', e.target.value)}
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-white"
                        />
                        <input
                          type="text"
                          value={draftUser.contract_number}
                          onChange={(e) => applyDraftChange('contract_number', e.target.value)}
                          className="w-full rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-600 dark:text-gray-200"
                          placeholder="№ договору"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col">
                        <span className="text-gray-900 dark:text-gray-200">{user.email}</span>
                        {user.contract_number && (
                          <span className="text-xs text-gray-400 mt-0.5">№ {user.contract_number}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right font-mono text-gray-700 dark:text-gray-300">
                    {editingUserId === user.id && draftUser ? (
                      <input
                        type="number"
                        min={0}
                        value={draftUser.base_hourly_rate}
                        onChange={(e) => applyDraftChange('base_hourly_rate', e.target.value)}
                        className="w-24 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-right text-sm"
                      />
                    ) : (
                      formatRate(user.base_hourly_rate ?? null)
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingUserId === user.id ? (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs font-medium hover:bg-brand-700"
                        >
                          Зберегти
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-medium text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Скасувати
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEdit(user)}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-xs font-medium text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          Редагувати
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
                        >
                          Видалити
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
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

      {bulkRateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Встановити ставку усім</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
              Вкажіть ставку, яка буде застосована для всіх користувачів перед початком сезону.
            </p>
            <div className="mt-4">
              <label className="text-xs font-medium text-gray-500">Нова ставка</label>
              <input
                type="number"
                min={0}
                value={bulkRateInput}
                onChange={(e) => setBulkRateInput(e.target.value)}
                className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white"
                placeholder="Наприклад, 150"
              />
              {bulkRateError && (
                <p className="mt-2 text-xs text-red-500">{bulkRateError}</p>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setBulkRateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Скасувати
              </button>
              <button
                onClick={applyBulkRate}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
              >
                Застосувати
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmChanges && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Підтвердити зміну?</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
              Перевірте зміни перед збереженням.
            </p>
            <div className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-200">
              {confirmChanges.changes.map((change) => (
                <div key={change.label} className="flex flex-col gap-1 rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                  <span className="text-xs font-semibold text-gray-500 uppercase">{change.label}</span>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                    <span className="line-through text-gray-400">{change.before}</span>
                    <span className="text-gray-500">→</span>
                    <span className="text-gray-900 dark:text-white">{change.after}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmChanges(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
                disabled={saving}
              >
                Ні
              </button>
              <button
                onClick={confirmEdit}
                className="px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-medium hover:bg-brand-700"
                disabled={saving}
              >
                Так
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
