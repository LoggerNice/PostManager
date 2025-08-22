import { TaskPriority } from './task.types';
import { IUser } from './user.types';
import { IDepartment } from './department.types';

export interface TasksFilterConfig {
  // Поиск по названию
  searchQuery: string;
  
  // Фильтры с множественным выбором
  departments: IDepartment[];
  priorities: TaskPriority[];
  assignees: IUser[];
  
  // Фильтр по дате (период)
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
  };
}

export interface TasksFilterProps {
  // Данные для фильтрации
  tasks: any[]; // Task[] - но используем any для гибкости
  
  // Текущая конфигурация фильтров
  filters: TasksFilterConfig;
  
  // Callback для изменения фильтров
  onFiltersChange: (filters: TasksFilterConfig) => void;
  
  // Данные для селектов
  availableDepartments: IDepartment[];
  availableUsers: IUser[];
  
  // Опциональные настройки
  showDepartmentFilter?: boolean;
  showAssigneeFilter?: boolean;
  showDateFilter?: boolean;
  showPriorityFilter?: boolean;
  
  // Плейсхолдеры
  searchPlaceholder?: string;
  className?: string;
}

export interface FilterOption<T = any> {
  value: T;
  label: string;
}

// Утилитарные типы для работы с фильтрами
export type FilterableTaskFields = 'title' | 'priority' | 'assignees' | 'creator' | 'deadline' | 'createdAt';

export interface TaskFilterResult {
  filteredTasks: any[];
  totalCount: number;
  filteredCount: number;
}
