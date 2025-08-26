'use client';

import { useState, useEffect } from 'react';
import Button from './Button';

interface WeekNavigationProps {
    currentWeek: Date;
    onWeekChange: (weekStart: Date) => void;
}

export default function WeekNavigation({ currentWeek, onWeekChange }: WeekNavigationProps) {
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(new Date());

    useEffect(() => {
        // Вычисляем начало недели для отображения
        const dayOfWeek = currentWeek.getDay();
        let startOfWeek: Date;
        
        if (dayOfWeek === 0) { // Воскресенье
            startOfWeek = new Date(currentWeek);
            startOfWeek.setDate(currentWeek.getDate() + 1); // Следующий понедельник
        } else if (dayOfWeek === 6) { // Суббота
            startOfWeek = new Date(currentWeek);
            startOfWeek.setDate(currentWeek.getDate() + 2); // Следующий понедельник
        } else { // Рабочие дни
            startOfWeek = new Date(currentWeek);
            startOfWeek.setDate(currentWeek.getDate() - dayOfWeek + 1); // Текущий понедельник
        }
        
        setCurrentWeekStart(startOfWeek);
    }, [currentWeek]);

    const goToPreviousWeek = () => {
        const prevWeek = new Date(currentWeekStart);
        prevWeek.setDate(prevWeek.getDate() - 7);
        onWeekChange(prevWeek);
    };

    const goToNextWeek = () => {
        const nextWeek = new Date(currentWeekStart);
        nextWeek.setDate(nextWeek.getDate() + 7);
        onWeekChange(nextWeek);
    };

    const goToCurrentWeek = () => {
        onWeekChange(new Date());
    };

    const formatWeekRange = (startDate: Date) => {
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 4); // Пятница
        
        const startFormatted = startDate.toLocaleDateString('ru-RU', { 
            day: '2-digit', 
            month: 'short' 
        });
        const endFormatted = endDate.toLocaleDateString('ru-RU', { 
            day: '2-digit', 
            month: 'short' 
        });
        
        return `${startFormatted} - ${endFormatted}`;
    };

    const isCurrentWeek = () => {
        const today = new Date();
        const todayStartOfWeek = new Date(today);
        const dayOfWeek = today.getDay();
        
        if (dayOfWeek === 0) {
            todayStartOfWeek.setDate(today.getDate() + 1);
        } else if (dayOfWeek === 6) {
            todayStartOfWeek.setDate(today.getDate() + 2);
        } else {
            todayStartOfWeek.setDate(today.getDate() - dayOfWeek + 1);
        }
        
        // Сравниваем только даты, игнорируя время
        const currentWeekDate = new Date(currentWeekStart.getFullYear(), currentWeekStart.getMonth(), currentWeekStart.getDate());
        const todayWeekDate = new Date(todayStartOfWeek.getFullYear(), todayStartOfWeek.getMonth(), todayStartOfWeek.getDate());
        
        return currentWeekDate.getTime() === todayWeekDate.getTime();
    };

    return (
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center space-x-2">
                <Button
                    onClick={goToPreviousWeek}
                    variant="outline"
                    size="sm"
                    className="px-3 py-1"
                >
                    ← Предыдущая неделя
                </Button>
                
                <Button
                    onClick={goToCurrentWeek}
                    variant={isCurrentWeek() ? "primary" : "outline"}
                    size="sm"
                    className="px-3 py-1"
                >
                    Текущая неделя
                </Button>
                
                <Button
                    onClick={goToNextWeek}
                    variant="outline"
                    size="sm"
                    className="px-3 py-1"
                >
                    Следующая неделя →
                </Button>
            </div>
            
            <div className="text-center">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {formatWeekRange(currentWeekStart)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                    Рабочая неделя (пн-пт)
                </div>
            </div>
        </div>
    );
}
