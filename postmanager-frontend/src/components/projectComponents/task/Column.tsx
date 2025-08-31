'use client';

import { Droppable, Draggable, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { Column as ColumnType } from '../../../types';
import { Task, TaskPriority, TaskType } from '@/types/task.types';

interface ColumnProps {
  columnId: string;
  column: ColumnType;
  handleDeleteTask: (columnId: string, taskId: string) => void;
  onTaskUpdate: (taskId: string, updatedTask: Task) => void;
  showProjectTitle?: boolean;
}

export default function Column({ columnId, column, handleDeleteTask, onTaskUpdate, showProjectTitle = false }: ColumnProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 flex-1 shadow-lg border border-zinc-800 h-[calc(100vh-300px)] flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-lg font-semibold text-white">
          {column.name} <span className="text-blue-500 pl-2">{column.items.length}</span>
        </h2>
      </div>
      <Droppable droppableId={columnId}>
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={`space-y-2 flex-1 overflow-y-auto custom-scrollbar ${
              snapshot.isDraggingOver ? 'bg-gray-700 bg-opacity-50 rounded-lg' : ''
            }`}
          >
            {column.items.map((item, idx) => (
              <Draggable key={`${columnId}-${item.id}-${idx}`} draggableId={String(item.id)} index={idx}>
                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                  <TaskCard
                    item={item}
                    columnId={columnId}
                    handleDeleteTask={handleDeleteTask}
                    onTaskUpdate={onTaskUpdate}
                    provided={provided}
                    snapshot={snapshot}
                    showProjectTitle={showProjectTitle}
                  />
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
} 