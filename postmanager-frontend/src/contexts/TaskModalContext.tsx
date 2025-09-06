'use client';

import React, { createContext, useContext, useState } from 'react';
import { Task } from '@/types/task.types';
import { useGetTaskByIdQuery } from '@/store/api/task.api';
import TaskDetailsModal from '@/components/projectComponents/task/TaskDetailsModal';

interface TaskModalContextType {
  openTaskModal: (task: Task) => void;
  openTaskModalById: (taskId: number) => void;
  closeTaskModal: () => void;
  isTaskModalOpen: boolean;
  currentTask: Task | null;
}

const TaskModalContext = createContext<TaskModalContextType | undefined>(undefined);

export function TaskModalProvider({ children }: { children: React.ReactNode }) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState<Task | null>(null);
  const [taskIdToLoad, setTaskIdToLoad] = useState<number | null>(null);

  // Загружаем задачу по ID если нужно
  const { data: loadedTask, isLoading } = useGetTaskByIdQuery(
    taskIdToLoad?.toString() || '',
    { skip: !taskIdToLoad }
  );

  // Когда задача загрузилась, открываем модальное окно
  React.useEffect(() => {
    if (loadedTask && taskIdToLoad) {
      setCurrentTask(loadedTask);
      setIsTaskModalOpen(true);
      setTaskIdToLoad(null);
    }
  }, [loadedTask, taskIdToLoad]);

  const openTaskModal = (task: Task) => {
    setCurrentTask(task);
    setIsTaskModalOpen(true);
  };

  const openTaskModalById = (taskId: number) => {
    setTaskIdToLoad(taskId);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setCurrentTask(null);
    setTaskIdToLoad(null);
  };

  const handleTaskUpdate = (taskId: string, updatedTask: Task) => {
    // Здесь можно добавить логику обновления задачи в глобальном состоянии
    // если потребуется
    console.log('Task updated:', taskId, updatedTask);
  };

  return (
    <TaskModalContext.Provider value={{
      openTaskModal,
      openTaskModalById,
      closeTaskModal,
      isTaskModalOpen,
      currentTask
    }}>
      {children}
      
      {/* Глобальное модальное окно задачи */}
      {currentTask && (
        <TaskDetailsModal
          task={currentTask}
          visible={isTaskModalOpen}
          onClose={closeTaskModal}
          onTaskUpdate={handleTaskUpdate}
        />
      )}
    </TaskModalContext.Provider>
  );
}

export function useTaskModal() {
  const context = useContext(TaskModalContext);
  if (context === undefined) {
    throw new Error('useTaskModal must be used within a TaskModalProvider');
  }
  return context;
}
