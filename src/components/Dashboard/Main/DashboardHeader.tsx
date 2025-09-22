import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, User, X, Clock } from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

// Notification type matches NotificationContext
type Notification = {
  id: string | number;
  message: string;
  type?: string;
  is_read: boolean;
  created_at: string;
  [key: string]: any;
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMenuClick, isSidebarOpen }) => {
  const { user } = useAuth();

  // Remove duplicate destructuring and keep only the one with all needed properties
  const { notifications, unreadCount, markAsRead, clearNotifications, fetchNotifications } = useNotifications();
  const location = useLocation();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Fetch notifications on component mount to show badge immediately
  useEffect(() => {
    const loadInitialNotifications = async () => {
      try {
        await fetchNotifications();
      } catch (error) {
        console.error('Failed to load initial notifications:', error);
      }
    };

    loadInitialNotifications();
  }, [fetchNotifications]);


  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'My Auctions', href: '/dashboard/auctions' },
    { name: 'New Auction', href: '/dashboard/new-auction' },
    { name: 'Reports', href: '/dashboard/reports' },
    { name: 'My Profile', href: '/dashboard/profile' },
  ];

  const getCurrentPageName = () => {
    const currentNav = navigation.find(nav =>
      location.pathname === nav.href ||
      (nav.href !== '/dashboard' && location.pathname.startsWith(nav.href))
    );
    return currentNav?.name || 'Dashboard';
  };

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };

    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotificationOpen]);

  const handleNotificationClick = async () => {
    const wasOpen = isNotificationOpen;
    setIsNotificationOpen(!wasOpen);
    
    // Fetch notifications when opening the dropdown
    if (!wasOpen) {
      try {
        await fetchNotifications();
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    }
  };

  const handleMarkAsRead = (id: string | number) => {
    markAsRead(Number(id));
  };

  const handleClearNotifications = () => {
    clearNotifications();
    setIsNotificationOpen(false); // Close the dropdown after clearing
  };

  const formatTime = (created_at: string) => {
    const dateObj = new Date(created_at);
    const now = new Date();
    const diff = now.getTime() - dateObj.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours < 1) {
      return minutes < 1 ? 'Just now' : `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
  };

  return (
    <header className="ap-dashboard-header">
      <div className="ap-dashboard-header-content">
        <button
          onClick={onMenuClick}
          className="ap-dashboard-menu-btn"
          aria-label="Open sidebar"
          aria-controls="dashboard-sidebar"
          aria-expanded={isSidebarOpen}
        >
          <Menu className="ap-dashboard-menu-icon" />
        </button>

        <div className="ap-dashboard-header-title">
          <h1 className="ap-dashboard-page-title">
            {getCurrentPageName()}
          </h1>
        </div>

        <div className="ap-dashboard-header-actions">
          {/* Notifications */}
          <div className="ap-dashboard-notification-container" ref={notificationRef}>
            <button
              className={`ap-dashboard-notification-btn ${isNotificationOpen ? 'active' : ''}`}
              onClick={handleNotificationClick}
              aria-label="Notifications"
              aria-expanded={isNotificationOpen}
            >
              <Bell className="ap-dashboard-notification-icon" />
              {unreadCount > 0 && (
                <span className="ap-dashboard-notification-badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            {/* Notification Dropdown */}
            {isNotificationOpen && (
              <div className="ap-notification-dropdown">
                <div className="ap-notification-header">
                  <div className="ap-notification-title">
                    <h3>Notifications</h3>
                    {notifications.length > 0 && (
                      <span className="ap-notification-count">
                        ({notifications.length})
                      </span>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <button
                      onClick={handleClearNotifications}
                      className="ap-notification-clear-btn"
                      title="Clear all notifications"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                <div className="ap-notification-list">
                  {notifications.length === 0 ? (
                    <div className="ap-notification-empty">
                      <Bell className="ap-notification-empty-icon" />
                      <p>No notifications yet</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`ap-notification-item ${!notification.is_read ? 'unread' : ''}`}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="ap-notification-content">
                          <div className="ap-notification-message">
                            {notification.message}
                          </div>
                          <div className="ap-notification-meta">
                            <span className="ap-notification-type">
                              {notification.type?.toUpperCase?.() ?? ''}
                            </span>
                            <span className="ap-notification-time">
                              <Clock size={12} />
                              {formatTime(notification.created_at)}
                            </span>
                          </div>
                        </div>
                        {!notification.is_read && (
                          <div className="ap-notification-dot"></div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {/* User menu - for larger screens */}
          <div className="ap-dashboard-user-menu">
            <div className="ap-dashboard-user-info">
              <div className="ap-dashboard-user-name">
                {user?.name || 'User'}
              </div>
            </div>
            <div className="ap-dashboard-user-avatar">
              <User className="ap-dashboard-user-icon" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
