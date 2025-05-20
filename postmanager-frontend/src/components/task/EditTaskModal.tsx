import { Task } from '../../types';

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
        <input
          className="w-full mb-3 p-2 rounded bg-zinc-800 text-white border border-zinc-700"
          placeholder="Название задачи"
          value={editingTask.task.title}
          onChange={e => setEditingTask({
            ...editingTask,
            task: { ...editingTask.task, title: e.target.value }
          })}
        />
        <textarea
          className="w-full mb-3 p-2 rounded bg-zinc-800 text-white border border-zinc-700"
          placeholder="Описание задачи"
          value={editingTask.task.description}
          onChange={e => setEditingTask({
            ...editingTask,
            task: { ...editingTask.task, description: e.target.value }
          })}
        />
        <div className="mb-3">
          <label className="block mb-1 text-sm">Приоритет</label>
          <select
            className="w-full p-2 rounded bg-zinc-800 text-white border border-zinc-700"
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