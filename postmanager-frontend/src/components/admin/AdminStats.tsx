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
import { useGetAdminStatsQuery } from '@/store/api/admin.api';
import Loader from '@/components/loader/Loader';

export default function AdminStats() {
  const { data: stats, isLoading, error } = useGetAdminStatsQuery();

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
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      subtitle: `${stats.activeProjects} активных`
    },
    {
      title: 'Задачи',
      value: stats.totalTasks,
      icon: ClipboardDocumentListIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      subtitle: `${stats.completedTasks} завершенных`
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
              <div className="flex items-center">
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
              <div className="flex items-center justify-between">
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

      {/* Дополнительная информация */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Системная информация
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Загрузка системы
            </p>
            <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: '67%' }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">67% используется</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Последнее обновление
            </p>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {new Date().toLocaleString('ru-RU')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
