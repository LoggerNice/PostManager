import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGetTasksQuery } from '@/store/api/task.api';
import { useGetUsersQuery } from '@/store/api/user.api';
import { Task } from '@/types/task.types';

export const useDepartmentTasks = () => {
    const { userId } = useAuth();
    const { data: allTasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useGetTasksQuery();
    const { data: allUsers = [], isLoading: usersLoading, refetch: refetchUsers } = useGetUsersQuery();

    // Получаем текущего пользователя и его отдел
    const currentUser = allUsers.find(user => user.id === userId);
    const departmentId = currentUser?.department?.id || currentUser?.departmentId;

    // Фильтруем пользователей отдела (исключаем начальника отдела)
    const departmentUsers = useMemo(() => {
        if (!departmentId) return [];
        
        return allUsers.filter(user => 
            (user.departmentId === departmentId || user.department?.id === departmentId) &&
            user.role !== 'MANAGER' && 
            user.role !== 'HEAD'
        );
    }, [allUsers, departmentId]);

    // Фильтруем задачи отдела
    const departmentTasks = useMemo(() => {
        if (!departmentId || departmentUsers.length === 0) return [];
        
        return allTasks.filter(task => {
            // Проверяем через assignees
            if (task.assignees && task.assignees.length > 0) {
                return task.assignees.some(assignee => 
                    departmentUsers.some(user => user.id === assignee.userId)
                );
            }
            
            // Проверяем через assigneeId
            if (task.assigneeId) {
                const assigneeId = typeof task.assigneeId === 'string' ? parseInt(task.assigneeId) : task.assigneeId;
                return departmentUsers.some(user => user.id === assigneeId);
            }
            
            return false;
        });
    }, [allTasks, departmentUsers, departmentId]);

    return {
        currentUser,
        departmentId,
        departmentUsers,
        departmentTasks,
        isLoading: tasksLoading || usersLoading,
        refetchTasks,
        refetchUsers
    };
};
