'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useGetProjectByIdQuery } from '@/store/api/project.api';
import { useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation, useGetProjectTasksQuery, useUpdateTasksOrderMutation } from '@/store/api/task.api';
import { TaskStatus, TaskPriority, TaskPriorityDisplay, TaskForm, Task } from '@/types/task.types';
import { Column } from '@/types';
import { useRef } from 'react';

import ProjectHeader from '../../../components/projectComponents/ProjectHeader';
import ProjectTabs from '../../../components/projectComponents/ProjectTabs';
import TasksTab from '../../../components/projectComponents/TasksTab';
import TimelineTab from '../../../components/projectComponents/TimelineTab';
import CalendarTab from '../../../components/projectComponents/CalendarTab';

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
  const { data: project, isLoading, error } = useGetProjectByIdQuery(projectId);
  const {
    data: projectTasks,
    refetch: refetchTasks,
    isLoading: isTasksLoading,
    error: tasksError
  } = useGetProjectTasksQuery(projectId, {
    pollingInterval: 5000,
    refetchOnFocus: true,
    refetchOnReconnect: true
  });
  const [createTask] = useCreateTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [updateTasksOrder] = useUpdateTasksOrderMutation();
  const [activeTab, setActiveTab] = useState('tasks');
  const [showEditModal, setShowEditModal] = useState(false);
  const [pendingTaskMove, setPendingTaskMove] = useState(false);
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

  // Формируем колонки из projectTasks и синхронизируем с локальным состоянием
  const columns: Record<string, Column> = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      IN_PROGRESS: [],
      PROBLEM: [],
      COMPLETED: []
    };
    if (projectTasks) {
      projectTasks.forEach((task: Task) => {
        const status = task.status as keyof typeof grouped;
        if (status in grouped) {
          grouped[status].push({
            ...task,
            priority: (priorityMapToRussian[task.priority as TaskPriority] || task.priority) as TaskPriority | TaskPriorityDisplay
          });
        }
      });
      
      // Сортируем задачи по полю order, если оно есть
      Object.keys(grouped).forEach(status => {
        grouped[status as keyof typeof grouped].sort((a, b) => {
          const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });
      });
    }
    
    const serverColumns = {
      IN_PROGRESS: { name: 'В процессе', items: grouped.IN_PROGRESS },
      PROBLEM: { name: 'Согласование', items: grouped.PROBLEM },
      COMPLETED: { name: 'Выполнено', items: grouped.COMPLETED }
    };

    // Если есть локальные изменения, используем их, иначе серверные данные
    return Object.keys(localColumns).length > 0 ? localColumns : serverColumns;
  }, [projectTasks, priorityMapToRussian, localColumns]);

  // Функция для автоматической синхронизации с сервером
  const autoSyncWithServer = async (preserveOrder: boolean = true) => {
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
    const grouped: Record<string, Task[]> = {
      IN_PROGRESS: [],
      PROBLEM: [],
      COMPLETED: []
    };
    
    serverTasks.forEach((task: Task) => {
      const status = task.status as keyof typeof grouped;
      if (status in grouped) {
        grouped[status].push({
          ...task,
          priority: (priorityMapToRussian[task.priority as TaskPriority] || task.priority) as TaskPriority | TaskPriorityDisplay
        });
      }
    });
    
    // Если нужно сохранить локальный порядок, используем его
    if (preserveLocalOrder && Object.keys(localColumns).length > 0) {
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
    } else {
      // Сортируем задачи по полю order, если оно есть
      Object.keys(grouped).forEach(status => {
        grouped[status as keyof typeof grouped].sort((a, b) => {
          const orderA = a.order ?? Number.MAX_SAFE_INTEGER;
          const orderB = b.order ?? Number.MAX_SAFE_INTEGER;
          return orderA - orderB;
        });
      });
    }
    
    setLocalColumns({
      IN_PROGRESS: { name: 'В процессе', items: grouped.IN_PROGRESS },
      PROBLEM: { name: 'Согласование', items: grouped.PROBLEM },
      COMPLETED: { name: 'Выполнено', items: grouped.COMPLETED }
    });
    
    setLastServerSync(Date.now());
  };

  // Синхронизируем локальное состояние с серверными данными
  useEffect(() => {
    if (projectTasks) {
      const now = Date.now();
      const timeSinceLastSync = now - lastServerSync;
      
      // При первой загрузке или если прошло много времени с последней синхронизации
      if (Object.keys(localColumns).length === 0 || timeSinceLastSync > 30000) { // 30 секунд
        syncWithServer(projectTasks, Object.keys(localColumns).length > 0);
      }
    }
  }, [projectTasks, priorityMapToRussian, localColumns, lastServerSync]);

  // Автоматическая синхронизация при фокусе на окне
  useEffect(() => {
    const handleFocus = () => {
      const now = Date.now();
      const timeSinceLastSync = now - lastServerSync;
      
      // Синхронизируемся если прошло более 10 секунд с последней синхронизации
      if (timeSinceLastSync > 10000) {
        autoSyncWithServer(true);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const now = Date.now();
        const timeSinceLastSync = now - lastServerSync;
        
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
  }, [lastServerSync]);

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

  if (isLoading || isTasksLoading) return <div className="text-white">Загрузка...</div>;
  if (error || tasksError) return <div className="text-white">Ошибка при загрузке проекта</div>;
  if (!project) return <div className="text-white">Проект не найден</div>;

  const users = project.users || [];

  // Удаляю onDragEnd и все связанные с drag-and-drop пропсы и логику

  const handleCreateTask = async (columnId: string, title: string) => {
    if (!title.trim()) return;
    try {
      // Определяем порядок для новой задачи (в конце списка)
      const currentColumnItems = localColumns[columnId]?.items || [];
      const nextOrder = currentColumnItems.length;
      
      const taskData: TaskForm = {
        title: title.trim(),
        description: '',
        priority: 'LOW',
        status: columnId as TaskStatus,
        projectId: projectId,
        order: nextOrder
      };
      const newTask = await createTask(taskData).unwrap();
      
      // Обновляем локальное состояние
      const newColumns = { ...localColumns };
      if (newColumns[columnId]) {
        newColumns[columnId].items.push({
          ...newTask,
          priority: 'Низкий' as TaskPriorityDisplay
        });
        setLocalColumns(newColumns);
      }
      
      // Быстро синхронизируемся с сервером (с коротким индикатором)
      await quickSyncWithServer(true);
      console.log('Task created and synchronized successfully');
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleDeleteTask = async (columnId: string, taskId: string) => {
    try {
      // Сначала удаляем из локального состояния для быстрого отклика UI
      const newColumns = { ...localColumns };
      if (newColumns[columnId]) {
        newColumns[columnId].items = newColumns[columnId].items.filter(task => task.id !== taskId);
        setLocalColumns(newColumns);
      }
      
      await deleteTask(taskId).unwrap();
      
      // Быстро синхронизируемся с сервером (с коротким индикатором)
      await quickSyncWithServer(true);
      console.log('Task deleted and synchronized successfully');
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
      }
    });
    
    setLocalColumns(newColumns);
    
    // Быстро синхронизируемся с сервером после обновления задачи (с коротким индикатором)
    try {
      await quickSyncWithServer(true); // Сохраняем локальный порядок
      console.log('Task updated and synchronized successfully');
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
        projectId: projectId,
        deadline: movedTask.deadline ? new Date(movedTask.deadline).toISOString().split('T')[0] : undefined,
        order: destinationIndex // Устанавливаем новый порядок
      };

      // Обновляем только перемещенную задачу
      await updateTask({
        taskId: taskId,
        task: updateData
      }).unwrap();
      

      
      console.log('Task moved and updated successfully in database');
      
      // Быстрая синхронизация с сервером для получения актуальных данных
      await quickSyncWithServer(false); // Используем серверный порядок
      
    } catch (error) {
      console.error('Failed to update task order or status:', error);
      // В случае ошибки возвращаем задачу обратно
      const revertColumns = { ...newColumns };
      destinationColumn.items.splice(destinationIndex, 1);
      sourceColumn.items.splice(sourceIndex, 0, { ...movedTask, status: sourceColumnId as TaskStatus });
      setLocalColumns(revertColumns);
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
    <div className="min-h-screen flex flex-col">
      <ProjectHeader 
        title={project.title} 
        users={users} 
      />
      <ProjectTabs activeTab={activeTab} onTabChange={setActiveTab} />
      {renderTabContent()}
    </div>
  );
} 