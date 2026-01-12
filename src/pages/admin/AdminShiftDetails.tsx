import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase';

// --- Configuration ---
// URL вашого хостингу (для завантаження та відображення фото)
// Якщо розробляєте локально, вкажіть реальний домен хостингу, куди будете лити файли
const SITE_URL = 'https://app.lifeguard.kyiv.ua'; 
const UPLOAD_API_URL = `${SITE_URL}/upload_api.php`;

// --- Types ---
type ShiftDetail = {
  id: number;
  user_id: number;
  post_id: number;
  start_time: string;
  end_time: string | null;
  status: string;
  activity_type: string;
  rounded_work_hours: number | null;
  start_photo_path: string | null;
  photo_close_path: string | null;
  manual_close_comment: string | null;
  manual_closed_by: number | null;
  created_at: string;
  
  // Relations
  lifeguard: { full_name: string; email: string } | null;
  location: { name: string } | null;
  admin_closer: { full_name: string } | null;
};

type ShiftReport = {
  id: number;
  shift_id: number;
  report_submitted_at: string;
  reporter_user_id: number;
  suspicious_swimmers_count: number | null;
  visitor_inquiries_count: number | null;
  bridge_jumpers_count: number | null;
  alcohol_water_prevented_count: number | null;
  alcohol_drinking_prevented_count: number | null;
  watercraft_stopped_count: number | null;
  preventive_actions_count: number | null;
  educational_activities_count: number | null;
  people_on_beach_estimated: number | null;
  people_in_water_estimated: number | null;
  general_notes: string | null;
  reporter: { full_name: string; email: string } | null;
};

// --- Helper Functions ---
const formatDateTimeForInput = (isoString: string | null) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  const localISOTime = (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
  return localISOTime;
};

const formatDisplayDate = (isoString: string | null) => {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('uk-UA', { 
    day: '2-digit', month: 'long', year: 'numeric', 
    hour: '2-digit', minute: '2-digit' 
  });
};

// Функція для побудови повного URL картинки
const getImageUrl = (path: string | null) => {
  if (!path) return null;
  // Якщо шлях вже повний (починається з http) - залишаємо, інакше додаємо домен
  if (path.startsWith('http')) return path;
  return `${SITE_URL}/${path}`;
};

