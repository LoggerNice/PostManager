'use client';

import React, { useState, useMemo } from 'react';
import { CheckIcon, LightBulbIcon } from '@heroicons/react/24/solid';

interface Task {
  id: number;
  title: string;
  description: string;
  command: string;
  hint?: string;
  group: string;
}

interface TaskProps {
  task: Task;
  onResult?: (taskId: number, isCorrect: boolean) => void;
  onAttempt?: (taskId: number, isCorrect: boolean) => void;
  maxAttempts?: number;
  attemptsCount?: number;
  showFeedback?: boolean;
}

interface Feedback {
  message: string;
  isSuccess: boolean;
  show: boolean;
}

export default function TrainerTask({ 
  task, 
  onResult, 
  onAttempt, 
  maxAttempts = 2, 
  attemptsCount = 0, 
  showFeedback = false 
}: TaskProps) {
  const [showHint, setShowHint] = useState(false);
  const [userCommand, setUserCommand] = useState('');
  const [feedback, setFeedback] = useState<Feedback>({ 
    message: '', 
    isSuccess: false, 
    show: false 
  });
  const [hasAnswered, setHasAnswered] = useState(false);

  const isOutOfAttempts = useMemo(() => attemptsCount >= maxAttempts, [attemptsCount, maxAttempts]);

  const checkCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userCommand.trim()) {
      displayFeedback('Введите команду для проверки', false);
      return;
    }

    const isCorrect = compareCommands(userCommand, task.command);
    if (onAttempt) {
      onAttempt(task.id, isCorrect);
    }
    
    // Сохраняем результат если передан callback
    if (onResult) {
      onResult(task.id, isCorrect);
    }
    
    const nextAttempts = attemptsCount + 1;
    const shouldLock = isCorrect || nextAttempts >= maxAttempts;
    if (shouldLock) {
      setHasAnswered(true);
    }
    
    if (showFeedback) {
      displayFeedback(
        isCorrect ? '✅ Правильно! Отличная работа!' : '❌ Неверно. Попробуйте еще раз.',
        isCorrect
      );
    } else {
      displayFeedback(
        isCorrect ? '✅ Правильно!' : `❌ Неверно. Правильная команда: ${task.command}`,
        isCorrect
      );
    }
  };

  const compareCommands = (userCmd: string, correctCmd: string): boolean => {
    const normalize = (cmd: string) => cmd.toLowerCase().replace(/\s+/g, ' ').trim();
    return normalize(userCmd) === normalize(correctCmd);
  };

  const displayFeedback = (message: string, isSuccess: boolean) => {
    setFeedback({ message, isSuccess, show: true });
    setTimeout(() => {
      setFeedback(prev => ({ ...prev, show: false }));
    }, 3000);
  };

  return (
    <div className={`p-4 border rounded-lg transition-colors ${
      (hasAnswered || isOutOfAttempts) 
        ? 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700' 
        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
    }`}>
      <h4 className="font-medium text-gray-900 dark:text-white mb-2">{task.title}</h4>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{task.description}</p>
      
      <form onSubmit={checkCommand} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed font-mono text-sm"
            value={userCommand}
            onChange={(e) => setUserCommand(e.target.value)}
            placeholder="Введите команду..."
            spellCheck="false"
            disabled={hasAnswered || isOutOfAttempts}
          />
          <button 
            type={hasAnswered || isOutOfAttempts ? "button" : "submit"}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={hasAnswered || isOutOfAttempts}
          >
            <CheckIcon className="h-4 w-4" />
            {hasAnswered || isOutOfAttempts ? 'Отвечено' : 'Проверить'}
          </button>
        </div>
        
        <div className="flex items-center justify-between">
          <button 
            type="button"
            className="flex items-center gap-2 px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            onClick={() => setShowHint(!showHint)}
          >
            <LightBulbIcon className="h-4 w-4" />
            Подсказка
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Попытки: {attemptsCount} / {maxAttempts}
          </div>
        </div>
      </form>

      {feedback.show && (
        <div className={`mt-3 p-3 rounded-lg text-sm ${
          feedback.isSuccess 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
        }`}>
          {feedback.message}
        </div>
      )}
      
      {showHint && task.hint && (
        <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div 
            className="text-sm text-yellow-800 dark:text-yellow-200"
            dangerouslySetInnerHTML={{ __html: task.hint }}
          />
        </div>
      )}
    </div>
  );
}
