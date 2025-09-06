'use client';

import { Card, CardContent } from '@/components/ui';
import { useGetUserTasksQuery } from '@/store/api/task.api';
import { TaskStatus } from '@/types/task.types';
import { useMemo } from 'react';

interface UserStatsProps {
  userId: number;
}

interface StatItem {
  label: string;
  value: number;
  color: string;
  icon: string;
}

export default function UserStats({ userId }: UserStatsProps) {
  const { data: userTasks = [], isLoading, error } = useGetUserTasksQuery(userId);

  const stats = useMemo(() => {
    if (!userTasks.length) {
      return [
        {
          label: 'Активные проекты',
          value: 0,
          color: 'text-blue-600 dark:text-blue-400',
          icon: '📊'
        },
        {
          label: 'Выполненные задачи',
          value: 0,
          color: 'text-green-600 dark:text-green-400',
          icon: '✅'
        },
        {
          label: 'В работе',
          value: 0,
          color: 'text-yellow-600 dark:text-yellow-400',
          icon: '🔄'
        },
        {
          label: 'Просроченные',
          value: 0,
          color: 'text-red-600 dark:text-red-400',
          icon: '⚠️'
        }
      ];
    }

    const completedTasks = userTasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    const inProgressTasks = userTasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
    const problemTasks = userTasks.filter(task => task.status === TaskStatus.PROBLEM).length;
    
    // Подсчитываем просроченные задачи
    const now = new Date();
    const overdueTasks = userTasks.filter(task => {
      if (!task.deadline) return false;
      const deadline = new Date(task.deadline);
      return deadline < now && task.status !== TaskStatus.COMPLETED;
    }).length;

    // Подсчитываем уникальные проекты
    const uniqueProjects = new Set(userTasks.map(task => task.projectId)).size;

    return [
      {
        label: 'Активные проекты',
        value: uniqueProjects,
        color: 'text-blue-600 dark:text-blue-400',
        icon: '📊'
      },
      {
        label: 'Выполненные задачи',
        value: completedTasks,
        color: 'text-green-600 dark:text-green-400',
        icon: '✅'
      },
      {
        label: 'В работе',
        value: inProgressTasks,
        color: 'text-yellow-600 dark:text-yellow-400',
        icon: '🔄'
      },
      {
        label: 'Просроченные',
        value: overdueTasks,
        color: 'text-red-600 dark:text-red-400',
        icon: '⚠️'
      }
    ];
  }, [userTasks]);

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardContent>
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mb-6">
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500">Ошибка при загрузке статистики</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-4 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border border-gray-200 dark:border-gray-700">
              <div className="text-2xl mb-2">{stat.icon}</div>
              <div className={`text-3xl font-bold ${stat.color} mb-1`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}