export const AdminShiftDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [shift, setShift] = useState<ShiftDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [report, setReport] = useState<ShiftReport | null>(null);
  
  // Refs для прихованих інпутів файлів
  const startPhotoInputRef = useRef<HTMLInputElement>(null);
  const endPhotoInputRef = useRef<HTMLInputElement>(null);

  const [editMode, setEditMode] = useState<{ [key: string]: boolean }>({
    timeline: false,
    general: false,
    admin: false,
    report: false
  });

  const [formData, setFormData] = useState<Partial<ShiftDetail>>({});
  const [reportFormData, setReportFormData] = useState<Partial<ShiftReport>>({});

  useEffect(() => {
    fetchShift();
  }, [id]);

  const fetchShift = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          lifeguard:users!fk_shifts_users (full_name, email),
          location:posts!fk_shifts_posts (name),
          admin_closer:users!fk_shifts_manual_closed_by (full_name)
        `)
        .eq('id', Number(id))
        .single();

      if (error) throw error;
      setShift(data as any);
      setFormData(data as any);

      const { data: reportData, error: reportError } = await supabase
        .from('shift_reports')
        .select(`
          *,
          reporter:users!fk_reports_user (full_name, email)
        `)
        .eq('shift_id', Number(id))
        .maybeSingle();

      if (reportError) throw reportError;
      setReport(reportData as ShiftReport | null);
      setReportFormData(reportData as ShiftReport | {});
    } catch (err) {
      console.error(err);
      alert('Не вдалося завантажити зміну');
      navigate('/admin/schedule');
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = (block: string) => {
    setEditMode(prev => ({ ...prev, [block]: !prev[block] }));
    if (editMode[block]) {
      setFormData(shift || {});
      setReportFormData(report || {});
    }
  };

  const handleSave = async (block: string) => {
    try {
      setSaving(true);
      if (!id) return;

      const updates: any = {};
      
      if (block === 'timeline') {
        updates.end_time = formData.end_time ? new Date(formData.end_time).toISOString() : null;
        updates.rounded_work_hours = formData.rounded_work_hours;
      }
      
      if (block === 'admin') {
        updates.manual_close_comment = formData.manual_close_comment;
        updates.status = formData.status;
      }

      if (block === 'report' && report) {
        const reportUpdates = {
          suspicious_swimmers_count: reportFormData.suspicious_swimmers_count ?? null,
          visitor_inquiries_count: reportFormData.visitor_inquiries_count ?? null,
          bridge_jumpers_count: reportFormData.bridge_jumpers_count ?? null,
          alcohol_water_prevented_count: reportFormData.alcohol_water_prevented_count ?? null,
          alcohol_drinking_prevented_count: reportFormData.alcohol_drinking_prevented_count ?? null,
          watercraft_stopped_count: reportFormData.watercraft_stopped_count ?? null,
          preventive_actions_count: reportFormData.preventive_actions_count ?? null,
          educational_activities_count: reportFormData.educational_activities_count ?? null,
          people_on_beach_estimated: reportFormData.people_on_beach_estimated ?? null,
          people_in_water_estimated: reportFormData.people_in_water_estimated ?? null,
          general_notes: reportFormData.general_notes ?? null
        };

        const { error: reportError } = await supabase
          .from('shift_reports')
          .update(reportUpdates)
          .eq('id', report.id);

        if (reportError) throw reportError;
      }

      if (Object.keys(updates).length > 0) {
        const { error } = await supabase.from('shifts').update(updates).eq('id', Number(id));
        if (error) throw error;
      }

      await fetchShift();
      setEditMode(prev => ({ ...prev, [block]: false }));
      
    } catch (err: any) {
      alert('Помилка збереження: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof ShiftDetail, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleReportChange = (field: keyof ShiftReport, value: any) => {
    setReportFormData(prev => ({ ...prev, [field]: value }));
  };

  const parseNumberOrNull = (value: string) => {
    if (value === '') return null;
    const numericValue = Number(value);
    return Number.isNaN(numericValue) ? null : numericValue;
  };

  // --- ЛОГІКА ЗАВАНТАЖЕННЯ ФОТО (PHP BRIDGE) ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'start' | 'end') => {
    const file = event.target.files?.[0];
    if (!file || !id) return;

    try {
        setUploading(true);

        // 1. Відправляємо файл на PHP скрипт
        const uploadData = new FormData();
        uploadData.append('file', file);

        const response = await fetch(UPLOAD_API_URL, {
            method: 'POST',
            body: uploadData,
        });

        const result = await response.json();

        if (!result.success || !result.path) {
            throw new Error(result.error || 'Помилка завантаження на сервер');
        }

        // 2. Оновлюємо запис в Supabase (зберігаємо шлях)
        const updateField = type === 'start' ? 'start_photo_path' : 'photo_close_path';
        
        const { error } = await supabase
            .from('shifts')
            .update({ [updateField]: result.path })
            .eq('id', Number(id));

        if (error) throw error;

        // 3. Оновлюємо локальний стан
        await fetchShift();
        alert('Фото успішно завантажено!');

    } catch (err: any) {
        console.error(err);
        alert('Помилка: ' + err.message);
    } finally {
        setUploading(false);
        // Скидаємо інпут, щоб можна було вибрати той самий файл знову
        event.target.value = ''; 
    }
  };

  if (loading || !shift) return <div className="p-10 text-center">Завантаження...</div>;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in-up">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors dark:hover:bg-gray-800 dark:text-white">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Зміна #{shift.id}</h1>
          <p className="text-sm text-gray-500">{formatDisplayDate(shift.start_time)}</p>
        </div>
        <div className="ml-auto">
            <span className={`px-3 py-1 rounded-full text-sm font-bold border ${!shift.end_time ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                {shift.end_time ? 'Завершена' : 'Активна'}
            </span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* BLOCK 1: General Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            👤 Основна інформація
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold">Лайфгард</label>
              <div className="text-gray-900 dark:text-white font-medium text-lg">
                {shift.lifeguard?.full_name || `ID: ${shift.user_id}`}
              </div>
              <div className="text-sm text-gray-500">{shift.lifeguard?.email}</div>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <label className="text-xs text-gray-400 uppercase font-bold">Локація (Пост)</label>
              <div className="text-gray-900 dark:text-white font-medium text-lg">
                {shift.location?.name || `ID: ${shift.post_id}`}
              </div>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <label className="text-xs text-gray-400 uppercase font-bold">Тип активності</label>
              <div className="text-gray-900 dark:text-white capitalize">
                {shift.activity_type || 'shift'}
              </div>
            </div>
          </div>
        </div>

        {/* BLOCK 2: Timeline */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              ⏱ Таймлайн
            </h3>
            <button 
              onClick={() => editMode.timeline ? handleSave('timeline') : toggleEdit('timeline')}
              className={`text-sm px-3 py-1 rounded-lg transition-colors font-medium ${editMode.timeline ? 'bg-green-600 text-white hover:bg-green-700' : 'text-brand-600 hover:bg-brand-50'}`}
            >
              {editMode.timeline ? (saving ? '...' : 'Зберегти') : 'Редагувати'}
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 uppercase font-bold">Початок</label>
              <div className="text-gray-900 dark:text-white text-lg font-mono">
                {formatDisplayDate(shift.start_time)}
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-400 uppercase font-bold">Завершення</label>
              {editMode.timeline ? (
                <input 
                  type="datetime-local" 
                  value={formatDateTimeForInput(formData.end_time || '')}
                  onChange={(e) => handleChange('end_time', e.target.value)}
                  className="w-full mt-1 p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
              ) : (
                <div className="text-gray-900 dark:text-white text-lg font-mono">
                  {shift.end_time ? formatDisplayDate(shift.end_time) : <span className="text-green-500 font-bold">Триває...</span>}
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <label className="text-xs text-gray-400 uppercase font-bold">Оплачувані години</label>
              {editMode.timeline ? (
                <div className="flex items-center gap-2 mt-1">
                    <input 
                    type="number" 
                    step="0.5"
                    value={formData.rounded_work_hours || ''}
                    onChange={(e) => handleChange('rounded_work_hours', parseFloat(e.target.value))}
                    className="w-24 p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600 font-mono"
                    />
                    <span className="text-gray-500 text-sm">год.</span>
                </div>
              ) : (
                <div className="text-gray-900 dark:text-white text-2xl font-bold font-mono">
                  {shift.rounded_work_hours || 0} <span className="text-sm font-normal text-gray-500">год.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* BLOCK 3: Report Details */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              🧾 Звіт зміни
            </h3>
            {report && (
              <button 
                onClick={() => editMode.report ? handleSave('report') : toggleEdit('report')}
                className={`text-sm px-3 py-1 rounded-lg transition-colors font-medium ${editMode.report ? 'bg-green-600 text-white hover:bg-green-700' : 'text-brand-600 hover:bg-brand-50'}`}
              >
                {editMode.report ? (saving ? '...' : 'Зберегти') : 'Редагувати'}
              </button>
            )}
          </div>

          {!report && (
            <div className="text-sm text-gray-500 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-4">
              Звіт по зміні ще не подано.
            </div>
          )}

          {report && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">ФІО</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {shift.lifeguard?.full_name || `ID: ${shift.user_id}`}
                  </p>
                  <p className="text-xs text-gray-500">{shift.lifeguard?.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">Дата</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {formatDisplayDate(report.report_submitted_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 uppercase font-bold">Адреса поста</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {shift.location?.name || `ID: ${shift.post_id}`}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase mb-3">Показники зміни</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { key: 'people_on_beach_estimated', label: 'Людей на пляжі (оцінка)' },
                    { key: 'people_in_water_estimated', label: 'Людей у воді (оцінка)' },
                    { key: 'suspicious_swimmers_count', label: 'Підозрілих плавців' },
                    { key: 'visitor_inquiries_count', label: 'Звернень відвідувачів' },
                    { key: 'bridge_jumpers_count', label: 'Стрибків з мостів' },
                    { key: 'alcohol_water_prevented_count', label: 'Алкоголь у воді (попереджено)' },
                    { key: 'alcohol_drinking_prevented_count', label: 'Алкоголь на березі (попереджено)' },
                    { key: 'watercraft_stopped_count', label: 'Зупинених плавзасобів' },
                    { key: 'preventive_actions_count', label: 'Профілактичних дій' },
                    { key: 'educational_activities_count', label: 'Просвітницьких активностей' }
                  ].map(({ key, label }) => (
                    <div key={key} className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3">
                      <label className="text-xs text-gray-400 uppercase font-bold">{label}</label>
                      {editMode.report ? (
                        <input
                          type="number"
                          min={0}
                          value={(reportFormData as any)[key] ?? ''}
                          onChange={(e) => handleReportChange(key as keyof ShiftReport, parseNumberOrNull(e.target.value))}
                          className="w-full mt-2 p-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        />
                      ) : (
                        <div className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                          {(report as any)[key] ?? 0}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 uppercase font-bold">Загальні нотатки</label>
                {editMode.report ? (
                  <textarea
                    className="w-full mt-2 border rounded-lg p-3 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    rows={4}
                    value={reportFormData.general_notes || ''}
                    onChange={(e) => handleReportChange('general_notes', e.target.value)}
                    placeholder="Додаткові коментарі..."
                  />
                ) : (
                  <p className="text-gray-700 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800 mt-2">
                    {report.general_notes || 'Нотатки відсутні'}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* BLOCK 3: Media (Photos + Upload) */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white">📸 Фотозвіти</h3>
             {uploading && <span className="text-sm text-blue-500 animate-pulse">Завантаження...</span>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Start Photo Section */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-500">Фото початку зміни</p>
                    <button 
                        onClick={() => startPhotoInputRef.current?.click()}
                        disabled={uploading}
                        className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-600 px-2 py-1 rounded transition-colors"
                    >
                        {shift.start_photo_path ? 'Змінити' : 'Завантажити'}
                    </button>
                    <input 
                        type="file" 
                        ref={startPhotoInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'start')}
                    />
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-dashed border-gray-300 dark:border-gray-700 text-center min-h-[200px] flex items-center justify-center">
                    {shift.start_photo_path ? (
                        <a href={getImageUrl(shift.start_photo_path) || '#'} target="_blank" rel="noreferrer">
                            <img 
                                src={getImageUrl(shift.start_photo_path) || ''} 
                                alt="Start" 
                                className="max-h-64 mx-auto rounded-lg shadow-sm hover:scale-105 transition-transform cursor-zoom-in"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Error+Loading'; }}
                            />
                        </a>
                    ) : (
                        <div className="text-gray-400 flex flex-col items-center">
                            <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span>Немає фото</span>
                        </div>
                    )}
                </div>
            </div>

            {/* End Photo Section */}
            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-500">Фото завершення зміни</p>
                    <button 
                        onClick={() => endPhotoInputRef.current?.click()}
                        disabled={uploading}
                        className="text-xs bg-brand-50 hover:bg-brand-100 text-brand-600 px-2 py-1 rounded transition-colors"
                    >
                        {shift.photo_close_path ? 'Змінити' : 'Завантажити'}
                    </button>
                    <input 
                        type="file" 
                        ref={endPhotoInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={(e) => handleFileUpload(e, 'end')}
                    />
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-dashed border-gray-300 dark:border-gray-700 text-center min-h-[200px] flex items-center justify-center">
                    {shift.photo_close_path ? (
                        <a href={getImageUrl(shift.photo_close_path) || '#'} target="_blank" rel="noreferrer">
                            <img 
                                src={getImageUrl(shift.photo_close_path) || ''} 
                                alt="End" 
                                className="max-h-64 mx-auto rounded-lg shadow-sm hover:scale-105 transition-transform cursor-zoom-in"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x300?text=Error+Loading'; }}
                            />
                        </a>
                    ) : (
                        <div className="text-gray-400 flex flex-col items-center">
                            <svg className="w-10 h-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span>Немає фото</span>
                        </div>
                    )}
                </div>
            </div>

          </div>
        </div>

        {/* BLOCK 4: Admin Control */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 md:col-span-2">
           <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              🛡 Адмін-контроль
            </h3>
            <button 
              onClick={() => editMode.admin ? handleSave('admin') : toggleEdit('admin')}
              className={`text-sm px-3 py-1 rounded-lg transition-colors font-medium ${editMode.admin ? 'bg-green-600 text-white hover:bg-green-700' : 'text-brand-600 hover:bg-brand-50'}`}
            >
              {editMode.admin ? (saving ? '...' : 'Зберегти') : 'Редагувати'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div>
                <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Коментар при закритті</label>
                {editMode.admin ? (
                    <textarea 
                        className="w-full border rounded-lg p-2 text-sm dark:bg-gray-700 dark:text-white dark:border-gray-600"
                        rows={3}
                        value={formData.manual_close_comment || ''}
                        onChange={(e) => handleChange('manual_close_comment', e.target.value)}
                        placeholder="Причина ручного закриття..."
                    />
                ) : (
                    <p className="text-gray-700 dark:text-gray-300 italic bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                        {shift.manual_close_comment || 'Коментар відсутній'}
                    </p>
                )}
             </div>

             <div className="space-y-4">
                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Ким закрито (Admin ID)</label>
                    <div className="flex items-center gap-2">
                        {shift.admin_closer ? (
                            <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold">
                                {shift.admin_closer.full_name}
                            </span>
                        ) : (
                            <span className="text-gray-400 text-sm">-</span>
                        )}
                    </div>
                </div>
                
                <div>
                    <label className="text-xs text-gray-400 uppercase font-bold block mb-1">Статус в БД</label>
                    {editMode.admin ? (
                        <select 
                            value={formData.status || ''}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="w-full border rounded-lg p-2 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="open">Open (Активна)</option>
                            <option value="closed">Closed (Завершена)</option>
                            <option value="completed">Completed (Архівована)</option>
                        </select>
                    ) : (
                        <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-xs">
                            {shift.status}
                        </code>
                    )}
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};
