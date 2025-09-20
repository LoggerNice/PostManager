'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';
import { 
  ChartBarIcon, 
  UsersIcon, 
  BuildingOfficeIcon, 
  CogIcon, 
  DocumentTextIcon,
  ShieldCheckIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import AdminStats from '@/components/admin/AdminStats';
import UserManagement from '@/components/admin/UserManagement';
import DepartmentManagement from '@/components/admin/DepartmentManagement';
import SystemSettings from '@/components/admin/SystemSettings';
import SystemLogs from '@/components/admin/SystemLogs';
import CyclicTasksManagement from '@/components/admin/CyclicTasksManagement';
import Loader from '@/components/loader/Loader';

type AdminTab = 'dashboard' | 'users' | 'departments' | 'planning' | 'settings' | 'logs';

export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [isClient, setIsClient] = useState(false);

  // Решение проблемы гидратации - показываем лоадер пока не загрузится клиент
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Показываем лоадер пока не загрузились данные пользователя или клиент
  if (!isClient || !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <Loader />
      </div>
    );
  }

  // Проверка прав доступа
  if (user.role !== UserRole.ADMIN && user.role !== UserRole.MANAGER) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
        <div className="text-center p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
          <ShieldCheckIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Доступ запрещен
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            У вас нет прав доступа к админ панели
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'Дашборд', icon: ChartBarIcon },
    { id: 'users', label: 'Пользователи', icon: UsersIcon },
    { id: 'departments', label: 'Отделы', icon: BuildingOfficeIcon },
    { id: 'planning', label: 'Планирование', icon: CalendarDaysIcon },
    { id: 'settings', label: 'Настройки', icon: CogIcon },
    { id: 'logs', label: 'Логи', icon: DocumentTextIcon },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminStats />;
      case 'users':
        return <UserManagement />;
      case 'departments':
        return <DepartmentManagement />;
      case 'planning':
        return <CyclicTasksManagement />;
      case 'settings':
        return <SystemSettings />;
      case 'logs':
        return <SystemLogs />;
      default:
        return <AdminStats />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 rounded-lg">
      {/* Заголовок */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-t-lg">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Админ панель
          </h1>
        </div>
      </div>

      {/* Навигационные вкладки */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`
                  flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Контент */}
      <div className="p-6">
        {renderContent()}
      </div>
    </div>
  );
}
