'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { BeakerIcon, DocumentTextIcon, UsersIcon, WrenchScrewdriverIcon, TrophyIcon } from '@heroicons/react/24/solid';
import { useGetTaskGroupsQuery, useSaveTrainingResultMutation, useGetRatingsQuery } from '@/store/api/trainer.api';
import { useGetUsersQuery } from '@/store/api/user.api';
import { useAuth } from '@/hooks/useAuth';

// Хуки
import { useTrainerState } from '@/hooks/useTrainerState';
import { useNotification } from '@/hooks/useNotification';
import { useAdminFunctions } from '@/hooks/useAdminFunctions';

// Компоненты
import { TrainerWelcome } from '@/components/trainer/TrainerWelcome';
import { GroupSelection } from '@/components/trainer/GroupSelection';
import { TrainingSession } from '@/components/trainer/TrainingSession';
import { TrainingReport } from '@/components/trainer/TrainingReport';
import { AdminTasksPanel } from '@/components/trainer/AdminTasksPanel';
import { AdminEmployeesPanel } from '@/components/trainer/AdminEmployeesPanel';
import UserInfoModal from '@/components/trainer/UserInfoModal';
import TrainerRating from '@/components/trainer/TrainerRating';

// Утилиты и константы
import { getCookie } from '@/utils/cookie';
import { UserRole } from '@/constants';
import { TRAINER_MESSAGES, TRAINER_LABELS } from '@/constants/trainer';
import { TrainingStats } from '@/types/trainer.types';

