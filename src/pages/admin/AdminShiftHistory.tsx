import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { Icons } from '../../components/Icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDateLocal, formatTimeLocal } from '../../utils/date';

// --- TYPES ---
interface Shift {
  id: number;
  post_id: number;
  user_id: number;
  start_time: string;
  end_time: string | null;
  status: 'active' | 'closed';
  points: number | null;
  lifeguard_assignment_type: number | null;
  start_photo_path: string | null;
  start_photo_approved_at: string | null;
  end_photo_path: string | null;
  manual_opened_by: number | null;
  manual_closed_by: number | null;
  users: { full_name: string, avatar_url?: string } | null;
  posts: { name: string } | null;
  admin_opener: { full_name: string } | null;
  admin_closer: { full_name: string } | null;
  shift_reports: { id: number }[];
}

interface PointRule {
  id_balls: number;
  name_balls: string;
  quantity: number;
  comment_balls: string | null;
}

interface FilterUser {
  id: number;
  full_name: string;
}

interface FilterPost {
  id: number;
  name: string | null;
}

// --- HELPERS ---
const formatDate = (dateStr: string) => formatDateLocal(new Date(dateStr));
const formatTime = (dateStr: string) => formatTimeLocal(new Date(dateStr));

const getDuration = (start: string, end: string | null) => {
  if (start && end) {
    const diff = (new Date(end).getTime() - new Date(start).getTime()) / 3600000;
    return `${diff.toFixed(1)} год`;
  }
  return '...';
};

const getImageUrl = (path: string | null) => {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from('shift_photos').getPublicUrl(path);
  return data.publicUrl;
};

