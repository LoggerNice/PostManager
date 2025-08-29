'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import AnalysisBoard from './Analysis';

export default function AnalysisPage() {
    const router = useRouter();
    const { isAuthenticated, isLoading, user } = useAuth();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.replace('/auth');
        }
    }, [isAuthenticated, isLoading, router]);

    // Проверка роли пользователя - доступ только для администраторов и начальников
    useEffect(() => {
        if (!isLoading && isAuthenticated && user) {
            if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
                router.replace('/');
            }
        }
    }, [isAuthenticated, isLoading, user, router]);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Загрузка...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        Перенаправление на страницу авторизации...
                    </p>
                </div>
            </div>
        );
    }

    // Проверка роли пользователя
    if (user && user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-center">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                        У вас нет прав доступа к анализу
                    </p>
                </div>
            </div>
        );
    }

    return <AnalysisBoard />;
}
