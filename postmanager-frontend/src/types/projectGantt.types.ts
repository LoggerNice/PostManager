import { IProject } from './project.types';

export interface ProjectGanttData {
  project: IProject;
  startDate: Date;
  endDate: Date;
  duration: number; // в днях
  progress: number; // процент выполнения (0-100)
  status: 'active' | 'completed' | 'overdue' | 'upcoming';
}

export interface ProjectGanttDimensions {
  containerWidth: number;
  monthWidth: number;
  dayWidth: number;
  rowHeight: number;
  headerHeight: number;
  projectNameColumnWidth: number;
}

export interface ProjectGanttConfig {
  monthsToShow: number;
  startDate: Date;
  endDate: Date;
}

export interface MonthInfo {
  month: string;
  year: number;
  startDate: Date;
  endDate: Date;
  daysInMonth: number;
  width: number;
}

export interface ProjectBarProps {
  project: ProjectGanttData;
  dimensions: ProjectGanttDimensions;
  months: MonthInfo[];
  onProjectClick?: (project: IProject) => void;
}

export interface ProjectRowProps {
  project: ProjectGanttData;
  dimensions: ProjectGanttDimensions;
  months: MonthInfo[];
  onProjectClick?: (project: IProject) => void;
}

export interface TimelineHeaderProps {
  months: MonthInfo[];
  dimensions: ProjectGanttDimensions;
}

export interface ProjectGanttChartProps {
  projects?: IProject[];
  onProjectClick?: (project: IProject) => void;
  className?: string;
}
