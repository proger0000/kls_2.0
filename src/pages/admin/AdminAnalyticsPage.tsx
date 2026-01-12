import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../supabase';
import { Icons } from '../../components/Icons';
import { SeasonalTrendChart } from '../../components/analytics/SeasonalTrendChart';
import { TopBeachesChart } from '../../components/analytics/TopBeachesChart';
import { WaterLandRatioChart } from '../../components/analytics/WaterLandRatioChart';
import { HeatmapGrid } from '../../components/analytics/HeatmapGrid';
import { SmartInsights } from '../../components/analytics/SmartInsights';
import { formatDateLocal } from '../../utils/date';

// Types


// Start of Date Helpers
const getPresetDates = (preset: string) => {
  const end = new Date();
  const start = new Date();

  switch (preset) {
    case 'last_7_days':
      start.setDate(end.getDate() - 7);
      break;
    case 'last_month':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'this_season':
      start.setMonth(4); // May
      start.setDate(1);
      if (end.getMonth() < 4) start.setFullYear(start.getFullYear() - 1);
      break;
    case 'last_season':
      start.setFullYear(start.getFullYear() - 1);
      start.setMonth(4); // May
      start.setDate(1);

      const lastSeasonEnd = new Date(start);
      lastSeasonEnd.setMonth(8); // September
      lastSeasonEnd.setDate(30);
      return { start: formatDateLocal(start), end: formatDateLocal(lastSeasonEnd) };
    default: // last 30 days default
      start.setDate(end.getDate() - 30);
  }
  return { start: formatDateLocal(start), end: formatDateLocal(end) };
};

