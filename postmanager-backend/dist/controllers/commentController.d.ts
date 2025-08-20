import type { Request, Response } from 'express';
export declare const createComment: (req: Request, res: Response) => Promise<void>;
export declare const getComments: (req: Request, res: Response) => Promise<void>;
export declare const getCommentById: (req: Request, res: Response) => Promise<void>;
export declare const updateComment: (req: Request, res: Response) => Promise<void>;
export declare const deleteComment: (req: Request, res: Response) => Promise<void>;
export declare const markCommentAsViewed: (req: Request, res: Response) => Promise<void>;
export declare const getCommentViewStats: (req: Request, res: Response) => Promise<void>;
