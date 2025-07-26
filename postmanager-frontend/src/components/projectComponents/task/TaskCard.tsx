'use client';

import { TaskPriority, TaskCardProps } from '@/types/task.types';
import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useUpdateTaskMutation, useCreateTaskMutation } from '@/store/api/task.api';
import PriorityModal from './PriorityModal';
import TaskMenu from './TaskMenu';
import TaskModal from './TaskModal';

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Высокий':
      return 'border-red-500';
    case 'Средний':
      return 'border-yellow-500';
    default:
      return 'border-gray-900';
  }
};

export default function TaskCard({ item, columnId, handleDeleteTask, onTaskUpdate, provided, snapshot }: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [menuDirection, setMenuDirection] = useState<'down' | 'up'>('down');
  const ellipsisRef = useRef<HTMLButtonElement>(null);
  const [showDatepicker, setShowDatepicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(item.deadline ? new Date(item.deadline) : new Date());
  const [updateTask] = useUpdateTaskMutation();
  const [createTask] = useCreateTaskMutation();
  const menuHeight = 132;
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState(item.title);
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTaskData, setEditTaskData] = useState({
    title: item.title,
    description: item.description || '',
    priority: item.priority as 'Низкий' | 'Средний' | 'Высокий',
    deadline: item.deadline ? new Date(item.deadline) : null,
    assigneeIds: item.assignees?.map(assignee => assignee.user.id) || []
  });

  // Синхронизация локального state с основным state задачи
  useEffect(() => {
    setEditTaskData({
      title: item.title,
      description: item.description || '',
      priority: item.priority as 'Низкий' | 'Средний' | 'Высокий',
      deadline: item.deadline ? new Date(item.deadline) : null,
      assigneeIds: item.assignees?.map(assignee => assignee.user.id) || []
    });
    setEditingTitle(item.title);
  }, [item.title, item.description, item.priority, item.deadline]);

  const handleDateSelect = async (date: Date | null) => {
    console.log('handleDateSelect called with date:', date);
    setSelectedDate(date || new Date());
    
    setShowDatepicker(false);
    setShowMenu(false);

    try {
      const priorityMap: Record<string, TaskPriority> = {
        'Низкий': 'LOW',
        'Средний': 'MEDIUM',
        'Высокий': 'HIGH'
      };

      const deadlineValue = date ? format(date, 'yyyy-MM-dd') : null;
      console.log('Sending deadline to API:', deadlineValue);

      await updateTask({
        taskId: item.id,
        task: {
          ...item,
          priority: priorityMap[item.priority as keyof typeof priorityMap],
          deadline: deadlineValue
        }
      }).unwrap();

      console.log('API call successful, updating local state with deadline:', date);

      // Обновляем основной state только после успешного сохранения в БД
      onTaskUpdate(item.id, {
        ...item,
        deadline: date || undefined
      });
    } catch (error) {
      console.error('Failed to update task deadline:', error);
      // В случае ошибки не обновляем state, так как он не изменился
    }
  };

  const handleDuplicate = async () => {
    try {
      const priorityMap: Record<string, TaskPriority> = {
        'Низкий': 'LOW',
        'Средний': 'MEDIUM',
        'Высокий': 'HIGH'
      };
      
      // Получаем ID исполнителей из текущей задачи
      const assigneeIds = item.assignees?.map(assignee => assignee.user.id) || [];
      
      await createTask({
        title: item.title + ' (копия)',
        description: item.description || '',
        priority: priorityMap[item.priority as keyof typeof priorityMap] || 'LOW',
        status: item.status,
        projectId: Number(item.projectId),
        deadline: item.deadline ? format(new Date(item.deadline), 'yyyy-MM-dd') : undefined,
        assigneeIds: assigneeIds
      }).unwrap();
      // Обновить задачи после дублирования
      onTaskUpdate(item.id, item); // Триггерим обновление списка задач
    } catch (error) {
      console.error('Failed to duplicate task:', error);
    }
  };

  const handleTitleDoubleClick = () => {
    setIsEditingTitle(true);
    setEditingTitle(item.title);
  };

  const handleTitleSave = async () => {
    if (!editingTitle.trim()) {
      setEditingTitle(item.title);
      setIsEditingTitle(false);
      return;
    }

    try {
      const priorityMap: Record<string, TaskPriority> = {
        'Низкий': 'LOW',
        'Средний': 'MEDIUM',
        'Высокий': 'HIGH'
      };

      await updateTask({
        taskId: item.id,
        task: {
          title: editingTitle.trim(),
          description: item.description,
          priority: priorityMap[item.priority as keyof typeof priorityMap],
          status: item.status,
          projectId: Number(item.projectId),
          deadline: item.deadline ? format(new Date(item.deadline), 'yyyy-MM-dd') : undefined
        }
      }).unwrap();

      // Update local state with the new task data
      onTaskUpdate(item.id, {
        ...item,
        title: editingTitle.trim()
      });

      setIsEditingTitle(false);
    } catch (error) {
      console.error('Failed to update task title:', error);
      setEditingTitle(item.title);
      setIsEditingTitle(false);
    }
  };

  const handleTitleCancel = () => {
    setEditingTitle(item.title);
    setIsEditingTitle(false);
  };

  const handleTitleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  };

  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleEditSubmit = async (data: { title: string; description: string; priority: TaskPriority; deadline?: string }) => {
    try {
      await updateTask({
        taskId: item.id,
        task: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          status: item.status,
          projectId: Number(item.projectId),
          deadline: data.deadline
        }
      }).unwrap();

      onTaskUpdate(item.id, {
        ...item,
        title: data.title,
        description: data.description,
        priority: data.priority,
        deadline: data.deadline ? new Date(data.deadline) : undefined
      });

      setShowEditModal(false);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleEditCancel = () => {
    setShowEditModal(false);
  };


  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      className={`bg-gray-900 rounded-lg p-4 shadow flex flex-col gap-2 border-2 ${getPriorityColor(item.priority)}
        ${snapshot.isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
        ${columnId === 'COMPLETED' ? 'opacity-60 text-gray-400 pointer-events-auto' : ''}
      `}
      style={{
        ...provided.draggableProps.style,
      }}
    >
      <div className="flex items-center justify-between">
        {isEditingTitle ? (
          <input
            type="text"
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyPress}
            className="text-white text-[14px] font-semibold focus:outline-none"
            autoFocus
            maxLength={100}
          />
        ) : (
          <div
            className="font-semibold text-[14px] cursor-pointer rounded flex-1 max-w-[300px]"
            onDoubleClick={handleTitleDoubleClick}
            title="Редактировать"
          >
            {item.title}
          </div>
        )}
        <TaskMenu
          onEditPriority={() => setShowPriorityModal(true)}
          onAddDate={() => setShowDatepicker(true)}
          onDelete={() => handleDeleteTask(columnId, item.id)}
          onDuplicate={handleDuplicate}
          onEdit={handleEdit}
          menuHeight={menuHeight}
          ellipsisRef={ellipsisRef as React.RefObject<HTMLButtonElement>}
          showMenu={showMenu}
          setShowMenu={setShowMenu}
          setMenuPosition={setMenuPosition}
          setMenuDirection={setMenuDirection}
          menuPosition={menuPosition}
        />
      </div>
      {showDatepicker && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowDatepicker(false)}>
          <div className="bg-gray-900 p-4 rounded-lg shadow-lg border border-white" onClick={e => e.stopPropagation()}>
            <DatePicker
              selected={selectedDate}
              onChange={handleDateSelect}
              inline
              locale={ru}
              dateFormat="dd.MM.yyyy"
              minDate={new Date()}
              className="bg-gray-800 text-white rounded p-2"
            />
          </div>
        </div>
      )}
      {showEditModal && (
        <TaskModal
          visible={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            // Сброс данных к исходным при закрытии
            setEditTaskData({
              title: item.title,
              description: item.description || '',
              priority: item.priority as 'Низкий' | 'Средний' | 'Высокий',
              deadline: item.deadline ? new Date(item.deadline) : null,
              assigneeIds: item.assignees?.map(assignee => assignee.user.id) || []
            });
          }}
          onCreate={async () => {
            try {
              const priorityMap: Record<string, TaskPriority> = {
                'Низкий': 'LOW',
                'Средний': 'MEDIUM',
                'Высокий': 'HIGH'
              };

              const deadlineValue = editTaskData.deadline ? format(editTaskData.deadline, 'yyyy-MM-dd') : null;
              console.log('Modal edit - sending deadline to API:', deadlineValue);

              await updateTask({
                taskId: item.id,
                task: {
                  title: editTaskData.title,
                  description: editTaskData.description,
                  priority: priorityMap[editTaskData.priority],
                  status: item.status,
                  projectId: Number(item.projectId),
                  deadline: deadlineValue,
                  assigneeIds: editTaskData.assigneeIds
                }
              }).unwrap();

              // Обновляем локальное состояние
              onTaskUpdate(item.id, {
                ...item,
                title: editTaskData.title,
                description: editTaskData.description,
                priority: editTaskData.priority,
                deadline: editTaskData.deadline || undefined
              });

              setShowEditModal(false);
            } catch (error) {
              console.error('Failed to update task:', error);
            }
          }}
          newTask={editTaskData}
          setNewTask={(task) => {
            setEditTaskData({
              title: task.title,
              description: task.description,
              priority: task.priority,
              deadline: task.deadline || null,
              assigneeIds: task.assigneeIds || []
            });
          }}
          columns={{}}
          selectedColumn=""
          setSelectedColumn={() => {}}
        />
      )}
      <PriorityModal
        isOpen={showPriorityModal}
        onClose={() => setShowPriorityModal(false)}
        task={item}
        onTaskUpdate={onTaskUpdate}
      />
      
      {item.deadline && !showDatepicker && (
        <div className="text-xs text-gray-400">
          Срок: {new Date(item.deadline).toLocaleDateString('ru-RU')}
        </div>
      )}
      
      {/* Отображение исполнителей */}
      {item.assignees && item.assignees.length > 0 && (
        <div className="mt-2">
          <div className="flex flex-wrap gap-1">
            {item.assignees.slice(0, 3).map((assignee) => (
              <div
                key={assignee.id}
                className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full"
                title={`${assignee.user.name} (${assignee.user.department?.name || 'Без отдела'})`}
              >
                {assignee.user.name}
              </div>
            ))}
            {item.assignees.length > 3 && (
              <div className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full">
                +{item.assignees.length - 3}
              </div>
            )}
          </div>
        </div>
      )}
      
    </div>
  );
} 