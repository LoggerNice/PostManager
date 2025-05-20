import { DragDropContext } from '@hello-pangea/dnd';
import Column from '@/components/task/Column';
import { Task, Column as ColumnType } from '@/types';

interface TasksTabProps {
  columns: Record<string, ColumnType>;
  onDragEnd: (result: any) => void;
  startEditing: (task: Task, columnId: string) => void;
  handleDeleteTask: (columnId: string, taskId: string) => void;
  onAddTask: (columnId: string) => void;
}

export default function TasksTab({ 
  columns, 
  onDragEnd, 
  startEditing, 
  handleDeleteTask, 
  onAddTask 
}: TasksTabProps) {
  return (
    <div className="px-8 py-8">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto">
          {Object.entries(columns).map(([columnId, column]) => (
            <Column
              key={columnId}
              columnId={columnId}
              column={column}
              startEditing={startEditing}
              handleDeleteTask={handleDeleteTask}
              onAddTask={() => onAddTask(columnId)}
            />
          ))}
        </div>
      </DragDropContext>
    </div>
  );
} 