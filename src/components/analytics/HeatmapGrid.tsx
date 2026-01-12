type HeatmapGridProps = {
    data: { time_slot: string; day: string; load: number }[];
};

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const TIME_SLOTS = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00'
];

// Helper to normalize day names if needed (assuming 'Mon', 'Tue' format from DB or mapped before passed)
const getIntensityColor = (load: number, maxLoad: number) => {
    if (maxLoad === 0) return 'bg-gray-50 dark:bg-gray-800';
    const intensity = load / maxLoad;
    if (intensity > 0.8) return 'bg-red-500';
    if (intensity > 0.6) return 'bg-orange-500';
    if (intensity > 0.4) return 'bg-yellow-400';
    if (intensity > 0.2) return 'bg-green-400';
    if (intensity > 0) return 'bg-green-200';
    return 'bg-gray-50 dark:bg-gray-800';
};

export const HeatmapGrid = ({ data }: HeatmapGridProps) => {
    // 1. Find Max Load for scaling
    const maxLoad = Math.max(...data.map(d => d.load), 1);

    // 2. Map data for O(1) access
    const dataMap = new Map<string, number>();
    data.forEach(d => {
        dataMap.set(`${d.day}-${d.time_slot}`, d.load);
    });

    return (
        <div className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-x-auto">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">Теплова Карта Завантаженості</h3>

            <div className="min-w-[600px]">
                {/* Header Row */}
                <div className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-1">
                    <div className="text-xs text-gray-400 font-medium">Час</div>
                    {DAYS.map(day => (
                        <div key={day} className="text-center text-xs text-gray-500 font-bold">{day}</div>
                    ))}
                </div>

                {/* Rows */}
                {TIME_SLOTS.map(time => (
                    <div key={time} className="grid grid-cols-[80px_repeat(7,1fr)] gap-1 mb-1 items-center">
                        <div className="text-xs text-gray-400 font-medium">{time}</div>
                        {DAYS.map(day => {
                            const load = dataMap.get(`${day}-${time}`) || 0;
                            return (
                                <div
                                    key={`${day}-${time}`}
                                    title={`${day} ${time}: ${load.toFixed(1)} avg stats`}
                                    className={`h-8 rounded-md transition-all hover:scale-105 ${getIntensityColor(load, maxLoad)}`}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                <span>Low</span>
                <div className="w-4 h-4 bg-green-200 rounded"></div>
                <div className="w-4 h-4 bg-yellow-400 rounded"></div>
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>High</span>
            </div>
        </div>
    );
};
