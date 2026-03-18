import { UserRole } from '@/types';
import { ChartBarIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
export { UserRole } from '@/types';

export const TABS = [
  { key: 'tasks', label: 'Задачи', icon: ClipboardDocumentListIcon },
  { key: 'timeline', label: 'Этапы', icon: ChartBarIcon }
];

export const USER_ROLE_LABELS = {
  [UserRole.ADMIN]: 'Администратор',
  [UserRole.MANAGER]: 'Начальник отдела',
  [UserRole.USER]: 'Сотрудник',
} as const;







export const PAGE_URL = {
  AUTH: '/auth',
  HOME: '/',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  ADMIN: '/admin',
  ROADMAP: '/roadmap',
  TEST: '/test',
  MY_TASKS: '/my-tasks',
  MY_DEPARTMENT: '/my-department',
  ANALYSIS: '/analysis'
}
