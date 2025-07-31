import { TaskModalProps } from '@/types/task.types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MultiSelect } from '@/components/ui/multi-select/MultiSelect';
import { useGetUsersQuery } from '@/store/api/user.api';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import DatePicker from '@/components/ui/DatePicker';

export default function TaskModal({ visible, onClose, onCreate, newTask, setNewTask, columns, selectedColumn, setSelectedColumn }: TaskModalProps) {
  const { user: currentUser } = useAuth();
  const { data: users = [] } = useGetUsersQuery();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const assigneeOptions = users.map(user => ({
    value: user.id,
    label: `${user.name}${user.department ? ' (' + user.department.name + ')' : ''}`
  }));

  // Автоматически добавляем текущего пользователя в список исполнителей
  useEffect(() => {
    if (visible && currentUser && currentUser.id) {
      const currentAssigneeIds = newTask.assigneeIds || [];
      if (!currentAssigneeIds.includes(currentUser.id)) {
        setNewTask({
          ...newTask,
          assigneeIds: [...currentAssigneeIds, currentUser.id]
        });
      }
    }
  }, [visible, currentUser, newTask.assigneeIds, setNewTask]);



  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md border border-white">
        <h2 className="text-xl font-bold mb-4 text-white">Задача</h2>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Название задачи *
          </label>
          <input
            className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
            placeholder="Введите название"
            value={newTask.title}
            onChange={e => setNewTask({ ...newTask, title: e.target.value })}
            maxLength={100}
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Описание задачи
          </label>
          <textarea
            className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
            placeholder="Введите описание"
            value={newTask.description}
            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
            rows={3}
            maxLength={500}
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Приоритет
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
            value={newTask.priority}
            onChange={e => setNewTask({ ...newTask, priority: e.target.value as 'Низкий' | 'Средний' | 'Высокий' })}
          >
            <option value="Низкий">Низкий</option>
            <option value="Средний">Средний</option>
            <option value="Высокий">Высокий</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Срок выполнения
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowDatePicker(true)}
              className="flex-1 px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white text-left"
            >
              {newTask.deadline ? format(newTask.deadline, 'dd.MM.yyyy HH:mm', { locale: ru }) : 'Выберите дату и время'}
            </button>
            {newTask.deadline && (
              <button
                type="button"
                onClick={() => setNewTask({ ...newTask, deadline: null })}
                className="px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white hover:bg-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Исполнители
          </label>
          <MultiSelect
            label=""
            name="assignees"
            options={assigneeOptions}
            value={newTask.assigneeIds || []}
            onChange={(value) => setNewTask({ ...newTask, assigneeIds: value })}
            placeholder="Выберите исполнителей..."
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            className="px-4 py-2 rounded bg-zinc-700 text-white hover:bg-zinc-600 transition-colors"
            onClick={onClose}
          >
            Отмена
          </button>
          <button
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={onCreate}
            disabled={!newTask.title.trim()}
          >
            Сохранить
          </button>
        </div>
      </div>
      
      {/* Календарь для выбора даты и времени */}
      <DatePicker
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={(date) => {
          setNewTask({ ...newTask, deadline: date });
        }}
        selectedDate={newTask.deadline}
        showTimeSelect={true}
        minDate={new Date()}
        placeholder="Выберите дату и время"
      />
    </div>
  );
} 