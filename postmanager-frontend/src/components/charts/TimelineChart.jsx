import React, { useState, useEffect, useMemo } from 'react';

const TimelineChart = ({ timelineData, userTasksGroups }) => {
    // Состояния для размеров
    const [containerWidth, setContainerWidth] = useState(0);
    const [chartHeight, setChartHeight] = useState(400);
    
    // Константы
    const leftMargin = 150;
    const rightMargin = 50;
    const rowHeight = 30;
    const headerHeight = 80;
    const footerHeight = 80;

    // Получаем ссылку на контейнер для измерения ширины
    const containerRef = React.useRef(null);

    // Измеряем ширину контейнера при монтировании и изменении размера окна
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    // Убеждаемся, что userTasksGroups является массивом
    const safeUserTasksGroups = Array.isArray(userTasksGroups) ? userTasksGroups : [];

    // Вычисляем динамические размеры с проверками
    const { chartWidth, daySpacing, availableWidth } = useMemo(() => {
        const width = containerWidth || 800;
        const chartWidth = width - 32;
        
        // Убеждаемся, что timelineData существует
        const dates = timelineData?.dates;
        const datesCount = Array.isArray(dates) ? dates.length : 5;
        
        const availableWidth = chartWidth - leftMargin - rightMargin;
        const daySpacing = datesCount > 1 
            ? availableWidth / Math.max(datesCount - 1, 1)
            : availableWidth / 5;

        return {
            chartWidth,
            daySpacing,
            availableWidth
        };
    }, [containerWidth, timelineData]);

    // Вычисляем высоту диаграммы динамически
    useEffect(() => {
        const groups = Array.isArray(userTasksGroups) ? userTasksGroups : [];
        const totalUsers = groups.length;
        
        const maxLevels = groups.length > 0 
            ? Math.max(...groups.map(group => (group?.maxLevel || 0) + 1), 1)
            : 1;
            
        const calculatedHeight = headerHeight + (totalUsers * (maxLevels * rowHeight + 40)) + footerHeight;
        setChartHeight(Math.max(calculatedHeight, 400));
    }, [userTasksGroups]);

    // Функция форматирования имени
    const formatName = (fullName) => {
        if (!fullName || typeof fullName !== 'string') return '';
        const parts = fullName.trim().split(/\s+/);
        if (parts.length < 2) return fullName;
        
        const lastName = parts[0];
        const initials = parts.slice(1).map(part => part.charAt(0) + '.').join('');
        return lastName + ' ' + initials;
    };

    // Дни недели
    const dayNames = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

    // Проверка на загрузку данных
    if (!timelineData) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg px-6 pb-6 shadow-lg w-full">
                <div className="flex justify-center items-center h-64">
                    <div className="text-gray-500 dark:text-gray-400">Загрузка данных...</div>
                </div>
            </div>
        );
    }

    // Данные для отображения дней
    const displayDates = Array.isArray(timelineData.dates) ? timelineData.dates : [];
    const timelineStart = timelineData.timelineRange?.start || new Date();

    return (
        <div 
            ref={containerRef}
            className="bg-white dark:bg-gray-800 rounded-lg px-6 pb-6 shadow-lg w-full"
        >
            <div className="w-full overflow-x-auto">
                <svg 
                    width={chartWidth} 
                    height={chartHeight} 
                    className="w-full min-w-full"
                    style={{ minWidth: `${chartWidth}px` }}
                >
                    {/* Заголовки дней */}
                    {displayDates.map((date, index) => {
                        if (!date) return null;
                        
                        const dateObj = date instanceof Date ? date : new Date(date);
                        const position = index * daySpacing;
                        const today = new Date();
                        const isToday = dateObj.toDateString() === today.toDateString();
                        const dayOfWeek = dateObj.getDay();
                        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                        
                        return (
                            <g key={`date-${index}`}>
                                {/* Дата */}
                                <text
                                    x={leftMargin + position}
                                    y={20}
                                    className={`text-xs font-medium ${
                                        isToday ? 'fill-blue-500 font-bold' : 
                                        isWeekend ? 'fill-red-500' : 
                                        'fill-gray-600 dark:fill-gray-400'
                                    }`}
                                    textAnchor="middle"
                                >
                                    {dateObj.getDate()}
                                </text>
                                
                                {/* День недели */}
                                <text
                                    x={leftMargin + position}
                                    y={40}
                                    className={`text-xs ${
                                        isToday ? 'font-bold fill-blue-500' :
                                        isWeekend ? 'font-medium fill-red-500' :
                                        'fill-gray-500 dark:fill-gray-500'
                                    }`}
                                    textAnchor="middle"
                                >
                                    {dayNames[dayOfWeek] || 'Пн'}
                                </text>
                                
                                {/* Вертикальные линии сетки */}
                                <line
                                    x1={leftMargin + position}
                                    y1={50}
                                    x2={leftMargin + position}
                                    y2={chartHeight - 60}
                                    stroke={isToday ? '#3b82f6' : isWeekend ? '#ef4444' : '#e5e7eb'}
                                    strokeWidth={isToday ? 2 : 1}
                                    opacity={isToday ? 1 : 0.5}
                                    className="dark:stroke-gray-600"
                                />
                            </g>
                        );
                    })}

                    {/* Пользователи и их задачи */}
                    {(() => {
                        let currentY = 70;
                        return safeUserTasksGroups.map((userGroup, groupIndex) => {
                            if (!userGroup || !userGroup.user) return null;
                            
                            const sectionHeight = Math.max(40, ((userGroup.maxLevel || 0) + 1) * rowHeight);
                            const userY = currentY;
                            currentY += sectionHeight + 20;
                            
                            return (
                                <g key={userGroup.user.id || `user-${groupIndex}`}>
                                    {/* Горизонтальная разделительная линия */}
                                    {groupIndex > 0 && (
                                        <line
                                            x1={0}
                                            y1={userY - 10}
                                            x2={chartWidth}
                                            y2={userY - 10}
                                            stroke="#d1d5db"
                                            strokeWidth={1}
                                            opacity={0.6}
                                            className="dark:stroke-gray-600"
                                        />
                                    )}
                                    
                                    {/* Имя пользователя */}
                                    <text
                                        x={leftMargin - 10}
                                        y={userY + 20}
                                        textAnchor="end"
                                        className="text-sm fill-gray-700 dark:fill-gray-200 font-medium"
                                    >
                                        {formatName(userGroup.user.name)}
                                    </text>
                                    
                                    {/* Задачи пользователя */}
                                    {Array.isArray(userGroup.tasks) && userGroup.tasks.map((task) => {
                                        if (!task) return null;
                                        
                                        try {
                                            const startDate = new Date(task.startDate);
                                            const endDate = new Date(task.endDate);
                                            const timelineStartDate = new Date(timelineStart);
                                            
                                            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                                                return null;
                                            }
                                            
                                            const taskStartTime = startDate.getTime();
                                            const taskEndTime = endDate.getTime();
                                            const timelineStartTime = timelineStartDate.getTime();
                                            
                                            // Рассчитываем позиции задачи
                                            const startOffsetDays = (taskStartTime - timelineStartTime) / (24 * 60 * 60 * 1000);
                                            const durationDays = Math.max((taskEndTime - taskStartTime) / (24 * 60 * 60 * 1000), 1);
                                            
                                            const startX = leftMargin + startOffsetDays * daySpacing;
                                            const barWidth = Math.max(durationDays * daySpacing, 60);
                                            
                                            // Ограничиваем в пределах диаграммы
                                            const actualStartX = Math.max(startX, leftMargin);
                                            const actualEndX = Math.min(startX + barWidth, chartWidth - rightMargin);
                                            const finalWidth = Math.max(actualEndX - actualStartX, 60);
                                            
                                            const taskY = userY + 5 + (task.level || 0) * rowHeight;

                                            // Цвета для разных статусов
                                            const colorMap = {
                                                green: '#22c55e',
                                                red: '#ef4444',
                                                yellow: '#eab308', 
                                                white: '#6b7280'
                                            };

                                            const borderColorMap = {
                                                green: '#16a34a',
                                                red: '#dc2626',
                                                yellow: '#d97706', 
                                                white: '#4b5563'
                                            };

                                            return (
                                                <g key={`${userGroup.user.id}-${task.id}`}>
                                                    {/* Полоса задачи */}
                                                    <rect
                                                        x={actualStartX}
                                                        y={taskY}
                                                        width={finalWidth}
                                                        height={24}
                                                        fill={colorMap[task.color] || colorMap.white}
                                                        stroke={borderColorMap[task.color] || borderColorMap.white}
                                                        strokeWidth={2}
                                                        opacity={0.8}
                                                        rx={4}
                                                        className="cursor-pointer hover:opacity-100 transition-all duration-200"
                                                        onClick={() => {
                                                            if (typeof handleTaskClick === 'function') {
                                                                handleTaskClick(task);
                                                            }
                                                        }}
                                                    />

                                                    {/* Текст с названием задачи */}
                                                    <text
                                                        x={actualStartX + 8}
                                                        y={taskY + 16}
                                                        className="text-xs fill-white font-medium"
                                                        style={{ 
                                                            pointerEvents: 'none',
                                                            maxWidth: `${Math.max(finalWidth - 16, 0)}px`,
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        {task.title?.length > 25 
                                                            ? `${task.title.substring(0, 25)}...` 
                                                            : task.title || 'Без названия'
                                                        }
                                                    </text>
                                                </g>
                                            );
                                        } catch (error) {
                                            console.warn('Error rendering task:', task, error);
                                            return null;
                                        }
                                    })}
                                </g>
                            );
                        });
                    })()}
                </svg>
            </div>

            {/* Легенда статусов задач */}
            <div className="mt-4">
                <div className="flex justify-start flex-wrap gap-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Выполнено</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Просрочено</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">До дедлайна ≤ 2 дня</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-gray-500 rounded"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-300">Обычные задачи</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TimelineChart;