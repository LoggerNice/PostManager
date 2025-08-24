import React from 'react';
import { PlayIcon } from '@heroicons/react/24/solid';
import { TRAINER_MESSAGES } from '@/constants/trainer';
import { GroupSelectionProps } from '@/types/trainer.types';

export const GroupSelection: React.FC<GroupSelectionProps> = ({
  groups,
  selectedGroupIds,
  onToggleGroup,
  onToggleSelectAll,
  onConfirmSelection,
  className = ""
}) => {
  const availableGroups = groups.filter(g => g.name !== 'Нераспределенные задачи');
  const isAllSelected = selectedGroupIds.length === availableGroups.length;

  return (
    <div className={className}>
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        {TRAINER_MESSAGES.SELECT_GROUPS}
      </h2>

      <div className="mb-4">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            checked={isAllSelected}
            onChange={onToggleSelectAll}
          />
          <span className="text-gray-900 dark:text-white">Выбрать все</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {availableGroups.map(group => (
          <label key={group.id} className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              checked={selectedGroupIds.includes(group.id)}
              onChange={() => onToggleGroup(group.id)}
            />
            <span className="flex-1 text-gray-900 dark:text-white">
              {group.name}
              <span className="text-sm text-gray-500 ml-1">({group.tasks.length})</span>
            </span>
          </label>
        ))}
      </div>

      <button
        onClick={onConfirmSelection}
        disabled={selectedGroupIds.length === 0}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <PlayIcon className="h-5 w-5" />
        {TRAINER_MESSAGES.LAUNCH}
      </button>
    </div>
  );
};
