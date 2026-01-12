import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type WaterLandRatioChartProps = {
    water: number;
    land: number;
};

export const WaterLandRatioChart = ({ water, land }: WaterLandRatioChartProps) => {
    const data = [
        { name: 'У воді', value: water },
        { name: 'На суші', value: land },
    ];

    const COLORS = ['#0EA5E9', '#F59E0B'];

    // Safety check to avoid rendering empty charts which might crash or look bad
    if (water === 0 && land === 0) {
        return (
            <div className="h-[300px] w-full bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-center">
                <p className="text-gray-400 text-sm">Немає даних</p>
            </div>
        );
    }

    return (
        <div className="h-[300px] w-full bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 shrink-0">Співвідношення</h3>
            <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
