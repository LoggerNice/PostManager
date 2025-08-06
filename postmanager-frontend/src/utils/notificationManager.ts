'use client';

import React from 'react';
import { soundManager } from './soundUtils';

export interface SmartNotification {
  id: string;
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_assigned' | 'task_unassigned' | 'comment_added';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high';
  taskId?: number;
  projectId?: number;
  userId?: number;
  timestamp: string;
  sound?: boolean;
  autoHide?: boolean;
  hideDelay?: number;
}

class NotificationManager {
  private notifications: SmartNotification[] = [];
  private listeners: ((notifications: SmartNotification[]) => void)[] = [];
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  
  // Добавление уведомления с умной логикой
  addNotification(notification: Omit<SmartNotification, 'id'>, debounceMs: number = 500) {
    const debounceKey = `${notification.type}_${notification.taskId}_${notification.projectId}`;
    
    // Очищаем предыдущий таймер
    const existingTimer = this.debounceTimers.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Устанавливаем новый таймер для debouncing
    const timer = setTimeout(() => {
      this.processNotification(notification);
      this.debounceTimers.delete(debounceKey);
    }, debounceMs);
    
    this.debounceTimers.set(debounceKey, timer);
  }
  
  // Немедленное добавление уведомления (для критических событий)
  addNotificationImmediate(notification: Omit<SmartNotification, 'id'>) {
    this.processNotification(notification);
  }
  
  private processNotification(notification: Omit<SmartNotification, 'id'>) {
    const smartNotification: SmartNotification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      autoHide: notification.priority !== 'high', // Высокий приоритет не скрывается автоматически
      hideDelay: this.getHideDelay(notification.priority)
    };
    
    // Проверяем дубликаты
    const isDuplicate = this.notifications.some(n => 
      n.type === smartNotification.type && 
      n.taskId === smartNotification.taskId && 
      n.projectId === smartNotification.projectId &&
      Date.now() - new Date(n.timestamp).getTime() < 5000 // в течение 5 секунд
    );
    
    if (isDuplicate) {
      console.log('Duplicate notification ignored:', smartNotification);
      return;
    }
    
    // Добавляем уведомление
    this.notifications.push(smartNotification);
    
    // Ограничиваем количество уведомлений
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(-50);
    }
    
    // Воспроизводим звук если нужно
    if (smartNotification.sound !== false) {
      this.playNotificationSound(smartNotification);
    }
    
    // Уведомляем слушателей
    this.notifyListeners();
    
    // Автоматически скрываем если настроено
    if (smartNotification.autoHide) {
      setTimeout(() => {
        this.removeNotification(smartNotification.id);
      }, smartNotification.hideDelay);
    }
  }
  
  private getHideDelay(priority: 'low' | 'medium' | 'high'): number {
    switch (priority) {
      case 'low': return 3000;
      case 'medium': return 5000;
      case 'high': return 10000;
      default: return 5000;
    }
  }
  
  private playNotificationSound(notification: SmartNotification) {
    switch (notification.type) {
      case 'task_created':
      case 'task_assigned':
        if (notification.priority === 'high') {
          soundManager.playTaskCreatedSound();
        }
        break;
      case 'task_updated':
        // Воспроизводим звук только для важных обновлений
        if (notification.message.includes('статус') && notification.priority !== 'low') {
          soundManager.playTaskCreatedSound();
        }
        break;
      case 'comment_added':
        soundManager.playTaskCreatedSound();
        break;
    }
  }
  
  // Удаление уведомления
  removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }
  
  // Очистка всех уведомлений
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }
  
  // Получение уведомлений
  getNotifications(): SmartNotification[] {
    return [...this.notifications];
  }
  
  // Подписка на изменения
  subscribe(listener: (notifications: SmartNotification[]) => void) {
    this.listeners.push(listener);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }
  
  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }
  
  // Очистка таймеров
  cleanup() {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
  
  // Получение статистики
  getStats() {
    return {
      total: this.notifications.length,
      byType: this.notifications.reduce((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: this.notifications.reduce((acc, n) => {
        acc[n.priority] = (acc[n.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }
}

// Экспортируем синглтон
export const notificationManager = new NotificationManager();

// React хук для использования в компонентах
export function useNotificationManager() {
  const [notifications, setNotifications] = React.useState<SmartNotification[]>([]);
  
  React.useEffect(() => {
    // Подписываемся на изменения
    const unsubscribe = notificationManager.subscribe(setNotifications);
    
    // Получаем текущие уведомления
    setNotifications(notificationManager.getNotifications());
    
    // Очищаем при размонтировании
    return () => {
      unsubscribe();
      notificationManager.cleanup();
    };
  }, []);
  
  return {
    notifications,
    addNotification: notificationManager.addNotification.bind(notificationManager),
    addNotificationImmediate: notificationManager.addNotificationImmediate.bind(notificationManager),
    removeNotification: notificationManager.removeNotification.bind(notificationManager),
    clearAll: notificationManager.clearAll.bind(notificationManager),
    getStats: notificationManager.getStats.bind(notificationManager)
  };
}

