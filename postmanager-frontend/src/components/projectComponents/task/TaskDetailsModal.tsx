'use client';

import { Task, TaskStatus } from '@/types/task.types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { useGetCommentsByTaskQuery, useCreateCommentMutation, useUpdateCommentMutation, useDeleteCommentMutation, useMarkCommentAsViewedMutation, useGetCommentViewStatsQuery } from '@/store/api/comment.api';
import { useUpdateTaskMutation } from '@/store/api/task.api';
import { useUploadFileMutation } from '@/store/api/file.api';
import { useAuth } from '@/hooks/useAuth';
import { ChatInput, CommentFile } from '@/components/ui';
import { CommentViewIndicator } from '@/components/ui/CommentViewIndicator';
import { ArrowPathIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

import { X, Send, MessageCircle, Edit } from 'lucide-react';
import { RTKQueryHelpers, useDebouncedRefetch } from '@/utils/rtk-query-helpers';


interface TaskDetailsModalProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onTaskUpdate: (taskId: string, updatedTask: Task) => void;
}

export default function TaskDetailsModal({ task, visible, onClose, onTaskUpdate }: TaskDetailsModalProps) {
  const { user } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');

  const { 
    data: comments = [], 
    refetch: refetchComments, 
    isLoading: commentsLoading 
  } = useGetCommentsByTaskQuery(
    task?.id ? parseInt(task.id) : 0,
    { 
      skip: !task?.id || !visible,
      pollingInterval: visible ? 8000 : 0, // Увеличиваем интервал до 8 секунд для стабильности
      refetchOnMountOrArgChange: true
    }
  );

  // Безопасная функция refetch с использованием утилиты
  const safeRefetchComments = RTKQueryHelpers.createCommentRefetch(refetchComments, task?.id, visible);
  
  // Отложенный refetch для стабильности
  const debouncedRefetchComments = useDebouncedRefetch(safeRefetchComments, 500);
  
  const [createComment] = useCreateCommentMutation();
  const [updateComment] = useUpdateCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [markCommentAsViewed] = useMarkCommentAsViewedMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [uploadFile] = useUploadFileMutation();

  // Получаем статистику просмотров для всех комментариев одним запросом
  const { data: allViewStats = [], refetch: refetchViewStats } = useGetCommentViewStatsQuery(
    { commentIds: comments.map(comment => comment.id) },
    { 
      skip: !comments.length || !visible,
      pollingInterval: 10000, // Увеличиваем интервал до 10 секунд для стабильности
      refetchOnMountOrArgChange: true
    }
  );



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

  // Автоматическое отслеживание просмотров при открытии модального окна
  useEffect(() => {
    if (visible && user?.id && comments.length > 0) {
      // Отмечаем все комментарии как просмотренные при открытии модального окна
      const markCommentsAsViewed = async () => {
        for (const comment of comments) {
          try {
            await markCommentAsViewed({
              commentId: comment.id,
              userId: user.id
            }).unwrap();
          } catch (error) {
            console.error('Ошибка при отметке комментария как просмотренного:', error);
          }
        }
        // Обновляем статистику просмотров после отметки с задержкой
        setTimeout(() => {
          refetchViewStats();
        }, 1000);
      };
      
      markCommentsAsViewed();
    }
  }, [visible, user?.id, comments, markCommentAsViewed, refetchViewStats]);

  // Автоматическое обновление статистики при изменении комментариев
  useEffect(() => {
    if (visible && comments.length > 0) {
      // Обновляем статистику просмотров при изменении списка комментариев с задержкой
      const timer = setTimeout(() => {
        refetchViewStats();
      }, 2000); // Увеличиваем задержку до 2 секунд
      
      return () => clearTimeout(timer);
    }
  }, [comments.length, visible, refetchViewStats]);

  const handleSubmitComment = async () => {
    if ((!newComment.trim() && !selectedFile) || !task?.id || !user?.id) return;

    try {
      // Если есть файл, сначала загружаем его
      let fileUrl = '';
      let fileName = '';
      let fileSize = 0;

      if (selectedFile) {
        try {
          const formData = new FormData();
          formData.append('file', selectedFile);
          
          const uploadResult = await uploadFile(formData).unwrap();
          fileUrl = uploadResult.file.url;
          fileName = uploadResult.file.originalname;
          fileSize = uploadResult.file.size;
        } catch (uploadError) {
          console.error('Ошибка при загрузке файла:', uploadError);
          alert('Ошибка при загрузке файла. Попробуйте еще раз.');
          return;
        }
      }

      await createComment({
        content: newComment,
        taskId: parseInt(task.id),
        authorId: user.id,
        fileUrl: fileUrl || undefined,
        fileName: fileName || undefined,
        fileSize: fileSize || undefined,
      }).unwrap();
      
      setNewComment('');
      setSelectedFile(null);
      
      // Обновляем комментарии с отложенным refetch
      debouncedRefetchComments();
      
      // Обновляем статистику просмотров после создания комментария с большей задержкой
      setTimeout(() => {
        refetchViewStats();
      }, 1500);
      
    } catch (error) {
      console.error('Ошибка при создании комментария:', error);
    }
  };

  const handleEditComment = async (commentId: number, newContent: string) => {
    if (!newContent.trim()) return;

    try {
      await updateComment({
        id: commentId,
        data: { content: newContent }
      }).unwrap();
      
      setEditingCommentId(null);
      setEditingCommentText('');
      safeRefetchComments();
      
    } catch (error) {
      console.error('Ошибка при обновлении комментария:', error);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    const isConfirmed = window.confirm('Вы уверены, что хотите удалить этот комментарий?');
    if (!isConfirmed) return;

    try {
      await deleteComment(commentId).unwrap();
      safeRefetchComments();
      
    } catch (error) {
      console.error('Ошибка при удалении комментария:', error);
    }
  };



  const startEditingComment = (commentId: number, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentContent);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
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
        return 'Согласование';
      case 'COMPLETED':
        return 'Выполнено';
      case 'CANCELLED':
        return 'Отменено';
      default:
        return status;
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    if (!task) return;

    // Проверяем, может ли пользователь изменять статус на "Выполнено"
    if (newStatus === 'COMPLETED' && user?.role !== 'ADMIN' && user?.role !== 'MANAGER') {
      alert('Только начальник может изменять статус задачи на "Выполнено"');
      return;
    }

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
          deadline: task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd HH:mm:ss') : undefined
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
      className="fixed inset-0 flex items-start justify-end z-50 p-4 cursor-default"
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
                          <option value="IN_PROGRESS">В работе</option>
                          <option value="PROBLEM">Согласование</option>
                          {(user?.role === 'ADMIN' || user?.role === 'MANAGER') && (
                            <option value="COMPLETED">Выполнено</option>
                          )}
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

              {/* Проект */}
              {task.project && (
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Проект</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium text-blue-400">{task.project.title}</span>
                    {task.project.description && (
                      <span className="text-gray-500 text-xs">— {task.project.description}</span>
                    )}
                  </div>
                </div>
              )}



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
          <div className="flex-1 flex flex-col min-h-0">
              {/* Comments Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Комментарии</h3>
                </div>
                <button
                  onClick={() => safeRefetchComments()}
                  disabled={commentsLoading}
                  className="px-2 text-gray-400 hover:text-white hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors rounded-lg"
                  title="Обновить комментарии"
                >
                  <ArrowPathIcon className={`w-5 h-5 ${commentsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {/* Comments Content - Scrollable Area */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-6">
                  <div className="space-y-4">
                    {/* Comments List */}
                    <div className="space-y-4">
                      {commentsLoading ? (
                        <div className="text-center py-4">
                          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                          <p className="text-gray-500 text-sm mt-2">Загрузка комментариев...</p>
                        </div>
                      ) : comments.length > 0 ? (
                        comments.map((comment) => {
                          // Получаем статистику просмотров для комментария из предварительно загруженных данных
                          const viewStats = allViewStats.find(stats => stats.commentId === comment.id);

                          return (
                            <div key={comment.id} className="flex gap-3">
                              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                                {comment.author?.name?.charAt(0) || 'U'}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-gray-200">{comment.author?.name || 'Пользователь'}</span>
                                    <span className="text-gray-400 text-xs">
                                      {format(new Date(comment.createdAt), 'dd MMM HH:mm', { locale: ru })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                                                         {/* Индикатор просмотра */}
                                     {viewStats && (
                                       <CommentViewIndicator
                                         key={`view-indicator-${comment.id}-${viewStats.viewStatus}-${viewStats.viewedAssignees}`}
                                         stats={viewStats}
                                         currentUserId={user?.id || 0}
                                         commentAuthorId={comment.authorId}
                                         className="ml-2"
                                       />
                                     )}
                                    {/* Кнопки редактирования */}
                                    {user?.id === comment.authorId && (
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => startEditingComment(comment.id, comment.content)}
                                          className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
                                          title="Редактировать комментарий"
                                        >
                                          <PencilIcon className="w-3 h-3" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteComment(comment.id)}
                                          className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded transition-colors"
                                          title="Удалить комментарий"
                                        >
                                          <TrashIcon className="w-3 h-3" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {editingCommentId === comment.id ? (
                                  <div className="space-y-2">
                                    <textarea
                                      value={editingCommentText}
                                      onChange={(e) => setEditingCommentText(e.target.value)}
                                      className="w-full p-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white resize-none"
                                      rows={2}
                                      autoFocus
                                    />
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleEditComment(comment.id, editingCommentText)}
                                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                      >
                                        Сохранить
                                      </button>
                                      <button
                                        onClick={cancelEditingComment}
                                        className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
                                      >
                                        Отмена
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {comment.content && (
                                      <p className="text-gray-300 text-sm">{comment.content}</p>
                                    )}
                                    {comment.fileUrl && comment.fileName && (
                                      <CommentFile
                                        fileName={comment.fileName}
                                        fileUrl={comment.fileUrl}
                                        fileSize={comment.fileSize}
                                        fileType={comment.fileName.split('.').pop() || ''}
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-2">
                          <p className="text-gray-500 text-sm">Комментариев нет</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Comment - Fixed at Bottom */}
              <div className="border-t border-gray-700 p-6 flex-shrink-0">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0 mt-2">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                  <div className="flex-1">
                    <ChatInput
                      value={newComment}
                      onChange={setNewComment}
                      onSubmit={handleSubmitComment}
                      placeholder="Написать комментарий..."
                      disabled={commentsLoading}
                      onFileSelect={handleFileSelect}
                      selectedFile={selectedFile}
                      onFileRemove={handleFileRemove}
                    />
                  </div>
                </div>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
} 