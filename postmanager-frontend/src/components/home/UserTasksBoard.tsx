'use client';

import { useMemo } from 'react';
import { TaskStatus, TaskPriority, TaskForm, Task } from '@/types/task.types';
import { Column } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { soundManager } from '@/utils/soundUtils';

import TasksTab from '../projectComponents/TasksTab';

const initialColumns: Record<string, Column> = {
  IN_PROGRESS: {
    name: "В процессе",
    items: [],
  },
  PROBLEM: {
    name: "Согласование",
    items: [],
  },
  COMPLETED: {
    name: "Выполнено",
    items: [],
  },
};

export default function UserTasksBoard() {
  const { user } = useAuth();
  const userId = user?.id;

  // Утилиты для работы с приоритетами
  const priorityMapToEnglish: Record<string, TaskPriority> = {
    'Низкий': 'LOW',
    'Средний': 'MEDIUM',
    'Высокий': 'HIGH'
  };

  // Используем новый хук для работы с задачами
  const {
    userTasks,
    groupedUserTasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    sortTasksByPriority
  } = useTasks({ enableSounds: true, autoSync: true });

  // Формируем колонки из сгруппированных задач пользователя
  const columns: Record<string, Column> = useMemo(() => {
    if (groupedUserTasks && Object.keys(groupedUserTasks).length > 0) {
      return {
        IN_PROGRESS: { 
          name: 'В процессе', 
          items: groupedUserTasks.IN_PROGRESS || [] 
        },
        PROBLEM: { 
          name: 'Согласование', 
          items: groupedUserTasks.PROBLEM || [] 
        },
        COMPLETED: { 
          name: 'Выполнено', 
          items: groupedUserTasks.COMPLETED || [] 
        }
      };
    }

    return initialColumns;
  }, [groupedUserTasks]);

  const handleCreateTask = async (
    columnId: string,
    title: string,
    description: string = '',
    priority: TaskPriority = 'LOW',
    deadline?: string,
    assigneeIds?: number[]
  ) => {
    if (!title.trim() || !userId) return;

    // Определяем порядок для новой задачи (в конце списка)
    const currentColumnItems = columns[columnId]?.items || [];
    const nextOrder = currentColumnItems.length;

    // Убеждаемся, что текущий пользователь включен в список исполнителей
    const finalAssigneeIds = assigneeIds || [];
    if (!finalAssigneeIds.includes(userId)) {
      finalAssigneeIds.push(userId);
    }

    // Находим первый проект пользователя для создания задачи
    const firstProject = userTasks?.[0]?.projectId;
    if (!firstProject) {
      console.error('Нет доступных проектов для создания задачи');
      return;
    }

    const taskData: TaskForm = {
      title: title.trim(),
      description: description.trim(),
      priority: priority,
      status: columnId as TaskStatus,
      projectId: firstProject,
      deadline: deadline,
      order: nextOrder,
      assigneeIds: finalAssigneeIds
    };

    try {
      await createTask(taskData);

      // Воспроизводим звук при появлении задачи в столбце "В процессе"
      if (columnId === 'IN_PROGRESS') {
        soundManager.playTaskCreatedSound();
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      alert('Ошибка при создании задачи. Проверьте консоль для деталей.');
    }
  };

  const handleDeleteTask = async (columnId: string, taskId: string) => {
    try {
      // Находим проект задачи
      const task = userTasks.find((t: Task) => t.id === taskId);
      if (!task?.projectId) {
        console.error('Task project not found');
        return;
      }

      await deleteTask(taskId, task.projectId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Ошибка при удалении задачи. Проверьте консоль для деталей.');
    }
  };

  const handleTaskUpdate = async (taskId: string, updatedTask: Task) => {
    try {
      // Находим проект задачи
      const task = userTasks.find((t: Task) => t.id === taskId);
      if (!task?.projectId) {
        console.error('Task project not found');
        return;
      }

             // Подготавливаем данные для обновления
       const updateData: Partial<TaskForm> = {
         title: updatedTask.title,
         description: updatedTask.description || '',
         priority: priorityMapToEnglish[updatedTask.priority as keyof typeof priorityMapToEnglish] || 'LOW',
         status: updatedTask.status,
         projectId: updatedTask.projectId,
         deadline: updatedTask.deadline ? new Date(updatedTask.deadline).toISOString().split('T')[0] : undefined,
         order: updatedTask.order
       };

      await updateTask(taskId, updateData);
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Ошибка при обновлении задачи. Проверьте консоль для деталей.');
    }
  };

  const handleUpdateColumnName = (columnId: string, newName: string) => {
    // Не реализовано, если потребуется — добавить
  };

  const handleTaskMove = async (
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    try {
      // Находим задачу
      const task = userTasks.find((t: Task) => t.id === taskId);
      if (!task?.projectId) {
        console.error('Task project not found');
        return;
      }

      // Подготавливаем данные для обновления
      const updateData: Partial<TaskForm> = {
        status: destinationColumnId as TaskStatus,
        order: destinationIndex
      };

      // Если задача перемещается в 'Выполнено', сбрасываем приоритет
      if (destinationColumnId === 'COMPLETED') {
        updateData.priority = 'LOW';
      }

      await updateTask(taskId, updateData);

      // Воспроизводим звук при перемещении в столбцы "Согласование" или "Выполнено"
      if (destinationColumnId === 'PROBLEM' || destinationColumnId === 'COMPLETED') {
        soundManager.playTaskMovedSound();
      }

    } catch (error) {
      console.error('Failed to update task order or status:', error);
      alert('Ошибка при перемещении задачи. Проверьте консоль для деталей.');
    }
  };

  if (isLoading) return <div className="text-white">Загрузка задач...</div>;
  if (error) return <div className="text-white">Ошибка при загрузке задач: {error}</div>;
  if (!userId) return <div className="text-white">Пользователь не авторизован</div>;

  return (
    <div className="">
      <div className="ml-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Мои задачи
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Задачи по всем проектам, где вы являетесь исполнителем
        </p>
      </div>
      
      <TasksTab
        columns={columns}
        handleDeleteTask={handleDeleteTask}
        onTaskUpdate={handleTaskUpdate}
        onAddTask={handleCreateTask}
        onUpdateColumnName={handleUpdateColumnName}
        onTaskMove={handleTaskMove}
      />
    </div>
  );
} 