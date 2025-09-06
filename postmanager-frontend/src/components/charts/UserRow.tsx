import { UserTasksGroup, GanttTask, TimelineData } from '@/types/gantt.types';
import { formatName } from './DepartmentTasksExcelExport';
import { calculateTaskPosition } from '@/utils/ganttUtils';
import TaskBar from './TaskBar';

interface UserRowProps {
    userGroup: UserTasksGroup;
    groupIndex: number;
    timelineData: TimelineData;
    dimensions: {
        leftMargin: number;
        chartWidth: number;
        availableWidth: number;
        rowHeight: number;
    };
    onTaskClick: (task: GanttTask) => void;
}

export default function UserRow({ 
    userGroup, 
    groupIndex, 
    timelineData, 
    dimensions, 
    onTaskClick 
}: UserRowProps) {
    const { leftMargin, chartWidth, availableWidth, rowHeight } = dimensions;
    
    return (
        <g key={userGroup.user.id}>
            {/* Горизонтальная разделительная линия (кроме первого пользователя) */}
            {groupIndex > 0 && (
                <line
                    x1={0}
                    y1={-10}
                    x2={chartWidth}
                    y2={-10}
                    stroke="#d1d5db"
                    strokeWidth={1}
                    opacity={0.6}
                    className="dark:stroke-gray-600"
                />
            )}
            
            {/* Имя пользователя */}
            <text
                x={leftMargin - 10}
                y={20}
                textAnchor="end"
                className="text-sm fill-gray-700 dark:fill-gray-200 font-medium"
            >
                {formatName(userGroup.user.name)}
            </text>
            
            {/* Задачи пользователя */}
            {userGroup.tasks.map((task) => {
                const position = calculateTaskPosition(task, timelineData, {
                    leftMargin,
                    chartWidth,
                    availableWidth
                });
                
                return (
                    <g key={`${userGroup.user.id}-${task.id}`} transform={`translate(0, ${5 + task.level * rowHeight})`}>
                        <TaskBar
                            task={task}
                            position={position}
                            dimensions={{ leftMargin, chartWidth, availableWidth }}
                            onTaskClick={onTaskClick}
                        />
                    </g>
                );
            })}
        </g>
    );
}
