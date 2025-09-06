"use client";

import Image from "next/image";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useGetUserByIdQuery, useUpdateUserMutation } from "@/store/api/user.api";
import { useAppDispatch } from "@/store/hooks";
import { logout } from "@/store/slices/authSlice";
import { Input } from '@/components/ui/input/Input';
import { Button } from "@/components/ui/button/Button";
import { KeyIcon, UserIcon, ChartBarIcon, CogIcon } from "@heroicons/react/24/outline";
import { ArrowRightStartOnRectangleIcon } from "@heroicons/react/24/outline";

import { IProfileForm } from "@/types/forms/profile.types";
import { PAGE_URL, USER_ROLE_LABELS } from "@/constants";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import UserStats from "@/components/profile/UserStats";
import UserProjects from "@/components/profile/UserProjects";
import { useAuth } from "@/hooks/useAuth";

type TabType = 'overview' | 'settings';

export default function Profile({ userId: propUserId }: { userId?: number } = {}) {
    const router = useRouter();
    const dispatch = useAppDispatch();

    const { isAuthenticated, userId: authUserId, isLoading: authLoading } = useAuth();
    const userId = propUserId ?? authUserId;
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [activeTab, setActiveTab] = useState<TabType>('overview');

    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            router.replace(PAGE_URL.AUTH);
        }
    }, [isAuthenticated, authLoading, router, userId]);

    const { data: user, isLoading, error } = useGetUserByIdQuery(userId!, {
        skip: !userId || !isAuthenticated
    });
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
        if (user) {
            reset({
                name: user.name,
                login: user.login || ''
            });
        }
    }, [user, reset]);

    const onSubmit = async (data: IProfileForm) => {
        try {
            await updateUser({
                id: user!.id,
                data: {
                    name: data.name,
                    login: data.login,
                    currentPassword: data.currentPassword,
                    newPassword: data.newPassword
                }
            }).unwrap();
        } catch (error: unknown) {
            console.error('Failed to update profile:', error);
        }
    };

    const handleLogout = () => {
        dispatch(logout());
        router.push(PAGE_URL.AUTH);
    };

    const tabs = [
        { id: 'overview', label: 'Обзор', icon: UserIcon, description: 'Основная информация, статистика и проекты' },
        { id: 'settings', label: 'Настройки', icon: CogIcon, description: 'Редактирование профиля' }
    ];

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
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden flex flex-col h-full">
            {/* Header */}
            <div className="bg-white dark:bg-gray-800 px-6 py-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <Image
                            src="/avatar.png"
                            alt="Аватар пользователя"
                            fill
                            className="object-cover rounded-full"
                            sizes="80px"
                        />
                    </div>
                    <div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{user?.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                {user?.department?.name || (user?.departmentId ? `Отдел ID: ${user.departmentId}` : 'Отдел не указан')}
                            </div>
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
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <div className="px-6">
                    <nav className="flex space-x-8">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-hidden">
                {activeTab === 'overview' && (
                    <div className="p-6 h-full overflow-auto space-y-6">
            <UserStats userId={userId!} />
                        <UserProjects userId={userId!} />
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="p-6 h-full overflow-auto">
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Настройки профиля
                                </h2>
                                <p className="text-gray-600 dark:text-gray-400">
                                    Управляйте информацией о своем профиле и настройками безопасности
                                </p>
                            </div>

                            <div className="space-y-8">
                                {/* Основная информация */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <UserIcon className="w-5 h-5" />
                                            Основная информация
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Input
                        label="ФИО"
                        {...register('name', {
                            required: 'ФИО обязательно'
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
                                            </div>
                                            
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="flex items-end">
                                                    <div className="w-full">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Отдел
                                                        </label>
                                                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                                                            <span className="text-gray-900 dark:text-white">
                                                                {user?.department?.name || (user?.departmentId ? `Отдел ID: ${user.departmentId}` : 'Отдел не указан')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-end">
                                                    <div className="w-full">
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Роль
                                                        </label>
                                                        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                                                            <Badge variant="info">
                                                                {USER_ROLE_LABELS[user?.role as keyof typeof USER_ROLE_LABELS] || user?.role}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-3">
                                                <Button type="submit" disabled={isUpdating}>
                                                    {isUpdating ? 'Сохранение...' : 'Сохранить изменения'}
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>

                                {/* Безопасность */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <KeyIcon className="w-5 h-5" />
                                            Безопасность
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <div>
                                                    <h3 className="font-medium text-gray-900 dark:text-white">Смена пароля</h3>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                        Обновите свой пароль для повышения безопасности
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                                                >
                                                    {showPasswordForm ? 'Скрыть' : 'Изменить пароль'}
                                                </Button>
                </div>

                {showPasswordForm && (
                                                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                <div className="flex gap-3">
                    <Button type="submit" disabled={isUpdating}>
                                                                {isUpdating ? 'Сохранение...' : 'Обновить пароль'}
                    </Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setShowPasswordForm(false);
                                reset({
                                    name: user?.name,
                                    login: user?.login || '',
                                    currentPassword: '',
                                    newPassword: ''
                                });
                            }}
                        >
                                                                Отменить
                                                            </Button>
                                                        </div>
                                                    </form>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Действия */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <ArrowRightStartOnRectangleIcon className="w-5 h-5" />
                                            Действия
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                                                <div>
                                                    <h3 className="font-medium text-red-900 dark:text-red-200">Выйти из системы</h3>
                                                    <p className="text-sm text-red-600 dark:text-red-400">
                                                        Завершить текущую сессию и выйти из системы
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    onClick={handleLogout}
                                                    className="bg-red-600 hover:bg-red-700 text-white"
                                                >
                                                    Выйти
                        </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </div>
                    )}
                </div>
        </div>
    );
}