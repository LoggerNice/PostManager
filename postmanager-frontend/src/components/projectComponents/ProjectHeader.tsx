'use client';

import { IProject } from '@/types/project.types';
import Link from 'next/link';
import { PencilIcon } from '@heroicons/react/24/outline';

interface ProjectHeaderProps extends IProject {
  onEditClick?: () => void;
}

export default function ProjectHeader({ 
  title, 
  users,
  onEditClick
}: ProjectHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 mx-8 sm:py-6 lg:py-8 gap-4">
      <div className="flex items-center gap-3">
        <span className="text-blue-400 text-xl sm:text-2xl">🚀</span>
        <div className="flex items-center gap-3">
          <div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold break-words">{title}</div>
          </div>
          {onEditClick && (
            <button
              onClick={onEditClick}
              className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition-colors"
              title="Редактировать проект"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        {users?.slice(0, 5).map((u) => (
          <Link key={u.id} href={`/profile/${u.id}`}>
            <div
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#222] -ml-1 sm:-ml-2 first:ml-0 hover:ring-2 hover:ring-blue-400 transition"
              title={`${u.name}${'\n' + u.department?.name}`}
            >
              <span className="text-xs sm:text-sm font-medium">{u.name.charAt(0).toUpperCase()}</span>
            </div>
          </Link>
        ))}
        {users && users.length > 5 && (
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-600 flex items-center justify-center border-2 border-[#222] text-xs">+{users.length - 5}</div>
        )}
      </div>
    </div>
  );
} 