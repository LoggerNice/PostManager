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
                const daySpacing = availableWidth / 7; // один день = одна доля ширины
                const position = index * daySpacing;
                const isToday = date.toDateString() === new Date().toDateString();
                const isFriday = date.getDay() === 5;
                const isSunday = date.getDay() === 0;
                const isSaturday = date.getDay() === 6;
                const isWorkDay = date.getDay() >= 1 && date.getDay() <= 5;
                
                // Названия дней недели (только для рабочих дней)
                const dayNames = ['', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', ''];
                
                return (
                    <g key={`date-${index}`}>
                        {/* Число месяца */}
                        {isWorkDay && (
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
                        )}
                        
                        {/* Название дня недели (только для рабочих дней) */}
                        {isWorkDay && (
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
                        )}
                        
                        {/* Вертикальные линии сетки */}
                        <line
                            x1={leftMargin + position}
                            y1={60}
                            x2={leftMargin + position}
                            y2={chartHeight - 20}
                            stroke={isToday ? '#3b82f6' : 
                                   isFriday ? '#6b7280' : 
                                   isWorkDay ? '#e5e7eb' : 
                                   '#f3f4f6'}
                            strokeWidth={isToday ? 2 : isWorkDay ? 1 : 0.5}
                            opacity={isToday ? 1 : isWorkDay ? 0.5 : 0.3}
                        />
                    </g>
                );
            })}
        </>
    );
}
