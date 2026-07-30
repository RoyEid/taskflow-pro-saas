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
    async function loadInitialData() {
      try {
        const [notifsRes, countRes] = await Promise.all([
          getNotifications(),
          getUnreadCount()
        ]);
        if (mounted) {
          const list = Array.isArray(notifsRes) ? notifsRes : (notifsRes?.data || []);
          const count = typeof countRes === 'number' ? countRes : (countRes?.data || 0);
          setNotifications(list);
          const unreadListCount = list.filter(n => !n.read).length;
          setUnreadCount(list.length === 0 ? 0 : Math.max(count, unreadListCount));
          setInitialLoaded(true);
        }
      } catch {
        // ignore
      }
    }
    loadInitialData();
    return () => { mounted = false; };
  }, []);

  const handleDropdownClick = async () => {
    setLoading(true);
    try {
      const [notifsRes, countRes] = await Promise.all([
        getNotifications(),
        getUnreadCount()
      ]);
      const list = Array.isArray(notifsRes) ? notifsRes : (notifsRes?.data || []);
      const count = typeof countRes === 'number' ? countRes : (countRes?.data || 0);
      setNotifications(list);
      const unreadListCount = list.filter(n => !n.read).length;
      setUnreadCount(list.length === 0 ? 0 : Math.max(count, unreadListCount));
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
      case "chat_message":
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
      widthClass="w-[min(22.5rem,calc(100vw-1.25rem))]"
      className="!p-0"
      trigger={({ open }) => {
        // Fetching happens on the trigger's click rather than during render,
        // because the trigger re-renders on every open/close transition.
        return (
          <button
            type="button"
            onClick={() => {
              if (!open) {
                setTimeout(() => {
                  handleDropdownClick();
                }, 0);
              }
            }}
            aria-label="Notifications"
            className={`group relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-700 active:scale-[0.98] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:bg-slate-800/80 dark:hover:text-slate-200 ${
              open
                ? "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                : ""
            }`}
          >
            <Bell
              size={18}
              className="transition-transform group-hover:animate-bell-wiggle"
            />
            {unreadCount > 0 && (
              <span className="absolute top-[8px] right-[8px] flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
            )}
          </button>
        );
      }}
    >
      {({ close }) => (
        <>
      <div className="flex items-center justify-between px-3.5 sm:px-4 py-2.5 tf-bd border-b gap-1.5">
        <div className="flex shrink-0 items-center gap-1.5 min-w-0">
          <span className="text-[13px] sm:text-[14px] font-bold tf-text whitespace-nowrap">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="tf-badge tf-badge-accent text-[10px] px-1.5 py-0.5 shrink-0">
              {unreadCount}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1 min-w-0">
          {notifications.some(n => n.read) && (
            <button
              type="button"
              onClick={handleClearRead}
              className="tf-btn-link text-[11px] tf-text-muted hover:tf-text whitespace-nowrap px-1"
            >
              Clear read
            </button>
          )}
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="tf-btn-link text-[11px] whitespace-nowrap px-1"
            >
              <span className="hidden xs:inline">Mark all read</span>
              <span className="xs:hidden">Mark read</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              close();
              onOpenSettings?.();
            }}
            className="tf-btn-icon tf-size-sm shrink-0"
            title="Manage notification settings"
          >
            <SettingsIcon size={15} />
          </button>
          <button
            type="button"
            onClick={close}
            className="sm:hidden tf-btn-icon tf-size-sm shrink-0"
            title="Close notifications"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="max-h-[60vh] sm:max-h-[360px] overflow-y-auto no-scrollbar py-1">
        {!initialLoaded || loading ? (
          <div className="tf-text-muted flex items-center justify-center p-8">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-6 text-center">
            <div className="tf-bg-3 mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full">
              <Bell className="tf-text-muted h-5 w-5" />
            </div>
            <h3 className="text-[13px] font-semibold tf-text mb-1">
              No notifications yet
            </h3>
            <p className="text-[12px] tf-text-muted">
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
                  <div className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[var(--tf-accent)]" />
                )}
                
                <div className={`mt-0.5 ml-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${color}`}>
                  {icon}
                </div>

                <div className="ml-3 min-w-0 flex-1 pr-6">
                  <p className={`text-[13px] font-medium leading-tight ${!notif.read ? 'tf-text' : 'tf-text-secondary'}`}>
                    {notif.title}
                  </p>
                  
                  <p className="mt-1 text-[12px] tf-text-muted leading-snug line-clamp-2">
                    {notif.message}
                  </p>

                  <p className="tf-text-subtle mt-1.5 text-[10px] font-medium">
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
                  className="tf-btn-icon tf-size-sm absolute right-2 top-2 hover:tf-text-danger opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                  title="Dismiss"
                >
                  <Trash2 size={14} />
                </div>
              </AppDropdown.Item>
            );
          })
        )}
      </div>
        </>
      )}
    </AppDropdown>
  );
}
