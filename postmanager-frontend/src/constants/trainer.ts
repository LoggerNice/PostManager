// Конфигурация тренажера
export const TRAINER_CONFIG = {
  MAX_ATTEMPTS_PER_TASK: 2,
  NOTIFICATION_TIMEOUT: 3000,
  LINUX_TRAINER_API_BASE: 'http://localhost:5000/api'
};

// Сообщения
export const TRAINER_MESSAGES = {
  ERROR_LOADING_TASKS: 'Не удалось загрузить задачи. Убедитесь, что backend Linux-Trainer запущен на порту 5000.',
  GUEST_MODE: '👤 Гостевой режим: Решайте задачи и проверяйте свои ответы. Результаты не сохраняются в рейтинг.',
  TRAINING_MODE: 'Решайте задачи и проверяйте свои ответы. Все результаты будут сохранены для отчета.',
  WELCOME_TITLE: 'Добро пожаловать в тренажер!',
  WELCOME_DESCRIPTION: 'Проверьте свои знания команд Linux и AstraLinux в интерактивном режиме.',
  NO_TASKS_AVAILABLE: 'Нет доступных задач',
  SELECT_GROUPS: 'Выберите группы для тренировки',
  TRAINING_ACTIVE: 'Тренажер активен',
  TRAINING_REPORT: 'Отчет по тренажеру',
  START_AGAIN: 'Начать заново',
  FINISH_TRAINING: 'Закончить тренаж',
  LAUNCH: 'Запуск',
  TRY_AGAIN: 'Попробовать снова',
  LOADING_TASKS: 'Загрузка задач...',
  CONFIRM_DELETE: 'Подтвердите удаление',
  CONFIRM_DELETE_MESSAGE: 'Вы действительно хотите удалить',

};

// Названия вкладок и режимов
export const TRAINER_TABS = {
  TRAINER: 'trainer',
  ADMIN: 'admin',
  RATING: 'rating',
  TASKS: 'tasks',
  EMPLOYEES: 'employees'
} as const;

export type TrainerMode = typeof TRAINER_TABS.TRAINER | typeof TRAINER_TABS.ADMIN | typeof TRAINER_TABS.RATING;
export type AdminTab = typeof TRAINER_TABS.TASKS | typeof TRAINER_TABS.EMPLOYEES;

// Иконки и лейблы
export const TRAINER_LABELS = {
  TRAINER_TITLE: 'Тренажер по командам AstraLinux',
  RATING: 'Рейтинг',
  TRAINER_TAB: 'Тренажер',
  ADMIN_TAB: 'Админ панель',
  TASKS_TAB: 'Задачи',
  EMPLOYEES_TAB: 'Сотрудники',
  ADD_TASK: 'Добавить задачу',
  TASKS_LIST: 'Список групп и задач',
  SAVE_TASK: 'Сохранить задачу',
  DELETE: 'Удалить',
  CANCEL: 'Отменить'
};

// Статистика отчета
export const REPORT_STATS = {
  CORRECT_ANSWERS: 'Правильных ответов',
  INCORRECT_ANSWERS: 'Неправильных ответов',
  NOT_ANSWERED: 'Не отвечено',
  TOTAL_TASKS: 'Всего задач'
};
