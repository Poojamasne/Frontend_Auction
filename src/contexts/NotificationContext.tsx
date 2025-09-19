// import React, { createContext, useContext, useState, ReactNode } from 'react';
// import { Toaster } from 'react-hot-toast';

// interface Notification {
//   id: string;
//   type: 'sms' | 'email' | 'push';
//   message: string;
//   timestamp: Date;
//   read: boolean;
// }

// interface NotificationContextType {
//   notifications: Notification[];
//   addNotification: (type: 'sms' | 'email' | 'push', message: string) => void;
//   markAsRead: (id: string) => void;
//   clearNotifications: () => void;
//   unreadCount: number;
// }

// const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// interface NotificationProviderProps {
//   children: ReactNode;
// }

// export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
//   const [notifications, setNotifications] = useState<Notification[]>([]);

//   const addNotification = (type: 'sms' | 'email' | 'push', message: string): void => {
//     const newNotification: Notification = {
//       id: Date.now().toString(),
//       type,
//       message,
//       timestamp: new Date(),
//       read: false,
//     };

//     setNotifications(prev => [newNotification, ...prev]);

//     // Auto-remove notification after 5 seconds for push notifications
//     if (type === 'push') {
//       setTimeout(() => {
//         setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
//       }, 5000);
//     }
//   };

//   const markAsRead = (id: string): void => {
//     setNotifications(prev =>
//       prev.map(notification =>
//         notification.id === id ? { ...notification, read: true } : notification
//       )
//     );
//   };

//   const clearNotifications = (): void => {
//     setNotifications([]);
//   };

//   const unreadCount = notifications.filter(n => !n.read).length;

//   const value: NotificationContextType = {
//     notifications,
//     addNotification,
//     markAsRead,
//     clearNotifications,
//     unreadCount,
//   };

//   return (
//     <NotificationContext.Provider value={value}>
//       {children}
//       <Toaster
//         position="top-right"
//         reverseOrder={false}
//         gutter={8}
//         containerClassName=""
//         containerStyle={{}}
//         toastOptions={{
//           // Default options for all toasts
//           duration: 4000,
//           style: {
//             background: '#ffffff',
//             color: '#1f2937',
//             border: '1px solid #e5e7eb',
//             borderRadius: '12px',
//             padding: '16px 20px',
//             fontSize: '14px',
//             fontWeight: '500',
//             boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
//             maxWidth: '400px',
//             wordBreak: 'break-word',
//           },
//           // Success toasts
//           success: {
//             duration: 4000,
//             style: {
//               background: '#f0fdf4',
//               color: '#166534',
//               border: '1px solid #bbf7d0',
//               borderLeft: '4px solid #10b981',
//             },
//             iconTheme: {
//               primary: '#10b981',
//               secondary: '#ffffff',
//             },
//           },
//           // Error toasts
//           error: {
//             duration: 6000,
//             style: {
//               background: '#fef2f2',
//               color: '#991b1b',
//               border: '1px solid #fecaca',
//               borderLeft: '4px solid #ef4444',
//             },
//             iconTheme: {
//               primary: '#ef4444',
//               secondary: '#ffffff',
//             },
//           },
//           // Loading toasts
//           loading: {
//             duration: Infinity,
//             style: {
//               background: '#eff6ff',
//               color: '#1e40af',
//               border: '1px solid #bfdbfe',
//               borderLeft: '4px solid #3b82f6',
//             },
//             iconTheme: {
//               primary: '#3b82f6',
//               secondary: '#ffffff',
//             },
//           },
//           // Custom toasts
//           blank: {
//             style: {
//               background: '#f9fafb',
//               color: '#374151',
//               border: '1px solid #d1d5db',
//             },
//           },
//         }}
//       />
//     </NotificationContext.Provider>
//   );
// };

// export const useNotifications = (): NotificationContextType => {
//   const context = useContext(NotificationContext);
//   if (context === undefined) {
//     throw new Error('useNotifications must be used within a NotificationProvider');
//   }
//   return context;
// };




import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'sms' | 'email' | 'push';
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: 'sms' | 'email' | 'push', message: string) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
  fetchNotifications: () => Promise<void>;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);

  const addNotification = (type: 'sms' | 'email' | 'push', message: string): void => {
    const newNotification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove notification after 5 seconds for push notifications
    if (type === 'push') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    }
  };

  const markAsRead = (id: string): void => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const clearNotifications = (): void => {
    setNotifications([]);
    setHasInitiallyFetched(false); // Allow fetching again after clearing
  };

  const fetchNotifications = async (): Promise<void> => {
    try {
      // Only fetch initial notifications once to prevent continuous adding
      if (hasInitiallyFetched) {
        return; // Don't fetch again if already fetched
      }

      // For now, we'll simulate fetching notifications from an API
      // In a real implementation, this would call an actual API endpoint
      const mockNotifications: Notification[] = [
        {
          id: 'user-notif-1',
          type: 'push',
          message: 'New auction "Vintage Watch Collection" is starting soon!',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          read: false,
        },
        {
          id: 'user-notif-2',
          type: 'email',
          message: 'You have been outbid on "Rare Artwork Auction"',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          read: false,
        },
        {
          id: 'user-notif-3',
          type: 'sms',
          message: 'Payment confirmation received for auction #A123',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          read: true,
        },
      ];

      // Set notifications only if not already set
      if (notifications.length === 0) {
        setNotifications(mockNotifications);
      }
      
      setHasInitiallyFetched(true);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    clearNotifications,
    fetchNotifications,
    unreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <Toaster
        position="top-right"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          // Default options for all toasts
          duration: 4000,
          style: {
            background: '#ffffff',
            color: '#1f2937',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '16px 20px',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            maxWidth: '400px',
            wordBreak: 'break-word',
          },
          // Success toasts
          success: {
            duration: 4000,
            style: {
              background: '#f0fdf4',
              color: '#166534',
              border: '1px solid #bbf7d0',
              borderLeft: '4px solid #10b981',
            },
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          // Error toasts
          error: {
            duration: 6000,
            style: {
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderLeft: '4px solid #ef4444',
            },
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
          // Loading toasts
          loading: {
            duration: Infinity,
            style: {
              background: '#eff6ff',
              color: '#1e40af',
              border: '1px solid #bfdbfe',
              borderLeft: '4px solid #3b82f6',
            },
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#ffffff',
            },
          },
          // Custom toasts
          blank: {
            style: {
              background: '#f9fafb',
              color: '#374151',
              border: '1px solid #d1d5db',
            },
          },
        }}
      />
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
