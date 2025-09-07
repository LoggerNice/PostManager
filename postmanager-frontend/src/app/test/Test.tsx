'use client';

import { useForm, Controller } from "react-hook-form";
import { IProjectForm } from "@/types/project.types";
import { Input } from "@/components/ui/input/Input";
import { Button } from "@/components/ui/button/Button";
import { DateInput } from "@/components/ui/date-input/DateInput";
import { CustomMultiSelect } from "@/components/ui";

import { useGetDepartmentsQuery } from "@/store/api/department.api";
import { useGetUsersQuery } from "@/store/api/user.api";
import { useCreateProjectMutation } from "@/store/api/project.api";
import { IUser } from "@/types/user.types";
import { IDepartment } from "@/types/department.types";
import { Option } from "@/types/admin.types";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function Test() {
    const { user: currentUser } = useAuth();
    const { register, handleSubmit, reset, control, formState: { errors }, setValue, watch } = useForm<IProjectForm>({
        mode: 'onChange',
    });

    const { data: departments = [] } = useGetDepartmentsQuery();
    const { data: users = [] } = useGetUsersQuery();
    const [createProject] = useCreateProjectMutation();

    // Автоматически добавляем текущего пользователя в список участников
    useEffect(() => {
        if (currentUser && currentUser.id) {
            const currentUserIds = watch('userIds') || [];
            if (!currentUserIds.includes(currentUser.id)) {
                setValue('userIds', [...currentUserIds, currentUser.id]);
            }
        }
    }, [currentUser, setValue, watch]);



    const onSubmit = async (data: IProjectForm) => {
        try {
            // Убеждаемся, что текущий пользователь включен в список участников
            const userIds = data.userIds || [];
            if (currentUser && currentUser.id && !userIds.includes(currentUser.id)) {
                data.userIds = [...userIds, currentUser.id];
            }
            
            await createProject(data).unwrap();
            reset();
        } catch (error: unknown) {
            console.error('Failed to create project:', error);
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

    return (
        <div className="mt-8 w-full max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <h1 className="text-2xl font-bold mb-6 text-center">Создание проекта</h1>

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
                    label="ГК"
                    {...register('client', {
                        required: 'ГК обязателен'
                    })}
                    error={errors.client?.message}
                />

                <div className="grid grid-cols-2 gap-4">
                    <DateInput
                        label="Дата начала"
                        {...register('startDate', {
                            required: 'Дата начала обязательна'
                        })}
                        error={errors.startDate?.message}
                    />

                    <DateInput
                        label="Дата окончания"
                        {...register('endDate', {
                            required: 'Дата окончания обязательна'
                        })}
                        error={errors.endDate?.message}
                    />
                </div>

                <Controller
                    name="departmentIds"
                    control={control}
                    rules={{ required: 'Выберите хотя бы один отдел' }}
                    render={({ field }) => (
                        <CustomMultiSelect
                            label="Отделы"
                            name="departmentIds"
                            options={departmentOptions}
                            value={field.value || []}
                            onChange={field.onChange}
                            error={errors.departmentIds?.message}
                            placeholder="Выберите отделы"
                            searchPlaceholder="Поиск отделов..."
                            noOptionsMessage="Отделы не найдены"
                        />
                    )}
                />

                <Controller
                    name="userIds"
                    control={control}
                    rules={{ required: 'Выберите хотя бы одного участника' }}
                    render={({ field }) => (
                        <CustomMultiSelect
                            label="Участники проекта"
                            name="userIds"
                            options={userOptions}
                            value={field.value || []}
                            onChange={field.onChange}
                            error={errors.userIds?.message}
                            placeholder="Выберите участников"
                            searchPlaceholder="Поиск участников..."
                            noOptionsMessage="Участники не найдены"
                        />
                    )}
                />

                <Button type="submit" className="w-full">
                    Создать проект
                </Button>
            </form>
        </div>
    );
} 