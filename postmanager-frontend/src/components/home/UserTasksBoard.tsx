'use client';

import { useMemo, useState } from 'react';
import { TaskStatus, TaskPriority, TaskForm, Task } from '@/types/task.types';
import { TasksFilterConfig } from '@/types/filter.types';
import { Column } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { useGetUsersQuery } from '@/store/api/user.api';
import { useGetDepartmentsQuery } from '@/store/api/department.api';
import { filterTasks } from '@/utils/taskFiltering';
import { soundManager } from '@/utils/soundUtils';
import { sortTasksByPriority } from '@/utils/taskSorting';
import { format } from 'date-fns';
import { useTaskSorting } from '@/hooks/useTaskSorting';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import FireworksEffect from '@/components/ui/FireworksEffect';

import TasksTab from '../projectComponents/TasksTab';
import TasksFilter from '../filters/TasksFilter';

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
  const [showFireworks, setShowFireworks] = useState(false);
  const userId = user?.id;
  const { isConnected } = useWebSocketContext();

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
    updateTask,
    deleteTask,
    sortTasksByPriority,
    createTask
  } = useTasks({ enableSounds: true, autoSync: true });

  // Загружаем данные для фильтров
  const { data: allUsers = [], isLoading: usersLoading } = useGetUsersQuery();
  const { data: allDepartments = [], isLoading: departmentsLoading } = useGetDepartmentsQuery();
  
  // Получаем уникальные проекты из задач пользователя
  const availableProjects = useMemo(() => {
    if (!userTasks || userTasks.length === 0) return [];
    
    const projectMap = new Map();
    userTasks.forEach(task => {
      if (task.project && !projectMap.has(task.project.id)) {
        projectMap.set(task.project.id, task.project);
      }
    });
    
    return Array.from(projectMap.values());
  }, [userTasks]);

  // Применяем фильтрацию к пользовательским задачам
  const filteredTasks = useMemo(() => {
    if (!userTasks || userTasks.length === 0) return [];
    return filterTasks(userTasks, filters).filteredTasks;
  }, [userTasks, filters]);

  // Группируем отфильтрованные задачи по статусам
  const groupedFilteredTasks = useMemo(() => {
    const grouped: Record<string, Task[]> = {
      IN_PROGRESS: [],
      PROBLEM: [],
      COMPLETED: []
    };
    
    filteredTasks.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    
    return grouped;
  }, [filteredTasks]);

  // Формируем колонки из отфильтрованных и сгруппированных задач
  const unsortedColumns: Record<string, Column> = useMemo(() => {
    return {
      IN_PROGRESS: { 
        name: 'В процессе', 
        items: groupedFilteredTasks.IN_PROGRESS || [] 
      },
      PROBLEM: { 
        name: 'Согласование', 
        items: groupedFilteredTasks.PROBLEM || [] 
      },
      COMPLETED: { 
        name: 'Выполнено', 
        items: groupedFilteredTasks.COMPLETED || [] 
      }
    };
  }, [groupedFilteredTasks]);

  // Применяем автоматическую сортировку по приоритету
  const columns = useTaskSorting(unsortedColumns);



  const handleDeleteTask = async (columnId: string, taskId: string) => {
    try {
      // Проверяем, что данные загружены
      if (isLoading) {
        alert('Данные еще загружаются. Попробуйте позже.');
        return;
      }

      // Находим проект задачи
      const task = userTasks.find((t: Task) => t.id === taskId);
      if (!task?.projectId) {
        console.error('Task project not found for task:', taskId);
        alert('Задача не найдена. Попробуйте обновить страницу.');
        return;
      }

      await deleteTask(taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Ошибка при удалении задачи. Проверьте консоль для деталей.');
    }
  };

  const handleTaskUpdate = async (taskId: string, updatedTask: Task) => {
    try {
      // Проверяем, что данные загружены
      if (isLoading) {
        alert('Данные еще загружаются. Попробуйте позже.');
        return;
      }

      // Находим проект задачи
      const task = userTasks.find((t: Task) => t.id === taskId);
      if (!task?.projectId) {
        console.error('Task project not found for task:', taskId);
        alert('Задача не найдена. Попробуйте обновить страницу.');
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

      await updateTask(taskId, updateData);
    } catch (error) {
      console.error('Failed to update task:', error);
      alert('Ошибка при обновлении задачи. Проверьте консоль для деталей.');
    }
  };

  const handleTaskMove = async (
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    try {
      // Проверяем, что данные загружены
      if (isLoading) {
        alert('Данные еще загружаются. Попробуйте позже.');
        return;
      }

      // Находим задачу
      const task = userTasks.find((t: Task) => t.id === taskId);
      if (!task?.projectId) {
        console.error('Task project not found for task:', taskId);
        alert('Задача не найдена. Попробуйте обновить страницу.');
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

      await updateTask(taskId, updateData);

      // Специальные эффекты для задачи "Заполнение личного плана"
      if (task.title === 'Заполнение личного плана' && destinationColumnId === 'PROBLEM') {
        // Эффект фейерверка и звук праздника
        setShowFireworks(true);
        soundManager.playCelebrationSound();
      } else if (destinationColumnId === 'PROBLEM' || destinationColumnId === 'COMPLETED') {
        // Обычный звук для других задач
        soundManager.playTaskMovedSound();
      }

    } catch (error) {
      console.error('Failed to update task order or status:', error);
      alert('Ошибка при перемещении задачи. Проверьте консоль для деталей.');
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

    // Находим первый проект пользователя для создания задачи
    const userProject = userTasks.find(task => task.projectId)?.projectId;
    if (!userProject) {
      alert('Не найдено подходящего проекта для создания задачи');
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
      projectId: userProject,
      deadline: deadline,
      order: nextOrder,
      assigneeIds: assigneeIds || [userId]
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

  if (isLoading || usersLoading || departmentsLoading) return <div className="text-white">Загрузка задач...</div>;
  if (error) return <div className="text-white">Ошибка при загрузке задач: {error}</div>;
  if (!userId) return <div className="text-white">Пользователь не авторизован</div>;

  return (
    <div className="h-full flex flex-col">
      <div className="ml-6 mb-6 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Мои задачи
          </h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Задачи по всем проектам, где вы являетесь исполнителем
        </p>
      </div>

      {/* Фильтры задач */}
      <div className="mx-8 flex-shrink-0">
                 <TasksFilter
           tasks={userTasks || []}
           filters={filters}
           onFiltersChange={setFilters}
           availableDepartments={allDepartments}
           availableUsers={allUsers}
           availableProjects={availableProjects}
           context="my-tasks"
           searchPlaceholder="Поиск моих задач..."
           showDepartmentFilter={true}
           showAssigneeFilter={false}
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
      <FireworksEffect 
        isActive={showFireworks} 
        onComplete={() => setShowFireworks(false)} 
      />
    </div>
  );
} 