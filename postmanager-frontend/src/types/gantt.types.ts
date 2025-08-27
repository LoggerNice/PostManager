import { Task } from './task.types';
import { IUser } from './user.types';

export interface GanttTask extends Task {
    startDate: Date;
    endDate: Date;
    color: 'green' | 'red' | 'yellow' | 'white';
    daysUntilEnd: number;
    level: number; // Уровень для размещения пересекающихся задач
    progress: number; // Прогресс выполнения задачи
}

export interface UserTasksGroup {
    user: IUser;
    tasks: GanttTask[];
    maxLevel: number; // Максимальный уровень задач для пользователя
}

export interface TimelineData {
    timelineRange: { start: Date; end: Date; totalDays: number };
    dates: Date[];
    months: Date[];
}

export interface DepartmentTasksGanttChartProps {
    selectedWeek?: Date;
}

export interface ChartDimensions {
    containerWidth: number;
    chartWidth: number;
    availableWidth: number;
    chartHeight: number;
    leftMargin: number;
    rightMargin: number;
    rowHeight: number;
    headerHeight: number;
}
