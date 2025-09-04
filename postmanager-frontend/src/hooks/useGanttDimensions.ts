import { useState, useEffect, useRef, useMemo } from 'react';
import { UserTasksGroup } from '@/types/gantt.types';

export const useGanttDimensions = (userTasksGroups: UserTasksGroup[]) => {
    // Константы
    const leftMargin = 120;
    const rightMargin = 0; // Убираем правый отступ
    const rowHeight = 30; // Согласуем с основным компонентом
    const headerHeight = 80; // Возвращаем стандартную высоту заголовка
    
    // Состояния для размеров
    const [containerWidth, setContainerWidth] = useState(0);
    const [chartHeight, setChartHeight] = useState(400);
    
    // Получаем ссылку на контейнер для измерения ширины
    const containerRef = useRef<HTMLDivElement>(null);

    // Измеряем ширину контейнера при монтировании и изменении размера окна
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                // Пробуем получить ширину родительского элемента
                let width = containerRef.current.parentElement?.offsetWidth;
                
                // Если родительский элемент не найден или его ширина 0, используем текущий контейнер
                if (!width || width === 0) {
                    width = containerRef.current.offsetWidth;
                }
                
                // Если и это не помогло, используем ширину окна
                if (!width || width === 0) {
                    width = window.innerWidth;
                }
                
                // Минимальная ширина 800px
                width = Math.max(width, 800);
                
                setContainerWidth(width);
            }
        };

        // Первоначальное измерение с небольшой задержкой
        const initialTimeout = setTimeout(updateWidth, 100);
        
        // Дополнительное измерение после полной загрузки DOM
        const domTimeout = setTimeout(updateWidth, 500);
        
        // Измерение при изменении размера окна
        window.addEventListener('resize', updateWidth);
        
        // Измерение при изменении видимости страницы (помогает при возврате на страницу)
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                setTimeout(updateWidth, 100);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Используем ResizeObserver для более точного отслеживания изменений размера
        let resizeObserver: ResizeObserver | null = null;
        
        if (containerRef.current) {
            resizeObserver = new ResizeObserver(updateWidth);
            resizeObserver.observe(containerRef.current);
            
            // Также наблюдаем за родительским элементом, если он есть
            if (containerRef.current.parentElement) {
                resizeObserver.observe(containerRef.current.parentElement);
            }
        }
        
        return () => {
            clearTimeout(initialTimeout);
            clearTimeout(domTimeout);
            window.removeEventListener('resize', updateWidth);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
        };
    }, []);

    // Вычисляем динамические размеры
    const { chartWidth, availableWidth } = useMemo(() => {
        const width = containerWidth || 800;
        const chartWidth = Math.max(width, 800); // Минимальная ширина 800px
        
        // Адаптивный расчет доступной ширины
        const rightMargin = 0; // Убираем правый отступ
        const availableWidth = chartWidth - leftMargin - rightMargin;

        return {
            chartWidth,
            availableWidth
        };
    }, [containerWidth, leftMargin]);

    // Вычисляем высоту диаграммы динамически
    useEffect(() => {
        const totalUsers = userTasksGroups.length;
        
        if (totalUsers === 0) {
            setChartHeight(400);
            return;
        }
        
        // Вычисляем общую высоту всех секций пользователей
        let totalHeight = headerHeight;
        
        userTasksGroups.forEach((userGroup) => {
            // Высота секции пользователя = количество уровней * высота строки + отступ между пользователями
            const sectionHeight = Math.max(40, (userGroup.maxLevel + 1) * rowHeight);
            totalHeight += sectionHeight + 20; // 20px отступ между пользователями
        });
        
        // Добавляем фиксированный отступ снизу 20px
        totalHeight += 20;
        
        setChartHeight(Math.max(totalHeight, 400));
    }, [userTasksGroups, headerHeight, rowHeight]);

    return {
        containerRef,
        dimensions: {
            containerWidth,
            chartWidth,
            availableWidth,
            chartHeight,
            leftMargin,
            rightMargin,
            rowHeight,
            headerHeight
        }
    };
};
