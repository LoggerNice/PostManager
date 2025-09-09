import { GanttTask } from '@/types/gantt.types';

interface TaskBarProps {
    task: GanttTask;
    position: {
        startX: number;
        endX: number;
        barWidth: number;
        startsBeforeWeek: boolean;
        endsAfterWeek: boolean;
        daySpacing: number;
    };
    dimensions: {
        leftMargin: number;
        chartWidth: number;
        availableWidth: number;
    };
    onTaskClick: (task: GanttTask) => void;
}

export default function TaskBar({ task, position, dimensions, onTaskClick }: TaskBarProps) {
    const { leftMargin, chartWidth, availableWidth } = dimensions;
    const { startX, endX, barWidth, startsBeforeWeek, endsAfterWeek, daySpacing } = position;
    
    // Цвета для разных статусов
    const colorMap = {
        green: '#22c55e',
        red: '#ef4444',
        yellow: '#eab308', 
        white: '#6b7280'
    };

    // Более темные цвета для border
    const borderColorMap = {
        green: '#16a34a',
        red: '#dc2626',
        yellow: '#d97706', 
        white: '#4b5563'
    };

    return (
        <g key={task.id}>
            {/* Полоса задачи */}
            <rect
                x={startX}
                y={0}
                width={barWidth}
                height={24}
                fill={colorMap[task.color]}
                stroke={borderColorMap[task.color]}
                strokeWidth={2}
                opacity={0.8}
                rx={4}
                className="cursor-pointer hover:opacity-100 transition-all duration-200"
                onClick={() => onTaskClick(task)}
            />
            
            {/* Если задача начинается раньше недели, показываем пунктирную линию слева */}
            {startsBeforeWeek && (
                <line
                    x1={leftMargin}
                    y1={12}
                    x2={startX}
                    y2={12}
                    stroke={borderColorMap[task.color]}
                    strokeWidth={2}
                    strokeDasharray="5,5"
                    opacity={0.6}
                />
            )}

            {/* Если задача заканчивается после рабочей недели, показываем пунктирную линию справа */}
            {endsAfterWeek && (
                <line
                    x1={leftMargin + 5 * daySpacing}
                    y1={12}
                    x2={endX}
                    y2={12}
                    stroke={borderColorMap[task.color]}
                    strokeWidth={2}
                    strokeDasharray="5,5"
                    opacity={0.6}
                />
            )}

            {/* Текст с названием задачи */}
            <text
                x={startX + 5}
                y={16}
                className="text-xs fill-white font-medium"
                style={{ 
                    pointerEvents: 'none',
                    maxWidth: `${Math.max(barWidth - 16, 0)}px`,
                    overflow: 'hidden'
                }}
            >
                {task.title?.length > 25 
                    ? `${task.title.substring(0, 15)}...` 
                    : task.title || 'Без названия'
                }
            </text>
        </g>
    );
}
