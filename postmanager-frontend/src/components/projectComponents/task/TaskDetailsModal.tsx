import { Task, TaskStatus } from '@/types/task.types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { useGetCommentsByTaskQuery, useCreateCommentMutation } from '@/store/api/comment.api';
import { useUpdateTaskMutation } from '@/store/api/task.api';
import { useAuth } from '@/hooks/useAuth';

import { X, Send, MessageCircle, Edit } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TaskDetailsModalProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onTaskUpdate: (taskId: string, updatedTask: Task) => void;
}

export default function TaskDetailsModal({ task, visible, onClose, onTaskUpdate }: TaskDetailsModalProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  
  // Функция для воспроизведения звука создания комментария
  const playCommentCreatedSound = () => {
    try {
      const audio = new Audio('/meet-message-sound-1.mp3');
      audio.volume = 0.5;
      audio.play().catch(error => {
        console.log('Не удалось воспроизвести звук создания комментария:', error);
      });
    } catch (error) {
      console.log('Ошибка при создании аудио элемента для комментария:', error);
    }
  };
  
  const { data: comments = [], refetch: refetchComments, isLoading: commentsLoading } = useGetCommentsByTaskQuery(
    task?.id ? parseInt(task.id) : 0,
    { 
      skip: !task?.id || !visible,
      pollingInterval: 5000, // Обновляем каждые 5 секунд
      refetchOnMountOrArgChange: true
    }
  );
  
  const [createComment] = useCreateCommentMutation();
  const [updateTask] = useUpdateTaskMutation();



  // Обработка закрытия по Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && visible) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !task?.id || !user?.id) return;

    try {
      await createComment({
        content: newComment,
        taskId: parseInt(task.id),
        authorId: user.id,
      }).unwrap();
      
      setNewComment('');
      refetchComments();
      
      // Воспроизводим звук создания комментария
      playCommentCreatedSound();
      
      // Показываем уведомление об успешном создании комментария
      toast.success('Комментарий успешно добавлен! 💬', {
        duration: 4000, // 4 секунды для уведомления о создании
        icon: '💬',
        style: {
          background: '#3b82f6',
          color: '#ffffff',
          fontSize: '14px',
          fontWeight: '500'
        }
      });
    } catch (error) {
      console.error('Ошибка при создании комментария:', error);
      
      // Показываем уведомление об ошибке
      const errorMessage = error && typeof error === 'object' && 'data' in error && 
                          error.data && typeof error.data === 'object' && 'message' in error.data
                          ? String(error.data.message)
                          : 'Ошибка при создании комментария';
      toast.error(errorMessage, {
        duration: 4000, // 4 секунды для уведомления об ошибке
        icon: '❌'
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH':
      case 'Высокий':
        return 'bg-red-500';
      case 'MEDIUM':
      case 'Средний':
        return 'bg-yellow-500';
      case 'LOW':
      case 'Низкий':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-400';
      case 'IN_PROGRESS':
        return 'bg-blue-500';
      case 'PROBLEM':
        return 'bg-red-500';
      case 'COMPLETED':
        return 'bg-green-500';
      case 'CANCELLED':
        return 'bg-gray-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'К выполнению';
      case 'IN_PROGRESS':
        return 'В работе';
      case 'PROBLEM':
        return 'Проблема';
      case 'COMPLETED':
        return 'Завершено';
      case 'CANCELLED':
        return 'Отменено';
      default:
        return status;
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;

    try {
      const priorityMap: Record<string, 'LOW' | 'MEDIUM' | 'HIGH'> = {
        'Низкий': 'LOW',
        'Средний': 'MEDIUM',
        'Высокий': 'HIGH'
      };

      await updateTask({
        taskId: task.id,
        task: {
          title: task.title,
          description: task.description,
          priority: priorityMap[task.priority as keyof typeof priorityMap] || 'LOW',
          status: newStatus,
          projectId: Number(task.projectId),
          deadline: task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd') : undefined
        }
      }).unwrap();

      onTaskUpdate(task.id, {
        ...task,
        status: newStatus
      });

      setIsEditingStatus(false);
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
    }
  };

  if (!visible || !task) {
  
    return null;
  }

  return (
    <div 
      className="fixed inset-0 flex items-start justify-end z-50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          console.log('Клик вне формы - закрытие модального окна');
          setTimeout(() => {
            onClose();
          }, 0);
        }
      }}
    >
      <div 
        className="bg-gray-900 rounded-lg shadow-xl w-full max-w-2xl h-[calc(100vh-2rem)] flex flex-col border border-gray-700 mr-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <h1 className="text-2xl font-bold text-white">{task.title}</h1>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Кнопка закрытия нажата');
              onClose();
            }}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors group cursor-pointer"
            title="Закрыть"
          >
            <X className="w-5 h-5 text-gray-300 group-hover:text-white" />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Task Details Section */}
          <div className="p-6 border-b border-gray-700">
            {/* Task Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-6 text-sm">
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Статус</span>
                  <div className="flex items-center gap-2 mt-1">
                    {isEditingStatus ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                          className="px-2 py-1 text-sm border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
                        >
                          <option value="TODO">К выполнению</option>
                          <option value="IN_PROGRESS">В работе</option>
                          <option value="PROBLEM">Проблема</option>
                          <option value="COMPLETED">Завершено</option>
                          <option value="CANCELLED">Отменено</option>
                        </select>
                        <button
                          onClick={() => setIsEditingStatus(false)}
                          className="text-gray-400 hover:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(task.status)}`}></div>
                        <span className="font-medium text-gray-200">{getStatusText(task.status)}</span>
                        <button
                          onClick={() => setIsEditingStatus(true)}
                          className="text-gray-400 hover:text-gray-300"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Приоритет</span>
                  <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                    <span className="font-medium text-gray-200">{task.priority}</span>
                  </div>
                </div>
                {task.deadline ? (
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide">Срок</span>
                    <p className="font-medium text-gray-200 mt-1">{format(new Date(task.deadline), 'dd MMM yyyy', { locale: ru })}</p>
                  </div>
                ) : (
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide">Срок</span>
                    <p className="text-gray-500 mt-1">Не установлен</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Создано</span>
                  <p className="font-medium text-gray-200 mt-1">{format(new Date(task.createdAt), 'dd MMM yyyy', { locale: ru })}</p>
                </div>
              </div>



              {/* Assignees */}
              <div>
                <span className="text-gray-400 text-sm">Исполнители:</span>
                <div className="flex gap-2 mt-2">
                  {task.assignees && task.assignees.length > 0 ? (
                    task.assignees.map((assignee) => (
                      <div 
                        key={assignee.id} 
                        className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium"
                        title={`${assignee.user.name} (${assignee.user.department?.name || 'Без отдела'})`}
                      >
                        {assignee.user.name.charAt(0)}
                      </div>
                    ))
                  ) : (
                    <span className="text-gray-500 text-sm">Не назначены</span>
                  )}
                </div>
              </div>

              {/* Description */}
              {task.description && (
                <div>
                  <span className="text-gray-400 text-sm">Описание:</span>
                  <p className="mt-2 text-gray-300 leading-relaxed">{task.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="flex-1 flex flex-col">
              {/* Comments Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Комментарии</h3>
                </div>
                <button
                  onClick={() => refetchComments()}
                  disabled={commentsLoading}
                  className="px-3 py-1 text-sm bg-gray-700 text-gray-300 rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Обновить комментарии"
                >
                  {commentsLoading ? 'Обновление...' : 'Обновить'}
                </button>
              </div>

              {/* Comments Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {/* Comments List */}
                  <div className="space-y-4">
                    {commentsLoading ? (
                      <div className="text-center py-4">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        <p className="text-gray-500 text-sm mt-2">Загрузка комментариев...</p>
                      </div>
                    ) : comments.length > 0 ? (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                            {comment.author?.name?.charAt(0) || 'U'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm text-gray-200">{comment.author?.name || 'Пользователь'}</span>
                              <span className="text-gray-400 text-xs">
                                {format(new Date(comment.createdAt), 'dd MMM HH:mm', { locale: ru })}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-2">
                        <p className="text-gray-500 text-sm">Комментариев нет</p>
                      </div>
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {user?.name?.charAt(0) || 'U'}
                      </div>
                      <div className="flex-1">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Написать комментарий..."
                            className="flex-1 px-3 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white"
                            onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                          />
                          <button
                            onClick={handleSubmitComment}
                            disabled={!newComment.trim()}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
} 