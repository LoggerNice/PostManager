'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useGetProjectByIdQuery, useDeleteProjectMutation } from '@/store/api/project.api';
import { useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation, useGetProjectTasksQuery, useUpdateTasksOrderMutation } from '@/store/api/task.api';
import { TaskStatus, TaskPriority, TaskPriorityDisplay, TaskForm, Task } from '@/types/task.types';
import { Column } from '@/types';
import { getCookie } from '@/utils/cookie';

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
  const [deleteProject] = useDeleteProjectMutation();
  const [activeTab, setActiveTab] = useState('tasks');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProjectEditModal, setShowProjectEditModal] = useState(false);
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

      // Если есть локальные изменения, используем их, иначе серверные данные
      return Object.keys(localColumns).length > 0 ? localColumns : serverColumns;
    }
    
    return initialColumns;
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
    } else {
      // Используем сортировку по приоритету
      const grouped = groupAndSortTasks(tasksWithRussianPriority);
      
      const sortedColumns = sortAllColumnsByPriority({
        IN_PROGRESS: { name: 'В процессе', items: grouped.IN_PROGRESS },
        PROBLEM: { name: 'Согласование', items: grouped.PROBLEM },
        COMPLETED: { name: 'Выполнено', items: grouped.COMPLETED }
      });
      setLocalColumns(sortedColumns);
    }
    
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

  const handleCreateTask = async (
    columnId: string, 
    title: string, 
    description: string = '', 
    priority: TaskPriority = 'LOW',
    deadline?: string,
    assigneeIds?: number[]
  ) => {
    if (!title.trim()) return;
    try {
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
      
      console.log('handleCreateTask called with deadline:', deadline);
      console.log('handleCreateTask called with assigneeIds:', finalAssigneeIds);
      console.log('taskData:', taskData);
      
      const newTask = await createTask(taskData).unwrap();
      
      // Обновляем локальное состояние с автоматической сортировкой по приоритету
      const newColumns = { ...localColumns };
      if (newColumns[columnId]) {
        // Добавляем новую задачу
        const newTaskWithRussianPriority = {
          ...newTask,
          priority: priorityMapToRussian[priority] as TaskPriorityDisplay
        };
        
        // Добавляем задачу в колонку
        newColumns[columnId].items.push(newTaskWithRussianPriority);
        
        // Сортируем задачи в колонке по приоритету
        newColumns[columnId].items = sortTasksByPriority(newColumns[columnId].items);
        
        setLocalColumns(newColumns);
      }
      
      // Быстро синхронизируемся с сервером (с коротким индикатором)
      await quickSyncWithServer(true);
      console.log('Task created and synchronized successfully');
      
      // Воспроизводим звук при появлении задачи в столбце "В процессе"
      if (columnId === 'IN_PROGRESS') {
        soundManager.playTaskCreatedSound();
      }

      // Уведомляем других исполнителей о новой задаче
      if (finalAssigneeIds.length > 1) {
        const otherAssigneeIds = finalAssigneeIds.filter(id => id !== currentUserId);
        if (otherAssigneeIds.length > 0) {
          console.log(`Уведомляем исполнителей о новой задаче: ${otherAssigneeIds.join(', ')}`);
        }
      }
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
        
        // Сортируем оставшиеся задачи в колонке по приоритету
        newColumns[columnId].items = sortTasksByPriority(newColumns[columnId].items);
        
        setLocalColumns(newColumns);
      }
      
      await deleteTask(taskId).unwrap();
      
      // Быстро синхронизируемся с сервером (с коротким индикатором)
      await quickSyncWithServer(true);
      console.log('Task deleted and synchronized successfully');
      
      // Уведомляем исполнителей об удалении задачи
      const taskToDelete = Object.values(localColumns)
        .flatMap(column => column.items)
        .find(task => task.id === taskId);
        
      if (taskToDelete && taskToDelete.assignees && taskToDelete.assignees.length > 0) {
        const currentUserId = parseInt(getCookie('userId') || '0');
        const otherAssignees = taskToDelete.assignees.filter(assignee => assignee.userId !== currentUserId);
        
        if (otherAssignees.length > 0) {
          console.log(`Уведомляем исполнителей об удалении задачи: ${otherAssignees.map(a => a.user?.name).join(', ')}`);
        }
      }
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
      console.log('Task updated and synchronized successfully');
      
      // Уведомляем исполнителей об обновлении задачи
      if (updatedTask.assignees && updatedTask.assignees.length > 0) {
        const currentUserId = parseInt(getCookie('userId') || '0');
        const otherAssignees = updatedTask.assignees.filter(assignee => assignee.userId !== currentUserId);
        
        if (otherAssignees.length > 0) {
          console.log(`Уведомляем исполнителей об обновлении задачи: ${otherAssignees.map(a => a.user?.name).join(', ')}`);
        }
      }
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
        projectId: projectId,
        deadline: movedTask.deadline ? new Date(movedTask.deadline).toISOString().split('T')[0] : undefined,
        order: destinationIndex // Устанавливаем новый порядок
      };

      // Обновляем только перемещенную задачу
      await updateTask({
        taskId: taskId,
        task: updateData
      }).unwrap();
      
      await quickSyncWithServer(false); // Используем серверный порядок
      
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