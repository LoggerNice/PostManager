import { useState, useEffect, useMemo } from 'react';
import { useGetProjectsQuery } from '@/store/api/project.api';
import { IProject } from '@/types/project.types';
import { 
  ProjectGanttData, 
  ProjectGanttDimensions, 
  MonthInfo 
} from '@/types/projectGantt.types';
import { 
  getNextSixMonths, 
  calculateGanttDimensions, 
  updateMonthWidths,
  transformProjectToGanttData,
  isProjectVisible 
} from '@/utils/projectGanttUtils';

interface UseProjectGanttDataProps {
  containerWidth?: number;
}

interface UseProjectGanttDataReturn {
  projects: ProjectGanttData[];
  months: MonthInfo[];
  dimensions: ProjectGanttDimensions;
  isLoading: boolean;
  error: any;
  visibleProjects: ProjectGanttData[];
}

export function useProjectGanttData({ 
  containerWidth = 1200 
}: UseProjectGanttDataProps = {}): UseProjectGanttDataReturn {
  const [dimensions, setDimensions] = useState<ProjectGanttDimensions>(
    calculateGanttDimensions(containerWidth)
  );

  // Получаем данные проектов
  const { data: projectsData = [], isLoading, error } = useGetProjectsQuery();

  // Получаем месяцы для отображения
  const months = useMemo(() => {
    const monthsData = getNextSixMonths();
    return updateMonthWidths(monthsData, dimensions);
  }, [dimensions]);

  // Преобразуем проекты в данные для диаграммы Ганта
  const projects = useMemo(() => {
    return projectsData.map(project => transformProjectToGanttData(project, months));
  }, [projectsData, months]);

  // Фильтруем видимые проекты
  const visibleProjects = useMemo(() => {
    return projects.filter(project => isProjectVisible(project, months));
  }, [projects, months]);

  // Обновляем размеры при изменении ширины контейнера
  useEffect(() => {
    if (containerWidth > 0) {
      const newDimensions = calculateGanttDimensions(containerWidth);
      setDimensions(newDimensions);
    }
  }, [containerWidth]);

  return {
    projects,
    months,
    dimensions,
    isLoading,
    error,
    visibleProjects
  };
}
