import React, { useEffect, useState } from 'react';
import { Bell, Check, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNotifications, markNotificationRead } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

function getItems(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    let active = true;
    setLoading(true);
    getNotifications()
      .then((response) => {
        if (active) setNotifications(getItems(response.data));
      })
      .catch((requestError) => {
        if (active) setError(requestError.message || 'Không thể tải thông báo.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;

  const unreadCount = notifications.filter((item) => !item.is_read && !item.read_at).length;

  const openNotification = async (item) => {
    if (!item.is_read && !item.read_at) {
      setBusyId(item.id || item.notification_id);
      setError('');
      try {
        await markNotificationRead(item.id || item.notification_id);
        setNotifications((current) => current.map((notification) => (
          notification === item ? { ...notification, is_read: true } : notification
        )));
      } catch (requestError) {
        setError(requestError.message || 'Không thể đánh dấu thông báo đã đọc.');
        setBusyId(null);
        return;
      }
      setBusyId(null);
    }
    setOpen(false);
    navigate('/my-history');
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={`Thông báo${unreadCount ? `, ${unreadCount} chưa đọc` : ''}`}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-rose-600 px-1 text-[10px] font-bold leading-5 text-white">{unreadCount}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-900">Thông báo</h2>
            {loading && <LoaderCircle className="h-4 w-4 animate-spin text-slate-400" />}
          </div>
          {error && <p role="alert" className="px-4 py-2 text-xs text-rose-700">{error}</p>}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && !loading ? (
              <p className="px-4 py-6 text-center text-xs text-slate-500">Chưa có thông báo.</p>
            ) : notifications.map((item) => {
              const id = item.id || item.notification_id;
              const isUnread = !item.is_read && !item.read_at;
              return (
                <button key={id} type="button" onClick={() => openNotification(item)} disabled={busyId === id} className={`block w-full border-b border-slate-100 px-4 py-3 text-left hover:bg-slate-50 disabled:opacity-60 ${isUnread ? 'bg-emerald-50/60' : ''}`}>
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">{item.title || 'Nhắc hạn trả tài sản'}</span>
                    {isUnread && (busyId === id ? <LoaderCircle className="h-3.5 w-3.5 animate-spin text-emerald-700" /> : <Check className="h-3.5 w-3.5 text-emerald-700" />)}
                  </span>
                  <span className="mt-1 block text-xs text-slate-600">{item.message || item.body}</span>
                  {item.created_at && <span className="mt-1 block text-[10px] text-slate-400">{new Date(item.created_at).toLocaleString('vi-VN')}</span>}
                </button>
              );
            })}
          </div>
          <button type="button" onClick={() => { setOpen(false); navigate('/my-history'); }} className="w-full px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-slate-50">Xem lịch sử và công nợ</button>
        </div>
      )}
    </div>
  );
}
