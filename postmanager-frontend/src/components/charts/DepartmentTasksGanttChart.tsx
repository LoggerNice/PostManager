'use client';

import GanttChart from './GanttChart';
import { DepartmentTasksGanttChartProps } from '@/types/gantt.types';

export default function DepartmentTasksGanttChart({ selectedWeek }: DepartmentTasksGanttChartProps) {
    return <GanttChart selectedWeek={selectedWeek} />;
}