import { format, differenceInDays, min, max } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TimelineHeaderProps {
  timelineRange: { start: Date; end: Date; totalDays: number };
  dates: Date[];
  months: Date[];
}

export default function TimelineHeader({
  timelineRange,
  dates,
  months,
}: TimelineHeaderProps) {
  return (
    <div className="relative mb-8">
      {/* Months */}
      <div className="flex">
        {months.map((month, i) => {
          // Вычисляем позицию для начала месяца
          const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
          // Вычисляем позицию для конца месяца (последний день месяца)
          const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);

          // Определяем видимый диапазон месяца в рамках timelineRange
          const visibleMonthStart = max([monthStart, timelineRange.start]);
          const visibleMonthEnd = min([monthEnd, timelineRange.end]);

          // Если есть видимый диапазон для этого месяца
          if (visibleMonthStart <= visibleMonthEnd) {
            const startPosition = (differenceInDays(visibleMonthStart, timelineRange.start) / timelineRange.totalDays) * 100;
            return (
              <div 
                key={`month-${i}`}
                className="absolute text-sm font-medium text-gray-400"
                style={{ 
                  left: `${startPosition}%`,
                  transform: 'translateX(-50%)'
                }}
              >
                {format(month, 'LLLL', { locale: ru })}
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Days */}
      <div className="flex mt-6">
        {dates.map((date, i) => {
          const isStageDate = false; // Эта логика будет в TimelineStages
          const isToday = date.toDateString() === new Date().toDateString();
          const isFriday = date.getDay() === 5;
          
          const position = (differenceInDays(date, timelineRange.start) / timelineRange.totalDays) * 100;
          
          return (
            <div 
              key={i} 
              className={`absolute text-xs ${
                isToday ? 'font-bold text-blue-500' : // Сегодня
                isStageDate ? 'font-semibold text-gray-300' : // Начало/конец этапа (перенесено)
                isFriday ? 'font-medium text-gray-400' : // Пятница
                'text-gray-500' // Остальные даты
              }`}
              style={{ 
                left: `${position}%`,
                transform: 'translateX(-50%)'
              }}
            >
              {format(date, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
} 