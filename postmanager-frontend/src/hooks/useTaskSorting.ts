import { useMemo } from 'react';
import { Task } from '@/types/task.types';
import { Column } from '@/types';
import { sortTasksByPriority } from '@/utils/taskSorting';

/**
 * Хук для автоматической сортировки задач по приоритету в колонках
 */
export const useTaskSorting = (columns: Record<string, Column>) => {
  const sortedColumns = useMemo(() => {
    const newColumns = { ...columns };
    
    // Сортируем задачи в каждой колонке по приоритету
    Object.keys(newColumns).forEach(columnId => {
      newColumns[columnId] = {
        ...newColumns[columnId],
        items: sortTasksByPriority(newColumns[columnId].items)
      };
    });
    
    return newColumns;
  }, [columns]);

  return sortedColumns;
};

/**
 * Хук для сортировки списка задач по приоритету
 */
export const useTaskListSorting = (tasks: Task[]) => {
  const sortedTasks = useMemo(() => {
    return sortTasksByPriority([...tasks]);
  }, [tasks]);

  return sortedTasks;
};
