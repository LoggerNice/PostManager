import { IUser } from '@/types/user.types';

interface ProjectHeaderProps {
  title: string;
  description: string;
  users: IUser[];
}

export default function ProjectHeader({ title, description, users }: ProjectHeaderProps) {
  return (
    <div className="flex justify-between items-center px-8 pt-8 pb-4">
      <div className="flex items-center gap-3">
        <span className="text-blue-400 text-2xl">🚀</span>
        <div>
          <div className="text-xl font-bold">{title}</div>
          <div className="text-gray-400 text-sm">{description}</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {users.slice(0, 5).map((u) => (
          <div key={u.id} className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center border-2 border-[#222] -ml-2 first:ml-0">
            <span className="text-sm font-medium">{u.name.charAt(0).toUpperCase()}</span>
          </div>
        ))}
        {users.length > 5 && (
          <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center border-2 border-[#222] -ml-2 text-xs">+{users.length - 5}</div>
        )}
      </div>
    </div>
  );
} 