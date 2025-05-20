"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useGetUserByIdQuery, useUpdateUserMutation } from "@/store/api/user.api";
import { useGetDepartmentsQuery } from "@/store/api/department.api";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { Input } from '@/components/ui/input/Input';
import { Select } from '@/components/ui/select/Select';
import { Button } from "@/components/ui/button/Button";
import { KeyIcon } from "@heroicons/react/24/outline";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/20/solid";
import { toast } from "react-hot-toast";
import { IProfileForm } from "@/types/forms/profile.types";

export default function Profile() {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { data: user, isLoading, error } = useGetUserByIdQuery(1); // TODO: Get actual user ID
    const { data: departments = [] } = useGetDepartmentsQuery();
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<IProfileForm>({
        mode: 'onChange',
        defaultValues: {
            name: user?.name,
            login: user?.login,
            departmentId: user?.departmentId
        }
    });

    const onSubmit = async (data: IProfileForm) => {
        try {
            await updateUser({
                id: user!.id,
                data: {
                    name: data.name,
                    login: data.login,
                    departmentId: data.departmentId,
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword
                }
            }).unwrap();
            toast.success('Профиль успешно обновлен');
        } catch (error: any) {
            toast.error(error.data?.message || 'Произошла ошибка при обновлении профиля');
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        router.push('/auth');
    };

    const departmentOptions = departments.map((dept) => ({
        value: dept.id,
        label: dept.name
    }));

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-red-500 text-center">Ошибка при загрузке данных пользователя</div>
        );
    }

    return (
        <div className="w-full px-0 sm:px-8 py-10 space-y-6 bg-white dark:bg-gray-900 rounded-2xl p-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <div className="relative w-20 h-20 rounded-full bg-pink-200 flex items-center justify-center">
                        <Image
                            src="/avatar.png"
                            alt="Аватар пользователя"
                            fill
                            className="object-cover rounded-full"
                            sizes="80px"
                        />
                    </div>
                    <div>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</div>
                        <div className="text-sm text-gray-400">{user?.department?.name}</div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <KeyIcon className="w-4 h-4 mr-1" />
                        <span className="text-sm">Сменить пароль</span>
                    </button>
                    <button 
                        onClick={handleLogout}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4 mr-1" />
                        <span className="text-sm">Выйти</span>
                    </button>
                </div>
            </div>

            {/* User Info Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <Input
                        label="Имя"
                        {...register('name', {
                            required: 'Имя обязательно'
                        })}
                        error={errors.name}
                    />
                    <Input
                        label="Логин"
                        {...register('login', {
                            required: 'Логин обязателен',
                            minLength: {
                                value: 3,
                                message: 'Логин должен содержать минимум 3 символа'
                            }
                        })}
                        error={errors.login}
                    />
                    <Select
                        label="Отдел"
                        options={departmentOptions}
                        {...register('departmentId', {required: 'Выберите отдел'})}
                        error={errors.departmentId}
                    />
                </div>
                <Button disabled={isUpdating}>
                    {isUpdating ? 'Сохранение...' : 'Сохранить'}
                </Button>
            </form>
        </div>
    );
}