'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { 
    ClipboardDocumentListIcon,
    FolderIcon,
    ArrowRightOnRectangleIcon,
    BeakerIcon,
} from '@heroicons/react/24/solid';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { useGetUserProjectsQuery } from '@/store/api/project.api';
import { getCookie } from '@/utils/cookie';
import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';

const tabs = [
    { name: 'Задачи', href: '/', icon: ClipboardDocumentListIcon },
    { name: 'Тест', href: '/test', icon: BeakerIcon },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const dispatch = useAppDispatch();
    const [projectsOpen, setProjectsOpen] = useState(false);
    const userId = getCookie('userId');

    const { data: projects = [] } = useGetUserProjectsQuery(parseInt(userId || '0'), {
        skip: !userId
    });

    const handleLogout = () => {
        dispatch(logout());
        router.push('/auth');
    };

    return (
        <div className="fixed left-0 top-0 w-64 bg-gray-900 text-white h-screen flex flex-col border-r border-gray-800">
            <div className="p-4 flex items-center justify-between">
                <h1 className="ml-4 text-xl font-bold">Postwork</h1>
            </div>
            
            <nav className="mt-2 flex-1">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.name}
                            href={tab.href}
                            className={`flex items-center mx-4 py-3 my-2 rounded-lg *:transition-colors 
                                ${isActive 
                                    ? 'text-white bg-gray-800' 
                                    : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        >
                            <div className="flex items-center px-3">
                                <tab.icon className="h-6 w-6" />
                                <span className="ml-3">{tab.name}</span>
                            </div>
                        </Link>
                    );
                })}

                {/* Проекты с выпадающим списком */}
                <div className="mx-4 my-2">
                    <button
                        className={`flex items-center w-full px-3 py-3 rounded-lg transition-colors ${pathname.startsWith('/projects') ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                        onClick={() => setProjectsOpen((v) => !v)}
                    >
                        <FolderIcon className="h-6 w-6" />
                        <span className="ml-3 flex-1 text-left">Проекты</span>
                        <ChevronDownIcon className={`h-5 w-5 ml-auto transition-transform ${projectsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {projectsOpen && (
                        <div className="ml-8 mt-2 space-y-1">
                            {projects.length === 0 && (
                                <div className="text-gray-500 text-sm">Нет проектов</div>
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

            <div className="p-4">
                <div className={`flex items-center justify-between rounded-lg p-2
                    ${pathname === '/profile'
                        ? 'text-white bg-gray-800' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}>
                    <Link href="/profile" className="flex items-center space-x-3">
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
                        <span className="text-sm font-medium">
                            {getCookie('userName')}
                        </span>
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="ml-4 px-3 py-1 text-sm text-red-400 hover:text-red-300 hover:bg-gray-800 rounded"
                    >
                        <ArrowRightOnRectangleIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}