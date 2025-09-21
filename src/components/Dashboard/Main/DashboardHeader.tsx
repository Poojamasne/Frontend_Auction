import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, User, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotifications } from '../../../contexts/NotificationContext';

interface DashboardHeaderProps {
  onMenuClick: () => void;
  isSidebarOpen: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMenuClick, isSidebarOpen }) => {
  const { user } = useAuth();
  const { notifications, unreadCount, markAsRead, fetchNotifications } = useNotifications();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    // Fetch notifications when component mounts
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };

  const handleNotificationItemClick = (id: number) => {
    markAsRead(id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

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
          <div className="ap-notifications">
            <button 
              className="ap-dashboard-notification-btn"
              onClick={handleNotificationClick}
              aria-label="Notifications"
            >
              <Bell className="ap-dashboard-notification-icon" />
              {unreadCount > 0 && (
                <span className="ap-dashboard-notification-badge">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="ap-notifications-dropdown">
                <div className="ap-notifications-header">
                  <h3>Notifications</h3>
                  <button 
                    className="ap-close-dropdown"
                    onClick={() => setShowNotifications(false)}
                    aria-label="Close notifications"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="ap-notifications-list">
                  {notifications.length === 0 ? (
                    <div className="ap-no-notifications">No notifications</div>
                  ) : (
                    notifications.map(notification => (
                      <div 
                        key={notification.id} 
                        className={`ap-notification-item ${notification.is_read ? '' : 'ap-notification-unread'}`}
                        onClick={() => handleNotificationItemClick(notification.id)}
                      >
                        <div className="ap-notification-content">
                          <p className="ap-notification-message">{notification.message}</p>
                          <span className="ap-notification-time">
                            {formatDate(notification.created_at)}
                          </span>
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
