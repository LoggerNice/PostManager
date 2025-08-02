export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 МБ в байтах

export const ALLOWED_FILE_TYPES = [
  // Документы
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  // Изображения
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Архивы
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  // Другие
  'application/json',
  'application/xml',
  'text/xml'
];

export const validateFile = (file: File): { isValid: boolean; error?: string } => {
  // Проверка размера файла
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `Размер файла превышает 500 МБ. Текущий размер: ${(file.size / (1024 * 1024)).toFixed(2)} МБ`
    };
  }

  // Проверка типа файла
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Тип файла "${file.type}" не поддерживается. Разрешены только документы, изображения и архивы.`
    };
  }

  return { isValid: true };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Б';
  
  const k = 1024;
  const sizes = ['Б', 'КБ', 'МБ', 'ГБ'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const getFileIcon = (fileType: string): string => {
  if (fileType.startsWith('image/')) return '🖼️';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📈';
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '📦';
  if (fileType.includes('text')) return '📄';
  return '📎';
}; 