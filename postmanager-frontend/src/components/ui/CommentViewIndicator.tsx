'use client';

import React, { memo } from 'react';
import { Check, CheckCheck } from 'lucide-react';

interface CommentViewStats {
  commentId: number;
  totalRequiredViewers: number;
  viewedUsers: number;
  viewStatus: 'none' | 'partial' | 'all';
  viewers: Array<{
    userId: number;
    userName: string;
    viewedAt: string;
  }>;
  allUsers: Array<{
    userId: number;
    userName: string;
    role: 'assignee' | 'creator';
    hasViewed: boolean;
  }>;
  assignees: Array<{
    userId: number;
    userName: string;
    hasViewed: boolean;
  }>;
  creator: {
    userId: number;
    userName: string;
    hasViewed: boolean;
  } | null;
}

interface CommentViewIndicatorProps {
  stats: CommentViewStats;
  currentUserId: number;
  commentAuthorId: number;
  className?: string;
}

export const CommentViewIndicator: React.FC<CommentViewIndicatorProps> = memo(({
  stats,
  currentUserId,
  commentAuthorId,
  className = ''
}) => {

  const getViewIcon = () => {
    switch (stats.viewStatus) {
      case 'none':
        return <Check className="w-4 h-4 text-gray-400" />; // Одна серая галочка - отправлено
      case 'partial':
        return <Check className="w-4 h-4 text-blue-500" />; // Одна синяя галочка - частично прочитано
      case 'all':
        return <CheckCheck className="w-4 h-4 text-green-500" />; // Две зеленые галочки - все прочитали
      default:
        return null;
    }
  };

  const getTooltipText = () => {
    if (stats.viewStatus === 'none') {
      return 'Ваше сообщение еще не просмотрено';
    } else if (stats.viewStatus === 'partial') {
      const viewedNames = stats.viewers.map(v => v.userName).join(', ');
      const remainingCount = stats.totalRequiredViewers - stats.viewedUsers;
      return `Просмотрели: ${viewedNames}${remainingCount > 0 ? `\nОсталось: ${remainingCount} чел.` : ''}`;
    } else if (stats.viewStatus === 'all') {
      const viewedNames = stats.viewers.map(v => v.userName).join(', ');
      return `Все участники просмотрели ваше сообщение:\n${viewedNames}`;
    }
    return '';
  };

  // Показываем индикатор только автору комментария
  if (currentUserId !== commentAuthorId) {
    return null;
  }

  // Добавляем дополнительную проверку на валидность данных
  if (!stats || !stats.viewStatus || stats.commentId === undefined) {
    return null;
  }

  // Проверяем, что данные статистики корректны
  if (stats.totalRequiredViewers === undefined || stats.viewedUsers === undefined) {
    return null;
  }

  return (
    <div 
      className={`flex items-center gap-1 ${className}`}
      title={getTooltipText()}
    >
      {getViewIcon()}
      {stats.viewStatus === 'partial' && (
        <span className="text-xs text-gray-500">
          {stats.viewedUsers}/{stats.totalRequiredViewers}
        </span>
      )}
    </div>
  );
});

CommentViewIndicator.displayName = 'CommentViewIndicator';

export type { CommentViewStats }; 