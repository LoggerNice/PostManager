// Импортируем базовые типы из основного хука
export type { TrainingResult, UserInfo, DeleteTarget } from '@/hooks/useTrainerState';

// Типы для групп и задач
export interface TrainerTask {
  id: number;
  title: string;
  description: string;
  command: string;
  hint?: string;
  groupName?: string;
  groupId?: number;
}

export interface TrainerGroup {
  id: number;
  name: string;
  missions: TrainerTask[];
  createdAt: string;
  updatedAt: string;
}

export interface TrainingStats {
  correctAnswers: TrainerTask[];
  incorrectAnswers: TrainerTask[];
  unansweredTasks: TrainerTask[];
  totalTasks: number;
}

// Типы для форм
export interface NewTaskForm {
  title: string;
  description: string;
  command: string;
  hint: string;
  groupName: string;
}



export interface EditingTask extends TrainerTask {
  // Дополнительные поля для редактирования
}

// Типы для пропсов компонентов
export interface BaseTrainerProps {
  className?: string;
}

export interface TrainerWelcomeProps extends BaseTrainerProps {
  onStartTraining: () => void;
}

export interface GroupSelectionProps extends BaseTrainerProps {
  groups: TrainerGroup[];
  selectedGroupIds: number[];
  onToggleGroup: (groupId: number) => void;
  onToggleSelectAll: () => void;
  onConfirmSelection: () => void;
}

export interface TrainingSessionProps extends BaseTrainerProps {
  groups: TrainerGroup[];
  selectedGroupIds: number[];
  expanded: { [key: number]: boolean };
  trainingResults: { [taskId: number]: boolean };
  attemptsByTask: { [taskId: number]: number };
  userInfo: {
    isGuest?: boolean;
  };
  onToggleGroup: (groupId: number) => void;
  onTaskResult: (taskId: number, isCorrect: boolean) => void;
  onAttempt: (taskId: number) => void;
  onFinishTraining: () => void;
}

export interface TrainingReportProps extends BaseTrainerProps {
  stats: TrainingStats;
  onResetTraining: () => void;
}

export interface AdminTasksPanelProps extends BaseTrainerProps {
  groups: TrainerGroup[];
  expanded: { [key: number]: boolean };
  newTask: NewTaskForm;
  editingTask: EditingTask | null;
  onToggleGroup: (groupId: number) => void;
  onNewTaskChange: (task: NewTaskForm) => void;
  onCreateTask: () => void;
  onEditTask: (task: TrainerTask) => void;
  onUpdateTask: () => void;
  onCancelEdit: () => void;
  onDeleteTask: (task: TrainerTask) => void;
}

export interface TrainerUser {
  id: number;
  name: string;
  login: string;
  department?: {
    id: number;
    name: string;
  };
  trainingResults?: Array<{
    id: number;
    totalTasks: number;
    correctAnswers: number;
    incorrectAnswers: number;
    completedAt: string;
  }>;
}

export interface DepartmentGroup {
  departmentName: string;
  users: TrainerUser[];
  totalUsers: number;
  totalTrainingResults: number;
}

export interface AdminEmployeesPanelProps extends BaseTrainerProps {
  users: TrainerUser[];
  departments: DepartmentGroup[];
  isLoadingUsers: boolean;
}