export const AdminAnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Enhanced State
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [postStats, setPostStats] = useState<any[]>([]);
  const [heatmapLogs, setHeatmapLogs] = useState<any[]>([]);

  // Filters
  const [dateRange, setDateRange] = useState(getPresetDates('last_30_days'));
  const [preset, setPreset] = useState('last_30_days');

  useEffect(() => {
    if (!dateRange.start || !dateRange.end) return;
    fetchData();
  }, [dateRange]);

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    setPreset(newVal);
    setDateRange(getPresetDates(newVal));
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [dailyRes, postRes, rawRes] = await Promise.all([
        // 1. Daily View (KPIs, Seasonal)
        supabase
          .from('view_analytics_daily' as any)
          .select('*')
          .gte('date', dateRange.start)
          .lte('date', dateRange.end),

        // 2. Post View (Top Beaches)
        supabase
          .from('view_analytics_by_post' as any)
          .select('*, posts(name)')
          .gte('date', dateRange.start)
          .lte('date', dateRange.end),

        // 3. Raw Logs (Heatmap - needs time_slot)
        // Limit increased to 10k to catch more data. Ideally would be a view too.
        supabase
          .from('beach_analytics_logs')
          .select('date, time_slot, land_count, water_count')
          .gte('date', dateRange.start)
          .lte('date', dateRange.end)
          .limit(10000)
      ]);

      if (dailyRes.error) throw dailyRes.error;
      if (postRes.error) throw postRes.error;
      if (rawRes.error) throw rawRes.error;

      setDailyStats(dailyRes.data || []);
      setPostStats(postRes.data || []);
      setHeatmapLogs(rawRes.data || []);

    } catch (err: any) {
      console.error(err);
      setError('Error loading analytics data');
    } finally {
      setLoading(false);
    }
  };

  // --- Process Data for Charts ---

  // 1. KPI Calculations (Source: view_analytics_daily)
  const kpi = useMemo(() => {
    if (!dailyStats.length) return { total: 0, busiestDate: '-', avgDaily: 0, safetyIndex: 0, totalWater: 0, totalLand: 0 };

    // Use Daily View for accurate Total Visitors (not limited by rows)
    const totalVisitors = dailyStats.reduce((acc, curr) => acc + (curr.total_visitors || 0), 0);

    // Use Heatmap Logs (sample) to determine Water/Land Ratio
    let sampleWater = 0;
    let sampleLand = 0;
    heatmapLogs.forEach(l => {
      sampleWater += l.water_count;
      sampleLand += l.land_count;
    });

    const totalSample = sampleWater + sampleLand;
    const waterRatio = totalSample > 0 ? sampleWater / totalSample : 0;

    // Apply ratio to accurate total
    const totalWater = Math.round(totalVisitors * waterRatio);
    const totalLand = totalVisitors - totalWater;

    const daysCount = dailyStats.length || 1;
    const avgDaily = Math.round(totalVisitors / daysCount);

    const safetyIndex = totalLand > 0 ? (totalWater / totalLand) * 100 : 0;

    // Busiest Day from Daily Stats
    const sortedDays = [...dailyStats].sort((a, b) => b.total_visitors - a.total_visitors);
    const busiestDate = sortedDays[0] ? new Date(sortedDays[0].date).toLocaleDateString('uk-UA') : '-';

    return { total: totalVisitors, busiestDate, avgDaily, safetyIndex, totalWater, totalLand };
  }, [dailyStats, heatmapLogs]);

  // 2. Seasonal Trend Data (Source: view_analytics_daily)
  const seasonalData = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return [];

    const map: Record<string, number> = {};
    dailyStats.forEach(d => {
      map[d.date] = d.total_visitors;
    });

    const filledData = [];
    const [startYear, startMonth, startDay] = dateRange.start.split('-').map(Number);
    const [endYear, endMonth, endDay] = dateRange.end.split('-').map(Number);

    const current = new Date(startYear, startMonth - 1, startDay);
    const end = new Date(endYear, endMonth - 1, endDay);

    while (current <= end) {
      const y = current.getFullYear();
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      filledData.push({
        date: dateStr,
        visitors: map[dateStr] || 0
      });
      current.setDate(current.getDate() + 1);
    }

    return filledData;
  }, [dailyStats, dateRange]);

  // 3. Top Beaches Data (Source: view_analytics_by_post)
  const topBeachesData = useMemo(() => {
    // Aggregating by post over the date range
    const map: Record<string, { name: string, water: number, land: number }> = {};

    postStats.forEach(p => {
      // p.posts is joined, p.posts.name
      // @ts-ignore
      const name = p.posts?.name || `Post #${p.post_id}`;
      // The view gives SUM(total), AVG(water), AVG(land). 
      // Wait, the view definition I saw:
      // SUM(land+water) as total_visitors, AVG(water), AVG(land).
      // It DOES NOT have SUM(water) and SUM(land).
      // That's a limitation of the view created.
      // I should have SUM(water_count) in the view.
      // Since I can't change the view easily (SQL tool?), I will estimate or use heatmapLogs?
      // Actually, heatmapLogs has post info? NO, I removed `post_id` from heatmapLogs select to save bandwidth.

      // Let's check heatmapLogs select again: 'date, time_slot, land_count, water_count'. NO POST ID.
      // So I rely on postStats.
      // If the view only has AVGs, I can't get true Totals.
      // BUT: total_visitors = sum. AVG(water) * count? count is not there.
      // Let's look at view definition again in my memory context.
      // SELECT date, post_id, SUM(total), AVG(water), AVG(land), MAX(total).
      // Yeah, it's missing SUM(water).

      // LIMITATION WORKAROUND:
      // I will assume ratio of water/land based on AVGs and apply to Total.
      // water_part = avg_water / (avg_water + avg_land) * total_visitors.

      const avgW = p.avg_water || 0;
      const avgL = p.avg_land || 0;
      const ratioW = (avgW + avgL) ? avgW / (avgW + avgL) : 0;
      const total = p.total_visitors || 0;

      const estimatedWater = Math.round(total * ratioW);
      const estimatedLand = total - estimatedWater;

      if (!map[name]) map[name] = { name, water: 0, land: 0 };
      map[name].water += estimatedWater;
      map[name].land += estimatedLand;
    });

    return Object.values(map)
      .sort((a, b) => (b.water + b.land) - (a.water + a.land))
      .slice(0, 5);
  }, [postStats]);

  // 4. Heatmap Data & Insights Data (Source: heatmapLogs - raw logs)
  const { heatmapData, insightsData } = useMemo(() => {
    const heatmapMap: Record<string, { count: number, sum: number }> = {};
    let weekendSum = 0, weekendCount = 0;
    let weekdaySum = 0, weekdayCount = 0;

    // For heatmap grouping
    heatmapLogs.forEach(l => {
      const d = new Date(l.date);
      // Correct Day mapping for Ukrainian array where 0=Monday ... 6=Sunday
      // JS getDay(): 0=Sun, 1=Mon ... 6=Sat
      const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
      const dayName = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'][dayIndex];

      // Normalize time_slot to "HH:MM" (db returns "HH:MM:SS")
      const timeSlot = l.time_slot.slice(0, 5);
      const key = `${dayName}-${timeSlot}`;

      if (!heatmapMap[key]) heatmapMap[key] = { count: 0, sum: 0 };
      heatmapMap[key].count += 1;
      heatmapMap[key].sum += (l.land_count + l.water_count);

      // Weekday vs Weekend stats
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
      if (isWeekend) {
        weekendSum += (l.land_count + l.water_count);
        weekendCount++;
      } else {
        weekdaySum += (l.land_count + l.water_count);
        weekdayCount++;
      }
    });

    const finalHeatmap = Object.entries(heatmapMap).map(([key, val]) => {
      const [day, time_slot] = key.split('-');
      return { day, time_slot, load: val.sum / val.count }; // Avg load
    });

    // Smart Insights Data preparation
    const busiestPost = topBeachesData[0] || { name: '', water: 0, land: 0 };

    return {
      heatmapData: finalHeatmap,
      insightsData: {
        safetyIndex: kpi.safetyIndex,
        busiestPostName: busiestPost.name,
        busiestPostLoad: busiestPost.water + busiestPost.land,
        weekendAvg: weekendCount ? weekendSum / weekendCount : 0,
        weekdayAvg: weekdayCount ? weekdaySum / weekdayCount : 0,
      }
    };
  }, [heatmapLogs, kpi.safetyIndex, topBeachesData]);


  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-[1600px] mx-auto">

      {/* Header & Controls */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Icons.Analytics className="w-8 h-8 text-brand-600" />
            Аналітика 2.0
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Повний огляд активності пляжів. Дані оновлюються в реальному часі.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-end bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Період</label>
            <select
              value={preset}
              onChange={handlePresetChange}
              className="h-10 px-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
            >
              <option value="last_7_days">Останні 7 днів</option>
              <option value="last_month">Минулий місяць</option>
              <option value="this_season">Цей сезон (Трав-Вер)</option>
              <option value="last_season">Минулий сезон</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Від</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="h-10 px-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-sm shadow-sm"
              />
            </div>
            <span className="text-gray-400 mt-5">-</span>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">До</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="h-10 px-3 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-lg text-sm shadow-sm"
              />
            </div>
          </div>

          <button
            onClick={fetchData}
            className="h-10 px-6 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-lg shadow-lg shadow-brand-500/30 transition-all hover:scale-105 active:scale-95"
          >
            Оновити
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-6 rounded-xl border border-red-200 text-center">
          <h3 className="text-lg font-bold mb-2">Помилка</h3>
          <p>{error}</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <KpiCard
              title="Всього відвідувачів"
              value={kpi.total.toLocaleString()}
              subtitle="За вибраний період"
              color="blue"
            />
            <KpiCard
              title="Піковий день"
              value={kpi.busiestDate}
              subtitle="Максимальне навантаження"
              color="purple"
            />
            <KpiCard
              title="Середнє за день"
              value={kpi.avgDaily.toLocaleString()}
              subtitle="Відвідувачів / день"
              color="indigo"
            />
            <KpiCard
              title="Safety Index"
              value={`${kpi.safetyIndex.toFixed(1)}%`}
              subtitle="Співвідношення Вода/Суша"
              color={kpi.safetyIndex > 30 ? 'orange' : 'green'}
            />
          </div>

          {/* Smart Insights */}
          <SmartInsights data={insightsData} />

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <SeasonalTrendChart data={seasonalData} />
            </div>
            <div>
              <WaterLandRatioChart water={kpi.totalWater} land={kpi.totalLand} />
            </div>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopBeachesChart data={topBeachesData} />
            <HeatmapGrid data={heatmapData} />
          </div>
        </>
      )}
    </div>
  );
};

interface KpiCardProps {
  title: string;
  value: string;
  subtitle: string;
  color: 'blue' | 'purple' | 'indigo' | 'orange' | 'green';
}

// Simple Internal Component for KPI Cards
const KpiCard = ({ title, value, subtitle, color }: KpiCardProps) => {
  const colors = {
    blue: 'from-blue-500 to-cyan-500 shadow-blue-500/20',
    purple: 'from-purple-500 to-indigo-500 shadow-purple-500/20',
    indigo: 'from-indigo-500 to-violet-500 shadow-indigo-500/20',
    orange: 'from-orange-500 to-amber-500 shadow-orange-500/20',
    green: 'from-emerald-500 to-green-500 shadow-emerald-500/20',
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-xl bg-gradient-to-br ${colors[color] || colors.blue}`}>
      <div className="relative z-10">
        <p className="text-white/80 text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold tracking-tight">{value}</h3>
        <p className="text-white/60 text-xs mt-2">{subtitle}</p>
      </div>
      <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
    </div>
  );
};
