'use client';

import { useWebSocket } from '@/hooks/useWebSocket';
import NotificationToast from './NotificationToast';

export default function NotificationManager() {
  const { notifications, removeNotification } = useWebSocket();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notifications.map((notification, index) => (
        <NotificationToast
          key={`${new Date(notification.timestamp).getTime()}-${index}`}
          notification={notification}
          onClose={() => removeNotification(index)}
        />
      ))}
    </div>
  );
} 