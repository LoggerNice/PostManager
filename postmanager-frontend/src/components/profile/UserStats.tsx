'use client';

import { Card, CardContent } from '@/components/ui';

interface UserStatsProps {
  userId: number;
}

interface StatItem {
  label: string;
  value: number;
  color: string;
}

export default function UserStats({ userId }: UserStatsProps) {
  // В реальном приложении эти данные будут получены из API для конкретного userId
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const stats: StatItem[] = [
    {
      label: 'Активные проекты',
      value: 3,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Выполненные задачи',
      value: 24,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      label: 'В работе',
      value: 7,
      color: 'text-yellow-600 dark:text-yellow-400'
    },
    {
      label: 'Просроченные',
      value: 1,
      color: 'text-red-600 dark:text-red-400'
    }
  ];

  return (
    <Card className="mb-6">
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
              <div className={`text-2xl font-bold ${stat.color} mb-1`}>
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