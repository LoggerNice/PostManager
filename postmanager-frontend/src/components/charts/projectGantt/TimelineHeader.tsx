'use client';

import { TimelineHeaderProps } from '@/types/projectGantt.types';

export default function TimelineHeader({ months, dimensions }: TimelineHeaderProps) {
  return (
    <>
      {/* Заголовок с названиями месяцев */}
      <g>
        
        {/* Названия месяцев */}
        {months.map((month, index) => {
          const x = dimensions.projectNameColumnWidth + index * month.width;
          return (
            <text
              key={`${month.year}-${month.month}`}
              x={x + month.width / 2}
              y={dimensions.headerHeight / 4}
              textAnchor="middle"
              className="text-sm fill-gray-900 dark:fill-white font-semibold"
            >
              {month.month}
            </text>
          );
        })}
      </g>
      
      {/* Разделительные линии месяцев */}
      <g>
        {/* Числа месяца */}
        {months.map((month, index) => {
          const x = dimensions.projectNameColumnWidth + index * month.width;
          return (
            <g key={`line-${month.year}-${month.month}`}>
              {/* Числа месяца */}
              {Array.from({ length: month.daysInMonth }, (_, dayIndex) => {
                const dayPosition = (dayIndex + 1) * (month.width / month.daysInMonth);
                const dayNumber = dayIndex + 1;
                
                                 // Показываем числа только для определенных дней (1 только для первого месяца, 5, 10, 15, 20, 25, последний день)
                 const shouldShowDay = (dayNumber === 1 && index === 0) || 
                   dayNumber === 5 || 
                   dayNumber === 10 || 
                   dayNumber === 15 || 
                   dayNumber === 20 || 
                   dayNumber === 25 || 
                   dayNumber === month.daysInMonth;
                
                if (!shouldShowDay) return null;
                
                return (
                  <text
                    key={dayIndex}
                    x={x + dayPosition}
                    y={dimensions.headerHeight / 2 + 15}
                    textAnchor="middle"
                    className="text-xs fill-gray-600 dark:fill-gray-400 font-medium"
                  >
                    {dayNumber}
                  </text>
                );
              })}
            </g>
          );
        })}
      </g>
    </>
  );
}
