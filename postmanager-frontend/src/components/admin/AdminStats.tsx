'use client';

import { 
  UsersIcon, 
  FolderIcon, 
  ClipboardDocumentListIcon, 
  BuildingOfficeIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { useGetAdminStatsQuery, useGetSystemMetricsQuery } from '@/store/api/admin.api';
import Loader from '@/components/loader/Loader';

export default function AdminStats() {
  const { data: stats, isLoading, error } = useGetAdminStatsQuery();
  const { data: systemMetrics, isLoading: metricsLoading, error: metricsError } = useGetSystemMetricsQuery();

  if (isLoading) return <Loader />;
  if (error || !stats) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Ошибка загрузки статистики</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Пользователи',
      value: stats.totalUsers,
      icon: UsersIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      title: 'Проекты',
      value: stats.totalProjects,
      icon: FolderIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      title: 'Задачи',
      value: stats.totalTasks - stats.completedTasks,
      icon: ClipboardDocumentListIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      title: 'Отделы',
      value: stats.totalDepartments,
      icon: BuildingOfficeIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    }
  ];

  const taskStats = [
    {
      title: 'Выполненные задачи',
      value: stats.completedTasks,
      icon: CheckCircleIcon,
      color: 'text-green-500'
    },
    {
      title: 'В работе',
      value: stats.pendingTasks,
      icon: ClockIcon,
      color: 'text-blue-500'
    },
    {
      title: 'Просроченные проекты',
      value: stats.overdueProjects,
      icon: ExclamationTriangleIcon,
      color: 'text-red-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Основная статистика */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Общая статистика
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card) => (
            <div
              key={card.title}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center flex-wrap">
                <div className={`p-3 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div className="ml-4">
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {card.title}
                  </h3>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {card.value}
                  </p>
                  {card.subtitle && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {card.subtitle}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Статистика по задачам */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Статистика задач
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {taskStats.map((stat) => (
            <div
              key={stat.title}
              className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between flex-wrap">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Системные метрики */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Системные метрики
        </h3>
        {metricsLoading ? (
          <div className="text-center py-4">
            <Loader />
          </div>
        ) : metricsError ? (
          <div className="text-center py-4">
            <p className="text-red-500">Ошибка загрузки метрик</p>
            {process.env.NODE_ENV === 'development' && (
              <p className="text-xs text-gray-500 mt-2">
                {JSON.stringify(metricsError)}
              </p>
            )}
          </div>
         ) : systemMetrics ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* CPU */}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Использование CPU
              </p>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    systemMetrics.cpu.usage > 80 ? 'bg-red-500' : 
                    systemMetrics.cpu.usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${systemMetrics.cpu.usage}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {systemMetrics.cpu.usage}% ({systemMetrics.cpu.cores} ядер)
              </p>
            </div>

            {/* Память */}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Использование памяти
              </p>
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-2">
                <div 
                  className={`h-3 rounded-full transition-all duration-300 ${
                    systemMetrics.memory.usagePercent > 85 ? 'bg-red-500' : 
                    systemMetrics.memory.usagePercent > 70 ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${systemMetrics.memory.usagePercent}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {systemMetrics.memory.usagePercent}% ({Math.round(systemMetrics.memory.used / 1024 / 1024 / 1024 * 10) / 10} GB / {Math.round(systemMetrics.memory.total / 1024 / 1024 / 1024 * 10) / 10} GB)
              </p>
            </div>


             {/* Время работы */}
             <div>
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                 Время работы системы
               </p>
               <p className="text-sm font-medium text-gray-900 dark:text-white">
                 {Math.floor(systemMetrics.uptime / 3600)}ч {Math.floor((systemMetrics.uptime % 3600) / 60)}м
               </p>
             </div>

             {/* Последнее обновление */}
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Последнее обновление
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(systemMetrics.timestamp).toLocaleTimeString('ru-RU')}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-500">Метрики недоступны</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Обновить
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
