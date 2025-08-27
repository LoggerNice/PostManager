import { useState, useEffect, useRef, useMemo } from 'react';
import { UserTasksGroup } from '@/types/gantt.types';

export const useGanttDimensions = (userTasksGroups: UserTasksGroup[]) => {
    // Константы
    const leftMargin = 120;
    const rightMargin = 100;
    const rowHeight = 30;
    const headerHeight = 80;
    
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
        const rightMargin = Math.max(20, Math.min(50, width * 0.05)); // 5% от ширины, минимум 20px
        const availableWidth = chartWidth - leftMargin - rightMargin;

        return {
            chartWidth,
            availableWidth
        };
    }, [containerWidth, leftMargin]);

    // Вычисляем высоту диаграммы динамически
    useEffect(() => {
        const totalUsers = userTasksGroups.length;
        
        const maxLevels = userTasksGroups.length > 0 
            ? Math.max(...userTasksGroups.map(group => group.maxLevel + 1), 1)
            : 1;
            
        const calculatedHeight = headerHeight + (totalUsers * (maxLevels * rowHeight + 40)) + 80;
        setChartHeight(Math.max(calculatedHeight, 400));
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
