import { useMemo } from 'react';
import { addDays, differenceInDays, min, max, format } from 'date-fns';

interface ProjectStage {
  id: number;
  name: string;
  startDate: Date;
  endDate: Date;
  color: string;
  icon: string;
  progress: number;
}

interface TimelineData {
  timelineRange: { start: Date; end: Date; totalDays: number };
  dates: Date[];
  months: Date[];
}

export function useTimelineData(stages: ProjectStage[]): TimelineData {

  // Вычисляем общий период проекта
  const timelineRange = useMemo(() => {
    const startDates = stages.map(stage => stage.startDate);
    const endDates = stages.map(stage => stage.endDate);
    
    const projectStart = min(startDates);
    const projectEnd = max(endDates);
    
    // Добавляем отступ только после окончания
    const timelineStart = projectStart;
    const timelineEnd = projectEnd; // Конец графика - последняя дата по срокам этапов
    
    const totalDays = differenceInDays(timelineEnd, timelineStart);
    
    return {
      start: timelineStart,
      end: timelineEnd,
      totalDays
    };
  }, [stages]);

  // Генерируем даты для оси X с учетом этапов
  const dates = useMemo(() => {
    const allDates = new Set<number>();

    // Добавляем начало и конец диапазона
    allDates.add(timelineRange.start.getTime());
    allDates.add(timelineRange.end.getTime());

    // Добавляем каждую пятницу в диапазоне
    let friday = new Date(timelineRange.start);
    // Находим первую пятницу в диапазоне или после него
    while (friday.getDay() !== 5) { // 5 = пятница
      friday = addDays(friday, 1);
    }
    while (friday <= timelineRange.end) {
      allDates.add(friday.getTime());
      friday = addDays(friday, 7);
    }

    // Добавляем даты начала и окончания этапов
    stages.forEach(stage => {
      allDates.add(stage.startDate.getTime());
      allDates.add(stage.endDate.getTime());
    });

    // Добавляем сегодняшнюю дату
    const today = new Date();
    // Обнуляем время для точного сравнения дат
    today.setHours(0, 0, 0, 0);

    if (today >= timelineRange.start && today <= timelineRange.end) {
      allDates.add(today.getTime());
    }

    // Сортируем даты и конвертируем обратно в объекты Date
    return Array.from(allDates)
      .sort((a, b) => a - b) // Сортируем по timestamp
      .map(timestamp => new Date(timestamp));
  }, [timelineRange, stages]);

  // Получаем уникальные месяцы для отображения
  const months = useMemo(() => {
    const monthSet = new Set<string>();
    dates.forEach(date => {
       // Добавляем месяц любой даты в списке
        monthSet.add(format(date, 'yyyy-MM'));
    });

    return Array.from(monthSet).map(monthStr => {
      const [year, month] = monthStr.split('-');
      return new Date(parseInt(year), parseInt(month) - 1, 1);
    });
  }, [dates]);

  return {
    timelineRange,
    dates,
    months,
  };
} 