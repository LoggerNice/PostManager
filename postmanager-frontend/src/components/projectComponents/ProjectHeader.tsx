'use client';

import { IProject } from '@/types/project.types';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { EllipsisVerticalIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface ProjectHeaderProps extends IProject {
  onEditClick?: () => void;
  onDeleteClick?: () => void;
}

export default function ProjectHeader({ 
  title, 
  users,
  onEditClick,
  onDeleteClick
}: ProjectHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 mx-8 sm:py-6 lg:py-8 gap-4">
      <div className="flex items-center gap-3">
        <span className="text-blue-400 text-xl sm:text-2xl">🚀</span>
        <div className="flex items-center gap-3">
          <div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold break-words">{title}</div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        {users && users.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {users?.slice(0, 3).map((u) => (
              <Link key={u.id} href={`/profile/${u.id}`}>
                <div
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#222] -ml-1 sm:-ml-2 first:ml-0 hover:ring-2 hover:ring-blue-400 transition"
                  title={`${u.name}${'\n' + u.department?.name}`}
                >
                  <span className="text-xs sm:text-sm font-medium">{u.name.charAt(0).toUpperCase()}</span>
                </div>
              </Link>
            ))}
            {users.length > 3 && (
              <div 
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-600 flex items-center justify-center border-2 border-[#222] text-xs"
                title={users.slice(2).map(user => 
                  `${user.name} (${user.department?.name || 'Без отдела'})`
                ).join('\n')}
              >
                +{users.length - 3}
              </div>
            )}
          </div>
        )}
        
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Действия с проектом"
          >
            <EllipsisVerticalIcon className="h-5 w-5" />
          </button>
          
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-50">
              <div className="py-1">
                {onEditClick && (
                  <button
                    onClick={() => {
                      onEditClick();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Редактировать
                  </button>
                )}
                {onDeleteClick && (
                  <button
                    onClick={() => {
                      onDeleteClick();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-red-400 transition-colors"
                  >
                    <TrashIcon className="h-4 w-4" />
                    Удалить проект
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 