'use client';

import { TaskPriority, TaskCardProps } from '@/types/task.types';
import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { useUpdateTaskMutation, useCreateTaskMutation } from '@/store/api/task.api';
import PriorityModal from './PriorityModal';
import TaskMenu from './TaskMenu';

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

  const handleDateSelect = async (date: Date | null) => {
    if (!date) return;
    setSelectedDate(date);
    try {
      const priorityMap: Record<string, TaskPriority> = {
        'Низкий': 'LOW',
        'Средний': 'MEDIUM',
        'Высокий': 'HIGH'
      };

      await updateTask({
        taskId: item.id,
        task: {
          ...item,
          priority: priorityMap[item.priority as keyof typeof priorityMap],
          deadline: format(date, 'yyyy-MM-dd')
        }
      }).unwrap();

      // Update local state with the new task data
      onTaskUpdate(item.id, {
        ...item,
        deadline: date
      });

      setShowDatepicker(false);
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to update task deadline:', error);
    }
  };

  const handleDuplicate = async () => {
    try {
      const priorityMap: Record<string, TaskPriority> = {
        'Низкий': 'LOW',
        'Средний': 'MEDIUM',
        'Высокий': 'HIGH'
      };
      await createTask({
        title: item.title + ' (копия)',
        description: item.description || '',
        priority: priorityMap[item.priority as keyof typeof priorityMap] || 'LOW',
        status: item.status,
        projectId: Number(item.projectId),
        deadline: item.deadline ? format(new Date(item.deadline), 'yyyy-MM-dd') : undefined
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
    </div>
  );
} 