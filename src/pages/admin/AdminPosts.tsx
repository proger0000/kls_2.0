import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { formatDateTimeLocal, fromDateTimeLocalInput, toDateTimeLocalInput } from '../../utils/date';

interface PostRecord {
  id: number;
  name: string | null;
  location_description: string | null;
  created_at: string;
  updated_at: string;
  complexity_coefficient: number | null;
}

interface PostFormState {
  id: string;
  name: string;
  location_description: string;
  created_at: string;
  updated_at: string;
  complexity_coefficient: string;
}

const emptyForm: PostFormState = {
  id: '',
  name: '',
  location_description: '',
  created_at: '',
  updated_at: '',
  complexity_coefficient: ''
};

export const AdminPosts = () => {
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [complexityFilter, setComplexityFilter] = useState('all');

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [pageInput, setPageInput] = useState('1');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPost, setEditingPost] = useState<PostRecord | null>(null);
  const [formState, setFormState] = useState<PostFormState>(emptyForm);

  useEffect(() => {
    fetchPosts();
  }, [page, pageSize, debouncedSearchQuery, complexityFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      if (page !== 0) {
        setPage(0);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, page]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(page + 1, totalPages);
    setPageInput(String(safePage));
  }, [page, pageSize, totalCount]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let query = supabase.from('posts').select('*', { count: 'exact' });

      if (debouncedSearchQuery) {
        const numericQuery = Number(debouncedSearchQuery);
        if (!Number.isNaN(numericQuery)) {
          query = query.or(
            `id.eq.${numericQuery},name.ilike.%${debouncedSearchQuery}%,location_description.ilike.%${debouncedSearchQuery}%`
          );
        } else {
          query = query.or(
            `name.ilike.%${debouncedSearchQuery}%,location_description.ilike.%${debouncedSearchQuery}%`
          );
        }
      }

      if (complexityFilter === 'with') {
        query = query.not('complexity_coefficient', 'is', null);
      }

      if (complexityFilter === 'without') {
        query = query.is('complexity_coefficient', null);
      }

      const from = page * pageSize;
      const to = from + pageSize - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setPosts((data as PostRecord[]) || []);
      if (count !== null) setTotalCount(count);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError('Не вдалося завантажити список постів.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    const now = new Date().toISOString();
    setEditingPost(null);
    setFormState({
      ...emptyForm,
      created_at: toDateTimeLocalInput(now),
      updated_at: toDateTimeLocalInput(now)
    });
    setIsModalOpen(true);
  };

  const openEditModal = (post: PostRecord) => {
    setEditingPost(post);
    setFormState({
      name: post.name || '',
      location_description: post.location_description || '',
      id: String(post.id),
      created_at: toDateTimeLocalInput(post.created_at),
      updated_at: toDateTimeLocalInput(post.updated_at),
      complexity_coefficient: post.complexity_coefficient?.toString() || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const idValue = formState.id.trim();
      const manualId = idValue ? Number(idValue) : null;
      if (!editingPost && idValue && Number.isNaN(manualId)) {
        alert('ID посту має бути числом.');
        return;
      }
      const complexityValue = formState.complexity_coefficient.trim();
      const complexityNumber = complexityValue ? Number(complexityValue) : null;
      const payload = {
        name: formState.name.trim() || null,
        location_description: formState.location_description.trim() || null,
        created_at: fromDateTimeLocalInput(formState.created_at) || new Date().toISOString(),
        updated_at: fromDateTimeLocalInput(formState.updated_at) || new Date().toISOString(),
        complexity_coefficient: Number.isNaN(complexityNumber) ? null : complexityNumber
      } as {
        id?: number;
        name: string | null;
        location_description: string | null;
        created_at: string;
        updated_at: string;
        complexity_coefficient: number | null;
      };

      if (editingPost) {
        const { error } = await supabase.from('posts').update(payload).eq('id', editingPost.id);
        if (error) throw error;
      } else {
        if (manualId !== null && !Number.isNaN(manualId)) {
          payload.id = manualId;
        }
        const { error } = await supabase.from('posts').insert(payload);
        if (error) throw error;
      }

      setIsModalOpen(false);
      await fetchPosts();
    } catch (err: any) {
      console.error('Error saving post:', err);
      alert('Помилка збереження: ' + (err.message || err.details || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (post: PostRecord) => {
    if (!window.confirm(`Видалити пост "${post.name || `#${post.id}`}"?`)) return;
    const { error } = await supabase.from('posts').delete().eq('id', post.id);
    if (error) {
      console.error('Error deleting post:', error);
      alert('Не вдалося видалити пост.');
      return;
    }
    await fetchPosts();
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

  if (loading) return <div className="p-8 text-center text-gray-500">Завантаження постів...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Пости</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Керування локаціями, описами та коефіцієнтами</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm"
        >
          + Додати пост
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-6">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Пошук</label>
          <input
            type="text"
            placeholder="ID, назва, опис..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div className="md:col-span-3">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Коефіцієнт</label>
          <select
            value={complexityFilter}
            onChange={(e) => { setComplexityFilter(e.target.value); setPage(0); }}
            className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="all">Усі</option>
            <option value="with">З коефіцієнтом</option>
            <option value="without">Без коефіцієнта</option>
          </select>
        </div>
        <div className="md:col-span-3 flex items-end">
          <button
            onClick={() => {
              setSearchQuery('');
              setComplexityFilter('all');
              setPage(0);
            }}
            className="w-full py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 text-sm font-medium transition"
          >
            Скинути
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400">
              <tr>
                <th className="px-4 py-4 w-16">ID</th>
                <th className="px-4 py-4">Назва</th>
                <th className="px-4 py-4">Опис</th>
                <th className="px-4 py-4 text-center w-28">Коеф.</th>
                <th className="px-4 py-4">Створено</th>
                <th className="px-4 py-4">Оновлено</th>
                <th className="px-4 py-4 text-right">Дії</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">#{post.id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">
                    {post.name || 'Без назви'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {post.location_description || 'Опис відсутній'}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs">
                    {post.complexity_coefficient ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {formatDateTimeLocal(new Date(post.created_at))}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {formatDateTimeLocal(new Date(post.updated_at))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEditModal(post)}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition"
                      >
                        Редагувати
                      </button>
                      <button
                        onClick={() => handleDelete(post)}
                        className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition"
                      >
                        Видалити
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {posts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                    Немає постів за поточними фільтрами.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="p-4 border border-gray-100 dark:border-gray-700 rounded-2xl bg-gray-50 dark:bg-gray-700/20 flex flex-col sm:flex-row justify-between items-center gap-4">
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => !isSaving && setIsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  {editingPost ? `Редагування посту #${editingPost.id}` : 'Новий пост'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Заповніть усі поля для локації</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                ✕
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">ID посту</label>
                <input
                  type="number"
                  value={formState.id}
                  onChange={(e) => setFormState((prev) => ({ ...prev, id: e.target.value }))}
                  disabled={Boolean(editingPost)}
                  placeholder={editingPost ? 'Автоматично' : 'Вкажіть ID'}
                  className="mt-1 w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Назва</label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase">Опис локації</label>
                <textarea
                  value={formState.location_description}
                  onChange={(e) => setFormState((prev) => ({ ...prev, location_description: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Коефіцієнт складності</label>
                <input
                  type="number"
                  step="0.01"
                  value={formState.complexity_coefficient}
                  onChange={(e) => setFormState((prev) => ({ ...prev, complexity_coefficient: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Створено</label>
                <input
                  type="datetime-local"
                  value={formState.created_at}
                  onChange={(e) => setFormState((prev) => ({ ...prev, created_at: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Оновлено</label>
                <input
                  type="datetime-local"
                  value={formState.updated_at}
                  onChange={(e) => setFormState((prev) => ({ ...prev, updated_at: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-900/30">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-200"
              >
                Скасувати
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-70"
              >
                {isSaving ? 'Збереження...' : 'Зберегти'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
