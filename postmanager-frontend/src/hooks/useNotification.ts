import { useState } from 'react';

export interface NotificationState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | '';
}

export const useNotification = () => {
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    message: '',
    type: ''
  });

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const hideNotification = () => {
    setNotification({ show: false, message: '', type: '' });
  };

  return {
    notification,
    showNotification,
    hideNotification
  };
};
