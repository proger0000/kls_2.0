type SmartInsightsProps = {
    data: {
        safetyIndex: number;
        busiestPostName: string;
        busiestPostLoad: number;
        weekendAvg: number;
        weekdayAvg: number;
    };
};

export const SmartInsights = ({ data }: SmartInsightsProps) => {
    const { safetyIndex, busiestPostName, busiestPostLoad, weekendAvg, weekdayAvg } = data;

    // Calculate Diff
    const weekendDiff = weekdayAvg > 0 ? ((weekendAvg - weekdayAvg) / weekdayAvg) * 100 : 0;

    const insights = [];

    // Insight 1: Safety
    if (safetyIndex > 30) {
        insights.push({
            type: 'warning',
            text: `Увага! Співвідношення людей у воді до берега складає ${safetyIndex.toFixed(1)}%. Це вище норми (30%). Рекомендується посилити нагляд.`
        });
    } else {
        insights.push({
            type: 'success',
            text: `Індекс безпеки в нормі (${safetyIndex.toFixed(1)}%). Ситуація контрольована.`
        });
    }

    // Insight 2: Traffic
    if (weekendDiff > 20) {
        insights.push({
            type: 'info',
            text: `На вихідних навантаження на ${weekendDiff.toFixed(0)}% вище, ніж у будні. Плануйте зміни відповідним чином.`
        });
    }

    // Insight 3: Dangerous Post
    if (busiestPostName) {
        insights.push({
            type: 'danger',
            text: `Найбільш завантажена локація: "${busiestPostName}" (Avg load: ${busiestPostLoad.toFixed(0)} людей).`
        });
    }

    return (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 p-6 rounded-2xl border border-indigo-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
                ✨ Smart Insights
            </h3>
            <div className="space-y-3">
                {insights.map((insight, idx) => (
                    <div key={idx} className={`flex items-start gap-3 p-3 rounded-lg ${insight.type === 'warning' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200' :
                            insight.type === 'danger' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                                insight.type === 'success' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200' :
                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                        }`}>
                        <span className="text-lg">
                            {insight.type === 'warning' ? '⚠️' :
                                insight.type === 'danger' ? '🔥' :
                                    insight.type === 'success' ? '✅' : 'ℹ️'}
                        </span>
                        <p className="text-sm font-medium leading-relaxed">{insight.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};
