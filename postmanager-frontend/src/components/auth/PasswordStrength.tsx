'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

interface PasswordCriteria {
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_CRITERIA: PasswordCriteria[] = [
  {
    label: 'Минимум 6 символов',
    test: (password) => password.length >= 6
  },
  {
    label: 'Содержит цифру',
    test: (password) => /\d/.test(password)
  },
  {
    label: 'Содержит заглавную букву',
    test: (password) => /[A-ZА-Я]/.test(password)
  },
  {
    label: 'Содержит строчную букву',
    test: (password) => /[a-zа-я]/.test(password)
  }
];

export default function PasswordStrength({ password, className }: PasswordStrengthProps) {
  const strength = useMemo(() => {
    if (!password) return { score: 0, level: 'none', color: 'gray' };
    
    const passedCriteria = PASSWORD_CRITERIA.filter(criteria => criteria.test(password));
    const score = passedCriteria.length;
    
    if (score <= 1) return { score, level: 'Слабый', color: 'red' };
    if (score <= 2) return { score, level: 'Средний', color: 'yellow' };
    if (score <= 3) return { score, level: 'Хороший', color: 'blue' };
    return { score, level: 'Отличный', color: 'green' };
  }, [password]);

  if (!password) return null;

  return (
    <div className={cn('mt-2 space-y-2', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600 dark:text-gray-400">
          Надежность пароля:
        </span>
        <span className={cn(
          'text-xs font-medium',
          strength.color === 'red' && 'text-red-600 dark:text-red-400',
          strength.color === 'yellow' && 'text-yellow-600 dark:text-yellow-400',
          strength.color === 'blue' && 'text-blue-600 dark:text-blue-400',
          strength.color === 'green' && 'text-green-600 dark:text-green-400'
        )}>
          {strength.level}
        </span>
      </div>
      
      <div className="flex space-x-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              level <= strength.score
                ? strength.color === 'red' && 'bg-red-500'
                : '',
              level <= strength.score
                ? strength.color === 'yellow' && 'bg-yellow-500'
                : '',
              level <= strength.score
                ? strength.color === 'blue' && 'bg-blue-500'
                : '',
              level <= strength.score
                ? strength.color === 'green' && 'bg-green-500'
                : '',
              level > strength.score && 'bg-gray-200 dark:bg-gray-700'
            )}
          />
        ))}
      </div>
      
      <div className="space-y-1">
        {PASSWORD_CRITERIA.map((criteria, index) => {
          const passed = criteria.test(password);
          return (
            <div key={index} className="flex items-center text-xs">
              <span className={cn(
                'mr-2',
                passed ? 'text-green-500' : 'text-gray-400'
              )}>
                {passed ? '✓' : '○'}
              </span>
              <span className={cn(
                passed ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
              )}>
                {criteria.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}