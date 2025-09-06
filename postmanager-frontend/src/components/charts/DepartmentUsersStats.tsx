'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useGetTasksQuery } from '@/store/api/task.api';
import { useGetUsersQuery, useGetUserByIdQuery } from '@/store/api/user.api';
import { IUser } from '@/types/user.types';

interface UserStats {
    id: number;
    name: string;
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
}

interface DepartmentUsersStatsProps {
    selectedWeek?: Date;
}

export default function DepartmentUsersStats({ selectedWeek }: DepartmentUsersStatsProps) {
    const { userId } = useAuth();
    const { data: currentUser } = useGetUserByIdQuery(userId!, { skip: !userId });
    const departmentId = currentUser?.department?.id || currentUser?.departmentId;
    
    const { data: allTasks = [], isLoading: tasksLoading } = useGetTasksQuery();
    const { data: allUsers = [], isLoading: usersLoading } = useGetUsersQuery();

    // Фильтруем пользователей отдела (исключаем начальника отдела)
    const departmentUsers = useMemo(() => {
        return allUsers.filter(user => 
            (user.departmentId === departmentId || user.department?.id === departmentId) &&
            user.role !== 'MANAGER' // Исключаем начальника отдела
        );
    }, [allUsers, departmentId]);

    const userStats = useMemo<UserStats[]>(() => {
        if (allTasks.length === 0 || departmentUsers.length === 0) return [];

        return departmentUsers.map(user => {
            // Получаем все задачи пользователя
            let userTasks = allTasks.filter(task => {
                // Проверяем через assignees (многие-ко-многим)
                if (task.assignees && task.assignees.length > 0) {
                    const hasUserAssigned = task.assignees.some(assignee => 
                        assignee.userId === user.id
                    );
                    if (hasUserAssigned) return true;
                }
                
                // Проверяем через assigneeId (для обратной совместимости)
                if (task.assigneeId) {
                    const assigneeId = typeof task.assigneeId === 'string' ? parseInt(task.assigneeId) : task.assigneeId;
                    if (assigneeId === user.id) return true;
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

                userTasks = userTasks.filter(task => {
                    if (!task.createdAt) return false;
                    
                    const taskDate = new Date(task.createdAt);
                    return taskDate >= weekStart && taskDate <= weekEnd;
                });
            }

            const totalTasks = userTasks.length;
            const completedTasks = userTasks.filter(task => task.status === 'COMPLETED').length;
            const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

            return {
                id: user.id,
                name: user.name,
                totalTasks,
                completedTasks,
                completionRate
            };
        }).sort((a, b) => b.completionRate - a.completionRate);
    }, [allTasks, departmentUsers, selectedWeek]);

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
            
            return `Статистика по сотрудникам отдела (${startFormatted} - ${endFormatted})`;
        }
        return "Статистика по сотрудникам отдела";
    };

    if (tasksLoading || usersLoading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!departmentId) return (
        <div className="text-red-500 text-center p-4">
            Информация об отделе недоступна
        </div>
    );

    if (userStats.length === 0) return (
        <div className="text-gray-500 text-center p-4">
            Нет данных по сотрудникам отдела
        </div>
    );

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {getTitle()}
            </h3>
            
            <div className="space-y-4">
                {userStats.map(stat => (
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
                                    : stat.totalTasks === 0
                                    ? 'Нет задач'
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
