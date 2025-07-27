import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Card } from '@/components/ui';
import { MultiSelect } from '@/components/ui/multi-select/MultiSelect';
import { useGetUsersQuery } from '@/store/api/user.api';
import { useGetTaskAssigneesQuery, useAddTaskAssigneesMutation, useRemoveTaskAssigneesMutation } from '@/store/api/task.api';
import { IUser } from '@/types/user.types';
import { TaskAssignee } from '@/types/task.types';

interface AssigneesModalProps {
    visible: boolean;
    onClose: () => void;
    taskId: string;
}

interface AssigneeOption {
    value: number;
    label: string;
    user: IUser;
}

export const AssigneesModal: React.FC<AssigneesModalProps> = ({
    visible,
    onClose,
    taskId
}) => {
    const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
    const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);

    // Получаем всех пользователей
    const { data: users = [] } = useGetUsersQuery();
    
    // Получаем текущих исполнителей задачи
    const { data: currentAssignees = [], refetch: refetchAssignees } = useGetTaskAssigneesQuery(taskId, {
        skip: !visible
    });

    // Мутации для добавления и удаления исполнителей
    const [addAssignees] = useAddTaskAssigneesMutation();
    const [removeAssignees] = useRemoveTaskAssigneesMutation();

    // Подготавливаем опции для мультиселекта
    useEffect(() => {
        const options: AssigneeOption[] = users.map(user => ({
            value: user.id,
            label: `${user.name} (${user.department?.name || 'Без отдела'})`,
            user
        }));
        setAssigneeOptions(options);
    }, [users]);

    // Устанавливаем текущих исполнителей при открытии модала
    useEffect(() => {
        if (visible && currentAssignees.length > 0) {
            const currentAssigneeIds = currentAssignees.map((assignee: TaskAssignee) => 
                assignee.user.id.toString()
            );
            setSelectedAssignees(currentAssigneeIds);
        } else if (visible) {
            setSelectedAssignees([]);
        }
    }, [visible, currentAssignees]);

    const handleSave = async () => {
        try {
            const selectedUserIds = selectedAssignees.map(id => parseInt(id));
            const currentUserIds = currentAssignees.map((assignee: TaskAssignee) => assignee.user.id);

            // Находим новых исполнителей для добавления
            const toAdd = selectedUserIds.filter(id => !currentUserIds.includes(id));
            
            // Находим исполнителей для удаления
            const toRemove = currentUserIds.filter(id => !selectedUserIds.includes(id));

            // Добавляем новых исполнителей
            if (toAdd.length > 0) {
                await addAssignees({ taskId, userIds: toAdd });
            }

            // Удаляем исполнителей
            if (toRemove.length > 0) {
                await removeAssignees({ taskId, userIds: toRemove });
            }

            await refetchAssignees();
            onClose();
        } catch (error) {
            console.error('Ошибка при обновлении исполнителей:', error);
        }
    };

    const handleCancel = () => {
        setSelectedAssignees([]);
        onClose();
    };

    if (!visible) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Управление исполнителями</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        ✕
                    </button>
                </div>

                <div className="mb-4">
                    <MultiSelect
                        label=""
                        name="assignees"
                        options={assigneeOptions}
                        value={selectedAssignees.map(id => parseInt(id))}
                        onChange={(value) => setSelectedAssignees(value.map(id => id.toString()))}
                        placeholder="Выберите исполнителей..."
                    />
                </div>

                <div className="flex justify-end space-x-2">
                    <Button
                        onClick={handleCancel}
                        variant="outline"
                    >
                        Отмена
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        Сохранить
                    </Button>
                </div>
            </Card>
        </div>
    );
}; 