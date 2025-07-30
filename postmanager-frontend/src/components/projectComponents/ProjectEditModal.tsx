'use client';

import { useForm, Controller } from "react-hook-form";
import { IProjectForm, IProject } from "@/types/project.types";
import { Input } from "@/components/ui/input/Input";
import { Button } from "@/components/ui/button/Button";
import { DateInput } from "@/components/ui/date-input/DateInput";
import { MultiSelect } from "@/components/ui/multi-select/MultiSelect";

import { useGetDepartmentsQuery } from "@/store/api/department.api";
import { useGetUsersQuery } from "@/store/api/user.api";
import { useUpdateProjectMutation } from "@/store/api/project.api";
import { IUser } from "@/types/user.types";
import { IDepartment } from "@/types/department.types";
import { Option } from "@/types/admin.types";
import { useEffect } from "react";

interface ProjectEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    project: IProject | null;
}

export default function ProjectEditModal({ isOpen, onClose, project }: ProjectEditModalProps) {
    const { register, handleSubmit, reset, control, formState: { errors }, setValue } = useForm<IProjectForm>({
        mode: 'onChange',
    });

    const { data: departments = [] } = useGetDepartmentsQuery();
    const { data: users = [] } = useGetUsersQuery();
    const [updateProject, { isLoading }] = useUpdateProjectMutation();

    // Заполняем форму данными проекта при открытии
    useEffect(() => {
        if (project && isOpen) {
            setValue('title', project.title);
            setValue('description', project.description || '');
            setValue('client', project.client || '');
            
            // Форматируем даты для input type="date"
            const formatDateForInput = (dateString?: string) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                return date.toISOString().split('T')[0];
            };
            
            setValue('startDate', formatDateForInput(project.startDate));
            setValue('endDate', formatDateForInput(project.endDate));
            
            // Извлекаем ID департаментов из связанного массива
            const departmentIds = project.department ? project.department.map(dept => dept.id) : [];
            setValue('departmentIds', departmentIds);
            
            // Извлекаем ID пользователей из связанного массива
            const userIds = project.users ? project.users.map(user => user.id) : [];
            setValue('userIds', userIds);
        }
    }, [project, isOpen, setValue]);

    const onSubmit = async (data: IProjectForm) => {
        if (!project?.id) return;
        
        try {
            await updateProject({ id: project.id, project: data }).unwrap();
            onClose();
            reset();
        } catch (error: unknown) {
            console.error('Failed to update project:', error);
        }
    };

    const departmentOptions: Option[] = departments.map((dept: IDepartment) => ({
        value: dept.id,
        label: dept.name
    }));

    const userOptions: Option[] = users.map((user: IUser) => ({
        value: user.id,
        label: user.name
    }));

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Редактирование проекта</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <Input
                        label="Название проекта"
                        {...register('title', {
                            required: 'Название проекта обязательно'
                        })}
                        error={errors.title?.message}
                    />

                    <Input
                        label="Описание"
                        {...register('description')}
                        error={errors.description?.message}
                    />

                    <Input
                        label="Клиент"
                        {...register('client', {
                            required: 'Клиент обязателен'
                        })}
                        error={errors.client?.message}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <DateInput
                            label="Дата начала"
                            {...register('startDate')}
                            error={errors.startDate?.message}
                        />

                        <DateInput
                            label="Дата окончания"
                            {...register('endDate')}
                            error={errors.endDate?.message}
                        />
                    </div>

                    <Controller
                        name="departmentIds"
                        control={control}
                        rules={{ required: 'Выберите хотя бы один отдел' }}
                        render={({ field }) => (
                            <MultiSelect
                                label="Отделы"
                                name="departmentIds"
                                options={departmentOptions}
                                value={field.value || []}
                                onChange={field.onChange}
                                error={errors.departmentIds?.message}
                                placeholder="Выберите отделы"
                            />
                        )}
                    />

                    <Controller
                        name="userIds"
                        control={control}
                        rules={{ required: 'Выберите хотя бы одного участника' }}
                        render={({ field }) => (
                            <MultiSelect
                                label="Участники проекта"
                                name="userIds"
                                options={userOptions}
                                value={field.value || []}
                                onChange={field.onChange}
                                error={errors.userIds?.message}
                                placeholder="Выберите участников"
                            />
                        )}
                    />

                    <div className="flex gap-4">
                        <Button 
                            type="button" 
                            variant="outline" 
                            onClick={onClose}
                            className="flex-1"
                        >
                            Отмена
                        </Button>
                        <Button 
                            type="submit" 
                            className="flex-1"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Обновление...' : 'Обновить проект'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
} 