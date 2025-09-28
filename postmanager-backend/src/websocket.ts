import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import prisma from './utils/prisma.js';

export interface NotificationData {
  type: 'task_created' | 'task_updated' | 'task_deleted' | 'task_assigned' | 'task_unassigned' | 'comment_added';
  title: string;
  message: string;
  taskId?: number;
  projectId?: number;
  userId?: number;
  timestamp: string;
  priority?: 'low' | 'medium' | 'high';
  sound?: boolean;
}

export interface TaskEventData {
  task?: any;
  taskId?: number;
  projectId: number;
  userId?: number;
  oldStatus?: string;
  newStatus?: string;
  assigneeIds?: number[];
  unassignedUserIds?: number[];
}

export class WebSocketServer {
  private io: SocketIOServer;
  private userSockets: Map<number, string> = new Map();
  private userProjects: Map<number, Set<number>> = new Map(); // userId -> Set of projectIds
  private projectRooms: Map<number, Set<string>> = new Map(); // projectId -> Set of socketIds
  private pendingUpdates: Map<string, NodeJS.Timeout> = new Map(); // debouncing map
  private pendingNotifications: Map<string, { notification: NotificationData; excludeUserId?: number }> = new Map();

  constructor(server: HTTPServer) {
    // Определяем разрешенные origins в зависимости от окружения
    const allowedOrigins = this.getAllowedOrigins();
    
    this.io = new SocketIOServer(server, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000
    });

