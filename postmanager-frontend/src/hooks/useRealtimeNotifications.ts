'use client';

import { useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface UseRealtimeNotificationsProps {
  data: any[];
  isLoading: boolean;
  dataName: string;
}

export function useRealtimeNotifications({ data, isLoading, dataName }: UseRealtimeNotificationsProps) {
  const previousDataRef = useRef<any[]>([]);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (isLoading || !data) return;

    // Пропускаем первую загрузку
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      previousDataRef.current = data;
      return;
    }

    const previousData = previousDataRef.current;
    
    // Проверяем новые элементы
    const newItems = data.filter(item => 
      !previousData.some(prevItem => prevItem.id === item.id)
    );

    // Проверяем удаленные элементы
    const removedItems = previousData.filter(prevItem => 
      !data.some(item => item.id === prevItem.id)
    );

    // Уведомления о новых элементах
    if (newItems.length > 0) {
      const message = newItems.length === 1 
        ? `Добавлен новый ${dataName.toLowerCase()}: ${newItems[0].title || newItems[0].name}`
        : `Добавлено ${newItems.length} новых ${dataName.toLowerCase()}`;
      
      toast.success(message, {
        duration: 60000,
        icon: '🆕'
      });
    }

    // Уведомления об удаленных элементах
    if (removedItems.length > 0) {
      const message = removedItems.length === 1 
        ? `${dataName} удален: ${removedItems[0].title || removedItems[0].name}`
        : `Удалено ${removedItems.length} ${dataName.toLowerCase()}`;
      
      toast.error(message, {
        duration: 60000,
        icon: '🗑️'
      });
    }

    previousDataRef.current = data;
  }, [data, isLoading, dataName]);
}