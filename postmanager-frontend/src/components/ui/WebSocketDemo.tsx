'use client';

import { useState } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Button } from './Button';

interface WebSocketDemoProps {
  projectId: number;
}

export function WebSocketDemo({ projectId }: WebSocketDemoProps) {
  const { isConnected, joinProject, leaveProject } = useWebSocket();
  const [isJoined, setIsJoined] = useState(false);

  const handleJoinProject = () => {
    joinProject(projectId);
    setIsJoined(true);
  };

  const handleLeaveProject = () => {
    leaveProject(projectId);
    setIsJoined(false);
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      <h3 className="text-lg font-semibold mb-4">WebSocket Демо</h3>
      
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm">
            Статус: {isConnected ? 'Подключено' : 'Отключено'}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleJoinProject}
            disabled={!isConnected || isJoined}
            variant="outline"
            size="sm"
          >
            Присоединиться к проекту
          </Button>
          
          <Button
            onClick={handleLeaveProject}
            disabled={!isConnected || !isJoined}
            variant="outline"
            size="sm"
          >
            Покинуть проект
          </Button>
        </div>

        <div className="text-sm text-gray-400">
          <p>Проект ID: {projectId}</p>
          <p>Статус комнаты: {isJoined ? 'Присоединен' : 'Не присоединен'}</p>
        </div>
      </div>
    </div>
  );
} 