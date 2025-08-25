import React from 'react';
import { BeakerIcon, PlayIcon } from '@heroicons/react/24/solid';
import { TRAINER_MESSAGES } from '@/constants/trainer';
import { TrainerWelcomeProps } from '@/types/trainer.types';

export const TrainerWelcome: React.FC<TrainerWelcomeProps> = ({
  onStartTraining,
  className = ""
}) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="max-w-md mx-auto">
        <BeakerIcon className="h-16 w-16 text-blue-600 mx-auto mb-6" />
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
          {TRAINER_MESSAGES.WELCOME_TITLE}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {TRAINER_MESSAGES.WELCOME_DESCRIPTION}
        </p>
        <button
          onClick={onStartTraining}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
        >
          <PlayIcon className="h-5 w-5" />
          {TRAINER_MESSAGES.LAUNCH}
        </button>
      </div>
    </div>
  );
};
