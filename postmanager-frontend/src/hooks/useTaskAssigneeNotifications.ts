'use client';

import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from './useAuth';
import { Task } from '@/types/task.types';

interface UseTaskAssigneeNotificationsProps {
  tasks: Task[];
  isLoading: boolean;
  projectId?: number;
}

export function useTaskAssigneeNotifications({ tasks, isLoading, projectId }: UseTaskAssigneeNotificationsProps) {
  const previousTasksRef = useRef<Task[]>([]);
  const isFirstLoadRef = useRef(true);
  const { user } = useAuth();

  // Функция для воспроизведения звука уведомления
  const playNotificationSound = useCallback((soundType: 'task-created' | 'task-completed' | 'task-updated' | 'task-deleted' = 'task-created') => {
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
  }, []);

  // Функция для проверки, является ли текущий пользователь исполнителем задачи
  const isCurrentUserAssignee = useCallback((task: Task): boolean => {
    if (!user || !task.assignees) return false;
    
    return task.assignees.some(assignee => assignee.userId === user.id);
  }, [user]);

  // Функция для получения списка имен исполнителей (исключая текущего пользователя)
  const getOtherAssigneeNames = useCallback((task: Task): string[] => {
    if (!user || !task.assignees) return [];
    
    return task.assignees
      .filter(assignee => assignee.userId !== user.id)
      .map(assignee => assignee.user?.name || 'Пользователь');
  }, [user]);

  // Функция для безопасного получения времени из даты
  const getDeadlineTime = useCallback((deadline: Date | string | null | undefined): number | null => {
    if (!deadline) return null;
    try {
      return new Date(deadline).getTime();
    } catch (error) {
      console.log('Ошибка при парсинге даты:', error);
      return null;
    }
  }, []);

  // Функция для показа уведомления о новой задаче
  const showNewTaskNotification = useCallback((task: Task) => {
    if (!isCurrentUserAssignee(task)) return;

    playNotificationSound('task-created');
    
    const otherAssignees = getOtherAssigneeNames(task);
    const assigneeText = otherAssignees.length > 0 
      ? ` (вместе с ${otherAssignees.join(', ')})`
      : '';
    
    toast.success(`Вам назначена новая задача: "${task.title}"${assigneeText}`, {
      duration: 8000,
      icon: '📋',
      style: {
        background: '#10b981',
        color: '#ffffff',
        fontSize: '14px',
        fontWeight: '500'
      }
    });
  }, [isCurrentUserAssignee, getOtherAssigneeNames, playNotificationSound]);

  // Функция для показа уведомления об обновленной задаче
  const showUpdatedTaskNotification = useCallback((task: Task, prevTask: Task) => {
    if (!isCurrentUserAssignee(task)) return;

    let notificationMessage = '';
    let soundType: 'task-created' | 'task-completed' | 'task-updated' | 'task-deleted' = 'task-updated';

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
       const newAssignees = getOtherAssigneeNames(task);
       if (newAssignees.length > 0) {
         notificationMessage = `К задаче "${task.title}" добавлены исполнители: ${newAssignees.join(', ')}`;
       } else {
         notificationMessage = `Исполнители задачи "${task.title}" обновлены`;
       }
     }

    if (notificationMessage) {
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
  }, [isCurrentUserAssignee, getOtherAssigneeNames, playNotificationSound]);

  // Функция для показа уведомления об удаленной задаче
  const showDeletedTaskNotification = useCallback((task: Task) => {
    if (!isCurrentUserAssignee(task)) return;

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
  }, [isCurrentUserAssignee]);

  useEffect(() => {
    if (isLoading || !tasks || !user) return;

    // Пропускаем первую загрузку
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      previousTasksRef.current = tasks;
      return;
    }

    const previousTasks = previousTasksRef.current;
    
    // Проверяем новые задачи
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

    // Показываем уведомления о новых задачах
    newTasks.forEach(task => {
      showNewTaskNotification(task);
    });

    // Показываем уведомления об обновленных задачах
    updatedTasks.forEach(task => {
      const prevTask = previousTasks.find(prev => prev.id === task.id);
      if (prevTask) {
        showUpdatedTaskNotification(task, prevTask);
      }
    });

    // Показываем уведомления об удаленных задачах
    removedTasks.forEach(task => {
      showDeletedTaskNotification(task);
    });

    previousTasksRef.current = tasks;
  }, [tasks, isLoading, projectId, user, showNewTaskNotification, showUpdatedTaskNotification, showDeletedTaskNotification, getDeadlineTime]);

  // Возвращаем функции для внешнего использования
  return {
    showNewTaskNotification,
    showUpdatedTaskNotification,
    showDeletedTaskNotification,
    playNotificationSound
  };
} 