'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, MessageCircle, Clock } from 'lucide-react';
import { soundManager } from '@/utils/soundUtils';

export interface NotificationData {
  type: 'task_created' | 'task_updated' | 'comment_added';
  title: string;
  message: string;
  taskId?: number;
  projectId?: number;
  userId?: number;
  timestamp: string | Date;
}

interface NotificationToastProps {
  notification: NotificationData;
  onClose: () => void;
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'task_created':
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    case 'task_updated':
      return <Clock className="w-5 h-5 text-blue-500" />;
    case 'comment_added':
      return <MessageCircle className="w-5 h-5 text-purple-500" />;
    default:
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  }
};

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'task_created':
      return 'border-green-500 bg-green-50 dark:bg-green-900/20';
    case 'task_updated':
      return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    case 'comment_added':
      return 'border-purple-500 bg-purple-50 dark:bg-purple-900/20';
    default:
      return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
  }
};

export default function NotificationToast({ notification, onClose }: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Показываем уведомление с небольшой задержкой для анимации
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Воспроизводим звук в зависимости от типа уведомления
    if (notification.type === 'task_created') {
      // Звук при появлении задачи в столбце "В процессе"
      if (notification.message.includes('В процессе')) {
        soundManager.playTaskCreatedSound();
      }
    } else if (notification.type === 'task_updated') {
      // Проверяем, связано ли обновление с перемещением в определенные столбцы
      if (notification.message.includes('Согласование') || notification.message.includes('Выполнено')) {
        soundManager.playTaskMovedSound();
      }
    }
    
    // Автоматически скрываем через 5 секунд
    const autoHideTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Ждем окончания анимации
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(autoHideTimer);
    };
  }, [onClose, notification.type, notification.message]);

  return (
    <div
      className={`max-w-sm w-full transform transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className={`border-l-4 p-4 rounded-lg shadow-lg ${getNotificationColor(notification.type)}`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {getNotificationIcon(notification.type)}
          </div>
                     <div className="ml-3 flex-1">
             <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
               {notification.title}
             </h4>
             <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
               {notification.message}
             </p>
           </div>
          <div className="ml-4 flex-shrink-0">
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 300);
              }}
              className="inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 focus:outline-none focus:text-gray-600 dark:focus:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 