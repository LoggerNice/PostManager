import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';

export interface NotificationData {
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_moved' | 'comment_added';
  title: string;
  message: string;
  taskId?: number;
  projectId?: number;
  userId?: number;
  timestamp: string;
}

export interface TaskEventData {
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_moved';
  task?: any;
  taskId?: number;
  projectId: number;
  userId?: number;
  sourceColumn?: string;
  destinationColumn?: string;
  sourceIndex?: number;
  destinationIndex?: number;
  timestamp: string;
}

export class WebSocketServer {
  private io: SocketIOServer;
  private userSockets: Map<number, string> = new Map();
  private projectRooms: Map<number, Set<string>> = new Map();

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

      // Подписка на события проекта
      socket.on('join_project', (projectId: number) => {
        const roomName = `project_${projectId}`;
        socket.join(roomName);
        
        // Сохраняем информацию о комнате
        if (!this.projectRooms.has(projectId)) {
          this.projectRooms.set(projectId, new Set());
        }
        this.projectRooms.get(projectId)!.add(socket.id);
        
        console.log(`User joined project room: ${roomName}`);
      });

      // Отписка от событий проекта
      socket.on('leave_project', (projectId: number) => {
        const roomName = `project_${projectId}`;
        socket.leave(roomName);
        
        // Удаляем информацию о комнате
        const room = this.projectRooms.get(projectId);
        if (room) {
          room.delete(socket.id);
          if (room.size === 0) {
            this.projectRooms.delete(projectId);
          }
        }
        
        console.log(`User left project room: ${roomName}`);
      });

      socket.on('disconnect', () => {
        // Удаляем связь пользователя с сокетом
        if (socket.data.userId) {
          this.userSockets.delete(socket.data.userId);
        }
        
        // Удаляем из всех комнат проектов
        this.projectRooms.forEach((sockets, projectId) => {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            this.projectRooms.delete(projectId);
          }
        });
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

  // Отправка события задачи всем пользователям в проекте
  public sendTaskEventToProject(projectId: number, eventData: TaskEventData) {
    const roomName = `project_${projectId}`;
    this.io.to(roomName).emit('task_event', eventData);
    console.log(`Task event sent to project ${projectId}:`, eventData.type);
  }

  // Отправка события задачи конкретному пользователю
  public sendTaskEventToUser(userId: number, eventData: TaskEventData) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('task_event', eventData);
      console.log(`Task event sent to user ${userId}:`, eventData.type);
    }
  }

  // Отправка уведомления всем пользователям в проекте
  public sendNotificationToProject(projectId: number, notification: NotificationData, excludeUserId?: number) {
    const roomName = `project_${projectId}`;
    this.io.to(roomName).emit('project_notification', {
      ...notification,
      projectId
    });
  }

  // Отправка уведомления всем подключенным пользователям
  public broadcastNotification(notification: NotificationData) {
    this.io.emit('notification', notification);
  }

  // Получение количества подключенных пользователей
  public getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  // Получение количества пользователей в проекте
  public getProjectUsersCount(projectId: number): number {
    const room = this.projectRooms.get(projectId);
    return room ? room.size : 0;
  }
} 