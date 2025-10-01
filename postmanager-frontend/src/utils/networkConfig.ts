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
  if (typeof window === 'undefined') {
    const host = 'localhost';
    const protocol = 'https:';
    return {
      apiUrl: `https://localhost:3045`,
      wsUrl: `wss://localhost:3045`,
      isLocalhost: true,
      hostname: host,
      protocol
    };
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;
  const backendPort = '3045';

  const apiUrl = `${protocol}//${hostname}:${backendPort}`;
  const wsUrl = `${protocol === 'https:' ? 'wss' : 'ws'}://${hostname}:${backendPort}`;

  return {
    apiUrl,
    wsUrl,
    isLocalhost: hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1',
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