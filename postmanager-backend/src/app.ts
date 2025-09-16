import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';

import * as userController from './controllers/userController.js';
import * as departmentController from './controllers/departmentController.js';
import * as taskController from './controllers/taskController.js';
import * as projectController from './controllers/projectController.js';
import * as commentController from './controllers/commentController.js';
import * as fileController from './controllers/fileController.js';
import * as adminController from './controllers/adminController.js';
import * as trainingController from './controllers/trainingController.js';
import { WebSocketServer } from './websocket.js';
import { setWebSocketServer } from './websocketServer.js';
import { authenticateToken } from './middleware/auth.js';
import { startCronJobs, stopCronJobs } from './utils/cronScheduler.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Инициализация WebSocket сервера
const wsServer = new WebSocketServer(server);
setWebSocketServer(wsServer);

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://172.17.118.38:3000", "http://172.17.118.38:3001"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/auth/login', userController.login);
app.post('/auth/register', userController.register);
app.get('/users', userController.getUsers);
app.get('/users/:userId', userController.getUserById);
app.put('/users/:userId', authenticateToken, userController.updateUser);
app.patch('/users/:userId', authenticateToken, userController.updateUser);

app.get('/departments', departmentController.getDepartments);
app.get('/departments/:departmentId', departmentController.getDepartmentById);
app.post('/departments', departmentController.createDepartment);
app.put('/departments/:departmentId', departmentController.updateDepartment);
app.delete('/departments/:departmentId', departmentController.deleteDepartment);
app.get('/departments/:departmentId/users', departmentController.getDepartmentUsers);
app.get('/departments/:departmentId/projects', departmentController.getDepartmentProjects);
app.get('/departments/:departmentId/tasks', departmentController.getDepartmentTasks);

app.get('/tasks', taskController.getTasks);
app.get('/tasks/user/:userId', taskController.getUserTasks);
app.get('/tasks/:taskId', taskController.getTaskById);
app.post('/tasks', taskController.createTask);
app.put('/tasks/:taskId', taskController.updateTask);
app.delete('/tasks/:taskId', taskController.deleteTask);
app.get('/tasks/:taskId/comments', taskController.getTaskComments);

// Маршрут для обновления приоритетов задач на основе дедлайнов
app.post('/tasks/update-priorities', taskController.updateTaskPriorities);
app.put('/comments/:commentId/solution', commentController.markCommentAsSolution);

// Маршруты для работы с исполнителями задач
app.get('/tasks/:taskId/assignees', taskController.getTaskAssignees);
app.post('/tasks/:taskId/assignees', taskController.addTaskAssignees);
app.put('/tasks/:taskId/assignees', taskController.updateTaskAssignees);
app.delete('/tasks/:taskId/assignees', taskController.removeTaskAssignees);

app.get('/projects', projectController.getProjects);
app.get('/projects/:projectId', projectController.getProjectById);
app.post('/projects', projectController.createProject);
app.put('/projects/:projectId', projectController.updateProject);
app.delete('/projects/:projectId', projectController.deleteProject);
app.get('/projects/:projectId/tasks', projectController.getProjectTasks);
app.get('/projects/user/:userId', projectController.getProjectsByUserId);

app.get('/comments', commentController.getComments);
app.get('/comments/view-stats', commentController.getCommentViewStats);
app.get('/comments/:commentId', commentController.getCommentById);
app.post('/comments', commentController.createComment);
app.put('/comments/:commentId', commentController.updateComment);
app.delete('/comments/:commentId', commentController.deleteComment);

// Маршруты для работы с просмотрами комментариев
app.post('/comments/:commentId/view', commentController.markCommentAsViewed);

// Маршруты для загрузки файлов
app.post('/upload/file', fileController.upload.single('file'), fileController.uploadFile);
app.delete('/upload/file/:filename', fileController.deleteFile);

// Статические файлы
app.use('/uploads', express.static('uploads'));

