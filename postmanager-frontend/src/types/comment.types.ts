import { User } from './user.types';

export interface Comment {
  id: number;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  taskId: number;
  authorId: number;
  author?: User;
}

export interface CreateCommentRequest {
  content: string;
  taskId: number;
  authorId: number;
}

export interface UpdateCommentRequest {
  content: string;
} 