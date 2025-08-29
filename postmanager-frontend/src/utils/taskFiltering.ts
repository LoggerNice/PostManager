import { Task, TaskPriority, TaskPriorityDisplay } from '@/types/task.types';
import { TasksFilterConfig, TaskFilterResult } from '@/types/filter.types';

/**
 * Функция для фильтрации задач на основе конфигурации фильтров
 */
export function filterTasks(tasks: Task[], filters: TasksFilterConfig): TaskFilterResult {
  if (!tasks || tasks.length === 0) {
    return {
      filteredTasks: [],
      totalCount: 0,
      filteredCount: 0
    };
  }

  let filteredTasks = [...tasks];

  // 1. Фильтр по поиску (название задачи)
  if (filters.searchQuery.trim()) {
    const searchQuery = filters.searchQuery.toLowerCase().trim();
    filteredTasks = filteredTasks.filter(task =>
      task.title.toLowerCase().includes(searchQuery) ||
      (task.description && task.description.toLowerCase().includes(searchQuery))
    );
  }

  // 2. Фильтр по отделам (через создателя задачи и участников)
  if (filters.departments.length > 0) {
    const departmentIds = filters.departments.map(dept => dept.id);
    filteredTasks = filteredTasks.filter(task => {
      // Проверяем отдел создателя задачи
      if (task.creator?.departmentId && departmentIds.includes(task.creator.departmentId)) {
        return true;
      }
      
      // Проверяем отделы исполнителей
      if (task.assignee?.departmentId && departmentIds.includes(task.assignee.departmentId)) {
        return true;
      }
      
      // Проверяем отделы множественных исполнителей
      if (task.assignees && task.assignees.length > 0) {
        return task.assignees.some(assignee => 
          assignee.user?.departmentId && departmentIds.includes(assignee.user.departmentId)
        );
      }
      
      return false;
    });
  }

  // 3. Фильтр по приоритетам
  if (filters.priorities.length > 0) {
    filteredTasks = filteredTasks.filter(task => {
      // Нормализуем приоритет к английскому формату
      const taskPriority = normalizeTaskPriority(task.priority);
      return filters.priorities.includes(taskPriority);
    });
  }

  // 4. Фильтр по участникам (создатель + исполнители)
  if (filters.assignees.length > 0) {
    const assigneeIds = filters.assignees.map(user => user.id);
    filteredTasks = filteredTasks.filter(task => {
      // Проверяем создателя
      if (assigneeIds.includes(task.creatorId)) {
        return true;
      }
      
      // Проверяем основного исполнителя
      if (task.assignee && assigneeIds.includes(task.assignee.id)) {
        return true;
      }
      
      // Проверяем множественных исполнителей
      if (task.assignees && task.assignees.length > 0) {
        return task.assignees.some(assignee => assigneeIds.includes(assignee.userId));
      }
      
      return false;
    });
  }

  // 5. Фильтр по дате (период)
  if (filters.dateRange.startDate || filters.dateRange.endDate) {
    filteredTasks = filteredTasks.filter(task => {
      // Для фильтрации по дате используем deadline, если есть, иначе createdAt
      const taskDate = task.deadline ? new Date(task.deadline) : new Date(task.createdAt);
      const now = new Date();

      // Проверяем начальную дату
      if (filters.dateRange.startDate) {
        const startDate = new Date(filters.dateRange.startDate);
        startDate.setHours(0, 0, 0, 0); // Начало дня
        if (taskDate < startDate) {
          // Если задача просрочена и выбранный период включает даты после deadline,
          // то показываем просроченную задачу
          if (task.deadline && new Date(task.deadline) < now && startDate > new Date(task.deadline)) {
            return true;
          }
          return false;
        }
      }

      // Проверяем конечную дату
      if (filters.dateRange.endDate) {
        const endDate = new Date(filters.dateRange.endDate);
        endDate.setHours(23, 59, 59, 999); // Конец дня
        if (taskDate > endDate) {
          // Если задача просрочена и выбранный период включает даты после deadline,
          // то показываем просроченную задачу
          if (task.deadline && new Date(task.deadline) < now && endDate > new Date(task.deadline)) {
            return true;
          }
          return false;
        }
      }

      return true;
    });
  }

  return {
    filteredTasks,
    totalCount: tasks.length,
    filteredCount: filteredTasks.length
  };
}

/**
 * Нормализует приоритет задачи к английскому формату
 */
function normalizeTaskPriority(priority: TaskPriority | TaskPriorityDisplay): TaskPriority {
  const priorityMap: Record<TaskPriorityDisplay, TaskPriority> = {
    'Низкий': 'LOW',
    'Средний': 'MEDIUM',
    'Высокий': 'HIGH'
  };

  // Если приоритет уже в английском формате, возвращаем как есть
  if (['LOW', 'MEDIUM', 'HIGH'].includes(priority as TaskPriority)) {
    return priority as TaskPriority;
  }

  // Если в русском формате, преобразуем
  return priorityMap[priority as TaskPriorityDisplay] || 'LOW';
}

/**
 * Хук для работы с фильтрацией задач
 */
export function useTasksFilter(tasks: Task[], initialFilters?: Partial<TasksFilterConfig>) {
  const [filters, setFilters] = React.useState<TasksFilterConfig>({
    searchQuery: '',
    departments: [],
    priorities: [],
    assignees: [],
    dateRange: {
      startDate: null,
      endDate: null
    },
    ...initialFilters
  });

  const filterResult = React.useMemo(() => 
    filterTasks(tasks, filters), 
    [tasks, filters]
  );

  return {
    filters,
    setFilters,
    ...filterResult
  };
}

// Экспортируем для использования в React
import React from 'react';
