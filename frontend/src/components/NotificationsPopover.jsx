// NotificationsPopover.jsx
import { useState, useEffect, useRef } from 'react';
import API from '../api';
import Icon, { IC } from './MyIcons';

export default function NotificationsPopover({ dark, theme }) {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const popRef = useRef(null);

  const { text, muted, border, D } = theme ?? {
    text: dark ? 'text-slate-100' : 'text-slate-800',
    muted: dark ? 'text-slate-400' : 'text-slate-500',
    border: dark ? 'border-slate-700' : 'border-slate-200',
    D: dark,
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const fetchNotifications = async () => {
    try {
      const res = await API.get('notifications/');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 7000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const fn = (e) => {
      if (popRef.current && !popRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await API.post('notifications/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark notifications read', err);
    }
  };

  return (
    <div ref={popRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={`relative p-2 rounded-xl transition-all ${D ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
      >
        <Icon path={IC.bell} className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-slate-800" />
        )}
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border shadow-xl z-50 overflow-hidden ${D ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
        >
          <div className={`flex items-center justify-between px-4 py-3 border-b ${border}`}>
            <h3 className={`text-sm font-bold ${text}`}>Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors"
              >
                Mark all read
              </button>
            )}
            {notifications.length > 0 && (
            <button
                onClick={async () => {
                    try {
                        await API.delete('notifications/');
                        setNotifications([]); // clear locally immediately
                    } catch (err) {
                        console.error('Failed to clear notifications', err);
                    }
                }}
                className="text-xs font-semibold text-red-500 hover:text-red-600 transition-colors"
            >
                Clear all
            </button>
        )}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className={`px-4 py-8 text-center text-xs ${muted}`}>
                No notifications yet.
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`px-4 py-3 border-b ${border} ${n.is_read ? '' : D ? 'bg-blue-900/20' : 'bg-blue-50'}`}
                >
                  <div className="flex items-start gap-2">
                    <Icon
                      path={IC.clock}
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${n.is_read ? muted : 'text-blue-500'}`}
                    />
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${text}`}>{n.title}</p>
                      <p className={`text-xs mt-0.5 ${muted}`}>{n.message}</p>
                      <p className={`text-xs mt-1 ${muted} opacity-70`}>
                        {new Date(n.sent_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}