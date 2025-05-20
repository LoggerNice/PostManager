interface TaskModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: () => void;
  newTask: { title: string; description: string; priority: 'Низкий' | 'Средний' | 'Высокий' };
  setNewTask: (task: { title: string; description: string; priority: 'Низкий' | 'Средний' | 'Высокий' }) => void;
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
        <input
          className="w-full mb-3 p-2 rounded bg-zinc-800 text-white border border-zinc-700"
          placeholder="Название задачи"
          value={newTask.title}
          onChange={e => setNewTask({ ...newTask, title: e.target.value })}
        />
        <textarea
          className="w-full mb-3 p-2 rounded bg-zinc-800 text-white border border-zinc-700"
          placeholder="Описание задачи"
          value={newTask.description}
          onChange={e => setNewTask({ ...newTask, description: e.target.value })}
        />
        <div className="mb-3">
          <label className="block mb-1 text-sm">Приоритет</label>
          <select
            className="w-full p-2 rounded bg-zinc-800 text-white border border-zinc-700"
            value={newTask.priority}
            onChange={e => setNewTask({ ...newTask, priority: e.target.value as 'Низкий' | 'Средний' | 'Высокий' })}
          >
            <option value="Низкий">Низкий</option>
            <option value="Средний">Средний</option>
            <option value="Высокий">Высокий</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="block mb-1 text-sm">Колонка</label>
          <select
            className="w-full p-2 rounded bg-zinc-800 text-white border border-zinc-700"
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