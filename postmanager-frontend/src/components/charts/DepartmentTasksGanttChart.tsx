'use client';

import { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useDepartmentTasks } from '@/hooks/useDepartmentTasks';
import { Task } from '@/types/task.types';
import { IUser } from '@/types/user.types';
import TaskDetailsModal from '../projectComponents/task/TaskDetailsModal';
import { formatName } from './DepartmentTasksExcelExport';

interface GanttTask extends Task {
    startDate: Date;
    endDate: Date;
    color: 'green' | 'red' | 'yellow' | 'white';
    daysUntilEnd: number;
    level: number; // Уровень для размещения пересекающихся задач
    progress: number; // Прогресс выполнения задачи
}

interface UserTasksGroup {
    user: IUser;
    tasks: GanttTask[];
    maxLevel: number; // Максимальный уровень задач для пользователя
}

interface TimelineData {
    timelineRange: { start: Date; end: Date; totalDays: number };
    dates: Date[];
    months: Date[];
}

interface DepartmentTasksGanttChartProps {
    selectedWeek?: Date;
}

export default function DepartmentTasksGanttChart({ selectedWeek }: DepartmentTasksGanttChartProps) {
    const router = useRouter();
    const { currentUser, departmentId, departmentUsers, departmentTasks, isLoading } = useDepartmentTasks();
    
    // Состояния для размеров
    const [containerWidth, setContainerWidth] = useState(0);
    const [chartHeight, setChartHeight] = useState(400);
    
    // Состояние для модального окна
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Константы
    const leftMargin = 120;
    const rightMargin = 100;
    const rowHeight = 30;
    const headerHeight = 80;

    // Получаем ссылку на контейнер для измерения ширины
    const containerRef = useRef<HTMLDivElement>(null);

    // Измеряем ширину контейнера при монтировании и изменении размера окна
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    // Вычисляем общий период для задач отдела - только рабочая неделя
    const timelineData = useMemo<TimelineData>(() => {
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
        
        const totalDays = 5; // Только рабочие дни
        
        // Генерируем даты для оси X (только рабочие дни)
        const workDates = [];
        for (let i = 0; i < 5; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            workDates.push(date);
        }
        
        // Получаем месяц для заголовка
        const month = new Date(startOfWeek.getFullYear(), startOfWeek.getMonth(), 1);
        
        return {
            timelineRange: { start: startOfWeek, end: endOfWeek, totalDays },
            dates: workDates,
            months: [month]
        };
    }, [selectedWeek]); // Добавляем зависимость от selectedWeek

    // Алгоритм размещения пересекающихся задач на разных уровнях
    const assignLevelsToTasks = (tasks: GanttTask[]): GanttTask[] => {
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

    // Процессируем данные задач для диаграммы
    const userTasksGroups = useMemo<UserTasksGroup[]>(() => {
        const now = new Date();

        // Группируем задачи по пользователям
        const userTasksMap = new Map<number, GanttTask[]>();

        departmentTasks.forEach((task) => {
            if (!task.deadline) return;

            const deadline = new Date(task.deadline);
            
            // Динамическое определение даты начала в зависимости от статуса
            let actualStartDate: Date;
            let actualEndDate: Date;
            
                         // Определяем начальную дату на основе статуса задачи
             if (task.status === 'COMPLETED') {
                 // Для завершенных задач используем deadline как конечную дату
                 // и показываем их как короткие задачи (1 день) для видимости
                 actualStartDate = new Date(deadline);
                 actualStartDate.setDate(actualStartDate.getDate() - 1); // Показываем как 1-дневную задачу
                 actualEndDate = deadline;
             } else if (task.assignees && task.assignees.length > 0) {
                 // Для задач с исполнителями берем дату назначения первого исполнителя
                 actualStartDate = new Date(task.assignees[0].assignedAt);
                 
                 // Для просроченных задач показываем длину до текущего дня
                 if (deadline < now) {
                     actualEndDate = now;
                 } else {
                     actualEndDate = deadline;
                 }
             } else {
                 // По умолчанию от создания до дедлайна
                 actualStartDate = new Date(task.createdAt);
                 
                 // Для просроченных задач показываем длину до текущего дня
                 if (deadline < now) {
                     actualEndDate = now;
                 } else {
                     actualEndDate = deadline;
                 }
             }

                         // Фильтруем задачи по пересечению с выбранной неделей
             // Показываем задачи, которые:
             // 1. Завершаются в выбранной неделе, ИЛИ
             // 2. Начинаются в выбранной неделе, ИЛИ  
             // 3. Пересекают выбранную неделю (начало раньше, конец позже), ИЛИ
             // 4. Не завершены и были созданы ранее (показываем от начала недели)
             const weekStart = timelineData.timelineRange.start;
             const weekEnd = timelineData.timelineRange.end;
             
             // Проверяем пересечение с неделей
             const taskStartsInWeek = actualStartDate >= weekStart && actualStartDate <= weekEnd;
             const taskEndsInWeek = actualEndDate >= weekStart && actualEndDate <= weekEnd;
             const taskCrossesWeek = actualStartDate < weekStart && actualEndDate > weekEnd;
             const taskOverlapsWeek = (actualStartDate <= weekEnd && actualEndDate >= weekStart);
             
             // Если задача не пересекается с неделей и не является незавершенной задачей, созданной ранее
             if (!taskOverlapsWeek && !(task.status !== 'COMPLETED' && actualStartDate < weekStart)) {
                 return;
             }

            // Вычисляем цвет на основе статуса и времени до дедлайна
            const daysUntilEnd = Math.ceil((actualEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            let color: 'green' | 'red' | 'yellow' | 'white';
            
            if (task.status === 'COMPLETED') {
                // Выполненные задачи - зеленый
                color = 'green';
            } else if (actualEndDate < now) {
                // Просроченные задачи - красный
                color = 'red';
            } else if (daysUntilEnd <= 1) {
                // Критично срочные - красный
                color = 'red';
            } else if (daysUntilEnd <= 2) {
                // Срочные - желтый
                color = 'yellow';
            } else {
                // Обычные - белый/серый
                color = 'white';
            }

            const ganttTask: GanttTask = {
                ...task,
                startDate: actualStartDate,
                endDate: actualEndDate,
                color,
                daysUntilEnd,
                level: 0, // Будет назначен позже
                progress: 0 // Оставляем для совместимости, но не используем
            };

            // Задача с исполнителями (assignees)
            if (task.assignees && task.assignees.length > 0) {
                task.assignees.forEach(assignee => {
                    const userId = assignee.userId;
                    if (departmentUsers.some(user => user.id === userId)) {
                        if (!userTasksMap.has(userId)) {
                            userTasksMap.set(userId, []);
                        }
                        userTasksMap.get(userId)!.push(ganttTask);
                    }
                });
            }
            
            // Задача с единичным исполнителем
            if (task.assigneeId) {
                const assigneeId = typeof task.assigneeId === 'string' ? parseInt(task.assigneeId) : task.assigneeId;
                if (departmentUsers.some(user => user.id === assigneeId)) {
                    if (!userTasksMap.has(assigneeId)) {
                        userTasksMap.set(assigneeId, []);
                    }
                    userTasksMap.get(assigneeId)!.push(ganttTask);
                }
            }
        });

        // Создаем группы пользователей с их задачами и назначаем уровни
        return departmentUsers.map(user => {
            const userTasks = userTasksMap.get(user.id) || [];
            const tasksWithLevels = assignLevelsToTasks(userTasks);
            const maxLevel = tasksWithLevels.length > 0 ? Math.max(...tasksWithLevels.map(t => t.level)) : 0;
            
            return {
                user,
                tasks: tasksWithLevels,
                maxLevel
            };
        }).filter(group => group.tasks.length > 0); // Показываем только пользователей с задачами
    }, [departmentTasks, departmentUsers, timelineData]);

    // Вычисляем динамические размеры
    const { chartWidth, availableWidth } = useMemo(() => {
        const width = containerWidth || 800;
        const chartWidth = width - 32; // Убираем отступы контейнера
        
        const availableWidth = chartWidth - leftMargin - 50; // 50px для правого отступа

        return {
            chartWidth,
            availableWidth
        };
    }, [containerWidth, leftMargin]);

    // Вычисляем высоту диаграммы динамически
    useEffect(() => {
        const totalUsers = userTasksGroups.length;
        
        const maxLevels = userTasksGroups.length > 0 
            ? Math.max(...userTasksGroups.map(group => group.maxLevel + 1), 1)
            : 1;
            
        const calculatedHeight = headerHeight + (totalUsers * (maxLevels * rowHeight + 40)) + 80;
        setChartHeight(Math.max(calculatedHeight, 400));
    }, [userTasksGroups, headerHeight, rowHeight]);

    const handleTaskClick = (task: GanttTask) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleTaskUpdate = (taskId: string, updatedTask: Task) => {
        // Обновляем задачу в локальном состоянии
        // Здесь можно добавить логику обновления, если потребуется
        console.log('Task updated:', updatedTask);
        
        // Закрываем модальное окно после обновления
        setIsModalOpen(false);
        setSelectedTask(null);
    };

    if (isLoading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!departmentId) return (
        <div className="text-gray-500 text-center p-4">
            Информация об отделе пользователя недоступна
        </div>
    );

    if (userTasksGroups.length === 0) return (
        <div className="text-gray-500 text-center p-4">
            Нет задач отдела для отображения на выбранной рабочей неделе
        </div>
    );



    return (
        <div 
            ref={containerRef}
            className="bg-white dark:bg-gray-800 rounded-lg px-6 pb-6 shadow-lg w-full"
        >
            
            
            <div className="w-full">
                <svg 
                    width={chartWidth} 
                    height={chartHeight} 
                    className="w-full min-w-full"
                    style={{ minWidth: `${chartWidth}px` }}
                >
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
                                 <text
                                     x={leftMargin + position}
                                     y={50}
                                     className={`text-xs ${
                                         isToday ? 'font-bold fill-blue-500' :
                                         isFriday ? 'font-medium fill-gray-600 dark:fill-gray-400' :
                                         'fill-gray-500 dark:fill-gray-500'
                                     }`}
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

                    {/* Пользователи и их задачи */}
                    {(() => {
                        let currentY = 80;
                        return userTasksGroups.map((userGroup, groupIndex) => {
                            const sectionHeight = Math.max(40, (userGroup.maxLevel + 1) * 30);
                            const userY = currentY;
                            currentY += sectionHeight + 20;
                            
                            return (
                                <g key={userGroup.user.id}>
                                    {/* Горизонтальная разделительная линия (кроме первого пользователя) */}
                                    {groupIndex > 0 && (
                                        <line
                                            x1={0}
                                            y1={userY - 10}
                                            x2={chartWidth}
                                            y2={userY - 10}
                                            stroke="#d1d5db"
                                            strokeWidth={1}
                                            opacity={0.6}
                                            className="dark:stroke-gray-600"
                                        />
                                    )}
                                    
                                    {/* Имя пользователя */}
                                    <text
                                        x={leftMargin - 10}
                                        y={userY + 20}
                                        textAnchor="end"
                                        className="text-sm fill-gray-700 dark:fill-gray-200 font-medium"
                                    >
                                        {formatName(userGroup.user.name)}
                                    </text>
                                    
                                                                         {/* Задачи пользователя */}
                                     {userGroup.tasks.map((task) => {
                                         const taskStartTime = task.startDate.getTime();
                                         const taskEndTime = task.endDate.getTime();

                                         // Начало и конец недели
                                         const weekStartTime = timelineData.timelineRange.start.getTime();
                                         const weekEndTime = timelineData.timelineRange.end.getTime();

                                         // Доступная ширина диаграммы
                                         const availableWidth = chartWidth - leftMargin - 50;

                                         // 5 рабочих дней => 6 промежутков (между 5 днями)
                                         const daySpacing = availableWidth / 5; // один день = одна доля ширины

                                         // Определяем, в какой день начинается и заканчивается задача
                                         // Для задач, созданных ранее недели, показываем от начала недели
                                         let startDayIndex = Math.floor((taskStartTime - weekStartTime) / (24 * 60 * 60 * 1000));
                                         const endDayIndex = Math.floor((taskEndTime - weekStartTime) / (24 * 60 * 60 * 1000));

                                         // Если задача начинается раньше недели, показываем её от начала недели
                                         if (startDayIndex < 0) {
                                             startDayIndex = 0;
                                         }

                                         // Ограничиваем индексы дня в пределах 0–4 (понедельник–пятница)
                                         const clampedStartDay = Math.max(0, Math.min(4, startDayIndex));
                                         const clampedEndDay = Math.max(0, Math.min(4, endDayIndex));

                                         // Позиция по X — начало и конец задачи в пикселях
                                         const startX = leftMargin + clampedStartDay * daySpacing;
                                         const endX = leftMargin + clampedEndDay * daySpacing; // Позиция конца задачи

                                         // Ограничиваем позиции в пределах графика
                                         const actualStartX = Math.max(startX, leftMargin);
                                         const actualEndX = Math.min(endX, chartWidth - 50);

                                         // Ширина задачи (минимум 60px)
                                         const barWidth = Math.max(actualEndX - actualStartX, 60);

                                         // Вертикальная позиция задачи
                                         const taskY = userY + 5 + task.level * 30;

                                                                                 // Цвета для разных статусов
                                         const colorMap = {
                                             green: '#22c55e',
                                             red: '#ef4444',
                                             yellow: '#eab308', 
                                             white: '#6b7280'
                                         };

                                         // Более темные цвета для border
                                         const borderColorMap = {
                                             green: '#16a34a',
                                             red: '#dc2626',
                                             yellow: '#d97706', 
                                             white: '#4b5563'
                                         };

                                         // Определяем, начинается ли задача раньше недели
                                         const startsBeforeWeek = task.startDate < timelineData.timelineRange.start;

                                        return (
                                            <g key={task.id}>
                                                                                                 {/* Полоса задачи */}
                                                 <rect
                                                     x={actualStartX}
                                                     y={taskY}
                                                     width={barWidth}
                                                     height={24}
                                                     fill={colorMap[task.color]}
                                                     stroke={borderColorMap[task.color]}
                                                     strokeWidth={2}
                                                     opacity={0.8}
                                                     rx={4}
                                                     className="cursor-pointer hover:opacity-100 transition-all duration-200"
                                                     onClick={() => handleTaskClick(task)}
                                                 />
                                                 
                                                 {/* Если задача начинается раньше недели, показываем пунктирную линию слева */}
                                                 {startsBeforeWeek && (
                                                     <line
                                                         x1={leftMargin}
                                                         y1={taskY + 12}
                                                         x2={actualStartX}
                                                         y2={taskY + 12}
                                                         stroke={borderColorMap[task.color]}
                                                         strokeWidth={2}
                                                         strokeDasharray="5,5"
                                                         opacity={0.6}
                                                     />
                                                 )}

                                                {/* Текст с названием задачи */}
                                                                                                 <text
                                                     x={actualStartX + 8}
                                                     y={taskY + 16}
                                                     className="text-xs fill-white font-medium"
                                                     style={{ 
                                                         pointerEvents: 'none',
                                                         maxWidth: `${Math.max(barWidth - 16, 0)}px`,
                                                         overflow: 'hidden'
                                                     }}
                                                 >
                                                     {task.title?.length > 25 
                                                         ? `${task.title.substring(0, 25)}...` 
                                                         : task.title || 'Без названия'
                                                     }
                                                 </text>
                                            </g>
                                        );
                                    })}
                                </g>
                            );
                        });
                    })()}
                </svg>
            </div>

                         {/* Легенда статусов задач */}
             <div className="mt-4">
                 <div className="flex justify-start flex-wrap gap-4">
                     <div className="flex items-center space-x-2">
                         <div className="w-4 h-4 bg-green-500 rounded"></div>
                         <span className="text-sm text-gray-600 dark:text-gray-300">Выполнено</span>
                     </div>
                     <div className="flex items-center space-x-2">
                         <div className="w-4 h-4 bg-red-500 rounded"></div>
                         <span className="text-sm text-gray-600 dark:text-gray-300">Просрочено</span>
                     </div>
                     <div className="flex items-center space-x-2">
                         <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                         <span className="text-sm text-gray-600 dark:text-gray-300">До дедлайна ≤ 2 дня</span>
                     </div>
                     <div className="flex items-center space-x-2">
                         <div className="w-4 h-4 bg-gray-500 rounded"></div>
                         <span className="text-sm text-gray-600 dark:text-gray-300">Обычные задачи</span>
                     </div>
                 </div>
             </div>
            
            {/* Модальное окно с информацией о задаче */}
            {selectedTask && (
                <TaskDetailsModal
                    task={selectedTask}
                    visible={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedTask(null);
                    }}
                    onTaskUpdate={handleTaskUpdate}
                />
            )}
        </div>
    );
}