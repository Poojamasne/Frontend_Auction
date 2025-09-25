import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, User, X, Clock } from 'lucide-react';

import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

type Notification = {
  id: string | number;
  message: string;
  type?: string;
  is_read: boolean;
  created_at: string;
  [key: string]: any;
};

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onMenuClick,
  isSidebarOpen,
}) => {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    clearNotifications,
    fetchNotifications,
  } = useNotifications();

  const location = useLocation();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchNotifications().catch((err) =>
      console.error('Failed to load initial notifications:', err)
    );
  }, [fetchNotifications]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'My Auctions', href: '/dashboard/auctions' },
    { name: 'New Auction', href: '/dashboard/new-auction' },
    { name: 'Reports', href: '/dashboard/reports' },
    { name: 'My Profile', href: '/dashboard/profile' },
  ];

  const getCurrentPageName = () => {
    const current = navigation.find(
      (n) =>
        location.pathname === n.href ||
        (n.href !== '/dashboard' && location.pathname.startsWith(n.href))
    );
    return current?.name || 'Dashboard';
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      ) {
        setIsNotificationOpen(false);
      }
    };
    if (isNotificationOpen) {
      document.addEventListener('mousedown', handleOutside);
      return () => document.removeEventListener('mousedown', handleOutside);
    }
  }, [isNotificationOpen]);

  const handleNotificationClick = async () => {
    const willOpen = !isNotificationOpen;
    setIsNotificationOpen(willOpen);
    if (willOpen) {
      try {
        await fetchNotifications();
      } catch (e) {
        console.error('Failed to fetch notifications:', e);
      }
    }
  };

  const handleMarkAsRead = (id: string | number) => markAsRead(Number(id));

  const handleClearNotifications = () => {
    clearNotifications();
    setIsNotificationOpen(false);
  };

  const formatTime = (created: string) => {
    const diff = Date.now() - new Date(created).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    

    if (mins < 1) return 'Just now';
    if (hrs < 1) return `${mins}m ago`;
    if (days < 1) return `${hrs}h ago`;
    return `${days}d ago`;

  };

  return (
    <header className="ap-dashboard-header">
      <div className="ap-dashboard-header-content">
        <button
          onClick={onMenuClick}
          className="ap-dashboard-menu-btn"
          aria-label="Toggle sidebar"
          aria-controls="dashboard-sidebar"
          aria-expanded={isSidebarOpen}
        >
          <Menu className="ap-dashboard-menu-icon" />
        </button>

        <div className="ap-dashboard-header-title">
          <h1 className="ap-dashboard-page-title">{getCurrentPageName()}</h1>
        </div>

        <div className="ap-dashboard-header-actions">
          {/* ----- Notifications ----- */}
          <div
            className="ap-dashboard-notification-container"
            ref={notificationRef}
          >
            <button
              className={`ap-dashboard-notification-btn ${
                isNotificationOpen ? 'active' : ''
              }`}
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
                      className="ap-notification-clear-btn"
                      onClick={handleClearNotifications}
                      title="Clear all"
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
                    <>
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`ap-notification-item ${
                            !n.is_read ? 'unread' : ''
                          }`}
                          onClick={() => handleMarkAsRead(n.id)}
                        >
                          <div className="ap-notification-content">
                            <div className="ap-notification-message">
                              {n.message}
                            </div>
                            <div className="ap-notification-meta">
                              <span className="ap-notification-type">
                                {n.type?.toUpperCase() ?? ''}
                              </span>
                              {/* <span className="ap-notification-time">
                                <Clock size={12} />
                                {formatTime(n.created_at)}
                              </span> */}
                            </div>
                          </div>

                          <button
  className="ap-notification-toggle-btn"
  onClick={(e) => {
    e.stopPropagation();
    handleMarkAsRead(n.id);
  }}
>
  {n.is_read ? 'Read' : 'Unread'}
</button>

                          {!n.is_read && (
                            <div className="ap-notification-dot" />
                          )}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ----- User menu ----- */}
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