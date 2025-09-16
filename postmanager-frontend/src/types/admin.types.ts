export interface Option {
  value: number;
  label: string;
}

// Статистика для админ панели
export interface AdminStats {
  totalUsers: number;
  totalProjects: number;
  totalTasks: number;
  totalDepartments: number;
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
  overdueProjects: number;
}

// Данные для графиков
export interface UserActivityData {
  userId: number;
  userName: string;
  department: string;
  totalTasks: number;
  completedTasks: number;
  activeTasks: number;
  lastActivity: string;
}

export interface ProjectAnalytics {
  projectId: number;
  title: string;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  status: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
}

export interface DepartmentStats {
  departmentId: number;
  name: string;
  userCount: number;
  projectCount: number;
  taskCount: number;
  completedTaskCount: number;
  averageProgress: number;
}

// Системные настройки
export interface SystemSettings {
  maintenanceMode: boolean;
  allowUserRegistration: boolean;
  defaultUserRole: string;
  sessionTimeout: number;
  maxFileSize: number;
  allowedFileTypes: string[];
}

// Формы для админ операций
export interface CreateUserFormData {
  name: string;
  login: string;
  password: string;
  role: string;
  departmentId: number;
}

export interface EditUserFormData {
  name: string;
  login: string;
  role: string;
  departmentId: number;
  password?: string;
}

export interface CreateDepartmentFormData {
  name: string;
}

// Логи системы
export interface SystemLog {
  id: number;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  userId?: number;
  userName?: string;
  timestamp: string;
  action: string;
  details?: Record<string, any>;
}

// Системные метрики
export interface SystemMetrics {
  cpu: {
    usage: number; // Процент использования CPU
    cores: number; // Количество ядер
    loadAverage: number; // Средняя загрузка системы
  };
  memory: {
    total: number; // Общий объем памяти в байтах
    used: number; // Используемая память в байтах
    free: number; // Свободная память в байтах
    usagePercent: number; // Процент использования памяти
  };
  disk: {
    used: number; // Используемое место на диске в байтах
    free: number; // Свободное место на диске в байтах
    total: number; // Общий объем диска в байтах
    usagePercent: number; // Процент использования диска
  };
  uptime: number; // Время работы системы в секундах
  timestamp: string; // Время получения метрик
}