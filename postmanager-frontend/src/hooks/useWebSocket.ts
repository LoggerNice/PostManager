'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { NotificationData } from '@/components/ui/NotificationToast';

export interface TaskEventData {
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_moved';
  task?: any;
  taskId?: number;
  projectId: number;
  userId?: number;
  sourceColumn?: string;
  destinationColumn?: string;
  sourceIndex?: number;
  destinationIndex?: number;
  timestamp: string;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  notifications: NotificationData[];
  addNotification: (notification: NotificationData) => void;
  removeNotification: (index: number) => void;
  joinProject: (projectId: number) => void;
  leaveProject: (projectId: number) => void;
  onTaskEvent: (callback: (event: TaskEventData) => void) => void;
  offTaskEvent: (callback: (event: TaskEventData) => void) => void;
}

export function useWebSocket(): UseWebSocketReturn {
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const taskEventCallbacks = useRef<((event: TaskEventData) => void)[]>([]);

  useEffect(() => {
    if (!user || !token) {
      return;
    }

    // Создаем подключение к WebSocket серверу
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3045', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      timeout: 20000, // Увеличиваем таймаут до 20 секунд
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
    socket.on('task_event', (event: TaskEventData) => {
      console.log('Received task event:', event);
      taskEventCallbacks.current.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          console.error('Error in task event callback:', error);
        }
      });
    });

    // Обработка ошибок
    socket.on('connect_error', (error) => {
      console.error('Ошибка подключения WebSocket:', error);
      setIsConnected(false);
    });

    socket.on('reconnect', (attemptNumber) => {
      setIsConnected(true);
    });

    socket.on('reconnect_error', (error) => {
      console.error('Ошибка переподключения WebSocket:', error);
    });

    socket.on('reconnect_failed', () => {
      console.error('Не удалось переподключиться к WebSocket серверу');
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, token]);

  const addNotification = (notification: NotificationData) => {
    setNotifications(prev => [...prev, notification]);
  };

  const removeNotification = (index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  };

  const joinProject = useCallback((projectId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('join_project', projectId);
      console.log(`Joined project room: ${projectId}`);
    }
  }, [isConnected]);

  const leaveProject = useCallback((projectId: number) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit('leave_project', projectId);
      console.log(`Left project room: ${projectId}`);
    }
  }, [isConnected]);

  const onTaskEvent = useCallback((callback: (event: TaskEventData) => void) => {
    taskEventCallbacks.current.push(callback);
  }, []);

  const offTaskEvent = useCallback((callback: (event: TaskEventData) => void) => {
    const index = taskEventCallbacks.current.indexOf(callback);
    if (index > -1) {
      taskEventCallbacks.current.splice(index, 1);
    }
  }, []);

  return {
    isConnected,
    notifications,
    addNotification,
    removeNotification,
    joinProject,
    leaveProject,
    onTaskEvent,
    offTaskEvent,
  };
} 