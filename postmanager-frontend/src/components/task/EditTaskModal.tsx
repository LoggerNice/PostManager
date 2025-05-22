import { Task } from '../../types';
import { DateInput } from '../ui/date-input/DateInput';

interface EditTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  editingTask: { task: Task; columnId: string } | null;
  setEditingTask: (task: { task: Task; columnId: string } | null) => void;
}

export default function EditTaskModal({ visible, onClose, onSave, editingTask, setEditingTask }: EditTaskModalProps) {
  if (!visible || !editingTask) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md border border-zinc-800">
        <h2 className="text-xl font-bold mb-4">Редактировать задачу</h2>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Название задачи
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Введите название"
            value={editingTask.task.title}
            onChange={e => setEditingTask({
              ...editingTask,
              task: { ...editingTask.task, title: e.target.value }
            })}
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Описание задачи
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Введите описание"
            value={editingTask.task.description}
            onChange={e => setEditingTask({
              ...editingTask,
              task: { ...editingTask.task, description: e.target.value }
            })}
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Приоритет
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            value={editingTask.task.priority || 'Низкий'}
            onChange={e => setEditingTask({
              ...editingTask,
              task: { ...editingTask.task, priority: e.target.value as 'Низкий' | 'Средний' | 'Высокий' }
            })}
          >
            <option value="Низкий">Низкий</option>
            <option value="Средний">Средний</option>
            <option value="Высокий">Высокий</option>
          </select>
        </div>
        <DateInput
          label="Срок выполнения"
          value={editingTask.task.deadline || ''}
          onChange={e => setEditingTask({
            ...editingTask,
            task: { ...editingTask.task, deadline: e.target.value }
          })}
        />
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-zinc-700 text-white"
            onClick={onClose}
          >Отмена</button>
          <button
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            onClick={onSave}
          >Сохранить</button>
        </div>
      </div>
    </div>
  );
} 