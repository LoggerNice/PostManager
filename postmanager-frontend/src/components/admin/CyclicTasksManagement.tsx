'use client';

import { useState } from 'react';
import { 
    PlusIcon, 
    PencilIcon, 
    TrashIcon,
    PlayIcon,
    PauseIcon,
    CalendarDaysIcon,
    RocketLaunchIcon
} from '@heroicons/react/24/outline';
import { 
    useGetCyclicTasksQuery, 
    useDeleteCyclicTaskMutation, 
    useToggleCyclicTaskStatusMutation,
    useExecuteCyclicTasksMutation
} from '@/store/api/cyclicTask.api';
import { useGetUsersQuery } from '@/store/api/user.api';
import { useGetProjectsQuery } from '@/store/api/project.api';
import { useAuth } from '@/hooks/useAuth';
import { CyclicTask, DayOfWeek, DAYS_OF_WEEK } from '@/types/cyclicTask.types';
import { UserRole } from '@/types';
import Loader from '@/components/loader/Loader';
import CyclicTaskForm from './CyclicTaskForm';
import { toast } from 'react-hot-toast';
import { formatName } from '../charts/DepartmentTasksExcelExport';

export default function CyclicTasksManagement() {
    const { user } = useAuth();
    const [showForm, setShowForm] = useState(false);
    const [editingTask, setEditingTask] = useState<CyclicTask | null>(null);
    
    const { data: cyclicTasks, isLoading, error } = useGetCyclicTasksQuery();
    const { data: users } = useGetUsersQuery();
    const { data: projects } = useGetProjectsQuery();
    
    const [deleteTask] = useDeleteCyclicTaskMutation();
    const [toggleStatus] = useToggleCyclicTaskStatusMutation();
    const [executeTasks, { isLoading: isExecuting }] = useExecuteCyclicTasksMutation();

    // Фильтруем пользователей только из отдела текущего пользователя (для менеджеров)
    const availableUsers = user?.role === UserRole.MANAGER 
        ? users?.filter(u => u.departmentId === user.departmentId) || []
        : users || [];

    const handleDeleteTask = async (taskId: number) => {
        if (window.confirm('Вы уверены, что хотите удалить эту цикличную задачу?')) {
            try {
                await deleteTask(taskId).unwrap();
                toast.success('Цикличная задача удалена');
            } catch (error) {
                toast.error('Ошибка при удалении задачи');
            }
        }
    };

    const handleToggleStatus = async (taskId: number, isActive: boolean) => {
        try {
            await toggleStatus({ id: taskId, isActive: !isActive }).unwrap();
            toast.success(isActive ? 'Задача приостановлена' : 'Задача активирована');
        } catch (error) {
            toast.error('Ошибка при изменении статуса задачи');
        }
    };

    const handleEditTask = (task: CyclicTask) => {
        setEditingTask(task);
        setShowForm(true);
    };

    const handleCloseForm = () => {
        setShowForm(false);
        setEditingTask(null);
    };

    const handleExecuteTasks = async () => {
        if (window.confirm('Вы уверены, что хотите принудительно выполнить создание циклических задач? Это создаст задачи для всех активных циклических задач, которые должны выполняться сегодня.')) {
            try {
                await executeTasks().unwrap();
                toast.success('Цикличные задачи выполнены успешно');
            } catch (error) {
                toast.error('Ошибка при выполнении цикличных задач');
            }
        }
    };

    const getDayLabel = (day: DayOfWeek) => {
        return DAYS_OF_WEEK.find(d => d.value === day)?.label || day;
    };

    const formatTime = (time: string) => {
        return time.substring(0, 5); // HH:mm
    };

    if (isLoading) return <Loader />;
    if (error) {
        return (
            <div className="text-center py-8">
                <p className="text-red-500">Ошибка загрузки цикличных задач</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Заголовок и кнопки */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-medium text-gray-900 dark:text-white">
                        Цикличные задачи
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        Управление задачами с периодическим созданием
                    </p>
                </div>
                <div className="flex space-x-3">
                    <button
                        onClick={handleExecuteTasks}
                        disabled={isExecuting}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RocketLaunchIcon className="h-4 w-4 mr-2" />
                        {isExecuting ? 'Выполнение...' : 'Выполнить сейчас'}
                    </button>
                    <button
                        onClick={() => setShowForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Добавить задачу
                    </button>
                </div>
            </div>

            {/* Список цикличных задач */}
            {cyclicTasks && cyclicTasks.length > 0 ? (
                <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                        {cyclicTasks.map((task) => (
                            <li key={task.id}>
                                <div className="px-4 py-4 sm:px-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0">
                                                <CalendarDaysIcon className="h-8 w-8 text-gray-400" />
                                            </div>
                                            <div className="ml-4">
                                                <div className="flex items-center">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {task.title}
                                                    </p>
                                                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        task.isActive 
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                                                    }`}>
                                                        {task.isActive ? 'Активна' : 'Приостановлена'}
                                                    </span>
                                                </div>
                                                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="mr-4">
                                                        <strong>День недели:</strong> {getDayLabel(task.dayOfWeek)}
                                                    </span>
                                                    <span className="mr-4">
                                                        <strong>Время выполнения:</strong> {formatTime(task.deadline)}
                                                    </span>
                                                    <span className="mr-4">
                                                        <strong>Проект:</strong> {task.project.title}
                                                    </span>
                                                    <span>
                                                        <strong>Исполнители:</strong> {task.assignees.map(assignee => formatName(assignee.user.name)).join(', ')}
                                                    </span>
                                                </div>
                                                {task.description && (
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                                        {task.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleToggleStatus(task.id, task.isActive)}
                                                className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded ${
                                                    task.isActive
                                                        ? 'text-orange-700 bg-orange-100 hover:bg-orange-200 dark:text-orange-400 dark:bg-orange-900/20 dark:hover:bg-orange-900/30'
                                                        : 'text-green-700 bg-green-100 hover:bg-green-200 dark:text-green-400 dark:bg-green-900/20 dark:hover:bg-green-900/30'
                                                }`}
                                                title={task.isActive ? 'Приостановить' : 'Активировать'}
                                            >
                                                {task.isActive ? (
                                                    <>
                                                        <PauseIcon className="h-3 w-3 mr-1" />
                                                        Приостановить
                                                    </>
                                                ) : (
                                                    <>
                                                        <PlayIcon className="h-3 w-3 mr-1" />
                                                        Активировать
                                                    </>
                                                )}
                                            </button>
                                            <button
                                                onClick={() => handleEditTask(task)}
                                                className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                                                title="Редактировать"
                                            >
                                                <PencilIcon className="h-3 w-3 mr-1" />
                                                Редактировать
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTask(task.id)}
                                                className="inline-flex items-center px-3 py-1 border border-red-300 text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:bg-gray-700 dark:hover:bg-red-900/20"
                                                title="Удалить"
                                            >
                                                <TrashIcon className="h-3 w-3 mr-1" />
                                                Удалить
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : (
                <div className="text-center py-12">
                    <CalendarDaysIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        Нет цикличных задач
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Начните с создания новой цикличной задачи.
                    </p>
                    <div className="mt-6">
                        <button
                            onClick={() => setShowForm(true)}
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Добавить задачу
                        </button>
                    </div>
                </div>
            )}

            {/* Форма создания/редактирования */}
            {showForm && (
                <CyclicTaskForm
                    task={editingTask}
                    onClose={handleCloseForm}
                    users={availableUsers}
                    projects={projects || []}
                />
            )}
        </div>
    );
}
