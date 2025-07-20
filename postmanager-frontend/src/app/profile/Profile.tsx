"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useGetUserByIdQuery, useUpdateUserMutation } from "@/store/api/user.api";
import { useGetDepartmentsQuery } from "@/store/api/department.api";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { Input } from '@/components/ui/input/Input';
import { Select } from '@/components/ui/select/Select';
import { Button } from "@/components/ui/button/Button";
import { KeyIcon } from "@heroicons/react/24/outline";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import { IProfileForm } from "@/types/forms/profile.types";
import { PAGE_URL, USER_ROLE_LABELS } from "@/constants";
import { Badge } from "@/components/ui";
import UserStats from "@/components/profile/UserStats";
import { useAuth } from "@/hooks/useAuth";

export default function Profile({ userId: propUserId }: { userId?: number } = {}) {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { isAuthenticated, userId: authUserId, isLoading: authLoading } = useAuth();
    const userId = propUserId ?? authUserId;
    const [showPasswordForm, setShowPasswordForm] = useState(false);

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace(PAGE_URL.AUTH);
        }
    }, [isAuthenticated, authLoading, router, userId]);

    const { data: user, isLoading, error } = useGetUserByIdQuery(userId!, {
        skip: !userId || !isAuthenticated
    });
    const { data: departments = [] } = useGetDepartmentsQuery();
    const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<IProfileForm>({
        mode: 'onChange'
    });

    // Обновляем форму когда данные пользователя загружены
    useEffect(() => {
        if (user && departments.length > 0) {
            reset({
                name: user.name,
                login: user.login || '',
                departmentId: user.department?.id ?? user.departmentId ?? undefined
            });
            // Лог после reset
            setTimeout(() => {
                // @ts-ignore
                console.log('form values after reset:', document.querySelector('select[name=\"departmentId\"]').value);
            }, 100);
        }
    }, [user, departments, reset]);

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
        } catch (error: unknown) {
            const errorMessage = error && typeof error === 'object' && 'data' in error && 
                                 error.data && typeof error.data === 'object' && 'message' in error.data
                                 ? String(error.data.message)
                                 : 'Произошла ошибка при обновлении профиля';
            toast.error(errorMessage);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        router.push(PAGE_URL.AUTH);
    };

    const departmentOptions = departments.map((dept) => ({
        value: dept.id,
        label: dept.name
    }));

    // Показываем загрузку во время проверки авторизации
    if (authLoading) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Проверка авторизации...</p>
                </div>
            </div>
        );
    }

    // Если пользователь не авторизован, показываем сообщение
    if (!isAuthenticated) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Пользователь не авторизован
                    </p>
                    <Button onClick={() => router.push(PAGE_URL.AUTH)}>
                        Войти в систему
                    </Button>
                </div>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Загрузка профиля...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="text-center">
                    <p className="text-red-500 mb-4">Ошибка при загрузке данных пользователя</p>
                    <Button onClick={() => window.location.reload()}>
                        Попробовать снова
                    </Button>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex justify-center items-center h-40">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Данные пользователя не найдены
                    </p>
                    <Button onClick={() => router.push(PAGE_URL.AUTH)}>
                        Войти в систему
                    </Button>
                </div>
            </div>
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
                        <div className="text-sm text-gray-400 mb-2">{user?.department?.name}</div>
                        {user?.role && (
                            <Badge variant="info" size="sm">
                                {USER_ROLE_LABELS[user.role as keyof typeof USER_ROLE_LABELS] || user.role}
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                        <KeyIcon className="w-4 h-4 mr-1" />
                        <span className="text-sm">
                            {showPasswordForm ? 'Скрыть форму' : 'Сменить пароль'}
                        </span>
                    </button>
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="flex items-center gap-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    >
                        <ArrowRightStartOnRectangleIcon className="w-4 h-4 mr-1" />
                        <span className="text-sm">Выйти</span>
                    </button>
                </div>
            </div>

            {/* User Statistics */}
            <UserStats userId={userId!} />

            {/* User Info Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="border-t border-gray-200 dark:border-gray-700 p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    <Input
                        label="Имя"
                        {...register('name', {
                            required: 'Имя обязательно'
                        })}
                        error={errors.name?.message}
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
                        error={errors.login?.message}
                    />
                    <Select
                        label="Отдел"
                        options={departmentOptions}
                        {...register('departmentId', { required: 'Выберите отдел', setValueAs: v => v === "" ? undefined : Number(v) })}
                        error={errors.departmentId?.message}
                    />
                </div>

                {/* Password Change Form */}
                {showPasswordForm && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Смена пароля
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <Input
                                label="Текущий пароль"
                                type="password"
                                placeholder="Введите текущий пароль"
                                {...register('currentPassword', {
                                    required: showPasswordForm ? 'Текущий пароль обязателен' : false
                                })}
                                error={errors.currentPassword?.message}
                            />
                            <Input
                                label="Новый пароль"
                                type="password"
                                placeholder="Введите новый пароль"
                                {...register('newPassword', {
                                    required: showPasswordForm ? 'Новый пароль обязателен' : false,
                                    minLength: {
                                        value: 6,
                                        message: 'Пароль должен содержать минимум 6 символов'
                                    }
                                })}
                                error={errors.newPassword?.message}
                            />
                        </div>
                    </div>
                )}

                <div className="flex gap-3">
                    <Button type="submit" disabled={isUpdating}>
                        {isUpdating ? 'Сохранение...' : 'Сохранить изменения'}
                    </Button>
                    {showPasswordForm && (
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setShowPasswordForm(false);
                                reset({
                                    name: user?.name,
                                    login: user?.login || '',
                                    departmentId: user?.department?.id,
                                    currentPassword: '',
                                    newPassword: ''
                                });
                            }}
                        >
                            Отменить смену пароля
                        </Button>
                    )}
                </div>
            </form>
        </div>
    );
}