    this.setupSocketHandlers();
  }

  private getAllowedOrigins(): string[] | boolean {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const serverIP = process.env.SERVER_IP || '172.17.118.89';
    const frontendPort = process.env.FRONTEND_PORT || '3000';
    
    if (nodeEnv === 'development') {
      // В режиме разработки разрешаем localhost и сетевой IP
      return [
        "htts://localhost:3000",
        "http://localhost:3045", 
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3045",
      ];
    } else {
      // В продакшене разрешаем только сетевой IP
      return [
        `http://${serverIP}:${frontendPort}`,
        `https://${serverIP}:${frontendPort}` // на случай HTTPS
      ];
    }
  }

  private setupSocketHandlers() {
    this.io.on('connection', (socket) => {

      // Аутентификация через токен
      socket.on('authenticate', async (token: string) => {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
          const userId = decoded.userId;
          
          // Сохраняем связь пользователя с сокетом
          this.userSockets.set(userId, socket.id);
          socket.data.userId = userId;
          
          // Получаем проекты пользователя и подключаем к комнатам
          await this.joinUserToProjectRooms(userId, socket);
          
          socket.emit('authenticated', { success: true });
        } catch (error) {
          console.error('Ошибка аутентификации WebSocket:', error);
          socket.emit('authenticated', { success: false, error: 'Invalid token' });
        }
      });

      // Подписка на конкретный проект
      socket.on('join_project', async (projectId: number) => {
        if (socket.data.userId) {
          await this.joinProjectRoom(socket.data.userId, projectId, socket);
        }
      });

      // Отписка от проекта
      socket.on('leave_project', (projectId: number) => {
        if (socket.data.userId) {
          this.leaveProjectRoom(socket.data.userId, projectId, socket);
        }
      });

      socket.on('disconnect', () => {
        // Удаляем связь пользователя с сокетом
        if (socket.data.userId) {
          this.cleanupUserConnection(socket.data.userId, socket.id);
        }
      });
    });
  }

  // Методы управления комнатами проектов
  private async joinUserToProjectRooms(userId: number, socket: any) {
    try {
      // В Prisma используется implicit many-to-many между User и Project,
      // поэтому получаем проекты через пользователя
      const userWithProjects = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          projects: { select: { id: true } }
        }
      });

      const projectIds = (userWithProjects?.projects || []).map((p: any) => p.id);
      this.userProjects.set(userId, new Set(projectIds));

      // Подключаем к комнатам проектов
      for (const projectId of projectIds) {
        await this.joinProjectRoom(userId, projectId, socket);
      }
    } catch (error) {
      console.error('Ошибка при подключении пользователя к комнатам проектов:', error);
    }
  }

  private async joinProjectRoom(userId: number, projectId: number, socket: any) {
    const roomName = `project_${projectId}`;
    socket.join(roomName);

    // Добавляем сокет в комнату проекта
    if (!this.projectRooms.has(projectId)) {
      this.projectRooms.set(projectId, new Set());
    }
    this.projectRooms.get(projectId)!.add(socket.id);

    // Добавляем проект к пользователю
    if (!this.userProjects.has(userId)) {
      this.userProjects.set(userId, new Set());
    }
    this.userProjects.get(userId)!.add(projectId);
  }

  private leaveProjectRoom(userId: number, projectId: number, socket: any) {
    const roomName = `project_${projectId}`;
    socket.leave(roomName);

    // Удаляем сокет из комнаты проекта
    const projectRoom = this.projectRooms.get(projectId);
    if (projectRoom) {
      projectRoom.delete(socket.id);
      if (projectRoom.size === 0) {
        this.projectRooms.delete(projectId);
      }
    }

    // Удаляем проект у пользователя
    const userProjectSet = this.userProjects.get(userId);
    if (userProjectSet) {
      userProjectSet.delete(projectId);
      if (userProjectSet.size === 0) {
        this.userProjects.delete(userId);
      }
    }
  }

  private cleanupUserConnection(userId: number, socketId: string) {
    this.userSockets.delete(userId);
    this.userProjects.delete(userId);

    // Удаляем сокет из всех комнат проектов
    for (const [projectId, sockets] of this.projectRooms.entries()) {
      sockets.delete(socketId);
      if (sockets.size === 0) {
        this.projectRooms.delete(projectId);
      }
    }
  }

  // Отправка уведомления конкретному пользователю
  public sendNotificationToUser(userId: number, notification: NotificationData) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', notification);
    }
  }

  // Отправка уведомления всем пользователям в проекте (оптимизированная)
  public sendNotificationToProject(projectId: number, notification: NotificationData, excludeUserId?: number) {
    const roomName = `project_${projectId}`;
    const notificationData = {
      ...notification,
      projectId
    };

    if (excludeUserId) {
      // Отправляем всем в комнате, кроме исключенного пользователя
      const excludeSocketId = this.userSockets.get(excludeUserId);
      const projectSockets = this.projectRooms.get(projectId);
      
      if (projectSockets && excludeSocketId) {
        projectSockets.forEach(socketId => {
          if (socketId !== excludeSocketId) {
            this.io.to(socketId).emit('project_notification', notificationData);
          }
        });
      } else if (projectSockets) {
        this.io.to(roomName).emit('project_notification', notificationData);
      }
    } else {
      this.io.to(roomName).emit('project_notification', notificationData);
    }
  }

  // Отправка уведомления всем подключенным пользователям
  public broadcastNotification(notification: NotificationData) {
    this.io.emit('notification', notification);
  }

  // Оптимизированная отправка событий задач с debouncing (по умолчанию 5 секунд)
  public sendTaskEventToProject(eventType: 'task_created' | 'task_updated' | 'task_deleted', data: TaskEventData, debounceMs: number = 5000) {
    const projectId = data.projectId;
    const taskId = data.taskId || data.task?.id;
    const debounceKey = `${eventType}_${projectId}_${taskId}`;

    // Очищаем предыдущий таймер, если он есть
    const existingTimer = this.pendingUpdates.get(debounceKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Устанавливаем новый таймер
    const timer = setTimeout(() => {
      // Отправляем событие обновления данных
      this.sendTaskEventToProjectImmediate(eventType, data);

      // Если есть отложенное уведомление для этого события — отправляем сейчас
      const pending = this.pendingNotifications.get(debounceKey);
      if (pending) {
        this.sendNotificationToProject(projectId, pending.notification, pending.excludeUserId);
        this.pendingNotifications.delete(debounceKey);
      }

      this.pendingUpdates.delete(debounceKey);
    }, debounceMs);

    this.pendingUpdates.set(debounceKey, timer);
  }

  // Немедленная отправка событий задач (для критических операций)
  public sendTaskEventToProjectImmediate(eventType: 'task_created' | 'task_updated' | 'task_deleted', data: TaskEventData) {
    const projectId = data.projectId;
    const roomName = `project_${projectId}`;
    
    this.io.to(roomName).emit(eventType, data);

    // Если для этого события уже подготовлено уведомление — отправляем вместе
    const taskId = data.taskId || data.task?.id;
    const debounceKey = `${eventType}_${projectId}_${taskId}`;
    const pending = this.pendingNotifications.get(debounceKey);
    if (pending) {
      this.sendNotificationToProject(projectId, pending.notification, pending.excludeUserId);
      this.pendingNotifications.delete(debounceKey);
    }

    // Также отправляем всем пользователям, назначенным на задачу (для синхронизации "Мои задачи")
    if (data.assigneeIds && data.assigneeIds.length > 0) {
      data.assigneeIds.forEach(userId => {
        const socketId = this.userSockets.get(userId);
        if (socketId) {
          this.io.to(socketId).emit(`user_${eventType}`, data);
        }
      });
    }
  }

  // Поставить уведомление в очередь, чтобы отправить одновременно с событием данных
  public queueNotificationForTaskEvent(
    eventType: 'task_created' | 'task_updated' | 'task_deleted',
    data: TaskEventData,
    notification: NotificationData,
    excludeUserId?: number
  ) {
    const projectId = data.projectId;
    const taskId = data.taskId || data.task?.id;
    const debounceKey = `${eventType}_${projectId}_${taskId}`;
    this.pendingNotifications.set(debounceKey, { notification: { ...notification, projectId }, excludeUserId });
  }

  // Отправка события смены назначения задачи
  public async sendTaskAssignmentEvent(data: TaskEventData) {
    const projectId = data.projectId;
    const roomName = `project_${projectId}`;

    // Подготавливаем персональные уведомления, чтобы отправить их вместе с синхронизационными событиями
    let notificationAssigned: NotificationData | null = null;
    let notificationUnassigned: NotificationData | null = null;
    try {
      const taskId = data.task?.id ?? data.taskId;
      if (taskId) {
        const task = await prisma.task.findUnique({ where: { id: Number(taskId) }, include: { project: true } });
        if (task) {
          if (data.assigneeIds && data.assigneeIds.length > 0) {
            notificationAssigned = {
              type: 'task_assigned',
              title: task.project?.title || 'Проект',
              message: `Вам назначена задача "${task.title}"`,
              taskId: task.id,
              projectId: task.projectId ?? undefined,
              timestamp: new Date().toISOString()
            };
          }
          if (data.unassignedUserIds && data.unassignedUserIds.length > 0) {
            notificationUnassigned = {
              type: 'task_unassigned',
              title: task.project?.title || 'Проект',
              message: `Вы сняты с задачи "${task.title}"`,
              taskId: task.id,
              projectId: task.projectId ?? undefined,
              timestamp: new Date().toISOString()
            };
          }
        }
      }
    } catch (e) {
      console.error('Ошибка подготовки уведомлений о назначениях:', e);
    }

    // Синхронизационные события с задержкой до 5 секунд
    const taskKey = data.task?.id ?? data.taskId;
    const debounceKey = `assign_${projectId}_${taskKey}`;
    const existing = this.pendingUpdates.get(debounceKey);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      // Уведомляем всех в проекте об изменении
      this.io.to(roomName).emit('task_assignment_changed', data);
      // Уведомляем новых назначенных пользователей
      if (data.assigneeIds && data.assigneeIds.length > 0) {
        data.assigneeIds.forEach(userId => {
          const socketId = this.userSockets.get(userId);
          if (socketId) this.io.to(socketId).emit('task_assigned', data);
        });
        if (notificationAssigned) {
          data.assigneeIds.forEach(userId => {
            const socketId = this.userSockets.get(userId);
            if (socketId) this.io.to(socketId).emit('notification', notificationAssigned!);
          });
        }
      }
      // Уведомляем пользователей, которых сняли с задачи
      if (data.unassignedUserIds && data.unassignedUserIds.length > 0) {
        data.unassignedUserIds.forEach(userId => {
          const socketId = this.userSockets.get(userId);
          if (socketId) this.io.to(socketId).emit('task_unassigned', data);
        });
        if (notificationUnassigned) {
          data.unassignedUserIds.forEach(userId => {
            const socketId = this.userSockets.get(userId);
            if (socketId) this.io.to(socketId).emit('notification', notificationUnassigned!);
          });
        }
      }
      this.pendingUpdates.delete(debounceKey);
    }, 5000);

    this.pendingUpdates.set(debounceKey, timer);
  }

  // Получение количества подключенных пользователей
  public getConnectedUsersCount(): number {
    return this.userSockets.size;
  }

  // Получение списка подключенных пользователей (для отладки)
  public getConnectedUsers(): number[] {
    return Array.from(this.userSockets.keys());
  }

  // Получение количества активных комнат проектов
  public getActiveProjectRoomsCount(): number {
    return this.projectRooms.size;
  }

  // Получение информации о проектах пользователя
  public getUserProjects(userId: number): number[] {
    const projects = this.userProjects.get(userId);
    return projects ? Array.from(projects) : [];
  }

  // Очистка всех pending обновлений (для graceful shutdown)
  public clearAllPendingUpdates(): void {
    for (const timer of this.pendingUpdates.values()) {
      clearTimeout(timer);
    }
    this.pendingUpdates.clear();
  }

  // Принудительная отправка всех pending обновлений
  public flushAllPendingUpdates(): void {
    for (const [key, timer] of this.pendingUpdates.entries()) {
      clearTimeout(timer);
      // Здесь можно добавить логику для немедленной отправки, если нужно
    }
    this.pendingUpdates.clear();
  }
} 