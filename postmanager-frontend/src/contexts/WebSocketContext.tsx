'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/hooks/useAuth';
import { NotificationData } from '@/components/ui/NotificationToast';
import { Task } from '@/types/task.types';

interface WebSocketContextType {
  isConnected: boolean;
  notifications: NotificationData[];
  addNotification: (notification: NotificationData) => void;
  removeNotification: (index: number) => void;
  subscribeToTaskEvents: (callbacks: TaskEventCallbacks) => () => void;
}

interface TaskEventCallbacks {
  onTaskUpdate?: (task: Task) => void;
  onTaskCreate?: (task: Task) => void;
  onTaskDelete?: (taskId: number) => void;
  onTaskMove?: (taskId: number, newStatus: string) => void;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const subscribersRef = useRef<Set<TaskEventCallbacks>>(new Set());

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    // Создаем подключение к WebSocket серверу
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3045', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      timeout: 20000,
      forceNew: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
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
    socket.on('notification', (notification: NotificationData) => {
      addNotification(notification);
    });

    socket.on('project_notification', (notification: NotificationData & { projectId: number }) => {
      addNotification(notification);
    });

    // Обработка событий задач
    socket.on('task_created', (data: { task: Task; projectId: number }) => {
      subscribersRef.current.forEach(callbacks => {
        if (callbacks.onTaskCreate) {
          callbacks.onTaskCreate(data.task);
        }
      });
    });

    socket.on('task_updated', (data: { task: Task; projectId: number }) => {
      subscribersRef.current.forEach(callbacks => {
        if (callbacks.onTaskUpdate) {
          callbacks.onTaskUpdate(data.task);
        }
      });
    });

    socket.on('task_deleted', (data: { taskId: number; projectId: number }) => {
      subscribersRef.current.forEach(callbacks => {
        if (callbacks.onTaskDelete) {
          callbacks.onTaskDelete(data.taskId);
        }
      });
    });

    socket.on('task_moved', (data: { taskId: number; newStatus: string }) => {
      subscribersRef.current.forEach(callbacks => {
        if (callbacks.onTaskMove) {
          callbacks.onTaskMove(data.taskId, data.newStatus);
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

  const addNotification = useCallback((notification: NotificationData) => {
    setNotifications(prev => {
      // Добавляем уникальный ID к уведомлению если его нет
      const notificationWithId = {
        ...notification,
        id: `${Date.now()}-${Math.random()}`
      };
      return [...prev, notificationWithId];
    });
  }, []);

  const removeNotification = useCallback((index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  const subscribeToTaskEvents = useCallback((callbacks: TaskEventCallbacks) => {
    subscribersRef.current.add(callbacks);
    
    return () => {
      subscribersRef.current.delete(callbacks);
    };
  }, []);

  return (
    <WebSocketContext.Provider value={{
      isConnected,
      notifications,
      addNotification,
      removeNotification,
      subscribeToTaskEvents
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