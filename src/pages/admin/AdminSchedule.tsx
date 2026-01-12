import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { useNavigate } from 'react-router-dom';

// URL сайту для фото
const SITE_URL = 'https://app.lifeguard.kyiv.ua';

// --- Types ---
type ShiftWithDetails = {
  id: number;
  activity_type: string | null;
  start_time: string;
  end_time: string | null;
  status: string | null;
  manual_opened_by: number | null;
  manual_closed_by: number | null;
  rounded_work_hours: number | null;
  start_photo_path: string | null;
  photo_close_path: string | null;
  post_id: number;
  lifeguard_assignment_type: number | null; // Додано поле для рівня
  // Relations
  lifeguard: { id: number, full_name: string | null } | null;
  location: { name: string | null } | null;
  admin_opener: { full_name: string | null } | null;
  admin_closer: { full_name: string | null } | null;
  reports: { id: number }[]; 
};

// --- Helpers ---
const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
const formatTime = (dateStr: string) => new Date(dateStr).toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

const getDuration = (shift: ShiftWithDetails) => {
    if (shift.rounded_work_hours) return `${shift.rounded_work_hours} год`;
    if (shift.start_time && shift.end_time) {
        const diff = (new Date(shift.end_time).getTime() - new Date(shift.start_time).getTime()) / 3600000;
        return `${diff.toFixed(1)} год`;
    }
    return '...';
};

const getImageUrl = (path: string | null) => {
    if (!path) return undefined;
    if (path.startsWith('http')) return path;
    return `${SITE_URL}/${path}`;
};

// Функція визначення рівня на основі lifeguard_assignment_type
const getLifeguardLevel = (type: number | null) => {
    switch (type) {
        case 0: return { label: 'L1', color: 'bg-blue-100 text-blue-700 border-blue-200' };
        case 1: return { label: 'L2', color: 'bg-purple-100 text-purple-700 border-purple-200' };
        case 2: return { label: 'L0', color: 'bg-amber-100 text-amber-700 border-amber-200' };
        default: return { label: '-', color: 'bg-gray-100 text-gray-500 border-gray-200' };
    }
};

