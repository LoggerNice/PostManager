'use client';

import React from 'react';
import { Task, TaskPriorityDisplay, TaskPriority } from '@/types/task.types';
import { Column } from '@/types';
import { sortTasksByPriority } from './taskSorting';

export interface TaskStateManager {
  // Debouncing для избежания множественных обновлений
  pendingUpdates: Map<string, NodeJS.Timeout>;
  
  // Утилиты для работы с задачами
  addTaskToColumns: (
    columns: Record<string, Column>, 
    task: Task, 
    priorityMap?: Record<TaskPriority, TaskPriorityDisplay>
  ) => Record<string, Column>;
  
  updateTaskInColumns: (
    columns: Record<string, Column>, 
    task: Task, 
    priorityMap?: Record<TaskPriority, TaskPriorityDisplay>
  ) => Record<string, Column>;
  
  removeTaskFromColumns: (
    columns: Record<string, Column>, 
    taskId: string
  ) => Record<string, Column>;
  
  // Debounced операции
  debouncedUpdate: (
    key: string, 
    updateFn: () => void, 
    delay?: number
  ) => void;
  
  clearPendingUpdate: (key: string) => void;
  clearAllPendingUpdates: () => void;
}

class TaskStateManagerImpl implements TaskStateManager {
  pendingUpdates = new Map<string, NodeJS.Timeout>();

  addTaskToColumns = (
    columns: Record<string, Column>, 
    task: Task, 
    priorityMap?: Record<TaskPriority, TaskPriorityDisplay>
  ): Record<string, Column> => {
    const newColumns = { ...columns };
    const columnId = task.status;

    // Преобразуем приоритет если нужно
    const processedTask = priorityMap ? {
      ...task,
      priority: (priorityMap[task.priority as TaskPriority] || task.priority) as TaskPriorityDisplay
    } : task;

    if (newColumns[columnId]) {
      // Проверяем, что задача еще не существует
      const existingTaskIndex = newColumns[columnId].items.findIndex(t => t.id === task.id);
      if (existingTaskIndex === -1) {
        newColumns[columnId].items.push(processedTask);
        newColumns[columnId].items = sortTasksByPriority(newColumns[columnId].items);
      }
    }

    return newColumns;
  };

  updateTaskInColumns = (
    columns: Record<string, Column>, 
    task: Task, 
    priorityMap?: Record<TaskPriority, TaskPriorityDisplay>
  ): Record<string, Column> => {
    const newColumns = { ...columns };

    // Преобразуем приоритет если нужно
    const processedTask = priorityMap ? {
      ...task,
      priority: (priorityMap[task.priority as TaskPriority] || task.priority) as TaskPriorityDisplay
    } : task;

    // Удаляем задачу из всех колонок
    Object.keys(newColumns).forEach(columnId => {
      newColumns[columnId].items = newColumns[columnId].items.filter(t => t.id !== task.id);
    });

    // Добавляем обновленную задачу в правильную колонку
    const columnId = task.status;
    if (newColumns[columnId]) {
      newColumns[columnId].items.push(processedTask);
      newColumns[columnId].items = sortTasksByPriority(newColumns[columnId].items);
    }

    return newColumns;
  };

  removeTaskFromColumns = (
    columns: Record<string, Column>, 
    taskId: string
  ): Record<string, Column> => {
    const newColumns = { ...columns };

    // Удаляем задачу из всех колонок
    Object.keys(newColumns).forEach(columnId => {
      newColumns[columnId].items = newColumns[columnId].items.filter(t => t.id !== taskId);
    });

    return newColumns;
  };

  debouncedUpdate = (
    key: string, 
    updateFn: () => void, 
    delay: number = 1000
  ): void => {
    // Очищаем предыдущий таймер, если он есть
    const existingTimer = this.pendingUpdates.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Устанавливаем новый таймер
    const timer = setTimeout(() => {
      updateFn();
      this.pendingUpdates.delete(key);
    }, delay);

    this.pendingUpdates.set(key, timer);
  };

  clearPendingUpdate = (key: string): void => {
    const timer = this.pendingUpdates.get(key);
    if (timer) {
      clearTimeout(timer);
      this.pendingUpdates.delete(key);
    }
  };

  clearAllPendingUpdates = (): void => {
    this.pendingUpdates.forEach(timer => clearTimeout(timer));
    this.pendingUpdates.clear();
  };
}

// Экспортируем синглтон
export const taskStateManager = new TaskStateManagerImpl();

// Хук для использования в React компонентах
export function useTaskStateManager(): TaskStateManager {
  // Очищаем таймеры при размонтировании компонента
  React.useEffect(() => {
    return () => {
      taskStateManager.clearAllPendingUpdates();
    };
  }, []);

  return taskStateManager;
}

