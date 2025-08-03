'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
    FolderIcon,
    ArrowRightOnRectangleIcon,
    BeakerIcon,
    Bars3Icon,
} from '@heroicons/react/24/solid';
import { ChevronDownIcon, ChevronLeftIcon, BellIcon } from '@heroicons/react/24/outline';
import { useGetUserProjectsQuery } from '@/store/api/project.api';
import { getCookie } from '@/utils/cookie';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { PAGE_URL } from '@/constants';
import { useSidebar } from '@/contexts/SidebarContext';
import { useWebSocketContext } from '@/contexts/WebSocketContext';
import NotificationHistory from '@/components/ui/NotificationHistory';
import { useNotificationHistory } from '@/contexts/NotificationContext';

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const { collapsed, toggleSidebar } = useSidebar();
    const { notifications } = useWebSocketContext();
    const { unreadCount } = useNotificationHistory();
    
    const [projectsOpen, setProjectsOpen] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [userName, setUserName] = useState<string | null>(null);
    const [notificationHistoryOpen, setNotificationHistoryOpen] = useState(false);

    useEffect(() => {
        setUserId(getCookie('userId'));
        setUserName(getCookie('userName'));
    }, []);

    const { data: projects = [], isLoading: projectsLoading } = useGetUserProjectsQuery(parseInt(userId || '0'), {
        skip: !userId,
        pollingInterval: 10000,
        refetchOnFocus: true,
        refetchOnReconnect: true
    });

    const handleLogout = () => {
        dispatch(logout());
        router.push(PAGE_URL.AUTH);
    };

    const isActive = pathname === PAGE_URL.ADMIN;

    return (
        <>
            <div className={`fixed left-0 top-0 bg-gray-900 text-white h-screen flex flex-col border-r border-gray-800 transition-all duration-300 ease-in-out ${collapsed ? 'w-16' : 'w-64'}`}>
                {/* Верхняя панель с кнопкой */}
                <div className={`p-4 flex ${collapsed ? 'justify-center' : 'justify-between'} items-center`}>
                    {!collapsed && <h1 className="ml-2 text-xl font-bold">Postman</h1>}
                    <button
                        onClick={toggleSidebar}
                        className={`p-2 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center ${collapsed ? '' : 'ml-auto'}`}
                        title={collapsed ? 'Развернуть' : 'Свернуть'}
                    >
                        {collapsed ? <Bars3Icon className="h-6 w-6" /> : <ChevronLeftIcon className="h-6 w-6" />}
                    </button>
                </div>

                {/* Навигация */}
                <nav className="mt-2 flex-1 min-w-0 flex flex-col gap-2">
                    <Link
                        key={'Админ панель'}
                        href={PAGE_URL.ADMIN}
                        className={`flex items-center ${collapsed ? 'justify-center' : ''} mx-2 p-2 rounded-lg transition-colors ${isActive ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        title={collapsed ? 'Админ панель' : undefined}
                    >
                        <BeakerIcon className="h-6 w-6" />
                        {!collapsed && <span className="ml-3">Админ панель</span>}
                    </Link>

                    {/* Проекты с выпадающим списком */}
                    <div className="mx-2">
                        <button
                            className={`flex items-center w-full p-2 rounded-lg transition-colors ${collapsed ? 'justify-center' : ''} ${pathname.startsWith(PAGE_URL.PROFILE) ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                            onClick={() => {
                                if (collapsed) {
                                    toggleSidebar();
                                    setProjectsOpen(true);
                                } else {
                                    setProjectsOpen((v) => !v);
                                }
                            }}
                            title={collapsed ? 'Проекты' : undefined}
                        >
                            <FolderIcon className="h-6 w-6" />
                            {!collapsed && <><span className="ml-3 flex-1 text-left">Проекты</span><ChevronDownIcon className={`h-5 w-5 ml-auto transition-transform ${projectsOpen ? 'rotate-180' : ''}`} /></>}
                        </button>
                        {projectsOpen && !collapsed && (
                            <div className="ml-8 mt-2 space-y-1">
                                {projects.length === 0 && !projectsLoading && (
                                    <div className="text-gray-500 text-sm px-2">Нет проектов</div>
                                )}
                                {projects.map((project) => (
                                    <Link
                                        key={project.id}
                                        href={`/projects/${project.id}`}
                                        className={`block px-2 py-1 rounded hover:bg-gray-800 hover:text-white text-gray-300 text-sm ${pathname === `/projects/${project.id}` ? 'bg-gray-800 text-white' : ''}`}
                                    >
                                        {project.title}
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </nav>

                {/* Профиль и выход */}
                <div className="p-2 flex flex-col gap-2 mt-auto">
                    {collapsed ? (
                        // Свернутое состояние: уведомления сверху, профиль посередине, выход снизу
                        <>
                            <button
                                onClick={() => setNotificationHistoryOpen(true)}
                                className="flex items-center justify-center rounded-lg p-2 text-gray-400 hover:text-white hover:bg-gray-800 relative"
                                title="История уведомлений"
                            >
                                <BellIcon className="h-6 w-6" />
                                {unreadCount > 0 && (
                                    <div className="absolute top-1 right-2 bg-red-500 rounded-full h-2 w-2"></div>
                                )}
                            </button>
                            <Link href={PAGE_URL.PROFILE} className={`flex items-center justify-center rounded-lg p-2 ${pathname === PAGE_URL.PROFILE ? 'text-white bg-gray-800' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                                    <div className="absolute w-3 h-3 bg-green-500 rounded-full bottom-0 right-0 border-2 border-gray-900"></div>
                                    <Image
                                        src="/avatar.png"
                                        alt="Аватар пользователя"
                                        fill
                                        className="object-cover"
                                        sizes="32px"
                                    />
                                </div>
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center justify-center p-2 mb-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-gray-800"
                                title="Выйти"
                            >
                                <ArrowRightOnRectangleIcon className="h-6 w-6" />
                            </button>
                        </>
                    ) : (
                        // Развернутое состояние: уведомления сверху, профиль снизу
                        <div className="space-y-2">
                            <button
                                onClick={() => setNotificationHistoryOpen(true)}
                                className="flex items-center justify-between w-full p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 relative"
                                title="История уведомлений"
                            >
                                <div className="flex items-center space-x-3">
                                    <BellIcon className="h-6 w-6" />
                                    <span className="text-sm font-medium">Уведомления</span>
                                </div>
                                {unreadCount > 0 && (
                                    <div className="bg-red-500 rounded-full h-2 w-2"></div>
                                )}
                            </button>
                            <div className="flex items-center justify-between rounded-lg p-2 hover:text-white hover:bg-gray-800">
                                <Link href={PAGE_URL.PROFILE} className="flex items-center space-x-3 ">
                                    <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center ">
                                        <div className="absolute w-3 h-3 bg-green-500 rounded-full bottom-0 right-0 border-2 border-gray-900"></div>
                                        <Image
                                            src="/avatar.png"
                                            alt="Аватар пользователя"
                                            fill
                                            className="object-cover"
                                            sizes="32px"
                                        />
                                    </div>
                                    <span className="text-sm font-medium">{userName || 'Загрузка...'}</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-gray-800 rounded"
                                    title="Выйти"
                                >
                                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Модальное окно истории уведомлений */}
            <NotificationHistory 
                isOpen={notificationHistoryOpen}
                onClose={() => setNotificationHistoryOpen(false)}
            />
        </>
    );
}