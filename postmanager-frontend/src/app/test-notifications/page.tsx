'use client';

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { Task } from '@/types/task.types';

export default function TestNotificationsPage() {
  const { user } = useAuth();
  const [testTask, setTestTask] = useState<Task>({
    id: '1',
    title: 'Тестовая задача',
    description: 'Описание тестовой задачи',
    priority: 'Средний',
    status: 'IN_PROGRESS',
    projectId: 1,
    project: {} as any,
    assignees: [
      {
        id: 1,
        taskId: 1,
        userId: user?.id || 1,
        assignedAt: new Date(),
        user: {
          id: user?.id || 1,
          name: user?.name || 'Текущий пользователь',
          login: user?.login || 'user',
          role: user?.role || 'USER',
          departmentId: user?.departmentId || 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 дней
    order: 1
  });

  const playNotificationSound = (soundType: 'task-created' | 'task-completed' | 'task-updated' = 'task-created') => {
    try {
      let audioFile = '/meet-message-sound-1.mp3';
      
      if (soundType === 'task-completed') {
        audioFile = '/cena_notification.mp3';
      }
      
      const audio = new Audio(audioFile);
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.log(`Не удалось воспроизвести звук уведомления (${soundType}):`, error);
      });
    } catch (error) {
      console.log(`Ошибка при создании аудио элемента для уведомления (${soundType}):`, error);
    }
  };

  const testNewTaskNotification = () => {
    playNotificationSound('task-created');
    toast.success(`Вам назначена новая задача: "${testTask.title}"`, {
      duration: 8000,
      icon: '📋',
      style: {
        background: '#10b981',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '500'
      }
    });
  };

  const testTaskCompletedNotification = () => {
    playNotificationSound('task-completed');
    toast.success(`Задача "${testTask.title}" выполнена! 🎉`, {
      duration: 6000,
      icon: '✅',
      style: {
        background: '#10b981',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '500'
      }
    });
  };

  const testTaskUpdatedNotification = () => {
    playNotificationSound('task-updated');
    toast.success(`Статус задачи "${testTask.title}" изменен на "В процессе"`, {
      duration: 6000,
      icon: '📝',
      style: {
        background: '#3b82f6',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '500'
      }
    });
  };

  const testTaskDeletedNotification = () => {
    toast.error(`Задача "${testTask.title}" была удалена`, {
      duration: 6000,
      icon: '🗑️',
      style: {
        background: '#ef4444',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '500'
      }
    });
  };



  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
        Тестирование уведомлений о задачах
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Информация о текущем пользователе
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">ID пользователя:</p>
            <p className="font-medium text-gray-900 dark:text-white">{user?.id || 'Не определен'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Имя пользователя:</p>
            <p className="font-medium text-gray-900 dark:text-white">{user?.name || 'Не определен'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Роль:</p>
            <p className="font-medium text-gray-900 dark:text-white">{user?.role || 'Не определена'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Отдел:</p>
            <p className="font-medium text-gray-900 dark:text-white">{user?.departmentId || 'Не определен'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Тестовая задача
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Название:</p>
            <p className="font-medium text-gray-900 dark:text-white">{testTask.title}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Статус:</p>
            <p className="font-medium text-gray-900 dark:text-white">{testTask.status}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Приоритет:</p>
            <p className="font-medium text-gray-900 dark:text-white">{testTask.priority}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Дедлайн:</p>
            <p className="font-medium text-gray-900 dark:text-white">
              {testTask.deadline ? new Date(testTask.deadline).toLocaleDateString('ru-RU') : 'Не установлен'}
            </p>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Исполнители:</p>
          <div className="space-y-1">
            {testTask.assignees?.map((assignee, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span className="text-gray-900 dark:text-white">{assignee.user.name}</span>
                {assignee.userId === user?.id && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Вы</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Тестирование уведомлений
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={testNewTaskNotification}
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            📋 Новая задача
          </button>
          
          <button
            onClick={testTaskCompletedNotification}
            className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            ✅ Задача выполнена
          </button>
          
          <button
            onClick={testTaskUpdatedNotification}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            📝 Задача обновлена
          </button>
          
          <button
            onClick={testTaskDeletedNotification}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            🗑️ Задача удалена
          </button>
          
          
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Инструкции по тестированию
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>• Нажмите на кнопки выше для тестирования различных типов уведомлений</li>
            <li>• Уведомления будут показаны в правом нижнем углу экрана</li>
            <li>• Звуковые уведомления воспроизводятся автоматически</li>
            <li>• Уведомления автоматически исчезают через несколько секунд</li>
            <li>• Для тестирования в реальном проекте перейдите на страницу проекта</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 