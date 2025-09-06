import { IProject } from '@/types/project.types';
import { 
  ProjectGanttData, 
  ProjectGanttDimensions, 
  ProjectGanttConfig, 
  MonthInfo 
} from '@/types/projectGantt.types';

/**
 * Получает ближайшие 6 месяцев начиная с текущего месяца
 */
export function getNextSixMonths(): MonthInfo[] {
  const months: MonthInfo[] = [];
  const currentDate = new Date();
  
  for (let i = 0; i < 6; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const monthName = date.toLocaleDateString('ru-RU', { month: 'long' });
    const year = date.getFullYear();
    const startDate = new Date(year, date.getMonth(), 1);
    const endDate = new Date(year, date.getMonth() + 1, 0);
    const daysInMonth = endDate.getDate();
    
    months.push({
      month: monthName,
      year,
      startDate,
      endDate,
      daysInMonth,
      width: 0 // будет установлено позже
    });
  }
  
  return months;
}

/**
 * Рассчитывает размеры диаграммы Ганта
 */
export function calculateGanttDimensions(containerWidth: number): ProjectGanttDimensions {
  const monthsToShow = 6;
  const projectNameColumnWidth = 120; // уменьшенная ширина столбца с названиями проектов
  const availableWidth = containerWidth - projectNameColumnWidth;
  const monthWidth = availableWidth / monthsToShow;
  const dayWidth = monthWidth / 30; // приблизительно 30 дней в месяце
  const rowHeight = 60;
  const headerHeight = 80;
  
  return {
    containerWidth,
    monthWidth,
    dayWidth,
    rowHeight,
    headerHeight,
    projectNameColumnWidth
  };
}

/**
 * Обновляет ширину месяцев на основе размеров контейнера
 */
export function updateMonthWidths(months: MonthInfo[], dimensions: ProjectGanttDimensions): MonthInfo[] {
  return months.map(month => ({
    ...month,
    width: dimensions.monthWidth
  }));
}

/**
 * Преобразует проект в данные для диаграммы Ганта
 */
export function transformProjectToGanttData(project: IProject, months: MonthInfo[]): ProjectGanttData {
  const now = new Date();
  const startDate = project.startDate ? new Date(project.startDate) : now;
  let endDate = project.endDate ? new Date(project.endDate) : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 дней по умолчанию
  
  // Если проект заканчивается больше чем через 6 месяцев, обрезаем до последнего отображаемого месяца
  const lastMonth = months[months.length - 1];
  if (lastMonth && endDate > lastMonth.endDate) {
    endDate = lastMonth.endDate;
  }
  
  // Рассчитываем длительность в днях
  const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  // Определяем статус проекта
  let status: 'active' | 'completed' | 'overdue' | 'upcoming';
  if (endDate < now) {
    status = 'completed';
  } else if (startDate > now) {
    status = 'upcoming';
  } else if (endDate < new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) { // просрочен в течение недели
    status = 'overdue';
  } else {
    status = 'active';
  }
  
  // Рассчитываем прогресс (упрощенная логика)
  const totalDuration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  const elapsedDuration = Math.max(0, Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const progress = Math.min(100, Math.max(0, (elapsedDuration / totalDuration) * 100));
  
  return {
    project,
    startDate,
    endDate,
    duration,
    progress,
    status
  };
}

/**
 * Рассчитывает позицию проекта на временной шкале
 */
export function calculateProjectPosition(
  projectData: ProjectGanttData,
  months: MonthInfo[],
  dimensions: ProjectGanttDimensions
): { left: number; width: number } {
  const firstMonth = months[0];
  if (!firstMonth) return { left: 0, width: 0 };
  
  // Рассчитываем позицию относительно первого месяца
  const startOffset = Math.max(0, (projectData.startDate.getTime() - firstMonth.startDate.getTime()) / (1000 * 60 * 60 * 24));
  const endOffset = Math.max(0, (projectData.endDate.getTime() - firstMonth.startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const left = startOffset * dimensions.dayWidth;
  const width = Math.max(20, (endOffset - startOffset) * dimensions.dayWidth); // минимум 20px
  
  return { left, width };
}

/**
 * Получает цвет проекта в зависимости от статуса
 */
export function getProjectColor(status: 'active' | 'completed' | 'overdue' | 'upcoming'): string {
  switch (status) {
    case 'active':
      return 'bg-blue-500';
    case 'completed':
      return 'bg-green-500';
    case 'overdue':
      return 'bg-red-500';
    case 'upcoming':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
}

/**
 * Получает цвет текста в зависимости от статуса
 */
export function getProjectTextColor(status: 'active' | 'completed' | 'overdue' | 'upcoming'): string {
  switch (status) {
    case 'active':
      return 'text-white';
    case 'completed':
      return 'text-white';
    case 'overdue':
      return 'text-white';
    case 'upcoming':
      return 'text-gray-700 dark:text-gray-300';
    default:
      return 'text-gray-700 dark:text-gray-300';
  }
}

/**
 * Форматирует дату для отображения
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
}

/**
 * Проверяет, был ли проект обрезан до последнего отображаемого месяца
 */
export function isProjectTruncated(project: IProject, months: MonthInfo[]): boolean {
  if (!project.startDate || !project.endDate) return false;
  
  const originalEndDate = new Date(project.endDate);
  const lastMonth = months[months.length - 1];
  
  if (!lastMonth) return false;
  
  return originalEndDate > lastMonth.endDate;
}

/**
 * Проверяет, виден ли проект в текущем диапазоне месяцев
 */
export function isProjectVisible(
  projectData: ProjectGanttData,
  months: MonthInfo[]
): boolean {
  const firstMonth = months[0];
  const lastMonth = months[months.length - 1];
  
  if (!firstMonth || !lastMonth) return false;
  
  // Проект виден, если он пересекается с диапазоном месяцев
  return projectData.startDate <= lastMonth.endDate && projectData.endDate >= firstMonth.startDate;
}
