'use client';

import { useState, useEffect, useRef } from 'react';
import { ProjectGanttChartProps } from '@/types/projectGantt.types';
import { useProjectGanttData } from '@/hooks/useProjectGanttData';
import TimelineHeader from './TimelineHeader';
import ProjectRow from './ProjectRow';

export default function ProjectGanttChart({ 
  projects, 
  onProjectClick, 
  className = '' 
}: ProjectGanttChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  const {
    projects: ganttProjects,
    months,
    dimensions,
    isLoading,
    error,
    visibleProjects
  } = useProjectGanttData({ containerWidth });

  // Обновляем размеры контейнера при изменении размера окна
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Используем переданные проекты или данные из хука
  const displayProjects = projects ? 
    ganttProjects.filter(p => projects.some(proj => proj.id === p.project.id)) :
    visibleProjects;

  if (isLoading) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Загрузка проектов...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        <div className="p-8 text-center">
          <p className="text-red-600 dark:text-red-400">Ошибка при загрузке проектов</p>
        </div>
      </div>
    );
  }

  if (displayProjects.length === 0) {
    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow ${className}`}>
        <div className="p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">Нет проектов для отображения</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`bg-white dark:bg-gray-800 rounded-lg pb-6 shadow-lg w-full ${className}`}
    >
      {/* Заголовок диаграммы */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Диаграмма Ганта проектов
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Отображение проектов на ближайшие 6 месяцев
        </p>
      </div>

      <div className="w-full overflow-hidden">
        <svg 
          width="100%" 
          height={dimensions.headerHeight + displayProjects.length * dimensions.rowHeight + 40} 
          className="w-full"
          viewBox={`0 0 ${dimensions.containerWidth + 20} ${dimensions.headerHeight + displayProjects.length * dimensions.rowHeight + 40}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Заголовок временной шкалы */}
          <TimelineHeader months={months} dimensions={dimensions} />
          
          {/* Строки проектов */}
          {displayProjects.map((project, index) => (
            <g key={project.project.id} transform={`translate(0, ${dimensions.headerHeight + index * dimensions.rowHeight})`}>
              <ProjectRow
                project={project}
                dimensions={dimensions}
                months={months}
                onProjectClick={onProjectClick}
                index={index}
              />
            </g>
          ))}
        </svg>
      </div>

      {/* Легенда */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Активные</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Завершенные</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Просроченные</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Предстоящие</span>
          </div>
        </div>
      </div>
    </div>
  );
}
