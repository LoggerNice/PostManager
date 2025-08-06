'use client';

import { useEffect, useCallback } from 'react';
import { useWebSocketContext, TaskEventData } from '@/contexts/WebSocketContext';
import { Task } from '@/types/task.types';
import { soundManager } from '@/utils/soundUtils';

interface UseWebSocketTasksProps {
  projectId?: number;
  onTaskUpdate?: (data: TaskEventData) => void;
  onTaskCreate?: (data: TaskEventData) => void;
  onTaskDelete?: (data: TaskEventData) => void;
  onTaskAssignmentChanged?: (data: TaskEventData) => void;
  enableSounds?: boolean;
}

interface UseWebSocketUserTasksProps {
  userId?: number;
  onUserTaskUpdate?: (data: TaskEventData) => void;
  onUserTaskCreate?: (data: TaskEventData) => void;
  onUserTaskDelete?: (data: TaskEventData) => void;
  onTaskAssigned?: (data: TaskEventData) => void;
  onTaskUnassigned?: (data: TaskEventData) => void;
  enableSounds?: boolean;
}

// Хук для работы с задачами проекта
export function useWebSocketTasks({
  projectId,
  onTaskUpdate,
  onTaskCreate,
  onTaskDelete,
  onTaskAssignmentChanged,
  enableSounds = true
}: UseWebSocketTasksProps = {}) {
  const { isConnected, subscribeToTaskEvents, addNotification, joinProject, leaveProject } = useWebSocketContext();

  // Обработчики с поддержкой звуков
  const handleTaskCreate = useCallback((data: TaskEventData) => {
    if (projectId && data.projectId === projectId) {
      if (enableSounds && data.task?.status === 'IN_PROGRESS') {
        soundManager.playTaskCreatedSound();
      }
      onTaskCreate?.(data);
    }
  }, [projectId, onTaskCreate, enableSounds]);

  const handleTaskUpdate = useCallback((data: TaskEventData) => {
    if (projectId && data.projectId === projectId) {
      if (enableSounds && data.oldStatus !== data.newStatus) {
        soundManager.playTaskCreatedSound();
      }
      onTaskUpdate?.(data);
    }
  }, [projectId, onTaskUpdate, enableSounds]);

  const handleTaskDelete = useCallback((data: TaskEventData) => {
    if (projectId && data.projectId === projectId) {
      onTaskDelete?.(data);
    }
  }, [projectId, onTaskDelete]);

  const handleTaskAssignmentChanged = useCallback((data: TaskEventData) => {
    if (projectId && data.projectId === projectId) {
      onTaskAssignmentChanged?.(data);
    }
  }, [projectId, onTaskAssignmentChanged]);

  useEffect(() => {
    const unsubscribe = subscribeToTaskEvents({
      onTaskCreate: handleTaskCreate,
      onTaskUpdate: handleTaskUpdate,
      onTaskDelete: handleTaskDelete,
      onTaskAssignmentChanged: handleTaskAssignmentChanged
    });

    return unsubscribe;
  }, [subscribeToTaskEvents, handleTaskCreate, handleTaskUpdate, handleTaskDelete, handleTaskAssignmentChanged]);

  // Присоединение/выход из проекта
  useEffect(() => {
    if (projectId && isConnected) {
      joinProject(projectId);
      return () => leaveProject(projectId);
    }
  }, [projectId, isConnected, joinProject, leaveProject]);

  return {
    isConnected,
    addNotification
  };
}

// Хук для работы с пользовательскими задачами
export function useWebSocketUserTasks({
  userId,
  onUserTaskUpdate,
  onUserTaskCreate,
  onUserTaskDelete,
  onTaskAssigned,
  onTaskUnassigned,
  enableSounds = true
}: UseWebSocketUserTasksProps = {}) {
  const { isConnected, subscribeToUserTaskEvents, addNotification } = useWebSocketContext();

  // Обработчики с фильтрацией по пользователю
  const handleUserTaskCreate = useCallback((data: TaskEventData) => {
    if (userId && data.assigneeIds?.includes(userId)) {
      if (enableSounds && data.task?.status === 'IN_PROGRESS') {
        soundManager.playTaskCreatedSound();
      }
      onUserTaskCreate?.(data);
    }
  }, [userId, onUserTaskCreate, enableSounds]);

  const handleUserTaskUpdate = useCallback((data: TaskEventData) => {
    if (userId && data.assigneeIds?.includes(userId)) {
      if (enableSounds && data.oldStatus !== data.newStatus) {
        soundManager.playTaskCreatedSound();
      }
      onUserTaskUpdate?.(data);
    }
  }, [userId, onUserTaskUpdate, enableSounds]);

  const handleUserTaskDelete = useCallback((data: TaskEventData) => {
    if (userId && data.assigneeIds?.includes(userId)) {
      onUserTaskDelete?.(data);
    }
  }, [userId, onUserTaskDelete]);

  const handleTaskAssigned = useCallback((data: TaskEventData) => {
    if (userId && data.assigneeIds?.includes(userId)) {
      if (enableSounds) {
        soundManager.playTaskCreatedSound();
      }
      onTaskAssigned?.(data);
    }
  }, [userId, onTaskAssigned, enableSounds]);

  const handleTaskUnassigned = useCallback((data: TaskEventData) => {
    if (userId && data.unassignedUserIds?.includes(userId)) {
      onTaskUnassigned?.(data);
    }
  }, [userId, onTaskUnassigned]);

  useEffect(() => {
    const unsubscribe = subscribeToUserTaskEvents({
      onUserTaskCreate: handleUserTaskCreate,
      onUserTaskUpdate: handleUserTaskUpdate,
      onUserTaskDelete: handleUserTaskDelete,
      onTaskAssigned: handleTaskAssigned,
      onTaskUnassigned: handleTaskUnassigned
    });

    return unsubscribe;
  }, [subscribeToUserTaskEvents, handleUserTaskCreate, handleUserTaskUpdate, handleUserTaskDelete, handleTaskAssigned, handleTaskUnassigned]);

  return {
    isConnected,
    addNotification
  };
}