export const AdminSchedule = () => {
  const [shifts, setShifts] = useState<ShiftWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // --- Pagination ---
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);

  // --- Filters ---
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    postId: 'all'
  });
  const [postsList, setPostsList] = useState<{id: number, name: string}[]>([]);

  // --- Delete Modal State ---
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; shift: ShiftWithDetails | null }>({
    isOpen: false,
    shift: null
  });

  useEffect(() => {
    const loadPosts = async () => {
        const { data } = await supabase.from('posts').select('id, name').order('name');
        if (data) setPostsList(data as any);
    };
    loadPosts();
  }, []);

  useEffect(() => {
    fetchShifts();
  }, [page, pageSize, filters]);

  const fetchShifts = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('shifts')
        .select(`
          *,
          lifeguard:users!fk_shifts_users (id, full_name),
          location:posts!fk_shifts_posts (name),
          admin_opener:users!fk_shifts_manual_opened_by (full_name),
          admin_closer:users!fk_shifts_manual_closed_by (full_name),
          reports:shift_reports!fk_reports_shift (id)
        `, { count: 'exact' });

      // Filters
      if (filters.search) {
        if (!isNaN(Number(filters.search))) {
            query = query.eq('id', Number(filters.search));
        }
        // TODO: Додати пошук по тексту через RPC або додатковий запит, якщо потрібно
      }
      if (filters.status === 'active') query = query.is('end_time', null);
      else if (filters.status === 'completed') query = query.not('end_time', 'is', null);
      else if (filters.status === 'admin_action') query = query.or('manual_opened_by.neq.null,manual_closed_by.neq.null');

      if (filters.dateFrom) query = query.gte('start_time', filters.dateFrom);
      if (filters.dateTo) query = query.lte('start_time', filters.dateTo + 'T23:59:59');
      if (filters.postId !== 'all') query = query.eq('post_id', Number(filters.postId));

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      
      const { data, error, count } = await query
        .order('start_time', { ascending: false })
        .range(from, to);

      if (error) throw error;
      setShifts(data as any);
      if (count !== null) setTotalCount(count);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDeleteModal = (shift: ShiftWithDetails) => setDeleteModal({ isOpen: true, shift });

  const confirmDelete = async () => {
    if (!deleteModal.shift) return;
    try {
        const { error } = await supabase.from('shifts').delete().eq('id', deleteModal.shift.id);
        if (error) throw error;
        setShifts(prev => prev.filter(s => s.id !== deleteModal.shift?.id));
        setTotalCount(prev => prev - 1);
        setDeleteModal({ isOpen: false, shift: null });
    } catch (err: any) {
        alert('Помилка: ' + err.message);
    }
  };

  // --- Components ---

  const StatusBadge = ({ shift }: { shift: ShiftWithDetails }) => {
    const isActive = !shift.end_time;
    const isManualOpen = !!shift.manual_opened_by;
    const isManualClose = !!shift.manual_closed_by;

    let wrapperClass = "w-[140px] h-[28px] rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all grid grid-cols-[16px_1fr_16px] items-center px-2 select-none";
    let iconClass = "w-3.5 h-3.5";

    if (isActive) {
        wrapperClass += " bg-gradient-to-r from-orange-500 to-red-600 text-white border border-red-500/20 animate-pulse-slow";
    } else {
        wrapperClass += " bg-emerald-50 text-emerald-700 border border-emerald-200";
    }

    return (
        <div className={wrapperClass}>
            {/* Left Slot: Manual Open */}
            <div className="flex items-center justify-center">
                {isManualOpen && (
                    <div title={`Відкрито вручну: ${shift.admin_opener?.full_name}`} className="cursor-help">
                        <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Center Slot: Text */}
            <div className="text-center truncate px-1">
                {isActive ? 'Активна' : 'Завершена'}
            </div>

            {/* Right Slot: Manual Close */}
            <div className="flex items-center justify-center">
                {isManualClose && (
                    <div title={`Закрито вручну: ${shift.admin_closer?.full_name}`} className="cursor-help">
                       <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                       </svg>
                    </div>
                )}
            </div>
        </div>
    );
  };

  const MediaIcon = ({ active, type, link }: { active: boolean, type: 'start' | 'end' | 'report', link?: string }) => {
    const baseClasses = "w-7 h-7 rounded flex items-center justify-center transition-all duration-200";
    const activeClasses = "text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 cursor-pointer";
    const inactiveClasses = "text-gray-300 bg-gray-50 border border-gray-100 cursor-default";

    const CameraIcon = (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    );

    const ReportIcon = (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    );

    const icon = type === 'report' ? ReportIcon : CameraIcon;

    if (active && link) {
        return (
            <a href={link} target="_blank" rel="noreferrer" className={`${baseClasses} ${activeClasses}`} title={type === 'start' ? 'Фото початку' : type === 'end' ? 'Фото кінця' : 'Звіт'}>
                {icon}
            </a>
        );
    }
    return (
        <div className={`${baseClasses} ${inactiveClasses}`} title="Немає даних">
            {icon}
        </div>
    );
  };

  return (
    <div className="w-full max-w-full space-y-6 animate-fade-in-up pb-20">
      
      {/* Header & Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Історія змін</h1>
            
            <div className="flex items-center gap-2">
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border shadow-sm ${showFilters ? 'bg-brand-50 border-brand-200 text-brand-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50'}`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    Фільтри
                </button>
                <button 
                    onClick={fetchShifts} 
                    className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors shadow-sm"
                    title="Оновити список"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                </button>
            </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in-down">
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Пошук</label>
                    <input 
                        type="text" 
                        placeholder="ID..." 
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white"
                        value={filters.search}
                        onChange={(e) => setFilters({...filters, search: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Статус</label>
                    <select 
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white cursor-pointer"
                        value={filters.status}
                        onChange={(e) => setFilters({...filters, status: e.target.value})}
                    >
                        <option value="all">Всі зміни</option>
                        <option value="active">Активні</option>
                        <option value="completed">Завершені</option>
                        <option value="admin_action">Редаговані адміном</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">Локація</label>
                    <select 
                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white cursor-pointer"
                        value={filters.postId}
                        onChange={(e) => setFilters({...filters, postId: e.target.value})}
                    >
                        <option value="all">Всі пости</option>
                        {postsList.map(post => (
                            <option key={post.id} value={post.id}>{post.name}</option>
                        ))}
                    </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">З дати</label>
                        <input 
                            type="date" 
                            className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none dark:text-white"
                            value={filters.dateFrom}
                            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase">По дату</label>
                        <input 
                            type="date" 
                            className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm outline-none dark:text-white"
                            value={filters.dateTo}
                            onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                        />
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center justify-center">
             <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
             <p className="text-gray-400">Оновлення даних...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300 min-w-[1000px]">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-4 w-16">ID</th>
                  <th className="px-4 py-4 w-28">Дата</th>
                  <th className="px-4 py-4">Лайфгард / Пост</th>
                  <th className="px-4 py-4 w-32">Час</th>
                  <th className="px-4 py-4 text-center w-[160px]">Статус</th>
                  <th className="px-4 py-4 text-center w-32">
                      <div className="flex flex-col text-[9px] leading-tight">
                          <span>Поч / Кін / Звіт</span>
                      </div>
                  </th>
                  <th className="px-4 py-4 text-center w-24 sticky right-0 bg-gray-50 dark:bg-gray-700/90 shadow-sm z-10">Дії</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {shifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">#{shift.id}</td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {formatDate(shift.start_time)}
                    </td>
                    
                    {/* LIFEGUARD + POST (Max Width Logic) */}
                    <td className="px-4 py-3 w-full">
                       <div className="flex flex-col gap-1.5 max-w-[250px] lg:max-w-[400px]">
                           <div className="flex items-center gap-2">
                               <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">
                                   {shift.lifeguard?.full_name?.charAt(0)}
                               </div>
                               <span className="font-bold text-gray-900 dark:text-white truncate" title={shift.lifeguard?.full_name || ''}>
                                   {shift.lifeguard?.full_name || 'Невідомий'}
                               </span>
                               
                               {/* Lifeguard Level Badge */}
                               {(() => {
                                   const lvl = getLifeguardLevel(shift.lifeguard_assignment_type);
                                   return (
                                       <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold border ${lvl.color}`}>
                                           {lvl.label}
                                       </span>
                                   );
                               })()}
                           </div>
                           <div className="flex items-center gap-1.5 text-xs text-gray-500 pl-8">
                               <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                               <span className="truncate text-gray-600 dark:text-gray-400">
                                   {shift.location?.name || `Пост ${shift.post_id}`}
                               </span>
                           </div>
                       </div>
                    </td>

                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-gray-900 dark:text-gray-200 font-mono">
                                {formatTime(shift.start_time)} - {shift.end_time ? formatTime(shift.end_time) : '...'}
                            </span>
                            <span className="font-mono text-gray-400">
                                ({getDuration(shift)})
                            </span>
                        </div>
                    </td>

                    <td className="px-4 py-3 text-center flex justify-center">
                        <StatusBadge shift={shift} />
                    </td>

                    <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                            <MediaIcon 
                                active={!!shift.start_photo_path} 
                                type="start" 
                                link={getImageUrl(shift.start_photo_path)} 
                            />
                            <MediaIcon 
                                active={!!shift.photo_close_path} 
                                type="end" 
                                link={getImageUrl(shift.photo_close_path)} 
                            />
                            <MediaIcon 
                                active={shift.reports && shift.reports.length > 0} 
                                type="report"
                                link={shift.reports && shift.reports.length > 0 ? '#' : undefined}
                            />
                        </div>
                    </td>
                    
                    {/* Fixed Desktop Actions */}
                    <td className="px-4 py-3 text-center sticky right-0 bg-white dark:bg-gray-800 shadow-sm z-10">
                        <div className="flex justify-center gap-2">
                            <button 
                                onClick={() => navigate(`/admin/shift/${shift.id}`)}
                                className="p-2 text-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors" 
                                title="Переглянути / Редагувати"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                            
                            <button 
                                onClick={() => openDeleteModal(shift)}
                                className="p-2 text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors" 
                                title="Видалити"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </td>
                  </tr>
                ))}
                {shifts.length === 0 && (
                    <tr>
                        <td colSpan={7} className="px-6 py-12 text-center text-gray-400 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex flex-col items-center">
                                <svg className="w-12 h-12 mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                <span>Записів не знайдено</span>
                            </div>
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && totalCount > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                        Показано <span className="font-bold text-gray-800 dark:text-white">{((page - 1) * pageSize) + 1}</span> - <span className="font-bold text-gray-800 dark:text-white">{Math.min(page * pageSize, totalCount)}</span> з <span className="font-bold text-gray-800 dark:text-white">{totalCount}</span>
                    </span>
                    <select 
                        className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-brand-500"
                        value={pageSize}
                        onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    >
                        <option value={15}>15 / стор</option>
                        <option value={50}>50 / стор</option>
                        <option value={100}>100 / стор</option>
                    </select>
                </div>
                
                <div className="flex items-center gap-2">
                    <button 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${page === 1 ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:shadow-sm'}`}
                    >
                        ← Назад
                    </button>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 px-1">{page}</span>
                    <button 
                        onClick={() => setPage(p => p + 1)}
                        disabled={page * pageSize >= totalCount}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${page * pageSize >= totalCount ? 'bg-gray-100 text-gray-400 border-transparent cursor-not-allowed' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:shadow-sm'}`}
                    >
                        Вперед →
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && deleteModal.shift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all scale-100">
                <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 dark:bg-red-900/30 rounded-full mb-4">
                        <svg className="w-6 h-6 text-red-600 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-center text-gray-900 dark:text-white mb-2">Видалити зміну?</h3>
                    <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-6">
                        Ця дія незворотна. Буде видалено всі дані про зміну, включаючи фото та звіти.
                    </p>
                    
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700 text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-gray-500">ID зміни:</span>
                            <span className="font-mono font-bold">#{deleteModal.shift.id}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Лайфгард:</span>
                            <span className="font-medium text-gray-900 dark:text-white">{deleteModal.shift.lifeguard?.full_name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">Час початку:</span>
                            <span className="text-gray-900 dark:text-white">
                                {formatDate(deleteModal.shift.start_time)}, {formatTime(deleteModal.shift.start_time)}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setDeleteModal({ isOpen: false, shift: null })}
                            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                        >
                            Скасувати
                        </button>
                        <button 
                            onClick={confirmDelete}
                            className="flex-1 px-4 py-2 bg-red-600 text-white font-medium rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200 dark:shadow-none"
                        >
                            Видалити
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};