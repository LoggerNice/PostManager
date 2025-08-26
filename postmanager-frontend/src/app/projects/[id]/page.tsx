'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useGetProjectByIdQuery, useDeleteProjectMutation } from '@/store/api/project.api';
import { useGetUsersQuery } from '@/store/api/user.api';
import { useGetDepartmentsQuery } from '@/store/api/department.api';
import { TaskStatus, TaskPriority, TaskForm, Task } from '@/types/task.types';
import { TasksFilterConfig } from '@/types/filter.types';
import { Column } from '@/types';
import { useTasks } from '@/hooks/useTasks';
import { filterTasks } from '@/utils/taskFiltering';
import { soundManager } from '@/utils/soundUtils';
import { format } from 'date-fns';

import ProjectHeader from '../../../components/projectComponents/ProjectHeader';
import ProjectTabs from '../../../components/projectComponents/ProjectTabs';
import TasksTab from '../../../components/projectComponents/TasksTab';
import TimelineTab from '../../../components/projectComponents/TimelineTab';
import CalendarTab from '../../../components/projectComponents/CalendarTab';
import ProjectEditModal from '../../../components/projectComponents/ProjectEditModal';
import TasksFilter from '../../../components/filters/TasksFilter';

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
    projectTasks,
    groupedProjectTasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    sortTasksByPriority
  } = useTasks({ projectId, enableSounds: true });

  // API hooks
  const { data: project, isLoading: projectLoading, error: projectError } = useGetProjectByIdQuery(projectId);
  const [deleteProject] = useDeleteProjectMutation();

  // Загружаем данные для фильтров
  const { data: allUsers = [], isLoading: usersLoading } = useGetUsersQuery();
  const { data: allDepartments = [], isLoading: departmentsLoading } = useGetDepartmentsQuery();

  // Применяем фильтрацию к задачам проекта
  const filteredTasks = useMemo(() => {
    if (!projectTasks || projectTasks.length === 0) return [];
    return filterTasks(projectTasks, filters).filteredTasks;
  }, [projectTasks, filters]);

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

  // Обработка ошибок загрузки
  if (projectLoading || usersLoading || departmentsLoading) return <div className="text-white">Загрузка проекта...</div>;
  if (projectError) return <div className="text-white">Ошибка при загрузке проекта</div>;
  if (isLoading) return <div className="text-white">Загрузка задач...</div>;
  if (error) return <div className="text-white">Ошибка при загрузке задач: {error}</div>;
  if (!project) return <div className="text-white">Проект не найден</div>;

  const users = project.users || [];

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

    // Определяем порядок для новой задачи (в конце списка)
    const currentColumnItems = columns[columnId]?.items || [];
    const nextOrder = currentColumnItems.length;

    const taskData: TaskForm = {
      title: title.trim(),
      description: description.trim(),
      priority: priority,
      taskType: taskType,
      status: columnId as TaskStatus,
      projectId: projectId,
      deadline: deadline,
      order: nextOrder,
      assigneeIds: assigneeIds || []
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
      await deleteTask(taskId, projectId);
    } catch (error) {
      console.error('Failed to delete task:', error);
      alert('Ошибка при удалении задачи. Проверьте консоль для деталей.');
    }
  };

  const handleTaskUpdate = async (taskId: string, updatedTask: Task) => {
    try {
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
      // Подготавливаем данные для обновления
      const updateData: Partial<TaskForm> = {
        status: destinationColumnId as TaskStatus,
        order: destinationIndex
      };

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

  const handleDeleteProject = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.')) {
      return;
    }

    try {
      await deleteProject(projectId).unwrap();
      // Перенаправляем на главную страницу после удаления
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('Ошибка при удалении проекта. Проверьте консоль для деталей.');
    }
  };

  const handleEditProject = () => {
    setShowProjectEditModal(true);
  };

  const handleCloseProjectEditModal = () => {
    setShowProjectEditModal(false);
  };

  const handleProjectUpdated = () => {
    setShowProjectEditModal(false);
    // Проект автоматически обновится через RTK Query
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden flex flex-col">
      <ProjectHeader
        {...project}
        onEditClick={handleEditProject}
        onDeleteClick={handleDeleteProject}
        users={users}
      />

      <ProjectTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {activeTab === 'tasks' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Фильтры задач */}
          <div className="px-6 mt-4 mx-2 flex-shrink-0">
            <TasksFilter
              tasks={projectTasks || []}
              filters={filters}
              onFiltersChange={setFilters}
              availableDepartments={allDepartments}
              availableUsers={allUsers}
              searchPlaceholder="Поиск задач проекта..."
              showDepartmentFilter={true}
              showAssigneeFilter={true}
              showDateFilter={true}
              showPriorityFilter={true}
            />
          </div>

          {/* Доски задач */}
          <div className="flex-1 overflow-hidden custom-scrollbar">
            <TasksTab
              columns={columns}
              handleDeleteTask={handleDeleteTask}
              onTaskUpdate={handleTaskUpdate}
              onAddTask={handleCreateTask}
              onUpdateColumnName={handleUpdateColumnName}
              onTaskMove={handleTaskMove}
            />
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <TimelineTab users={users} />
      )}

      {activeTab === 'calendar' && (
        <CalendarTab projectId={projectId} />
      )}

      {showProjectEditModal && (
        <ProjectEditModal
          isOpen={showProjectEditModal}
          project={project}
          onClose={handleCloseProjectEditModal}
        />
      )}
    </div>
  );
}