import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabase';
import { Icons } from '../../components/Icons';
import { translateIncidentField, getIncidentStyle } from '../../utils/incidentTranslator';

// --- Типи даних ---

interface ReportDetails {
    id: number;
    shift_id: number;
    report_submitted_at: string;
    reporter_user_id: number;
    suspicious_swimmers_count: number;
    visitor_inquiries_count: number;
    bridge_jumpers_count: number;
    alcohol_water_prevented_count: number;
    alcohol_drinking_prevented_count: number;
    watercraft_stopped_count: number;
    preventive_actions_count: number;
    educational_activities_count: number;
    people_on_beach_estimated: number;
    people_in_water_estimated: number;
    general_notes: string;
    shifts: {
        start_time: string;
        posts: { name: string } | null;
    } | null;
    users: {
        full_name: string;
    } | null;
}

interface Incident {
    id: number;
    incident_type: string | null; // 'police_call', 'medical_aid', etc.
    incident_time: string | null;
    incident_description: string | null;

    // Деталі суб'єкта
    subject_name: string | null;
    subject_age: number | null;
    subject_gender: string | null;
    subject_phone: string | null;

    // JSON поля (можуть бути рядком з JSON або простим рядком)
    cause_details: string | null;
    actions_taken: string | null;
    outcome_details: string | null;
    responding_unit_details: string | null;

    // Свідки
    witness1_name: string | null;
    witness1_phone: string | null;
    witness2_name: string | null;
    witness2_phone: string | null;

    involved_lifeguard_id: number | null;
}

// --- Допоміжні функції ---



// --- Компоненти ---

