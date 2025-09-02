'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGetTasksQuery } from '@/store/api/task.api';
import { useGetUsersQuery, useGetUserByIdQuery } from '@/store/api/user.api';
import TasksStatsChart from './TasksStatsChart';

export default function DepartmentTasksStatusChart() {
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
        return allTasks.filter(task => {
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
    }, [allTasks, departmentUsers]);

    const hasError = error || !departmentId;

    return (
        <TasksStatsChart
            tasks={departmentTasks}
            title="Статистика задач отдела"
            isLoading={isLoading}
            error={hasError ? "Ошибка при загрузке данных отдела" : null}
        />
    );
}
