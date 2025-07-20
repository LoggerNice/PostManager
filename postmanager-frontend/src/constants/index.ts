import { Priority, ProjectStatus, TaskStatus, UserRole } from '@/types';
import { ChartBarIcon, CalendarDaysIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
export { UserRole, Priority, ProjectStatus, TaskStatus } from '@/types';

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    PROFILE: '/api/auth/profile',
  },
  PROJECTS: {
    LIST: '/api/projects',
    CREATE: '/api/projects',
    GET: (id: string) => `/api/projects/${id}`,
    UPDATE: (id: string) => `/api/projects/${id}`,
    DELETE: (id: string) => `/api/projects/${id}`,
  },
  TASKS: {
    LIST: '/api/tasks',
    CREATE: '/api/tasks',
    GET: (id: string) => `/api/tasks/${id}`,
    UPDATE: (id: string) => `/api/tasks/${id}`,
    DELETE: (id: string) => `/api/tasks/${id}`,
  },
} as const;

export const TABS = [
  { key: 'tasks', label: 'Задачи', icon: ClipboardDocumentListIcon },
  { key: 'timeline', label: 'Этапы', icon: ChartBarIcon },
  { key: 'calendar', label: 'Календарь', icon: CalendarDaysIcon }
];

// Status labels
export const STATUS_LABELS = {
  [ProjectStatus.PLANNING]: 'Планирование',
  [ProjectStatus.IN_PROGRESS]: 'В работе',
  [ProjectStatus.ON_HOLD]: 'Приостановлен',
  [ProjectStatus.COMPLETED]: 'Завершен',
  [ProjectStatus.CANCELLED]: 'Отменен',
} as const;

export const TASK_STATUS_LABELS = {
  [TaskStatus.TODO]: 'К выполнению',
  [TaskStatus.IN_PROGRESS]: 'В работе',
  [TaskStatus.IN_REVIEW]: 'На проверке',
  [TaskStatus.DONE]: 'Выполнено',
} as const;

export const PRIORITY_LABELS = {
  [Priority.LOW]: 'Низкий',
  [Priority.MEDIUM]: 'Средний',
  [Priority.HIGH]: 'Высокий'
} as const;

export const USER_ROLE_LABELS = {
  [UserRole.ADMIN]: 'Администратор',
  [UserRole.MANAGER]: 'Начальник отдела',
  [UserRole.USER]: 'Сотрудник',
} as const;

// Colors for statuses
export const STATUS_COLORS = {
  [ProjectStatus.PLANNING]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  [ProjectStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  [ProjectStatus.ON_HOLD]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  [ProjectStatus.COMPLETED]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  [ProjectStatus.CANCELLED]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
} as const;

export const TASK_STATUS_COLORS = {
  [TaskStatus.TODO]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  [TaskStatus.IN_REVIEW]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  [TaskStatus.DONE]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
} as const;

export const PRIORITY_COLORS = {
  [Priority.LOW]: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  [Priority.MEDIUM]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  [Priority.HIGH]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
} as const;

// Validation rules
export const VALIDATION_RULES = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  NAME_MIN_LENGTH: 2,
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

// Local storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
} as const;

export const PAGE_URL = {
  AUTH: '/auth',
  HOME: '/',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  ADMIN: '/test'
}
