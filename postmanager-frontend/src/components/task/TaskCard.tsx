import { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { Task } from '../../types';
import { TrashIcon } from '@heroicons/react/24/outline';

interface TaskCardProps {
  item: Task;
  columnId: string;
  startEditing: (task: Task, columnId: string) => void;
  handleDeleteTask: (columnId: string, taskId: string) => void;
  snapshot: DraggableStateSnapshot;
  provided: DraggableProvided;
}

function getPriorityColor(priority?: string) {
  switch (priority) {
    case 'Высокий':
      return 'border-red-500';
    case 'Средний':
      return 'border-yellow-500';
    default:
      return 'border-gray-900';
  }
}

export default function TaskCard({ item, columnId, startEditing, handleDeleteTask, snapshot, provided }: TaskCardProps) {
  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-gray-900 rounded-lg p-4 shadow flex flex-col gap-2 border-2 ${getPriorityColor(item.priority)} ${snapshot.isDragging ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold text-[14px]">{item.title}</div>
        <div className="flex items-center gap-2 text-gray-400">
          <button
            onClick={e => {
              e.stopPropagation();
              startEditing(item, columnId);
            }}
            className="hover:text-blue-400"
            title="Редактировать"
          >
            ✎
          </button>
          <button
            onClick={e => {
              e.stopPropagation();
              handleDeleteTask(columnId, item.id);
            }}
            title="Удалить"
          >
            <TrashIcon className="w-4 h-4 hover:text-red-400" />
          </button>
        </div>
      </div>
      {item.deadline && (
        <div className="text-xs text-gray-400">
          Срок: {new Date(item.deadline).toLocaleDateString('ru-RU')}
        </div>
      )}
    </div>
  );
} 