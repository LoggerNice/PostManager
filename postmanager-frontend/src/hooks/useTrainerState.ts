import { useState } from 'react';

// Типы для тренажера
export interface TrainingResult {
  [taskId: number]: boolean;
}

export interface UserInfo {
  lastName: string;
  firstName: string;
  department: string;
  postLinkId: string;
  isGuest?: boolean;
}

export interface DeleteTarget {
  type: 'task' | 'employee' | 'group' | 'department';
  id: number;
  name: string;
}

export interface TrainerState {
  // Основное состояние
  activeMode: 'trainer' | 'admin' | 'rating';
  activeAdminTab: 'tasks' | 'employees';
  expanded: { [key: number]: boolean };
  isTrainingStarted: boolean;
  trainingResults: TrainingResult;
  showReport: boolean;
  selectedGroupIds: number[];
  isGroupSelectionDone: boolean;
  attemptsByTask: { [key: number]: number };
  showUserInfoModal: boolean;
  userInfo: UserInfo;
  isUserInfoDone: boolean;
  showRating: boolean;

  // Состояние для админ панели
  newTask: {
    title: string;
    description: string;
    command: string;
    hint: string;
    groupName: string;
  };
  editingTask: any;
  showConfirmModal: boolean;
  deleteTarget: DeleteTarget | null;
}

export interface TrainerActions {
  setActiveMode: (mode: 'trainer' | 'admin' | 'rating') => void;
  setActiveAdminTab: (tab: 'tasks' | 'employees') => void;
  toggleGroup: (groupId: number) => void;
  toggleSelectGroup: (groupId: number) => void;
  toggleSelectAllGroups: (availableGroups: any[]) => void;
  handleTaskResult: (taskId: number, isCorrect: boolean) => void;
  handleAttempt: (taskId: number) => void;
  startTraining: (availableGroups: any[]) => void;
  finishTraining: () => void;
  resetTraining: () => void;
  confirmGroupSelection: () => void;
  setShowUserInfoModal: (show: boolean) => void;
  submitUserInfo: (info: UserInfo) => void;
  setShowRating: (show: boolean) => void;
  setNewTask: (task: any) => void;
  setEditingTask: (task: any) => void;
  handleDeleteTask: (task: any) => void;
  setShowConfirmModal: (show: boolean) => void;
  setDeleteTarget: (target: DeleteTarget | null) => void;
  cancelDelete: () => void;
}

export const useTrainerState = () => {
  // Основное состояние
  const [activeMode, setActiveMode] = useState<'trainer' | 'admin' | 'rating'>('trainer');
  const [activeAdminTab, setActiveAdminTab] = useState<'tasks' | 'employees'>('tasks');
  const [expanded, setExpanded] = useState<{[key: number]: boolean}>({});
  const [isTrainingStarted, setIsTrainingStarted] = useState(false);
  const [trainingResults, setTrainingResults] = useState<TrainingResult>({});
  const [showReport, setShowReport] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [isGroupSelectionDone, setIsGroupSelectionDone] = useState(false);
  const [attemptsByTask, setAttemptsByTask] = useState<{[key: number]: number}>({});
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({
    lastName: '',
    firstName: '',
    department: '',
    postLinkId: ''
  });
  const [isUserInfoDone, setIsUserInfoDone] = useState(false);
  const [showRating, setShowRating] = useState(false);



  // Состояние для админ панели
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    command: '',
    hint: '',
    groupName: ''
  });

  const [editingTask, setEditingTask] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // Функции для управления состоянием
  const toggleGroup = (groupId: number) => {
    setExpanded(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const toggleSelectGroup = (groupId: number) => {
    setSelectedGroupIds(prev => (
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    ));
  };

  const toggleSelectAllGroups = (availableGroups: any[]) => {
    if (selectedGroupIds.length === availableGroups.length) {
      setSelectedGroupIds([]);
    } else {
      setSelectedGroupIds(availableGroups.map(g => g.id));
    }
  };

  const handleTaskResult = (taskId: number, isCorrect: boolean) => {
    setTrainingResults(prev => ({
      ...prev,
      [taskId]: isCorrect
    }));
  };

  const handleAttempt = (taskId: number) => {
    setAttemptsByTask(prev => ({
      ...prev,
      [taskId]: (prev[taskId] || 0) + 1
    }));
  };

  const startTraining = (availableGroups: any[]) => {
    setIsTrainingStarted(true);
    setShowReport(false);
    setTrainingResults({});
    setSelectedGroupIds(availableGroups.map(g => g.id));
    setIsGroupSelectionDone(false);
    setAttemptsByTask({});
  };

  const finishTraining = () => {
    setShowReport(true);
  };

  const resetTraining = () => {
    setIsTrainingStarted(false);
    setShowReport(false);
    setTrainingResults({});
    setSelectedGroupIds([]);
    setIsGroupSelectionDone(false);
    setAttemptsByTask({});
  };

  const confirmGroupSelection = () => {
    if (selectedGroupIds.length > 0) {
      setIsGroupSelectionDone(true);
      setShowUserInfoModal(true);
    }
  };

  const submitUserInfo = (info: UserInfo) => {
    setUserInfo(info);
    setIsUserInfoDone(true);
    setShowUserInfoModal(false);
  };

  const handleDeleteTask = (task: any) => {
    setDeleteTarget({
      type: 'task',
      id: task.id,
      name: task.title
    });
    setShowConfirmModal(true);
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setDeleteTarget(null);
  };

  const actions: TrainerActions = {
    setActiveMode: (mode: 'trainer' | 'admin' | 'rating') => setActiveMode(mode),
    setActiveAdminTab,
    toggleGroup,
    toggleSelectGroup,
    toggleSelectAllGroups,
    handleTaskResult,
    handleAttempt,
    startTraining,
    finishTraining,
    resetTraining,
    confirmGroupSelection,
    setShowUserInfoModal,
    submitUserInfo,
    setShowRating,
    setNewTask,
    setEditingTask,
    handleDeleteTask,
    setShowConfirmModal,
    setDeleteTarget,
    cancelDelete
  };

  return {
    // Состояние
    state: {
      activeMode,
      activeAdminTab,
      expanded,
      isTrainingStarted,
      trainingResults,
      showReport,
      selectedGroupIds,
      isGroupSelectionDone,
      attemptsByTask,
      showUserInfoModal,
      userInfo,
      isUserInfoDone,
      showRating,
      newTask,
      editingTask,
      showConfirmModal,
      deleteTarget
    },

    // Actions
    actions
  };
};
