import React from 'react';
import { CheckIcon } from '@heroicons/react/24/solid';
import TrainerTask from './TrainerTask';
import { TRAINER_MESSAGES } from '@/constants/trainer';
import { TrainingSessionProps } from '@/types/trainer.types';

export const TrainingSession: React.FC<TrainingSessionProps> = ({
  groups,
  selectedGroupIds,
  expanded,
  trainingResults,
  attemptsByTask,
  userInfo,
  onToggleGroup,
  onTaskResult,
  onAttempt,
  onFinishTraining,
  className = ""
}) => {
  return (
    <div className={className}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
          {TRAINER_MESSAGES.TRAINING_ACTIVE}
        </h2>
        {userInfo.isGuest ? (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-blue-800 dark:text-blue-200">
              <span className="font-medium">👤 Гостевой режим:</span> {TRAINER_MESSAGES.GUEST_MODE}
            </p>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            {TRAINER_MESSAGES.TRAINING_MODE}
          </p>
        )}
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Максимум попыток на задачу: 2
        </p>
      </div>

      {/* Список групп задач */}
      <div className="space-y-4">
        {groups.filter(group => selectedGroupIds.includes(group.id) && group.name !== 'Нераспределенные задачи').map(group => (
          <div key={group.id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
            <button
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700"
              onClick={() => onToggleGroup(group.id)}
            >
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {group.name}
                </h3>
                {!expanded[group.id] && (
                  <span className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                    {group.tasks.length}
                  </span>
                )}
              </div>
              <div className={`transform transition-transform ${expanded[group.id] ? 'rotate-180' : ''}`}>
                ▼
              </div>
            </button>

            {expanded[group.id] && (
              <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                <div className="space-y-4">
                  {group.tasks.map(task => (
                    <TrainerTask
                      key={task.id}
                      task={task}
                      onResult={onTaskResult}
                      onAttempt={onAttempt}
                      maxAttempts={2}
                      attemptsCount={attemptsByTask[task.id] || 0}
                      showFeedback={true}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 text-center">
        <button
          onClick={onFinishTraining}
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mx-auto"
        >
          <CheckIcon className="h-5 w-5" />
          {TRAINER_MESSAGES.FINISH_TRAINING}
        </button>
      </div>
    </div>
  );
};
