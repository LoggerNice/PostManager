'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useGetProjectByIdQuery, useDeleteProjectMutation } from '@/store/api/project.api';
import { useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation, useGetProjectTasksQuery, useUpdateTasksOrderMutation } from '@/store/api/task.api';
import { TaskStatus, TaskPriority, TaskPriorityDisplay, TaskForm, Task } from '@/types/task.types';
import { Column } from '@/types';
import { getCookie } from '@/utils/cookie';
import { useWebSocketTasks } from '@/hooks/useWebSocketTasks';
import { TaskEventData } from '@/contexts/WebSocketContext';

import { groupAndSortTasks, sortTasksByPriority } from '@/utils/taskSorting';
import { soundManager } from '@/utils/soundUtils';

import ProjectHeader from '../../../components/projectComponents/ProjectHeader';
import ProjectTabs from '../../../components/projectComponents/ProjectTabs';
import TasksTab from '../../../components/projectComponents/TasksTab';
import TimelineTab from '../../../components/projectComponents/TimelineTab';
import CalendarTab from '../../../components/projectComponents/CalendarTab';
import ProjectEditModal from '../../../components/projectComponents/ProjectEditModal';

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

export default function ProjectPage() {
  const params = useParams();
  const projectId = Number(params.id);

  // State variables
  const [activeTab, setActiveTab] = useState('tasks');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProjectEditModal, setShowProjectEditModal] = useState(false);
  const [pendingTaskMove, setPendingTaskMove] = useState(false);
  const [localColumns, setLocalColumns] = useState<Record<string, Column>>({});
  const [lastServerSync, setLastServerSync] = useState<number>(0);
  const [pendingTaskCreate, setPendingTaskCreate] = useState(false);

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

  // Оптимизированные WebSocket обработчики для real-time обновлений
  const handleWebSocketTaskCreate = (data: TaskEventData) => {
    if (!data.task || data.projectId !== projectId) return;

    const task = data.task;
    
    // Проверяем, не является ли это нашим собственным созданием
    const now = Date.now();
    const timeSinceLastSync = now - lastServerSync;
    
    // Если есть ожидающее создание, игнорируем WebSocket событие
    if (pendingTaskCreate) {
      console.log('WebSocket task create ignored (pending create):', { taskId: task.id });
      return;
    }

    // Если прошло менее 2 секунд с последней синхронизации, игнорируем WebSocket событие
    if (timeSinceLastSync < 2000) {
      console.log('WebSocket task create ignored (recent sync):', { taskId: task.id, timeSinceLastSync });
      return;
    }

    console.log('Processing WebSocket task create:', { taskId: task.id, status: task.status });

    // Преобразуем приоритет в русский язык
    const taskWithRussianPriority = {
      ...task,
      priority: (priorityMapToRussian[task.priority as TaskPriority] || task.priority) as TaskPriorityDisplay
    };

    // Обновляем локальное состояние
    setLocalColumns(prevColumns => {
      const newColumns = { ...prevColumns };
      const columnId = task.status;

      if (newColumns[columnId]) {
        // Проверяем, что задача еще не существует
        const existingTaskIndex = newColumns[columnId].items.findIndex(t => t.id === task.id);
        if (existingTaskIndex === -1) {
          newColumns[columnId].items.push(taskWithRussianPriority);
          newColumns[columnId].items = sortTasksByPriority(newColumns[columnId].items);
        }
      }

      return newColumns;
    });
  };

  const handleWebSocketTaskUpdate = (data: TaskEventData) => {
    if (!data.task || data.projectId !== projectId) return;

    const task = data.task;
    
    // Проверяем, не является ли это нашим собственным обновлением
    const now = Date.now();
    const timeSinceLastSync = now - lastServerSync;
    
    console.log('WebSocket task update received:', { 
      taskId: task.id, 
      status: task.status, 
      timeSinceLastSync, 
      pendingTaskMove
    });
    
    // Если есть ожидающее перемещение, игнорируем WebSocket событие
    if (pendingTaskMove) {
      console.log('WebSocket task update ignored (pending move):', { taskId: task.id });
      return;
    }

    // Если прошло менее 2 секунд с последней синхронизации, игнорируем WebSocket событие
    if (timeSinceLastSync < 2000) {
      console.log('WebSocket task update ignored (recent sync):', { taskId: task.id, timeSinceLastSync });
      return;
    }

    console.log('Processing WebSocket task update:', { taskId: task.id, status: task.status });

    // Преобразуем приоритет в русский язык
    const taskWithRussianPriority = {
      ...task,
      priority: (priorityMapToRussian[task.priority as TaskPriority] || task.priority) as TaskPriorityDisplay
    };

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

  const handleWebSocketTaskDelete = (data: TaskEventData) => {
    if (data.projectId !== projectId || !data.taskId) return;

    console.log('Processing WebSocket task delete:', { taskId: data.taskId });

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

  // Новый обработчик для изменения назначений задач
  const handleWebSocketTaskAssignmentChanged = (data: TaskEventData) => {
    if (data.projectId !== projectId || !data.task) return;

    console.log('Processing WebSocket task assignment change:', { taskId: data.task.id });

    // Просто обновляем задачу с новыми назначениями
    const task = data.task;
    const taskWithRussianPriority = {
      ...task,
      priority: (priorityMapToRussian[task.priority as TaskPriority] || task.priority) as TaskPriorityDisplay
    };

    setLocalColumns(prevColumns => {
      const newColumns = { ...prevColumns };

      // Находим и обновляем задачу в соответствующей колонке
      Object.keys(newColumns).forEach(columnId => {
        const taskIndex = newColumns[columnId].items.findIndex(t => t.id === task.id);
        if (taskIndex !== -1) {
          newColumns[columnId].items[taskIndex] = taskWithRussianPriority;
        }
      });

      return newColumns;
    });
  };

  // Обработчик для события task_moved
  const handleWebSocketTaskMove = (taskId: number, newStatus: string) => {
    console.log('WebSocket task move received:', { taskId, newStatus });
    
    // Проверяем, не является ли это нашим собственным перемещением
    const now = Date.now();
    const timeSinceLastSync = now - lastServerSync;
    
    if (pendingTaskMove) {
      console.log('WebSocket task move ignored:', { 
        timeSinceLastSync, 
        pendingTaskMove, 
        taskId,
        reason: 'pending_move'
      });
      return;
    }

    if (timeSinceLastSync < 2000) {
      console.log('WebSocket task move ignored:', { 
        timeSinceLastSync, 
        pendingTaskMove, 
        taskId,
        reason: 'recent_sync'
      });
      return;
    }

    console.log('Processing WebSocket task move:', { taskId, newStatus });
    
    // Обновляем локальное состояние для перемещения задачи
    setLocalColumns(prevColumns => {
      const newColumns = { ...prevColumns };
      let movedTask = null;

      // Находим и удаляем задачу из всех колонок
      Object.keys(newColumns).forEach(columnId => {
        const taskIndex = newColumns[columnId].items.findIndex(t => t.id === taskId.toString());
        if (taskIndex !== -1) {
          [movedTask] = newColumns[columnId].items.splice(taskIndex, 1);
        }
      });

      // Добавляем задачу в новую колонку
      if (movedTask && newColumns[newStatus]) {
        movedTask.status = newStatus as TaskStatus;
        newColumns[newStatus].items.push(movedTask);
        newColumns[newStatus].items = sortTasksByPriority(newColumns[newStatus].items);
        
        console.log('Task moved via WebSocket:', { 
          taskId, 
          newStatus,
          columns: Object.keys(newColumns).map(col => ({
            column: col,
            taskCount: newColumns[col].items.length
          }))
        });
      }

      return newColumns;
    });
  };

  // Инициализируем оптимизированное WebSocket подключение
  const { isConnected } = useWebSocketTasks({
    projectId,
    onTaskUpdate: handleWebSocketTaskUpdate,
    onTaskCreate: handleWebSocketTaskCreate,
    onTaskDelete: handleWebSocketTaskDelete,
    onTaskAssignmentChanged: handleWebSocketTaskAssignmentChanged,
    enableSounds: true
  });

  // API hooks
  const { data: project, isLoading, error } = useGetProjectByIdQuery(projectId);
  const {
    data: projectTasks,
    refetch: refetchTasks,
    isLoading: isTasksLoading,
    error: tasksError
  } = useGetProjectTasksQuery(projectId, {
    pollingInterval: isConnected ? 30000 : 5000, // Увеличиваем интервал при WebSocket подключении
    refetchOnFocus: true,
    refetchOnReconnect: true
  });
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [updateTasksOrder] = useUpdateTasksOrderMutation();
  const [deleteProject] = useDeleteProjectMutation();

  // Функция для автоматической сортировки всех колонок по приоритету
  const sortAllColumnsByPriority = (columns: Record<string, Column>) => {
    const sortedColumns = { ...columns };
    Object.keys(sortedColumns).forEach(columnId => {
      sortedColumns[columnId].items = sortTasksByPriority(sortedColumns[columnId].items);
    });
    return sortedColumns;
  };

  // Формируем колонки из projectTasks и синхронизируем с локальным состоянием
  const columns: Record<string, Column> = useMemo(() => {
    if (projectTasks) {
      // Преобразуем приоритеты в русский язык
      const tasksWithRussianPriority = projectTasks.map((task: Task) => ({
        ...task,
        priority: (priorityMapToRussian[task.priority as TaskPriority] || task.priority) as TaskPriority | TaskPriorityDisplay
      }));

      // Группируем и сортируем задачи по приоритету
      const grouped = groupAndSortTasks(tasksWithRussianPriority);

      const serverColumns = {
        IN_PROGRESS: { name: 'В процессе', items: grouped.IN_PROGRESS },
        PROBLEM: { name: 'Согласование', items: grouped.PROBLEM },
        COMPLETED: { name: 'Выполнено', items: grouped.COMPLETED }
      };

      // Если есть локальные изменения и они не пустые, используем их
      // Иначе используем серверные данные
      if (Object.keys(localColumns).length > 0) {
        // Проверяем, что локальные колонки содержат данные
        const hasLocalData = Object.values(localColumns).some(col => col.items.length > 0);
        
        // Проверяем, что локальные данные не слишком устарели
        const now = Date.now();
        const timeSinceLastSync = now - lastServerSync;
        const isLocalDataStale = timeSinceLastSync > 10000; // 10 секунд
        
        if (hasLocalData && !isLocalDataStale) {
          console.log('Using local columns:', {
            localColumns: Object.keys(localColumns).map(col => ({
              column: col,
              taskCount: localColumns[col].items.length
            })),
            serverColumns: Object.keys(serverColumns).map(col => ({
              column: col,
              taskCount: serverColumns[col].items.length
            })),
            timeSinceLastSync
          });
          return localColumns;
        } else if (isLocalDataStale) {
          console.log('Local data is stale, using server data:', {
            timeSinceLastSync,
            hasLocalData
          });
          // Очищаем устаревшие локальные данные
          setLocalColumns({});
        }
      }

      console.log('Using server columns:', {
        serverColumns: Object.keys(serverColumns).map(col => ({
          column: col,
          taskCount: serverColumns[col].items.length
        })),
        projectTasksCount: projectTasks.length
      });

      return serverColumns;
    }

    return initialColumns;
  }, [projectTasks, priorityMapToRussian, localColumns, lastServerSync]);

  // Функция для автоматической синхронизации с сервером
  const autoSyncWithServer = async (preserveOrder: boolean = true) => {
    console.log('Auto-sync triggered:', { preserveOrder });
    try {
      const updatedTasks = await refetchTasks();
      if (updatedTasks.data) {
        syncWithServer(updatedTasks.data, preserveOrder);
      }
    } catch (error) {
      console.error('Failed to sync with server:', error);
    }
  };

  // Функция для быстрой синхронизации
  const quickSyncWithServer = async (preserveOrder: boolean = true) => {
    console.log('Quick-sync triggered:', { preserveOrder });
    try {
      const updatedTasks = await refetchTasks();
      if (updatedTasks.data) {
        syncWithServer(updatedTasks.data, preserveOrder);
      }
    } catch (error) {
      console.error('Failed to sync with server:', error);
    }
  };

  // Функция для умной синхронизации локального состояния с серверными данными
  const syncWithServer = (serverTasks: Task[], preserveLocalOrder: boolean = false) => {
    console.log('Syncing with server:', { 
      serverTasksCount: serverTasks.length, 
      preserveLocalOrder,
      hasLocalColumns: Object.keys(localColumns).length > 0
    });

    // Преобразуем приоритеты в русский язык
    const tasksWithRussianPriority = serverTasks.map((task: Task) => ({
      ...task,
      priority: (priorityMapToRussian[task.priority as TaskPriority] || task.priority) as TaskPriority | TaskPriorityDisplay
    }));

    // Если нужно сохранить локальный порядок, используем его
    if (preserveLocalOrder && Object.keys(localColumns).length > 0) {
      const grouped = groupAndSortTasks(tasksWithRussianPriority);

      Object.keys(grouped).forEach(status => {
        const localItems = localColumns[status]?.items || [];
        const serverItems = grouped[status as keyof typeof grouped];

        // Создаем Map для быстрого поиска серверных задач
        const serverTasksMap = new Map(serverItems.map(task => [task.id, task]));

        // Сначала добавляем задачи в локальном порядке, обновляя их данными с сервера
        const orderedItems: Task[] = [];
        localItems.forEach(localTask => {
          const serverTask = serverTasksMap.get(localTask.id);
          if (serverTask) {
            orderedItems.push(serverTask);
            serverTasksMap.delete(localTask.id);
          }
        });

        // Затем добавляем новые задачи, которых не было в локальном состоянии
        serverTasksMap.forEach(newTask => {
          orderedItems.push(newTask);
        });

        grouped[status as keyof typeof grouped] = orderedItems;
      });

      const sortedColumns = sortAllColumnsByPriority({
        IN_PROGRESS: { name: 'В процессе', items: grouped.IN_PROGRESS },
        PROBLEM: { name: 'Согласование', items: grouped.PROBLEM },
        COMPLETED: { name: 'Выполнено', items: grouped.COMPLETED }
      });
      setLocalColumns(sortedColumns);
      console.log('Synced with server (preserving local order):', {
        columns: Object.keys(sortedColumns).map(col => ({
          column: col,
          taskCount: sortedColumns[col].items.length
        }))
      });
    } else {
      // Используем сортировку по приоритету
      const grouped = groupAndSortTasks(tasksWithRussianPriority);

      const sortedColumns = sortAllColumnsByPriority({
        IN_PROGRESS: { name: 'В процессе', items: grouped.IN_PROGRESS },
        PROBLEM: { name: 'Согласование', items: grouped.PROBLEM },
        COMPLETED: { name: 'Выполнено', items: grouped.COMPLETED }
      });
      setLocalColumns(sortedColumns);
      console.log('Synced with server (using server data):', {
        columns: Object.keys(sortedColumns).map(col => ({
          column: col,
          taskCount: sortedColumns[col].items.length
        }))
      });
    }

    setLastServerSync(Date.now());
  };

  // Функция для очистки локальных колонок при полной синхронизации
  const clearLocalColumns = () => {
    console.log('Clearing local columns');
    setLocalColumns({});
  };

  // Синхронизируем локальное состояние с серверными данными
  useEffect(() => {
    if (projectTasks) {
      const now = Date.now();
      const timeSinceLastSync = now - lastServerSync;

      // При первой загрузке или если прошло много времени с последней синхронизации
      if (Object.keys(localColumns).length === 0 || timeSinceLastSync > 30000) { // 30 секунд
        console.log('Auto-syncing with server:', { 
          hasLocalColumns: Object.keys(localColumns).length > 0,
          timeSinceLastSync,
          projectTasksCount: projectTasks.length
        });
        syncWithServer(projectTasks, Object.keys(localColumns).length > 0);
      }
    }
  }, [projectTasks, priorityMapToRussian, localColumns, lastServerSync]);

  // Принудительно обновляем данные при возвращении на страницу проекта
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('Page became visible, refreshing project data');
        refetchTasks();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refetchTasks]);

  // Принудительно обновляем данные при монтировании компонента
  useEffect(() => {
    console.log('Component mounted, refreshing project data');
    refetchTasks();
  }, [refetchTasks]);

  // Автоматическая синхронизация при фокусе на окне
  useEffect(() => {
    const handleFocus = () => {
      const now = Date.now();
      const timeSinceLastSync = now - lastServerSync;

      console.log('Window focused, checking sync:', { timeSinceLastSync });
      
      // Принудительно обновляем данные при фокусе на окне
      refetchTasks();
      
      // Синхронизируемся если прошло более 10 секунд с последней синхронизации
      if (timeSinceLastSync > 10000) {
        autoSyncWithServer(true);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const now = Date.now();
        const timeSinceLastSync = now - lastServerSync;

        console.log('Page became visible, checking sync:', { timeSinceLastSync });

        // Принудительно обновляем данные при возвращении на страницу
        refetchTasks();

        // Синхронизируемся если страница стала видимой и прошло более 5 секунд
        if (timeSinceLastSync > 5000) {
          autoSyncWithServer(true);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lastServerSync, refetchTasks]);

  // Периодическая автоматическая синхронизация в фоне
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const timeSinceLastSync = now - lastServerSync;

        // Автоматическая синхронизация каждые 60 секунд
        if (timeSinceLastSync > 60000) {
          autoSyncWithServer(true);
        }
      }
    }, 60000); // Проверяем каждую минуту

    return () => clearInterval(interval);
  }, [lastServerSync]);

  // Очищаем локальные данные при уходе со страницы и обновляем при возвращении
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('Page unloading, clearing local data');
      clearLocalColumns();
    };

    const handlePopState = () => {
      console.log('Navigation detected, refreshing project data');
      // Небольшая задержка, чтобы убедиться, что компонент перемонтировался
      setTimeout(() => {
        refetchTasks();
      }, 100);
    };

    const handleStorage = (event: StorageEvent) => {
      // Обновляем данные при изменении в localStorage (если используется для кэширования)
      if (event.key && event.key.includes('project') || event.key && event.key.includes('task')) {
        console.log('Storage changed, refreshing project data:', event.key);
        refetchTasks();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('storage', handleStorage);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('storage', handleStorage);
    };
  }, [refetchTasks]);

  if (isLoading || isTasksLoading) return <div className="text-white">Загрузка...</div>;
  if (error || tasksError) return <div className="text-white">Ошибка при загрузке проекта</div>;
  if (!project) return <div className="text-white">Проект не найден</div>;

  const users = project.users || [];

  // Удаляю onDragEnd и все связанные с drag-and-drop пропсы и логику

  const handleCreateTask = async (
    columnId: string,
    title: string,
    description: string = '',
    priority: TaskPriority = 'LOW',
    deadline?: string,
    assigneeIds?: number[]
  ) => {
    if (!title.trim()) return;

    // Определяем порядок для новой задачи (в конце списка)
    const currentColumnItems = localColumns[columnId]?.items || [];
    const nextOrder = currentColumnItems.length;

    // Получаем ID текущего пользователя из cookies или Redux
    const currentUserId = parseInt(getCookie('userId') || '0');

    // Убеждаемся, что текущий пользователь включен в список исполнителей
    const finalAssigneeIds = assigneeIds || [];
    if (currentUserId && !finalAssigneeIds.includes(currentUserId)) {
      finalAssigneeIds.push(currentUserId);
    }

    const taskData: TaskForm = {
      title: title.trim(),
      description: description.trim(),
      priority: priority,
      status: columnId as TaskStatus,
      projectId: projectId,
      deadline: deadline,
      order: nextOrder,
      assigneeIds: finalAssigneeIds
    };

    // Устанавливаем флаг ожидания создания
    setPendingTaskCreate(true);
    console.log('Creating task:', { title: taskData.title, status: taskData.status });

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

      // Уведомляем других исполнителей о новой задаче
      if (finalAssigneeIds.length > 1) {
        const otherAssigneeIds = finalAssigneeIds.filter(id => id !== currentUserId);
        if (otherAssigneeIds.length > 0) {
          // Уведомления отправляются через WebSocket
        }
      }
    } catch (error) {
      console.error('Failed to create task:', error);
      console.error('Task data that failed:', taskData);
      // Показываем пользователю сообщение об ошибке
      alert('Ошибка при создании задачи. Проверьте консоль для деталей.');
    } finally {
      // Сбрасываем флаг ожидания создания
      setPendingTaskCreate(false);
      console.log('Pending task create flag reset:', { 
        timestamp: new Date().toISOString()
      });
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
      await quickSyncWithServer(false);
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

    // Быстро синхронизируемся с сервером после обновления задачи (с коротким индикатором)
    try {
      await quickSyncWithServer(true); // Сохраняем локальный порядок
    } catch (error) {
      console.error('Failed to sync after task update:', error);
    }
  };

  const handleUpdateColumnName = (columnId: string, newName: string) => {
    // Не реализовано, если потребуется — добавить
  };

  const handleEditProject = () => {
    setShowProjectEditModal(true);
  };

  const handleDeleteProject = async () => {
    if (!project) return;

    // Показываем подтверждение удаления
    const isConfirmed = window.confirm(
      `Вы уверены, что хотите удалить проект "${project.title}"?\n\nЭто действие нельзя отменить.`
    );

    if (!isConfirmed) return;

    try {
      await deleteProject(projectId).unwrap();

      // Перенаправляем на главную страницу
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete project:', error);
    }
  };

  const handleTaskMove = async (
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    // Если локальные колонки пустые, используем текущие колонки из сервера
    let currentColumns = localColumns;
    if (Object.keys(localColumns).length === 0) {
      console.log('No local columns, using current server columns for move');
      currentColumns = columns;
    }

    // Создаем копию текущих колонок для локального обновления
    const newColumns = { ...currentColumns };

    // Находим задачу в исходной колонке
    const sourceColumn = newColumns[sourceColumnId];
    const destinationColumn = newColumns[destinationColumnId];

    if (!sourceColumn || !destinationColumn) {
      console.log('Source or destination column not found:', { sourceColumnId, destinationColumnId });
      return;
    }

    // Проверяем, что задача существует в исходной колонке
    if (sourceIndex < 0 || sourceIndex >= sourceColumn.items.length) {
      console.log('Invalid source index:', { sourceIndex, sourceColumnLength: sourceColumn.items.length });
      return;
    }

    // Удаляем задачу из исходной колонки
    const [movedTask] = sourceColumn.items.splice(sourceIndex, 1);

    if (!movedTask) {
      console.log('No task found at source index:', { sourceIndex, sourceColumnLength: sourceColumn.items.length });
      return;
    }

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
    console.log('Local columns updated after task move:', {
      taskId,
      from: sourceColumnId,
      to: destinationColumnId,
      columns: Object.keys(newColumns).map(col => ({
        column: col,
        taskCount: newColumns[col].items.length
      }))
    });

    // Устанавливаем флаг ожидания обновления
    setPendingTaskMove(true);
    console.log('Moving task:', { 
      taskId, 
      from: sourceColumnId, 
      to: destinationColumnId,
      sourceIndex,
      destinationIndex,
      taskTitle: movedTask.title
    });

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
        projectId: projectId,
        deadline: movedTask.deadline ? new Date(movedTask.deadline).toISOString().split('T')[0] : undefined,
        order: destinationIndex // Устанавливаем новый порядок
      };

      console.log('Sending task update to server:', { taskId, updateData });

      // Обновляем только перемещенную задачу
      await updateTask({
        taskId: taskId,
        task: updateData
      }).unwrap();

      // Обновляем время последней синхронизации
      const syncTime = Date.now();
      setLastServerSync(syncTime);
      console.log('Task move completed successfully:', { 
        taskId, 
        newStatus: destinationColumnId,
        syncTime: new Date(syncTime).toISOString()
      });

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
      console.log('Task move reverted due to error:', { taskId, error });
    } finally {
      // Сбрасываем флаг ожидания обновления
      setPendingTaskMove(false);
      console.log('Pending task move flag reset:', { 
        taskId, 
        timestamp: new Date().toISOString(),
        duration: Date.now() - (lastServerSync || Date.now())
      });
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'tasks') {
      return (
        <TasksTab
          columns={columns}
          handleDeleteTask={handleDeleteTask}
          onTaskUpdate={handleTaskUpdate}
          onAddTask={handleCreateTask}
          onUpdateColumnName={handleUpdateColumnName}
          onTaskMove={handleTaskMove}
        />
      );
    }
    if (activeTab === 'timeline') {
      return <TimelineTab users={users} />;
    }
    if (activeTab === 'calendar') {
      return <CalendarTab />;
    }
    return null;
  };

  return (
    <div className="flex flex-col">
      <ProjectHeader
        title={project.title}
        users={users}
        onEditClick={handleEditProject}
        onDeleteClick={handleDeleteProject}
      />
      <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {renderTabContent()}
      <ProjectEditModal
        isOpen={showProjectEditModal}
        onClose={() => setShowProjectEditModal(false)}
        project={project}
      />
    </div>
  );
} 