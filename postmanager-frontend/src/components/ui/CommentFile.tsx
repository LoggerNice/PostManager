import { getFileIcon, formatFileSize } from '@/utils/fileUtils';
import { Download, ExternalLink, X } from 'lucide-react';
import { getApiUrl } from '@/utils/networkConfig';
import { useState } from 'react';

interface CommentFileProps {
  fileName: string;
  fileUrl: string;
  fileSize?: number;
  fileType?: string;
}

export default function CommentFile({ fileName, fileUrl, fileSize, fileType }: CommentFileProps) {
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Функция для обрезки названия файла
  const truncateFileName = (fileName: string, maxLength: number = 30): string => {
    if (fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - 3);
    return `${truncatedName}...${extension ? '.' + extension : ''}`;
  };

  // Добавляем базовый URL сервера к относительному пути
  const getFullUrl = (url: string) => {
    if (url.startsWith('http')) {
      return url;
    }
    const baseUrl = getApiUrl();
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
    if (isImage) {
      setIsImageModalOpen(true);
    } else {
      window.open(fullFileUrl, '_blank');
    }
  };

  // Проверяем, является ли файл изображением
  const isImage = fileType?.startsWith('image/') || 
                 fileName.toLowerCase().match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/);

  // Отображаем все файлы в едином стиле как документы
  return (
    <>
      <div 
        className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg border border-gray-700 hover:bg-gray-750 transition-colors cursor-pointer"
        onClick={handleOpen}
      >
        <div className="flex-shrink-0">
          <span className="text-2xl">{getFileIcon(fileType || '')}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-gray-200 truncate" title={fileName}>
              {truncateFileName(fileName)}
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
            onClick={(e) => {
              e.stopPropagation();
              handleOpen();
            }}
            className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded transition-colors"
            title={isImage ? "Открыть изображение" : "Открыть файл"}
          >
            <ExternalLink className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="p-1 text-gray-400 hover:text-green-400 hover:bg-gray-700 rounded transition-colors"
            title={isImage ? "Скачать изображение" : "Скачать файл"}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Модальное окно для изображения */}
      {isImageModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop-blur-sm p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Кнопка закрытия */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsImageModalOpen(false);
              }}
              className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors z-10 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75"
              title="Закрыть"
            >
              <X className="w-6 h-6" />
            </button>
            
            {/* Контейнер для изображения с ограничениями */}
            <div 
              className="relative max-w-full max-h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={fullFileUrl} 
                alt={fileName}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                style={{
                  maxWidth: 'calc(100vw - 2rem)',
                  maxHeight: 'calc(100vh - 2rem)'
                }}
                onError={(e) => {
                  console.error('Ошибка загрузки изображения в модальном окне:', {
                    fileName,
                    fileUrl,
                    fullFileUrl,
                    error: e.target
                  });
                  // Показываем fallback в модальном окне
                  const imgElement = e.currentTarget;
                  imgElement.style.display = 'none';
                  
                  const fallback = document.createElement('div');
                  fallback.className = 'bg-gray-700 rounded-lg border border-gray-600 p-8 text-center text-gray-400 max-w-md';
                  fallback.innerHTML = `
                    <div class="text-4xl mb-4">🖼️</div>
                    <div class="text-lg mb-2">Изображение недоступно</div>
                    <div class="text-sm">${truncateFileName(fileName)}</div>
                  `;
                  imgElement.parentNode?.appendChild(fallback);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 