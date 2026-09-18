import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Badge } from '../../components/ui/badge';
import {
  User,
  Package,
  LogOut,
  Key,
  Mail,
  Phone,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  RefreshCw,
  PackageX,
  Lock,
  Eye,
  EyeOff,
  X,
  ShieldCheck
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface Customer {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  phone: string;
}

const ORDERS_PER_PAGE = 10;

export function CustomerDashboard() {
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [customerDiscountPercentage, setCustomerDiscountPercentage] = useState(0);
  const [canBuyAtCostPrice, setCanBuyAtCostPrice] = useState(false);

  // Modal State for Change Password
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    // Check if customer is logged in
    const customerData = localStorage.getItem('customer');

    if (!customerData) {
      navigate('/customer/login');
      return;
    }

    try {
      const parsedCustomer = JSON.parse(customerData);
      setCustomer(parsedCustomer);

      // Check customer pricing access
      const costPriceAccess = parsedCustomer?.can_see_cost_price || false;
      const discountPercentage = parsedCustomer?.discount_percentage || 0;

      setCanBuyAtCostPrice(costPriceAccess);
      if (!costPriceAccess && discountPercentage > 0) {
        setCustomerDiscountPercentage(discountPercentage);
      }

      // Fetch customer orders
      fetchOrders(parsedCustomer.id);
    } catch (error) {
      console.error('Error parsing customer data:', error);
      navigate('/customer/login');
    }
  }, [navigate]);

  const fetchOrders = async (customerId: string) => {
    try {
      const response = await fetch(`${API_URL}/payment/customer/${customerId}/orders`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customer');
    navigate('/customer/login');
  };

  const handleRefresh = async () => {
    if (!customer) return;
    
    setRefreshing(true);
    await fetchOrders(customer.id);
    setRefreshing(false);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      setPasswordLoading(false);
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password');
      setPasswordLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/payment/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          customerId: customer.id,
          currentPassword,
          newPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || 'Failed to change password');
        setPasswordLoading(false);
        return;
      }

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setPasswordSuccess('');
      }, 1500);
    } catch (error) {
      console.error('Change password error:', error);
      setPasswordError('Failed to change password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'shipped':
      case 'ready_to_ship':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'cancelled':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'refund_requested':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'refunded':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'delivered':
        return <CheckCircle2 className="size-3.5" />;
      case 'shipped':
      case 'ready_to_ship':
        return <Truck className="size-3.5" />;
      case 'processing':
        return <Package className="size-3.5" />;
      case 'pending':
        return <Clock className="size-3.5" />;
      case 'cancelled':
        return <XCircle className="size-3.5" />;
      case 'refund_requested':
      case 'refunded':
        return <PackageX className="size-3.5" />;
      default:
        return <Package className="size-3.5" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'ready_to_ship':
        return 'Ready to Ship';
      case 'refund_requested':
        return 'Refund Requested';
      default:
        return status?.toUpperCase();
    }
  };

  if (!customer) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50/80 font-sans pb-16 relative">
      <div className="container mx-auto px-4 w-full relative z-10 pt-8 md:pt-10 max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-[32px] font-black text-[#0f172a] mb-1.5 tracking-tight">
              Welcome back, <span className="text-[#E31837]">{customer.firstName || customer.first_name || customer.name?.split(' ')[0] || customer.email}</span>!
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Manage your orders and account settings
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/products">
              <button className="bg-white hover:bg-slate-50 text-slate-700 font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs hover:shadow-sm border border-slate-200 flex items-center justify-center gap-2 text-xs sm:text-sm">
                <ShoppingBag className="w-4 h-4 text-[#E31837]" />
                Continue Shopping
              </button>
            </Link>
            <button onClick={handleLogout} className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs border border-rose-100 flex items-center justify-center gap-2 text-xs sm:text-sm">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            
            {/* 1. Account Details Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-md hover:shadow-lg hover:border-slate-300 transition-all relative">
              <h2 className="text-lg font-black text-[#0f172a] mb-5 flex items-center gap-2">
                <User className="w-5 h-5 text-[#E31837]" /> Account Details
              </h2>
              
              <div className="space-y-4 text-xs sm:text-sm">
                {/* User Name Row */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                    <User className="w-4 h-4 text-[#E31837]" />
                  </div>
                  <div>
                    <span className="font-extrabold text-[#0f172a] text-sm block">
                      {customer.firstName || customer.first_name || customer.name || ''} {customer.lastName || customer.last_name || ''}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">Verified Customer</span>
                  </div>
                </div>

                {/* Email Row */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                    <Mail className="w-4 h-4 text-[#E31837]" />
                  </div>
                  <span className="text-slate-600 font-medium break-all">{customer.email}</span>
                </div>

                {/* Phone Row */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                    <Phone className="w-4 h-4 text-[#E31837]" />
                  </div>
                  <span className="text-slate-600 font-medium">{customer.phone || 'Not provided'}</span>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100 my-5"></div>

              {/* Open Change Password Modal */}
              <button
                onClick={() => {
                  setPasswordError('');
                  setPasswordSuccess('');
                  setIsChangePasswordOpen(true);
                }}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-[#E31837] font-bold py-2.5 rounded-xl transition-all border border-slate-200 flex items-center justify-center gap-2 text-xs sm:text-sm shadow-xs"
              >
                <Key className="w-4 h-4 text-[#E31837]" />
                Change Password
              </button>
            </div>

            {/* 2. Order Statistics Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-md hover:shadow-lg hover:border-slate-300 transition-all relative">
              <h2 className="text-lg font-black text-[#0f172a] mb-5 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#E31837]" /> Order Statistics
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs sm:text-sm font-medium text-slate-600">Total Orders</span>
                  <Badge variant="outline" className="bg-white font-bold">{orders.length}</Badge>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs sm:text-sm font-medium text-slate-600">Completed</span>
                  <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none font-bold">
                    {orders.filter(o => o.payment_status === 'completed' || o.order_status === 'completed' || o.order_status === 'delivered').length}
                  </Badge>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs sm:text-sm font-medium text-slate-600">Processing</span>
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-none font-bold">
                    {orders.filter(o => o.order_status === 'processing').length}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* 3. My Orders Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200/90 shadow-md hover:shadow-lg hover:border-slate-300 transition-all relative h-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-[#0f172a]">My Orders</h2>
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="text-[#E31837] hover:bg-red-50 p-2 rounded-xl transition-colors flex items-center gap-1.5 text-xs font-bold"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>

              {loading ? (
                <div className="text-center py-16">
                  <Loader2 className="w-10 h-10 animate-spin mx-auto text-[#E31837] mb-4" />
                  <p className="text-slate-500 font-medium text-sm">Loading your orders...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16">
                  <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-5 border border-slate-100">
                    <ShoppingBag className="w-10 h-10 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-extrabold text-[#0f172a] mb-2">No Orders Yet</h3>
                  <p className="text-slate-500 mb-6 text-sm max-w-sm mx-auto">
                    You haven't placed any orders yet. Start shopping to see your orders here.
                  </p>
                  <Link to="/products">
                    <button className="bg-[#E31837] hover:bg-[#c41530] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md">
                      Browse Products
                    </button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-5">
                  {(() => {
                    const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE);
                    const paginatedOrders = orders.slice(
                      (currentPage - 1) * ORDERS_PER_PAGE,
                      currentPage * ORDERS_PER_PAGE
                    );
                    const goToPage = (page: number) => {
                      if (page >= 1 && page <= totalPages) setCurrentPage(page);
                    };
                    return (
                      <>
                        {paginatedOrders.map((order) => (
                          <div key={order.id} className="bg-white border border-slate-200/90 rounded-2xl p-5 hover:border-[#E31837] hover:shadow-md transition-all group">
                            
                            {/* Order Header */}
                            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                              <div>
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <h3 className="font-extrabold text-[#0f172a] text-base">Order #{order.id}</h3>
                                  <Badge className={`${getStatusColor(order.order_status || 'processing')} border text-xs font-bold`}>
                                    {getStatusIcon(order.order_status || 'processing')}
                                    <span className="ml-1">{getStatusLabel(order.order_status || 'processing')}</span>
                                  </Badge>
                                  {order.payment_status && order.payment_status === 'completed' && (
                                    <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold">
                                      <CheckCircle2 className="size-3 mr-1" /> Paid
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                                  <Clock className="size-3.5" />
                                  {new Date(order.created_at).toLocaleDateString('en-AU', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </div>
                              </div>
                              <div className="text-left md:text-right">
                                <p className="text-2xl font-black text-[#E31837]">
                                  ${order.total_amount?.toFixed(2)}
                                </p>
                                <p className="text-xs text-slate-500 font-medium bg-slate-50 inline-block px-2 py-0.5 rounded-md mt-1 border border-slate-100">
                                  {order.order_items?.length || 0} item(s)
                                </p>
                              </div>
                            </div>

                            <div className="w-full h-px bg-slate-100 my-4"></div>

                            {/* Order Items Preview */}
                            <div className="space-y-3 mb-4">
                              {order.order_items?.slice(0, 2).map((item: any, idx: number) => {
                                const itemPrice = item.product?.price || item.price || 0;
                                const itemCostPrice = item.product?.costPrice || item.costPrice || 0;
                                const itemQuantity = item.quantity || 1;

                                let displayPrice = itemPrice;

                                if (canBuyAtCostPrice && itemCostPrice > 0) {
                                  displayPrice = itemCostPrice;
                                } else if (customerDiscountPercentage > 0) {
                                  displayPrice = itemPrice * (1 - customerDiscountPercentage / 100);
                                }

                                const itemImage = item.product?.image || item.image || '';

                                return (
                                  <div key={idx} className="flex gap-3 bg-slate-50/80 hover:bg-slate-50 transition-colors p-2.5 rounded-xl border border-slate-100">
                                    <div className="w-14 h-14 rounded-lg bg-white border border-slate-200 flex-shrink-0 p-1">
                                      {itemImage ? (
                                        <img
                                          src={itemImage}
                                          alt={item.product?.name || item.productName || 'Product'}
                                          className="w-full h-full object-contain"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-md">
                                          <Package className="w-6 h-6 text-slate-300" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0 py-0.5">
                                      <p className="font-bold text-[#0f172a] line-clamp-1 text-xs sm:text-sm mb-1">{item.product?.name || item.productName || 'Product'}</p>
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-xs font-medium text-slate-500 bg-white border border-slate-200 px-1.5 py-0.5 rounded">Qty: {itemQuantity}</p>
                                        <span className="text-xs sm:text-sm font-bold text-[#E31837]">
                                          ${displayPrice.toFixed(2)} <span className="text-[11px] font-medium text-slate-400">each</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                              {order.order_items?.length > 2 && (
                                <p className="text-xs font-bold text-slate-400 text-center py-2 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                  + {order.order_items.length - 2} more item(s)
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2.5 mt-5">
                              <Link to={`/order/${order.id}`} className="flex-1">
                                <button className="w-full bg-slate-50 hover:bg-slate-100 text-[#0f172a] font-bold py-2.5 rounded-xl transition-all border border-slate-200 text-xs sm:text-sm">
                                  View Details
                                </button>
                              </Link>
                              <button
                                className="bg-[#2D3748] hover:bg-[#1a202c] text-white font-bold py-2.5 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 text-xs sm:text-sm"
                                onClick={() => alert('Order tracking coming soon!')}
                              >
                                <Truck className="w-4 h-4" />
                                <span className="hidden sm:inline">Track Order</span>
                              </button>
                            </div>
                          </div>
                        ))}
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                          <div className="flex items-center justify-center gap-2 mt-8 pt-4">
                            <button 
                              onClick={() => goToPage(currentPage - 1)} 
                              disabled={currentPage === 1}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                            >
                              Prev
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter(p => p >= currentPage - 1 && p <= currentPage + 1)
                              .map(p => (
                                <button 
                                  key={p} 
                                  onClick={() => goToPage(p)} 
                                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                                    p === currentPage 
                                    ? 'bg-[#E31837] text-white shadow-md' 
                                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  {p}
                                </button>
                              ))}
                            <button 
                              onClick={() => goToPage(currentPage + 1)} 
                              disabled={currentPage === totalPages}
                              className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-50"
                            >
                              Next
                            </button>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CHANGE PASSWORD MODAL */}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 relative animate-in zoom-in-95 duration-200 my-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsChangePasswordOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="text-center mb-6 flex flex-col items-center">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-[#E31837]" />
              </div>
              <h2 className="text-2xl font-black text-[#0f172a] tracking-tight">Change Password</h2>
              <p className="text-slate-500 text-xs sm:text-sm font-medium mt-1">
                Update your password to keep your account secure
              </p>
            </div>

            {/* Error & Success Messages */}
            {passwordError && (
              <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl mb-4 text-xs text-center font-medium shadow-xs">
                {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 p-3 rounded-xl mb-4 text-xs text-center font-medium flex items-center justify-center gap-1.5 shadow-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{passwordSuccess}</span>
              </div>
            )}

            {/* Password Form */}
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0f172a] block">Current Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-[#E31837]" />
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    required
                    placeholder="Enter current password"
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-3 pl-10 pr-10 focus:bg-white focus:outline-none focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-sm font-medium"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0f172a] block">New Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-[#E31837]" />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    placeholder="Enter new password"
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-3 pl-10 pr-10 focus:bg-white focus:outline-none focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-sm font-medium"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Minimum 6 characters</p>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#0f172a] block">Confirm New Password</label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3.5 w-4 h-4 text-[#E31837]" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="Confirm new password"
                    className="w-full bg-slate-50/80 border border-slate-200 rounded-xl py-3 pl-10 pr-10 focus:bg-white focus:outline-none focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-sm font-medium"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={passwordLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePasswordOpen(false)}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all text-sm"
                  disabled={passwordLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex-1 bg-[#E31837] hover:bg-[#c41530] text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm disabled:opacity-70"
                >
                  {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}