'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useGetProjectByIdQuery, useDeleteProjectMutation } from '@/store/api/project.api';
import { TaskStatus, TaskPriority, TaskForm, Task } from '@/types/task.types';
import { Column } from '@/types';
import { useTasks } from '@/hooks/useTasks';
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

  // Формируем колонки из сгруппированных задач проекта
  const columns: Record<string, Column> = useMemo(() => {
    if (groupedProjectTasks && Object.keys(groupedProjectTasks).length > 0) {
      return {
        IN_PROGRESS: { 
          name: 'В процессе', 
          items: groupedProjectTasks.IN_PROGRESS || [] 
        },
        PROBLEM: { 
          name: 'Согласование', 
          items: groupedProjectTasks.PROBLEM || [] 
        },
        COMPLETED: { 
          name: 'Выполнено', 
          items: groupedProjectTasks.COMPLETED || [] 
        }
      };
    }

    return initialColumns;
  }, [groupedProjectTasks]);

  // Обработка ошибок загрузки
  if (projectLoading) return <div className="text-white">Загрузка проекта...</div>;
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
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
        <TasksTab
          columns={columns}
          handleDeleteTask={handleDeleteTask}
          onTaskUpdate={handleTaskUpdate}
          onAddTask={handleCreateTask}
          onUpdateColumnName={handleUpdateColumnName}
          onTaskMove={handleTaskMove}
        />
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
