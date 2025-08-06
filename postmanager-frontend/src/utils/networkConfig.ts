/**
 * Утилиты для сетевой конфигурации приложения
 * Поддерживает как локальную разработку (localhost), так и сетевое развертывание
 */

export interface NetworkConfig {
  apiUrl: string;
  wsUrl: string;
  isLocalhost: boolean;
  hostname: string;
  protocol: string;
}

/**
 * Определяет, является ли текущий хост localhost
 */
export function isLocalhost(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1';
}

/**
 * Получает текущую конфигурацию сети
 */
export function getNetworkConfig(): NetworkConfig {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '172.17.118.89';
  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'https:' : 'http:';
  const isLocal = isLocalhost();
  
  const backendPort = process.env.NEXT_PUBLIC_BACKEND_PORT || '3045';
  
  let apiUrl: string;
  let wsUrl: string;

  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_WS_URL) {
    // Используем переменные окружения если они заданы
    apiUrl = process.env.NEXT_PUBLIC_API_URL;
    wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  } else if (isLocal) {
    // Локальная разработка
    apiUrl = 'http://localhost:3045';
    wsUrl = 'http://localhost:3045';
  } else {
    // Сетевое развертывание
    apiUrl = `${protocol}//${hostname}:${backendPort}`;
    wsUrl = `${protocol}//${hostname}:${backendPort}`;
  }

  return {
    apiUrl,
    wsUrl,
    isLocalhost: isLocal,
    hostname,
    protocol
  };
}

/**
 * Получает URL API
 */
export function getApiUrl(): string {
  return getNetworkConfig().apiUrl;
}

/**
 * Получает URL WebSocket
 */
export function getWebSocketUrl(): string {
  return getNetworkConfig().wsUrl;
}

/**
 * Логирует текущую конфигурацию (для отладки)
 */
export function logNetworkConfig(): void {
  const config = getNetworkConfig();
  console.group('🌐 Network Configuration');
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Hostname:', config.hostname);
  console.log('Protocol:', config.protocol);
  console.log('Is Localhost:', config.isLocalhost);
  console.log('API URL:', config.apiUrl);
  console.log('WebSocket URL:', config.wsUrl);
  console.log('Backend Port:', process.env.NEXT_PUBLIC_BACKEND_PORT || '3045');
  console.groupEnd();
}

/**
 * Проверяет доступность backend сервера
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      timeout: 5000
    } as RequestInit);
    return response.ok;
  } catch (error) {
    console.warn('Backend health check failed:', error);
    return false;
  }
}

/**
 * Автоматическое логирование конфигурации в development режиме
 */
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Логируем конфигурацию при загрузке страницы
  setTimeout(() => {
    logNetworkConfig();
  }, 1000);
  
  // @ts-ignore - Добавляем в window для отладки
  window.networkConfig = {
    getNetworkConfig,
    logNetworkConfig,
    checkBackendHealth
  };
}