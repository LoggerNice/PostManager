'use client';

import { useEffect } from 'react';
import { ErrorProps } from '@/types';
import Link from 'next/link';

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Логирование ошибки в сервис мониторинга
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="space-y-2">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">
            Что-то пошло не так
          </h1>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
          Произошла непредвиденная ошибка. Попробуйте обновить страницу или вернуться на главную.
        </p>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left bg-gray-100 dark:bg-gray-800 p-4 rounded-lg text-sm">
            <summary className="cursor-pointer font-medium mb-2">
              Детали ошибки (только в режиме разработки)
            </summary>
            <pre className="whitespace-pre-wrap text-red-600 dark:text-red-400">
              {error.message}
            </pre>
          </details>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            Попробовать снова
          </button>
          
          <Link 
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}