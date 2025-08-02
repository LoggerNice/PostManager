import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

export interface NotificationData {
  type: 'task_created' | 'task_updated' | 'comment_added';
  title: string;
  message: string;
  taskId?: number;
  projectId?: number;
  userId?: number;
  timestamp: string;
}

export interface TaskEventData {
  task?: any;
  taskId?: number;
  projectId: number;
}

export class WebSocketServer {
  private io: SocketIOServer;
  private userSockets: Map<number, string> = new Map();

  constructor(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"],
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {

      // Аутентификация через токен
      socket.on('authenticate', (token: string) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
          const userId = decoded.userId;
          
          // Сохраняем связь пользователя с сокетом
          this.userSockets.set(userId, socket.id);
          socket.data.userId = userId;
          
          socket.emit('authenticated', { success: true });
        } catch (error) {
          console.error('Ошибка аутентификации WebSocket:', error);
          socket.emit('authenticated', { success: false, error: 'Invalid token' });
        }
      });

      socket.on('disconnect', () => {
        // Удаляем связь пользователя с сокетом
        if (socket.data.userId) {
          this.userSockets.delete(socket.data.userId);
        }
      });
    });
  }

  // Отправка уведомления конкретному пользователю
  public sendNotificationToUser(userId: number, notification: NotificationData) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', notification);
    }
  }

  // Отправка уведомления всем пользователям в проекте
  public sendNotificationToProject(projectId: number, notification: NotificationData, excludeUserId?: number) {
    this.io.emit('project_notification', {
      ...notification,
      projectId
    });
  }

  // Отправка уведомления всем подключенным пользователям
  public broadcastNotification(notification: NotificationData) {
    this.io.emit('notification', notification);
  }

  // Отправка событий задач всем подключенным пользователям
  public sendTaskEvent(eventType: 'task_created' | 'task_updated' | 'task_deleted', data: TaskEventData) {
    this.io.emit(eventType, data);
  }

  // Отправка событий задач пользователям конкретного проекта
  public sendTaskEventToProject(eventType: 'task_created' | 'task_updated' | 'task_deleted', data: TaskEventData) {
    this.io.emit(`project_${eventType}`, data);
  }

  // Получение количества подключенных пользователей
  public getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  // Получение списка подключенных пользователей (для отладки)
  public getConnectedUsers(): number[] {
    return Array.from(this.userSockets.keys());
  }
} 