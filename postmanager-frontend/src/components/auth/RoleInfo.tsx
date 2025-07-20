'use client';

import { useState } from 'react';
import { UserRole, USER_ROLE_LABELS } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';

interface RoleInfoProps {
  selectedRole?: string;
}

const ROLE_DESCRIPTIONS = {
  [UserRole.ADMIN]: {
    description: 'Полный доступ ко всем функциям системы',
    permissions: [
      'Управление пользователями и ролями',
      'Создание и удаление проектов',
      'Управление отделами',
      'Доступ к системной аналитике',
      'Настройка системы'
    ]
  },
  [UserRole.MANAGER]: {
    description: 'Управление проектами и командой',
    permissions: [
      'Создание и редактирование проектов',
      'Назначение задач участникам',
      'Просмотр отчетов по проектам',
      'Управление участниками проектов'
    ]
  },
  [UserRole.USER]: {
    description: 'Участие в проектах и выполнение задач',
    permissions: [
      'Просмотр назначенных проектов',
      'Выполнение и обновление задач',
      'Комментирование задач',
      'Просмотр календаря проектов'
    ]
  }
} as const;

export default function RoleInfo({ selectedRole }: RoleInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!selectedRole || !ROLE_DESCRIPTIONS[selectedRole as UserRole]) {
    return null;
  }

  const roleInfo = ROLE_DESCRIPTIONS[selectedRole as UserRole];

  return (
    <Card className="mt-4 border-blue-200 dark:border-blue-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="text-blue-700 dark:text-blue-300">
            Роль: {USER_ROLE_LABELS[selectedRole as UserRole]}
          </span>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 text-xs"
          >
            {isExpanded ? 'Скрыть' : 'Подробнее'}
          </button>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {roleInfo.description}
        </p>
        
        {isExpanded && (
          <div className="mt-3">
            <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
              Доступные возможности:
            </h4>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
              {roleInfo.permissions.map((permission, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-green-500 mr-2">•</span>
                  {permission}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}