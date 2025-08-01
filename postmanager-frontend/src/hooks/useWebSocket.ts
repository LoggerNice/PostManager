'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './useAuth';
import { NotificationData } from '@/components/ui/NotificationToast';
import { Task } from '@/types/task.types';

interface UseWebSocketReturn {
  isConnected: boolean;
  notifications: NotificationData[];
  addNotification: (notification: NotificationData) => void;
  removeNotification: (index: number) => void;
  onTaskUpdate?: (task: Task) => void;
  onTaskCreate?: (task: Task) => void;
  onTaskDelete?: (taskId: number) => void;
  onTaskMove?: (taskId: number, newStatus: string) => void;
}

export function useWebSocket(
  onTaskUpdate?: (task: Task) => void,
  onTaskCreate?: (task: Task) => void,
  onTaskDelete?: (taskId: number) => void,
  onTaskMove?: (taskId: number, newStatus: string) => void
): UseWebSocketReturn {
  const { user, token } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // Сохраняем callback функции в ref для избежания проблем с замыканиями
  const callbacksRef = useRef({
    onTaskUpdate,
    onTaskCreate,
    onTaskDelete,
    onTaskMove
  });

  // Обновляем callbacks при изменении
  useEffect(() => {
    callbacksRef.current = {
      onTaskUpdate,
      onTaskCreate,
      onTaskDelete,
      onTaskMove
    };
  }, [onTaskUpdate, onTaskCreate, onTaskDelete, onTaskMove]);

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
    socket.on('task_created', (task: Task) => {
      if (callbacksRef.current.onTaskCreate) {
        callbacksRef.current.onTaskCreate(task);
      }
    });

    socket.on('task_updated', (task: Task) => {
      if (callbacksRef.current.onTaskUpdate) {
        callbacksRef.current.onTaskUpdate(task);
      }
    });

    socket.on('task_deleted', (data: { taskId: number }) => {
      if (callbacksRef.current.onTaskDelete) {
        callbacksRef.current.onTaskDelete(data.taskId);
      }
    });

    socket.on('task_moved', (data: { taskId: number; newStatus: string }) => {
      if (callbacksRef.current.onTaskMove) {
        callbacksRef.current.onTaskMove(data.taskId, data.newStatus);
      }
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

  const addNotification = useCallback((notification: NotificationData) => {
    setNotifications(prev => [...prev, notification]);
  }, []);

  const removeNotification = useCallback((index: number) => {
    setNotifications(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    isConnected,
    notifications,
    addNotification,
    removeNotification,
  };
} 