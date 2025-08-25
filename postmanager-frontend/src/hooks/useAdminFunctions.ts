import { useGetTaskGroupsQuery } from '@/store/api/trainer.api';
import { DeleteTarget } from './useTrainerState';

interface UseAdminFunctionsProps {
  refetch: () => void;
  showNotification: (message: string, type: 'success' | 'error') => void;
  setDeleteTarget: (target: DeleteTarget | null) => void;
  setShowConfirmModal: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingTask: (task: any) => void;
  setNewTask: (task: any) => void;
}

export const useAdminFunctions = ({
  refetch,
  showNotification,
  setDeleteTarget,
  setShowConfirmModal,
  setEditingTask,
  setNewTask
}: UseAdminFunctionsProps) => {

  const handleCreateTask = async (newTask: any) => {
    try {
      const response = await fetch('http://localhost:5000/api/db/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask)
      });

      if (!response.ok) throw new Error('Failed to create task');

      setNewTask({ title: '', description: '', command: '', hint: '', groupName: '' });
      refetch();
      showNotification('Задача успешно создана', 'success');
    } catch (error) {
      console.error('Error creating task:', error);
      showNotification('Ошибка создания задачи', 'error');
    }
  };

  const handleUpdateTask = async (editingTask: any) => {
    if (!editingTask) return;

    try {
      const response = await fetch(`http://localhost:5000/api/db/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTask)
      });

      if (!response.ok) throw new Error('Failed to update task');

      setEditingTask(null);
      refetch();
      showNotification('Задача обновлена', 'success');
    } catch (error) {
      console.error('Error updating task:', error);
      showNotification('Ошибка обновления задачи', 'error');
    }
  };

  const confirmDelete = async (deleteTarget: DeleteTarget) => {
    try {
      const endpoint = deleteTarget.type === 'task'
        ? `http://localhost:5000/api/db/tasks/${deleteTarget.id}`
        : `http://localhost:5000/api/employees/${deleteTarget.id}`;

      const response = await fetch(endpoint, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');

      setShowConfirmModal(false);
      setDeleteTarget(null);
      refetch();
      showNotification(`${deleteTarget.type === 'task' ? 'Задача' : 'Сотрудник'} удален${deleteTarget.type === 'task' ? 'а' : ''}`, 'success');
    } catch (error) {
      console.error('Error deleting:', error);
      showNotification('Ошибка удаления', 'error');
    }
  };



  return {
    handleCreateTask,
    handleUpdateTask,
    confirmDelete
  };
};
