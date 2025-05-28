import { DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { Task } from '../../types';
import { TaskPriority } from '@/types/task.types';
import { useState } from 'react';
import { 
  EllipsisVerticalIcon, 
  PencilSquareIcon, 
  CalendarIcon, 
  TrashIcon 
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useUpdateTaskMutation } from '@/store/api/task.api';

interface TaskCardProps {
  item: Task;
  columnId: string;
  startEditing: (task: Task, columnId: string) => void;
  handleDeleteTask: (columnId: string, taskId: string) => void;
  snapshot: DraggableStateSnapshot;
  provided: DraggableProvided;
  onTaskUpdate: (taskId: string, updatedTask: Task) => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Высокий':
      return 'border-red-500';
    case 'Средний':
      return 'border-yellow-500';
    default:
      return 'border-gray-900';
  }
};

export default function TaskCard({ item, columnId, startEditing, handleDeleteTask, snapshot, provided, onTaskUpdate }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDatepicker, setShowDatepicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(item.deadline ? new Date(item.deadline) : new Date());
  const [updateTask] = useUpdateTaskMutation();

  const handleDateSelect = async (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
    try {
      const priorityMap: Record<string, TaskPriority> = {
        'Низкий': 'LOW',
        'Средний': 'MEDIUM',
        'Высокий': 'HIGH'
      };

      const result = await updateTask({
        taskId: item.id,
        task: {
          ...item,
          priority: priorityMap[item.priority as keyof typeof priorityMap],
          deadline: format(date, 'yyyy-MM-dd')
        }
      }).unwrap();

      // Update local state with the new task data
      onTaskUpdate(item.id, {
        ...item,
        deadline: format(date, 'yyyy-MM-dd')
      });

      setShowDatepicker(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to update task deadline:', error);
    }
  };

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-gray-900 rounded-lg p-4 shadow flex flex-col gap-2 border-2 ${getPriorityColor(item.priority)} ${snapshot.isDragging ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="font-semibold text-[14px]">{item.title}</div>
        <div className="relative">
          <button
            onClick={e => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="text-gray-400 hover:text-white"
          >
            <EllipsisVerticalIcon className="w-5 h-5" />
          </button>
          {showMenu && (
            <div 
              className="absolute -right-4 mt-2 bg-gray-900 rounded-xl shadow-lg border border-gray-800"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  startEditing(item, columnId);
                  setShowMenu(false);
            }}
                className="w-full px-4 py-2 pt-3 text-left text-[12px] text-gray-300 hover:bg-gray-700 rounded-t-lg flex items-center gap-2"
              >
                <PencilSquareIcon className="w-4 h-4" />
                Редактировать
              </button>
              <button
                onClick={() => {
                  setShowDatepicker(true);
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-[12px] text-gray-300 hover:bg-gray-700 flex items-center gap-2"
          >
                <CalendarIcon className="w-4 h-4" />
                Добавить дату
          </button>
          <button
                onClick={() => {
              handleDeleteTask(columnId, item.id);
                  setShowMenu(false);
            }}
                className="w-full px-4 py-2 pb-3 text-left text-[12px] text-red-400 hover:bg-gray-700 rounded-b-lg flex items-center gap-2"
          >
                <TrashIcon className="w-4 h-4" />
                Удалить
          </button>
            </div>
          )}
        </div>
      </div>
      {showDatepicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowDatepicker(false)}>
          <div className="bg-gray-900 p-4 rounded-lg shadow-lg" onClick={e => e.stopPropagation()}>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateSelect}
              inline
              locale={ru}
              dateFormat="dd.MM.yyyy"
              className="bg-gray-800 text-white rounded p-2"
            />
          </div>
        </div>
      )}
      {item.deadline && !showDatepicker && (
        <div className="text-xs text-gray-400">
          Срок: {new Date(item.deadline).toLocaleDateString('ru-RU')}
        </div>
      )}
    </div>
  );
} 