// --- SUB-COMPONENTS ---
const StatusBadge = ({ shift }: { shift: Shift }) => {
  const isActive = shift.status === 'active';
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
      <div className="flex items-center justify-center">
        {isManualOpen && (
          <div title={`Відкрито вручну: ${shift.admin_opener?.full_name}`} className="cursor-help">
            <svg className={iconClass} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        )}
      </div>
      <div className="text-center truncate px-1">
        {isActive ? 'Активна' : 'Завершена'}
      </div>
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

const LifeguardStatusBadge = ({ type }: { type: number | null }) => {
  if (type === null || type === undefined) return null;
  let colorClass = "bg-gray-100 text-gray-500 border-gray-200";
  if (type === 0) colorClass = "bg-blue-50 text-blue-600 border-blue-200";
  if (type === 1) colorClass = "bg-purple-50 text-purple-600 border-purple-200";
  if (type === 2) colorClass = "bg-amber-50 text-amber-600 border-amber-200";
  return (
    <span className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded border ${colorClass}`} title={`Рівень ${type}`}>
      L{type}
    </span>
  );
};

const MediaIcon = ({ active, type, link, onPreview, onClick }: { active: boolean, type: 'start' | 'end' | 'report', link?: string, onPreview?: (link: string) => void, onClick?: () => void }) => {
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

  if (active) {
    return (
      <button
        onClick={() => {
          if (onClick) onClick();
          else if (type !== 'report' && onPreview && link) onPreview(link);
        }}
        className={`${baseClasses} ${activeClasses}`}
      >
        {icon}
      </button>
    );
  }
  return <div className={`${baseClasses} ${inactiveClasses}`}>{icon}</div>;
};



export const AdminShiftHistory = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  // Data State
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [rules, setRules] = useState<PointRule[]>([]);
  const [allPosts, setAllPosts] = useState<FilterPost[]>([]);
  const [allUsers, setAllUsers] = useState<FilterUser[]>([]); // For search
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(15);
  const [totalCount, setTotalCount] = useState(0);
  const [pageInput, setPageInput] = useState('1');

  // --- FILTERS ---
  const [filterId, setFilterId] = useState('');
  const [filterYear, setFilterYear] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('');
  const [filterDay, setFilterDay] = useState<string>('');
  const [filterPost, setFilterPost] = useState<string>('all');
  const [filterUserSearch, setFilterUserSearch] = useState('');
  const [filterUserId, setFilterUserId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // UI States
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Points Modal State
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [isSavingPoints, setIsSavingPoints] = useState(false);
  const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
  const [selectedRuleIds, setSelectedRuleIds] = useState<number[]>([]);
  const [calculatedTotal, setCalculatedTotal] = useState<number>(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // --- EFFECTS ---

  useEffect(() => {
    let mounted = true;

    // Initial Load of Metadata
    const fetchMetadata = async () => {
      const [postsRes, rulesRes, usersRes] = await Promise.all([
        supabase.from('posts').select('id, name').order('name'),
        supabase.from('points').select('*').order('id_balls'),
        supabase.from('users').select('id, full_name').order('full_name') // Fetching all users for search
      ]);

      if (!mounted) return;

      if (postsRes.data) setAllPosts(postsRes.data);
      if (rulesRes.error) console.error('Error loading points:', rulesRes.error);
      if (rulesRes.data) {
        // Ensure numbers are actually numbers (handle potential string returns from DB)
        const typedRules = rulesRes.data.map((r: any) => ({
          ...r,
          id_balls: Number(r.id_balls),
          quantity: Number(r.quantity)
        }));
        setRules(typedRules);
      }
      if (usersRes.data) {
        setAllUsers(usersRes.data.map(u => ({ id: u.id, full_name: u.full_name || 'Без імені' })));
      }
    };

    fetchMetadata();

    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    // Debounce basic filters or just fetch
    const timeout = setTimeout(() => {
      fetchShifts();
    }, 300);
    return () => clearTimeout(timeout);
  }, [
    page, pageSize,
    filterId,
    filterYear, filterMonth, filterDay,
    filterPost, filterUserId, filterStatus
  ]);

  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
    const safePage = Math.min(page + 1, totalPages);
    setPageInput(String(safePage));
  }, [page, pageSize, totalCount]);

  useEffect(() => {
    const total = selectedRuleIds.reduce((sum, id) => {
      const rule = rules.find(r => r.id_balls === id);
      return sum + (rule ? rule.quantity : 0);
    }, 0);
    setCalculatedTotal(total);
  }, [selectedRuleIds, rules]);

  const fetchShifts = async () => {
    setLoading(true);

    let query = supabase
      .from('shifts')
      .select(`
        *,
        users:user_id (full_name),
        posts:post_id (name),
        admin_opener:manual_opened_by (full_name),
        admin_closer:manual_closed_by (full_name),
        shift_reports (id)
      `, { count: 'exact' });

    // 1. ID Filter
    if (filterId) {
      query = query.eq('id', Number(filterId));
    }

    // 2. Post Filter
    if (filterPost !== 'all') {
      query = query.eq('post_id', Number(filterPost));
    }

    // 3. User Filter
    if (filterUserId) {
      query = query.eq('user_id', Number(filterUserId));
    }

    // 4. Status Filters
    if (filterStatus === 'active') query = query.eq('status', 'active');
    if (filterStatus === 'closed') query = query.eq('status', 'closed');
    if (filterStatus === 'manual') query = query.not('manual_opened_by', 'is', null);
    if (filterStatus === 'photo_review') {
      // Has photo but not approved
      query = query.not('start_photo_path', 'is', null).is('start_photo_approved_at', null);
    }

    // 5. Date Filters
    if (filterYear || filterMonth || filterDay) {
      const y = filterYear ? parseInt(filterYear) : new Date().getFullYear();

      let startStr = `${y}-01-01T00:00:00`;
      let endStr = `${y}-12-31T23:59:59`;

      if (filterMonth) {
        // Month is 1-indexed in UI, but dates need 01 format or similar
        const m = parseInt(filterMonth);
        const lastDay = new Date(y, m, 0).getDate(); // Get last day of month
        const mStr = m.toString().padStart(2, '0');
        startStr = `${y}-${mStr}-01T00:00:00`;
        endStr = `${y}-${mStr}-${lastDay}T23:59:59`;
      }

      if (filterDay) {
        const m = filterMonth ? parseInt(filterMonth) : 1; // Default to Jan if no month selected but day is? Edge case.
        const d = parseInt(filterDay);
        const mStr = m.toString().padStart(2, '0');
        const dStr = d.toString().padStart(2, '0');
        startStr = `${y}-${mStr}-${dStr}T00:00:00`;
        endStr = `${y}-${mStr}-${dStr}T23:59:59`;
      }

      query = query.gte('start_time', startStr).lte('start_time', endStr);
    }

    // Pagination
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const { data, error, count } = await query
      .order('start_time', { ascending: false })
      .range(from, to);

    if (!error && data) {
      // @ts-ignore
      setShifts(data);
      if (count !== null) setTotalCount(count);
    }
    setLoading(false);
  };

  // --- HANDLERS ---
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

  const handleClearFilters = () => {
    setFilterId('');
    setFilterYear('');
    setFilterMonth('');
    setFilterDay('');
    setFilterPost('all');
    setFilterUserId(null);
    setFilterUserSearch('');
    setFilterStatus('all');
    setPage(0);
  };

  const filteredUsers = allUsers.filter(u =>
    u.full_name.toLowerCase().includes(filterUserSearch.toLowerCase())
  );

  // Points Handlers
  const handleOpenPointsModal = async (shift: Shift) => {
    setSelectedShift(shift);
    setIsPointsModalOpen(true);
    setSelectedRuleIds([]);
    setCalculatedTotal(0);

    // Fetch existing points 
    const { data, error } = await supabase.from('lifeguard_shift_points').select('rule_id').eq('shift_id', shift.id);

    if (error) {
      console.error("Error fetching existing points:", error);
      return;
    }

    if (data) {
      // Ensure we're working with numbers
      setSelectedRuleIds(data.map(r => Number(r.rule_id)));
    }
  };

  const handleToggleRule = (ruleId: number) => {
    setSelectedRuleIds(prev => {
      if (prev.includes(ruleId)) {
        return prev.filter(id => id !== ruleId);
      } else {
        return [...prev, ruleId];
      }
    });
  };

  const handleSavePoints = async () => {
    if (!selectedShift || !session?.user.id) return;
    setIsSavingPoints(true);
    try {
      // 1. Get Admin ID
      const { data: adminUser, error: userError } = await supabase.from('users').select('id').eq('auth_id', session.user.id).single();
      if (userError || !adminUser) throw new Error("Admin user not found in 'users' table");

      // 2. Update Total in Shifts
      const { error: shiftError } = await supabase.from('shifts').update({ points: calculatedTotal }).eq('id', selectedShift.id);
      if (shiftError) throw shiftError;

      // 3. Sync Details (Delete old -> Insert new)
      const { error: deleteError } = await supabase.from('lifeguard_shift_points').delete().eq('shift_id', selectedShift.id);
      if (deleteError) throw deleteError;

      if (selectedRuleIds.length > 0) {
        const records = selectedRuleIds.map(ruleId => {
          const rule = rules.find(r => r.id_balls === ruleId);
          return {
            shift_id: selectedShift.id,
            user_id: selectedShift.user_id,
            rule_id: ruleId,
            points_awarded: rule?.quantity || 0,
            base_points_from_rule: rule?.quantity || 0,
            coefficient_applied: 1.0,
            awarded_by_user_id: adminUser.id,
            award_datetime: new Date().toISOString(),
            comment: 'Admin Panel Update'
          };
        });

        const { error: insertError } = await supabase.from('lifeguard_shift_points').insert(records);
        if (insertError) throw insertError;
      }

      // 4. Update UI
      setShifts(prev => prev.map(s => s.id === selectedShift.id ? { ...s, points: calculatedTotal } : s));
      setIsPointsModalOpen(false);
      // Optional: Add a toast notification here if you have a toast library

    } catch (err: any) {
      console.error("Failed to save points:", err);
      alert('Помилка збереження: ' + (err.message || err.details || "Unknown error"));
    } finally {
      setIsSavingPoints(false);
    }
  };

  const handleDeleteShift = async (id: number) => {
    if (!window.confirm("Видалити зміну? Це незворотньо.")) return;
    const { error } = await supabase.from('shifts').delete().eq('id', id);
    if (!error) setShifts(prev => prev.filter(s => s.id !== id));
  };

  const dailyRuleIds = [1, 2, 4, 5];
  const dailyRules = rules.filter(r => dailyRuleIds.includes(r.id_balls));
  const bonusRules = rules.filter(r => r.quantity > 0 && !dailyRuleIds.includes(r.id_balls));
  const penaltyRules = rules.filter(r => r.quantity < 0);

  // Generate Year/Month/Day Options
  const yearOptions = [2024, 2025, 2026];
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({ val: i + 1, label: new Date(2000, i, 1).toLocaleString('uk-UA', { month: 'long' }) }));
  const daysOptions = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-6 animate-fade-in-up pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Керування Змінами</h1>
          <p className="text-sm text-gray-500 mt-1">Всі зміни, фільтрація та нарахування балів</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition shadow-lg font-medium text-sm">+ Відкрити зміну</button>
        </div>
      </div>

      {/* --- SUPER FILTER BAR --- */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-4">

        {/* Row 1: ID, Dates, Status */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* ID */}
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">ID Зміни</label>
            <input
              type="text"
              placeholder="#"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
              value={filterId}
              onChange={(e) => setFilterId(e.target.value)}
            />
          </div>

          {/* Date Group */}
          <div className="col-span-6 flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Рік</label>
              <select value={filterYear} onChange={e => setFilterYear(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Всі</option>
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Місяць</label>
              <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Всі</option>
                {monthOptions.map(m => <option key={m.val} value={m.val}>{m.label}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">День</label>
              <select value={filterDay} onChange={e => setFilterDay(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500">
                <option value="">Всі</option>
                {daysOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="col-span-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Статус</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500">
              <option value="all">Всі статуси</option>
              <option value="active">🟢 Активні</option>
              <option value="closed">⚪ Завершені</option>
              <option value="manual">🔧 Відкриті вручну</option>
              <option value="photo_review">📷 Очікують перевірки фото</option>
            </select>
          </div>
        </div>

        {/* Row 2: Post, Lifeguard Search, Clear */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Post */}
          <div className="col-span-4">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Пост</label>
            <select value={filterPost} onChange={e => setFilterPost(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-gray-50 dark:bg-gray-700 text-sm border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-brand-500">
              <option value="all">Всі пости</option>
              {allPosts.map(p => <option key={p.id} value={p.id}>{p.name || `Пост #${p.id}`}</option>)}
            </select>
          </div>

          {/* Lifeguard Search (Combobox Simulation) */}
          <div className="col-span-6 relative">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 block">Лайфгард</label>
            <div className="relative">
              <div
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-sm flex justify-between items-center cursor-pointer"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              >
                <span className={filterUserId ? 'text-gray-900 dark:text-gray-200 font-medium' : 'text-gray-400'}>
                  {filterUserId ? allUsers.find(u => u.id === filterUserId)?.full_name : 'Пошук лайфгарда...'}
                </span>
                <Icons.ArrowDown className={`w-4 h-4 text-gray-400 transition transform ${userDropdownOpen ? 'rotate-180' : ''}`} />
              </div>

              {userDropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-600 z-50 max-h-60 overflow-hidden flex flex-col">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Введіть ім'я..."
                    className="w-full p-3 border-b border-gray-100 dark:border-gray-700 text-sm outline-none bg-transparent"
                    value={filterUserSearch}
                    onChange={e => setFilterUserSearch(e.target.value)}
                  />
                  <div className="overflow-y-auto flex-1 p-1">
                    <div
                      className="p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-500 italic"
                      onClick={() => { setFilterUserId(null); setUserDropdownOpen(false); }}
                    >
                      Всі лайфгарди
                    </div>
                    {filteredUsers.length === 0 && <div className="p-3 text-center text-xs text-gray-400">Нікого не знайдено</div>}
                    {filteredUsers.map(u => (
                      <div
                        key={u.id}
                        className={`p-2 cursor-pointer hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg text-sm flex items-center gap-2 ${filterUserId === u.id ? 'bg-brand-50 text-brand-600' : 'text-gray-700 dark:text-gray-200'}`}
                        onClick={() => { setFilterUserId(u.id); setUserDropdownOpen(false); }}
                      >
                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">{u.full_name[0]}</div>
                        {u.full_name}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Backdrop for dropdown */}
            {userDropdownOpen && <div className="fixed inset-0 z-40" onClick={() => setUserDropdownOpen(false)}></div>}
          </div>

          {/* Clear Button */}
          <div className="col-span-2">
            <button
              onClick={handleClearFilters}
              className="w-full py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 text-sm font-medium transition"
            >
              Скинути
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
        {loading ? (
          <div className="p-20 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Завантаження...</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300 min-w-[1000px]">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-4 py-4 w-16">ID</th>
                    <th className="px-4 py-4 w-28">Дата</th>
                    <th className="px-4 py-4">Лайфгард / Пост</th>
                    <th className="px-4 py-4 w-32">Час</th>
                    <th className="px-4 py-4 text-center w-[160px]">Статус</th>
                    <th className="px-4 py-4 text-center w-24">Медіа</th>
                    <th className="px-4 py-4 text-center w-16">KPI</th>
                    <th className="px-4 py-4 text-center w-24 sticky right-0 bg-gray-50 dark:bg-gray-700/90 shadow-sm z-10">Дії</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {shifts.map((shift) => (
                    <tr key={shift.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">#{shift.id}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white whitespace-nowrap">{formatDate(shift.start_time)}</td>
                      <td className="px-4 py-3 w-full">
                        <div className="flex flex-col gap-1.5 max-w-[250px] lg:max-w-[400px]">
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold">{shift.users?.full_name?.charAt(0)}</div>
                            <span className="font-bold text-gray-900 dark:text-white truncate" title={shift.users?.full_name || ''}>{shift.users?.full_name || 'Невідомий'}</span>
                            <LifeguardStatusBadge type={shift.lifeguard_assignment_type} />
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-gray-500 pl-8">
                            <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                            <span className="truncate text-gray-600 dark:text-gray-400">{shift.posts?.name || `Пост ${shift.post_id}`}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-gray-900 dark:text-gray-200 font-mono">{formatTime(shift.start_time)} - {shift.end_time ? formatTime(shift.end_time) : '...'}</span>
                          <span className="font-mono text-gray-400">({getDuration(shift.start_time, shift.end_time)})</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        <div className="flex items-center justify-center">
                          <StatusBadge shift={shift} />
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-center gap-2">
                        <MediaIcon active={!!shift.start_photo_path} type="start" link={getImageUrl(shift.start_photo_path)} onPreview={setPreviewImage} />
                        <MediaIcon active={!!shift.end_photo_path} type="end" link={getImageUrl(shift.end_photo_path)} onPreview={setPreviewImage} />
                        <MediaIcon
                          active={shift.shift_reports && shift.shift_reports.length > 0}
                          type="report"
                          onClick={() => {
                            if (shift.shift_reports && shift.shift_reports.length > 0) {
                              navigate(`/admin/reports/${shift.shift_reports[0].id}`, { state: { from: '/admin/shifts-history' } });
                            }
                          }}
                        />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center align-middle">
                        <button onClick={() => handleOpenPointsModal(shift)} className={`min-w-[40px] h-7 px-2 rounded-md font-mono font-bold text-xs transition-all border inline-flex items-center justify-center
                            ${(shift.points || 0) > 0 ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : ''}
                            ${(shift.points || 0) < 0 ? 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' : ''}
                            ${(shift.points || 0) === 0 ? 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100' : ''}
                        `}>{(shift.points || 0) > 0 ? `+${shift.points}` : (shift.points || 0)}</button>
                      </td>
                      <td className="px-4 py-3 text-center sticky right-0 bg-white dark:bg-gray-800 shadow-sm z-10 align-middle">
                        <div className="flex items-center justify-center gap-2">
                          <button className="h-7 w-7 flex items-center justify-center text-blue-500 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors" title="Деталі" onClick={() => navigate(`/admin/shift/${shift.id}`)}><Icons.ManageShifts /></button>
                          <button onClick={() => handleDeleteShift(shift.id)} className="h-7 w-7 flex items-center justify-center text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-lg transition-colors" title="Видалити"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-gray-700/20">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Показати:</span>
                <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 focus:ring-2 focus:ring-brand-500 outline-none">
                  <option value="15">15</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => handlePageChange(page - 1)} disabled={page === 0} className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">Назад</button>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Сторінка {page + 1} з {Math.ceil(totalCount / pageSize) || 1}</span>
                <button onClick={() => handlePageChange(page + 1)} disabled={(page + 1) * pageSize >= totalCount} className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium">Вперед</button>
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
          </>
        )}
      </div>

      {isPointsModalOpen && selectedShift && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md transition-opacity" onClick={() => !isSavingPoints && setIsPointsModalOpen(false)}></div>
          <div className="relative bg-white dark:bg-gray-800 w-full max-w-6xl rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700 flex flex-col h-[85vh]">
            <div className="bg-white dark:bg-gray-800 p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight">Оцінка Зміни</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300">#{selectedShift.id}</span>
                  <LifeguardStatusBadge type={selectedShift.lifeguard_assignment_type} />
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{selectedShift.users?.full_name}</span>
                </div>
              </div>
              <div className={`text-4xl font-black tracking-tighter ${calculatedTotal > 0 ? 'text-emerald-500' : calculatedTotal < 0 ? 'text-red-500' : 'text-gray-300'}`}>
                {calculatedTotal > 0 ? '+' : ''}{calculatedTotal}
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-full">
                {/* DAILY */}
                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-3xl p-5 border border-emerald-100 dark:border-emerald-800/30">
                  <h4 className="text-lg font-black text-emerald-800 dark:text-emerald-400 mb-6">Щоденні</h4>
                  <div className="space-y-3">
                    {dailyRules.map(rule => (
                      <label key={rule.id_balls} onClick={() => handleToggleRule(rule.id_balls)} className="flex items-start gap-3 cursor-pointer group select-none">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 flex-shrink-0 ${selectedRuleIds.includes(rule.id_balls) ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-emerald-200 dark:bg-gray-800 dark:border-emerald-800'}`}>
                          {selectedRuleIds.includes(rule.id_balls) && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between">
                            <span className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{rule.name_balls}</span>
                            <span className="text-sm font-black text-emerald-600 whitespace-nowrap ml-2">+{rule.quantity}</span>
                          </div>
                          {rule.comment_balls && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{rule.comment_balls}</p>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* BONUS */}
                <div className="bg-blue-50 dark:bg-blue-900/10 rounded-3xl p-5 border border-blue-100 dark:border-blue-800/30">
                  <h4 className="text-lg font-black text-blue-800 dark:text-blue-400 mb-6">Бонусні</h4>
                  <div className="space-y-3">
                    {bonusRules.map(rule => (
                      <label key={rule.id_balls} onClick={() => handleToggleRule(rule.id_balls)} className="flex items-start gap-3 cursor-pointer group select-none">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 flex-shrink-0 ${selectedRuleIds.includes(rule.id_balls) ? 'bg-blue-500 border-blue-500' : 'bg-white border-blue-200 dark:bg-gray-800 dark:border-blue-800'}`}>
                          {selectedRuleIds.includes(rule.id_balls) && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between">
                            <span className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-snug group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{rule.name_balls}</span>
                            <span className="text-sm font-black text-blue-600 whitespace-nowrap ml-2">+{rule.quantity}</span>
                          </div>
                          {rule.comment_balls && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{rule.comment_balls}</p>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* PENALTIES */}
                <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-5 border border-red-100 dark:border-red-800/30">
                  <h4 className="text-lg font-black text-red-800 dark:text-red-400 mb-6">Штрафи</h4>
                  <div className="space-y-3">
                    {penaltyRules.map(rule => (
                      <label key={rule.id_balls} onClick={() => handleToggleRule(rule.id_balls)} className="flex items-start gap-3 cursor-pointer group select-none">
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all mt-0.5 flex-shrink-0 ${selectedRuleIds.includes(rule.id_balls) ? 'bg-red-500 border-red-500' : 'bg-white border-red-200 dark:bg-gray-800 dark:border-red-800'}`}>
                          {selectedRuleIds.includes(rule.id_balls) && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline justify-between">
                            <span className="font-bold text-gray-800 dark:text-gray-200 text-sm leading-snug group-hover:text-red-700 dark:group-hover:text-red-400 transition-colors">{rule.name_balls}</span>
                            <span className="text-sm font-black text-red-500 whitespace-nowrap ml-2">{rule.quantity}</span>
                          </div>
                          {rule.comment_balls && <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{rule.comment_balls}</p>}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex gap-3 shrink-0">
              <button onClick={() => setIsPointsModalOpen(false)} className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition">Скасувати</button>
              <button onClick={handleSavePoints} className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl shadow-xl hover:shadow-2xl hover:scale-[1.01] transition transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2" disabled={isSavingPoints}>{isSavingPoints ? 'Збереження...' : 'Зберегти оцінку'}</button>
            </div>
          </div>
        </div>
      )}

      {previewImage && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-[90vh] rounded-lg shadow-2xl animate-in zoom-in-90 duration-300" />
          <button className="absolute top-6 right-6 text-white/50 hover:text-white transition"><svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
        </div>
      )}
    </div>
  );
};
