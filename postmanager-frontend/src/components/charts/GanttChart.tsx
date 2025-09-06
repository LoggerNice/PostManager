import { useMemo, useState, useEffect } from 'react';
import { useDepartmentTasks } from '@/hooks/useDepartmentTasks';
import { useGanttData } from '@/hooks/useGanttData';
import { useGanttDimensions } from '@/hooks/useGanttDimensions';
import { calculateTimelineData } from '@/utils/ganttUtils';
import { DepartmentTasksGanttChartProps, GanttTask } from '@/types/gantt.types';
import { Task } from '@/types/task.types';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import { useDispatch } from 'react-redux';
import { api } from '@/store/api/api';
import TimelineHeader from './TimelineHeader';
import UserRow from './UserRow';
import GanttLegend from './GanttLegend';
import TaskDetailsModal from '../projectComponents/task/TaskDetailsModal';

export default function GanttChart({ selectedWeek }: DepartmentTasksGanttChartProps) {
    const { currentUser, departmentId, departmentUsers, departmentTasks, isLoading, refetchTasks } = useDepartmentTasks();
    const { subscribeToTaskEvents, subscribeToUserTaskEvents, isConnected } = useWebSocketContext();
    const dispatch = useDispatch();
    
    // Состояние для модального окна
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Вычисляем данные временной шкалы
    const timelineData = useMemo(() => calculateTimelineData(selectedWeek), [selectedWeek]);

    // Получаем данные для диаграммы
    const userTasksGroups = useGanttData(departmentTasks, departmentUsers, timelineData);

    // Получаем размеры диаграммы
    const { containerRef, dimensions } = useGanttDimensions(userTasksGroups);

    // Функция для принудительной инвалидации кэша
    const invalidateTaskCache = () => {
        dispatch(api.util.invalidateTags(['Task']));
        refetchTasks();
    };

    // Обновляем размеры при изменении selectedWeek и при монтировании
    useEffect(() => {
        if (containerRef.current) {
            const updateWidth = () => {
                // Принудительно обновляем размеры
                window.dispatchEvent(new Event('resize'));
            };
            
            // Обновляем размеры сразу и с задержкой
            updateWidth();
            const timeoutId = setTimeout(updateWidth, 100);
            const delayedTimeoutId = setTimeout(updateWidth, 500);
            
            return () => {
                clearTimeout(timeoutId);
                clearTimeout(delayedTimeoutId);
            };
        }
    }, [selectedWeek, containerRef]);

    // Дополнительное обновление размеров после полной загрузки
    useEffect(() => {
        const handleLoad = () => {
            if (containerRef.current) {
                window.dispatchEvent(new Event('resize'));
            }
        };

        // Если страница уже загружена
        if (document.readyState === 'complete') {
            handleLoad();
        } else {
            // Если страница еще загружается
            window.addEventListener('load', handleLoad);
            return () => window.removeEventListener('load', handleLoad);
        }
    }, [containerRef]);

    // Обновление размеров при изменении состояния загрузки
    useEffect(() => {
        const handleReadyStateChange = () => {
            if (document.readyState === 'complete' && containerRef.current) {
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                }, 100);
            }
        };

        document.addEventListener('readystatechange', handleReadyStateChange);
        return () => document.removeEventListener('readystatechange', handleReadyStateChange);
    }, [containerRef]);

    // WebSocket синхронизация - подписываемся на события задач
    useEffect(() => {
        if (!departmentId) return;
        if (!isConnected) return;

        // Подписываемся на события задач проекта (для задач отдела)
        const unsubscribeProjectEvents = subscribeToTaskEvents({
            onTaskCreate: (data: any) => {
                // Проверяем, относится ли задача к нашему отделу
                if (data.task && data.assigneeIds) {
                    const hasDepartmentUser = data.assigneeIds.some((assigneeId: number) => 
                        departmentUsers.some(user => user.id === assigneeId)
                    );
                    if (hasDepartmentUser) {
                        invalidateTaskCache();
                    }
                }
            },
            onTaskUpdate: (data: any) => {
                if (data.task && data.assigneeIds) {
                    const hasDepartmentUser = data.assigneeIds.some((assigneeId: number) => 
                        departmentUsers.some(user => user.id === assigneeId)
                    );
                    if (hasDepartmentUser) {
                        invalidateTaskCache();
                    }
                }
            },
            onTaskDelete: (data: any) => {
                if (data.task && data.assigneeIds) {
                    const hasDepartmentUser = data.assigneeIds.some((assigneeId: number) => 
                        departmentUsers.some(user => user.id === assigneeId)
                    );
                    if (hasDepartmentUser) {
                        invalidateTaskCache();
                    }
                }
            },
            onTaskAssignmentChanged: (data: any) => {
                invalidateTaskCache();
            }
        });

        // Подписываемся на пользовательские события задач
        const unsubscribeUserEvents = subscribeToUserTaskEvents({
            onUserTaskCreate: (data: any) => {
                if (data.assigneeIds) {
                    const hasDepartmentUser = data.assigneeIds.some((assigneeId: number) => 
                        departmentUsers.some(user => user.id === assigneeId)
                    );
                    if (hasDepartmentUser) {
                        invalidateTaskCache();
                    }
                }
            },
            onUserTaskUpdate: (data: any) => {
                if (data.assigneeIds) {
                    const hasDepartmentUser = data.assigneeIds.some((assigneeId: number) => 
                        departmentUsers.some(user => user.id === assigneeId)
                    );
                    if (hasDepartmentUser) {
                        invalidateTaskCache();
                    }
                }
            },
            onUserTaskDelete: (data: any) => {
                if (data.assigneeIds) {
                    const hasDepartmentUser = data.assigneeIds.some((assigneeId: number) => 
                        departmentUsers.some(user => user.id === assigneeId)
                    );
                    if (hasDepartmentUser) {
                        invalidateTaskCache();
                    }
                }
            },
            onTaskAssigned: (data: any) => {
                if (data.assigneeIds) {
                    const hasDepartmentUser = data.assigneeIds.some((assigneeId: number) => 
                        departmentUsers.some(user => user.id === assigneeId)
                    );
                    if (hasDepartmentUser) {
                        invalidateTaskCache();
                    }
                }
            },
            onTaskUnassigned: (data: any) => {
                if (data.unassignedUserIds) {
                    const hasDepartmentUser = data.unassignedUserIds.some((assigneeId: number) => 
                        departmentUsers.some(user => user.id === assigneeId)
                    );
                    if (hasDepartmentUser) {
                        invalidateTaskCache();
                    }
                }
            }
        });

        // Отписываемся при размонтировании
        return () => {
            unsubscribeProjectEvents();
            unsubscribeUserEvents();
        };
    }, [departmentId, isConnected, departmentUsers, subscribeToTaskEvents, subscribeToUserTaskEvents, refetchTasks]);

    const handleTaskClick = (task: GanttTask) => {
        setSelectedTask(task);
        setIsModalOpen(true);
    };

    const handleTaskUpdate = (taskId: string, updatedTask: Task) => {
        // Обновляем задачу в локальном состоянии
        // Здесь можно добавить логику обновления, если потребуется
        console.log('Task updated:', updatedTask);
        
        // Закрываем модальное окно после обновления
        setIsModalOpen(false);
        setSelectedTask(null);
    };

    if (isLoading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!departmentId) return (
        <div className="text-gray-500 text-center p-4">
            Информация об отделе пользователя недоступна
        </div>
    );

    if (userTasksGroups.length === 0) return (
        <div className="text-gray-500 text-center p-4">
            Нет задач отдела для отображения на выбранной рабочей неделе
        </div>
    );

    return (
        <div 
            ref={containerRef}
            className="bg-white dark:bg-gray-800 rounded-lg pb-6 shadow-lg w-full"
        >
            
            <div className="w-full overflow-hidden">
                <svg 
                    width="100%" 
                    height={dimensions.chartHeight} 
                    className="w-full"
                    viewBox={`0 0 ${dimensions.chartWidth} ${dimensions.chartHeight}`}
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Заголовок временной шкалы */}
                    <TimelineHeader 
                        timelineData={timelineData} 
                        dimensions={dimensions} 
                    />

                    {/* Пользователи и их задачи */}
                    {(() => {
                        let currentY = 80;
                        return userTasksGroups.map((userGroup, groupIndex) => {
                            const sectionHeight = Math.max(40, (userGroup.maxLevel + 1) * dimensions.rowHeight);
                            const userY = currentY;
                            currentY += sectionHeight + 20;
                            
                            return (
                                <g key={userGroup.user.id} transform={`translate(0, ${userY})`}>
                                    <UserRow
                                        userGroup={userGroup}
                                        groupIndex={groupIndex}
                                        timelineData={timelineData}
                                        dimensions={dimensions}
                                        onTaskClick={handleTaskClick}
                                    />
                                </g>
                            );
                        });
                    })()}
                </svg>
            </div>

            {/* Легенда статусов задач */}
            <GanttLegend />
            
            {/* Модальное окно с информацией о задаче */}
            {selectedTask && (
                <TaskDetailsModal
                    task={selectedTask}
                    visible={isModalOpen}
                    onClose={() => {
                        setIsModalOpen(false);
                        setSelectedTask(null);
                    }}
                    onTaskUpdate={handleTaskUpdate}
                />
            )}
        </div>
    );
}
