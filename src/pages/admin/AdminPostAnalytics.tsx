import { useEffect, useState } from 'react';
import { supabase } from '../../supabase';
import { Icons } from '../../components/Icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  BarController,
  LineController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  BarController,
  LineController,
  DoughnutController,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Типы периодов
type PeriodType = 'today' | 'week' | 'month' | 'season' | 'custom';

export const AdminPostAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>('month');

  // Кастомные даты (по умолчанию - сегодня)
  const [customStart, setCustomStart] = useState(new Date().toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState(new Date().toISOString().split('T')[0]);

  // Данные
  const [shiftsData, setShiftsData] = useState<any[]>([]);
  const [reportsData, setReportsData] = useState<any[]>([]);
  const [incidentsData, setIncidentsData] = useState<any[]>([]);
  const [beachLogs, setBeachLogs] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);

  // KPI
  const [kpi, setKpi] = useState({
    totalShifts: 0,
    totalHours: 0,
    totalPeople: 0,
    totalIncidents: 0,
    avgPeoplePerShift: 0,
    waterLandRatio: 0,
  });

  // Следим за изменением периода или кастомных дат (если выбран custom)
  useEffect(() => {
    if (period === 'custom') {
      // Ждем, пока юзер выберет обе даты, или загружаем сразу
      fetchData();
    } else {
      fetchData();
    }
  }, [period, customStart, customEnd]);

  const getDateRange = () => {
    const end = new Date();
    const start = new Date();

    // Устанавливаем конец дня для корректного поиска (23:59:59)
    end.setHours(23, 59, 59, 999);

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        break;
      case 'week':
        start.setDate(end.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        break;
      case 'month':
        start.setDate(end.getDate() - 30);
        start.setHours(0, 0, 0, 0);
        break;
      case 'season':
        start.setMonth(4); // Май (0-index = 4)
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        // Если сейчас начало года (до мая), берем прошлый год
        if (end.getMonth() < 4) start.setFullYear(start.getFullYear() - 1);
        break;
      case 'custom':
        // Парсим кастомные даты
        const s = new Date(customStart);
        s.setHours(0, 0, 0, 0);
        const e = new Date(customEnd);
        e.setHours(23, 59, 59, 999);
        return { start: s.toISOString(), end: e.toISOString() };
    }
    return { start: start.toISOString(), end: end.toISOString() };
  };

  const fetchData = async () => {
    setLoading(true);
    const { start, end } = getDateRange();

    try {
      // 0. Загружаем список постов
      const { data: postsData } = await supabase.from('posts').select('id, name, complexity_coefficient');
      setPosts(postsData || []);

      // 1. Смены (ВАЖНО: limit 10000, чтобы не обрезало на 1000)
      const { data: shifts } = await supabase
        .from('shifts')
        .select('*')
        .gte('start_time', start)
        .lte('start_time', end)
        .limit(10000); // <-- FIX LIMIT
      setShiftsData(shifts || []);

      // 2. Отчеты
      const { data: reports } = await supabase
        .from('shift_reports')
        .select('*')
        .gte('report_submitted_at', start)
        .lte('report_submitted_at', end)
        .limit(10000); // <-- FIX LIMIT
      setReportsData(reports || []);

      // 3. Логи пляжей
      const { data: logs } = await supabase
        .from('beach_analytics_logs')
        .select('*')
        .gte('date', start)
        .lte('date', end)
        .limit(10000);
      setBeachLogs(logs || []);

      // 4. Инциденты
      if (reports && reports.length > 0) {
        const reportIds = reports.map(r => r.id);
        // Supabase .in() имеет лимит элементов, лучше разбивать если ооочень много, 
        // но для 4000 отчетов должно хватить, или подгрузим чанками. 
        // Пока оставим так, но добавим лимит выборки
        const { data: incidents } = await supabase
          .from('report_incidents')
          .select('*')
          .in('shift_report_id', reportIds)
          .limit(10000);
        setIncidentsData(incidents || []);
      } else {
        setIncidentsData([]);
      }

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (loading) return;

    const totalShifts = shiftsData.length;
    const totalHours = shiftsData.reduce((acc, s) => acc + (s.rounded_work_hours || 0), 0);
    const peopleBeach = reportsData.reduce((acc, r) => acc + (r.people_on_beach_estimated || 0), 0);
    const peopleWater = reportsData.reduce((acc, r) => acc + (r.people_in_water_estimated || 0), 0);
    const totalPeople = peopleBeach + peopleWater;
    const avgPeoplePerShift = totalShifts > 0 ? Math.round(totalPeople / totalShifts) : 0;
    const waterLandRatio = totalPeople > 0 ? Math.round((peopleWater / totalPeople) * 100) : 0;

    setKpi({
      totalShifts,
      totalHours,
      totalPeople,
      totalIncidents: incidentsData.length,
      avgPeoplePerShift,
      waterLandRatio
    });

  }, [shiftsData, reportsData, incidentsData, loading]);

  // --- Chart Data ---

  // 1. Incidents
  const incidentTypes = incidentsData.reduce((acc: any, curr) => {
    const type = curr.incident_type || 'other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const incidentsChartData = {
    labels: Object.keys(incidentTypes).map(t => {
      const map: any = { ambulance: 'Швидка', police: 'Поліція', first_aid: 'Допомога', lost_child: 'Діти', critical_swimmer: 'Порятунок' };
      return map[t] || t;
    }),
    datasets: [{
      data: Object.values(incidentTypes),
      backgroundColor: ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#6366F1'],
      borderWidth: 0,
    }]
  };

  // 2. Load vs Complexity
  const postStats = posts.map(post => {
    const postShiftIds = shiftsData.filter(s => s.post_id === post.id).map(s => s.id);
    const postReports = reportsData.filter(r => postShiftIds.includes(r.shift_id));
    const totalP = postReports.reduce((acc, r) => acc + (r.people_on_beach_estimated + r.people_in_water_estimated), 0);
    const avgP = postShiftIds.length > 0 ? Math.round(totalP / postShiftIds.length) : 0;

    return {
      name: post.name,
      avgLoad: avgP,
      complexity: post.complexity_coefficient
    };
  });

  const postLoadData = {
    labels: postStats.map(p => p.name),
    datasets: [
      {
        type: 'bar' as const,
        label: 'Середнє навантаження (людей)',
        data: postStats.map(p => p.avgLoad),
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderRadius: 4,
        yAxisID: 'y',
      },
      {
        type: 'line' as const,
        label: 'Коефіцієнт складності', // Убрали x100
        data: postStats.map(p => p.complexity), // Убрали умножение
        borderColor: '#EF4444',
        borderWidth: 2,
        pointBackgroundColor: '#EF4444',
        yAxisID: 'y1',
      }
    ]
  };

  // --- Heatmap Logic ---
  const processHeatmapData = () => {
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
    const matrix = Array(7).fill(0).map(() => Array(12).fill(0));
    const counts = Array(7).fill(0).map(() => Array(12).fill(0));

    beachLogs.forEach(log => {
      const d = new Date(log.date);
      let dayIdx = d.getDay(); // 0 (Вс) ... 6 (Сб)

      // FIX: Перенос воскресенья (0) в конец (6), остальных сдвигаем на -1
      // Было: Вс=0, Пн=1. Стало: Пн=0 ... Вс=6
      if (dayIdx === 0) {
        dayIdx = 6;
      } else {
        dayIdx = dayIdx - 1;
      }

      const timeStr = log.time_slot.substring(0, 5);
      const timeIdx = timeSlots.indexOf(timeStr);

      if (timeIdx !== -1) {
        matrix[dayIdx][timeIdx] += (log.land_count + log.water_count);
        counts[dayIdx][timeIdx] += 1;
      }
    });

    return matrix.map((row, d) => row.map((val, h) => counts[d][h] ? Math.round(val / counts[d][h]) : 0));
  };

  const heatmapMatrix = processHeatmapData();
  const timeHeaders = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];
  // Обновили порядок дней
  const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  const getHeatmapColor = (val: number) => {
    if (val === 0) return 'bg-gray-50 dark:bg-gray-800/50';
    if (val < 50) return 'bg-blue-100 dark:bg-blue-900/20';
    if (val < 150) return 'bg-blue-200 dark:bg-blue-800/40';
    if (val < 300) return 'bg-blue-300 dark:bg-blue-700/60';
    if (val < 500) return 'bg-blue-400 dark:bg-blue-600/80';
    return 'bg-blue-600 text-white shadow-md shadow-blue-500/50';
  };

  return (
    <div className="space-y-6 animate-fade-in-up pb-12 w-full">

      {/* Header & Filters */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Icons.Analytics className="text-blue-600" />
            Комплексна Аналітика
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Моніторинг ефективності та безпеки
          </p>
        </div>

        {/* Filters Group */}
        <div className="flex flex-col sm:flex-row gap-2 items-center">
          {/* Custom Date Pickers */}
          {period === 'custom' && (
            <div className="flex items-center gap-2 animate-fade-in bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="px-2 py-1 text-sm bg-transparent border-none outline-none text-gray-700 dark:text-gray-200"
              />
              <span className="text-gray-400">-</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="px-2 py-1 text-sm bg-transparent border-none outline-none text-gray-700 dark:text-gray-200"
              />
            </div>
          )}

          {/* Period Pills */}
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex gap-1 overflow-x-auto max-w-full">
            {(['today', 'week', 'month', 'season', 'custom'] as PeriodType[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all whitespace-nowrap ${period === p
                  ? 'bg-white dark:bg-gray-700 text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
              >
                {p === 'today' && 'Сьогодні'}
                {p === 'week' && 'Тиждень'}
                {p === 'month' && 'Місяць'}
                {p === 'season' && 'Сезон'}
                {p === 'custom' && 'Період'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Відпрацьовано годин"
          value={kpi.totalHours}
          sub={`${kpi.totalShifts} змін`}
          icon="⏳"
          color="bg-blue-500"
        />
        <KPICard
          title="Трафік відвідувачів"
          value={kpi.totalPeople.toLocaleString()}
          sub={`~${kpi.avgPeoplePerShift} за зміну`}
          icon="👥"
          color="bg-purple-500"
        />
        <KPICard
          title="Інциденти"
          value={kpi.totalIncidents}
          sub={kpi.totalIncidents === 0 ? 'Спокійно' : 'Потребують уваги'}
          icon="🚨"
          color={kpi.totalIncidents > 0 ? "bg-red-500" : "bg-green-500"}
        />
        <KPICard
          title="Активність у воді"
          value={`${kpi.waterLandRatio}%`}
          sub="Людей у воді vs на піску"
          icon="🌊"
          color="bg-cyan-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Heatmap (2/3 width) - FULL WIDTH FIX */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 w-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
              🌡️ Теплова карта завантаженості
              {loading && <span className="animate-spin text-gray-400">Wait</span>}
            </h3>
            <div className="text-xs text-gray-400">Середнє за обраний період</div>
          </div>

          {/* w-full для контейнера */}
          <div className="overflow-x-auto w-full pb-2">
            <div className="w-full min-w-[600px]">
              {/* Header Hours */}
              <div className="grid grid-cols-12 gap-1 mb-2 pl-8">
                {timeHeaders.map(t => (
                  <div key={t} className="text-xs text-center text-gray-400">{t}</div>
                ))}
              </div>

              {/* Rows Days */}
              {dayLabels.map((day, dIdx) => (
                <div key={day} className="flex items-center gap-2 mb-1.5">
                  <div className="w-8 text-xs font-bold text-gray-500 dark:text-gray-400">{day}</div>
                  {/* grid занимает всю ширину */}
                  <div className="flex-1 grid grid-cols-12 gap-1">
                    {heatmapMatrix[dIdx].map((val, tIdx) => (
                      <div
                        key={tIdx}
                        className={`h-8 rounded-md flex items-center justify-center text-[10px] font-medium transition hover:scale-105 cursor-help ${getHeatmapColor(val)}`}
                        title={`${day} ${timeHeaders[tIdx]}: ${val} відв.`}
                      >
                        {val > 0 ? val : ''}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-100"></div> Низька</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-300"></div> Середня</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-600"></div> Висока</div>
          </div>
        </div>

        {/* Incidents Pie (1/3 width) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col">
          <h3 className="font-bold text-gray-800 dark:text-white mb-4">Структура інцидентів</h3>
          <div className="flex-1 flex items-center justify-center relative min-h-[250px]">
            {kpi.totalIncidents === 0 ? (
              <div className="text-center text-gray-400">
                <span className="text-4xl block mb-2">🛡️</span>
                Інцидентів немає
              </div>
            ) : (
              <Doughnut
                data={incidentsChartData}
                options={{
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } }
                }}
              />
            )}
          </div>
        </div>

        {/* Load vs Complexity (Full Width) */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-800 dark:text-white mb-6">Аналіз ефективності постів</h3>
          <div className="h-80">
            <Chart type='bar'
              data={postLoadData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                  y: { display: true, position: 'left', title: { display: true, text: 'Середнє навантаження' } },
                  y1: {
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false },
                    title: { display: true, text: 'Коеф. складності' }, // Исправлен заголовок
                    ticks: { stepSize: 0.5 } // Шаг 0.5 для красоты
                  }
                }
              }}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

const KPICard = ({ title, value, sub, icon, color }: any) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity ${color} rounded-bl-3xl`}>
      <span className="text-3xl">{icon}</span>
    </div>
    <div className="relative z-10">
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{title}</p>
      <div className="text-3xl font-bold text-gray-800 dark:text-white mt-1 mb-1">{value}</div>
      <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400 dark:text-gray-500">
        <span className={`w-1.5 h-1.5 rounded-full ${color.replace('bg-', 'bg-')}`}></span>
        {sub}
      </div>
    </div>
  </div>
);

export default AdminPostAnalytics;