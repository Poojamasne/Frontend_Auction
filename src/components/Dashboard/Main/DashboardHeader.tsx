
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, User, X } from 'lucide-react';
// import React from 'react';
// import { useLocation } from 'react-router-dom';
// import { Menu, Bell, User } from 'lucide-react';
// import { useAuth } from '../../../contexts/AuthContext';
// import { useNotifications } from '../../../contexts/NotificationContext';

// interface DashboardHeaderProps {
//   onMenuClick: () => void;
//   isSidebarOpen: boolean;
// }

// const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onMenuClick, isSidebarOpen }) => {
//   const { user } = useAuth();
//   const { unreadCount } = useNotifications();
//   const location = useLocation();

//   const navigation = [
//     { name: 'Dashboard', href: '/dashboard' },
//     { name: 'My Auctions', href: '/dashboard/auctions' },
//     { name: 'New Auction', href: '/dashboard/new-auction' },
//     { name: 'Reports', href: '/dashboard/reports' },
//     { name: 'My Profile', href: '/dashboard/profile' },
//   ];

//   const getCurrentPageName = () => {
//     const currentNav = navigation.find(nav =>
//       location.pathname === nav.href ||
//       (nav.href !== '/dashboard' && location.pathname.startsWith(nav.href))
//     );
//     return currentNav?.name || 'Dashboard';
//   };

//   return (
//     <header className="ap-dashboard-header">
//       <div className="ap-dashboard-header-content">
//         <button
//           onClick={onMenuClick}
//           className="ap-dashboard-menu-btn"
//           aria-label="Open sidebar"
//           aria-controls="dashboard-sidebar"
//           aria-expanded={isSidebarOpen}
//         >
//           <Menu className="ap-dashboard-menu-icon" />
//         </button>

//         <div className="ap-dashboard-header-title">
//           <h1 className="ap-dashboard-page-title">
//             {getCurrentPageName()}
//           </h1>
//         </div>

//         <div className="ap-dashboard-header-actions">
//           {/* Notifications */}
//           <button className="ap-dashboard-notification-btn">
//             <Bell className="ap-dashboard-notification-icon" />
//             {unreadCount > 0 && (
//               <span className="ap-dashboard-notification-badge">
//                 {unreadCount > 9 ? '9+' : unreadCount}
//               </span>
//             )}
//           </button>

//           {/* User menu - for larger screens */}
//           <div className="ap-dashboard-user-menu">
//             <div className="ap-dashboard-user-info">
//               <div className="ap-dashboard-user-name">
//                 {user?.name || 'User'}
//               </div>
//               {/*<div className="ap-dashboard-user-role">
//                 {user?.role === 'admin' ? 'Administrator' : 'User'}
//               </div>*/}
//             </div>
//             <div className="ap-dashboard-user-avatar">
//               <User className="ap-dashboard-user-icon" />
//             </div>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// };

// export default DashboardHeader;




import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, User, X, Clock } from 'lucide-react';

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

  const handleMarkAsRead = (id: string) => {
    markAsRead(id);
  };

  const handleClearNotifications = () => {
    clearNotifications();
    setIsNotificationOpen(false); // Close the dropdown after clearing
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
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

          <div className="ap-notifications">
            <button 
              className="ap-dashboard-notification-btn"
              onClick={handleNotificationClick}
              aria-label="Notifications"

          <div className="ap-dashboard-notification-container" ref={notificationRef}>
            <button 
              className={`ap-dashboard-notification-btn ${isNotificationOpen ? 'active' : ''}`}
              onClick={handleNotificationClick}
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
                        className={`ap-notification-item ${!notification.read ? 'unread' : ''}`}
                        onClick={() => handleMarkAsRead(notification.id)}
                      >
                        <div className="ap-notification-content">
                          <div className="ap-notification-message">
                            {notification.message}
                          </div>
                          <div className="ap-notification-meta">
                            <span className="ap-notification-type">
                              {notification.type.toUpperCase()}
                            </span>
                            <span className="ap-notification-time">
                              <Clock size={12} />
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                        </div>
                        {!notification.read && (

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
