import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SignOutButton } from "../SignOutButton";
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

export function UserAvatar() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"notifications" | "profile">("notifications");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentUser = useQuery(api.users.getCurrentUser);
  const notifications = useQuery(api.notifications.getNotifications);
  const unreadCount = useQuery(api.notifications.getUnreadCount);
  const markAsRead = useMutation(api.notifications.markAsRead);
  const markAllAsRead = useMutation(api.notifications.markAllAsRead);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!currentUser) {
    // Show a simple sign out button if user is authenticated but has no profile
    return (
      <div className="flex items-center">
        <SignOutButton />
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <div className="relative">
          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
            {getInitials(currentUser.name)}
          </div>
          {unreadCount && unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </div>
          )}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">{currentUser.name}</div>
          <div className="text-xs text-gray-500 capitalize">{currentUser.role.replace('_', ' ')}</div>
        </div>
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
          {/* Tabs */}
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "notifications"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Notifications
              {unreadCount && unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 px-4 py-3 text-sm font-medium ${
                activeTab === "profile"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Profile
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {activeTab === "notifications" && (
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-medium text-gray-900">
                    Recent Notifications
                  </h3>
                  {unreadCount && unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                {!notifications || notifications.length === 0 ? (
                  <div className="text-center py-6 text-gray-500 text-sm">
                    No notifications yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification._id}
                        onClick={() => {
                          if (!notification.isRead) {
                            void handleMarkAsRead(notification._id);
                          }
                          setIsOpen(false);
                        }}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          notification.isRead
                            ? "bg-gray-50 hover:bg-gray-100"
                            : "bg-blue-50 hover:bg-blue-100"
                        }`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="text-lg">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium ${
                                notification.isRead ? "text-gray-900" : "text-blue-900"
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <p className={`text-xs mt-1 ${
                              notification.isRead ? "text-gray-600" : "text-blue-800"
                            }`}>
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {notification.orderNumber}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(notification._creationTime).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "profile" && (
              <div className="p-4">
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-medium mx-auto mb-3">
                      {getInitials(currentUser.name)}
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{currentUser.name}</h3>
                    <p className="text-sm text-gray-500">{currentUser.email}</p>
                    <p className="text-sm text-gray-500 capitalize">{currentUser.role.replace('_', ' ')}</p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <SignOutButton />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
