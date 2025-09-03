'use client';

import React, { useEffect, useState } from 'react';
import { XMarkIcon, UserIcon } from '@heroicons/react/24/solid';
import Modal from '@/components/ui/Modal';
import { useGetUsersQuery } from '@/store/api/user.api';

interface User {
  id: number;
  name: string;
  department?: {
    id: number;
    name: string;
  };
}

interface UserInfo {
  lastName: string;
  firstName: string;
  department: string;
  isGuest?: boolean;
}

interface UserInfoModalProps {
  onClose: () => void;
  onSubmit: (userInfo: UserInfo) => void;
}

export default function UserInfoModal({ onClose, onSubmit }: UserInfoModalProps) {
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [department, setDepartment] = useState('');
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [error, setError] = useState('');

  // Запрос пользователей для автодополнения
  const { data: allUsers = [], isLoading, error: usersError } = useGetUsersQuery();

  useEffect(() => {
    if (usersError) {
      setError('Не удалось загрузить пользователей');
    }
  }, [usersError]);

  useEffect(() => {
    if (!lastName) {
      setSuggestions([]);
      setDepartment('');
      return;
    }

    const ln = lastName.toLowerCase();
    const filtered = allUsers.filter(user =>
      String(user.name || '').toLowerCase().startsWith(ln)
    );
    setSuggestions(filtered.slice(0, 5));

    if (filtered.length === 1) {
      const user = filtered[0];
      setDepartment(user.department?.name || '');
    }
  }, [lastName, allUsers]);

  const isValid = lastName.trim() !== '' && firstName.trim() !== '';

  const handlePick = (user: User) => {
    const nameParts = user.name?.split(' ') || [];
    setLastName(nameParts[0] || '');
    setFirstName(nameParts[1] || '');
    setDepartment(user.department?.name || '');
    setSuggestions([]);
  };

  const submit = () => {
    if (!isValid) return;
    onSubmit({ lastName, firstName, department, isGuest: false });
  };

  const submitAsGuest = () => {
    onSubmit({ 
      lastName: 'Гость', 
      firstName: '', 
      department: 'Гостевой доступ', 
      isGuest: true 
    });
  };

  return (
    <Modal onClose={onClose} className="max-w-lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Информация о пользователе
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Фамилия */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Фамилия (обязательно)
            </label>
            <div className="relative">
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Иванов"
              />
              
              {suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      Найдено: {suggestions.length}
                    </span>
                  </div>
                  {suggestions.map(s => (
                    <button
                      key={`${s.name}`}
                      className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                      onClick={() => handlePick(s)}
                    >
                      <div className="font-medium text-gray-900 dark:text-white">
                        {s.name}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Имя */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Имя (обязательно)
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Иван"
            />
          </div>

          {/* Отдел */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Отдел
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 cursor-not-allowed"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="УКОИ"
              disabled
            />
          </div>
        </div>
        {/* Действия */}
        <div className="flex flex-col gap-2 mt-6">
          <button
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            onClick={submit}
            disabled={!isValid || isLoading}
          >
            {isLoading ? 'Загрузка...' : 'Продолжить'}
          </button>
          
          <button
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            onClick={submitAsGuest}
          >
            <UserIcon className="h-4 w-4" />
            Войти как гость
          </button>
          
          <button
            className="w-full px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            onClick={onClose}
          >
            Отмена
          </button>
        </div>
      </div>
    </Modal>
  );
}
