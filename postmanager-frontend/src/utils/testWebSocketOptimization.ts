// Утилита для тестирования оптимизированной WebSocket системы

export interface WebSocketTestResults {
  connectionTime: number;
  eventLatency: number[];
  duplicateEvents: number;
  totalEvents: number;
  errors: string[];
}

export class WebSocketOptimizationTester {
  private results: WebSocketTestResults = {
    connectionTime: 0,
    eventLatency: [],
    duplicateEvents: 0,
    totalEvents: 0,
    errors: []
  };

  private eventTimestamps = new Map<string, number>();
  private receivedEvents = new Set<string>();

  async testConnection(wsUrl: string, token: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        const connectionTime = Date.now() - startTime;
        this.results.connectionTime = connectionTime;
        
        // Аутентификация
        socket.send(JSON.stringify({ type: 'authenticate', token }));
        resolve(connectionTime);
      };

      socket.onerror = (error) => {
        this.results.errors.push(`Connection error: ${error}`);
        reject(error);
      };

      setTimeout(() => {
        if (socket.readyState !== WebSocket.OPEN) {
          this.results.errors.push('Connection timeout');
          reject(new Error('Connection timeout'));
        }
      }, 5000);
    });
  }

  startEventLatencyTest() {
    // Записываем время отправки события
    const eventId = `test_${Date.now()}`;
    this.eventTimestamps.set(eventId, Date.now());
    return eventId;
  }

  recordEventReceived(eventId: string, eventData?: any) {
    const sendTime = this.eventTimestamps.get(eventId);
    if (sendTime) {
      const latency = Date.now() - sendTime;
      this.results.eventLatency.push(latency);
      this.eventTimestamps.delete(eventId);
    }

    // Проверка на дубликаты
    const eventKey = `${eventData?.type}_${eventData?.taskId}_${eventData?.projectId}`;
    if (this.receivedEvents.has(eventKey)) {
      this.results.duplicateEvents++;
    } else {
      this.receivedEvents.add(eventKey);
    }

    this.results.totalEvents++;
  }

  getTestResults(): WebSocketTestResults {
    return {
      ...this.results,
      eventLatency: [...this.results.eventLatency]
    };
  }

  getStatistics() {
    const latencies = this.results.eventLatency;
    return {
      connectionTime: this.results.connectionTime,
      averageLatency: latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0,
      minLatency: latencies.length > 0 ? Math.min(...latencies) : 0,
      maxLatency: latencies.length > 0 ? Math.max(...latencies) : 0,
      totalEvents: this.results.totalEvents,
      duplicateEvents: this.results.duplicateEvents,
      duplicateRate: this.results.totalEvents > 0 ? (this.results.duplicateEvents / this.results.totalEvents) * 100 : 0,
      errorCount: this.results.errors.length,
      errors: this.results.errors
    };
  }

  reset() {
    this.results = {
      connectionTime: 0,
      eventLatency: [],
      duplicateEvents: 0,
      totalEvents: 0,
      errors: []
    };
    this.eventTimestamps.clear();
    this.receivedEvents.clear();
  }

  // Тест производительности debouncing
  testDebouncing(callback: () => void, iterations: number = 10, interval: number = 100) {
    let executionCount = 0;
    const originalCallback = callback;
    
    // Подменяем callback для подсчета выполнений
    const wrappedCallback = () => {
      executionCount++;
      originalCallback();
    };

    // Быстро вызываем callback много раз
    for (let i = 0; i < iterations; i++) {
      setTimeout(wrappedCallback, i * interval);
    }

    // Проверяем результат через некоторое время
    return new Promise<{ sent: number; executed: number; effectiveness: number }>((resolve) => {
      setTimeout(() => {
        const effectiveness = iterations > 0 ? ((iterations - executionCount) / iterations) * 100 : 0;
        resolve({
          sent: iterations,
          executed: executionCount,
          effectiveness
        });
      }, (iterations * interval) + 2000); // Ждем завершения всех операций + буфер
    });
  }
}

// Глобальный экземпляр для использования в приложении
export const wsOptimizationTester = new WebSocketOptimizationTester();

// Хелпер для интеграции с React DevTools
export function logWebSocketStats() {
  const stats = wsOptimizationTester.getStatistics();
  console.group('🚀 WebSocket Optimization Stats');
  console.log('Connection Time:', `${stats.connectionTime}ms`);
  console.log('Average Event Latency:', `${stats.averageLatency.toFixed(2)}ms`);
  console.log('Min/Max Latency:', `${stats.minLatency}ms / ${stats.maxLatency}ms`);
  console.log('Total Events:', stats.totalEvents);
  console.log('Duplicate Events:', `${stats.duplicateEvents} (${stats.duplicateRate.toFixed(2)}%)`);
  console.log('Errors:', stats.errorCount);
  if (stats.errors.length > 0) {
    console.log('Error Details:', stats.errors);
  }
  console.groupEnd();
}

// Автоматический логгер для разработки
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // @ts-ignore
  window.logWebSocketStats = logWebSocketStats;
  // @ts-ignore
  window.wsOptimizationTester = wsOptimizationTester;
}