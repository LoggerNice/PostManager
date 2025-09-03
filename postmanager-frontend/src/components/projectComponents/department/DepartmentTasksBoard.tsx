'use client';

import { useMemo, useState, useEffect } from 'react';
import { TaskStatus, TaskPriority, Task, TaskForm, TaskType } from '@/types/task.types';
import { TasksFilterConfig } from '@/types/filter.types';
import { Column } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useGetTasksQuery, useUpdateTaskMutation, useDeleteTaskMutation, useCreateTaskMutation } from '@/store/api/task.api';
import { useGetUsersQuery } from '@/store/api/user.api';
import { useGetDepartmentsQuery } from '@/store/api/department.api';
import { filterTasks } from '@/utils/taskFiltering';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useTaskSorting } from '@/hooks/useTaskSorting';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

import TasksTab from '../TasksTab';
import TasksFilter from '../../filters/TasksFilter';

export default function DepartmentTasksBoard() {
  const { user } = useAuth();
  const userId = user?.id;
  const { subscribeToTaskEvents, subscribeToUserTaskEvents, isConnected } = useWebSocketContext();

  // Состояние фильтров
  const [filters, setFilters] = useState<TasksFilterConfig>({
    searchQuery: '',
    departments: [],
    priorities: [],
    assignees: [],
    projects: [],
    sortBy: 'priority',
    sortOrder: 'desc',
    dateRange: {
      startDate: null,
      endDate: null
    }
  });

  // Загружаем данные
  const { data: allTasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useGetTasksQuery();
  const { data: allUsers = [], isLoading: usersLoading } = useGetUsersQuery();
  const { data: allDepartments = [], isLoading: departmentsLoading } = useGetDepartmentsQuery();
  
  // Хуки для обновления и удаления задач
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [createTask] = useCreateTaskMutation();

  // Получаем текущего пользователя и его отдел
  const currentUser = allUsers.find(user => user.id === userId);
  const departmentId = currentUser?.department?.id || currentUser?.departmentId;

  // Фильтруем пользователей отдела (исключаем начальника отдела)
  const departmentUsers = useMemo(() => {
    if (!departmentId) return [];
    
    return allUsers.filter(user => 
      (user.departmentId === departmentId || user.department?.id === departmentId) &&
      user.role !== 'MANAGER' && 
      user.role !== 'HEAD'
    );
  }, [allUsers, departmentId]);

  // Фильтруем задачи отдела
  const departmentTasks = useMemo(() => {
    if (!departmentId || departmentUsers.length === 0) return [];
    
    const filtered = allTasks.filter(task => {
      // Проверяем через assignees
      if (task.assignees && task.assignees.length > 0) {
        return task.assignees.some((assignee: any) => 
          departmentUsers.some((user: any) => user.id === assignee.userId)
        );
      }
      
      // Проверяем через assigneeId
      if (task.assigneeId) {
        const assigneeId = typeof task.assigneeId === 'string' ? parseInt(task.assigneeId) : task.assigneeId;
        return departmentUsers.some((user: any) => user.id === assigneeId);
      }
      
      // Если у задачи нет исполнителей, показываем её (возможно, это задачи отдела)
      console.log('Task without assignees:', {
        id: task.id,
        title: task.title,
        assignees: task.assignees,
        assigneeId: task.assigneeId,
        projectId: task.projectId
      });
      
      return false;
    });

    // Отладочная информация
    console.log('Department filtering debug:', {
      totalTasks: allTasks.length,
      departmentId,
      departmentUsersCount: departmentUsers.length,
      departmentUsersIds: departmentUsers.map((u: any) => u.id),
      filteredTasksCount: filtered.length,
      filteredTaskIds: filtered.map(t => t.id)
    });

    return filtered;
  }, [allTasks, departmentUsers, departmentId]);

  // Получаем уникальные проекты из задач отдела
  const availableProjects = useMemo(() => {
    if (!departmentTasks || departmentTasks.length === 0) return [];
    
    const projectMap = new Map();
    departmentTasks.forEach(task => {
      if (task.project && !projectMap.has(task.project.id)) {
        projectMap.set(task.project.id, task.project);
      }
    });
    
    return Array.from(projectMap.values());
  }, [departmentTasks]);

  // Применяем фильтрацию к задачам отдела
  const filteredTasks = useMemo(() => {
    if (!departmentTasks || departmentTasks.length === 0) return [];
    return filterTasks(departmentTasks, filters).filteredTasks;
  }, [departmentTasks, filters]);

  // Группируем отфильтрованные задачи по статусам
  const unsortedColumns = useMemo(() => {
    const grouped: Record<string, Column> = {
      IN_PROGRESS: { name: "В процессе", items: [] },
      PROBLEM: { name: "Согласование", items: [] },
      COMPLETED: { name: "Выполнено", items: [] },
    };
    
    const unassignedTasks: any[] = [];
    
    filteredTasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].items.push(task);
      } else {
        unassignedTasks.push(task);
      }
    });

    // Отладочная информация для задач без статуса
    if (unassignedTasks.length > 0) {
      console.log('Tasks without valid status:', unassignedTasks.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status
      })));
    }

    // Отладочная информация
    console.log('Columns grouping debug:', {
      filteredTasksCount: filteredTasks.length,
      filteredTaskIds: filteredTasks.map(t => t.id),
      columns: Object.entries(grouped).map(([status, column]) => ({
        status,
        count: column.items.length,
        taskIds: column.items.map((t: any) => t.id)
      }))
    });
    
    return grouped;
  }, [filteredTasks]);

  // Применяем автоматическую сортировку по приоритету
  const columns = useTaskSorting(unsortedColumns);

  // WebSocket синхронизация - подписываемся на события задач
  useEffect(() => {
    if (!departmentId) return;

    // Подписываемся на события задач проекта (для задач отдела)
    const unsubscribeProjectEvents = subscribeToTaskEvents({
      onTaskCreate: (data: any) => {
        console.log('Task created via WebSocket:', data);
        refetchTasks();
      },
      onTaskUpdate: (data: any) => {
        console.log('Task updated via WebSocket:', data);
        refetchTasks();
      },
      onTaskDelete: (data: any) => {
        console.log('Task deleted via WebSocket:', data);
        refetchTasks();
      },
      onTaskAssignmentChanged: (data: any) => {
        console.log('Task assignment changed via WebSocket:', data);
        refetchTasks();
      }
    });

    // Подписываемся на пользовательские события задач
    const unsubscribeUserEvents = subscribeToUserTaskEvents({
      onUserTaskCreate: (data: any) => {
        console.log('User task created via WebSocket:', data);
        refetchTasks();
      },
      onUserTaskUpdate: (data: any) => {
        console.log('User task updated via WebSocket:', data);
        refetchTasks();
      },
      onUserTaskDelete: (data: any) => {
        console.log('User task deleted via WebSocket:', data);
        refetchTasks();
      },
      onTaskAssigned: (data: any) => {
        console.log('Task assigned via WebSocket:', data);
        refetchTasks();
      },
      onTaskUnassigned: (data: any) => {
        console.log('Task unassigned via WebSocket:', data);
        refetchTasks();
      }
    });

    // Отписываемся при размонтировании
    return () => {
      unsubscribeProjectEvents();
      unsubscribeUserEvents();
    };
  }, [departmentId, subscribeToTaskEvents, subscribeToUserTaskEvents, refetchTasks]);

  // Утилиты для работы с приоритетами
  const priorityMapToEnglish: Record<string, TaskPriority> = {
    'Низкий': 'LOW',
    'Средний': 'MEDIUM',
    'Высокий': 'HIGH'
  };

  // Обработчики для задач
  const handleDeleteTask = async (columnId: string, taskId: string) => {
    try {
      // Проверяем, что данные загружены
      if (tasksLoading) {
        toast.error('Данные еще загружаются. Попробуйте позже.');
        return;
      }

      // Находим проект задачи во всех задачах
      // Приводим типы к строке для корректного сравнения
      const task = allTasks.find((t: Task) => String(t.id) === String(taskId));
      if (!task?.projectId) {
        console.error('Task project not found for task:', taskId);
        toast.error('Задача не найдена. Попробуйте обновить страницу.');
        return;
      }

      await deleteTask(taskId).unwrap();
      toast.success('Задача успешно удалена');
      // WebSocket автоматически обновит данные
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error('Ошибка при удалении задачи');
    }
  };

  const handleTaskUpdate = async (taskId: string, updatedTask: Task) => {
    try {
      // Проверяем, что данные загружены
      if (tasksLoading) {
        toast.error('Данные еще загружаются. Попробуйте позже.');
        return;
      }

      // Находим проект задачи во всех задачах
      // Приводим типы к строке для корректного сравнения
      const task = allTasks.find((t: Task) => String(t.id) === String(taskId));
      if (!task?.projectId) {
        console.error('Task project not found for task:', taskId);
        toast.error('Задача не найдена. Попробуйте обновить страницу.');
        return;
      }

      // Подготавливаем данные для обновления
      const updateData: Partial<TaskForm> = {
        title: updatedTask.title,
        description: updatedTask.description || '',
        priority: priorityMapToEnglish[updatedTask.priority as keyof typeof priorityMapToEnglish] || 'LOW',
        status: updatedTask.status,
        projectId: updatedTask.projectId,
        deadline: updatedTask.deadline ? format(new Date(updatedTask.deadline), 'yyyy-MM-dd HH:mm:ss') : undefined,
        order: updatedTask.order
      };

      await updateTask({ taskId, task: updateData }).unwrap();
      toast.success('Задача успешно обновлена');
      // WebSocket автоматически обновит данные
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error('Ошибка при обновлении задачи');
    }
  };

  const handleTaskMove = async (taskId: string, sourceColumnId: string, destinationColumnId: string, sourceIndex: number, destinationIndex: number) => {
    try {
      // Проверяем, что данные загружены
      if (tasksLoading) {
        toast.error('Данные еще загружаются. Попробуйте позже.');
        return;
      }

      // Добавляем отладочную информацию
      console.log('Attempting to move task:', taskId);
      console.log('Available tasks count:', allTasks.length);
      console.log('Available task IDs:', allTasks.map((t: Task) => t.id));
      
      // Находим задачу во всех задачах, а не только в задачах отдела
      // Приводим типы к строке для корректного сравнения
      const task = allTasks.find((t: Task) => String(t.id) === String(taskId));
      
      if (!task) {
        console.error('Task not found in allTasks for taskId:', taskId);
        console.log('Available tasks:', allTasks);
        toast.error('Задача не найдена. Попробуйте обновить страницу.');
        return;
      }
      
      if (!task.projectId) {
        console.error('Task found but projectId is missing for task:', task);
        toast.error('Ошибка: у задачи отсутствует проект');
        return;
      }

      // Подготавливаем данные для обновления
      const updateData: Partial<TaskForm> = {
        status: destinationColumnId as TaskStatus,
        order: destinationIndex
      };

      // Если задача перемещается в 'Выполнено', автоматически устанавливаем приоритет "Низкий"
      if (destinationColumnId === 'COMPLETED') {
        updateData.priority = 'LOW';
      }

      console.log('Updating task with data:', { taskId, updateData });
      await updateTask({ taskId, task: updateData }).unwrap();
      toast.success('Задача успешно перемещена');
      // WebSocket автоматически обновит данные
    } catch (error) {
      console.error('Failed to update task order or status:', error);
      toast.error('Ошибка при перемещении задачи');
    }
  };

  const handleCreateTask = async (
    columnId: string,
    title: string,
    description: string = '',
    priority: TaskPriority = 'LOW',
    taskType: TaskType = 'OTHER',
    deadline?: string,
    assigneeIds?: number[]
  ) => {
    if (!title.trim()) return;

    // Находим первый проект из задач отдела для создания задачи
    const departmentProject = departmentTasks.find(task => task.projectId)?.projectId;
    if (!departmentProject) {
      toast.error('Не найдено подходящего проекта для создания задачи');
      return;
    }

    // Определяем порядок для новой задачи (в конце списка)
    const currentColumnItems = columns[columnId]?.items || [];
    const nextOrder = currentColumnItems.length;

    const taskData: TaskForm = {
      title: title.trim(),
      description: description.trim(),
      priority: priority,
      taskType: taskType,
      status: columnId as TaskStatus,
      projectId: departmentProject,
      deadline: deadline,
      order: nextOrder,
      assigneeIds: assigneeIds || []
    };

    try {
      await createTask(taskData);
      toast.success('Задача успешно создана');
    } catch (error) {
      console.error('Failed to create task:', error);
      toast.error('Ошибка при создании задачи');
    }
  };

  if (!userId) return <div className="text-white">Пользователь не авторизован</div>;

  if (tasksLoading || usersLoading || departmentsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Загрузка задач отдела...</p>
        </div>
      </div>
    );
  }

  // Проверяем, есть ли задачи в отделе
  if (!departmentTasks || departmentTasks.length === 0) {
    return (
      <div className="h-full flex flex-col">
        <div className="ml-6 mb-6 flex-shrink-0">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Доска задач отдела
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Управление задачами сотрудников вашего отдела
          </p>
        </div>
        
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Нет задач в отделе
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              В вашем отделе пока нет назначенных задач
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">

      {/* Фильтры задач */}
      <div className="mx-8 flex-shrink-0">
        <TasksFilter
          tasks={departmentTasks || []}
          filters={filters}
          onFiltersChange={setFilters}
          availableDepartments={allDepartments}
          availableUsers={allUsers}
          availableProjects={availableProjects}
          context="department"
          searchPlaceholder="Поиск задач отдела..."
          showDepartmentFilter={false}
          showAssigneeFilter={true}
          showDateFilter={true}
          showPriorityFilter={true}
          showProjectFilter={true}
        />
      </div>
      
      <div className="flex-1 overflow-hidden custom-scrollbar">
        <TasksTab
          columns={columns}
          handleDeleteTask={handleDeleteTask}
          onTaskUpdate={handleTaskUpdate}
          onTaskMove={handleTaskMove}
          showProjectTitle={true}
        />
      </div>
    </div>
  );
}
