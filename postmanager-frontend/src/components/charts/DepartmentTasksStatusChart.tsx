'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGetTasksQuery } from '@/store/api/task.api';
import { useGetUsersQuery, useGetUserByIdQuery } from '@/store/api/user.api';
import TasksStatsChart from './TasksStatsChart';

interface DepartmentTasksStatusChartProps {
    selectedWeek?: Date;
}

export default function DepartmentTasksStatusChart({ selectedWeek }: DepartmentTasksStatusChartProps) {
    const { userId } = useAuth();
    const { data: currentUser } = useGetUserByIdQuery(userId!, { skip: !userId });
    const departmentId = currentUser?.department?.id || currentUser?.departmentId;

    const { data: allTasks = [], isLoading, error } = useGetTasksQuery();
    const { data: allUsers = [] } = useGetUsersQuery();

    // Фильтруем пользователей отдела
    const departmentUsers = allUsers.filter(user =>
        user.departmentId === departmentId || user.department?.id === departmentId
    );

    // Фильтруем задачи отдела
    const departmentTasks = useMemo(() => {
        let filteredTasks = allTasks.filter(task => {
            if (task.assignees && task.assignees.length > 0) {
                return task.assignees.some(assignee =>
                    departmentUsers.some(user => user.id === assignee.userId)
                );
            }

            if (task.assigneeId) {
                const assigneeId = typeof task.assigneeId === 'string' ? parseInt(task.assigneeId) : task.assigneeId;
                return departmentUsers.some(user => user.id === assigneeId);
            }

            return false;
        });

        // Если выбрана неделя, фильтруем задачи по дате
        if (selectedWeek) {
            const weekStart = new Date(selectedWeek);
            const dayOfWeek = weekStart.getDay();
            
            // Вычисляем начало рабочей недели (понедельник)
            if (dayOfWeek === 0) { // Воскресенье
                weekStart.setDate(weekStart.getDate() + 1);
            } else if (dayOfWeek === 6) { // Суббота
                weekStart.setDate(weekStart.getDate() + 2);
            } else { // Рабочие дни
                weekStart.setDate(weekStart.getDate() - dayOfWeek + 1);
            }
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 4); // Пятница
            
            // Устанавливаем время для корректного сравнения
            weekStart.setHours(0, 0, 0, 0);
            weekEnd.setHours(23, 59, 59, 999);

            filteredTasks = filteredTasks.filter(task => {
                if (!task.createdAt) return false;
                
                const taskDate = new Date(task.createdAt);
                return taskDate <= weekEnd;
            });
        }

        return filteredTasks;
    }, [allTasks, departmentUsers, selectedWeek]);

    const hasError = error || !departmentId;

    // Формируем заголовок с информацией о неделе
    const getTitle = () => {
        if (selectedWeek) {
            const weekStart = new Date(selectedWeek);
            const dayOfWeek = weekStart.getDay();
            
            if (dayOfWeek === 0) {
                weekStart.setDate(weekStart.getDate() + 1);
            } else if (dayOfWeek === 6) {
                weekStart.setDate(weekStart.getDate() + 2);
            } else {
                weekStart.setDate(weekStart.getDate() - dayOfWeek + 1);
            }
            
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 4);
            
            const startFormatted = weekStart.toLocaleDateString('ru-RU', { 
                day: '2-digit', 
                month: 'short' 
            });
            const endFormatted = weekEnd.toLocaleDateString('ru-RU', { 
                day: '2-digit', 
                month: 'short' 
            });
            
            return `Статистика задач отдела (${startFormatted} - ${endFormatted})`;
        }
        return "Статистика задач отдела";
    };

    return (
        <TasksStatsChart
            tasks={departmentTasks}
            title={getTitle()}
            isLoading={isLoading}
            error={hasError ? "Ошибка при загрузке данных отдела" : null}
        />
    );
}
