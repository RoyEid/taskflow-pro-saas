import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Bell, Settings as SettingsIcon, CheckSquare, MessageSquare, Clock, Layout, Info, Check, Trash2, Loader2, X } from 'lucide-react';
import AppDropdown from './ui/AppDropdown';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearReadNotifications
} from '../services/notificationService';
import { showError } from '../utils/alerts';

export default function NotificationDropdown({ onOpenSettings }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadInitialCount() {
      try {
        const countRes = await getUnreadCount();
        if (mounted) {
          setUnreadCount(countRes.data || 0);
          setInitialLoaded(true);
        }
      } catch {
        // ignore
      }
    }
    loadInitialCount();
    return () => { mounted = false; };
  }, []);

  const handleDropdownClick = async () => {
    setLoading(true);
    try {
      const [notifsRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadCount()
      ]);
      setNotifications(notifsRes.data || []);
      setUnreadCount(countRes.data || 0);
    } catch {
      console.error("Failed to load notifications");
    } finally {
      setInitialLoaded(true);
      setLoading(false);
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    try {
      await markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      showError("Failed to mark all as read");
    }
  };

  const handleClearRead = async (e) => {
    e.stopPropagation();
    try {
      await clearReadNotifications();
      setNotifications(prev => prev.filter(n => !n.read));
    } catch {
      showError("Failed to clear read notifications");
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await markAsRead(notification._id);
        setNotifications(prev => prev.map(n => n._id === notification._id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch {
        console.error("Failed to mark read");
      }
    }

    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      const deletedWasUnread = notifications.find(n => n._id === id && !n.read);
      if (deletedWasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch {
      showError("Failed to delete notification");
    }
  };

  const getIconData = (type) => {
    switch (type) {
      case "task_assigned":
        return { icon: <CheckSquare size={14} strokeWidth={2.5} />, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" };
      case "task_commented":
        return { icon: <MessageSquare size={14} strokeWidth={2.5} />, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10" };
      case "task_status_changed":
        return { icon: <Check size={14} strokeWidth={2.5} />, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" };
      case "task_overdue":
        return { icon: <Clock size={14} strokeWidth={2.5} />, color: "text-red-500 bg-red-50 dark:bg-red-500/10" };
      case "role_changed":
      case "workspace_update":
        return { icon: <Layout size={14} strokeWidth={2.5} />, color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10" };
      default:
        return { icon: <Info size={14} strokeWidth={2.5} />, color: "text-slate-500 bg-slate-50 dark:bg-slate-500/10" };
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // seconds
    
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <AppDropdown
      align="right"
      positionClass="fixed sm:absolute"
      showBackdropOnMobile={true}
      className="!top-16 !mt-0 !left-4 !right-4 sm:!top-full sm:!mt-2 sm:!right-0 sm:!left-auto !w-[calc(100vw-32px)] sm:!w-[340px] max-w-[360px] sm:max-w-none mx-auto sm:mx-0"
      trigger={({ open }) => {
        // We simulate a side-effect here safely via onChange pattern or let AppDropdown handle it if it supported it.
        // Actually, since trigger renders often, we shouldn't fetch here directly.
        // Let's rely on the onClick of the button instead to fetch if opening.
        return (
          <div
            onClick={() => {
              if (!open) {
                setTimeout(() => {
                  handleDropdownClick();
                }, 0);
              }
            }}
            className={`group relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border text-slate-500 transition-all duration-300 active:scale-[0.98] ${
              open
                ? "border-slate-300 bg-slate-50 dark:border-slate-600 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                : "border-slate-200 bg-white hover:bg-slate-50 hover:shadow-sm dark:border-slate-700/80 dark:bg-slate-900 dark:hover:bg-slate-800"
            }`}
          >
            <Bell
              size={18}
              className="transition-transform group-hover:animate-bell-wiggle"
            />
            {unreadCount > 0 && (
              <span className="absolute top-[11px] right-[11px] flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
              </span>
            )}
          </div>
        );
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-slate-900 dark:text-white">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {notifications.some(n => n.read) && (
            <button
              type="button"
              onClick={handleClearRead}
              className="text-[11px] font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 transition-colors mr-2"
            >
              Clear read
            </button>
          )}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors mr-1"
            >
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={onOpenSettings}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Manage notification settings"
          >
            <SettingsIcon size={16} />
          </button>
          <button
            type="button"
            onClick={() => document.body.click()}
            className="sm:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
            title="Close notifications"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="max-h-[60vh] sm:max-h-[360px] overflow-y-auto no-scrollbar py-1">
        {!initialLoaded || loading ? (
          <div className="flex items-center justify-center p-8 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800/50">
              <Bell className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-[13px] font-semibold text-slate-900 dark:text-white mb-1">
              No notifications yet
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400">
              You're all caught up!
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const { icon, color } = getIconData(notif.type);
            return (
              <AppDropdown.Item
                key={notif._id}
                onClick={() => handleNotificationClick(notif)}
                className={`!py-3 items-start relative group transition-colors ${
                  !notif.read ? 'bg-indigo-50/50 dark:bg-indigo-500/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10' : ''
                }`}
              >
                {!notif.read && (
                  <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-500" />
                )}
                
                <div className={`mt-0.5 ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color}`}>
                  {icon}
                </div>

                <div className="ml-3 min-w-0 flex-1 pr-6">
                  <p className={`text-[13px] font-medium leading-tight ${!notif.read ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {notif.title}
                  </p>
                  
                  <p className="mt-1 text-[12px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2">
                    {notif.message}
                  </p>

                  <p className="mt-1.5 text-[10px] text-slate-400 font-medium">
                    {formatTime(notif.createdAt)}
                  </p>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={(e) => handleDelete(e, notif._id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleDelete(e, notif._id);
                    }
                  }}
                  className="absolute right-3 top-3 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all cursor-pointer"
                  title="Dismiss"
                >
                  <Trash2 size={14} />
                </div>
              </AppDropdown.Item>
            );
          })
        )}
      </div>
    </AppDropdown>
  );
}
