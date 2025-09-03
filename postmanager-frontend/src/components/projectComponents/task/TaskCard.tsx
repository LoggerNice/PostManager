'use client';

import { TaskPriority, TaskCardProps, Task, TaskType, getTaskTypeFromDisplay, TaskTypeDisplay } from '@/types/task.types';
import { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import "react-datepicker/dist/react-datepicker.css";
import { useUpdateTaskMutation, useCreateTaskMutation } from '@/store/api/task.api';
import { useGetCommentsByTaskQuery } from '@/store/api/comment.api';
import PriorityModal from './PriorityModal';
import TaskMenu from './TaskMenu';
import TaskModal from './TaskModal';
import TaskDetailsModal from './TaskDetailsModal';
import TimePicker from './TimePicker';
import DateOnlyModal from '@/components/ui/DateOnlyModal';
import TimeOnlyModal from '@/components/ui/TimeOnlyModal';
import { MessageCircle } from 'lucide-react';

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'Высокий':
    case 'HIGH':
      return 'border-red-500';
    case 'Средний':
    case 'MEDIUM':
      return 'border-yellow-500';
    default:
      return 'border-gray-900';
  }
};

export default function TaskCard({ item, columnId, handleDeleteTask, onTaskUpdate, provided, snapshot, showProjectTitle = false }: TaskCardProps & { showProjectTitle?: boolean }) {
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [menuDirection, setMenuDirection] = useState<'down' | 'up'>('down');
  const ellipsisRef = useRef<HTMLButtonElement>(null);

  const [updateTask] = useUpdateTaskMutation();
  const [createTask] = useCreateTaskMutation();
  const menuHeight = 132;
  const [showPriorityModal, setShowPriorityModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDateOnlyModal, setShowDateOnlyModal] = useState(false);
  const [showTimeOnlyModal, setShowTimeOnlyModal] = useState(false);
  const [editTaskData, setEditTaskData] = useState({
    title: item.title,
    description: item.description || '',
    priority: item.priority as 'Низкий' | 'Средний' | 'Высокий',
    taskType: (item.taskType as TaskType) || 'OTHER',
    deadline: item.deadline ? new Date(item.deadline) : null,
    assigneeIds: item.assignees?.map(assignee => assignee.user.id) || []
  });

  // Получаем комментарии для отображения количества
  const { data: comments = [] } = useGetCommentsByTaskQuery(
    parseInt(item.id),
    {
      skip: !item.id,
      pollingInterval: 10000, // Обновляем каждые 10 секунд
      refetchOnMountOrArgChange: true
    }
  );

  // Синхронизация локального state с основным state задачи
  useEffect(() => {
    setEditTaskData({
      title: item.title,
      description: item.description || '',
      priority: item.priority as 'Низкий' | 'Средний' | 'Высокий',
      taskType: (item.taskType as TaskType) || 'OTHER',
      deadline: item.deadline ? new Date(item.deadline) : null,
      assigneeIds: item.assignees?.map(assignee => assignee.user.id) || []
    });
  }, [item.title, item.description, item.priority, item.taskType, item.deadline]);









  const handleEdit = () => {
    setShowEditModal(true);
  };

  const handleTimeSelect = async (dateTime: Date) => {
    try {
      const priorityMap: Record<string, TaskPriority> = {
        'Низкий': 'LOW',
        'Средний': 'MEDIUM',
        'Высокий': 'HIGH'
      };

      const deadlineValue = format(dateTime, 'yyyy-MM-dd HH:mm:ss');
      console.log('Sending deadline with time to API:', deadlineValue);

      await updateTask({
        taskId: item.id,
        task: {
          ...item,
          priority: priorityMap[item.priority as keyof typeof priorityMap],
          deadline: deadlineValue,
          taskType: (item.taskType as TaskType) || 'OTHER'
        }
      }).unwrap();

      console.log('API call successful, updating local state with deadline:', dateTime);

      onTaskUpdate(item.id, {
        ...item,
        deadline: dateTime
      });

      setShowTimePicker(false);
    } catch (error) {
      console.error('Failed to update task deadline with time:', error);
    }
  };

  const handleDateOnlySelect = async (date: Date) => {
    try {
      const priorityMap: Record<string, TaskPriority> = {
        'Низкий': 'LOW',
        'Средний': 'MEDIUM',
        'Высокий': 'HIGH'
      };

      // Сохраняем текущее время, если оно есть
      const currentDeadline = item.deadline ? new Date(item.deadline) : new Date();
      const newDeadline = new Date(date);
      newDeadline.setHours(currentDeadline.getHours(), currentDeadline.getMinutes(), 0, 0);

      const deadlineValue = format(newDeadline, 'yyyy-MM-dd HH:mm:ss');
      console.log('Sending date only to API:', deadlineValue);

      await updateTask({
        taskId: item.id,
        task: {
          ...item,
          priority: priorityMap[item.priority as keyof typeof priorityMap],
          deadline: deadlineValue,
          taskType: (item.taskType as TaskType) || 'OTHER'
        }
      }).unwrap();

      console.log('API call successful, updating local state with date:', newDeadline);

      onTaskUpdate(item.id, {
        ...item,
        deadline: newDeadline
      });

      setShowDateOnlyModal(false);
    } catch (error) {
      console.error('Failed to update task date:', error);
    }
  };

  const handleTimeOnlySelect = async (time: string) => {
    try {
      const priorityMap: Record<string, TaskPriority> = {
        'Низкий': 'LOW',
        'Средний': 'MEDIUM',
        'Высокий': 'HIGH'
      };

      // Парсим время
      const [hours, minutes] = time.split(':').map(Number);
      
      // Используем текущую дату или дату дедлайна
      const currentDeadline = item.deadline ? new Date(item.deadline) : new Date();
      const newDeadline = new Date(currentDeadline);
      newDeadline.setHours(hours, minutes, 0, 0);

      const deadlineValue = format(newDeadline, 'yyyy-MM-dd HH:mm:ss');
      console.log('Sending time only to API:', deadlineValue);

      await updateTask({
        taskId: item.id,
        task: {
          ...item,
          priority: priorityMap[item.priority as keyof typeof priorityMap],
          deadline: deadlineValue,
          taskType: (item.taskType as TaskType) || 'OTHER'
        }
      }).unwrap();

      console.log('API call successful, updating local state with time:', newDeadline);

      onTaskUpdate(item.id, {
        ...item,
        deadline: newDeadline
      });

      setShowTimeOnlyModal(false);
    } catch (error) {
      console.error('Failed to update task time:', error);
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
      className={`bg-gray-900 rounded-lg px-4 pt-2 pb-4 shadow flex flex-col gap-2 border-2 ${columnId === 'COMPLETED' ? 'border-gray-900' : getPriorityColor(item.priority)}
        ${snapshot.isDragging ? 'opacity-50 rotate-2 scale-105' : ''}
        ${columnId === 'COMPLETED' ? 'opacity-60 text-gray-400 pointer-events-auto' : ''}
        ${columnId === 'COMPLETED' ? 'text-gray-400' : ''}
        cursor-pointer
      `}
      style={{
        ...provided.draggableProps.style,
      }}
      onClick={(e) => {
        e.stopPropagation();
        if (!showDetailsModal && !showEditModal && !showTimePicker && !showPriorityModal) {
          console.log('Открытие модального окна для задачи:', item.title);
          setShowDetailsModal(true);
          // Сброс курсора при открытии модального окна
          document.body.style.cursor = 'default';
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div
          className="font-semibold text-[14px] rounded flex-1 max-w-[300px]"
        >
          {item.title}
        </div>
        <div className="flex items-center gap-1">
          {/* Индикатор комментариев */}
          {comments.length > 0 && (
            <div className="flex gap-0.5 text-gray-400">
              <MessageCircle className="w-3 h-3" />
              <span className="text-xs">{comments.length}</span>
            </div>
          )}
          <div onMouseEnter={(e) => e.stopPropagation()} onMouseLeave={(e) => e.stopPropagation()}>
            <TaskMenu
              onEditPriority={() => setShowPriorityModal(true)}
              onAddDate={() => setShowDateOnlyModal(true)}
              onAddTime={() => setShowTimeOnlyModal(true)}
              onDelete={() => handleDeleteTask(columnId, item.id)}
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
        </div>
      </div>

      {/* Название проекта - отображается только на странице "мои задачи" */}
      {showProjectTitle && item.project && (
        <div className="text-xs text-blue-400 font-medium">
          {item.project.title}
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
              taskType: (item.taskType as TaskType) || 'OTHER',
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

              const taskTypeMap: Record<string, any> = {
                'OTHER': 'OTHER',
                'METHODOLOGIES': 'METHODOLOGIES',
                'TESTING_PREPARATION': 'TESTING_PREPARATION',
                'DEBUG_CHECK': 'DEBUG_CHECK',
                'MEETING': 'MEETING'
              };

              const deadlineValue = editTaskData.deadline ? format(editTaskData.deadline, 'yyyy-MM-dd HH:mm:ss') : null;

              await updateTask({
                taskId: item.id,
                task: {
                  title: editTaskData.title,
                  description: editTaskData.description,
                  priority: priorityMap[editTaskData.priority],
                  taskType: taskTypeMap[editTaskData.taskType] || 'OTHER',
                  status: item.status,
                  projectId: Number(item.projectId),
                  deadline: deadlineValue,
                  assigneeIds: editTaskData.assigneeIds
                }
              }).unwrap();

              // Обновляем локальное состояние
              const updatedTask: Task = {
                ...item,
                title: editTaskData.title,
                description: editTaskData.description,
                priority: editTaskData.priority,
                taskType: editTaskData.taskType,
                deadline: editTaskData.deadline || null
              };
              onTaskUpdate(item.id, updatedTask);

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
              taskType: task.taskType,
              deadline: task.deadline || null,
              assigneeIds: task.assigneeIds || []
            });
          }}
          columns={{}}
          selectedColumn=""
          setSelectedColumn={() => { }}
        />
      )}
      <PriorityModal
        isOpen={showPriorityModal}
        onClose={() => setShowPriorityModal(false)}
        task={{
          id: item.id,
          title: item.title,
          description: item.description,
          priority: item.priority,
          status: item.status,
          projectId: item.projectId,
          deadline: item.deadline ? new Date(item.deadline) : undefined
        }}
        onTaskUpdate={onTaskUpdate}
      />

      <TaskDetailsModal
        task={item}
        visible={showDetailsModal}
        onClose={() => {
          console.log('Закрытие модального окна, текущее состояние:', showDetailsModal);
          setShowDetailsModal(false);
          // Сброс курсора при закрытии модального окна
          document.body.style.cursor = '';
        }}
        onTaskUpdate={onTaskUpdate}
      />

      {/* Срок и исполнители в одной строке */}
      {(item.deadline || (item.assignees && item.assignees.length > 0)) && (
        <div className="flex items-end justify-between">
          {/* Срок слева */}
          {item.deadline && !showTimePicker && (
            <div className="text-xs text-gray-400">
              Срок: {new Date(item.deadline).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short'
                    })}
              {new Date(item.deadline).getHours() !== 0 || new Date(item.deadline).getMinutes() !== 0 ?
                ` ${new Date(item.deadline).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}` :
                ''
              }
            </div>
          )}

          {/* Исполнители справа */}
          {item.assignees && item.assignees.length > 0 && (
            <div className="flex gap-1">
              {item.assignees.slice(0, 1).map((assignee) => (
                <div
                  key={assignee.id}
                  className="w-9 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  title={`${assignee.user.name} (${assignee.user.department?.name || 'Без отдела'})`}
                >
                  {assignee.user.name.split(' ').map(part => part[0]).join('')}
                </div>
              ))}
              {item.assignees.length > 1 && (
                <div
                  className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-medium"
                  title={item.assignees.slice(1).map(assignee =>
                    `${assignee.user.name} (${assignee.user.department?.name || 'Без отдела'})`
                  ).join('\n')}
                >
                  +{item.assignees.length - 1}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <TimePicker
        isOpen={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onTimeSelect={handleTimeSelect}
        currentDeadline={item.deadline ? new Date(item.deadline) : null}
      />

      <DateOnlyModal
        isOpen={showDateOnlyModal}
        onClose={() => setShowDateOnlyModal(false)}
        onDateSelect={handleDateOnlySelect}
        selectedDate={item.deadline ? new Date(item.deadline) : new Date()}
      />

      <TimeOnlyModal
        isOpen={showTimeOnlyModal}
        onClose={() => setShowTimeOnlyModal(false)}
        onTimeSelect={handleTimeOnlySelect}
        currentTime={item.deadline ? 
          `${new Date(item.deadline).getHours().toString().padStart(2, '0')}:${new Date(item.deadline).getMinutes().toString().padStart(2, '0')}` : 
          ''
        }
      />

    </div>
  );
} 