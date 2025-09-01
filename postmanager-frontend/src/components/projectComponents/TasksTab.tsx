'use client';

import { TasksTabProps } from '@/types/task.types';
import Column from './task/Column';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

interface BoardTasksTabProps {
  columns: Record<string, any>;
  handleDeleteTask: (columnId: string, taskId: string) => void;
  onTaskUpdate: (taskId: string, updatedTask: any) => void;
  onTaskMove?: (taskId: string, sourceColumnId: string, destinationColumnId: string, sourceIndex: number, destinationIndex: number) => void;
  onAddTask?: (columnId: string, title: string, description?: string, priority?: any, taskType?: any, deadline?: string, assigneeIds?: number[]) => void;
  showProjectTitle?: boolean;
}

export default function TasksTab({ 
  columns, 
  handleDeleteTask,
  onTaskUpdate,
  onTaskMove,
  onAddTask,
  showProjectTitle = false
}: BoardTasksTabProps) {
  const { user } = useAuth();

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    // Если нет места назначения, выходим
    if (!destination) return;

    // Если задача осталась в том же месте, выходим
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Проверка: только MANAGER может перемещать в COMPLETED
    if (
      destination.droppableId === 'COMPLETED' &&
      user?.role !== 'MANAGER'
    ) {
      toast.error('Только начальник отдела может перемещать задачи в столбец "Выполнено"');
      return;
    }

    // Проверка: только MANAGER может перемещать из COMPLETED
    if (
      source.droppableId === 'COMPLETED' &&
      destination.droppableId !== 'COMPLETED' &&
      user?.role !== 'MANAGER'
    ) {
      toast.error('Только начальник отдела может перемещать задачи из столбца "Выполнено"');
      return;
    }

    // Проверяем, что функция перемещения существует
    if (!onTaskMove) {
      console.error('onTaskMove function is not provided');
      toast.error('Функция перемещения недоступна');
      return;
    }

    // Вызываем функцию перемещения задачи
    try {
      onTaskMove(
        draggableId,
        source.droppableId,
        destination.droppableId,
        source.index,
        destination.index
      );
      
      // Уведомление об успешном перемещении в столбец "выполнено"
      if (destination.droppableId === 'COMPLETED' && user?.role === 'MANAGER') {
        toast.success('Задача успешно перемещена в столбец "Выполнено"');
      }
    } catch (error) {
      console.error('Error during task move:', error);
      toast.error('Ошибка при перемещении задачи');
    }
  };

  return (
    <div className="px-8 py-8 h-full">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex w-full gap-4 overflow-x-auto h-full custom-scrollbar">
          {Object.entries(columns).map(([columnId, column]) => (
            <Column
              key={columnId}
              columnId={columnId}
              column={column}
              handleDeleteTask={handleDeleteTask}
              onTaskUpdate={onTaskUpdate}
              onCreateTask={onAddTask}
              showProjectTitle={showProjectTitle}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
} 