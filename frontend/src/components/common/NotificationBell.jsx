import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { getNotifications, markNotificationRead } from '../../services/paymentApi';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await getNotifications();
      if (res.data.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRead = async (id) => {
    await markNotificationRead(id);
    loadNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 text-gray-600 hover:text-indigo-600">
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-xl rounded-lg border z-50 p-2">
          <h4 className="font-bold text-sm px-3 py-2 border-b">Thông báo</h4>
          <div className="max-h-64 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-500 p-3">Không có thông báo mới</p>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleRead(item.id)}
                  className={`p-3 text-xs border-b cursor-pointer hover:bg-gray-50 ${
                    !item.is_read ? 'bg-indigo-50 font-semibold' : ''
                  }`}
                >
                  <p className="text-gray-800 font-medium">{item.title}</p>
                  <p className="text-gray-600 mt-1">{item.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}