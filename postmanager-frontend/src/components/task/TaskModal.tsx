import { DateInput } from '../ui/date-input/DateInput';

interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: () => void;
  newTask: { title: string; description: string; priority: 'Низкий' | 'Средний' | 'Высокий'; deadline: string | undefined };
  setNewTask: (task: { title: string; description: string; priority: 'Низкий' | 'Средний' | 'Высокий'; deadline: string | undefined }) => void;
  columns: any;
  selectedColumn: string;
  setSelectedColumn: (col: string) => void;
}

export default function TaskModal({ visible, onClose, onCreate, newTask, setNewTask, columns, selectedColumn, setSelectedColumn }: TaskModalProps) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-zinc-900 rounded-lg p-6 w-full max-w-md border border-zinc-800">
        <h2 className="text-xl font-bold mb-4">Создать задачу</h2>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Название задачи
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Введите название"
            value={newTask.title}
            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Описание задачи
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Введите описание"
            value={newTask.description}
            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Приоритет
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            value={newTask.priority}
            onChange={e => setNewTask({ ...newTask, priority: e.target.value as 'Низкий' | 'Средний' | 'Высокий' })}
          >
            <option value="Низкий">Низкий</option>
            <option value="Средний">Средний</option>
            <option value="Высокий">Высокий</option>
          </select>
        </div>
        <DateInput
          label="Срок выполнения"
          value={newTask.deadline || ''}
          onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
        />
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Колонка
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            value={selectedColumn}
            onChange={e => setSelectedColumn(e.target.value)}
          >
            {Object.entries(columns).map(([colId, col]) => (
              <option key={colId} value={colId}>{col.name}</option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-zinc-700 text-white"
            onClick={onClose}
          >Отмена</button>
          <button
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700"
            onClick={onCreate}
          >Создать</button>
        </div>
      </div>
    </div>
  );
} 