'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  CogIcon, 
  DocumentArrowDownIcon, 
  TrashIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { 
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useCreateBackupMutation,
  useClearCacheMutation
} from '@/store/api/admin.api';
import { SystemSettings } from '@/types/admin.types';
import { Input } from '@/components/ui/input/Input';
import { Select } from '@/components/ui/select/Select';
import { Button } from '@/components/ui/button/Button';
import Loader from '@/components/loader/Loader';

export default function SystemSettings() {
  const [successMessage, setSuccessMessage] = useState('');
  const [backupUrl, setBackupUrl] = useState('');

  const { data: settings, isLoading } = useGetSystemSettingsQuery();
  const [updateSettings] = useUpdateSystemSettingsMutation();
  const [createBackup] = useCreateBackupMutation();
  const [clearCache] = useClearCacheMutation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<SystemSettings>();

  useEffect(() => {
    if (settings) {
      reset(settings);
    }
  }, [settings, reset]);

  const onSaveSettings = async (data: SystemSettings) => {
    try {
      await updateSettings(data).unwrap();
      setSuccessMessage('Настройки успешно сохранены');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
    }
  };

  const onCreateBackup = async () => {
    try {
      const result = await createBackup().unwrap();
      setBackupUrl(result.downloadUrl);
      setSuccessMessage(`Резервная копия создана успешно! Файл: ${result.fileName || 'backup.sql'}`);
      
      // Автоматически начинаем скачивание с токеном авторизации
      if (result.downloadUrl) {
        await downloadBackupFile(result.downloadUrl, result.fileName || 'backup.sql');
      }
      
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error: any) {
      console.error('Ошибка создания резервной копии:', error);
      const errorMessage = error?.data?.message || error?.message || 'Неизвестная ошибка';
      alert(`Ошибка создания резервной копии: ${errorMessage}`);
    }
  };

  const downloadBackupFile = async (downloadUrl: string, fileName: string) => {
    try {
      // Получаем токен из cookies (более надежная функция)
      const getCookie = (name: string): string => {
        if (typeof document === 'undefined') return '';
        
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        
        for (let i = 0; i < ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) === ' ') c = c.substring(1, c.length);
          if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return '';
      };

      const token = getCookie('accessToken');
      
      if (!token) {
        throw new Error('Токен авторизации не найден');
      }

      console.log('Токен найден:', token.substring(0, 20) + '...');
      
      // Делаем запрос с токеном авторизации
      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Статус ответа:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Ошибка ответа сервера:', errorText);
        throw new Error(`Ошибка скачивания: ${response.status} ${response.statusText}`);
      }

      // Получаем данные как blob
      const blob = await response.blob();
      console.log('Размер файла:', blob.size, 'байт');
      
      // Создаем URL для blob и скачиваем
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Освобождаем память
      window.URL.revokeObjectURL(blobUrl);
      
      console.log('Файл успешно скачан:', fileName);
    } catch (error) {
      console.error('Ошибка при скачивании файла:', error);
      alert(`Ошибка при скачивании файла резервной копии: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const onClearCache = async () => {
    if (window.confirm('Вы уверены, что хотите очистить кэш? Это может временно замедлить работу системы.')) {
      try {
        await clearCache().unwrap();
        setSuccessMessage('Кэш успешно очищен');
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (error) {
        console.error('Ошибка очистки кэша:', error);
      }
    }
  };

  const roleOptions = [
    { value: 'USER', label: 'Пользователь' },
    { value: 'MANAGER', label: 'Менеджер' },
    { value: 'ADMIN', label: 'Администратор' }
  ];

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900 dark:text-white">
        Системные настройки
      </h2>

      {/* Сообщение об успехе */}
      {successMessage && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
          <div className="flex">
            <CheckCircleIcon className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                {successMessage}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Основные настройки */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
            <CogIcon className="h-5 w-5 mr-2" />
            Основные настройки
          </h3>

          <form onSubmit={handleSubmit(onSaveSettings)} className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('maintenanceMode')}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900 dark:text-white">
                  Режим технического обслуживания
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">
                Отключает доступ к системе для всех пользователей кроме администраторов
              </p>
            </div>

            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  {...register('allowUserRegistration')}
                  className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-900 dark:text-white">
                  Разрешить регистрацию пользователей
                </span>
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-6 mt-1">
                Позволяет новым пользователям создавать аккаунты
              </p>
            </div>

            <Select
              label="Роль по умолчанию для новых пользователей"
              {...register('defaultUserRole', { required: 'Выберите роль по умолчанию' })}
              options={roleOptions}
              error={errors.defaultUserRole?.message}
            />

            <Input
              label="Время сессии (минуты)"
              type="number"
              {...register('sessionTimeout', { required: 'Укажите время сессии', min: { value: 5, message: 'Минимум 5 минут' } })}
              error={errors.sessionTimeout?.message}
            />

            <Input
              label="Максимальный размер файла (МБ)"
              type="number"
              {...register('maxFileSize', { required: 'Укажите размер файла', min: { value: 1, message: 'Минимум 1 МБ' } })}
              error={errors.maxFileSize?.message}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Разрешенные типы файлов
              </label>
              <textarea
                {...register('allowedFileTypes')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
                placeholder="pdf,doc,docx,jpg,png,gif"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Перечислите разрешенные расширения через запятую
              </p>
            </div>

            <Button type="submit" className="w-full">
              Сохранить настройки
            </Button>
          </form>
        </div>

        {/* Системные операции */}
        <div className="space-y-6">
          {/* Резервное копирование */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
              Резервное копирование
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Создайте резервную копию базы данных и файлов системы.
            </p>

            <Button onClick={onCreateBackup} className="w-full mb-4">
              Создать резервную копию
            </Button>

            {backupUrl && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                  Резервная копия готова к загрузке:
                </p>
                <button
                  onClick={() => downloadBackupFile(backupUrl, 'backup.sql')}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-transparent border-none p-0"
                >
                  Скачать резервную копию
                </button>
              </div>
            )}
          </div>

          {/* Очистка кэша */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
              <TrashIcon className="h-5 w-5 mr-2" />
              Очистка кэша
            </h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Очистите системный кэш для устранения проблем с производительностью.
            </p>

            <Button 
              onClick={onClearCache} 
              variant="secondary"
              className="w-full"
            >
              Очистить кэш
            </Button>
          </div>

          {/* Предупреждения */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                  Важная информация
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Режим обслуживания отключает доступ для всех пользователей</li>
                    <li>Регулярно создавайте резервные копии</li>
                    <li>Очистка кэша может временно замедлить систему</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
