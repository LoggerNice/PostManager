'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function Home() {
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        console.log('Home page - isAuthenticated:', isAuthenticated, 'isLoading:', isLoading);
        
        // Если пользователь не авторизован, перенаправляем на страницу авторизации
        if (!isLoading && !isAuthenticated) {
            console.log('Home: User not authenticated, redirecting to auth');
            router.replace('/auth');
        }
    }, [isAuthenticated, isLoading, router]);

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

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                Добро пожаловать в PostManager
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
                Система управления проектами и задачами
            </p>
        </div>
    );
}