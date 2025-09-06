'use client';

import { ProjectRowProps } from '@/types/projectGantt.types';
import ProjectBar from './ProjectBar';

interface ProjectRowPropsWithIndex extends ProjectRowProps {
  index: number;
}

export default function ProjectRow({ 
  project, 
  dimensions, 
  months, 
  onProjectClick,
  index
}: ProjectRowPropsWithIndex) {
  return (
    <g>
      {/* Горизонтальная разделительная линия (кроме первого проекта) */}
      {index > 0 && (
        <line
          x1={0}
          y1={-10}
          x2={dimensions.containerWidth}
          y2={-10}
          stroke="#d1d5db"
          strokeWidth={1}
          opacity={0.6}
          className="dark:stroke-gray-600"
        />
      )}
      
      {/* Информация о проекте слева */}
      
      {/* Название проекта */}
      <text
        x={dimensions.projectNameColumnWidth - 10}
        y={20}
        textAnchor="end"
        className="text-sm fill-gray-700 dark:fill-gray-200 font-medium"
      >
        {project.project.title}
      </text>
      
      {/* Клиент проекта */}
      {project.project.client && (
        <text
          x={dimensions.projectNameColumnWidth - 10}
          y={35}
          textAnchor="end"
          className="text-xs fill-gray-600 dark:fill-gray-400"
        >
          {project.project.client}
        </text>
      )}
      
      {/* Отделы проекта */}
      {project.project.department && project.project.department.length > 0 && (
        <text
          x={dimensions.projectNameColumnWidth - 10}
          y={50}
          textAnchor="end"
          className="text-xs fill-blue-600 dark:fill-blue-400"
        >
          {project.project.department.map(dept => dept.name).join(', ')}
        </text>
      )}
    
      
      {/* Вертикальные линии месяцев (только в области временной шкалы) */}
      {months.map((month, monthIndex) => (
        <line
          key={`grid-${month.year}-${month.month}`}
          x1={dimensions.projectNameColumnWidth + monthIndex * month.width}
          y1={0}
          x2={dimensions.projectNameColumnWidth + monthIndex * month.width}
          y2={dimensions.rowHeight}
          stroke="#e5e7eb"
          className="dark:stroke-gray-600"
          strokeWidth={1}
          opacity={0.5}
        />
      ))}
      
      {/* Полоса проекта */}
      <ProjectBar
        project={project}
        dimensions={dimensions}
        months={months}
        onProjectClick={onProjectClick}
      />
    </g>
  );
}
