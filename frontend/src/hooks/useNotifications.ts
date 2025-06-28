import { useState } from 'react';

type NotificationType = 'success' | 'error' | 'info';

type Notification = {
  id: string;
  type: NotificationType;
  message: string;
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = (type: NotificationType, message: string) => {
    const id = Date.now().toString();
    const notification = { id, type, message };
    
    setNotifications(prev => [...prev, notification]);
    
    // Автоматически убираем через 4 секунды
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (message: string) => addNotification('success', message);
  const showError = (message: string) => addNotification('error', message);
  const showInfo = (message: string) => addNotification('info', message);

  return {
    notifications,
    showSuccess,
    showError,
    showInfo,
    removeNotification
  };
}; 