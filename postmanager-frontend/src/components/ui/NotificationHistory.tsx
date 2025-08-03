'use client';

import { useEffect, useRef, useCallback } from 'react';
import { XMarkIcon, BellIcon } from '@heroicons/react/24/outline';
import { useNotificationHistory } from '@/contexts/NotificationContext';

interface NotificationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Компонент модального окна истории уведомлений
 * Отображает все уведомления и автоматически отмечает их как прочитанные при закрытии
 */
export default function NotificationHistory({ isOpen, onClose }: NotificationHistoryProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const { 
    notificationHistory, 
    unreadCount, 
    markAllAsRead 
  } = useNotificationHistory();

  /**
   * Автоматически отмечаем все уведомления как прочитанные при закрытии модального окна
   */
  const handleClose = useCallback(() => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
    onClose();
  }, [unreadCount, markAllAsRead, onClose]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, unreadCount, markAllAsRead, onClose, handleClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center">
      <div ref={modalRef} className="bg-gray-900/95 backdrop-blur-md rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-hidden border border-gray-700/50">
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <BellIcon className="h-6 w-6 text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">История уведомлений</h2>
              <p className="text-sm text-gray-400">
                {notificationHistory.length} уведомлений • {unreadCount} непрочитанных
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {notificationHistory.length === 0 ? (
            <div className="text-center text-gray-400 py-8">
              <BellIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Нет уведомлений в истории</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notificationHistory.slice().reverse().map((notification, index) => {
                const originalIndex = notificationHistory.length - 1 - index;
                const isUnread = !notification.isRead;
                
                return (
                  <div
                    key={`${new Date(notification.timestamp).getTime()}-${index}`}
                    className={`bg-gray-800 rounded-lg p-3 border-l-4 transition-all duration-200 ${
                      isUnread 
                        ? 'border-blue-500 bg-gray-800/80' 
                        : 'border-gray-600 bg-gray-800/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-medium text-sm">
                            {notification.title}
                          </h3>
                          {isUnread && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              Новое
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300 text-sm mt-1">
                          {notification.message}
                        </p>
                        <p className="text-gray-500 text-xs mt-2">
                          {new Date(notification.timestamp).toLocaleString('ru-RU')}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 