'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useGetProjectsQuery } from '@/store/api/project.api';
import { useGetTasksQuery } from '@/store/api/task.api';
import { useGetDepartmentsQuery } from '@/store/api/department.api';
import { IProject } from '@/types/project.types';

interface GanttProject extends IProject {
    startDate: Date;
    endDate: Date;
    color: 'red' | 'yellow' | 'white';
    monthsUntilEnd: number;
}

export default function ProjectsGanttChart() {
    const router = useRouter();
    const { data: projects = [], isLoading, error } = useGetProjectsQuery();

    // Процессируем данные проектов для диаграммы
    const ganttProjects = useMemo<GanttProject[]>(() => {
        const now = new Date();
        const sixMonthsFromNow = new Date();
        sixMonthsFromNow.setMonth(now.getMonth() + 6);

        return projects
            .map((project): GanttProject | null => {
                if (!project.startDate || !project.endDate) return null;

                const startDate = new Date(project.startDate);
                const endDate = new Date(project.endDate);

                // Фильтруем проекты в рамках 6 месяцев
                if (endDate < now || startDate > sixMonthsFromNow) return null;

                // Вычисляем цвет на основе времени до конца проекта
                const monthsUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 30));
                let color: 'red' | 'yellow' | 'white';
                
                if (monthsUntilEnd <= 3) {
                    color = 'red';
                } else if (monthsUntilEnd <= 6) {
                    color = 'yellow';
                } else {
                    color = 'white';
                }

                return {
                    ...project,
                    startDate,
                    endDate,
                    color,
                    monthsUntilEnd
                };
            })
            .filter((project): project is GanttProject => project !== null)
            .sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
    }, [projects]);

    // Генерация месяцев для оси X
    const months = useMemo(() => {
        const now = new Date();
        const monthsArray = [];
        
        for (let i = 0; i < 6; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
            monthsArray.push({
                date,
                label: date.toLocaleDateString('ru-RU', { month: 'short' })
            });
        }
        
        return monthsArray;
    }, []);

    const handleProjectClick = (projectId: number | undefined) => {
        if (projectId) {
            router.push(`/projects/${projectId}`);
        }
    };

    if (isLoading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return (
        <div className="text-red-500 text-center p-4">
            Ошибка при загрузке данных проектов
        </div>
    );

    if (ganttProjects.length === 0) return (
        <div className="text-gray-500 text-center p-4">
            Нет проектов для отображения в рамках текущего года
        </div>
    );

    const chartHeight = ganttProjects.length * 40 + 80;
    const chartWidth = Math.max(1000, typeof window !== 'undefined' ? window.innerWidth - 100 : 1000);
    const leftMargin = 50;
    const monthWidth = (chartWidth - leftMargin - 50) / 14;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg w-full">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Диаграмма Ганта проектов (6 месяцев)
            </h3>
            
            <div className="w-full overflow-x-auto">
                <svg width={chartWidth} height={chartHeight} className="border border-gray-200 dark:border-gray-600 w-full">
                    {/* Заголовки месяцев */}
                    {months.map((month, index) => (
                        <g key={month.label}>
                            <text
                                x={leftMargin + index * monthWidth + monthWidth / 2}
                                y={38}
                                textAnchor="middle"
                                className="text-sm fill-gray-600 dark:fill-gray-300"
                            >
                                {month.label}
                            </text>
                            {/* Вертикальные линии сетки */}
                            <line
                                x1={leftMargin + index * monthWidth}
                                y1={40}
                                x2={leftMargin + index * monthWidth}
                                y2={chartHeight - 20}
                                stroke="#e5e7eb"
                                strokeWidth={1}
                                opacity={0.5}
                            />
                        </g>
                    ))}

                    {/* Проекты */}
                    {ganttProjects.map((project, index) => {
                        const y = 50 + index * 40;
                        const projectStartTime = project.startDate.getTime();
                        const projectEndTime = project.endDate.getTime();
                        const yearStartTime = months[0].date.getTime();
                        const yearEndTime = new Date(months[5].date.getFullYear(), months[5].date.getMonth() + 1, 0).getTime();
                        
                        // Расчет позиции на диаграмме
                        const startX = leftMargin + ((projectStartTime - yearStartTime) / (yearEndTime - yearStartTime)) * (6 * monthWidth);
                        const endX = leftMargin + ((projectEndTime - yearStartTime) / (yearEndTime - yearStartTime)) * (6 * monthWidth);
                        const barWidth = Math.max(endX - startX, 5);

                        // Цвета для разных статусов
                        const colorMap = {
                            red: '#ef4444',
                            yellow: '#eab308', 
                            white: '#6b7280'
                        };

                        return (
                            <g key={project.id}>
                                {/* Полоса проекта */}
                                <rect
                                    x={Math.max(startX, leftMargin)}
                                    y={y + 5}
                                    width={barWidth}
                                    height={20}
                                    fill={colorMap[project.color]}
                                    opacity={0.8}
                                    rx={4}
                                    className="cursor-pointer hover:opacity-100 transition-opacity"
                                    onClick={() => handleProjectClick(project.id)}
                                />
                                
                                {/* Текст с названием и датами в одну линию */}
                                <text
                                    x={Math.max(startX, leftMargin) + 5}
                                    y={y + 18}
                                    className="text-xs fill-white font-medium"
                                    style={{ pointerEvents: 'none' }}
                                >
                                    {project.title.length > 15 
                                        ? `${project.title.substring(0, 15)}...` 
                                        : project.title
                                    } ({project.startDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} - {project.endDate.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })})
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Легенда слева */}
            <div className="flex justify-start mt-4 space-x-6">
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-red-500 rounded"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">До конца ≤ 3 месяца</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">До конца ≤ 6 месяцев</span>
                </div>
                <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 bg-gray-500 rounded"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-300">До конца {'>'} 6 месяцев</span>
                </div>
            </div>
        </div>
    );
}
