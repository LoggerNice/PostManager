'use client';

import { TasksTabProps } from '@/types/task.types';
import Column from './task/Column';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';


export default function TasksTab({ 
  columns, 
  handleDeleteTask,
  onTaskUpdate,
  onAddTask,
  onUpdateColumnName,
  onTaskMove,
  showProjectTitle = false
}: TasksTabProps & { showProjectTitle?: boolean }) {
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

    // Вызываем функцию перемещения задачи
    if (onTaskMove) {
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
    }
  };

  return (
    <div className="px-8 py-8">
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex w-full gap-4 overflow-x-auto">
          {Object.entries(columns).map(([columnId, column]) => (
            <Column
              key={columnId}
              columnId={columnId}
              column={column}
              handleDeleteTask={handleDeleteTask}
              onTaskUpdate={onTaskUpdate}
              onAddTask={onAddTask}
              onUpdateColumnName={onUpdateColumnName}
              showProjectTitle={showProjectTitle}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
} 