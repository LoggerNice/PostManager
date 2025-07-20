'use client';

import { TasksTabProps } from '@/types/task.types';
import Column from './task/Column';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';

export default function TasksTab({ 
  columns, 
  handleDeleteTask,
  onTaskUpdate,
  onAddTask,
  onUpdateColumnName,
  onTaskMove
}: TasksTabProps) {
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

    // Вызываем функцию перемещения задачи
    if (onTaskMove) {
      onTaskMove(
        draggableId,
        source.droppableId,
        destination.droppableId,
        source.index,
        destination.index
      );
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
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
} 