'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationData } from '@/components/ui/NotificationToast';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

interface NotificationContextType {
  notificationHistory: NotificationData[];
  unreadCount: number;
  markAllAsRead: () => void;
  addNotificationToHistory: (notification: NotificationData) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Константы
const NOTIFICATION_HISTORY_KEY = 'notificationHistory';
const MAX_NOTIFICATIONS = 100;

/**
 * Провайдер для управления историей уведомлений
 * Обеспечивает глобальное состояние для уведомлений во всем приложении
 */
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notificationHistory, setNotificationHistory] = useState<NotificationData[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { notifications } = useWebSocketContext();

  /**
   * Загружаем историю уведомлений из localStorage при инициализации
   * Обрабатываем существующие уведомления без поля isRead
   */
  useEffect(() => {
    const savedHistory = localStorage.getItem(NOTIFICATION_HISTORY_KEY);
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory);
        const processedHistory = parsedHistory.map((notification: NotificationData & { isRead?: boolean }) => ({
          ...notification,
          isRead: notification.isRead !== undefined ? notification.isRead : true
        }));
        setNotificationHistory(processedHistory);
        
        const count = processedHistory.filter((notification: NotificationData & { isRead: boolean }) => !notification.isRead).length;
        setUnreadCount(count);
      } catch (error) {
        console.error('Ошибка при загрузке истории уведомлений:', error);
      }
    }
  }, []);

  /**
   * Добавляем новые уведомления из WebSocket контекста в историю
   */
  useEffect(() => {
    if (notifications.length > 0) {
      const latestNotification = notifications[notifications.length - 1];
      addNotificationToHistory(latestNotification);
    }
  }, [notifications]);

  /**
   * Добавляем новое уведомление в историю
   * Проверяем на дубликаты и ограничиваем количество уведомлений
   */
  const addNotificationToHistory = useCallback((notification: NotificationData) => {
    const isDuplicate = notificationHistory.some(
      (item) => 
        item.title === notification.title && 
        item.message === notification.message &&
        new Date(item.timestamp).getTime() === new Date(notification.timestamp).getTime()
    );

    if (!isDuplicate) {
      const notificationWithReadStatus = {
        ...notification,
        isRead: false
      };
      
      const updatedHistory = [...notificationHistory, notificationWithReadStatus];
      const limitedHistory = updatedHistory.slice(-MAX_NOTIFICATIONS);
      
      setNotificationHistory(limitedHistory);
      localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(limitedHistory));
      
      const newCount = limitedHistory.filter(notification => !notification.isRead).length;
      setUnreadCount(newCount);
    }
  }, [notificationHistory]);

  /**
   * Отмечаем все уведомления как прочитанные
   * Обновляем состояние и localStorage
   */
  const markAllAsRead = useCallback(() => {
    const updatedHistory = notificationHistory.map(notification => ({
      ...notification,
      isRead: true
    }));
    
    setNotificationHistory(updatedHistory);
    localStorage.setItem(NOTIFICATION_HISTORY_KEY, JSON.stringify(updatedHistory));
    setUnreadCount(0);
  }, [notificationHistory]);

  /**
   * Синхронизируем unreadCount с notificationHistory
   */
  useEffect(() => {
    const count = notificationHistory.filter(notification => !notification.isRead).length;
    setUnreadCount(count);
  }, [notificationHistory]);

  /**
   * Обновляем индикатор непрочитанных уведомлений в заголовке страницы
   */
  useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) PostManager`;
    } else {
      document.title = 'PostManager';
    }
  }, [unreadCount]);

  return (
    <NotificationContext.Provider value={{
      notificationHistory,
      unreadCount,
      markAllAsRead,
      addNotificationToHistory
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

/**
 * Хук для использования контекста уведомлений
 * Должен использоваться только внутри NotificationProvider
 */
export function useNotificationHistory() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationHistory must be used within a NotificationProvider');
  }
  return context;
} 