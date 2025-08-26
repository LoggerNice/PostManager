import { User } from './user.types';

export interface Comment {
  id: number;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isSolution?: boolean;
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
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isSolution?: boolean;
}

export interface UpdateCommentRequest {
  content: string;
} 

export interface MarkCommentAsSolutionRequest {
  isSolution: boolean;
} 