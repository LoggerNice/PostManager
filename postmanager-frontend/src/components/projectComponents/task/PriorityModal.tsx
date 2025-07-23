'use client';

import { TaskPriority, TaskStatus } from '@/types/task.types';
import { format } from 'date-fns';
import { useUpdateTaskMutation } from '@/store/api/task.api';

interface PriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: {
    id: string;
    title: string;
    description?: string;
    priority: string;
    status: string;
    projectId: number;
    deadline?: Date;
  };
  onTaskUpdate: (taskId: string, updatedTask: any) => void;
}

export default function PriorityModal({ isOpen, onClose, task, onTaskUpdate }: PriorityModalProps) {
  const [updateTask] = useUpdateTaskMutation();

  const handlePriorityChange = async (newPriority: 'Низкий' | 'Средний' | 'Высокий') => {
    try {
      const priorityMap: Record<string, TaskPriority> = {
        'Низкий': 'LOW',
        'Средний': 'MEDIUM',
        'Высокий': 'HIGH'
      };

      await updateTask({
        taskId: task.id,
        task: {
          title: task.title,
          description: task.description,
          priority: priorityMap[newPriority],
          status: task.status as TaskStatus,
          projectId: Number(task.projectId),
          deadline: task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : undefined
        }
      }).unwrap();

      // Update local state with the new task data
      onTaskUpdate(task.id, {
        ...task,
        priority: newPriority
      });

      onClose();
    } catch (error) {
      console.error('Failed to update task priority:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-700 min-w-[300px]" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-white mb-4">Изменить приоритет</h3>
        <div className="space-y-2">
          <button
            onClick={() => handlePriorityChange('Низкий')}
            className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-colors ${
              task.priority === 'Низкий' 
                ? 'border-gray-500 bg-gray-700 text-white' 
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>Низкий приоритет</span>
            </div>
          </button>
          <button
            onClick={() => handlePriorityChange('Средний')}
            className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-colors ${
              task.priority === 'Средний' 
                ? 'border-yellow-500 bg-yellow-900 text-white' 
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span>Средний приоритет</span>
            </div>
          </button>
          <button
            onClick={() => handlePriorityChange('Высокий')}
            className={`w-full px-4 py-3 text-left rounded-lg border-2 transition-colors ${
              task.priority === 'Высокий' 
                ? 'border-red-500 bg-red-900 text-white' 
                : 'border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Высокий приоритет</span>
            </div>
          </button>
        </div>
        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}