'use client';

import { useState } from 'react';
import DepartmentTasksGanttChart from '@/components/charts/DepartmentTasksGanttChart';
import DepartmentTasksStatusChart from '@/components/charts/DepartmentTasksStatusChart';
import DepartmentUsersStats from '@/components/charts/DepartmentUsersStats';
import DepartmentTasksExcelExport from '@/components/charts/DepartmentTasksExcelExport';
import WeekNavigation from '@/components/ui/WeekNavigation';

export default function MyDepartmentBoard() {
    const [selectedWeek, setSelectedWeek] = useState(new Date());

    const handleWeekChange = (weekStart: Date) => {
        setSelectedWeek(weekStart);
    };

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
                    Диаграмма Ганта задач сотрудников отдела на выбранную рабочую неделю (пн-пт) с точным позиционированием по дням
                </p>
            </div>
            
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
        </div>
    );
}
