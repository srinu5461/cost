import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { Suspense, useState, useEffect } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { LoadingScreen } from '../../components/LoadingScreen';
import { Logo } from '../../components/Header';
import {
  LayoutDashboard,
  Package,
  LayoutGrid,
  Layout,
  FileText,
  Home,
  Settings,
  LogOut,
  Menu,
  X,
  Activity,
  Mail,
  ShoppingCart,
  Users,
  Star,
  Receipt,
  BarChart3,
  DollarSign,
  Tag,
  RotateCcw,
  Image,
  Building2,
  Percent,
  Key,
  RefreshCw,
  Bug,
  Search,
  CreditCard,
  Layers,
  BadgePercent,
  MapPin,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Award,
  Download,
  Ticket,
  Bot,
  User,
  Plus,
  Bell,
  Globe,
  MessageSquare
} from 'lucide-react';

import { ErrorBoundary } from '../../components/ErrorBoundary';
import { notify } from '../../utils/notifications';

export function AdminLayout() {
  const { isAuthenticated, logout, adminUser } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [expandedSections, setExpandedSections] = useState<string[]>(['sales', 'catalog', 'content', 'config', 'pricing']);

  const [headerNotifications, setHeaderNotifications] = useState<any[]>(() => {
    const saved = localStorage.getItem('admin_notifications_list');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) { }
    }
    return [
      {
        id: '1',
        title: 'New Contact Form Inquiry',
        message: 'Anemoni A Akhila sent: "Contact Form Inquiry"',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
      },
      {
        id: '2',
        title: 'Super Admin logged in',
        message: 'Super Admin (admin@costplus100.com.au) signed in to the admin panel.',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()
      },
      {
        id: '3',
        title: 'Super Admin logged in',
        message: 'Super Admin (admin@costplus100.com.au) signed in to the admin panel.',
        read: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
      }
    ];
  });

  useEffect(() => {
    if (notificationsOpen) {
      const saved = localStorage.getItem('admin_notifications_list');
      if (saved) {
        try {
          setHeaderNotifications(JSON.parse(saved));
        } catch (e) { }
      }
    }
  }, [notificationsOpen]);

  const unreadCount = headerNotifications.filter((n: any) => !n.read).length;

  const markAllNotificationsRead = () => {
    const updated = headerNotifications.map((n: any) => ({ ...n, read: true }));
    setHeaderNotifications(updated);
    localStorage.setItem('admin_notifications_list', JSON.stringify(updated));
    notify.success('All notifications marked as read');
  };

  const markItemReadAndNavigate = (id: string) => {
    const updated = headerNotifications.map((n: any) => n.id === id ? { ...n, read: true } : n);
    setHeaderNotifications(updated);
    localStorage.setItem('admin_notifications_list', JSON.stringify(updated));
    setNotificationsOpen(false);
    navigate('/admin/notifications');
  };

  useEffect(() => {
    const hasToken = !!localStorage.getItem('auth_token');
    if (!isAuthenticated && !hasToken) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const currentPath = location.pathname;
    const activeSection = menuSections.find(sec =>
      sec.items.some(item => item.path === currentPath)
    );

    if (activeSection && !expandedSections.includes(activeSection.id)) {
      setExpandedSections(prev => [...prev, activeSection.id]);
    }

    const timer = setTimeout(() => {
      const activeEl = document.querySelector('[data-sidebar-active="true"]');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const hasToken = !!localStorage.getItem('auth_token');
  if (!isAuthenticated && !hasToken) {
    return null;
  }

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const toggleSection = (section: string) => {
    if (sidebarCollapsed) {
      setSidebarCollapsed(false);
      setExpandedSections(prev => prev.includes(section) ? prev : [...prev, section]);
      return;
    }
    setExpandedSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  const menuSections = [
    {
      id: 'main',
      label: 'MAIN',
      items: [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
        { icon: Bell, label: 'Notifications', path: '/admin/notifications' },
      ]
    },
    {
      id: 'sales',
      label: 'SALES & ORDERS',
      items: [
        { icon: ShoppingCart, label: 'Orders', path: '/admin/orders' },
        { icon: FileText, label: 'Quotations', path: '/admin/quotations' },
        { icon: Receipt, label: 'Invoices', path: '/admin/invoices' },
        { icon: RotateCcw, label: 'Returns', path: '/admin/returns-management' },
        { icon: Users, label: 'Customers', path: '/admin/customers' },
        { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
      ]
    },
    {
      id: 'catalog',
      label: 'CATALOG',
      items: [
        { icon: Package, label: 'Products', path: '/admin/products' },
        { icon: Package, label: 'Products (Virtualized)', path: '/admin/products-virtualized' },
        { icon: LayoutGrid, label: 'Categories', path: '/admin/categories' },
        { icon: Star, label: 'Featured Products', path: '/admin/featured-products' },
        { icon: MessageSquare, label: 'Reviews', path: '/admin/reviews' },
        { icon: BadgePercent, label: 'Promotional Pricing', path: '/admin/promotional-pricing' },
        { icon: Layers, label: 'Sections Manager', path: '/admin/sections-manager' },
      ]
    },
    {
      id: 'content',
      label: 'CONTENT & DESIGN',
      items: [
        { icon: Home, label: 'Homepage', path: '/admin/homepage' },
        { icon: Image, label: 'Banners', path: '/admin/banners' },
        { icon: Layout, label: 'Header', path: '/admin/header' },
        { icon: FileText, label: 'Footer', path: '/admin/footer' },
        { icon: FileText, label: 'About Us', path: '/admin/about' },
        { icon: Award, label: 'Menu Brands', path: '/admin/menu-brands' },
        { icon: FileText, label: 'Legal Pages', path: '/admin/legal-pages' },
        { icon: Search, label: 'SEO Manager', path: '/admin/seo-manager' },
      ]
    },
    {
      id: 'config',
      label: 'CONFIGURATION',
      items: [
        { icon: Building2, label: 'Company Info', path: '/admin/company-settings' },
        { icon: CreditCard, label: 'Payment Settings', path: '/admin/payment-settings' },
        { icon: Ticket, label: 'Vouchers', path: '/admin/vouchers' },
        { icon: Mail, label: 'Email Settings', path: '/admin/email-settings' },
        { icon: MapPin, label: 'Pickup Locations', path: '/admin/pickup-locations' },
        { icon: Bot, label: 'AI Chatbot', path: '/admin/ai-chatbot' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },
      ]
    },
    {
      id: 'pricing',
      label: 'PRICING & INTEGRATION',
      items: [
        { icon: DollarSign, label: 'Pricing Tiers', path: '/admin/pricing-tiers' },
        { icon: Percent, label: 'Profit Margins', path: '/admin/profit-margin-settings' },
        { icon: Key, label: 'Uropa API Token', path: '/admin/uropa-token-auth' },
        { icon: RefreshCw, label: 'Uropa Price Sync', path: '/admin/uropa-price-sync' },
        { icon: FileText, label: 'Description Sync', path: '/admin/description-sync' },
        { icon: Download, label: 'Image Scraper', path: '/admin/image-scraper' },
        { icon: Tag, label: 'Specials', path: '/admin/specials' },
        { icon: Bug, label: 'Price Debug', path: '/admin/price-debug' },
        { icon: Activity, label: 'Diagnostics', path: '/admin/diagnostics' },
      ]
    },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50/70 font-sans relative">
      {/* Invisible Click Outside Backdrop Overlay for Popovers */}
      {(notificationsOpen || profileOpen) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setNotificationsOpen(false);
            setProfileOpen(false);
          }}
        />
      )}



      <div className="flex-1 flex overflow-hidden w-full relative">
        {/* Desktop Fixed Left Sidebar */}
        <aside
          className={`hidden lg:flex flex-col bg-white border-r border-slate-200/90 transition-all duration-300 ease-in-out h-full z-30 shrink-0 select-none ${sidebarCollapsed ? 'w-20' : 'w-72'
            }`}
        >
          {/* Sidebar Top Brand Header with Official Logo */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-2 shrink-0">
            {!sidebarCollapsed ? (
              <Link to="/admin" className="flex items-center gap-2 overflow-hidden py-1">
                <Logo className="h-8 sm:h-9 w-auto shrink-0" />
              </Link>
            ) : (
              <div className="mx-auto">
                <svg className="h-9 w-9 shrink-0" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="40" cy="40" r="34" fill="#2D3748" />
                  <text x="40" y="52" fontSize="34" fontWeight="900" fill="white" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="-2">C+</text>
                  <rect x="52" y="16" width="24" height="18" rx="9" fill="#E31837" />
                  <text x="64" y="29" fontSize="11" fontWeight="900" fill="white" textAnchor="middle" fontFamily="Arial, Helvetica, sans-serif">100</text>
                </svg>
              </div>
            )}

            {/* Collapse Arrow Toggle Button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`size-7 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-[#E31837] flex items-center justify-center transition-all border border-slate-200/80 cursor-pointer shrink-0 ${sidebarCollapsed ? 'mx-auto' : ''
                }`}
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="size-4" />
              ) : (
                <ChevronLeft className="size-4" />
              )}
            </button>
          </div>

          {/* Sidebar Navigation Items (Ultra-thin custom scrollbar, overflow-visible when collapsed so tooltips don't get cut off) */}
          <div
            className={`flex-1 px-3 py-4 space-y-4 ${sidebarCollapsed ? 'overflow-visible' : 'overflow-y-auto'}`}
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
          >
            {menuSections.map((section) => {
              const isExpanded = expandedSections.includes(section.id);
              const hasActiveItem = section.items.some(item => location.pathname === item.path);

              return (
                <div key={section.id} className="space-y-1">
                  {/* Section Title Header */}
                  {!sidebarCollapsed && (
                    section.id === 'main' ? (
                      <div className={`text-xs font-extrabold uppercase tracking-wider px-3 pb-1 pt-2.5 ${hasActiveItem ? 'text-[#E31837]' : 'text-slate-900'
                        }`}>
                        {section.label}
                      </div>
                    ) : (
                      <button
                        onClick={() => toggleSection(section.id)}
                        className={`w-full flex items-center justify-between px-3 pb-1 pt-2.5 text-xs font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${hasActiveItem ? 'text-[#E31837]' : 'text-slate-900 hover:text-[#E31837]'
                          }`}
                      >
                        <span>{section.label}</span>
                        {isExpanded ? (
                          <ChevronDown className={`size-3.5 ${hasActiveItem ? 'text-[#E31837]' : 'text-slate-700'}`} />
                        ) : (
                          <ChevronRight className={`size-3.5 ${hasActiveItem ? 'text-[#E31837]' : 'text-slate-700'}`} />
                        )}
                      </button>
                    )
                  )}

                  {/* Section Menu Items */}
                  {(sidebarCollapsed || section.id === 'main' || isExpanded) && (
                    <div className={!sidebarCollapsed && section.id !== 'main' ? 'space-y-1 pl-1' : 'space-y-1'}>
                      {section.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        const Icon = item.icon;

                        if (sidebarCollapsed) {
                          // Collapsed Sidebar View: Icon Button with Unclipped Floating Tooltip
                          return (
                            <div key={item.path} className="relative group flex justify-center">
                              <Link
                                to={item.path}
                                className={`size-11 rounded-xl flex items-center justify-center transition-all cursor-pointer ${isActive
                                    ? 'bg-[#FFF0F2] text-[#E31837] font-extrabold shadow-xs border border-red-100'
                                    : 'text-slate-600 hover:bg-rose-50/70 hover:text-[#E31837]'
                                  }`}
                              >
                                <Icon className="size-5" />
                              </Link>

                              {/* Floating Tooltip outside sidebar (z-50, shadow-2xl, border) */}
                              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-extrabold rounded-lg shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 z-[100] border border-slate-700">
                                {item.label}
                                <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 border-[6px] border-transparent border-r-slate-900" />
                              </div>
                            </div>
                          );
                        }

                        // Expanded Sidebar View: Regular Clean Medium Weight Font
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            data-sidebar-active={isActive ? 'true' : undefined}
                            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all text-xs sm:text-sm cursor-pointer relative overflow-hidden ${isActive
                                ? 'bg-[#FFF0F2] text-[#E31837] font-extrabold shadow-xs border border-red-100/70 pl-4'
                                : 'text-slate-700 hover:bg-rose-50/60 hover:text-[#E31837] font-semibold'
                              }`}
                          >
                            {isActive && (
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#E31837] rounded-r-full" />
                            )}
                            <Icon className={`size-4.5 shrink-0 ${isActive ? 'text-[#E31837]' : 'text-slate-400 group-hover:text-[#E31837]'}`} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Clean Bottom Sidebar Profile Badge (View Site and Logout removed as requested) */}
          <div className="p-3.5 border-t border-slate-100 bg-slate-50/40 shrink-0">
            <div className={`flex items-center gap-3 ${sidebarCollapsed ? 'justify-center' : 'px-1'}`}>
              <div className="size-9 rounded-full bg-[#E31837] text-white flex items-center justify-center font-black text-xs shadow-xs shrink-0 ring-2 ring-red-100">
                {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
              </div>

              {!sidebarCollapsed && (
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-extrabold text-slate-900 text-xs truncate leading-tight">
                    {adminUser?.name || 'CostPlus Admin'}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 truncate">
                    {adminUser?.email || 'admin@costplus100.com.au'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex" onClick={() => setMobileMenuOpen(false)}>
            <aside
              className="w-72 bg-white h-full overflow-y-auto shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <Link to="/admin" className="flex items-center gap-2">
                  <Logo className="h-8 w-auto" />
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 p-3 space-y-4 overflow-y-auto">
                {menuSections.map((section) => (
                  <div key={section.id} className="space-y-1">
                    <div className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 px-3 pb-1">
                      {section.label}
                    </div>
                    {section.items.map((item) => {
                      const isActive = location.pathname === item.path;
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm relative overflow-hidden ${isActive
                              ? 'bg-[#FFF0F2] text-[#E31837] font-extrabold pl-4'
                              : 'text-slate-700 hover:bg-rose-50 hover:text-[#E31837] font-semibold'
                            }`}
                        >
                          {isActive && (
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-[#E31837] rounded-r-full" />
                          )}
                          <Icon className="size-4.5" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>

              <div className="p-4 border-t border-slate-100 space-y-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs"
                >
                  <LogOut className="size-4" />
                  <span>Log out</span>
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Right Main Content Panel */}
        <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0 bg-slate-50/70 relative">
          {/* Top Bar Header inside Right Main Panel */}
          <header className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3 shrink-0 flex items-center justify-between gap-3 shadow-2xs z-40 relative">
            {/* Left: Mobile Toggle & Desktop Search Bar */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl bg-slate-100 text-slate-700 hover:text-[#E31837] transition-colors cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
              </button>

              {/* Desktop Search Bar */}
              <div className="hidden lg:flex relative flex-1 max-w-[280px]">
                <Search className="size-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  className="w-full h-10 pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 shadow-xs focus:outline-none focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all"
                />
              </div>
            </div>

            {/* Middle: Brand Logo (Visible on Mobile < 1024px) */}
            <div className="lg:hidden flex-1 flex justify-center">
              <Link to="/admin" className="flex items-center gap-2">
                <Logo className="h-7 sm:h-8 w-auto" />
              </Link>
            </div>

            {/* Right: Quick Action Controls (+, Globe, Bell, Divider, Avatar) */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 relative justify-end">
              {/* Quick Add (+) Button (Desktop lg+) */}
              <button
                onClick={() => navigate('/admin/products')}
                className="hidden lg:flex size-9 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-[#E31837] border border-slate-200 items-center justify-center transition-all cursor-pointer"
                title="Quick Add Product"
              >
                <Plus className="size-4.5" />
              </button>

              {/* Globe Icon Button (Desktop lg+) */}
              <Link
                to="/"
                className="hidden lg:flex size-9 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-[#E31837] border border-slate-200 items-center justify-center transition-all cursor-pointer"
                title="View Live Store Page"
              >
                <Globe className="size-4.5" />
              </Link>

              {/* Notification Bell with Red Badge & Popover Trigger (Desktop lg+) */}
              <div className="hidden lg:block relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setNotificationsOpen(!notificationsOpen);
                    setProfileOpen(false);
                  }}
                  className="size-9 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-[#E31837] border border-slate-200 flex items-center justify-center transition-all relative cursor-pointer"
                  title="Notifications"
                >
                  <Bell className="size-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 size-2 bg-[#E31837] rounded-full ring-2 ring-white" />
                  )}
                </button>

                {/* Notifications Popover Modal */}
                {notificationsOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-4 font-sans animate-in fade-in zoom-in-95 duration-150 text-left"
                  >
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">Notifications</h3>
                        <p className="text-xs text-slate-400 font-semibold">{unreadCount} unread</p>
                      </div>
                      <button
                        onClick={markAllNotificationsRead}
                        disabled={unreadCount === 0}
                        className="text-xs font-extrabold text-[#E31837] hover:underline cursor-pointer disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                      >
                        Mark all read
                      </button>
                    </div>

                    <div
                      className="space-y-2.5 max-h-80 overflow-y-auto pr-1 overscroll-contain"
                      style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}
                    >
                      {headerNotifications.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6 font-semibold">No notifications</p>
                      ) : (
                        headerNotifications.slice(0, 5).map((item: any) => (
                          <div
                            key={item.id}
                            onClick={() => markItemReadAndNavigate(item.id)}
                            className={`p-3 rounded-lg border transition-all cursor-pointer ${!item.read
                                ? 'bg-rose-50/50 border-rose-100/80 hover:bg-rose-100/60'
                                : 'bg-slate-50/50 border-slate-100 hover:bg-slate-100/70'
                              }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-extrabold text-slate-900 text-xs">{item.title}</h4>
                              {!item.read && <span className="size-2 bg-[#E31837] rounded-full shrink-0" />}
                            </div>
                            <p className="text-xs text-slate-600 font-medium leading-snug line-clamp-2">
                              {item.message}
                            </p>
                            <span className="text-[10px] text-slate-400 font-bold block mt-1.5">
                              {item.createdAt ? new Date(item.createdAt).toLocaleString() : ''}
                            </span>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate('/admin/notifications');
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#E31837] hover:bg-[#C41230] text-white font-extrabold text-xs transition-all shadow-xs text-center flex items-center justify-center cursor-pointer"
                      >
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Vertical Divider Line */}
              <div className="h-6 w-px bg-slate-200 my-auto" />

              {/* Admin Avatar Circle & Profile Dropdown Trigger */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileOpen(!profileOpen);
                    setNotificationsOpen(false);
                  }}
                  className="size-9 rounded-full bg-[#E31837] text-white flex items-center justify-center font-extrabold text-xs shadow-xs ring-2 ring-red-100/90 hover:scale-105 transition-all cursor-pointer"
                  title="Profile Menu"
                >
                  {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
                </button>

                {/* Profile Dropdown Menu */}
                {profileOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-12 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 p-3 font-sans animate-in fade-in zoom-in-95 duration-150 text-left"
                  >
                    <div className="p-2.5 bg-slate-50 rounded-xl mb-2 flex items-center gap-3 border border-slate-100">
                      <div className="size-10 rounded-full bg-[#E31837] text-white flex items-center justify-center font-black text-sm shadow-xs shrink-0">
                        {adminUser?.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-slate-900 text-xs truncate">
                          {adminUser?.name || 'CostPlus Admin'}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate font-medium">
                          {adminUser?.email || 'admin@costplus100.com.au'}
                        </p>
                        <span className="inline-block px-1.5 py-0.5 mt-1 bg-red-100 text-[#E31837] rounded text-[9px] font-black">
                          SUPER ADMIN
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate('/admin/notifications');
                        }}
                        className="flex items-center justify-between w-full px-3 py-2 rounded-xl text-slate-700 hover:bg-rose-50 hover:text-[#E31837] font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Bell className="size-4 text-slate-400" />
                          <span>Notifications</span>
                        </div>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-[#E31837] text-white">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate('/admin/company-settings');
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-slate-700 hover:bg-rose-50 hover:text-[#E31837] font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <User className="size-4 text-slate-400" />
                        <span>My Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          navigate('/admin/settings');
                        }}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-slate-700 hover:bg-rose-50 hover:text-[#E31837] font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Settings className="size-4 text-slate-400" />
                        <span>Settings</span>
                      </button>
                      <Link
                        to="/"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-slate-700 hover:bg-rose-50 hover:text-[#E31837] font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Globe className="size-4 text-slate-400" />
                        <span>View Live Store</span>
                      </Link>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-100">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-[#E31837] font-extrabold text-xs transition-colors cursor-pointer"
                      >
                        <LogOut className="size-4 text-[#E31837]" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main Scrollable Content Canvas */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar flex flex-col justify-between">
            <div className="w-full flex-1">
              <ErrorBoundary>
                <Suspense fallback={<LoadingScreen />}>
                  <Outlet />
                </Suspense>
              </ErrorBoundary>
            </div>

            {/* Admin Dashboard Footer */}
            <footer className="mt-8 py-4 border-t border-slate-200/80 text-xs text-slate-500 font-medium text-center w-full shrink-0">
              <p className="text-slate-500 font-medium text-xs">
                © {new Date().getFullYear()} <span className="font-extrabold text-slate-800">CostPlus 100</span>. All rights reserved.
              </p>
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}