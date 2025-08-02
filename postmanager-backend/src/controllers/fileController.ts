import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'comments');
    
    // Создаем директорию, если её нет
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Генерируем уникальное имя файла
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/json',
    'application/xml',
    'text/xml'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Неподдерживаемый тип файла'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500 МБ
  }
});

export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Файл не был загружен' });
      return;
    }

    // Логируем информацию о загруженном файле
    console.log('Файл загружен:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path,
      size: req.file.size
    });

    // Возвращаем информацию о загруженном файле
    res.status(200).json({
      message: 'Файл успешно загружен',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: `/uploads/comments/${req.file.filename}`
      }
    });
  } catch (error) {
    console.error('Ошибка при загрузке файла:', error);
    res.status(500).json({ message: 'Ошибка при загрузке файла' });
  }
};

export const deleteFile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), 'uploads', 'comments', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.status(200).json({ message: 'Файл успешно удален' });
    } else {
      res.status(404).json({ message: 'Файл не найден' });
    }
  } catch (error) {
    console.error('Ошибка при удалении файла:', error);
    res.status(500).json({ message: 'Ошибка при удалении файла' });
  }
}; 