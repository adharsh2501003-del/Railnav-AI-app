import React from 'react';
import { 
  Bell, AlertTriangle, AlertCircle, RefreshCw, Sparkles, CheckCheck, 
  Clock, ArrowLeftRight, Megaphone, Trash2 
} from 'lucide-react';
import { AppNotification } from '../types';

interface NotificationsScreenProps {
  isDarkMode: boolean;
  notifications: AppNotification[];
  onMarkAllRead: () => void;
  onClearNotification: (id: string) => void;
  onNavigateToRoute: () => void;
}

export default function NotificationsScreen({
  isDarkMode,
  notifications,
  onMarkAllRead,
  onClearNotification,
  onNavigateToRoute,
}: NotificationsScreenProps) {

  const getNotificationStyles = (type: string) => {
    switch (type) {
      case 'platform':
        return {
          icon: <ArrowLeftRight className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />,
          color: 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/40',
          badge: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-400'
        };
      case 'delay':
        return {
          icon: <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />,
          color: 'bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/40',
          badge: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
        };
      case 'route':
        return {
          icon: <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
          color: 'bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40',
          badge: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400'
        };
      case 'crowd':
        return {
          icon: <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />,
          color: 'bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/40',
          badge: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
        };
      default:
        return {
          icon: <Megaphone className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
          color: 'bg-teal-50 dark:bg-teal-950/20 border-teal-100 dark:border-teal-900/40',
          badge: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-400'
        };
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div
      id="notifications-screen-container"
      className={`w-full h-full flex flex-col overflow-y-auto transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'
      }`}
    >
      {/* Notifications Header */}
      <div className="p-5 pb-3 flex items-center justify-between shrink-0">
        <div className="text-left">
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-extrabold tracking-wider uppercase block">
            STATION BROADCASTS
          </span>
          <h2 className="text-xl font-bold tracking-tight">Active Notifications</h2>
          <p className="text-[10px] text-slate-400">
            {unreadCount} unread announcements
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            id="btn-notifications-mark-read"
            onClick={onMarkAllRead}
            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-slate-900 px-3.5 py-1.5 rounded-xl border border-blue-100 dark:border-slate-800 active:scale-95 transition"
          >
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </button>
        )}
      </div>

      {/* Notifications Cards Frame List */}
      <div className="p-4 space-y-3 flex-1">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-400 dark:text-slate-600 mb-4 border border-slate-200 dark:border-slate-800">
              <Bell className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold">No active bulletins</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1 px-8">
              All quiet for your journey. Any delay or platform change alerts from the Station Master will appear here.
            </p>
          </div>
        ) : (
          notifications.map((notif) => {
            const style = getNotificationStyles(notif.type);
            return (
              <div
                key={notif.id}
                id={`notification-card-${notif.id}`}
                className={`p-5 rounded-[24px] border text-left shadow-sm flex gap-3.5 relative transition-all duration-200 hover:scale-[1.01] ${style.color} ${
                  !notif.read ? 'ring-2 ring-blue-500/10' : ''
                }`}
              >
                {/* Unread circle badge */}
                {!notif.read && (
                  <span className="absolute top-5 right-5 w-2 h-2 rounded-full bg-blue-600"></span>
                )}

                {/* Left Side Icon Column */}
                <div className="w-10 h-10 rounded-[14px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center shrink-0 shadow-sm">
                  {style.icon}
                </div>

                {/* Main Notification Content */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${style.badge}`}>
                      {notif.type === 'platform' ? 'Platform Alert' : notif.type === 'delay' ? 'Delay' : notif.type === 'route' ? 'Rerouting' : notif.type === 'crowd' ? 'Congestion' : 'Station Broadcast'}
                    </span>
                    <span className="text-[9px] text-slate-400 font-semibold font-mono">{notif.time}</span>
                  </div>

                  <h3 className="text-xs font-bold text-slate-950 dark:text-white leading-tight">
                    {notif.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal font-medium">
                    {notif.message}
                  </p>

                  {/* Context action buttons inside cards */}
                  {notif.type === 'route' && (
                    <button
                      id="btn-notif-action-reroute"
                      onClick={onNavigateToRoute}
                      className="mt-2.5 h-8 px-4 bg-[#0052CC] hover:bg-[#003D99] text-white rounded-xl text-[10px] font-bold flex items-center gap-1 cursor-pointer transition active:scale-95"
                    >
                      Show New Path
                    </button>
                  )}
                </div>

                {/* Dismiss Trash button */}
                <button
                  id={`btn-clear-notification-${notif.id}`}
                  onClick={() => onClearNotification(notif.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-500 self-start shrink-0 rounded-lg hover:bg-white/40 dark:hover:bg-slate-900 transition cursor-pointer"
                  title="Dismiss bulletin"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Advisory Bottom Note */}
      <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-950/40 text-[10px] text-slate-400 text-left leading-relaxed">
        <strong>Information Disclaimer</strong>: Broadcast data is pushed straight from the Indian Railways National Train Enquiry System (NTES) and local station signals. Check physical monitors to verify final coach setups.
      </div>
    </div>
  );
}
