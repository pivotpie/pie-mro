
import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type NotificationType = "info" | "success" | "warning" | "error";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id">) => void;
  removeNotification: (id: string) => void;
  showToast: (options: {
    title: string;
    message: string;
    type: NotificationType;
    action?: { label: string; onClick: () => void };
    duration?: number;
  }) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications((prev) => [...prev, { ...notification, id }]);

    // Auto-dismiss notifications after duration (if provided)
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, type, action, duration = 5000 }: {
      title: string;
      message: string;
      type: NotificationType;
      action?: { label: string; onClick: () => void };
      duration?: number;
    }) => {
      if (action) {
        toast[type](title, {
          description: message,
          action: {
            label: action.label,
            onClick: action.onClick,
          },
          duration,
        });
      } else {
        toast[type](title, {
          description: message,
          duration,
        });
      }
    },
    []
  );

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, showToast }}>
      {children}
      <div className="fixed bottom-0 right-0 p-4 z-50 space-y-2 max-w-md">
        {notifications.map((notification) => (
          <Alert
            key={notification.id}
            className={`
              shadow-lg border-l-4 transition-all duration-300 animate-fade-in
              ${notification.type === 'info' ? 'border-l-blue-500' : ''}
              ${notification.type === 'success' ? 'border-l-green-500' : ''}
              ${notification.type === 'warning' ? 'border-l-yellow-500' : ''}
              ${notification.type === 'error' ? 'border-l-red-500' : ''}
            `}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <AlertTitle className="text-sm font-semibold">{notification.title}</AlertTitle>
                <AlertDescription className="text-xs mt-1">{notification.message}</AlertDescription>
              </div>
              <div className="flex items-center gap-2">
                {notification.action && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={notification.action.onClick}
                    className="text-xs h-7 px-2"
                  >
                    {notification.action.label}
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={() => removeNotification(notification.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </Alert>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
