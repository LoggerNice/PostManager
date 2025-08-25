import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/solid';
import { TRAINER_LABELS } from '@/constants/trainer';
import { AdminTasksPanelProps, TrainerTask, TrainerGroup } from '@/types/trainer.types';

export const AdminTasksPanel: React.FC<AdminTasksPanelProps> = ({
  groups,
  expanded,
  newTask,
  editingTask,
  onToggleGroup,
  onNewTaskChange,
  onCreateTask,
  onEditTask,
  onUpdateTask,
  onCancelEdit,
  onDeleteTask,
  className = ""
}) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Добавить задачу */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {TRAINER_LABELS.ADD_TASK}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Название
            </label>
            <input
              type="text"
              value={newTask.title}
              onChange={(e) => onNewTaskChange({...newTask, title: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Название задачи"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Описание
            </label>
            <textarea
              value={newTask.description}
              onChange={(e) => onNewTaskChange({...newTask, description: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Описание задачи"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Команда
            </label>
            <input
              type="text"
              value={newTask.command}
              onChange={(e) => onNewTaskChange({...newTask, command: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
              placeholder="Команда Linux"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Подсказка
            </label>
            <textarea
              value={newTask.hint}
              onChange={(e) => onNewTaskChange({...newTask, hint: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Подсказка для пользователя"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Группа
            </label>
            <input
              type="text"
              value={newTask.groupName}
              onChange={(e) => onNewTaskChange({...newTask, groupName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Название группы"
            />
          </div>
          <button
            onClick={onCreateTask}
            disabled={!newTask.title || !newTask.description || !newTask.command}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {TRAINER_LABELS.SAVE_TASK}
          </button>
        </div>
      </div>

      {/* Список задач */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {TRAINER_LABELS.TASKS_LIST}
        </h2>
        <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
          {groups.filter(group => group.tasks && group.tasks.length > 0).map(group => (
            <div key={group.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
              <button
                onClick={() => onToggleGroup(group.id)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {group.name}
                  </h3>
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                    {group.tasks.length}
                  </span>
                </div>
                <div className={`transform transition-transform ${expanded[group.id] ? 'rotate-180' : ''}`}>
                  ▼
                </div>
              </button>

              {expanded[group.id] && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="space-y-4">
                    {group.tasks.map(task => (
                      <div key={task.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                        {editingTask && editingTask.id === task.id ? (
                          <EditTaskForm
                            task={editingTask}
                            onSave={onUpdateTask}
                            onCancel={onCancelEdit}
                          />
                        ) : (
                          <TaskCard
                            task={task}
                            onEdit={() => onEditTask(task)}
                            onDelete={() => onDeleteTask(task)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Вспомогательные компоненты
interface EditTaskFormProps {
  task: TrainerTask;
  onSave: () => void;
  onCancel: () => void;
}

const EditTaskForm: React.FC<EditTaskFormProps> = ({ task, onSave, onCancel }) => {
  const [editedTask, setEditedTask] = React.useState(task);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Название
        </label>
        <input
          type="text"
          value={editedTask.title}
          onChange={(e) => setEditedTask({...editedTask, title: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Описание
        </label>
        <textarea
          value={editedTask.description}
          onChange={(e) => setEditedTask({...editedTask, description: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={3}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Команда
        </label>
        <input
          type="text"
          value={editedTask.command}
          onChange={(e) => setEditedTask({...editedTask, command: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Подсказка
        </label>
        <textarea
          value={editedTask.hint || ''}
          onChange={(e) => setEditedTask({...editedTask, hint: e.target.value})}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          rows={2}
        />
      </div>
      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Сохранить
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          Отменить
        </button>
      </div>
    </div>
  );
};

interface TaskCardProps {
  task: TrainerTask;
  onEdit: () => void;
  onDelete: () => void;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onEdit, onDelete }) => {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-gray-900 dark:text-white">
          {task.title}
        </h4>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            ✏️
          </button>
          <button
            onClick={onDelete}
            className="p-1 text-red-400 hover:text-red-600 transition-colors"
          >
            🗑️
          </button>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-3">
        {task.description}
      </p>
      <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
        <code className="text-sm text-gray-900 dark:text-white">
          {task.command}
        </code>
      </div>
    </div>
  );
};
