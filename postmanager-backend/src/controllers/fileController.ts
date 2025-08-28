import type { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';

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
    // Генерируем уникальное имя файла с UUID для избежания проблем с кодировкой
    const originalName = file.originalname;
    const ext = path.extname(originalName);
    const uuid = randomUUID();
    
    // Сохраняем файл с UUID именем, но сохраняем оригинальное название в метаданных
    const finalName = `${uuid}${ext}`;
    
    cb(null, finalName);
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

    // Исправляем кодировку оригинального названия файла
    let correctedOriginalName = req.file.originalname;
    
    // Если название содержит искаженные символы, пытаемся исправить
    if (correctedOriginalName.includes('Ð') || correctedOriginalName.includes('')) {
      try {
        // Пытаемся исправить кодировку UTF-8
        correctedOriginalName = Buffer.from(correctedOriginalName, 'latin1').toString('utf8');
        
        // Если все еще есть проблемы, пробуем другие кодировки
        if (correctedOriginalName.includes('')) {
          try {
            correctedOriginalName = Buffer.from(req.file.originalname, 'latin1').toString('utf8');
          } catch {
            // Если не удалось, оставляем как есть
          }
        }
      } catch (error) {
        console.warn('Не удалось исправить кодировку названия файла:', error);
        // Оставляем оригинальное название как есть
        correctedOriginalName = req.file.originalname;
      }
    }

    // Логируем информацию о загруженном файле
    console.log('Файл загружен:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      correctedOriginalName,
      path: req.file.path,
      size: req.file.size,
      message: 'Файл сохранен с UUID именем для совместимости с файловой системой'
    });

    // Возвращаем информацию о загруженном файле
    res.status(200).json({
      message: 'Файл успешно загружен с UUID именем',
      file: {
        filename: req.file.filename,
        originalname: correctedOriginalName,
        size: req.file.size,
        mimetype: req.file.mimetype,
        url: `/uploads/comments/${req.file.filename}`,
        note: `Файл сохранен как "${req.file.filename}" (оригинальное название: "${correctedOriginalName}")`
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

// Функция для удаления файла по URL (используется при обновлении комментариев)
export const deleteFileByUrl = async (fileUrl: string): Promise<boolean> => {
  try {
    // Извлекаем имя файла из URL
    const filename = fileUrl.split('/').pop();
    if (!filename) return false;
    
    const filePath = path.join(process.cwd(), 'uploads', 'comments', filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Файл ${filename} успешно удален при обновлении комментария`);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Ошибка при удалении файла по URL:', error);
    return false;
  }
}; 