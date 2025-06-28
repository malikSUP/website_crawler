import React from 'react';

type NotificationType = 'success' | 'error' | 'info';

type Notification = {
  id: string;
  type: NotificationType;
  message: string;
};

interface SimpleNotificationsProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
}

const SimpleNotifications: React.FC<SimpleNotificationsProps> = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null;

  const getNotificationStyle = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return 'bg-green-600 border-green-500';
      case 'error':
        return 'bg-red-600 border-red-500';
      case 'info':
        return 'bg-blue-600 border-blue-500';
      default:
        return 'bg-gray-600 border-gray-500';
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '📝';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            ${getNotificationStyle(notification.type)}
            text-white px-4 py-3 rounded-lg border-l-4 shadow-lg
            flex items-center justify-between min-w-80 max-w-96
            animate-slide-in-right
          `}
        >
          <div className="flex items-center space-x-3">
            <span className="text-lg">{getIcon(notification.type)}</span>
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => onRemove(notification.id)}
            className="ml-4 text-white hover:text-gray-200 text-lg font-bold"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};

export default SimpleNotifications; 