import path from 'path';
import { Router } from 'express';
import { env } from '../utils/env.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createRoadmapUploadMiddleware } from '../utils/uploads.js';
import { createFileForNode, deleteFile, downloadFile, getFileMeta } from '../controllers/fileController.js';

export const filesRouter = Router();

const uploadsRoot = path.resolve(process.cwd(), env.UPLOADS_DIR);
const upload = createRoadmapUploadMiddleware(uploadsRoot);

filesRouter.post('/nodes/:nodeId/files', upload.single('file'), asyncHandler(createFileForNode));
filesRouter.get('/files/:fileId', asyncHandler(getFileMeta));
filesRouter.get('/files/:fileId/download', asyncHandler(downloadFile));
filesRouter.delete('/files/:fileId', asyncHandler(deleteFile));

