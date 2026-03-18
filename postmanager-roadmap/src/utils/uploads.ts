import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import multer from 'multer';

export function ensureDir(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function createRoadmapUploadMiddleware(uploadsRoot: string) {
  const uploadDir = path.join(uploadsRoot, 'roadmap');

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
      ensureDir(uploadDir);
      cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${randomUUID()}${ext}`);
    },
  });

  return multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 },
  });
}

export function resolveRoadmapFilePath(uploadsRoot: string, storedName: string) {
  return path.join(uploadsRoot, 'roadmap', storedName);
}