// Роуты для тренировок
app.get('/task-groups', trainingController.getTaskGroups);
app.get('/task-groups/:groupId', trainingController.getTaskGroupById);
app.post('/task-groups', trainingController.createTaskGroup);
app.put('/task-groups/:groupId', trainingController.updateTaskGroup);
app.delete('/task-groups/:groupId', trainingController.deleteTaskGroup);

app.get('/missions', trainingController.getMissions);
app.get('/missions/:missionId', trainingController.getMissionById);
app.post('/missions', trainingController.createMission);
app.put('/missions/:missionId', trainingController.updateMission);
app.delete('/missions/:missionId', trainingController.deleteMission);

app.get('/training-results', trainingController.getTrainingResults);
app.get('/training-results/user/:userId', trainingController.getUserTrainingResults);
app.post('/training-results', trainingController.saveTrainingResult);
app.get('/training-results/ratings', trainingController.getTrainingRatings);

// Админские роуты (требуют аутентификации и проверки прав)
app.get('/admin/stats', authenticateToken, adminController.requireAdminAccess, adminController.getAdminStats);
app.get('/admin/system-metrics', authenticateToken, adminController.requireAdminAccess, adminController.getSystemMetrics);
app.get('/admin/user-activity', authenticateToken, adminController.requireAdminAccess, adminController.getUserActivity);
app.get('/admin/project-analytics', authenticateToken, adminController.requireAdminAccess, adminController.getProjectAnalytics);
app.get('/admin/department-stats', authenticateToken, adminController.requireAdminAccess, adminController.getDepartmentStats);

// Управление пользователями (админ)
app.get('/admin/users', authenticateToken, adminController.requireAdminAccess, adminController.getAllUsersAdmin);
app.post('/admin/users', authenticateToken, adminController.requireAdminAccess, adminController.createUserAdmin);
app.patch('/admin/users/:id', authenticateToken, adminController.requireAdminAccess, adminController.updateUserAdmin);
app.delete('/admin/users/:id', authenticateToken, adminController.requireAdminAccess, adminController.deleteUserAdmin);

// Управление отделами (админ)
app.get('/admin/departments', authenticateToken, adminController.requireAdminAccess, adminController.getAllDepartmentsAdmin);
app.post('/admin/departments', authenticateToken, adminController.requireAdminAccess, adminController.createDepartmentAdmin);
app.patch('/admin/departments/:id', authenticateToken, adminController.requireAdminAccess, adminController.updateDepartmentAdmin);
app.delete('/admin/departments/:id', authenticateToken, adminController.requireAdminAccess, adminController.deleteDepartmentAdmin);

// Системные настройки и утилиты (админ)
app.get('/admin/settings', authenticateToken, adminController.requireAdminAccess, adminController.getSystemSettings);
app.patch('/admin/settings', authenticateToken, adminController.requireAdminAccess, adminController.updateSystemSettings);
app.get('/admin/logs', authenticateToken, adminController.requireAdminAccess, adminController.getSystemLogs);
app.post('/admin/backup', authenticateToken, adminController.requireAdminAccess, adminController.createBackup);
app.get('/admin/backup/:backupId/download', authenticateToken, adminController.requireAdminAccess, adminController.downloadBackup);
app.post('/admin/cache/clear', authenticateToken, adminController.requireAdminAccess, adminController.clearCache);

app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'API работает' });
});



// Обработчик ошибок должен быть последним middleware
app.use((err: Error, req: Request, res: Response, next: Function) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Что-то пошло не так!' });
});

const PORT = process.env.PORT || 3045;

server.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`WebSocket сервер готов к подключениям`);
    
    // Запускаем cron задачи
    startCronJobs();
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Получен сигнал SIGINT, завершаем работу...');
    stopCronJobs();
    server.close(() => {
        console.log('✅ Сервер остановлен');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Получен сигнал SIGTERM, завершаем работу...');
    stopCronJobs();
    server.close(() => {
        console.log('✅ Сервер остановлен');
        process.exit(0);
    });
});

export default app; 