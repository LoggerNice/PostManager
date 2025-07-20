'use client';

import { IProject } from '@/types/project.types';
import Link from 'next/link';

interface ProjectHeaderProps extends IProject {
}

export default function ProjectHeader({ 
  title, 
  users
}: ProjectHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 mx-8 sm:py-6 lg:py-8 gap-4">
      <div className="flex items-center gap-3">
        <span className="text-blue-400 text-xl sm:text-2xl">🚀</span>
        <div>
          <div className="text-lg sm:text-xl lg:text-2xl font-bold break-words">{title}</div>
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