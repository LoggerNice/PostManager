'use client';

import { useMemo, useState } from 'react';
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

export default function DepartmentTasksGanttChart() {
    const router = useRouter();
    const { currentUser, departmentId, departmentUsers, departmentTasks, isLoading } = useDepartmentTasks();
    
    // Состояние для модального окна
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Вычисляем общий период для задач отдела - только рабочая неделя
    const timelineData = useMemo<TimelineData>(() => {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0 = воскресенье, 1 = понедельник, ..., 6 = суббота
        
        // Определяем начало рабочей недели
        let startOfWeek: Date;
        
        if (dayOfWeek === 0) { // Воскресенье - показываем следующую неделю
            startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() + 1); // Следующий понедельник
        } else if (dayOfWeek === 6) { // Суббота - показываем следующую неделю
            startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() + 2); // Следующий понедельник
        } else { // Рабочие дни - показываем текущую неделю
            startOfWeek = new Date(today);
            startOfWeek.setDate(today.getDate() - dayOfWeek + 1); // Текущий понедельник
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
    }, []); // Убираем зависимость от departmentTasks, чтобы неделя не менялась при изменении задач

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
                actualEndDate = deadline;
            } else {
                // По умолчанию от создания до дедлайна
                actualStartDate = new Date(task.createdAt);
                actualEndDate = deadline;
            }

            // Для выполненных задач показываем их даже если они не пересекаются с текущей неделей
            // но ограничиваем их видимость разумными пределами
            if (task.status === 'COMPLETED') {
                // Показываем выполненные задачи за последние 2 недели
                const twoWeeksAgo = new Date();
                twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
                
                if (actualEndDate < twoWeeksAgo) return; // Слишком старые выполненные задачи не показываем
            } else {
                // Для незавершенных задач фильтруем по пересечению с текущей неделей
                if (actualEndDate < timelineData.timelineRange.start || actualStartDate > timelineData.timelineRange.end) return;
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
            Нет задач отдела для отображения на рабочей неделе (включая выполненные за последние 2 недели)
        </div>
    );

    // Высота адаптируется под количество уровней задач каждого пользователя
    const chartHeight = userTasksGroups.reduce((height, group) => {
        return height + Math.max(40, (group.maxLevel + 1) * 30) + 20;
    }, 120); // Увеличиваем высоту для заголовка
    const chartWidth = Math.max(1000, typeof window !== 'undefined' ? window.innerWidth - 100 : 1000);
    const leftMargin = 120; // Увеличиваем левый отступ для имен пользователей
    const dayWidth = (chartWidth - leftMargin - 50) / timelineData.timelineRange.totalDays;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg px-6 pb-6 shadow-lg w-full">
            <div className="w-full overflow-x-auto">
                <svg width={chartWidth} height={chartHeight} className="w-full">
                    {/* Заголовки дней */}
                    {timelineData.dates.map((date, index) => {
                        // Динамический расчет позиции - равномерно распределяем 5 дней по доступной ширине
                        const availableWidth = chartWidth - leftMargin - 50;
                        const daySpacing = availableWidth / 12; // 6 промежутков для 5 дней - более компактно
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
                                        const daySpacing = availableWidth / 12; // один день = одна доля ширины

                                        // Определяем, в какой день начинается и заканчивается задача
                                        const startDayIndex = Math.floor((taskStartTime - weekStartTime) / (24 * 60 * 60 * 1000));
                                        const endDayIndex = Math.floor((taskEndTime - weekStartTime) / (24 * 60 * 60 * 1000));

                                        // Ограничиваем индексы дня в пределах 0–4 (понедельник–пятница)
                                        const clampedStartDay = Math.max(0, Math.min(4, startDayIndex));
                                        const clampedEndDay = Math.max(0, Math.min(4, endDayIndex));

                                        // Позиция по X — начало и конец задачи в пикселях
                                        const startX = leftMargin + clampedStartDay * daySpacing;
                                        const endX = leftMargin + (clampedEndDay + 1) * daySpacing; // +1, чтобы задача покрывала весь день

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

                                                {/* Текст с названием задачи */}
                                                <text
                                                    x={actualStartX + 8}
                                                    y={taskY + 16}
                                                    className="text-xs fill-white font-medium"
                                                    style={{ pointerEvents: 'none' }}
                                                >
                                                    {task.title.length > 25 
                                                        ? `${task.title.substring(0, 25)}...` 
                                                        : task.title
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