export default function Trainer() {
  // RTK Query для получения данных
  const { data: groups = [], isLoading, error: queryError, refetch } = useGetTaskGroupsQuery();
  const [saveTrainingResult] = useSaveTrainingResultMutation();

  // Получение пользователей и результатов тренировок
  const { data: allUsers = [], isLoading: isLoadingUsers, error: usersError } = useGetUsersQuery();
  const { data: trainingRatings = [] } = useGetRatingsQuery();



  // Проверка прав пользователя с учетом hydration
  const [isAdmin, setIsAdmin] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);

  // Получаем информацию о текущем пользователе
  const { user: currentUser, isAuthenticated } = useAuth();

  useEffect(() => {
    // Получаем роль пользователя на клиенте
    const userRole = getCookie('userRole');
    setIsAdmin(userRole === UserRole.ADMIN || userRole === UserRole.MANAGER);
    setIsClientReady(true);
  }, []);

  // Кастомные хуки
  const { state, actions }: { state: any; actions: any } = useTrainerState();
  const { notification, showNotification } = useNotification();
  const adminFunctions = useAdminFunctions({
    refetch,
    showNotification,
    setDeleteTarget: actions.setDeleteTarget,
    setShowConfirmModal: actions.setShowConfirmModal,
    setEditingTask: actions.setEditingTask,
    setNewTask: actions.setNewTask
  });

  // Группировка пользователей по отделам с результатами тренировок
  const usersWithTraining = useMemo(() => {
    return allUsers.map((user: any) => {


      const userTrainingResults = trainingRatings.filter((rating: any) => rating.employee.id === user.id).map((rating: any) => ({
        id: rating.id,
        totalTasks: rating.totalTasks,
        correctAnswers: rating.correctAnswers,
        incorrectAnswers: rating.incorrectAnswers,
        completedAt: rating.createdAt
      }));
      return {
        id: user.id,
        name: user.name,
        login: user.login || '',
        department: user.department,
        trainingResults: userTrainingResults
      };
    });
  }, [allUsers, trainingRatings]);

  // Группировка по отделам
  const departmentsWithUsers = useMemo(() => {
    const deptMap = new Map();

    usersWithTraining.forEach(user => {
      const deptName = user.department?.name || 'Без отдела';

      if (!deptMap.has(deptName)) {
        deptMap.set(deptName, {
          departmentName: deptName,
          users: [],
          totalUsers: 0,
          totalTrainingResults: 0
        });
      }

      const dept = deptMap.get(deptName);
      dept.users.push(user);
      dept.totalUsers++;
      dept.totalTrainingResults += user.trainingResults?.length || 0;
    });

    return Array.from(deptMap.values());
  }, [usersWithTraining]);

  // Вычисляемые значения
  const error = queryError ? TRAINER_MESSAGES.ERROR_LOADING_TASKS : null;

  const trainingStats = useMemo((): TrainingStats => {
    const selectedGroups = groups.filter(group => state.selectedGroupIds.includes(group.id));
    const allTasks = selectedGroups.flatMap(group => group.missions || []);
    return {
      correctAnswers: allTasks.filter(task => state.trainingResults[task.id] === true),
      incorrectAnswers: allTasks.filter(task => state.trainingResults[task.id] === false),
      unansweredTasks: allTasks.filter(task => state.trainingResults[task.id] === undefined),
      totalTasks: allTasks.length
    };
  }, [groups, state.selectedGroupIds, state.trainingResults]);

  // Обработчики событий с использованием хуков
  const startTraining = () => {
    const availableGroups = groups.filter(g => g.name !== 'Нераспределенные задачи');
    actions.startTraining(availableGroups);
  };

  const finishTraining = async () => {
    actions.finishTraining();

    // Сохранение результатов тренировки в БД postmanager только если пользователь аутентифицирован
    if (isAuthenticated && currentUser && currentUser.id) {
      try {
        const selectedGroups = groups.filter(group => state.selectedGroupIds.includes(group.id));
        const allTasks = selectedGroups.flatMap(group => group.missions || []);
        const correctAnswers = allTasks.filter(task => state.trainingResults[task.id] === true).length;
        const incorrectAnswers = allTasks.filter(task => state.trainingResults[task.id] === false).length;

        // Сохраняем результат тренировки для текущего аутентифицированного пользователя
        const sessionId = `${Date.now()}_${currentUser.id}`;
        await saveTrainingResult({
          employeeId: currentUser.id,
          sessionId,
          totalTasks: allTasks.length,
          correctAnswers,
          incorrectAnswers
        }).unwrap();
        
        console.log('Training results saved successfully for user:', currentUser.name);
        showNotification('Результаты тренировки сохранены!', 'success');
      } catch (error) {
        console.error('Error saving training results:', error);
        showNotification('Ошибка сохранения результатов тренировки', 'error');
      }
    } else {
      console.log('User not authenticated - results not saved to database');
      if (!state.userInfo.isGuest) {
        showNotification('Необходимо авторизоваться для сохранения результатов', 'error');
      }
    }
  };

  const handleCreateTask = () => {
    adminFunctions.handleCreateTask(state.newTask);
  };

  const handleUpdateTask = () => {
    adminFunctions.handleUpdateTask(state.editingTask);
  };

  const handleDeleteTask = (task: any) => {
    actions.handleDeleteTask(task);
  };

  const confirmDelete = () => {
    adminFunctions.confirmDelete(state.deleteTarget!);
  };



  return (
    <div className="p-6">
      {/* Заголовок */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <BeakerIcon className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {TRAINER_LABELS.TRAINER_TITLE}
            </h1>
          </div>

        </div>

        {/* Вкладки для переключения режимов */}
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => actions.setActiveMode('trainer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              state.activeMode === 'trainer'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <BeakerIcon className="h-5 w-5" />
            {TRAINER_LABELS.TRAINER_TAB}
          </button>
          <button
            onClick={() => actions.setActiveMode('rating')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              state.activeMode === 'rating'
                ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <TrophyIcon className="h-5 w-5" />
            {TRAINER_LABELS.RATING}
          </button>
          {isClientReady && isAdmin && (
            <button
              onClick={() => actions.setActiveMode('admin')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                state.activeMode === 'admin'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <WrenchScrewdriverIcon className="h-5 w-5" />
              {TRAINER_LABELS.ADMIN_TAB}
            </button>
          )}
        </div>
      </div>
    
          {/* Вкладки для админ панели */}
      {state.activeMode === 'admin' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => actions.setActiveAdminTab('tasks')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                state.activeAdminTab === 'tasks'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <DocumentTextIcon className="h-5 w-5" />
              {TRAINER_LABELS.TASKS_TAB}
            </button>
            <button
              onClick={() => actions.setActiveAdminTab('employees')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
                state.activeAdminTab === 'employees'
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <UsersIcon className="h-5 w-5" />
              {TRAINER_LABELS.EMPLOYEES_TAB}
            </button>
          </div>
        </div>
      )}

      {/* Основной контент */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        {state.activeMode === 'trainer' ? (
          <>
          {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600 dark:text-gray-400">{TRAINER_MESSAGES.LOADING_TASKS}</span>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-500 mb-4">{error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
                  {TRAINER_MESSAGES.TRY_AGAIN}
            </button>
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">{TRAINER_MESSAGES.NO_TASKS_AVAILABLE}</p>
          </div>
            ) : !state.isTrainingStarted ? (
              <TrainerWelcome onStartTraining={startTraining} />
            ) : state.showReport ? (
              <TrainingReport
                stats={trainingStats}
                onResetTraining={actions.resetTraining}
              />
            ) : !state.isGroupSelectionDone ? (
              <GroupSelection
                groups={groups}
                selectedGroupIds={state.selectedGroupIds}
                onToggleGroup={actions.toggleSelectGroup}
                onToggleSelectAll={() => actions.toggleSelectAllGroups(groups.filter(g => g.name !== 'Нераспределенные задачи'))}
                onConfirmSelection={actions.confirmGroupSelection}
              />
            ) : (
              <TrainingSession
                groups={groups}
                selectedGroupIds={state.selectedGroupIds}
                expanded={state.expanded}
                trainingResults={state.trainingResults}
                attemptsByTask={state.attemptsByTask}
                userInfo={state.userInfo}
                onToggleGroup={actions.toggleGroup}
                onTaskResult={actions.handleTaskResult}
                onAttempt={actions.handleAttempt}
                onFinishTraining={finishTraining}
              />
            )}
          </>
        ) : state.activeMode === 'rating' ? (
          /* Рейтинг */
          <div className="max-h-96 overflow-y-auto">
            <TrainerRating onClose={() => actions.setActiveMode('trainer')} />
          </div>
        ) : (
          /* Админ панель */
          <>
            {state.activeAdminTab === 'tasks' ? (
              <AdminTasksPanel
                groups={groups}
                expanded={state.expanded}
                newTask={state.newTask}
                editingTask={state.editingTask}
                onToggleGroup={actions.toggleGroup}
                onNewTaskChange={actions.setNewTask}
                onCreateTask={handleCreateTask}
                onEditTask={actions.setEditingTask}
                onUpdateTask={handleUpdateTask}
                onCancelEdit={() => actions.setEditingTask(null)}
                onDeleteTask={handleDeleteTask}
              />
            ) : (
              <AdminEmployeesPanel
                users={usersWithTraining}
                departments={departmentsWithUsers}
                isLoadingUsers={isLoadingUsers}
              />
            )}
          </>
        )}
            </div>

      {/* Модальные окна */}
            {state.showUserInfoModal && !state.isUserInfoDone && (
        <UserInfoModal
          onClose={() => actions.setShowUserInfoModal(false)}
          onSubmit={actions.submitUserInfo}
        />
      )}

      {/* Confirmation Modal */}
      {state.showConfirmModal && state.deleteTarget && (
        <div className="fixed inset-0 backdrop-blur-sm bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              {TRAINER_MESSAGES.CONFIRM_DELETE}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {TRAINER_MESSAGES.CONFIRM_DELETE_MESSAGE} "{state.deleteTarget.name}"?
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {TRAINER_LABELS.DELETE}
              </button>
              <button
                onClick={actions.cancelDelete}
                className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {TRAINER_LABELS.CANCEL}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification.show && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          notification.type === 'success'
            ? 'bg-green-500 text-white'
            : 'bg-red-500 text-white'
        }`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}
