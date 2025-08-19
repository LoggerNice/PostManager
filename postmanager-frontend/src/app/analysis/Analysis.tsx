'use client';

import { useAuth } from '@/hooks/useAuth';
import ProjectsGanttChart from '@/components/charts/ProjectsGanttChart';
import TasksStatusChart from '@/components/charts/TasksStatusChart';
import DepartmentTasksStats from '@/components/charts/DepartmentTasksStats';

export default function AnalysisBoard() {

    return (
        <div className="">
            <div className="ml-6 mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Анализ проектов
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Комплексная аналитика проектов, задач и отделов
                </p>
            </div>
            
            <div className="ml-6 mr-6 space-y-6">
                {/* Диаграмма Ганта проектов */}
                <ProjectsGanttChart />
                
                {/* Статистика задач и отделов */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TasksStatusChart />
                    <DepartmentTasksStats />
                </div>
            </div>
        </div>
    );
}
