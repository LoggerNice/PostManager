import React from 'react';
import { REPORT_STATS, TRAINER_MESSAGES } from '@/constants/trainer';
import { TrainingReportProps } from '@/types/trainer.types';

export const TrainingReport: React.FC<TrainingReportProps> = ({
  stats,
  onResetTraining,
  className = ""
}) => {
  return (
    <div className={className}>
      <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">
        {TRAINER_MESSAGES.TRAINING_REPORT}
      </h2>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.correctAnswers.length}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">{REPORT_STATS.CORRECT_ANSWERS}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            {stats.incorrectAnswers.length}
          </div>
          <div className="text-sm text-red-600 dark:text-red-400">{REPORT_STATS.INCORRECT_ANSWERS}</div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
            {stats.unansweredTasks.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{REPORT_STATS.NOT_ANSWERED}</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalTasks}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">{REPORT_STATS.TOTAL_TASKS}</div>
        </div>
      </div>

      <button
        onClick={onResetTraining}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        {TRAINER_MESSAGES.START_AGAIN}
      </button>
    </div>
  );
};
