'use client';

import { useMemo } from 'react';
import { useGetTasksQuery } from '@/store/api/task.api';

export default function TasksStatusChart() {
    const { data: tasks = [], isLoading, error } = useGetTasksQuery();

    const taskStats = useMemo(() => {
        const now = new Date();
        
        const completed = tasks.filter(task => task.status === 'COMPLETED').length;
        const overdue = tasks.filter(task => {
            if (!task.deadline) return false;
            const deadline = new Date(task.deadline);
            return deadline < now && task.status !== 'COMPLETED';
        }).length;
        const inProgress = tasks.filter(task => 
            task.status === 'IN_PROGRESS' || task.status === 'PROBLEM'
        ).length;
        
        const total = completed + overdue + inProgress;
        
        return {
            completed,
            overdue,
            inProgress,
            total,
            completedPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
            overduePercent: total > 0 ? Math.round((overdue / total) * 100) : 0,
            inProgressPercent: total > 0 ? Math.round((inProgress / total) * 100) : 0
        };
    }, [tasks]);

    if (isLoading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return (
        <div className="text-red-500 text-center p-4">
            Ошибка при загрузке данных задач
        </div>
    );

    const chartSize = 200;
    const centerX = chartSize / 2;
    const centerY = chartSize / 2;
    const radius = 80;

    // Расчет углов для pie chart
    const completedAngle = (taskStats.completed / taskStats.total) * 360;
    const overdueAngle = (taskStats.overdue / taskStats.total) * 360;
    const inProgressAngle = (taskStats.inProgress / taskStats.total) * 360;

    // Функция для создания path для сектора pie chart
    const createPath = (startAngle: number, endAngle: number) => {
        const startAngleRad = (startAngle * Math.PI) / 180;
        const endAngleRad = (endAngle * Math.PI) / 180;
        
        const x1 = centerX + radius * Math.cos(startAngleRad);
        const y1 = centerY + radius * Math.sin(startAngleRad);
        const x2 = centerX + radius * Math.cos(endAngleRad);
        const y2 = centerY + radius * Math.sin(endAngleRad);
        
        const largeArc = endAngle - startAngle > 180 ? 1 : 0;
        
        return `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Статистика задач
            </h3>
            
            <div className="flex items-center justify-between">
                {/* Pie chart */}
                <div className="flex-shrink-0">
                    <svg width={chartSize} height={chartSize} className="transform -rotate-90">
                        {taskStats.total > 0 && (
                            <>
                                {/* Выполнено */}
                                {taskStats.completed > 0 && (
                                    <path
                                        d={createPath(0, completedAngle)}
                                        fill="#22c55e"
                                        opacity={0.8}
                                    />
                                )}
                                
                                {/* Просрочено */}
                                {taskStats.overdue > 0 && (
                                    <path
                                        d={createPath(completedAngle, completedAngle + overdueAngle)}
                                        fill="#ef4444"
                                        opacity={0.8}
                                    />
                                )}
                                
                                {/* В процессе */}
                                {taskStats.inProgress > 0 && (
                                    <path
                                        d={createPath(completedAngle + overdueAngle, 360)}
                                        fill="#3b82f6"
                                        opacity={0.8}
                                    />
                                )}
                            </>
                        )}
                        
                        {/* Центральный круг */}
                        <circle
                            cx={centerX}
                            cy={centerY}
                            r={40}
                            fill="white"
                            className="dark:fill-gray-800"
                        />
                        
                        {/* Текст в центре */}
                        <text
                            x={centerX}
                            y={centerY - 5}
                            textAnchor="middle"
                            className="text-lg font-bold fill-gray-900 dark:fill-white transform rotate-90"
                            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
                        >
                            {taskStats.total}
                        </text>
                        <text
                            x={centerX}
                            y={centerY + 10}
                            textAnchor="middle"
                            className="text-xs fill-gray-600 dark:fill-gray-300 transform rotate-90"
                            style={{ transformOrigin: `${centerX}px ${centerY}px` }}
                        >
                            всего
                        </text>
                    </svg>
                </div>
                
                {/* Статистика */}
                <div className="flex-1 ml-8 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-green-500 rounded"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-200">Выполнено</span>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {taskStats.completed}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                                ({taskStats.completedPercent}%)
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-red-500 rounded"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-200">Просрочено</span>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {taskStats.overdue}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                                ({taskStats.overduePercent}%)
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-4 h-4 bg-blue-500 rounded"></div>
                            <span className="text-sm text-gray-700 dark:text-gray-200">В процессе</span>
                        </div>
                        <div className="text-right">
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                                {taskStats.inProgress}
                            </span>
                            <span className="text-sm text-gray-500 ml-2">
                                ({taskStats.inProgressPercent}%)
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
