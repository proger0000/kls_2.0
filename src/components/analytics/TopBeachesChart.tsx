import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

type TopBeachesChartProps = {
    data: { name: string; water: number; land: number }[];
};

export const TopBeachesChart = ({ data }: TopBeachesChartProps) => {
    return (
        <div className="h-[300px] w-full bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 shrink-0">Топ 5 Локацій</h3>
            <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={data}
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            tick={{ fill: '#6B7280', fontSize: 12 }}
                            width={80}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend iconType="circle" />
                        <Bar dataKey="water" name="У воді" stackId="a" fill="#0EA5E9" radius={[0, 0, 0, 0]} barSize={20} />
                        <Bar dataKey="land" name="На пляжі" stackId="a" fill="#F59E0B" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
