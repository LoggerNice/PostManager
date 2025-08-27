import { TimelineData } from '@/types/gantt.types';

interface TimelineHeaderProps {
    timelineData: TimelineData;
    dimensions: {
        leftMargin: number;
        chartWidth: number;
        availableWidth: number;
        chartHeight: number;
    };
}

export default function TimelineHeader({ timelineData, dimensions }: TimelineHeaderProps) {
    const { leftMargin, chartWidth, availableWidth, chartHeight } = dimensions;
    
    return (
        <>
            {/* Заголовки дней */}
            {timelineData.dates.map((date, index) => {
                const daySpacing = availableWidth / 5; // один день = одна доля ширины
                const position = index * daySpacing;
                const isToday = date.toDateString() === new Date().toDateString();
                const isFriday = date.getDay() === 5;
                
                // Названия дней недели
                const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт'];
                
                return (
                    <g key={`date-${index}`}>
                        {/* Число месяца */}
                        <text
                            x={leftMargin + position}
                            y={30}
                            className={`text-xs ${
                                isToday ? 'font-bold fill-blue-500' :
                                'fill-gray-600 dark:fill-gray-400'
                            }`}
                            textAnchor="middle"
                        >
                            {date.getDate()}
                        </text>
                        
                        {/* Название дня недели */}
                        <text
                            x={leftMargin + position}
                            y={50}
                            className={`text-xs ${
                                isToday ? 'font-bold fill-blue-500' :
                                isFriday ? 'font-medium fill-gray-600 dark:fill-gray-400' :
                                'fill-gray-500 dark:fill-gray-500'
                            }`}
                            textAnchor="middle"
                        >
                            {dayNames[index]}
                        </text>
                        
                        {/* Вертикальные линии сетки */}
                        <line
                            x1={leftMargin + position}
                            y1={60}
                            x2={leftMargin + position}
                            y2={chartHeight - 20}
                            stroke={isToday ? '#3b82f6' : isFriday ? '#6b7280' : '#e5e7eb'}
                            strokeWidth={isToday ? 2 : 1}
                            opacity={isToday ? 1 : 0.5}
                        />
                    </g>
                );
            })}
        </>
    );
}
