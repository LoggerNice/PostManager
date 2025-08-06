'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { NotificationData } from '@/components/ui/NotificationToast';
import { Task } from '@/types/task.types';
import { getWebSocketUrl } from '@/utils/networkConfig';

// Расширенные типы для оптимизированной системы
export interface ExtendedNotificationData extends NotificationData {
  priority?: 'low' | 'medium' | 'high';
  sound?: boolean;
  projectId?: number;
  userId?: number;
}

export interface TaskEventData {
  task?: Task;
  taskId?: number;
  projectId: number;
  userId?: number;
  oldStatus?: string;
  newStatus?: string;
  assigneeIds?: number[];
  unassignedUserIds?: number[];
}

interface WebSocketContextType {
  isConnected: boolean;
  notifications: ExtendedNotificationData[];
  addNotification: (notification: ExtendedNotificationData) => void;
  removeNotification: (index: number) => void;
  subscribeToTaskEvents: (callbacks: TaskEventCallbacks) => () => void;
  subscribeToUserTaskEvents: (callbacks: UserTaskEventCallbacks) => () => void;
  joinProject: (projectId: number) => void;
  leaveProject: (projectId: number) => void;
  currentProjectId: number | null;
}

interface TaskEventCallbacks {
  onTaskUpdate?: (data: TaskEventData) => void;
  onTaskCreate?: (data: TaskEventData) => void;
  onTaskDelete?: (data: TaskEventData) => void;
  onTaskAssignmentChanged?: (data: TaskEventData) => void;
}

interface UserTaskEventCallbacks {
  onUserTaskUpdate?: (data: TaskEventData) => void;
  onUserTaskCreate?: (data: TaskEventData) => void;
  onUserTaskDelete?: (data: TaskEventData) => void;
  onTaskAssigned?: (data: TaskEventData) => void;
  onTaskUnassigned?: (data: TaskEventData) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);