export const AdminReportDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();

    const [report, setReport] = useState<ReportDetails | null>(null);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (id) fetchReportDetails(id);
    }, [id]);

    const fetchReportDetails = async (reportId: string) => {
        try {
            setLoading(true);

            const { data: reportData, error: reportError } = await supabase
                .from('shift_reports')
                .select(`*, shifts (start_time, posts (name)), users (full_name)`)
                .eq('id', Number(reportId))
                .single();

            if (reportError) throw reportError;

            const { data: incidentsData, error: incidentsError } = await supabase
                .from('report_incidents')
                .select('*')
                .eq('shift_report_id', Number(reportId));

            if (incidentsError) throw incidentsError;

            setReport(reportData as unknown as ReportDetails);
            setIncidents(incidentsData || []);

        } catch (error) {
            console.error('Error fetching details:', error);
            alert('Помилка завантаження звіту');
            navigate('/admin/reports');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!report) return;
        const { name, value } = e.target;
        setReport({ ...report, [name]: value });
    };

    const handleSave = async () => {
        if (!report) return;
        try {
            setSaving(true);
            const { error } = await supabase
                .from('shift_reports')
                .update({
                    suspicious_swimmers_count: Number(report.suspicious_swimmers_count),
                    visitor_inquiries_count: Number(report.visitor_inquiries_count),
                    bridge_jumpers_count: Number(report.bridge_jumpers_count),
                    alcohol_water_prevented_count: Number(report.alcohol_water_prevented_count),
                    alcohol_drinking_prevented_count: Number(report.alcohol_drinking_prevented_count),
                    watercraft_stopped_count: Number(report.watercraft_stopped_count),
                    preventive_actions_count: Number(report.preventive_actions_count),
                    educational_activities_count: Number(report.educational_activities_count),
                    people_on_beach_estimated: Number(report.people_on_beach_estimated),
                    people_in_water_estimated: Number(report.people_in_water_estimated),
                    general_notes: report.general_notes,
                })
                .eq('id', report.id);

            if (error) throw error;
            alert('Зміни успішно збережено!');
        } catch (error) {
            console.error('Error updating report:', error);
            alert('Не вдалося зберегти зміни.');
        } finally {
            setSaving(false);
        }
    };

    // Компонент відображення одного інциденту
    const IncidentCard = ({ incident }: { incident: Incident }) => {
        const typeLabel = translateIncidentField('types', incident.incident_type);
        const causesLabel = translateIncidentField('causes', incident.cause_details);
        const actionsLabel = translateIncidentField('actions', incident.actions_taken);
        const outcomeLabel = translateIncidentField('outcomes', incident.outcome_details);
        const style = getIncidentStyle(incident.incident_type);

        return (
            <div className={`p-4 rounded-xl border ${style.color} bg-opacity-40 mb-4 transition-all hover:shadow-md`}>
                {/* Header */}
                <div className="flex justify-between items-start mb-3 border-b border-black/5 dark:border-white/5 pb-2">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl" role="img" aria-label="icon">{style.icon}</span>
                        <div>
                            <h3 className="font-bold text-lg">{typeLabel}</h3>
                            <span className="text-xs font-mono text-gray-500 opacity-75">
                                {incident.incident_time?.slice(0, 5)} • ID: {incident.id}
                            </span>
                        </div>
                    </div>
                    {incident.responding_unit_details && (
                        <span className="text-xs bg-white/50 dark:bg-black/20 px-2 py-1 rounded border border-black/5 dark:border-white/5 shadow-sm max-w-[150px] truncate text-right">
                            {incident.responding_unit_details}
                        </span>
                    )}
                </div>

                {/* Body Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">

                    {/* Left: Subject & Description */}
                    <div className="space-y-3">
                        {/* Subject Info */}
                        {(incident.subject_name || incident.subject_age || incident.subject_gender) && (
                            <div className="bg-white/50 dark:bg-black/20 p-3 rounded-lg border border-black/5 dark:border-white/5">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Суб'єкт</p>
                                <div className="font-medium text-gray-800 dark:text-gray-200 text-base">
                                    {incident.subject_name || 'Невідомий'}
                                    {(incident.subject_age || incident.subject_gender) && (
                                        <span className="text-gray-500 font-normal ml-1">
                                            ({incident.subject_age || '?'} років, {incident.subject_gender || '-'})
                                        </span>
                                    )}
                                </div>
                                {incident.subject_phone && (
                                    <div className="text-gray-500 text-xs mt-1">📞 {incident.subject_phone}</div>
                                )}
                            </div>
                        )}

                        {/* Description */}
                        {incident.incident_description && (
                            <div className="p-2">
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Опис ситуації</p>
                                <p className="text-gray-700 dark:text-gray-300 italic">"{incident.incident_description}"</p>
                            </div>
                        )}
                    </div>

                    {/* Right: Technical Details */}
                    <div className="space-y-4">
                        {/* Causes */}
                        {causesLabel !== '—' && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Причини</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {causesLabel}
                                </p>
                            </div>
                        )}

                        {/* Actions */}
                        {actionsLabel !== '—' && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Дії рятувальників</p>
                                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                    {actionsLabel}
                                </div>
                            </div>
                        )}

                        {/* Outcome */}
                        {outcomeLabel !== '—' && (
                            <div>
                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Результат</p>
                                <p className="text-gray-700 dark:text-gray-300">{outcomeLabel}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Witnesses Footer */}
                {(incident.witness1_name || incident.witness2_name) && (
                    <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 text-xs text-gray-500">
                        <span className="font-semibold">Свідки: </span>
                        {[
                            incident.witness1_name && `${incident.witness1_name} (${incident.witness1_phone || '-'})`,
                            incident.witness2_name && `${incident.witness2_name} (${incident.witness2_phone || '-'})`
                        ].filter(Boolean).join(', ')}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Завантаження деталей...</div>;
    if (!report) return <div className="p-8 text-center text-red-500">Звіт не знайдено</div>;

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fade-in-up pb-10">

            {/* Top Header */}
            <div className="flex items-center justify-between sticky top-0 bg-gray-50 dark:bg-gray-900 z-10 py-4 border-b border-gray-200 dark:border-gray-800 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(location.state?.from || '/admin/reports')}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition text-gray-600 dark:text-gray-300"
                    >
                        ← Назад
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            Звіт #{report.id}
                            <span className="text-sm font-normal text-gray-500 bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded-md">
                                Shift ID: {report.shift_id}
                            </span>
                        </h1>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`px-6 py-2 rounded-lg font-medium text-white transition shadow-lg ${saving ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'}`}
                >
                    {saving ? 'Збереження...' : 'Зберегти зміни'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* LEFT COLUMN: STATISTICS (Editable) */}
                <div className="lg:col-span-1 space-y-6 h-fit">

                    {/* Reporter Info Card */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 rounded-full text-blue-600">
                                <Icons.Profile />
                            </div>
                            <div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Лайфгард</div>
                                <div className="font-bold text-gray-800 dark:text-white">{report.users?.full_name}</div>
                            </div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 border-t pt-3 border-gray-100 dark:border-gray-700">
                            <span>📅 {new Date(report.shifts?.start_time || '').toLocaleDateString()}</span>
                            <span>📍 {report.shifts?.posts?.name}</span>
                        </div>
                    </div>

                    {/* Editable Stats */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                        <h2 className="font-bold text-gray-800 dark:text-white border-b pb-2 border-gray-100 dark:border-gray-700">Показники зміни</h2>

                        <InputGroup label="Критичні плавці" name="suspicious_swimmers_count" value={report.suspicious_swimmers_count} onChange={handleInputChange} />
                        <InputGroup label="Превентивні дії" name="preventive_actions_count" value={report.preventive_actions_count} onChange={handleInputChange} />
                        <InputGroup label="Звернення відвідувачів" name="visitor_inquiries_count" value={report.visitor_inquiries_count} onChange={handleInputChange} />
                        <InputGroup label="Стрибки з мосту" name="bridge_jumpers_count" value={report.bridge_jumpers_count} onChange={handleInputChange} />

                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Алкоголь</h3>
                            <div className="space-y-3">
                                <InputGroup label="Не допущено у воду" name="alcohol_water_prevented_count" value={report.alcohol_water_prevented_count} onChange={handleInputChange} />
                                <InputGroup label="Попереджено розпивання" name="alcohol_drinking_prevented_count" value={report.alcohol_drinking_prevented_count} onChange={handleInputChange} />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                            <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Відвідуваність (≈)</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <InputGroup label="Пляж" name="people_on_beach_estimated" value={report.people_on_beach_estimated} onChange={handleInputChange} />
                                <InputGroup label="Вода" name="people_in_water_estimated" value={report.people_in_water_estimated} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>

                    {/* General Notes */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h2 className="font-bold text-gray-800 dark:text-white mb-3">📝 Загальні нотатки</h2>
                        <textarea
                            name="general_notes"
                            value={report.general_notes || ''}
                            onChange={handleInputChange}
                            rows={4}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm text-gray-700 dark:text-gray-200 resize-y"
                            placeholder="Коментарі..."
                        />
                    </div>
                </div>

                {/* RIGHT COLUMN: INCIDENTS FEED */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                🔥 Стрічка інцидентів
                                <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2.5 py-0.5 rounded-full text-sm font-bold">
                                    {incidents.length}
                                </span>
                            </h2>
                        </div>

                        {incidents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-xl">
                                <span className="text-4xl mb-2">🛡️</span>
                                <p>Інцидентів у цій зміні не зафіксовано</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {incidents.map((inc) => (
                                    <IncidentCard key={inc.id} incident={inc} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const InputGroup = ({ label, name, value, onChange }: any) => (
    <div>
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            {label}
        </label>
        <input
            type="number"
            min="0"
            name={name}
            value={value}
            onChange={onChange}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-primary/50 outline-none transition text-sm"
        />
    </div>
);

export default AdminReportDetails;