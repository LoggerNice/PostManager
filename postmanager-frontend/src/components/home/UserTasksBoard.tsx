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
import { format } from 'date-fns';
import { useWebSocketContext } from '@/contexts/WebSocketContext';

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
  const userId = user?.id;
  const { isConnected } = useWebSocketContext();

  // Состояние фильтров
  const [filters, setFilters] = useState<TasksFilterConfig>({
    searchQuery: '',
    departments: [],
    priorities: [],
    assignees: [],
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
    sortTasksByPriority
  } = useTasks({ enableSounds: true, autoSync: true });

  // Загружаем данные для фильтров
  const { data: allUsers = [], isLoading: usersLoading } = useGetUsersQuery();
  const { data: allDepartments = [], isLoading: departmentsLoading } = useGetDepartmentsQuery();

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
  const columns: Record<string, Column> = useMemo(() => {
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

      // Воспроизводим звук при перемещении в столбцы "Согласование" или "Выполнено"
      if (destinationColumnId === 'PROBLEM' || destinationColumnId === 'COMPLETED') {
        soundManager.playTaskMovedSound();
      }

    } catch (error) {
      console.error('Failed to update task order or status:', error);
      alert('Ошибка при перемещении задачи. Проверьте консоль для деталей.');
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
          {/* Индикатор синхронизации */}
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isConnected ? 'Синхронизация активна' : 'Синхронизация отключена'}
            </span>
          </div>
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
          context="my-tasks"
          searchPlaceholder="Поиск моих задач..."
          showDepartmentFilter={true}
          showAssigneeFilter={true}
          showDateFilter={true}
          showPriorityFilter={true}
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