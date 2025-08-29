'use client';

import { Task, TaskStatus } from '@/types/task.types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useGetCommentsByTaskQuery, useCreateCommentMutation, useUpdateCommentMutation, useDeleteCommentMutation, useMarkCommentAsViewedMutation, useGetCommentViewStatsQuery, useMarkCommentAsSolutionMutation } from '@/store/api/comment.api';
import { useUpdateTaskMutation } from '@/store/api/task.api';
import { useUploadFileMutation } from '@/store/api/file.api';
import { useAuth } from '@/hooks/useAuth';
import { ChatInput, CommentFile } from '@/components/ui';
import { CommentViewIndicator } from '@/components/ui/CommentViewIndicator';
import { ArrowPathIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import { TaskType, getTaskTypeDisplay } from '@/types/task.types';

import { X, Send, MessageCircle, Edit } from 'lucide-react';
import { RTKQueryHelpers, useDebouncedRefetch } from '@/utils/rtk-query-helpers';
import { formatName } from '@/components/charts/DepartmentTasksExcelExport';


interface TaskDetailsModalProps {
  task: Task | null;
  visible: boolean;
  onClose: () => void;
  onTaskUpdate: (taskId: string, updatedTask: Task) => void;
}

export default function TaskDetailsModal({ task, visible, onClose, onTaskUpdate }: TaskDetailsModalProps) {
  const { user } = useAuth();

  // CSS стили для скроллбара в цвет проекта
  const scrollbarStyles = `
    .custom-scrollbar::-webkit-scrollbar {
      width: 8px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: #374151;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #3B82F6;
      border-radius: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: #2563EB;
    }
  `;
  
  // Функция для форматирования размера файла
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Б';
    const k = 1024;
    const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Функция для обрезки названия файла
  const truncateFileName = (fileName: string, maxLength: number = 30): string => {
    if (fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - 3);
    return `${truncatedName}...${extension ? '.' + extension : ''}`;
  };
  const [newComment, setNewComment] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [editingCommentFile, setEditingCommentFile] = useState<File | null>(null);
  const [isEditingComment, setIsEditingComment] = useState(false);

  const { 
    data: comments = [], 
    refetch: refetchComments, 
    isLoading: commentsLoading 
  } = useGetCommentsByTaskQuery(
    task?.id ? parseInt(task.id) : 0,
    { 
      skip: !task?.id || !visible,
      pollingInterval: visible ? 5000 : 0, // Уменьшаем интервал для более частого обновления
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
  const [markCommentAsSolution] = useMarkCommentAsSolutionMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [uploadFile] = useUploadFileMutation();

  // Получаем статистику просмотров для всех комментариев одним запросом
  // Статистика обновляется автоматически каждые 5 секунд через polling
  const { data: allViewStats = [] } = useGetCommentViewStatsQuery(
    { commentIds: comments.map(comment => comment.id) },
    { 
      skip: !comments.length || !visible,
      pollingInterval: 5000, // Обновление каждые 5 секунд
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
        // Статистика просмотров обновится автоматически через polling
      };
      
      markCommentsAsViewed();
    }
  }, [visible, user?.id, comments, markCommentAsViewed]);

  // Автоматическое обновление статистики при изменении комментариев
  // Убрано - статистика обновляется автоматически через polling

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
      
             // Статистика просмотров обновится автоматически через polling
      
    } catch (error) {
      console.error('Ошибка при создании комментария:', error);
    }
  };

  const handleEditComment = async (commentId: number, newContent: string) => {
    // Проверяем, что есть либо текст, либо файл
    if (!newContent.trim() && !editingCommentFile) {
      alert('Добавьте текст комментария или файл');
      return;
    }

    setIsEditingComment(true);
    try {
      let fileUrl: string | undefined = undefined;
      let fileName: string | undefined = undefined;
      let fileSize: number | undefined = undefined;

      // Если есть новый файл, загружаем его
      if (editingCommentFile) {
        try {
          const formData = new FormData();
          formData.append('file', editingCommentFile);
          
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

      // Подготавливаем данные для обновления
      const updateData: any = { content: newContent };
      
      // Если есть новый файл, добавляем его данные
      if (editingCommentFile) {
        updateData.fileUrl = fileUrl;
        updateData.fileName = fileName;
        updateData.fileSize = fileSize;
      } else {
        // Если файл убран, устанавливаем значения в null
        updateData.fileUrl = null;
        updateData.fileName = null;
        updateData.fileSize = null;
      }

      await updateComment({
        id: commentId,
        data: updateData
      }).unwrap();
      
      setEditingCommentId(null);
      setEditingCommentText('');
      setEditingCommentFile(null);
      safeRefetchComments();
      
    } catch (error) {
      console.error('Ошибка при обновлении комментария:', error);
    } finally {
      setIsEditingComment(false);
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

  const handleToggleSolution = async (commentId: number, isSolution: boolean) => {
    try {
      await markCommentAsSolution({
        commentId,
        isSolution: !isSolution
      }).unwrap();
    } catch (error) {
      console.error('Ошибка при пометке комментария как решения:', error);
    }
  };



    const startEditingComment = (commentId: number, currentContent: string, currentFile?: File | null) => {
    setEditingCommentId(commentId);
    setEditingCommentText(currentContent);
    setEditingCommentFile(currentFile || null);
    
    // Устанавливаем правильную высоту textarea после рендера
    setTimeout(() => {
      const textarea = document.querySelector(`textarea[data-comment-id="${commentId}"]`) as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
      }
    }, 0);
  };

  const cancelEditingComment = () => {
          setEditingCommentId(null);
      setEditingCommentText('');
      setEditingCommentFile(null);
      setIsEditingComment(false);
  };

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  const handleFileRemove = () => {
    setSelectedFile(null);
  };

  const handleEditingFileSelect = (file: File) => {
    setEditingCommentFile(file);
    // Показываем небольшое уведомление о выборе файла
    console.log(`Файл "${file.name}" выбран для замены`);
  };

  const handleEditingFileRemove = () => {
    setEditingCommentFile(null);
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

      let newPriority = priorityMap[task.priority as keyof typeof priorityMap] || 'LOW';
      if (newStatus === 'COMPLETED') {
        newPriority = 'LOW';
      }

      await updateTask({
        taskId: task.id,
        task: {
          title: task.title,
          description: task.description,
          priority: newPriority,
          status: newStatus,
          projectId: Number(task.projectId),
          deadline: task.deadline ? format(new Date(task.deadline), 'yyyy-MM-dd HH:mm:ss') : undefined
        }
      }).unwrap();

      onTaskUpdate(task.id, {
        ...task,
        status: newStatus,
        priority: newPriority === 'LOW' ? 'Низкий' : task.priority
      });

      setIsEditingStatus(false);
    } catch (error) {
      console.error('Ошибка при обновлении статуса:', error);
    }
  };

  if (!visible || !task) {
  
    return null;
  }

  return createPortal(
    <>
      <style>{scrollbarStyles}</style>
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
              <div className="grid grid-cols-5 gap-6 text-sm">
                {/* Проект */}
                {task.project && (
                  <div>
                    <span className="text-gray-400 text-xs uppercase tracking-wide">Проект</span>
                    <div className="mt-1">
                      <Link 
                        href={`/projects/${task.project.id}`}
                        className="font-medium text-blue-400 hover:text-blue-300 transition-colors cursor-pointer"
                      >
                        {task.project.title}
                      </Link>
                    </div>
                  </div>
                )}
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
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Тип задачи</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-medium text-gray-200">
                      {getTaskTypeDisplay(task.taskType as TaskType)}
                    </span>
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
              <div className="flex flex-row gap-6 text-sm">
                <div>
                  <span className="text-gray-400 text-xs uppercase tracking-wide">Создатель</span>
                  <div className="flex gap-2 mt-2">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-medium my-auto">
                      {task.creator.name.charAt(0)}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-200">
                        {formatName(task.creator.name)}
                      </span>
                      {task.creator.department && (
                        <span className="text-gray-400 text-xs"> ({task.creator.department.name})</span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                <span className="text-gray-400 text-xs uppercase tracking-wide">Исполнители</span>
                  <div className="flex gap-2 mt-2">
                    {task.assignees && task.assignees.length > 0 ? (
                      task.assignees.map((assignee) => (
                        <div key={assignee.id} className="mt-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {assignee.user.name.charAt(0)}
                        </div>
                      ))
                    ) : (
                      <span className="text-gray-500 text-sm">Не назначены</span>
                    )}
                  </div>
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
               <div className="flex-1 overflow-y-auto min-h-0 custom-scrollbar">
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
                            <div key={comment.id} className={`flex gap-3 rounded-lg transition-colors ${comment.isSolution ? 'p-2 border-2 border-green-400 bg-green-400/5' : ''}`}>
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
                                    {/* Индикатор просмотра рядом с датой */}
                                    {viewStats && (
                                      <CommentViewIndicator
                                        key={`view-indicator-${comment.id}-${viewStats.viewStatus}-${viewStats.viewedAssignees}`}
                                        stats={viewStats}
                                        currentUserId={user?.id || 0}
                                        commentAuthorId={comment.authorId}
                                        className="ml-2"
                                      />
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {/* Кнопки редактирования */}
                                    <div className="flex items-center gap-1">
                                                                             {/* Кнопка пометки как решение для исполнителей, начальника отдела и создателя */}
                                       {(task?.assignees?.some(assignee => assignee.userId === user?.id) || 
                                         user?.role === 'MANAGER' || 
                                         user?.id === task?.creatorId) && (
                                         <button
                                           onClick={() => handleToggleSolution(comment.id, comment.isSolution || false)}
                                           className={`p-1 rounded transition-colors ${
                                             comment.isSolution 
                                               ? 'text-green-400 bg-green-400/10 hover:bg-green-400/20' 
                                               : 'text-gray-400 hover:text-green-400 hover:bg-gray-700'
                                           }`}
                                           title={comment.isSolution ? "Убрать пометку решения" : "Пометить как решение"}
                                         >
                                           <CheckIcon className="w-3 h-3" />
                                         </button>
                                       )}
                                      {/* Кнопки автора комментария */}
                                      {user?.id === comment.authorId && (
                                        <>
                                          <button
                                            onClick={() => startEditingComment(comment.id, comment.content, null)}
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
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                                                 {editingCommentId === comment.id ? (
                                   <div className="space-y-2">
                                     <textarea
                                       value={editingCommentText}
                                       onChange={(e) => {
                                         setEditingCommentText(e.target.value);
                                         // Автоматическое изменение высоты textarea
                                         const textarea = e.target;
                                         textarea.style.height = 'auto';
                                         textarea.style.height = textarea.scrollHeight + 'px';
                                       }}
                                       className="w-full p-2 text-sm bg-gray-700 border border-gray-600 rounded-lg text-white resize-none overflow-hidden"
                                       rows={1}
                                       autoFocus
                                       data-comment-id={comment.id}
                                       placeholder="Введите текст комментария..."
                                     />
                                     
                                                                            {/* Редактирование файла */}
                                       <div className="space-y-2">
                                         <div className="flex items-center gap-2">
                                           <label className="text-xs text-gray-400">Файл:</label>
                                           {editingCommentFile ? (
                                             <div className="flex items-center gap-2">
                                               <span className="text-xs text-gray-300 bg-blue-900 px-2 py-1 rounded">
                                                 Новый: {truncateFileName(editingCommentFile.name)} ({formatFileSize(editingCommentFile.size)})
                                               </span>
                                               <button
                                                 onClick={handleEditingFileRemove}
                                                 className="text-xs text-red-400 hover:text-red-300"
                                               >
                                                 Убрать
                                               </button>
                                             </div>
                                           ) : comment.fileUrl ? (
                                             <div className="flex items-center gap-2">
                                               <span className="text-xs text-gray-300 bg-gray-700 px-2 py-1 rounded">
                                                 Текущий: {truncateFileName(comment.fileName)} {comment.fileSize ? `(${formatFileSize(comment.fileSize)})` : ''}
                                               </span>
                                               <label className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                                                 <input
                                                   type="file"
                                                   className="hidden"
                                                   onChange={(e) => {
                                                     const file = e.target.files?.[0];
                                                     if (file) {
                                                       handleEditingFileSelect(file);
                                                     }
                                                   }}
                                                 />
                                                 Заменить
                                               </label>
                                               <button
                                                 onClick={() => {
                                                   // Убираем файл из комментария
                                                   setEditingCommentFile(null);
                                                 }}
                                                 className="text-xs text-red-400 hover:text-red-300"
                                               >
                                                 Убрать
                                               </button>
                                             </div>
                                           ) : (
                                             <label className="text-xs text-blue-400 hover:text-blue-300 cursor-pointer">
                                               <input
                                                 type="file"
                                                 className="hidden"
                                                 onChange={(e) => {
                                                   const file = e.target.files?.[0];
                                                   if (file) {
                                                     handleEditingFileSelect(file);
                                                   }
                                                 }}
                                               />
                                               Добавить файл
                                             </label>
                                           )}
                                         </div>
                                       

                                     </div>
                                     
                                     <div className="flex gap-2">
                                       <button
                                         onClick={() => handleEditComment(comment.id, editingCommentText)}
                                         disabled={isEditingComment}
                                         className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                       >
                                         {isEditingComment ? 'Сохранение...' : 'Сохранить'}
                                       </button>
                                       <button
                                         onClick={cancelEditingComment}
                                         disabled={isEditingComment}
                                         className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                       >
                                         Отмена
                                       </button>
                                     </div>
                                   </div>
                                 ) : (
                                  <div className="space-y-2">
                                    {comment.content && (
                                      <p className="text-gray-300 text-sm whitespace-pre-wrap">{comment.content}</p>
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
     </>,
     document.body
   );
} 