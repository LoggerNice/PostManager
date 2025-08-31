import { useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useGetProjectTasksQuery, useGetUserTasksQuery } from '@/store/api/task.api';
import { useGetUsersQuery } from '@/store/api/user.api';
import { useCreateTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation } from '@/store/api/task.api';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useAuth } from '@/hooks/useAuth';
import { 
  setProjectTasks, 
  setUserTasks,
  handleTaskCreated,
  handleTaskUpdated,
  handleTaskDeleted,
  handleTaskAssigned,
  handleTaskUnassigned,
  addPendingOperation,
  removePendingOperation,
  createTaskLocally,
  updateTaskLocally,
  deleteTaskLocally,
  setLoading,
  setError,
  selectProjectTasks,
  selectUserTasks,
  selectTasksLoading,
  selectTasksError,
  selectLastSync,
  selectPendingOperations,
  selectDepartmentTasks
} from '@/store/slices/taskSlice';
import { Task, TaskForm, TaskStatus, TaskPriority } from '@/types/task.types';
import { TaskEventData } from '@/contexts/WebSocketContext';
import { groupAndSortTasks, sortTasksByPriority } from '@/utils/taskSorting';
import { soundManager } from '@/utils/soundUtils';

// Утилиты для работы с приоритетами
const priorityMapToEnglish: Record<string, TaskPriority> = {
  'Низкий': 'LOW',
  'Средний': 'MEDIUM',
  'Высокий': 'HIGH'
};

interface UseTasksOptions {
  projectId?: number;
  enableSounds?: boolean;
  autoSync?: boolean;
}

