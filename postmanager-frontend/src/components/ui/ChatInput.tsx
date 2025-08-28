'use client';

import { useState, useRef, useEffect } from 'react';
import { PaperClipIcon } from '@heroicons/react/24/outline';
import { Send, X } from 'lucide-react';
import { validateFile, formatFileSize, getFileIcon } from '@/utils/fileUtils';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  onFileSelect?: (file: File) => void;
  selectedFile?: File | null;
  onFileRemove?: () => void;
}

export default function ChatInput({ 
  value, 
  onChange, 
  onSubmit, 
  placeholder = "Your message...",
  disabled = false,
  onFileSelect,
  selectedFile,
  onFileRemove
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Функция для обрезки названия файла
  const truncateFileName = (fileName: string, maxLength: number = 30): string => {
    if (fileName.length <= maxLength) return fileName;
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - 3);
    return `${truncatedName}...${extension ? '.' + extension : ''}`;
  };

  // Автоматическое изменение высоты textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onFileSelect) {
      const validation = validateFile(file);
      if (validation.isValid) {
        onFileSelect(file);
      } else {
        alert(validation.error);
      }
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="chat" className="sr-only">Your message</label>
      <div className="flex items-start px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
        <button 
          type="button" 
          className="inline-flex justify-center p-2 text-gray-500 rounded-lg cursor-pointer hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-600"
          disabled={disabled}
          onClick={handleFileButtonClick}
        >
          <PaperClipIcon className="w-5 h-5" />
          <span className="sr-only">Attach file</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp,.svg,.zip,.rar,.7z,.json,.xml"
        />
        <textarea 
          id="chat" 
          rows={1} 
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          className="block mx-2 p-2.5 w-full text-sm text-gray-900 bg-white rounded-lg border border-gray-300 dark:bg-gray-800 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white resize-none overflow-hidden" 
          placeholder={placeholder}
          disabled={disabled}
        />
        <button 
          type="submit" 
          className="inline-flex justify-center p-2 text-blue-600 rounded-full cursor-pointer hover:bg-blue-100 dark:text-blue-500 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={disabled || (!value.trim() && !selectedFile)}
        >
          <Send className="w-5 h-5 rotate-90 rtl:-rotate-90" />
          <span className="sr-only">Send message</span>
        </button>
      </div>
      
      {/* Selected File Display */}
      {selectedFile && (
        <div className="mt-2 p-3 bg-gray-700 rounded-lg border border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{getFileIcon(selectedFile.type)}</span>
              <div>
                <p className="text-sm font-medium text-gray-200 truncate" title={selectedFile.name}>
                  {truncateFileName(selectedFile.name)}
                </p>
                <p className="text-xs text-gray-400">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onFileRemove}
              className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors"
              title="Удалить файл"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </form>
  );
} 