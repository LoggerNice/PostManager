'use client';

import { useState, useEffect } from 'react';
import { 
  DocumentTextIcon, 
  FunnelIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useGetSystemLogsQuery } from '@/store/api/admin.api';
import { SystemLog } from '@/types/admin.types';
import { Button } from '@/components/ui/button/Button';
import { Select } from '@/components/ui/select/Select';
import Loader from '@/components/loader/Loader';

export default function SystemLogs() {
  const [currentPage, setCurrentPage] = useState(1);
  const [levelFilter, setLevelFilter] = useState<string>('');
  const [autoRefresh, setAutoRefresh] = useState(false);

  const { data: logs = [], isLoading, refetch } = useGetSystemLogsQuery({
    page: currentPage,
    limit: 50,
    level: levelFilter || undefined
  });

  // Автообновление каждые 30 секунд
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        refetch();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refetch]);

  const levelOptions = [
    { value: '', label: 'Все уровни' },
    { value: 'INFO', label: 'Информация' },
    { value: 'WARN', label: 'Предупреждения' },
    { value: 'ERROR', label: 'Ошибки' }
  ];

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'WARN':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />;
      case 'INFO':
      default:
        return <InformationCircleIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'WARN':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'INFO':
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ru-RU');
  };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <DocumentTextIcon className="h-5 w-5 mr-2" />
          Системные логи
        </h2>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span>Автообновление</span>
            </label>
          </div>
          <Button onClick={() => refetch()} variant="secondary" className='bg-blue-500 hover:bg-blue-600 flex items-center'>
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            <span className='text-white'>Обновить</span>
          </Button>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <FunnelIcon className="h-5 w-5 text-gray-400" />
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Select
                label="Уровень"
                value={levelFilter}
                onChange={(e) => {
                  setLevelFilter(e.target.value);
                  setCurrentPage(1);
                }}
                options={levelOptions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Список логов */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-8 text-center">
            <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Логи не найдены
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Время
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Уровень
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Действие
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Сообщение
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Пользователь
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getLevelIcon(log.level)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLevelBadgeColor(log.level)}`}>
                          {log.level}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs">
                        {log.action}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="max-w-xs truncate" title={log.message}>
                        {log.message}
                      </div>
                      {log.details && (
                        <details className="mt-1">
                          <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
                            Подробности
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded overflow-auto">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {log.userName || 'Система'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Пагинация */}
      {logs.length >= 50 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              variant="secondary"
            >
              Назад
            </Button>
            <span className="text-sm text-gray-700 dark:text-gray-300 px-4">
              Страница {currentPage}
            </span>
            <Button
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={logs.length < 50}
              variant="secondary"
            >
              Далее
            </Button>
          </div>
        </div>
      )}

      {/* Информация */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Информация о логах:</strong>
            </p>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
              <li>Логи автоматически очищаются через 30 дней</li>
              <li>Включите автообновление для мониторинга в реальном времени</li>
              <li>Уровень ERROR требует немедленного внимания</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
