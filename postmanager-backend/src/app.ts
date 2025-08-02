import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';

import * as userController from './controllers/userController.js';
import * as departmentController from './controllers/departmentController.js';
import * as taskController from './controllers/taskController.js';
import * as projectController from './controllers/projectController.js';
import * as commentController from './controllers/commentController.js';
import { WebSocketServer } from './websocket.js';
import { setWebSocketServer } from './websocketServer.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Инициализация WebSocket сервера
const wsServer = new WebSocketServer(server);
setWebSocketServer(wsServer);

app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/auth/login', userController.login);
app.post('/auth/register', userController.register);
app.get('/users', userController.getUsers);
app.get('/users/:userId', userController.getUserById);
app.put('/users/:userId', userController.updateUser);

app.get('/departments', departmentController.getDepartments);
app.get('/departments/:departmentId', departmentController.getDepartmentById);
app.post('/departments', departmentController.createDepartment);
app.put('/departments/:departmentId', departmentController.updateDepartment);
app.delete('/departments/:departmentId', departmentController.deleteDepartment);
app.get('/departments/:departmentId/users', departmentController.getDepartmentUsers);
app.get('/departments/:departmentId/projects', departmentController.getDepartmentProjects);
app.get('/departments/:departmentId/tasks', departmentController.getDepartmentTasks);

app.get('/tasks', taskController.getTasks);
app.get('/tasks/:taskId', taskController.getTaskById);
app.post('/tasks', taskController.createTask);
app.put('/tasks/:taskId', taskController.updateTask);
app.delete('/tasks/:taskId', taskController.deleteTask);
app.get('/tasks/:taskId/comments', taskController.getTaskComments);

// Маршрут для обновления приоритетов задач на основе дедлайнов
app.post('/tasks/update-priorities', taskController.updateTaskPriorities);

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
});

export default app; 