export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<ExtendedNotificationData[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<number | null>(null);
  const taskSubscribersRef = useRef<Set<TaskEventCallbacks>>(new Set());
  const userTaskSubscribersRef = useRef<Set<UserTaskEventCallbacks>>(new Set());
  
  // Debouncing для уведомлений
  const notificationTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    // Определяем URL WebSocket сервера
    const wsUrl = getWebSocketUrl();
    
    // Создаем подключение к WebSocket серверу
    const socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      upgrade: true,
      rememberUpgrade: true
    });

    socketRef.current = socket;

    // Обработчики событий
    socket.on('connect', () => {
      setIsConnected(true);
      
      // Аутентифицируемся через токен
      socket.emit('authenticate', token);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('authenticated', (data: { success: boolean; error?: string }) => {
      if (!data.success) {
        console.error('WebSocket аутентификация не удалась:', data.error);
      }
    });

    // Обработка уведомлений
    socket.on('notification', (notification: ExtendedNotificationData) => {
      addNotificationWithDebounce(notification);
    });

    socket.on('project_notification', (notification: ExtendedNotificationData) => {
      addNotificationWithDebounce(notification);
    });

    // Обработка событий задач проекта
    socket.on('task_created', (data: TaskEventData) => {
      taskSubscribersRef.current.forEach(callbacks => {
        if (callbacks.onTaskCreate) {
          callbacks.onTaskCreate(data);
        }
      });
    });

    socket.on('task_updated', (data: TaskEventData) => {
      taskSubscribersRef.current.forEach(callbacks => {
        if (callbacks.onTaskUpdate) {
          callbacks.onTaskUpdate(data);
        }
      });
    });

    socket.on('task_deleted', (data: TaskEventData) => {
      taskSubscribersRef.current.forEach(callbacks => {
        if (callbacks.onTaskDelete) {
          callbacks.onTaskDelete(data);
        }
      });
    });

    socket.on('task_assignment_changed', (data: TaskEventData) => {
      taskSubscribersRef.current.forEach(callbacks => {
        if (callbacks.onTaskAssignmentChanged) {
          callbacks.onTaskAssignmentChanged(data);
        }
      });
    });

    // Обработка пользовательских событий задач
    socket.on('user_task_created', (data: TaskEventData) => {
      userTaskSubscribersRef.current.forEach(callbacks => {
        if (callbacks.onUserTaskCreate) {
          callbacks.onUserTaskCreate(data);
        }
      });
    });

    socket.on('user_task_updated', (data: TaskEventData) => {
      userTaskSubscribersRef.current.forEach(callbacks => {
        if (callbacks.onUserTaskUpdate) {
          callbacks.onUserTaskUpdate(data);
        }
      });
    });

    socket.on('user_task_deleted', (data: TaskEventData) => {
      userTaskSubscribersRef.current.forEach(callbacks => {
        if (callbacks.onUserTaskDelete) {
          callbacks.onUserTaskDelete(data);
        }
      });
    });

    socket.on('task_assigned', (data: TaskEventData) => {
      userTaskSubscribersRef.current.forEach(callbacks => {
        if (callbacks.onTaskAssigned) {
          callbacks.onTaskAssigned(data);
        }
      });
    });

    socket.on('task_unassigned', (data: TaskEventData) => {
      userTaskSubscribersRef.current.forEach(callbacks => {
        if (callbacks.onTaskUnassigned) {
          callbacks.onTaskUnassigned(data);
        }
      });
    });

    // Обработка ошибок
    socket.on('connect_error', (error) => {
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      setIsConnected(true);
    });

    socket.on('reconnect_error', (error) => {
      // Тихо обрабатываем ошибку переподключения
    });

    socket.on('reconnect_failed', () => {
      // Тихо обрабатываем неудачу переподключения
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, token]);

  // Добавление уведомления с debouncing
  const addNotificationWithDebounce = useCallback((notification: ExtendedNotificationData) => {
    const debounceKey = `${notification.type}_${notification.taskId}_${notification.projectId}`;
    
    // Очищаем предыдущий таймер
    const existingTimeout = notificationTimeouts.current.get(debounceKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    // Устанавливаем новый таймер
    const timeout = setTimeout(() => {
      addNotification(notification);
      notificationTimeouts.current.delete(debounceKey);
    }, 500); // 500ms debounce
    
    notificationTimeouts.current.set(debounceKey, timeout);
  }, []);

  const addNotification = useCallback((notification: ExtendedNotificationData) => {
    setNotifications(prev => {
      // Добавляем уникальный ID к уведомлению если его нет и устанавливаем статус "не прочитано"
      const notificationWithId = {
        ...notification,
        id: `${Date.now()}-${Math.random()}`,
        isRead: false
      };
      
      return [...prev, notificationWithId];
    });
  }, []);

  const removeNotification = useCallback((index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Подписка на события задач проекта
  const subscribeToTaskEvents = useCallback((callbacks: TaskEventCallbacks) => {
    taskSubscribersRef.current.add(callbacks);
    
    return () => {
      taskSubscribersRef.current.delete(callbacks);
    };
  }, []);

  // Подписка на пользовательские события задач
  const subscribeToUserTaskEvents = useCallback((callbacks: UserTaskEventCallbacks) => {
    userTaskSubscribersRef.current.add(callbacks);
    
    return () => {
      userTaskSubscribersRef.current.delete(callbacks);
    };
  }, []);

  // Присоединение к проекту
  const joinProject = useCallback((projectId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_project', projectId);
      setCurrentProjectId(projectId);
    }
  }, [isConnected]);

  // Выход из проекта
  const leaveProject = useCallback((projectId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_project', projectId);
      if (currentProjectId === projectId) {
        setCurrentProjectId(null);
      }
    }
  }, [isConnected, currentProjectId]);

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      notificationTimeouts.current.forEach(timeout => clearTimeout(timeout));
      notificationTimeouts.current.clear();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      notifications,
      addNotification,
      removeNotification,
      subscribeToTaskEvents,
      subscribeToUserTaskEvents,
      joinProject,
      leaveProject,
      currentProjectId
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useWebSocketContext() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
}