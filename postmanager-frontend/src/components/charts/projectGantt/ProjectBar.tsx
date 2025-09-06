'use client';

import { ProjectBarProps } from '@/types/projectGantt.types';
import { 
  calculateProjectPosition, 
  formatDate,
  isProjectTruncated 
} from '@/utils/projectGanttUtils';

export default function ProjectBar({ 
  project, 
  dimensions, 
  months, 
  onProjectClick 
}: ProjectBarProps) {
  const position = calculateProjectPosition(project, months, dimensions);
  const isTruncated = isProjectTruncated(project.project, months);
  
  // Цвета для разных статусов (как в существующей диаграмме)
  const colorMap = {
    active: '#3b82f6',
    completed: '#22c55e',
    overdue: '#ef4444',
    upcoming: '#9ca3af'
  };

  const borderColorMap = {
    active: '#2563eb',
    completed: '#16a34a',
    overdue: '#dc2626',
    upcoming: '#6b7280'
  };

  const fillColor = colorMap[project.status];
  const strokeColor = borderColorMap[project.status];

  return (
    <g>
      {/* Полоса проекта */}
      <rect
        x={dimensions.projectNameColumnWidth + position.left}
        y={5}
        width={position.width}
        height={24}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={2}
        opacity={0.8}
        rx={4}
        className="cursor-pointer hover:opacity-100 transition-all duration-200"
        onClick={() => onProjectClick?.(project.project)}
      />
      
      {/* Текст с названием проекта */}
      <text
        x={dimensions.projectNameColumnWidth + position.left + 8}
        y={20}
        className="text-xs fill-white font-medium"
        style={{ 
          pointerEvents: 'none',
          maxWidth: `${Math.max(position.width - 16, 0)}px`,
          overflow: 'hidden'
        }}
      >
        {(() => {
          const title = project.project.title || 'Без названия';
          const startDate = formatDate(project.startDate);
          const endDate = formatDate(project.endDate);
          const titleWithDates = `${title} (до  ${endDate})`;
          
          return titleWithDates.length > 40 
            ? `${titleWithDates.substring(0, 40)}...` 
            : titleWithDates;
        })()}
      </text>
      
      {/* Индикатор обрезанного проекта */}
      {isTruncated && (
        <text
          x={dimensions.projectNameColumnWidth + position.left + position.width - 15}
          y={20}
          className="text-xs fill-white font-bold"
          textAnchor="end"
        >
          ...
        </text>
      )}
    </g>
  );
}
