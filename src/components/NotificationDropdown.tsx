import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { Notification } from '../../shared/types.js';
import { api } from '../services/api.js';

interface NotificationDropdownProps {
  onNavigate: (tab: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ onNavigate }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifs = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch (err) {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      // ignore
    }
  };

  const handleClickItem = async (notif: Notification) => {
    if (!notif.read) {
      await api.markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
      );
    }
    if (notif.link) {
      const targetTab = notif.link.replace('/', '');
      onNavigate(targetTab);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500 ring-2 ring-neutral-900" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-84 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-200">Notifications</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/50">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-neutral-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-800/50">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500">
                No notifications right now
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleClickItem(notif)}
                  className={`p-3 text-left hover:bg-neutral-800/40 cursor-pointer transition-colors ${
                    !notif.read ? 'bg-neutral-800/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-medium text-neutral-200">
                      {notif.title}
                    </div>
                    {!notif.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0 mt-1" />
                    )}
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-1 leading-snug">
                    {notif.message}
                  </div>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-neutral-500 font-mono">
                    <span>
                      {new Date(notif.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {notif.link && (
                      <span className="text-cyan-400 flex items-center gap-0.5 hover:underline">
                        View <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
