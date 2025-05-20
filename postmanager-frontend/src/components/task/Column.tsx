import { Droppable, Draggable, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';
import { Task, Column as ColumnType } from '../../types';

interface ColumnProps {
  columnId: string;
  column: ColumnType;
  startEditing: (task: Task, columnId: string) => void;
  handleDeleteTask: (columnId: string, taskId: string) => void;
  onAddTask: () => void;
}

export default function Column({ columnId, column, startEditing, handleDeleteTask, onAddTask }: ColumnProps) {
  return (
    <div className="bg-gray-800 rounded-xl p-4 min-w-[300px] w-80 flex-shrink-0 shadow-lg border border-zinc-800">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{column.name} <span className="text-blue-500 pl-2">{column.items.length}</span></h2>
        <button
          className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-2xl"
          onClick={onAddTask}
          title="Добавить задачу в этот столбец"
        >+
        </button>
      </div>
      <Droppable droppableId={columnId}>
        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`space-y-4 min-h-[60px] transition-colors ${snapshot.isDraggingOver ? 'bg-zinc-800' : ''}`}
          >
            {column.items.map((item, idx) => (
              <Draggable key={item.id} draggableId={item.id} index={idx}>
                {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
                  <TaskCard
                    item={item}
                    columnId={columnId}
                    startEditing={startEditing}
                    handleDeleteTask={handleDeleteTask}
                    snapshot={snapshot}
                    provided={provided}
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