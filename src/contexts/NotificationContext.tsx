
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import notificationService, { NotificationItem } from '../services/notificationService';

import { Toaster } from 'react-hot-toast';
import { useAuth } from './AuthContext';

interface Notification {
  id: number;
  type: string;
  auction_id: number;
  auction_title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (type: string, message: string, auction_id?: number, auction_title?: string) => void;
  markAsRead: (id: number) => void;
  clearNotifications: () => void;
  
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  loading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [loading, setLoading] = useState(false);
  const { token } = useAuth();

  const [hasInitiallyFetched, setHasInitiallyFetched] = useState(false);


  

  useEffect(() => {
    if (token) {
      fetchNotifications();
      // Set up polling for notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  const addNotification = (type: string, message: string, auction_id?: number, auction_title?: string): void => {
    const newNotification: Notification = {
      id: Date.now(),
      type,
      auction_id: auction_id || 0,
      auction_title: auction_title || '',
      message,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Auto-remove notification after 5 seconds for push notifications
    if (type === 'push') {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
      }, 5000);
    }
  };

  const markAsRead = async (id: number): Promise<void> => {
    try {
      if (token) {
        // Call API to mark as read
        await fetch(`https://auction-development.onrender.com/api/notifications/mark-read/${id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      }
      
      // Update local state
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const clearNotifications = (): void => {
    setNotifications([]);
    setHasInitiallyFetched(false); // Allow fetching again after clearing
  };

  const fetchNotifications = async (): Promise<void> => {
    try {
      if (hasInitiallyFetched) return;
      const apiNotifications: NotificationItem[] = await notificationService.getMyNotifications();
      // Map API notifications to local Notification type
      const mapped: Notification[] = apiNotifications.map((n) => ({
        id: n.id || n._id || n.notificationId || Math.random().toString(36).slice(2),
        type: (n.type as string) || 'push',
        auction_id: n.auction_id || 0,
        auction_title: n.auction_title || '',
        message: n.message || n.title || '',
        is_read: typeof n.is_read === 'boolean' ? n.is_read : !!n.read,
        created_at: n.createdAt ? new Date(n.createdAt).toISOString() : new Date().toISOString(),
      }));
      setNotifications(mapped);
      setHasInitiallyFetched(true);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const value: NotificationContextType = {
    notifications,
    addNotification,
    markAsRead,
    clearNotifications,
    fetchNotifications,
    unreadCount,
    loading,
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
