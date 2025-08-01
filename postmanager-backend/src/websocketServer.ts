import { WebSocketServer } from './websocket.js';

// Глобальная переменная для WebSocket сервера
let wsServerInstance: WebSocketServer | null = null;

export const setWebSocketServer = (server: WebSocketServer) => {
  wsServerInstance = server;
};

export const getWebSocketServer = (): WebSocketServer | null => {
  return wsServerInstance;
}; 