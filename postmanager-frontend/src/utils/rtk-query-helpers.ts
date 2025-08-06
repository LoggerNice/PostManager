/**
 * Утилиты для безопасной работы с RTK Query
 */

export interface SafeQueryResult<T> {
  data: T;
  isLoading: boolean;
  error: any;
  safeRefetch: () => void;
}

/**
 * Создает безопасную функцию refetch, которая проверяет доступность перед вызовом
 * @param refetch - Функция refetch из RTK Query
 * @param isQueryStarted - Проверка, был ли запрос запущен (обычно !skip)
 * @returns Безопасная функция refetch
 */
export function createSafeRefetch(
  refetch: (() => any) | undefined, 
  isQueryStarted: boolean
): () => void {
  return () => {
    if (isQueryStarted && refetch) {
      try {
        refetch();
      } catch (error) {
        console.warn('Safe refetch failed:', error);
      }
    }
  };
}

/**
 * Хук-обертка для безопасной работы с RTK Query результатами
 * @param queryResult - Результат RTK Query хука
 * @param isQueryStarted - Проверка, был ли запрос запущен
 * @returns Безопасный результат с safeRefetch
 */
export function useSafeQuery<T>(
  queryResult: {
    data: T;
    isLoading: boolean;
    error: any;
    refetch?: () => any;
  },
  isQueryStarted: boolean
): SafeQueryResult<T> {
  const safeRefetch = createSafeRefetch(queryResult.refetch, isQueryStarted);

  return {
    data: queryResult.data,
    isLoading: queryResult.isLoading,
    error: queryResult.error,
    safeRefetch
  };
}

/**
 * Утилита для создания условий skip с проверкой обязательных параметров
 * @param conditions - Массив условий для skip
 * @returns true если любое условие не выполнено
 */
export function createSkipCondition(...conditions: (boolean | undefined | null)[]): boolean {
  return conditions.some(condition => !condition);
}

/**
 * Типизированная версия createSafeRefetch для конкретных случаев использования
 */
export const RTKQueryHelpers = {
  /**
   * Для комментариев задач
   */
  createCommentRefetch: (refetch: (() => any) | undefined, taskId: string | number | undefined, visible: boolean = true) => 
    createSafeRefetch(refetch, !!(taskId && visible)),

  /**
   * Для задач проекта
   */
  createTaskRefetch: (refetch: (() => any) | undefined, projectId: number | undefined) =>
    createSafeRefetch(refetch, !!projectId),

  /**
   * Для пользовательских задач
   */
  createUserTaskRefetch: (refetch: (() => any) | undefined, userId: number | undefined) =>
    createSafeRefetch(refetch, !!userId),

  /**
   * Универсальная версия
   */
  createGenericRefetch: (refetch: (() => any) | undefined, ...requiredParams: any[]) =>
    createSafeRefetch(refetch, requiredParams.every(param => param !== undefined && param !== null))
};

/**
 * Хук для отложенного refetch (с debouncing)
 * @param refetch - Функция refetch
 * @param delay - Задержка в миллисекундах
 * @returns Функция для отложенного refetch
 */
export function useDebouncedRefetch(
  refetch: () => void, 
  delay: number = 500
): () => void {
  let timeoutId: NodeJS.Timeout;

  return () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      refetch();
    }, delay);
  };
}