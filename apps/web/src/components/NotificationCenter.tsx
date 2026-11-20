import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  CheckCircle,
  Calendar,
  Megaphone,
  CreditCard,
  FileCheck,
  ShieldAlert,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { api } from '../services/api';
import { InAppNotification, NotificationType } from '@keydso/shared-types';

export const NotificationCenter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [pushStatus, setPushStatus] = useState<'default' | 'granted' | 'denied' | 'unsupported'>('default');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Check push permission on mount
  useEffect(() => {
    if (!('Notification' in window)) {
      setPushStatus('unsupported');
    } else {
      setPushStatus(Notification.permission as any);
    }
  }, []);

  // Fetch notifications
  const { data } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.getNotifications(),
    refetchInterval: 30000, // refresh every 30 seconds
  });

  const unreadCount = data?.unread_count || 0;
  const notifications = data?.notifications || [];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Mark single as read mutation
  const markReadMutation = useMutation({
    mutationFn: (id: string) => api.markNotificationRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => api.markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const handleNotificationClick = (item: InAppNotification) => {
    if (!item.is_read) {
      markReadMutation.mutate(item.id);
    }
    if (item.action_url) {
      setIsOpen(false);
      navigate(item.action_url);
    }
  };

  const handleEnablePush = async () => {
    if (!('Notification' in window)) {
      alert('Push notifications are not supported in this browser.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission as any);

      if (permission === 'granted') {
        // Register mock push subscription for demo/PWA
        await api.registerPushSubscription({
          endpoint: `https://push.keydso.university.edu/fcm/client/${Math.random().toString(36).substring(7)}`,
          keys: {
            p256dh: 'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QT9Q0_Wl9pD',
            auth: 'tBHItJI5svbpez7KI4CCXg',
          },
        });
        alert('Push notifications enabled for Keydso Maanta!');
      }
    } catch (err) {
      console.error('Failed to enable push notifications', err);
    }
  };

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'PAYMENT_VERIFIED':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'MEETING_APPROVED':
        return <Calendar className="w-4 h-4 text-sky-500" />;
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-amber-500" />;
      case 'EXPENSE_APPROVED':
        return <FileCheck className="w-4 h-4 text-purple-500" />;
      case 'CHALLENGE_UPDATED':
        return <ShieldAlert className="w-4 h-4 text-rose-500" />;
      default:
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
        title="Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 text-[10px] font-bold text-white items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-sky-400" />
              <h3 className="font-semibold text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-rose-500 text-white rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={() => markAllReadMutation.mutate()}
                disabled={markAllReadMutation.isPending}
                className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Web Push Prompt Bar */}
          {pushStatus !== 'granted' && pushStatus !== 'unsupported' && (
            <div className="px-4 py-2.5 bg-sky-50 border-b border-sky-100 flex items-center justify-between text-xs">
              <span className="text-sky-900 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                Enable instant mobile push alerts?
              </span>
              <button
                onClick={handleEnablePush}
                className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded text-xs transition-colors"
              >
                Enable
              </button>
            </div>
          )}

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 hover:bg-slate-50 cursor-pointer transition-colors flex gap-3 ${
                    !item.is_read ? 'bg-sky-50/40' : ''
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 flex-shrink-0 self-start">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <p
                        className={`text-xs font-semibold truncate ${
                          !item.is_read ? 'text-slate-900' : 'text-slate-700'
                        }`}
                      >
                        {item.title}
                      </p>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-sky-500 flex-shrink-0"></span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-400">
                      <span>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {item.action_url && (
                        <span className="text-sky-600 flex items-center gap-0.5 hover:underline">
                          View details <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <span className="text-[11px] text-slate-500">
              Keydso Maanta Real-Time Council Updates
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
