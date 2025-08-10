'use client';

import { useState, useEffect, useMemo } from 'react';
import { useGetUserTasksQuery } from '@/store/api/task.api';
import { useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation } from '@/store/api/task.api';
import { TaskStatus, TaskPriority, TaskPriorityDisplay, TaskForm, Task } from '@/types/task.types';
import { Column } from '@/types';
import { getCookie } from '@/utils/cookie';
import { useWebSocketUserTasks } from '@/hooks/useWebSocketTasks';
import { TaskEventData } from '@/contexts/WebSocketContext';
import { useAuth } from '@/hooks/useAuth';

import { groupAndSortTasks, sortTasksByPriority } from '@/utils/taskSorting';
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

  // State variables
  const [localColumns, setLocalColumns] = useState<Record<string, Column>>({});
  const [lastServerSync, setLastServerSync] = useState<number>(0);

  const priorityMapToEnglish: Record<string, TaskPriority> = {
    'Низкий': 'LOW',
    'Средний': 'MEDIUM',
    'Высокий': 'HIGH'
  };

  const priorityMapToRussian = useMemo(() => ({
    'LOW': 'Низкий',
    'MEDIUM': 'Средний',
    'HIGH': 'Высокий'
  }), []);

  // Оптимизированные WebSocket обработчики для пользовательских задач
  const handleUserTaskCreate = (data: TaskEventData) => {
    if (!data.task || !userId || !data.assigneeIds?.includes(userId)) return;

    const task = data.task;
    console.log('Processing user task create:', { taskId: task.id, status: task.status });

    // Преобразуем приоритет в русский язык
    const taskWithRussianPriority = {
      ...task,
      id: String(task.id),
      priority: (priorityMapToRussian[task.priority as TaskPriority] || task.priority) as TaskPriorityDisplay
    } as Task;

    // Обновляем локальное состояние
    setLocalColumns(prevColumns => {
      const newColumns = { ...prevColumns };
      const columnId = task.status;

      if (newColumns[columnId]) {
        // Проверяем, что задача еще не существует
        const existingTaskIndex = newColumns[columnId].items.findIndex(t => t.id === String(task.id));
        if (existingTaskIndex === -1) {
          newColumns[columnId].items.push(taskWithRussianPriority);
          newColumns[columnId].items = sortTasksByPriority(newColumns[columnId].items);
        }
      }

      return newColumns;
    });
  };

  const handleUserTaskUpdate = (data: TaskEventData) => {
    if (!data.task || !userId || !data.assigneeIds?.includes(userId)) return;

    const task = data.task;
    console.log('Processing user task update:', { taskId: task.id, status: task.status });

    // Преобразуем приоритет в русский язык
    const taskWithRussianPriority = {
      ...task,
      id: String(task.id),
      priority: (priorityMapToRussian[task.priority as TaskPriority] || task.priority) as TaskPriorityDisplay
    } as Task;

    // Обновляем локальное состояние
    setLocalColumns(prevColumns => {
      const newColumns = { ...prevColumns };

      // Удаляем задачу из всех колонок
      Object.keys(newColumns).forEach(columnId => {
        newColumns[columnId].items = newColumns[columnId].items.filter(t => t.id !== task.id);
      });

      // Добавляем обновленную задачу в правильную колонку
      const columnId = task.status;
      if (newColumns[columnId]) {
        newColumns[columnId].items.push(taskWithRussianPriority);
        newColumns[columnId].items = sortTasksByPriority(newColumns[columnId].items);
      }

      return newColumns;
    });
  };

  const handleUserTaskDelete = (data: TaskEventData) => {
    if (!data.taskId || !userId || !data.assigneeIds?.includes(userId)) return;

    console.log('Processing user task delete:', { taskId: data.taskId });

    // Обновляем локальное состояние
    setLocalColumns(prevColumns => {
      const newColumns = { ...prevColumns };

      // Удаляем задачу из всех колонок
      Object.keys(newColumns).forEach(columnId => {
        newColumns[columnId].items = newColumns[columnId].items.filter(t => t.id !== data.taskId?.toString());
      });

      return newColumns;
    });
  };

  // Обработчики для назначения/снятия назначения
  const handleTaskAssigned = (data: TaskEventData) => {
    if (!data.task || !userId || !data.assigneeIds?.includes(userId)) return;

    console.log('Processing task assigned:', { taskId: data.task.id });

    const task = data.task;
    const taskWithRussianPriority = {
      ...task,
      id: String(task.id),
      priority: (priorityMapToRussian[task.priority as TaskPriority] || task.priority) as TaskPriorityDisplay
    } as Task;

    // Добавляем задачу в соответствующую колонку
    setLocalColumns(prevColumns => {
      const newColumns = { ...prevColumns };
      const columnId = task.status;

      if (newColumns[columnId]) {
        // Проверяем, что задача еще не существует
        const existingTaskIndex = newColumns[columnId].items.findIndex(t => t.id === String(task.id));
        if (existingTaskIndex === -1) {
          newColumns[columnId].items.push(taskWithRussianPriority);
          newColumns[columnId].items = sortTasksByPriority(newColumns[columnId].items);
        }
      }

      return newColumns;
    });
  };

  const handleTaskUnassigned = (data: TaskEventData) => {
    if (!data.taskId || !userId || !data.unassignedUserIds?.includes(userId)) return;

    console.log('Processing task unassigned:', { taskId: data.taskId });

    // Удаляем задачу из всех колонок
    setLocalColumns(prevColumns => {
      const newColumns = { ...prevColumns };

      Object.keys(newColumns).forEach(columnId => {
        newColumns[columnId].items = newColumns[columnId].items.filter(t => t.id !== data.taskId?.toString());
      });

      return newColumns;
    });
  };

  // Инициализируем оптимизированное WebSocket подключение для пользовательских задач
  const { isConnected } = useWebSocketUserTasks({
    userId,
    onUserTaskCreate: handleUserTaskCreate,
    onUserTaskUpdate: handleUserTaskUpdate,
    onUserTaskDelete: handleUserTaskDelete,
    onTaskAssigned: handleTaskAssigned,
    onTaskUnassigned: handleTaskUnassigned,
    enableSounds: true
  });

  // API hooks
  const {
    data: userTasks,
    refetch: refetchTasks,
    isLoading: isTasksLoading,
    error: tasksError
  } = useGetUserTasksQuery(userId || 0, {
    skip: !userId,
    pollingInterval: 5000,
    refetchOnFocus: true,
    refetchOnReconnect: true
  });

  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  // Функция для автоматической сортировки всех колонок по приоритету
  const sortAllColumnsByPriority = (columns: Record<string, Column>) => {
    const sortedColumns = { ...columns };
    Object.keys(sortedColumns).forEach(columnId => {
      sortedColumns[columnId].items = sortTasksByPriority(sortedColumns[columnId].items);
    });
    return sortedColumns;
  };

  // Формируем колонки из userTasks и синхронизируем с локальным состоянием
  const columns: Record<string, Column> = useMemo(() => {
    if (userTasks) {
      // Преобразуем id в строку и приоритеты в русский язык
      const tasksWithRussianPriority = userTasks.map((task: Task) => ({
        ...task,
        id: String(task.id),
        priority: (priorityMapToRussian[task.priority as TaskPriority] || task.priority) as TaskPriority | TaskPriorityDisplay
      }));

      // Группируем и сортируем задачи по приоритету
      const grouped = groupAndSortTasks(tasksWithRussianPriority);

      const serverColumns = {
        IN_PROGRESS: { name: 'В процессе', items: grouped.IN_PROGRESS },
        PROBLEM: { name: 'Согласование', items: grouped.PROBLEM },
        COMPLETED: { name: 'Выполнено', items: grouped.COMPLETED }
      };

      // Если есть локальные изменения, используем их, иначе серверные данные
      return Object.keys(localColumns).length > 0 ? localColumns : serverColumns;
    }

    return initialColumns;
  }, [userTasks, priorityMapToRussian, localColumns]);

  // Синхронизируем локальное состояние с серверными данными
  useEffect(() => {
    if (userTasks) {
      const now = Date.now();
      const timeSinceLastSync = now - lastServerSync;

      // При первой загрузке или если прошло много времени с последней синхронизации
      if (Object.keys(localColumns).length === 0 || timeSinceLastSync > 30000) {
        const tasksWithRussianPriority = userTasks.map((task: Task) => ({
          ...task,
          id: String(task.id),
          priority: (priorityMapToRussian[task.priority as TaskPriority] || task.priority) as TaskPriority | TaskPriorityDisplay
        }));

        const grouped = groupAndSortTasks(tasksWithRussianPriority);

        const sortedColumns = sortAllColumnsByPriority({
          IN_PROGRESS: { name: 'В процессе', items: grouped.IN_PROGRESS },
          PROBLEM: { name: 'Согласование', items: grouped.PROBLEM },
          COMPLETED: { name: 'Выполнено', items: grouped.COMPLETED }
        });
        setLocalColumns(sortedColumns);
        setLastServerSync(Date.now());
      }
    }
  }, [userTasks, priorityMapToRussian, localColumns, lastServerSync]);

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
    const currentColumnItems = localColumns[columnId]?.items || [];
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
      const newTask = await createTask(taskData).unwrap();

      // Преобразуем приоритет в русский язык для локального состояния
      const newTaskWithRussianPriority = {
        ...newTask,
        priority: priorityMapToRussian[priority] as TaskPriorityDisplay
      };

      // Обновляем локальное состояние с новой задачей
      setLocalColumns(prevColumns => {
        const newColumns = { ...prevColumns };
        if (newColumns[columnId]) {
          // Проверяем, что задача еще не существует (избегаем дубликатов)
          const existingTaskIndex = newColumns[columnId].items.findIndex(t => t.id === newTask.id);
          if (existingTaskIndex === -1) {
            // Добавляем новую задачу
            newColumns[columnId].items.push(newTaskWithRussianPriority);
            // Сортируем задачи в колонке по приоритету
            newColumns[columnId].items = sortTasksByPriority(newColumns[columnId].items);
          }
        }
        return newColumns;
      });

      // Обновляем время последней синхронизации, чтобы избежать конфликтов
      setLastServerSync(Date.now());

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
      // Сначала удаляем из локального состояния для быстрого отклика UI
      const newColumns = { ...localColumns };
      if (newColumns[columnId]) {
        newColumns[columnId].items = newColumns[columnId].items.filter(task => task.id !== taskId);

        // Сортируем оставшиеся задачи в колонке по приоритету
        newColumns[columnId].items = sortTasksByPriority(newColumns[columnId].items);

        setLocalColumns(newColumns);
      }

      await deleteTask(taskId).unwrap();

      // Обновляем время последней синхронизации
      setLastServerSync(Date.now());
    } catch (error) {
      console.error('Failed to delete task:', error);
      // В случае ошибки быстро синхронизируемся с сервером
      await refetchTasks();
    }
  };

  const handleTaskUpdate = async (taskId: string, updatedTask: Task) => {
    // Обновляем локальное состояние для быстрого отклика UI
    const newColumns = { ...localColumns };

    // Находим и обновляем задачу во всех колонках
    Object.keys(newColumns).forEach(columnId => {
      const taskIndex = newColumns[columnId].items.findIndex(task => task.id === taskId);
      if (taskIndex !== -1) {
        newColumns[columnId].items[taskIndex] = updatedTask;

        // Сортируем задачи в колонке по приоритету после обновления
        newColumns[columnId].items = sortTasksByPriority(newColumns[columnId].items);
      }
    });

    setLocalColumns(newColumns);

    // Быстро синхронизируемся с сервером после обновления задачи
    try {
      await refetchTasks();
    } catch (error) {
      console.error('Failed to sync after task update:', error);
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
    // Создаем копию текущих колонок для локального обновления
    const newColumns = { ...localColumns };

    // Находим задачу в исходной колонке
    const sourceColumn = newColumns[sourceColumnId];
    const destinationColumn = newColumns[destinationColumnId];

    if (!sourceColumn || !destinationColumn) return;

    // Удаляем задачу из исходной колонки
    const [movedTask] = sourceColumn.items.splice(sourceIndex, 1);

    // Если перемещаем в другую колонку, обновляем статус задачи
    if (sourceColumnId !== destinationColumnId) {
      movedTask.status = destinationColumnId as TaskStatus;
      // Если задача перемещается в 'Выполнено', сбрасываем приоритет и deadline
      if (destinationColumnId === 'COMPLETED') {
        movedTask.priority = 'Низкий';
      }
    }

    // Добавляем задачу в целевую колонку
    destinationColumn.items.splice(destinationIndex, 0, movedTask);

    // Сортируем задачи в целевой колонке по приоритету
    destinationColumn.items = sortTasksByPriority(destinationColumn.items);

    // Обновляем локальное состояние
    setLocalColumns(newColumns);

    try {
      const priorityMap: Record<string, TaskPriority> = {
        'Низкий': 'LOW',
        'Средний': 'MEDIUM',
        'Высокий': 'HIGH'
      };

      // Оптимизированное обновление: обновляем только перемещенную задачу
      const updateData: Partial<TaskForm> = {
        title: movedTask.title,
        description: movedTask.description || '',
        priority: priorityMap[movedTask.priority as keyof typeof priorityMap] || 'LOW',
        status: destinationColumnId as TaskStatus,
        projectId: movedTask.projectId,
        deadline: movedTask.deadline ? new Date(movedTask.deadline).toISOString().split('T')[0] : undefined,
        order: destinationIndex // Устанавливаем новый порядок
      };

      // Обновляем только перемещенную задачу
      await updateTask({
        taskId: taskId,
        task: updateData
      }).unwrap();

      // Обновляем время последней синхронизации
      setLastServerSync(Date.now());

      // Воспроизводим звук при перемещении в столбцы "Согласование" или "Выполнено"
      if (destinationColumnId === 'PROBLEM' || destinationColumnId === 'COMPLETED') {
        soundManager.playTaskMovedSound();
      }

    } catch (error) {
      console.error('Failed to update task order or status:', error);
      // В случае ошибки возвращаем задачу обратно
      const revertColumns = { ...newColumns };
      destinationColumn.items.splice(destinationIndex, 1);
      sourceColumn.items.splice(sourceIndex, 0, { ...movedTask, status: sourceColumnId as TaskStatus });
      setLocalColumns(revertColumns);
    }
  };

  if (isTasksLoading) return <div className="text-white">Загрузка задач...</div>;
  if (tasksError) return <div className="text-white">Ошибка при загрузке задач</div>;
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