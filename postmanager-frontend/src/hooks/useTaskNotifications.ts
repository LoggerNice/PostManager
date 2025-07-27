'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './useAuth';
import { Task } from '@/types/task.types';

interface UseTaskNotificationsProps {
  tasks: Task[];
  isLoading: boolean;
  projectId?: number;
}

export function useTaskNotifications({ tasks, isLoading, projectId }: UseTaskNotificationsProps) {
  const previousTasksRef = useRef<Task[]>([]);
  const isFirstLoadRef = useRef(true);
  const lastNotificationRef = useRef<{ taskId: string; type: string; timestamp: number } | null>(null);
  const { user } = useAuth();

  // Функция для воспроизведения звука уведомления
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

  // Функция для проверки, является ли текущий пользователь исполнителем задачи
  const isCurrentUserAssignee = (task: Task): boolean => {
    if (!user || !task.assignees) return false;
    
    return task.assignees.some(assignee => assignee.userId === user.id);
  };



  // Функция для безопасного получения времени из даты
  const getDeadlineTime = (deadline: Date | string | null | undefined): number | null => {
    if (!deadline) return null;
    try {
      return new Date(deadline).getTime();
    } catch (error) {
      console.log('Ошибка при парсинге даты:', error);
      return null;
    }
  };

  // Функция для проверки дублирования уведомлений
  const shouldShowNotification = (taskId: string, type: string): boolean => {
    const now = Date.now();
    const lastNotification = lastNotificationRef.current;
    
    // Если это то же самое уведомление в течение последних 2 секунд, не показываем
    if (lastNotification && 
        lastNotification.taskId === taskId && 
        lastNotification.type === type && 
        now - lastNotification.timestamp < 2000) {
      return false;
    }
    
    // Обновляем информацию о последнем уведомлении
    lastNotificationRef.current = { taskId, type, timestamp: now };
    return true;
  };

  useEffect(() => {
    if (isLoading || !tasks || !user) return;

    // Пропускаем первую загрузку
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      previousTasksRef.current = tasks;
      lastNotificationRef.current = null; // Сбрасываем историю уведомлений
      return;
    }

    const previousTasks = previousTasksRef.current;
    
    // Проверяем новые задачи (только если есть изменения)
    const newTasks = tasks.filter(task => 
      !previousTasks.some(prevTask => prevTask.id === task.id)
    );

    // Проверяем обновленные задачи
    const updatedTasks = tasks.filter(task => {
      const prevTask = previousTasks.find(prev => prev.id === task.id);
      if (!prevTask) return false;
      
      // Проверяем изменения статуса, приоритета, дедлайна или исполнителей
      const prevDeadline = getDeadlineTime(prevTask.deadline);
      const currentDeadline = getDeadlineTime(task.deadline);
      
      return (
        prevTask.status !== task.status ||
        prevTask.priority !== task.priority ||
        prevDeadline !== currentDeadline ||
        JSON.stringify(prevTask.assignees) !== JSON.stringify(task.assignees)
      );
    });

    // Проверяем удаленные задачи
    const removedTasks = previousTasks.filter(prevTask => 
      !tasks.some(task => task.id === prevTask.id)
    );

    // Уведомления о новых задачах (только для исполнителей)
    newTasks.forEach(task => {
      if (isCurrentUserAssignee(task) && shouldShowNotification(task.id, 'new-task')) {
        playNotificationSound('task-created');
        
        toast.success(`Вам назначена новая задача: "${task.title}"`, {
          duration: 8000,
          icon: '📋',
          style: {
            background: '#10b981',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500'
          }
        });
      }
    });

    // Уведомления об обновленных задачах
    updatedTasks.forEach(task => {
      if (isCurrentUserAssignee(task)) {
        const prevTask = previousTasks.find(prev => prev.id === task.id);
        if (!prevTask) return;

        let notificationMessage = '';
        let soundType: 'task-created' | 'task-completed' | 'task-updated' = 'task-updated';

        // Проверяем изменение статуса
        if (prevTask.status !== task.status) {
          if (task.status === 'COMPLETED') {
            notificationMessage = `Задача "${task.title}" выполнена! 🎉`;
            soundType = 'task-completed';
          } else {
            const statusLabels = {
              'IN_PROGRESS': 'В процессе',
              'PROBLEM': 'Согласование',
              'TODO': 'К выполнению'
            };
            notificationMessage = `Статус задачи "${task.title}" изменен на "${statusLabels[task.status as keyof typeof statusLabels] || task.status}"`;
          }
        }
        // Проверяем изменение приоритета
        else if (prevTask.priority !== task.priority) {
          notificationMessage = `Приоритет задачи "${task.title}" изменен на "${task.priority}"`;
        }
                 // Проверяем изменение дедлайна
         else if (getDeadlineTime(prevTask.deadline) !== getDeadlineTime(task.deadline)) {
           if (task.deadline) {
             try {
               const deadlineDate = new Date(task.deadline).toLocaleDateString('ru-RU');
               notificationMessage = `Дедлайн задачи "${task.title}" установлен на ${deadlineDate}`;
             } catch (error) {
               console.log('Ошибка при форматировании даты:', error);
               notificationMessage = `Дедлайн задачи "${task.title}" обновлен`;
             }
           } else {
             notificationMessage = `Дедлайн задачи "${task.title}" снят`;
           }
         }
         // Проверяем изменение исполнителей
         else if (JSON.stringify(prevTask.assignees) !== JSON.stringify(task.assignees)) {
           notificationMessage = `Исполнители задачи "${task.title}" обновлены`;
         }

        if (notificationMessage && shouldShowNotification(task.id, 'updated-task')) {
          playNotificationSound(soundType);
          
          toast.success(notificationMessage, {
            duration: 6000,
            icon: soundType === 'task-completed' ? '✅' : '📝',
            style: {
              background: soundType === 'task-completed' ? '#10b981' : '#3b82f6',
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '500'
            }
          });
        }
      }
    });

    // Уведомления об удаленных задачах
    removedTasks.forEach(task => {
      if (isCurrentUserAssignee(task) && shouldShowNotification(task.id, 'deleted-task')) {
        toast.error(`Задача "${task.title}" была удалена`, {
          duration: 6000,
          icon: '🗑️',
          style: {
            background: '#ef4444',
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '500'
          }
        });
      }
    });

    previousTasksRef.current = tasks;
  }, [tasks, isLoading, projectId, user]);
} 