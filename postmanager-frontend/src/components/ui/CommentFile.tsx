import { getFileIcon, formatFileSize } from '@/utils/fileUtils';
import { Download, ExternalLink } from 'lucide-react';

interface CommentFileProps {
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
}

export default function CommentFile({ fileName, fileUrl, fileSize, fileType }: CommentFileProps) {
  // Добавляем базовый URL сервера к относительному пути
  const getFullUrl = (url: string) => {
    if (url.startsWith('http')) {
      return url;
    }
    // Используем переменную окружения или дефолтный URL
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3045';
    return `${baseUrl}${url}`;
  };

  const fullFileUrl = getFullUrl(fileUrl);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fullFileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpen = () => {
    window.open(fullFileUrl, '_blank');
  };

  // Проверяем, является ли файл изображением
  const isImage = fileType?.startsWith('image/') || 
                 fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/);

  // Если это изображение, отображаем его прямо в комментарии
  if (isImage) {
    return (
      <div className="mt-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">{getFileIcon(fileType || '')}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-200 truncate" title={fileName}>
              {fileName}
            </p>
            {fileSize && (
              <p className="text-xs text-gray-400">
                {formatFileSize(fileSize)}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={handleOpen}
              className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
              title="Открыть изображение"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
            <button
              onClick={handleDownload}
              className="p-1 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
              title="Скачать изображение"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="relative">
          <img 
            src={fullFileUrl} 
            alt={fileName}
            className="max-w-full max-h-96 rounded-lg border border-gray-600 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={handleOpen}
            onError={(e) => {
              console.error('Ошибка загрузки изображения:', e);
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>
    );
  }

  // Для остальных файлов отображаем как документы
  return (
    <div className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-750 transition-colors">
      <div className="flex-shrink-0">
        <span className="text-2xl">{getFileIcon(fileType || '')}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-200 truncate" title={fileName}>
            {fileName}
          </p>
        </div>
        {fileSize && (
          <p className="text-xs text-gray-400">
            {formatFileSize(fileSize)}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handleOpen}
          className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
          title="Открыть файл"
        >
          <ExternalLink className="w-4 h-4" />
        </button>
        <button
          onClick={handleDownload}
          className="p-1 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
          title="Скачать файл"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
} 