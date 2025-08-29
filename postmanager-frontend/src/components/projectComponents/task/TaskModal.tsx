import { TaskModalProps, TaskType, TaskTypeDisplay, getAllTaskTypes, getTaskTypeDisplay, getTaskTypeFromDisplay } from '@/types/task.types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { MultiSelect } from '@/components/ui/multi-select/MultiSelect';
import { useGetUsersQuery } from '@/store/api/user.api';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import DatePicker from '@/components/ui/DatePicker';
import TimeOnlyPicker from '@/components/ui/TimeOnlyPicker';

export default function TaskModal({ visible, onClose, onCreate, newTask, setNewTask, columns, selectedColumn, setSelectedColumn }: TaskModalProps) {
  const { user: currentUser } = useAuth();
  const { data: users = [] } = useGetUsersQuery();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const assigneeOptions = users.map(user => ({
    value: user.id,
    label: `${user.name}${user.department ? ' (' + user.department.name + ')' : ''}`
  }));

  // Инициализируем время из существующего дедлайна
  useEffect(() => {
    if (newTask.deadline) {
      const time = format(new Date(newTask.deadline), 'HH:mm');
      setSelectedTime(time);
    } else {
      setSelectedTime('');
    }
  }, [newTask.deadline]);

  // Объединяем дату и время при изменении
  useEffect(() => {
    if (newTask.deadline && selectedTime) {
      const date = new Date(newTask.deadline);
      const [hours, minutes] = selectedTime.split(':').map(Number);
      date.setHours(hours, minutes, 0, 0);
      
      // Обновляем только если время действительно изменилось
      const currentTime = format(new Date(newTask.deadline), 'HH:mm');
      if (selectedTime !== currentTime) {
        setNewTask({ ...newTask, deadline: date });
      }
    }
  }, [selectedTime]);


  if (!visible) return null;
  return (
    <div className="fixed inset-0 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-2xl border border-white">
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
            className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white resize-none"
            placeholder="Введите описание"
            value={newTask.description}
            onChange={e => setNewTask({ ...newTask, description: e.target.value })}
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
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Тип задачи
          </label>
          <select
            className="w-full px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
            value={newTask.taskType}
            onChange={e => {
              setNewTask({ ...newTask, taskType: e.target.value as TaskType });
            }}
          >
            {getAllTaskTypes().map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
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
              {newTask.deadline ? format(new Date(newTask.deadline), 'dd.MM.yyyy', { locale: ru }) : 'Выберите дату'}
            </button>
            <TimeOnlyPicker
              value={selectedTime}
              onChange={(time) => setSelectedTime(time)}
              placeholder="Время"
              className="w-24"
            />
            {newTask.deadline && (
              <button
                type="button"
                onClick={() => {
                  setNewTask({ ...newTask, deadline: null });
                  setSelectedTime('');
                }}
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
      
      {/* Календарь для выбора даты (без времени) */}
      <DatePicker
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={(date) => {
          // Объединяем выбранную дату с выбранным временем
          if (selectedTime) {
            const [hours, minutes] = selectedTime.split(':').map(Number);
            const combinedDate = new Date(date);
            combinedDate.setHours(hours, minutes, 0, 0);
            setNewTask({ ...newTask, deadline: combinedDate });
          } else {
            // Если время не выбрано, устанавливаем время по умолчанию 9:00
            const combinedDate = new Date(date);
            combinedDate.setHours(9, 0, 0, 0);
            setNewTask({ ...newTask, deadline: combinedDate });
            setSelectedTime('09:00');
          }
        }}
        selectedDate={newTask.deadline}
        showTimeSelect={false}
        minDate={new Date()}
        placeholder="Выберите дату"
      />
    </div>
  );
} 