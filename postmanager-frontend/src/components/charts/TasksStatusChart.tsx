'use client';

import { useGetTasksQuery } from '@/store/api/task.api';
import TasksStatsChart from './TasksStatsChart';

export default function TasksStatusChart() {
    const { data: tasks = [], isLoading, error } = useGetTasksQuery();

    return (
        <TasksStatsChart
            tasks={tasks}
            title="Статистика задач"
            isLoading={isLoading}
            error={error}
        />
    );
}
