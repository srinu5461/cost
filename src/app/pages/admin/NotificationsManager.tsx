import { useState, useEffect } from 'react';
import { Bell, Check, Trash2, Filter, Info, ShoppingCart, User, Mail, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { notify } from '../../utils/notifications';

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'system' | 'contact' | 'customer';
  read: boolean;
  createdAt: string;
  link?: string;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: '1',
    title: 'New Contact Form Inquiry',
    message: 'Anemoni A Akhila submitted a new contact message: "Inquiry regarding equipment bulk pricing and warranty terms."',
    type: 'contact',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(), // 25 mins ago
  },
  {
    id: '2',
    title: 'Super Admin Login',
    message: 'Super Admin (admin@costplus100.com.au) successfully logged in from desktop session.',
    type: 'system',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
  },
  {
    id: '3',
    title: 'New Online Order Received',
    message: 'Order #ORD-98421 placed by James Wilson for $1,250.00 AUD (2 items).',
    type: 'order',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
  },
  {
    id: '4',
    title: 'New Customer Registered',
    message: 'New wholesale buyer account registered: Commercial Kitchens Pty Ltd (B2B Tier 2).',
    type: 'customer',
    read: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: '5',
    title: 'Uropa API Price Sync',
    message: 'Background Uropa Price Sync completed successfully. 42 product costs updated.',
    type: 'system',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: '6',
    title: 'Quotation Request #QT-409',
    message: 'Restaurant Group Australia requested quote for 5x Heavy Duty Commercial Fryers.',
    type: 'order',
    read: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  }
];

export function NotificationsManager() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('admin_notifications_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_NOTIFICATIONS;
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'order' | 'system' | 'contact'>('all');

  useEffect(() => {
    localStorage.setItem('admin_notifications_list', JSON.stringify(notifications));
  }, [notifications]);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    notify.success('Notification marked as read');
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notify.success('All notifications marked as read');
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    notify.success('Notification deleted');
  };

  const clearReadNotifications = () => {
    setNotifications(prev => prev.filter(n => !n.read));
    notify.success('Cleared all read notifications');
  };

  const filteredNotifications = notifications.filter(item => {
    if (activeFilter === 'unread') return !item.read;
    if (activeFilter === 'order') return item.type === 'order';
    if (activeFilter === 'system') return item.type === 'system';
    if (activeFilter === 'contact') return item.type === 'contact' || item.type === 'customer';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getTypeIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="size-4 text-emerald-600" />;
      case 'customer':
        return <User className="size-4 text-blue-600" />;
      case 'contact':
        return <Mail className="size-4 text-purple-600" />;
      case 'system':
      default:
        return <ShieldAlert className="size-4 text-amber-600" />;
    }
  };

  const getTypeBadge = (type: NotificationItem['type']) => {
    switch (type) {
      case 'order':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">ORDER</span>;
      case 'customer':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">CUSTOMER</span>;
      case 'contact':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">INQUIRY</span>;
      case 'system':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">SYSTEM</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Bell className="size-6 text-[#E31837]" />
            System Notifications Center
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage live system activity logs, new customer registrations, and order alerts
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            className="h-9 px-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="size-3.5" />
            Mark All Read ({unreadCount})
          </button>
          <button
            onClick={clearReadNotifications}
            className="h-9 px-3.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-red-700 rounded-xl font-bold text-xs border border-slate-200 cursor-pointer transition-all"
          >
            Clear Read
          </button>
        </div>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Notifications Activity Feed:</strong> Unread notifications appear automatically in top dashboard header bell popover.
        </div>
      </div>

      {/* Filter Tabs Toolbar */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
          {[
            { id: 'all', label: 'All Notifications', count: notifications.length },
            { id: 'unread', label: 'Unread', count: unreadCount },
            { id: 'order', label: 'Orders & Quotes', count: notifications.filter(n => n.type === 'order').length },
            { id: 'contact', label: 'Customer Inquiries', count: notifications.filter(n => n.type === 'contact' || n.type === 'customer').length },
            { id: 'system', label: 'System Logs', count: notifications.filter(n => n.type === 'system').length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id as any)}
              className={`h-8 px-3 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeFilter === tab.id
                  ? 'bg-[#E31837] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Notifications Feed Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <Bell className="size-12 mx-auto text-slate-300" />
            <p className="text-base font-black text-slate-800">No Notifications Found</p>
            <p className="text-xs text-slate-500">There are no notification entries matching your active filter criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredNotifications.map(item => (
              <div
                key={item.id}
                className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                  !item.read ? 'bg-red-50/20' : 'hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-slate-100 rounded-xl shrink-0 mt-0.5">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-sm">{item.title}</h3>
                      {getTypeBadge(item.type)}
                      {!item.read && (
                        <span className="size-2 rounded-full bg-[#E31837] inline-block" title="Unread" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-3xl">
                      {item.message}
                    </p>
                    <span className="text-[10px] text-slate-400 font-bold block pt-1">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                  {!item.read && (
                    <button
                      onClick={() => markAsRead(item.id)}
                      className="h-8 px-3 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 rounded-lg font-bold text-xs border border-slate-200 transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Check className="size-3.5" />
                      <span>Read</span>
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    title="Delete Notification"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default NotificationsManager;
