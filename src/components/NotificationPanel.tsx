import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../convex/_generated/dataModel";

interface Notification {
  _id: Id<"notifications">;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  orderNumber: string;
  orderId: Id<"orders">;
  _creationTime: number;
}

interface NotificationPanelProps {
  notifications: Notification[];
  onOrderSelect: (orderId: Id<"orders">) => void;
}

export function NotificationPanel({ notifications, onOrderSelect }: NotificationPanelProps) {
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  const handleMarkAsRead = async (notificationId: Id<"notifications">) => {
    try {
      await markAsRead({ notificationId });
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    onOrderSelect(notification.orderId);
  };

  const getNotificationIcon = (type: string) => {
    const icons = {
      order_submitted: "📝",
      order_approved: "✅",
      order_rejected: "❌",
      edit_requested: "✏️",
      warehouse_confirmed: "📦",
      warehouse_rejected: "⚠️",
      order_shipped: "🚚",
      order_completed: "🎉",
      order_failed: "💥",
    };
    return icons[type as keyof typeof icons] || "📋";
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          Notifications ({unreadCount} unread)
        </h2>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No notifications yet
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                notification.isRead
                  ? "bg-white hover:bg-gray-50 border-gray-200"
                  : "bg-blue-50 hover:bg-blue-100 border-blue-200"
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-medium ${
                      notification.isRead ? "text-gray-900" : "text-blue-900"
                    }`}>
                      {notification.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {new Date(notification._creationTime).toLocaleDateString()}
                      </span>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className={`text-sm mt-1 ${
                    notification.isRead ? "text-gray-600" : "text-blue-800"
                  }`}>
                    {notification.message}
                  </p>
                  <div className="flex items-center mt-2 space-x-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {notification.orderNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
