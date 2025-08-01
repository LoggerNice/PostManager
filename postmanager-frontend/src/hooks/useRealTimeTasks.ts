'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useWebSocket, TaskEventData } from './useWebSocket';
import { Task } from '@/types/task.types';
import { toast } from 'react-hot-toast';

interface UseRealTimeTasksProps {
  projectId: number;
  onTaskCreated?: (task: Task) => void;
  onTaskUpdated?: (task: Task) => void;
  onTaskDeleted?: (taskId: number) => void;
  onTaskMoved?: (taskId: number, sourceColumn: string, destinationColumn: string) => void;
  currentUserId?: number;
}

export function useRealTimeTasks({
  projectId,
  onTaskCreated,
  onTaskUpdated,
  onTaskDeleted,
  onTaskMoved,
  currentUserId
}: UseRealTimeTasksProps) {
  const { joinProject, leaveProject, onTaskEvent, offTaskEvent, isConnected } = useWebSocket();
  const eventHandlerRef = useRef<((event: TaskEventData) => void) | null>(null);

  // Обработчик событий задач
  const handleTaskEvent = useCallback((event: TaskEventData) => {
    // Игнорируем события от текущего пользователя
    if (event.userId === currentUserId) {
      return;
    }

    // Проверяем, является ли текущий пользователь исполнителем задачи
    const isAssignee = event.task?.assignees?.some((assignee: any) => assignee.userId === currentUserId);
    
    // Если у задачи есть исполнители, показываем уведомления только им
    if (event.task?.assignees && event.task.assignees.length > 0 && !isAssignee) {
      return; // Не показываем уведомления, если пользователь не исполнитель
    }

    switch (event.type) {
      case 'task_created':
        if (event.task && onTaskCreated) {
          onTaskCreated(event.task);
          toast.success(`Создана новая задача: ${event.task.title}`);
        }
        break;

      case 'task_updated':
        if (event.task && onTaskUpdated) {
          onTaskUpdated(event.task);
          toast.success(`Задача обновлена: ${event.task.title}`);
        }
        break;

      case 'task_deleted':
        if (onTaskDeleted && event.taskId) {
          onTaskDeleted(event.taskId);
          toast.success('Задача удалена');
        }
        break;

      case 'task_moved':
        if (event.sourceColumn && event.destinationColumn && onTaskMoved) {
          onTaskMoved(event.taskId || 0, event.sourceColumn, event.destinationColumn);
          toast.success('Задача перемещена');
        }
        break;

      default:
        console.log('Unknown task event type:', event.type);
    }
  }, [onTaskCreated, onTaskUpdated, onTaskDeleted, onTaskMoved, currentUserId]);

  // Подключаемся к комнате проекта при изменении projectId или подключении
  useEffect(() => {
    if (isConnected && projectId) {
      joinProject(projectId);
    }
  }, [isConnected, projectId, joinProject]);

  // Подписываемся на события задач
  useEffect(() => {
    onTaskEvent(handleTaskEvent);
    eventHandlerRef.current = handleTaskEvent;

    return () => {
      if (eventHandlerRef.current) {
        offTaskEvent(eventHandlerRef.current);
      }
    };
  }, [handleTaskEvent, onTaskEvent, offTaskEvent]);

  // Отключаемся от комнаты проекта при размонтировании
  useEffect(() => {
    return () => {
      if (projectId) {
        leaveProject(projectId);
      }
    };
  }, [projectId, leaveProject]);

  return {
    isConnected
  };
} 