'use client';

import React from 'react';
import { TrophyIcon } from '@heroicons/react/24/solid';
import { useGetRatingsQuery } from '@/store/api/trainer.api';

interface TrainerRatingProps {
  onClose?: () => void; // Теперь опционально, так как используется только для возврата к предыдущей вкладке
}

export default function TrainerRating({ onClose }: TrainerRatingProps) {
  const { data: ratings = [], isLoading, error } = useGetRatingsQuery();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <TrophyIcon className="h-8 w-8 text-yellow-500" />
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Рейтинг прохождения тренажа
        </h2>
      </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Загрузка рейтинга...</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 dark:text-red-400">Не удалось загрузить рейтинг</p>
          </div>
        ) : ratings.length === 0 ? (
          <div className="text-center py-12">
            <TrophyIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Пока нет результатов тренировок</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                    Место
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                    Сотрудник
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                    Отдел
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                    Всего задач
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                    Правильно
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                    Неправильно
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                    Процент успеха
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                    Дата
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800">
                {ratings.map((rating, index) => {
                  const successRate = rating.totalTasks > 0 
                    ? Math.round((rating.correctAnswers / rating.totalTasks) * 100) 
                    : 0;
                  
                  return (
                    <tr 
                      key={rating.id} 
                      className={`
                        hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                        ${index < 3 ? 'border-l-4' : ''}
                        ${index === 0 ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/10' : ''}
                        ${index === 1 ? 'border-l-gray-400 bg-gray-50 dark:bg-gray-900/10' : ''}
                        ${index === 2 ? 'border-l-orange-600 bg-orange-50 dark:bg-orange-900/10' : ''}
                      `}
                    >
                      <td className="px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-2">
                          {index === 0 && <span className="text-yellow-500">🥇</span>}
                          {index === 1 && <span className="text-gray-400">🥈</span>}
                          {index === 2 && <span className="text-orange-600">🥉</span>}
                          <span className="font-medium text-gray-900 dark:text-white">
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-600">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {rating.employee.lastName} {rating.employee.firstName}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                        {rating.employee.departmentName || 'Не указан'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-600">
                        {rating.totalTasks}
                      </td>
                      <td className="px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-600">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                          {rating.correctAnswers}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-600">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400">
                          {rating.incorrectAnswers}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm border-b border-gray-200 dark:border-gray-600">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${
                            successRate >= 80 ? 'text-green-600 dark:text-green-400' :
                            successRate >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                            'text-red-600 dark:text-red-400'
                          }`}>
                            {successRate}%
                          </span>
                          <div className="w-12 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                successRate >= 80 ? 'bg-green-500' :
                                successRate >= 60 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${successRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                        {formatDate(rating.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
