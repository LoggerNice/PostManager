'use client';

import { useAuth } from '@/hooks/useAuth';
import DepartmentTasksGanttChart from '@/components/charts/DepartmentTasksGanttChart';
import DepartmentTasksStatusChart from '@/components/charts/DepartmentTasksStatusChart';
import DepartmentUsersStats from '@/components/charts/DepartmentUsersStats';
import DepartmentTasksExcelExport from '@/components/charts/DepartmentTasksExcelExport';

export default function MyDepartmentBoard() {

    return (
        <div className="">
            <div className="ml-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Мой отдел
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Диаграмма Ганта задач сотрудников отдела на рабочую неделю (пн-пт) и статистика выполнения
                </p>
            </div>
            
            <div className="ml-6 mr-6 space-y-6">
                {/* Диаграмма Ганта отдела */}
                <DepartmentTasksGanttChart />
                
                {/* Экспорт задач в Excel */}
                <DepartmentTasksExcelExport />
                
                {/* Статистика задач отдела и сотрудников */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <DepartmentTasksStatusChart />
                    <DepartmentUsersStats />
                </div>
            </div>
        </div>
    );
}
