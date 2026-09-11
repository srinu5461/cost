import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  User,
  ShoppingBag,
  ShoppingCart,
  Phone,
  Mail,
  Clock,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Package,
  Tag,
  Home,
  BookOpen,
  FileText,
  HelpCircle,
  Truck,
  Award,
  ArrowLeft,
  Sparkles,
  LogIn,
  RotateCcw,
  ShieldAlert
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { QuoteModal } from '../components/QuoteModal';

export function Profile() {
  const navigate = useNavigate();
  const { getCartCount } = useCart();
  const cartCount = getCartCount();

  const [customer, setCustomer] = useState<any>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  useEffect(() => {
    // Load customer profile from localStorage
    try {
      const storedCustomer = localStorage.getItem('customer');
      if (storedCustomer) {
        setCustomer(JSON.parse(storedCustomer));
      }
    } catch (e) {
      console.error('Failed to load customer profile:', e);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('customer');
    setCustomer(null);
    navigate('/login');
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return `${first}${last}` || 'U';
  };

  return (
    <div className="min-h-screen bg-slate-100/80 pb-16 text-slate-800">
      
      <div className="max-w-md mx-auto px-3.5 pt-4 space-y-4">
        
        {/* ── PROFILE BANNER CARD ── */}
        {customer ? (
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl shadow-lg border border-slate-700 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E31837]/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center gap-4">
              <div className="size-14 rounded-full bg-gradient-to-tr from-[#E31837] to-rose-400 text-white font-black text-xl flex items-center justify-center shadow-md border-2 border-white/20 shrink-0">
                {getInitials(customer.firstName, customer.lastName)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-base font-extrabold text-white truncate">
                    {customer.firstName} {customer.lastName}
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full shrink-0">
                    Member
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate font-medium">{customer.email}</p>
                {customer.phone && (
                  <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{customer.phone}</p>
                )}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-700/80">
              <Link
                to="/customer/dashboard"
                className="w-full bg-[#E31837] hover:bg-[#C8102E] text-white text-xs font-extrabold py-2.5 px-4 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>View Dashboard</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/90 text-center space-y-3">
            <div className="size-14 rounded-full bg-rose-50 border border-rose-100 text-[#E31837] flex items-center justify-center mx-auto shadow-2xs">
              <User className="size-7" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Welcome to CostPlus100</h2>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                Log in or register to track your orders, view quotes, and manage your trade account.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <Link
                to="/customer/login"
                className="bg-[#E31837] hover:bg-[#C8102E] text-white font-extrabold text-xs py-2.5 px-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
              >
                <LogIn className="size-3.5" />
                <span>Log In</span>
              </Link>
              <Link
                to="/customer/login"
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-xs py-2.5 px-3 rounded-xl border border-slate-200/80 transition-all flex items-center justify-center gap-1.5"
              >
                <User className="size-3.5" />
                <span>Register</span>
              </Link>
            </div>
          </div>
        )}

        {/* ── 2x2 APP QUICK TILES ── */}
        <div className="grid grid-cols-2 gap-2.5">
          <Link
            to={customer ? "/customer/dashboard" : "/customer/login"}
            className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-2 group"
          >
            <div className="size-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
              <Package className="size-5" />
            </div>
            <div>
              <span className="block text-xs font-black text-slate-900">My Orders</span>
              <span className="text-[10px] text-slate-500 font-medium">Track status &amp; invoices</span>
            </div>
          </Link>

          <Link
            to="/cart"
            className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-2 group"
          >
            <div className="size-9 rounded-xl bg-rose-50 text-[#E31837] flex items-center justify-center border border-rose-100 group-hover:scale-105 transition-transform relative">
              <ShoppingCart className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#E31837] text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </div>
            <div>
              <span className="block text-xs font-black text-slate-900">Shopping Cart</span>
              <span className="text-[10px] text-slate-500 font-medium">{cartCount} items in cart</span>
            </div>
          </Link>

          <button
            onClick={() => setShowQuoteModal(true)}
            className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-2 text-left group cursor-pointer"
          >
            <div className="size-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
              <Phone className="size-5" />
            </div>
            <div>
              <span className="block text-xs font-black text-slate-900">Get Custom Quote</span>
              <span className="text-[10px] text-slate-500 font-medium">Freight &amp; bulk pricing</span>
            </div>
          </button>

          <Link
            to="/products?multibuy=true"
            className="bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-2 group"
          >
            <div className="size-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
              <Tag className="size-5" />
            </div>
            <div>
              <span className="block text-xs font-black text-slate-900">MultiBuy Deals</span>
              <span className="text-[10px] text-slate-500 font-medium">Wholesale bulk discounts</span>
            </div>
          </Link>
        </div>

        {/* ── APP SECTION 1: CATALOGUE & BRANDS ── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Commercial Catalogue &amp; Brands
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            <Link
              to="/products"
              className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-rose-50 text-[#E31837] flex items-center justify-center shrink-0">
                  <BookOpen className="size-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  Full Equipment Catalogue
                </span>
              </div>
              <ChevronRight className="size-4 text-slate-400" />
            </Link>

            <Link
              to="/products?multibuy=true"
              className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Tag className="size-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  Multi-Buy Wholesale Deals
                </span>
              </div>
              <ChevronRight className="size-4 text-slate-400" />
            </Link>

            <Link
              to="/brands"
              className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Award className="size-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  Browse All Brands
                </span>
              </div>
              <ChevronRight className="size-4 text-slate-400" />
            </Link>

            {/* Popular Brand Direct Links */}
            <Link
              to="/brands/polar-refrigeration?sort=priceHigh"
              className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="size-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Polar Refrigeration</span>
              </div>
              <ChevronRight className="size-4 text-slate-400" />
            </Link>

            <Link
              to="/brands/thor-cooking?sort=priceHigh"
              className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="size-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Thor Commercial Cooking</span>
              </div>
              <ChevronRight className="size-4 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* ── APP SECTION 2: CUSTOMER SUPPORT & INFORMATION ── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Customer Support &amp; Information
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            <Link
              to="/delivery-information"
              className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Truck className="size-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Delivery Information &amp; Rates</span>
              </div>
              <ChevronRight className="size-4 text-slate-400" />
            </Link>

            <Link
              to="/contact"
              className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Mail className="size-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Contact Us</span>
              </div>
              <ChevronRight className="size-4 text-slate-400" />
            </Link>

            <Link
              to="/faq"
              className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <HelpCircle className="size-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Frequently Asked Questions</span>
              </div>
              <ChevronRight className="size-4 text-slate-400" />
            </Link>

            <Link
              to="/about"
              className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <FileText className="size-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">About CostPlus100</span>
              </div>
              <ChevronRight className="size-4 text-slate-400" />
            </Link>

            <Link
              to="/request-return"
              className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <RotateCcw className="size-4" />
                </div>
                <span className="text-xs font-bold text-slate-800">Request Product Return</span>
              </div>
              <ChevronRight className="size-4 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* ── APP SECTION 3: LEGAL POLICIES ── */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
              Legal &amp; Policies
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
            <Link to="/terms-and-conditions" className="flex items-center justify-between p-3.5 hover:bg-slate-50">
              <span>Terms &amp; Conditions</span>
              <ChevronRight className="size-4 text-slate-400" />
            </Link>
            <Link to="/privacy-policy" className="flex items-center justify-between p-3.5 hover:bg-slate-50">
              <span>Privacy Policy</span>
              <ChevronRight className="size-4 text-slate-400" />
            </Link>
            <Link to="/return-refund-policy" className="flex items-center justify-between p-3.5 hover:bg-slate-50">
              <span>Return &amp; Refund Policy</span>
              <ChevronRight className="size-4 text-slate-400" />
            </Link>
          </div>
        </div>

        {/* ── DIRECT CONTACT SUPPORT CARD ── */}
        <div className="bg-slate-900 text-white p-4.5 rounded-2xl shadow-md border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-rose-400 text-xs font-extrabold uppercase tracking-wider">
            <Sparkles className="size-4" />
            <span>Need Assistance?</span>
          </div>
          
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            Our commercial catering equipment specialists are available to assist with custom freight, bulk quotes, and product specifications.
          </p>

          <div className="space-y-2 pt-1">
            <a
              href="tel:1800151624"
              className="flex items-center gap-3 p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white text-xs font-bold transition-colors"
            >
              <Phone className="size-4 text-[#E31837]" />
              <span>Call Toll-Free: 1800 151 624</span>
            </a>

            <a
              href="mailto:admin@costplus100.com.au"
              className="flex items-center gap-3 p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 text-xs font-bold transition-colors truncate"
            >
              <Mail className="size-4 text-[#E31837] shrink-0" />
              <span className="truncate">admin@costplus100.com.au</span>
            </a>

            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium px-1">
              <Clock className="size-3.5 text-slate-500" />
              <span>Mon – Fri: 9:00 AM – 6:00 PM WST</span>
            </div>
          </div>
        </div>

        {/* ── LOGOUT BUTTON (IF LOGGED IN) ── */}
        {customer && (
          <div className="pt-1 mb-2">
            <button
              onClick={handleLogout}
              className="w-full bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-extrabold text-xs py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <LogOut className="size-4 text-rose-600" />
              <span>Log Out ({customer.firstName || customer.email})</span>
            </button>
          </div>
        )}

      </div>

      {/* Quote Modal */}
      <QuoteModal open={showQuoteModal} onClose={() => setShowQuoteModal(false)} />
    </div>
  );
}
