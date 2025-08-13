import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Task, TaskStatus, TaskPriority, TaskPriorityDisplay } from '@/types/task.types';
import { TaskEventData } from '@/contexts/WebSocketContext';

interface TaskState {
  // Единое хранилище всех задач
  tasks: Task[];
  // Загрузка
  isLoading: boolean;
  // Ошибки
  error: string | null;
  // Время последней синхронизации
  lastSync: number;
  // Ожидающие операции (для предотвращения конфликтов)
  pendingOperations: string[];
}

const initialState: TaskState = {
  tasks: [],
  isLoading: false,
  error: null,
  lastSync: 0,
  pendingOperations: []
};

// Утилиты для работы с приоритетами
const priorityMapToRussian: Record<TaskPriority, TaskPriorityDisplay> = {
  'LOW': 'Низкий',
  'MEDIUM': 'Средний',
  'HIGH': 'Высокий'
};

const priorityMapToEnglish: Record<TaskPriorityDisplay, TaskPriority> = {
  'Низкий': 'LOW',
  'Средний': 'MEDIUM',
  'Высокий': 'HIGH'
};

// Функция для преобразования задачи в правильный формат
const normalizeTask = (task: any): Task => ({
  ...task,
  id: String(task.id),
  priority: priorityMapToRussian[task.priority as TaskPriority] || task.priority
});

// Функция для обновления задач пользователя
const updateUserTasks = (userTasks: Task[], userId: number): Task[] => {
  return userTasks.filter(task => 
    task.assignees?.some(assignee => assignee.userId === userId)
  );
};

const taskSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    // Инициализация задач проекта
    setProjectTasks: (state, action: PayloadAction<{ projectId: number; tasks: Task[] }>) => {
      const { projectId, tasks } = action.payload;
      const normalizedTasks = tasks.map(normalizeTask);
      
      // Удаляем старые задачи этого проекта
      state.tasks = state.tasks.filter(task => task.projectId !== projectId);
      // Добавляем новые задачи
      state.tasks.push(...normalizedTasks);
      state.lastSync = Date.now();
    },

    // Инициализация задач пользователя
    setUserTasks: (state, action: PayloadAction<Task[]>) => {
      const normalizedTasks = action.payload.map(normalizeTask);
      
      // Объединяем с существующими задачами, избегая дублирования
      const existingTaskIds = new Set(state.tasks.map(task => task.id));
      const newTasks = normalizedTasks.filter(task => !existingTaskIds.has(task.id));
      state.tasks.push(...newTasks);
      state.lastSync = Date.now();
    },

    // WebSocket события
    handleTaskCreated: (state, action: PayloadAction<TaskEventData>) => {
      const { task, projectId } = action.payload;
      if (!task || !projectId) return;

      const normalizedTask = normalizeTask(task);
      
      // Проверяем, есть ли уже такая задача
      const existingIndex = state.tasks.findIndex(t => t.id === normalizedTask.id);
      if (existingIndex === -1) {
        state.tasks.push(normalizedTask);
      }
    },

    handleTaskUpdated: (state, action: PayloadAction<TaskEventData>) => {
      const { task, projectId } = action.payload;
      if (!task || !projectId) return;

      const normalizedTask = normalizeTask(task);
      
      // Обновляем задачу в едином хранилище
      const taskIndex = state.tasks.findIndex(t => t.id === normalizedTask.id);
      if (taskIndex !== -1) {
        state.tasks[taskIndex] = normalizedTask;
      } else {
        state.tasks.push(normalizedTask);
      }
    },

    handleTaskDeleted: (state, action: PayloadAction<TaskEventData>) => {
      const { taskId, projectId } = action.payload;
      if (!taskId) return;

      // Удаляем задачу из единого хранилища
      state.tasks = state.tasks.filter(t => t.id !== String(taskId));
    },

    handleTaskAssigned: (state, action: PayloadAction<TaskEventData>) => {
      const { task, assigneeIds } = action.payload;
      if (!task || !assigneeIds?.length) return;

      const normalizedTask = normalizeTask(task);
      
      // Обновляем задачу в едином хранилище
      const taskIndex = state.tasks.findIndex(t => t.id === normalizedTask.id);
      if (taskIndex !== -1) {
        state.tasks[taskIndex] = normalizedTask;
      } else {
        state.tasks.push(normalizedTask);
      }
    },

    handleTaskUnassigned: (state, action: PayloadAction<TaskEventData>) => {
      const { taskId, unassignedUserIds } = action.payload;
      if (!taskId || !unassignedUserIds?.length) return;

      // Обновляем задачу в едином хранилище (удаляем назначение)
      const taskIndex = state.tasks.findIndex(t => t.id === String(taskId));
      if (taskIndex !== -1) {
        const task = state.tasks[taskIndex];
        const updatedAssignees = task.assignees?.filter(assignee => 
          !unassignedUserIds.includes(assignee.userId)
        ) || [];
        state.tasks[taskIndex] = { ...task, assignees: updatedAssignees };
      }
    },

    // Локальные операции
    addPendingOperation: (state, action: PayloadAction<string>) => {
      if (!state.pendingOperations.includes(action.payload)) {
        state.pendingOperations.push(action.payload);
      }
    },

    removePendingOperation: (state, action: PayloadAction<string>) => {
      state.pendingOperations = state.pendingOperations.filter(op => op !== action.payload);
    },

    // Создание задачи
    createTaskLocally: (state, action: PayloadAction<{ task: Task; projectId: number }>) => {
      const { task, projectId } = action.payload;
      const normalizedTask = normalizeTask(task);

      // Добавляем в единое хранилище
      state.tasks.push(normalizedTask);
    },

    // Обновление задачи
    updateTaskLocally: (state, action: PayloadAction<{ task: Task; projectId: number }>) => {
      const { task, projectId } = action.payload;
      const normalizedTask = normalizeTask(task);

      // Обновляем в едином хранилище
      const taskIndex = state.tasks.findIndex(t => t.id === normalizedTask.id);
      if (taskIndex !== -1) {
        state.tasks[taskIndex] = normalizedTask;
      } else {
        state.tasks.push(normalizedTask);
      }
    },

    // Удаление задачи
    deleteTaskLocally: (state, action: PayloadAction<{ taskId: string; projectId: number }>) => {
      const { taskId, projectId } = action.payload;

      // Удаляем из единого хранилища
      state.tasks = state.tasks.filter(t => t.id !== taskId);
    },

    // Установка состояния загрузки
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Установка ошибки
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // Очистка состояния
    clearTasks: (state) => {
      state.tasks = [];
      state.error = null;
      state.lastSync = 0;
      state.pendingOperations = [];
    }
  }
});

export const {
  setProjectTasks,
  setUserTasks,
  handleTaskCreated,
  handleTaskUpdated,
  handleTaskDeleted,
  handleTaskAssigned,
  handleTaskUnassigned,
  addPendingOperation,
  removePendingOperation,
  createTaskLocally,
  updateTaskLocally,
  deleteTaskLocally,
  setLoading,
  setError,
  clearTasks
} = taskSlice.actions;

// Селекторы
export const selectProjectTasks = (state: { tasks: TaskState }, projectId: number) => 
  state.tasks.tasks.filter(task => task.projectId === projectId);

export const selectUserTasks = (state: { tasks: TaskState }, userId?: number) => 
  userId 
    ? state.tasks.tasks.filter(task => 
        task.assignees?.some(assignee => assignee.userId === userId)
      )
    : state.tasks.tasks;

export const selectTasksLoading = (state: { tasks: TaskState }) => 
  state.tasks.isLoading;

export const selectTasksError = (state: { tasks: TaskState }) => 
  state.tasks.error;

export const selectLastSync = (state: { tasks: TaskState }) => 
  state.tasks.lastSync;

export const selectPendingOperations = (state: { tasks: TaskState }) => 
  state.tasks.pendingOperations;

export default taskSlice.reducer;
