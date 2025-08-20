'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { PlusIcon, PencilIcon, TrashIcon, UsersIcon, FolderIcon } from '@heroicons/react/24/outline';
import { 
  useGetAllDepartmentsAdminQuery,
  useCreateDepartmentAdminMutation,
  useUpdateDepartmentAdminMutation,
  useDeleteDepartmentAdminMutation
} from '@/store/api/admin.api';
import { CreateDepartmentFormData } from '@/types/admin.types';
import { IDepartmentWithRelations } from '@/types/department.types';
import { Input } from '@/components/ui/input/Input';
import { Button } from '@/components/ui/button/Button';
import { Modal } from '@/components/ui';
import Loader from '@/components/loader/Loader';

export default function DepartmentManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<IDepartmentWithRelations | null>(null);

  const { data: departments = [], isLoading, refetch } = useGetAllDepartmentsAdminQuery();
  const [createDepartment] = useCreateDepartmentAdminMutation();
  const [updateDepartment] = useUpdateDepartmentAdminMutation();
  const [deleteDepartment] = useDeleteDepartmentAdminMutation();

  const {
    register: registerCreate,
    handleSubmit: handleCreateSubmit,
    reset: resetCreate,
    formState: { errors: createErrors }
  } = useForm<CreateDepartmentFormData>();

  const {
    register: registerEdit,
    handleSubmit: handleEditSubmit,
    reset: resetEdit,
    setValue: setEditValue,
    formState: { errors: editErrors }
  } = useForm<CreateDepartmentFormData>();

  const onCreateDepartment = async (data: CreateDepartmentFormData) => {
    try {
      await createDepartment(data).unwrap();
      setIsCreateModalOpen(false);
      resetCreate();
      refetch();
    } catch (error) {
      console.error('Ошибка создания отдела:', error);
    }
  };

  const onEditDepartment = async (data: CreateDepartmentFormData) => {
    if (!editingDepartment) return;
    
    try {
      await updateDepartment({ id: editingDepartment.id, data }).unwrap();
      setEditingDepartment(null);
      resetEdit();
      refetch();
    } catch (error) {
      console.error('Ошибка обновления отдела:', error);
    }
  };

  const onDeleteDepartment = async (departmentId: number) => {
    if (window.confirm('Вы уверены, что хотите удалить этот отдел? Все пользователи будут отвязаны от него.')) {
      try {
        await deleteDepartment(departmentId).unwrap();
        refetch();
      } catch (error) {
        console.error('Ошибка удаления отдела:', error);
      }
    }
  };

  const startEdit = (department: IDepartmentWithRelations) => {
    setEditingDepartment(department);
    setEditValue('name', department.name);
  };

  if (isLoading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Заголовок и действия */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">
          Управление отделами
        </h2>
        <Button className='bg-blue-500 hover:bg-blue-600' onClick={() => setIsCreateModalOpen(true)}>
          Добавить отдел
        </Button>
      </div>

      {/* Сетка отделов */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((department) => (
          <div
            key={department.id}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {department.name}
              </h3>
              <div className="flex space-x-2">
                <button
                  onClick={() => startEdit(department)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                  title="Редактировать"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDeleteDepartment(department.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                  title="Удалить"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Статистика отдела */}
            <div className="space-y-3">
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <UsersIcon className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  Сотрудников: {department.users?.length || 0}
                </span>
              </div>
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <FolderIcon className="h-4 w-4 mr-2" />
                <span className="text-sm">
                  Проектов: {department.projects?.length || 0}
                </span>
              </div>
            </div>

            {/* Список пользователей (первые 3) */}
            {department.users && department.users.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Сотрудники:
                </p>
                <div className="space-y-1">
                  {department.users.slice(0, 3).map((user: any) => (
                    <p key={user.id} className="text-sm text-gray-700 dark:text-gray-300">
                      {user.name}
                    </p>
                  ))}
                  {department.users.length > 3 && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      и еще {department.users.length - 3}...
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Модальное окно создания отдела */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Создать отдел"
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit(onCreateDepartment)} className="space-y-4">
          <Input
            label="Название отдела"
            {...registerCreate('name', { required: 'Название обязательно' })}
            error={createErrors.name?.message}
            placeholder="Введите название отдела"
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
        isOpen={!!editingDepartment}
        onClose={() => setEditingDepartment(null)}
        title="Редактировать отдел"
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit(onEditDepartment)} className="space-y-4">
          <Input
            label="Название отдела"
            {...registerEdit('name', { required: 'Название обязательно' })}
            error={editErrors.name?.message}
            placeholder="Введите название отдела"
          />
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setEditingDepartment(null)}>
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
