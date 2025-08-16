'use client';

import { useMemo } from 'react';
import { useGetTasksQuery } from '@/store/api/task.api';
import { useGetDepartmentsQuery } from '@/store/api/department.api';
import { useGetUsersQuery } from '@/store/api/user.api';

interface DepartmentStats {
    id: number;
    name: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
}

export default function DepartmentTasksStats() {
    const { data: tasks = [], isLoading: tasksLoading } = useGetTasksQuery();
    const { data: departments = [], isLoading: departmentsLoading } = useGetDepartmentsQuery();
    const { data: users = [], isLoading: usersLoading } = useGetUsersQuery();

    const departmentStats = useMemo<DepartmentStats[]>(() => {
        console.log('DepartmentTasksStats DEBUG:', {
            tasksCount: tasks.length,
            departmentsCount: departments.length,
            usersCount: users.length
        });

        if (tasks.length === 0 || departments.length === 0 || users.length === 0) return [];

        return departments.map(department => {
            console.log(`Processing department: ${department.name} (ID: ${department.id})`);
            
            // Находим всех пользователей этого отдела
            const departmentUsers = users.filter(user => 
                user.departmentId === department.id || user.department?.id === department.id
            );
            
            console.log(`Users in department ${department.name}:`, departmentUsers.map(u => u.name));
            
            // Получаем все задачи, назначенные пользователям этого отдела
            const departmentTasks = tasks.filter(task => {
                // Проверяем задачи через assignees (многие-ко-многим)
                if (task.assignees && task.assignees.length > 0) {
                    const hasAssigneeFromDepartment = task.assignees.some(assignee => 
                        departmentUsers.some(user => user.id === assignee.userId)
                    );
                    if (hasAssigneeFromDepartment) {
                        console.log(`Task "${task.title}" assigned to department ${department.name} user`);
                        return true;
                    }
                }
                
                // Также проверяем основного assignee (для обратной совместимости)
                if (task.assignee) {
                    const assigneeId = typeof task.assignee.id === 'string' ? parseInt(task.assignee.id) : task.assignee.id;
                    const isFromDepartment = departmentUsers.some(user => user.id === assigneeId);
                    if (isFromDepartment) {
                        console.log(`Task "${task.title}" assigned to department ${department.name} user (single assignee)`);
                        return true;
                    }
                }
                
                // Проверяем assigneeId напрямую
                if (task.assigneeId) {
                    const assigneeId = typeof task.assigneeId === 'string' ? parseInt(task.assigneeId) : task.assigneeId;
                    const isFromDepartment = departmentUsers.some(user => user.id === assigneeId);
                    if (isFromDepartment) {
                        console.log(`Task "${task.title}" assigned to department ${department.name} user (assigneeId)`);
                        return true;
                    }
                }
                
                return false;
            });

            const totalTasks = departmentTasks.length;
            const completedTasks = departmentTasks.filter(task => task.status === 'COMPLETED').length;
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            console.log(`Department ${department.name} stats:`, { totalTasks, completedTasks, completionRate });

            return {
                id: department.id,
                name: department.name,
                totalTasks,
                completedTasks,
                completionRate
            };
        }).sort((a, b) => b.completionRate - a.completionRate);
    }, [tasks, departments, users]);

    if (tasksLoading || departmentsLoading || usersLoading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (departmentStats.length === 0) return (
        <div className="text-gray-500 text-center p-4">
            Нет данных по отделам
        </div>
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Статистика по отделам
            </h3>
            
            <div className="space-y-4">
                {departmentStats.map(stat => (
                    <div key={stat.id} className="border-b border-gray-200 dark:border-gray-600 pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                                {stat.name}
                            </h4>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {stat.completedTasks} из {stat.totalTasks}
                            </span>
                        </div>
                        
                        {/* Прогресс бар */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                            <div 
                                className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${stat.completionRate}%` }}
                            ></div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-300">
                                Завершено: {stat.completionRate}%
                            </span>
                            <span className={`font-medium ${
                                stat.completionRate >= 80 
                                    ? 'text-green-600 dark:text-green-400'
                                    : stat.completionRate >= 50
                                    ? 'text-yellow-600 dark:text-yellow-400'
                                    : 'text-red-600 dark:text-red-400'
                            }`}>
                                {stat.completionRate >= 80 
                                    ? 'Отлично' 
                                    : stat.completionRate >= 50
                                    ? 'Хорошо'
                                    : 'Требует внимания'
                                }
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