export function useTasks(options: UseTasksOptions = {}) {
  const { projectId, enableSounds = true, autoSync = true } = options;
  const dispatch = useDispatch();
  const { user } = useAuth();
  const { subscribeToTaskEvents, subscribeToUserTaskEvents } = useWebSocketContext();

  // Селекторы из store
  const projectTasks = useSelector((state: any) => 
    projectId ? selectProjectTasks(state, projectId) : []
  );
  const userTasks = useSelector((state: any) => selectUserTasks(state, user?.id));
  const isLoading = useSelector(selectTasksLoading);
  const error = useSelector(selectTasksError);
  const lastSync = useSelector(selectLastSync);
  const pendingOperations = useSelector(selectPendingOperations);

  // API хуки
  const { data: serverProjectTasks, refetch: refetchProjectTasks } = useGetProjectTasksQuery(
    projectId || 0, 
    { skip: !projectId }
  );
  
  const { data: serverUserTasks, refetch: refetchUserTasks } = useGetUserTasksQuery(
    user?.id || 0, 
    { skip: !user?.id }
  );

  const [createTaskMutation] = useCreateTaskMutation();
  const [updateTaskMutation] = useUpdateTaskMutation();
  const [deleteTaskMutation] = useDeleteTaskMutation();

  // WebSocket обработчики для проектных задач
  const handleProjectTaskCreate = useCallback((data: TaskEventData) => {
    if (projectId && data.projectId === projectId) {
      if (enableSounds) {
        soundManager.playTaskCreatedSound();
      }
      dispatch(handleTaskCreated(data));
    }
  }, [projectId, enableSounds, dispatch]);

  const handleProjectTaskUpdate = useCallback((data: TaskEventData) => {
    if (projectId && data.projectId === projectId) {
      if (enableSounds && data.oldStatus !== data.newStatus) {
        soundManager.playTaskCreatedSound();
      }
      dispatch(handleTaskUpdated(data));
    }
  }, [projectId, enableSounds, dispatch]);



  const handleProjectTaskDelete = useCallback((data: TaskEventData) => {
    if (projectId && data.projectId === projectId) {
      dispatch(handleTaskDeleted(data));
    }
  }, [projectId, dispatch]);

  const handleProjectTaskAssignmentChanged = useCallback((data: TaskEventData) => {
    if (projectId && data.projectId === projectId) {
      dispatch(handleTaskUpdated(data));
    }
  }, [projectId, dispatch]);

  // WebSocket обработчики для пользовательских задач (теперь все задачи в едином хранилище)
  const handleUserTaskCreate = useCallback((data: TaskEventData) => {
    if (data.task && user?.id && data.assigneeIds?.includes(user.id)) {
      if (enableSounds) {
        soundManager.playTaskCreatedSound();
      }
      dispatch(handleTaskCreated(data));
    }
  }, [user?.id, enableSounds, dispatch]);

  const handleUserTaskUpdate = useCallback((data: TaskEventData) => {
    if (data.task && user?.id && data.assigneeIds?.includes(user.id)) {
      if (enableSounds && data.oldStatus !== data.newStatus) {
        soundManager.playTaskCreatedSound();
      }
      dispatch(handleTaskUpdated(data));
    }
  }, [user?.id, enableSounds, dispatch]);

  const handleUserTaskDelete = useCallback((data: TaskEventData) => {
    if (data.taskId && user?.id && data.assigneeIds?.includes(user.id)) {
      dispatch(handleTaskDeleted(data));
    }
  }, [user?.id, dispatch]);

  const handleTaskAssigned = useCallback((data: TaskEventData) => {
    if (data.task && user?.id && data.assigneeIds?.includes(user.id)) {
      dispatch(handleTaskAssigned(data));
    }
  }, [user?.id, dispatch]);

  const handleTaskUnassigned = useCallback((data: TaskEventData) => {
    if (data.taskId && user?.id && data.unassignedUserIds?.includes(user.id)) {
      dispatch(handleTaskUnassigned(data));
    }
  }, [user?.id, dispatch]);

  // Подписка на WebSocket события
  useEffect(() => {
    if (projectId) {
      const unsubscribe = subscribeToTaskEvents({
        onTaskCreate: handleProjectTaskCreate,
        onTaskUpdate: handleProjectTaskUpdate,
        onTaskDelete: handleProjectTaskDelete,
        onTaskAssignmentChanged: handleProjectTaskAssignmentChanged
      });

      return unsubscribe;
    }
  }, [projectId, subscribeToTaskEvents, handleProjectTaskCreate, handleProjectTaskUpdate, handleProjectTaskDelete, handleProjectTaskAssignmentChanged]);



  useEffect(() => {
    if (user?.id) {
      const unsubscribe = subscribeToUserTaskEvents({
        onUserTaskCreate: handleUserTaskCreate,
        onUserTaskUpdate: handleUserTaskUpdate,
        onUserTaskDelete: handleUserTaskDelete,
        onTaskAssigned: handleTaskAssigned,
        onTaskUnassigned: handleTaskUnassigned
      });

      return unsubscribe;
    }
  }, [user?.id, subscribeToUserTaskEvents, handleUserTaskCreate, handleUserTaskUpdate, handleUserTaskDelete, handleTaskAssigned, handleTaskUnassigned]);

  // Синхронизация с сервером
  useEffect(() => {
    if (autoSync && serverProjectTasks && projectId) {
      dispatch(setProjectTasks({ projectId, tasks: serverProjectTasks }));
    }
  }, [autoSync, serverProjectTasks, projectId, dispatch]);

  useEffect(() => {
    if (autoSync && serverUserTasks && user?.id) {
      dispatch(setUserTasks(serverUserTasks));
    }
  }, [autoSync, serverUserTasks, user?.id, dispatch]);

  // Функции для работы с задачами
  const createTask = useCallback(async (taskData: TaskForm) => {
    const operationId = `create_${Date.now()}`;
    dispatch(addPendingOperation(operationId));

    try {
      // Добавляем ID создателя задачи
      const taskDataWithCreator = {
        ...taskData,
        creatorId: user?.id
      };

      // Оптимистичное обновление
      const optimisticTask: Task = {
        id: `temp_${Date.now()}`,
        title: taskData.title,
        description: taskData.description || '',
        status: taskData.status,
        priority: taskData.priority,
        projectId: taskData.projectId,
        creatorId: user?.id || 0,
        creator: user ? {
          id: user.id,
          name: user.name,
          login: user.login || '',
          role: user.role || 'USER',
          department: user.department || null,
          createdAt: user.createdAt || new Date().toISOString(),
          updatedAt: user.updatedAt || new Date().toISOString()
        } : {
          id: 0,
          name: '',
          login: '',
          role: 'USER',
          department: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        deadline: taskData.deadline,
        order: taskData.order || 0,
        assignees: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      dispatch(createTaskLocally({ task: optimisticTask, projectId: taskData.projectId }));

      // Отправляем на сервер
      const result = await createTaskMutation(taskDataWithCreator).unwrap();
      
      // Обновляем с реальными данными (заменяем временную задачу)
      dispatch(updateTaskLocally({ task: result, projectId: taskData.projectId }));
      
      return result;
    } catch (error) {
      console.error('Failed to create task:', error);
      dispatch(setError('Ошибка при создании задачи'));
      throw error;
    } finally {
      dispatch(removePendingOperation(operationId));
    }
  }, [dispatch, createTaskMutation]);

  const updateTask = useCallback(async (taskId: string, taskData: Partial<TaskForm>) => {
    const operationId = `update_${taskId}_${Date.now()}`;
    dispatch(addPendingOperation(operationId));

    try {
      // Оптимистичное обновление
      const currentTask = projectTasks.find(t => t.id === taskId) || userTasks.find(t => t.id === taskId);
      if (currentTask) {
        const optimisticTask = { ...currentTask, ...taskData };
        dispatch(updateTaskLocally({ task: optimisticTask, projectId: currentTask.projectId }));
      }

      // Отправляем на сервер
      const result = await updateTaskMutation({ taskId, task: taskData }).unwrap();
      
      // Обновляем с реальными данными
      dispatch(updateTaskLocally({ task: result, projectId: result.projectId }));
      
      return result;
    } catch (error) {
      console.error('Failed to update task:', error);
      dispatch(setError('Ошибка при обновлении задачи'));
      
      // Восстанавливаем данные в случае ошибки
      if (serverProjectTasks && projectId) {
        dispatch(setProjectTasks({ projectId, tasks: serverProjectTasks }));
      }
      throw error;
    } finally {
      dispatch(removePendingOperation(operationId));
    }
  }, [dispatch, updateTaskMutation, projectTasks, userTasks, serverProjectTasks, projectId]);

  const deleteTask = useCallback(async (taskId: string, projectId: number) => {
    const operationId = `delete_${taskId}_${Date.now()}`;
    dispatch(addPendingOperation(operationId));

    try {
      // Оптимистичное удаление
      dispatch(deleteTaskLocally({ taskId, projectId }));

      // Отправляем на сервер
      await deleteTaskMutation(taskId).unwrap();
    } catch (error) {
      console.error('Failed to delete task:', error);
      dispatch(setError('Ошибка при удалении задачи'));
      // Восстанавливаем данные в случае ошибки
      if (serverProjectTasks) {
        dispatch(setProjectTasks({ projectId, tasks: serverProjectTasks }));
      }
      throw error;
    } finally {
      dispatch(removePendingOperation(operationId));
    }
  }, [dispatch, deleteTaskMutation, serverProjectTasks]);

  // Функции для получения сгруппированных задач
  const getGroupedProjectTasks = useCallback(() => {
    if (!projectTasks.length) return {};
    return groupAndSortTasks(projectTasks);
  }, [projectTasks]);

  const getGroupedUserTasks = useCallback(() => {
    if (!userTasks.length) return {};
    return groupAndSortTasks(userTasks);
  }, [userTasks]);

  // Функции для обновления данных
  const refreshProjectTasks = useCallback(() => {
    if (projectId) {
      refetchProjectTasks();
    }
  }, [projectId, refetchProjectTasks]);

  const refreshUserTasks = useCallback(() => {
    if (user?.id) {
      refetchUserTasks();
    }
  }, [user?.id, refetchUserTasks]);

  return {
    // Данные
    projectTasks,
    userTasks,
    groupedProjectTasks: getGroupedProjectTasks(),
    groupedUserTasks: getGroupedUserTasks(),
    
    // Состояние
    isLoading,
    error,
    lastSync,
    pendingOperations,
    
    // Функции
    createTask,
    updateTask,
    deleteTask,
    refreshProjectTasks,
    refreshUserTasks,
    
    // Утилиты
    sortTasksByPriority
  };
}
