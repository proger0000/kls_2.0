import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface BeachLog {
  time_slot: string;
  land_count: number;
  water_count: number;
  total: number;
}

interface BeachLoadChartProps {
  data: BeachLog[];
}

export const BeachLoadChart: React.FC<BeachLoadChartProps> = ({ data }) => {
  // Кастомный тултип для красивого отображения
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-100 dark:border-gray-700 shadow-lg rounded-lg text-sm">
          <p className="font-bold text-gray-700 dark:text-gray-200 mb-2">{label}</p>
          <p className="text-blue-500">Вода: <span className="font-bold">{payload[0].value}</span></p>
          <p className="text-orange-500">Берег: <span className="font-bold">{payload[1].value}</span></p>
          <p className="text-gray-500 mt-1 pt-1 border-t dark:border-gray-700">Всього: <span className="font-bold">{payload[0].value + payload[1].value}</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full h-[400px] bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Динаміка завантаження (Вода + Берег)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorWater" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorLand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis 
            dataKey="time_slot" 
            tick={{ fill: '#9ca3af', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fill: '#9ca3af', fontSize: 12 }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          <Area 
            type="monotone" 
            dataKey="water_count" 
            name="Людей у воді"
            stroke="#3b82f6" 
            fillOpacity={1} 
            fill="url(#colorWater)" 
          />
          <Area 
            type="monotone" 
            dataKey="land_count" 
            name="Людей на пляжі"
            stroke="#f97316" 
            fillOpacity={1} 
            fill="url(#colorLand)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};