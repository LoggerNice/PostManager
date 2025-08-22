'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon, 
  MagnifyingGlassIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { 
  useGetAllUsersAdminQuery,
  useCreateUserAdminMutation,
  useUpdateUserAdminMutation,
  useDeleteUserAdminMutation
} from '@/store/api/admin.api';
import { useGetDepartmentsQuery } from '@/store/api/department.api';
import { CreateUserFormData, EditUserFormData } from '@/types/admin.types';
import { IUser } from '@/types/user.types';
import { UserRole, USER_ROLE_LABELS } from '@/constants';
import { Input } from '@/components/ui/input/Input';
import { Select } from '@/components/ui/select/Select';
import { Button } from '@/components/ui/button/Button';
import { Modal } from '@/components/ui';
import Loader from '@/components/loader/Loader';

export default function UserManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showPasswords, setShowPasswords] = useState<{ [key: number]: boolean }>({});

  const { data: users = [], isLoading, refetch } = useGetAllUsersAdminQuery();
  const { data: departments = [] } = useGetDepartmentsQuery();
  const [createUser] = useCreateUserAdminMutation();
  const [updateUser] = useUpdateUserAdminMutation();
  const [deleteUser] = useDeleteUserAdminMutation();

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors }
  } = useForm<CreateUserFormData>();

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors }
  } = useForm<EditUserFormData>();

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.login?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onCreateUser = async (data: CreateUserFormData) => {
    try {
      await createUser(data).unwrap();
      setIsCreateModalOpen(false);
      resetCreate();
      refetch();
    } catch (error) {
      console.error('Ошибка создания пользователя:', error);
    }
  };

  const onEditUser = async (data: EditUserFormData) => {
    if (!editingUser) return;
    
    // Убираем пустой пароль из данных
    const cleanData = { ...data };
    if (!cleanData.password || cleanData.password.trim() === '') {
      delete cleanData.password;
    }
    
    try {
      await updateUser({ id: editingUser.id, data: cleanData }).unwrap();
      setEditingUser(null);
      resetEdit();
      refetch();
    } catch (error: any) {
      console.error('Ошибка обновления пользователя:', error);
      const errorMessage = error?.data?.message || error?.message || 'Неизвестная ошибка';
      alert(`Ошибка обновления пользователя: ${errorMessage}`);
    }
  };

  const onDeleteUser = async (userId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этого пользователя?')) {
      try {
        await deleteUser(userId).unwrap();
        refetch();
      } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
      }
    }
  };

  const startEdit = (user: IUser) => {
    setEditingUser(user);
    setEditValue('name', user.name || '');
    setEditValue('login', user.login || '');
    setEditValue('role', user.role || '');
    setEditValue('departmentId', user.departmentId || 0);
  };

  const togglePasswordVisibility = (userId: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const roleOptions = Object.entries(USER_ROLE_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  const departmentOptions = departments.map(dept => ({
    value: dept.id.toString(),
    label: dept.name
  }));

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex justify-between items-center и">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Управление пользователями
        </h2>
        <Button className='bg-blue-500 hover:bg-blue-600' onClick={() => setIsCreateModalOpen(true)}>
          Добавить пользователя
        </Button>
      </div>

      {/* Поиск */}
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Поиск пользователей..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        />
      </div>

      {/* Таблица пользователей */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Пользователь
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Роль
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Отдел
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Дата создания
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.login}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === UserRole.ADMIN ? 'bg-red-100 text-red-800' :
                      user.role === UserRole.MANAGER ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {USER_ROLE_LABELS[user.role as UserRole] || user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {user.department?.name || 'Не назначен'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => startEdit(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => onDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Модальное окно создания пользователя */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Создать пользователя"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit(onCreateUser)} className="space-y-4">
          <Input
            label="Имя"
            {...registerCreate('name', { required: 'Имя обязательно' })}
            error={createErrors.name?.message}
          />
          
          <Input
            label="Логин"
            {...registerCreate('login', { required: 'Логин обязателен' })}
            error={createErrors.login?.message}
          />
          
          <div className="relative">
            <Input
              label="Пароль"
              type={showPasswords[0] ? 'text' : 'password'}
              {...registerCreate('password', { required: 'Пароль обязателен', minLength: { value: 6, message: 'Минимум 6 символов' } })}
              error={createErrors.password?.message}
            />
            <button
              type="button"
              onClick={() => togglePasswordVisibility(0)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {showPasswords[0] ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
          
          <Select
            label="Роль"
            {...registerCreate('role', { required: 'Роль обязательна' })}
            options={roleOptions}
            error={createErrors.role?.message}
          />
          
          <Select
            label="Отдел"
            {...registerCreate('departmentId', { required: 'Отдел обязателен', valueAsNumber: true })}
            options={departmentOptions}
            error={createErrors.departmentId?.message}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
              Отмена
            </Button>
            <Button type="submit">
              Создать
            </Button>
          </div>
        </form>
      </Modal>

      {/* Модальное окно редактирования */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Редактировать пользователя"
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit(onEditUser)} className="space-y-4">
          <Input
            label="Имя"
            {...registerEdit('name', { required: 'Имя обязательно' })}
            error={editErrors.name?.message}
          />
          
          <Input
            label="Логин"
            {...registerEdit('login', { required: 'Логин обязателен' })}
            error={editErrors.login?.message}
          />
          
          <div className="relative">
            <Input
              label="Новый пароль (оставьте пустым, чтобы не изменять)"
              type={editingUser && showPasswords[editingUser.id] ? 'text' : 'password'}
              {...registerEdit('password')}
              error={editErrors.password?.message}
            />
            <button
              type="button"
              onClick={() => editingUser && togglePasswordVisibility(editingUser.id)}
              className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
            >
              {editingUser && showPasswords[editingUser.id] ? <EyeSlashIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
            </button>
          </div>
          
          <Select
            label="Роль"
            {...registerEdit('role', { required: 'Роль обязательна' })}
            options={roleOptions}
            error={editErrors.role?.message}
          />
          
          <Select
            label="Отдел"
            {...registerEdit('departmentId', { required: 'Отдел обязателен', valueAsNumber: true })}
            options={departmentOptions}
            error={editErrors.departmentId?.message}
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setEditingUser(null)}>
              Отмена
            </Button>
            <Button type="submit">
              Сохранить
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
