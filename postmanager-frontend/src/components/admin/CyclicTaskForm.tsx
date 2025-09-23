'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useCreateCyclicTaskMutation, useUpdateCyclicTaskMutation } from '@/store/api/cyclicTask.api';
import { CyclicTask, type CyclicTaskForm, DayOfWeek, DAYS_OF_WEEK } from '@/types/cyclicTask.types';
import { IUser } from '@/types/user.types';
import { IProject as Project } from '@/types/project.types';
import { CustomMultiSelect } from '@/components/ui/multi-select/CustomMultiSelect';
import { toast } from 'react-hot-toast';

interface CyclicTaskFormProps {
    task?: CyclicTask | null;
    onClose: () => void;
    users: IUser[];
    projects: Project[];
}

export default function CyclicTaskForm({ task, onClose, users, projects }: CyclicTaskFormProps) {
    const [formData, setFormData] = useState<CyclicTaskForm>({
        title: '',
        description: '',
        dayOfWeek: 'MONDAY',
        deadline: '09:00',
        deadlineDay: undefined,
        projectId: 0,
        assigneeIds: [],
        isActive: true
    });

    const [createTask, { isLoading: isCreating }] = useCreateCyclicTaskMutation();
    const [updateTask, { isLoading: isUpdating }] = useUpdateCyclicTaskMutation();

    const isLoading = isCreating || isUpdating;

    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.description || '',
                dayOfWeek: task.dayOfWeek,
                deadline: task.deadline.substring(0, 5), // HH:mm
                deadlineDay: task.deadlineDay,
                projectId: task.projectId,
                assigneeIds: task.assignees.map(a => a.userId),
                isActive: task.isActive
            });
        }
    }, [task]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            toast.error('Название задачи обязательно');
            return;
        }

        if (!formData.projectId) {
            toast.error('Выберите проект');
            return;
        }

        if (!formData.assigneeIds || formData.assigneeIds.length === 0) {
            toast.error('Выберите исполнителей');
            return;
        }

        try {
            if (task) {
                // Редактирование существующей задачи
                await updateTask({
                    id: task.id,
                    data: {
                        title: formData.title,
                        description: formData.description || undefined,
                        dayOfWeek: formData.dayOfWeek,
                        deadline: formData.deadline,
                        deadlineDay: formData.deadlineDay,
                        projectId: formData.projectId,
                        assigneeIds: formData.assigneeIds,
                        isActive: formData.isActive
                    }
                }).unwrap();
                toast.success('Цикличная задача обновлена');
            } else {
                // Создание новой задачи
                await createTask({
                    title: formData.title,
                    description: formData.description || undefined,
                    dayOfWeek: formData.dayOfWeek,
                    deadline: formData.deadline,
                    deadlineDay: formData.deadlineDay,
                    projectId: formData.projectId,
                    assigneeIds: formData.assigneeIds
                }).unwrap();
                toast.success('Цикличная задача создана');
            }
            onClose();
        } catch (error) {
            toast.error('Ошибка при сохранении задачи');
        }
    };

    const handleInputChange = (field: keyof CyclicTaskForm, value: any) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-gray-800">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {task ? 'Редактировать цикличную задачу' : 'Создать цикличную задачу'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Название задачи */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Название задачи *
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Введите название задачи"
                            required
                        />
                    </div>

                    {/* Описание */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Описание
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            placeholder="Описание задачи (необязательно)"
                        />
                    </div>

                    {/* День недели */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            День недели *
                        </label>
                        <select
                            value={formData.dayOfWeek}
                            onChange={(e) => handleInputChange('dayOfWeek', e.target.value as DayOfWeek)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        >
                            {DAYS_OF_WEEK.map((day) => (
                                <option key={day.value} value={day.value}>
                                    {day.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* День срока задачи и время выполнения (в одну строку) */}
                    <div className="flex flex-col sm:flex-row sm:space-x-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                День срока задачи
                            </label>
                            <select
                                value={formData.deadlineDay || ''}
                                onChange={(e) => handleInputChange('deadlineDay', e.target.value ? (e.target.value as DayOfWeek) : undefined)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                                <option value="">Тот же день</option>
                                {DAYS_OF_WEEK.map((day) => (
                                    <option key={day.value} value={day.value}>
                                        {day.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex-1 mt-4 sm:mt-0">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Время выполнения *
                            </label>
                            <input
                                type="time"
                                value={formData.deadline}
                                onChange={(e) => handleInputChange('deadline', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                required
                            />
                        </div>
                    </div>

                    {/* Проект */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Проект *
                        </label>
                        <select
                            value={formData.projectId}
                            onChange={(e) => handleInputChange('projectId', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            required
                        >
                            <option value={0}>Выберите проект</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Исполнители */}
                    <CustomMultiSelect
                        label="Исполнители *"
                        name="assigneeIds"
                        options={users.map(user => ({
                            value: user.id,
                            label: `${user.name}${user.department ? ' (' + user.department.name + ')' : ''}`
                        }))}
                        value={formData.assigneeIds}
                        onChange={(value) => handleInputChange('assigneeIds', value)}
                        placeholder="Выберите исполнителей"
                        searchPlaceholder="Поиск исполнителей..."
                        noOptionsMessage="Исполнители не найдены"
                    />

                    {/* Статус активности (только для редактирования) */}
                    {task && (
                        <div>
                            <label className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                    Задача активна
                                </span>
                            </label>
                        </div>
                    )}

                    {/* Кнопки */}
                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600"
                        >
                            Отмена
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Сохранение...' : (task ? 'Обновить' : 'Создать')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
