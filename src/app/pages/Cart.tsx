import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCart } from '../context/CartContext';
import { useProducts } from '../../hooks/useProducts';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Tag,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Lock,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Package
} from 'lucide-react';
import { getApplicableMultibuyOption, calculateMultibuySavings } from '../utils/multibuy';
import { calculateBOGODiscounts, type BOGOCalculationResult } from '../utils/bogoCalculator';

export function Cart() {
  const { cart, removeFromCart, updateQuantity, clearCart, getItemPrice } = useCart();
  const { data: allProducts } = useProducts();
  const navigate = useNavigate();

  const [bogoResult, setBogoResult] = useState<BOGOCalculationResult | null>(null);
  const [customerDiscountPercentage, setCustomerDiscountPercentage] = useState(0);
  const [canBuyAtCostPrice, setCanBuyAtCostPrice] = useState(false);
  const [hasCostPlusHundredAccess, setHasCostPlusHundredAccess] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState('');

  // Check customer special pricing states
  useEffect(() => {
    try {
      const customerStr = localStorage.getItem('customer');
      if (customerStr) {
        const customer = JSON.parse(customerStr);
        const costPriceAccess = customer?.can_see_cost_price || false;
        const discountPercentage = customer?.discount_percentage || 0;
        const costPlusHundredAccess = customer?.cost_plus_hundred_access || false;

        setCanBuyAtCostPrice(costPriceAccess);
        setHasCostPlusHundredAccess(costPlusHundredAccess);
        if (!costPriceAccess && !costPlusHundredAccess && discountPercentage > 0) {
          setCustomerDiscountPercentage(discountPercentage);
        }
      }
    } catch (e) {
      // Ignore errors
    }
  }, []);

  // Calculate BOGO discounts whenever cart changes
  useEffect(() => {
    if (cart.length > 0) {
      calculateBOGODiscounts(cart).then((result) => {
        setBogoResult(result);
      });
    } else {
      setBogoResult(null);
    }
  }, [cart]);

  // Handle Coupon Apply
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    if (couponCode.toUpperCase() === 'WELCOME10' || couponCode.toUpperCase() === 'COSTPLUS') {
      setAppliedCoupon(couponCode.toUpperCase());
      setCouponError('');
    } else {
      setCouponError('Invalid promo code. Try "COSTPLUS"');
    }
  };

  // Format currency helper
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // ── EMPTY CART VIEW ──
  if (cart.length === 0) {
    return (
      <div className="min-h-[85vh] bg-[#FAFAFC] flex items-center justify-center py-16 px-4">
        <div className="max-w-lg w-full bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200/80 text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Animated Bag Icon */}
          <div className="size-24 rounded-full bg-slate-100 text-[#E31837] flex items-center justify-center mx-auto shadow-inner border border-slate-200/60">
            <ShoppingBag className="size-11" />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Your Cart is Empty
            </h1>
            <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
              Looks like you haven't added any commercial catering equipment yet. Browse our transparent Cost+$100 catalogue!
            </p>
          </div>

          {/* Quick Categories Navigation */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Popular Categories</p>
            <div className="grid grid-cols-2 gap-2 text-xs font-bold text-slate-700">
              <Link to="/products?category=Refrigeration" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/70 transition-all text-center">
                ❄ Refrigeration
              </Link>
              <Link to="/products?category=Cooking" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/70 transition-all text-center">
                🔥 Commercial Ovens
              </Link>
            </div>
          </div>

          <Link to="/products" className="block pt-2">
            <button className="w-full bg-[#E31837] hover:bg-[#C8102E] text-white font-extrabold py-4 px-6 rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 cursor-pointer text-sm">
              <span>Start Browsing Products</span>
              <ArrowRight className="size-4" />
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate Subtotals
  const originalSubtotal = cart.reduce((total, item) => {
    const effectivePrice = getItemPrice(item);
    return total + effectivePrice * item.quantity;
  }, 0);

  const bogoDiscount = bogoResult?.totalDiscount ?? 0;
  const couponDiscount = appliedCoupon ? originalSubtotal * 0.05 : 0;
  const subtotalAfterDiscounts = Math.max(0, originalSubtotal - bogoDiscount - couponDiscount);
  
  const gst = subtotalAfterDiscounts * 0.1; // 10% GST
  const finalTotal = subtotalAfterDiscounts + gst;

  const totalItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
  const hasAgeRestrictedItems = cart.some(item => item.product.ageRestricted);
  const ageRestrictedCount = cart.filter(item => item.product.ageRestricted).length;

  // Cross-sell items from catalogue
  const crossSellProducts = (allProducts || []).slice(0, 4);

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-slate-800 pb-24">
      
      {/* ── MAIN CONTENT CONTAINER ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        
        {/* Top Header Title & Breadcrumb (Reduced Font Size & No Stepper Bar) */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
            <Link to="/" className="hover:text-slate-900 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-slate-700 font-bold">Shopping Cart</span>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Shopping Cart
            </h1>
            <span className="bg-[#0F172A] text-white text-xs font-extrabold px-3.5 py-1 rounded-full shadow-xs">
              {totalItemsCount} {totalItemsCount === 1 ? 'Item' : 'Items'}
            </span>
          </div>
        </div>
        
        {/* Age Restriction Alert Banner */}
        {hasAgeRestrictedItems && (
          <div className="mb-6 rounded-2xl bg-amber-50 border border-amber-200 p-4 sm:p-5 flex items-start gap-4 shadow-2xs animate-in fade-in">
            <div className="bg-amber-100 p-2.5 rounded-xl text-amber-700 shrink-0 mt-0.5">
              <ShieldAlert className="size-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-amber-900 text-sm sm:text-base">Age Verification Required (18+)</h3>
              <p className="text-xs sm:text-sm text-amber-800 font-medium leading-relaxed mt-0.5">
                Your cart contains {ageRestrictedCount} age-restricted {ageRestrictedCount === 1 ? 'item' : 'items'} marked with 18+ verification requirement. You will be prompted to verify your date of birth during checkout.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT COLUMN: CART ITEMS LIST (8 Cols) ── */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-3 sm:space-y-4">
            
            {/* Header controls bar */}
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3 sm:p-4 px-4 sm:px-6 flex items-center justify-between shadow-2xs">
              <span className="text-xs sm:text-sm font-extrabold text-slate-900">
                Product Details
              </span>
              <button
                onClick={clearCart}
                className="text-[11px] sm:text-xs font-bold text-slate-400 hover:text-[#E31837] flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="size-3 sm:size-3.5" />
                <span>Clear All Items</span>
              </button>
            </div>

            {/* Cart Product Row Cards */}
            <div className="space-y-3 sm:space-y-4">
              {cart.map((item) => {
                const effectivePrice = getItemPrice(item);
                const itemTotal = effectivePrice * item.quantity;
                const multibuyOption = getApplicableMultibuyOption(item.product, item.quantity);
                const savings = calculateMultibuySavings(item.product, item.quantity);
                const itemImage = item.product.mainImageUrl || item.product.image;

                return (
                  <div
                    key={item.product.id}
                    className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-3 sm:p-5 shadow-xs hover:shadow-md transition-all relative group"
                  >
                    <div className="flex flex-row items-start gap-3 sm:gap-6">
                      
                      {/* Product Thumbnail */}
                      <Link to={`/products/${item.product.id}`} className="shrink-0">
                        <div className="size-16 sm:size-28 rounded-xl border border-slate-200/80 p-1 bg-white flex items-center justify-center overflow-hidden group-hover:border-slate-300 transition-colors shadow-2xs">
                          {itemImage ? (
                            <img
                              src={itemImage}
                              alt={item.product.name}
                              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <Package className="size-6 sm:size-8 text-slate-300" />
                          )}
                        </div>
                      </Link>

                      {/* Product Details Container */}
                      <div className="flex-1 min-w-0 space-y-1.5 w-full">
                        
                        {/* Header: Brand, SKU & Trash Button */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {item.product.brand && (
                              <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                                {item.product.brand}
                              </span>
                            )}
                            <span className="text-[10px] font-bold text-slate-400">
                              SKU: {item.product.code || item.product.id}
                            </span>
                          </div>

                          {/* Trash Icon Button */}
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-slate-400 hover:text-[#E31837] p-1 hover:bg-rose-50 rounded-lg transition-all cursor-pointer shrink-0"
                            title="Remove item from cart"
                          >
                            <Trash2 className="size-4 sm:size-4.5" />
                          </button>
                        </div>

                        {/* Title */}
                        <Link to={`/products/${item.product.id}`}>
                          <h3 className="text-xs sm:text-base font-extrabold text-slate-900 group-hover:text-[#E31837] transition-colors leading-snug line-clamp-2">
                            {item.product.name}
                          </h3>
                        </Link>

                        {/* Bottom Row: Stepper (LEFT) & Price (RIGHT) */}
                        <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                          
                          {/* Stepper Quantity (LEFT) */}
                          <div className="flex items-center bg-slate-100 border border-slate-200 rounded-lg sm:rounded-xl p-0.5 shadow-2xs shrink-0">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="size-7 sm:size-8 rounded-md sm:rounded-lg bg-white hover:bg-slate-200/80 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                              title="Decrease quantity"
                            >
                              <Minus className="size-3.5" />
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.product.id, parseInt(e.target.value) || 1)}
                              className="w-8 sm:w-12 text-center text-xs sm:text-sm font-black bg-transparent border-none text-slate-900 outline-none"
                              min="1"
                            />
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="size-7 sm:size-8 rounded-md sm:rounded-lg bg-white hover:bg-slate-200/80 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                              title="Increase quantity"
                            >
                              <Plus className="size-3.5" />
                            </button>
                          </div>

                          {/* Price & Badges (RIGHT) */}
                          <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
                            {(item.product as any).promotionalPrice ? (
                              <span className="bg-[#E31837] text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                                Promo Price
                              </span>
                            ) : canBuyAtCostPrice && item.product.costPrice ? (
                              <span className="bg-emerald-600 text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                                Cost Price
                              </span>
                            ) : (
                              <span className="bg-[#8B5CF6] text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide">
                                COST+$100
                              </span>
                            )}

                            {/* Total Line Price */}
                            <div className="text-base sm:text-2xl font-black text-slate-900 leading-tight">
                              {formatMoney(itemTotal)}
                            </div>

                            {/* Unit Price */}
                            <div className="text-[10px] sm:text-xs text-slate-500 font-medium">
                              {formatMoney(effectivePrice)} each
                            </div>

                            {/* Savings Amount Line */}
                            {(item.product.price > effectivePrice || savings > 0) && (
                              <div className="text-[10px] sm:text-xs font-bold text-emerald-600">
                                Save {formatMoney(Math.max(savings, (item.product.price - effectivePrice) * item.quantity))}
                              </div>
                            )}

                            {/* Strike-through RRP Price */}
                            {item.product.price > effectivePrice && (
                              <div className="text-[10px] sm:text-xs text-slate-400 line-through font-medium">
                                {formatMoney(item.product.price)} each
                              </div>
                            )}
                          </div>

                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>

            {/* Continue Shopping Button */}
            <div className="pt-2">
              <Link to="/products" className="inline-block">
                <button className="border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-800 font-bold px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-2 cursor-pointer group">
                  <ArrowLeft className="size-3.5 sm:size-4 group-hover:-translate-x-1 transition-transform" />
                  <span>Continue Shopping</span>
                </button>
              </Link>
            </div>
          </div>

          {/* ── RIGHT COLUMN: ORDER SUMMARY SIDEBAR ── */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 p-4 sm:p-8 shadow-2xs sticky top-[100px] space-y-4 sm:space-y-6">
              
              {/* Title */}
              <h2 className="text-base sm:text-xl font-bold text-slate-800 tracking-tight">
                Order Summary
              </h2>

              {/* Price Breakdown Lines */}
              <div className="space-y-3 sm:space-y-4 text-xs sm:text-base text-slate-600">
                
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="font-normal text-slate-600">Subtotal</span>
                  <span className="font-medium text-slate-800">{formatMoney(subtotalAfterDiscounts)}</span>
                </div>

                {/* GST (10%) */}
                <div className="flex items-center justify-between">
                  <span className="font-normal text-slate-600">GST (10%)</span>
                  <span className="font-medium text-slate-800">{formatMoney(gst)}</span>
                </div>

                {/* Divider Line */}
                <div className="pt-1.5 border-t border-slate-200/80"></div>

                {/* Total Row */}
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-base sm:text-2xl font-normal text-slate-900">Total</span>
                  <span className="text-base sm:text-2xl font-bold text-slate-900">{formatMoney(finalTotal)}</span>
                </div>

                {/* Including GST Text */}
                <p className="text-[11px] sm:text-xs text-slate-400 font-normal pt-0.5">
                  Including {formatMoney(gst)} in GST
                </p>

              </div>

              {/* Proceed to Checkout Button */}
              <button
                onClick={() => navigate('/checkout')}
                className="w-full bg-[#E31837] hover:bg-[#C8102E] text-white font-extrabold py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-lg sm:rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md hover:shadow-lg text-xs sm:text-base group"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="size-3.5 sm:size-4.5 group-hover:translate-x-1 transition-transform" />
              </button>

              {/* Secure Checkout Text */}
              <div className="text-center pt-0.5">
                <span className="text-[11px] sm:text-xs text-slate-400 font-normal">
                  Secure checkout
                </span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}