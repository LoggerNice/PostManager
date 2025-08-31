'use client';

import { useState } from 'react';
import { ChartBarIcon, ViewColumnsIcon } from '@heroicons/react/24/outline';
import DepartmentTasksGanttChart from '@/components/charts/DepartmentTasksGanttChart';
import DepartmentTasksStatusChart from '@/components/charts/DepartmentTasksStatusChart';
import DepartmentUsersStats from '@/components/charts/DepartmentUsersStats';
import DepartmentTasksExcelExport from '@/components/charts/DepartmentTasksExcelExport';
import WeekNavigation from '@/components/ui/WeekNavigation';
import DepartmentTasksBoard from '@/components/projectComponents/department/DepartmentTasksBoard';

export default function MyDepartmentBoard() {
    const [selectedWeek, setSelectedWeek] = useState(new Date());
    const [activeTab, setActiveTab] = useState<'overview' | 'board'>('overview');

    const handleWeekChange = (weekStart: Date) => {
        setSelectedWeek(weekStart);
    };

    const tabs = [
        { id: 'overview', label: 'Обзор', icon: ChartBarIcon, description: 'Диаграмма Ганта и статистика' },
        { id: 'board', label: 'Доска', icon: ViewColumnsIcon, description: 'Управление задачами отдела' }
    ];

    return (
        <div className="">
            <div className="ml-6 mr-6 mb-6">
                <div className="flex justify-between items-center mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Мой отдел
                    </h2>
                    <DepartmentTasksExcelExport compact />
                </div>
                <p className="text-gray-600 dark:text-gray-400">
                    Управление задачами и анализ работы сотрудников отдела
                </p>
            </div>

            {/* Табы */}
            <div className="ml-6 mr-6 mb-6">
                <div className="border-b border-gray-200 dark:border-gray-700">
                    <nav className="-mb-px flex space-x-8">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as 'overview' | 'board')}
                                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300 dark:hover:border-gray-600'
                                }`}
                                title={tab.description}
                            >
                                <tab.icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>
            
            {/* Контент табов */}
            {activeTab === 'overview' && (
                <div className="ml-6 mr-6 space-y-6">
                    {/* Навигация по неделям */}
                    <WeekNavigation 
                        currentWeek={selectedWeek}
                        onWeekChange={handleWeekChange}
                    />
                    
                    {/* Диаграмма Ганта отдела */}
                    <DepartmentTasksGanttChart selectedWeek={selectedWeek} />
                    
                    {/* Статистика задач отдела и сотрудников */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <DepartmentTasksStatusChart />
                        <DepartmentUsersStats />
                    </div>
                </div>
            )}

            {activeTab === 'board' && (
                <DepartmentTasksBoard />
            )}
        </div>
    );
}
