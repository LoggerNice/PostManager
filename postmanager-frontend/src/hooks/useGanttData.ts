import { useMemo } from 'react';
import { Task } from '@/types/task.types';
import { IUser } from '@/types/user.types';
import { GanttTask, UserTasksGroup, TimelineData } from '@/types/gantt.types';
import { assignLevelsToTasks, getTaskColor, isTaskOverlappingWeek } from '@/utils/ganttUtils';

export const useGanttData = (
    departmentTasks: Task[],
    departmentUsers: IUser[],
    timelineData: TimelineData
) => {
    return useMemo<UserTasksGroup[]>(() => {
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
                // Для завершенных задач используем реальную длительность от создания до дедлайна + 1 день
                actualStartDate = new Date(task.createdAt);
                actualStartDate.setDate(actualStartDate.getDate());
                actualEndDate = new Date(deadline);
                actualEndDate.setDate(actualEndDate.getDate());
            } else if (task.assignees && task.assignees.length > 0) {
                // Для задач с исполнителями берем дату назначения первого исполнителя
                actualStartDate = new Date(task.assignees[0].assignedAt);
                actualStartDate.setDate(actualStartDate.getDate());
                
                // Для просроченных задач показываем длину до текущего дня
                if (deadline < now) {
                    actualEndDate = now;
                } else {
                    // Для непросроченных задач добавляем длину до следующего дня
                    actualEndDate = new Date(deadline);
                    actualEndDate.setDate(actualEndDate.getDate() + 1);
                }
            } else {
                // По умолчанию от создания до дедлайна
                actualStartDate = new Date(task.createdAt);
                actualStartDate.setDate(actualStartDate.getDate());
                
                // Для просроченных задач показываем длину до текущего дня
                if (deadline < now) {
                    actualEndDate = now;
                } else {
                    // Для непросроченных задач добавляем длину до следующего дня
                    actualEndDate = new Date(deadline);
                    actualEndDate.setDate(actualEndDate.getDate());
                }
            }

            // Фильтруем задачи по пересечению с выбранной неделей
            const weekStart = timelineData.timelineRange.start;
            const weekEnd = timelineData.timelineRange.end;
            
            // Проверяем пересечение с неделей
            if (!isTaskOverlappingWeek(actualStartDate, actualEndDate, weekStart, weekEnd, task.status)) {
                return;
            }

            // Вычисляем цвет на основе статуса и времени до дедлайна
            const daysUntilEnd = Math.ceil((actualEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            const color = getTaskColor({ ...task, startDate: actualStartDate, endDate: actualEndDate, daysUntilEnd } as GanttTask, now);

            const ganttTask: GanttTask = {
                ...task,
                startDate: actualStartDate,
                endDate: actualEndDate,
                color,
                daysUntilEnd,
                level: 0, // Будет назначен позже
                progress: 0 // Оставляем для совместимости, но не используем
            };

            // Собираем всех уникальных исполнителей задачи
            const assignedUserIds = new Set<number>();
            
            // Добавляем исполнителей из массива assignees
            if (task.assignees && task.assignees.length > 0) {
                task.assignees.forEach(assignee => {
                    assignedUserIds.add(assignee.userId);
                });
            }
            
            // Добавляем единичного исполнителя из assigneeId
            if (task.assigneeId) {
                const assigneeId = typeof task.assigneeId === 'string' ? parseInt(task.assigneeId) : task.assigneeId;
                assignedUserIds.add(assigneeId);
            }
            
            // Добавляем задачу только один раз для каждого уникального исполнителя
            assignedUserIds.forEach(userId => {
                if (departmentUsers.some(user => user.id === userId)) {
                    if (!userTasksMap.has(userId)) {
                        userTasksMap.set(userId, []);
                    }
                    userTasksMap.get(userId)!.push(ganttTask);
                }
            });
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
};
