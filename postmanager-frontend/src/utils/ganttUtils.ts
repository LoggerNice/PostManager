import { GanttTask, TimelineData } from '@/types/gantt.types';

// Алгоритм размещения пересекающихся задач на разных уровнях
export const assignLevelsToTasks = (tasks: GanttTask[]): GanttTask[] => {
    const sortedTasks = [...tasks].sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    const levels: { endTime: number; level: number }[] = [];
    
    return sortedTasks.map(task => {
        const startTime = task.startDate.getTime();
        
        // Найти первый свободный уровень
        let level = 0;
        for (let i = 0; i < levels.length; i++) {
            if (levels[i].endTime <= startTime) {
                level = levels[i].level;
                levels[i] = { endTime: task.endDate.getTime(), level };
                break;
            }
        }
        
        // Если не нашли свободный уровень, создаем новый
        if (level === 0 && levels.length > 0) {
            level = Math.max(...levels.map(l => l.level)) + 1;
            levels.push({ endTime: task.endDate.getTime(), level });
        } else if (levels.length === 0) {
            levels.push({ endTime: task.endDate.getTime(), level: 0 });
        }
        
        return { ...task, level };
    });
};

// Вычисляем общий период для задач отдела - только рабочая неделя
export const calculateTimelineData = (selectedWeek?: Date): TimelineData => {
    const baseDate = selectedWeek || new Date();
    const dayOfWeek = baseDate.getDay(); // 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
    
    // Определяем начало рабочей недели
    let startOfWeek: Date;
    
    if (dayOfWeek === 0) { // Воскресенье - показываем следующую неделю
        startOfWeek = new Date(baseDate);
        startOfWeek.setDate(baseDate.getDate() + 1); // Следующий понедельник
    } else if (dayOfWeek === 6) { // Суббота - показываем следующую неделю
        startOfWeek = new Date(baseDate);
        startOfWeek.setDate(baseDate.getDate() + 2); // Следующий понедельник
    } else { // Рабочие дни - показываем текущую неделю
        startOfWeek = new Date(baseDate);
        startOfWeek.setDate(baseDate.getDate() - dayOfWeek + 1); // Текущий понедельник
    }
    
    // Конец рабочей недели (пятница)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 4); // Пятница (5 дней: пн, вт, ср, чт, пт)
    
    // Добавляем пустые столбцы: воскресенье перед понедельником и суббота после пятницы
    const totalDays = 7; // 7 дней: вс, пн, вт, ср, чт, пт, сб
    
    // Генерируем даты для оси X (включая воскресенье и субботу)
    const allDates = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i - 1); // -1 чтобы начать с воскресенья
        allDates.push(date);
    }
    
    // Получаем месяц для заголовка
    const month = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), 1);
    
    return {
        timelineRange: { start: startOfWeek, end: endOfWeek, totalDays },
        dates: allDates,
        months: [month]
    };
};

// Определение цвета задачи на основе статуса и времени до дедлайна
export const getTaskColor = (task: GanttTask, now: Date): 'green' | 'red' | 'yellow' | 'white' => {
    if (task.status === 'COMPLETED') {
        return 'green';
    } else if (task.endDate < now) {
        return 'red';
    } else if (task.daysUntilEnd <= 1) {
        return 'red';
    } else if (task.daysUntilEnd <= 2) {
        return 'yellow';
    } else {
        return 'white';
    }
};

// Проверка пересечения задачи с выбранной неделей
export const isTaskOverlappingWeek = (
    taskStartDate: Date, 
    taskEndDate: Date, 
    weekStart: Date, 
    weekEnd: Date,
    taskStatus: string
): boolean => {
    // Проверяем пересечение с неделей
    const taskStartsInWeek = taskStartDate >= weekStart && taskStartDate <= weekEnd;
    const taskEndsInWeek = taskEndDate >= weekStart && taskEndDate <= weekEnd;
    const taskCrossesWeek = taskStartDate < weekStart && taskEndDate > weekEnd;
    const taskOverlapsWeek = (taskStartDate <= weekEnd && taskEndDate >= weekStart);
    
    // Если задача не пересекается с неделей и не является незавершенной задачей, созданной ранее
    return taskOverlapsWeek || (taskStatus !== 'COMPLETED' && taskStartDate < weekStart);
};

// Вычисление позиции и размеров задачи на диаграмме
export const calculateTaskPosition = (
    task: GanttTask,
    timelineData: TimelineData,
    dimensions: { leftMargin: number; chartWidth: number; availableWidth: number }
) => {
    const { leftMargin, chartWidth, availableWidth } = dimensions;
    
    const taskStartTime = task.startDate.getTime();
    const taskEndTime = task.endDate.getTime();
    const weekStartTime = timelineData.timelineRange.start.getTime();
    
    // 7 дней (вс, пн, вт, ср, чт, пт, сб) => 7 промежутков
    const daySpacing = availableWidth / 7; // один день = одна доля ширины
    
    // Определяем, в какой день начинается и заканчивается задача
    let startDayIndex = Math.floor((taskStartTime - weekStartTime) / (24 * 60 * 60 * 1000));
    const endDayIndex = Math.floor((taskEndTime - weekStartTime) / (24 * 60 * 60 * 1000));
    
    // Определяем, начинается ли задача раньше недели и заканчивается ли после
    const startsBeforeWeek = task.startDate < timelineData.timelineRange.start;
    const endsAfterWeek = task.endDate > timelineData.timelineRange.end;
    
    let startX: number;
    let endX: number;
    
    if (startsBeforeWeek && endsAfterWeek) {
        // Задача охватывает всю неделю - показываем в столбце воскресенья
        startX = leftMargin + 0 * daySpacing; // Воскресенье
        endX = leftMargin + 6 * daySpacing;   // Суббота
    } else if (startsBeforeWeek) {
        // Задача начинается до недели - показываем от воскресенья до конца задачи
        startX = leftMargin + 0 * daySpacing; // Воскресенье
        const clampedEndDay = Math.max(1, Math.min(5, endDayIndex + 1)); // Ограничиваем рабочими днями
        endX = leftMargin + clampedEndDay * daySpacing;
    } else if (endsAfterWeek) {
        // Задача заканчивается после недели - показываем от начала задачи до субботы
        const clampedStartDay = Math.max(1, Math.min(5, startDayIndex + 1)); // Ограничиваем рабочими днями
        startX = leftMargin + clampedStartDay * daySpacing;
        endX = leftMargin + 6 * daySpacing;   // Суббота
    } else {
        // Задача полностью в пределах недели - обычная логика
        const clampedStartDay = Math.max(1, Math.min(5, startDayIndex + 1));
        const clampedEndDay = Math.max(1, Math.min(5, endDayIndex + 1));
        startX = leftMargin + clampedStartDay * daySpacing;
        endX = leftMargin + clampedEndDay * daySpacing;
    }
    
    // Адаптивный правый отступ
    const rightMargin = Math.max(20, Math.min(50, chartWidth * 0.05)); // 5% от ширины, минимум 20px
    
    // Ограничиваем позиции в пределах графика
    const actualStartX = Math.max(startX, leftMargin);
    const actualEndX = Math.min(endX, chartWidth - rightMargin);
    
    // Ширина задачи (минимум 60px)
    const barWidth = Math.max(actualEndX - actualStartX, 60);
    
    return {
        startX: actualStartX,
        endX: actualEndX,
        barWidth,
        startsBeforeWeek,
        endsAfterWeek,
        daySpacing
    };
};
