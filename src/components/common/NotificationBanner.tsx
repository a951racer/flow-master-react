import { useNotificationStore } from '../../store/notificationStore';

export const NotificationBanner: React.FC = () => {
  const notifications = useNotificationStore(s => s.notifications);
  const dismiss = useNotificationStore(s => s.dismiss);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg flex items-start gap-2 min-w-[300px] max-w-md"
        >
          <span className="flex-1">{notification.message}</span>
          <button
            onClick={() => dismiss(notification.id)}
            className="text-red-700 hover:text-red-900 font-bold text-xl leading-none"
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
};
