'use client';

import { useEffect } from 'react';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { Task } from '@/types/task.types';

interface UseWebSocketTasksProps {
  onTaskUpdate?: (task: Task) => void;
  onTaskCreate?: (task: Task) => void;
  onTaskDelete?: (taskId: number) => void;
  onTaskMove?: (taskId: number, newStatus: string) => void;
}

export function useWebSocketTasks({
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  onTaskMove
}: UseWebSocketTasksProps = {}) {
  const { isConnected, subscribeToTaskEvents, addNotification } = useWebSocketContext();

  useEffect(() => {
    const unsubscribe = subscribeToTaskEvents({
      onTaskUpdate,
      onTaskCreate,
      onTaskDelete,
      onTaskMove
    });

    return unsubscribe;
  }, [subscribeToTaskEvents, onTaskUpdate, onTaskCreate, onTaskDelete, onTaskMove]);

  return {
    isConnected,
    addNotification
  };
}