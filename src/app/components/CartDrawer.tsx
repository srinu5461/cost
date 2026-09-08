import { useNavigate } from 'react-router';
import { ShoppingBag, ArrowRight, X, Trash2, Package } from 'lucide-react';
import { useCart } from '../context/CartContext';

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function CartDrawer() {
  const navigate = useNavigate();
  const {
    cart,
    isCartOpen,
    closeCartDrawer,
    removeFromCart,
    clearCart,
    getCartSubtotal,
    getItemPrice,
  } = useCart();

  if (!isCartOpen) return null;

  const subtotal = getCartSubtotal();

  return (
    <div className="fixed inset-0 z-[99999] overflow-hidden">
      {/* Semi-transparent Dark Overlay Backdrop */}
      <div
        onClick={closeCartDrawer}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Slide-Over Right Off-Canvas Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right">
          
          {/* ── DRAWER HEADER ── */}
          <div className="px-4 sm:px-6 py-3.5 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-4 sm:size-5 text-slate-900" />
              <h2 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                Shopping Cart
              </h2>
            </div>
            
            <button
              onClick={closeCartDrawer}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
              title="Close cart"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* ── DRAWER BODY (CART ITEMS) ── */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 sm:space-y-5">
            {cart.length > 0 ? (
              cart.map((item) => {
                const effectivePrice = getItemPrice(item);
                const itemImage = item.product.mainImageUrl || item.product.image;

                return (
                  <div
                    key={item.product.id}
                    className="flex items-center gap-3 pb-3 sm:pb-4 border-b border-slate-100 last:border-b-0 last:pb-0 relative group"
                  >
                    {/* Thumbnail Box */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg border border-slate-200/80 p-1 bg-white object-contain shrink-0 overflow-hidden flex items-center justify-center shadow-2xs">
                      {itemImage ? (
                        <img
                          src={itemImage}
                          alt={item.product.name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <Package className="size-5 text-slate-300" />
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0 pr-5">
                      <h4 className="text-[11px] sm:text-xs font-extrabold text-slate-900 line-clamp-2 leading-snug">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        {item.quantity} × <span className="font-extrabold text-slate-800">{formatCurrency(effectivePrice)}</span>
                      </p>
                    </div>

                    {/* Remove Item Button */}
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="absolute right-0 top-0.5 text-slate-400 hover:text-[#E31837] p-1 cursor-pointer transition-colors"
                      title="Remove item"
                    >
                      <X className="size-3.5 sm:size-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="size-12 sm:size-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <ShoppingBag className="size-6 sm:size-8" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900">Your cart is empty</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 font-medium mt-1">
                    Explore our commercial catering equipment catalogue and add items to your cart.
                  </p>
                </div>
                <button
                  onClick={() => {
                    closeCartDrawer();
                    navigate('/products');
                  }}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  Browse Catalogue
                </button>
              </div>
            )}
          </div>

          {/* ── DRAWER FOOTER (ACTIONS & SUBTOTAL) ── */}
          {cart.length > 0 && (
            <div className="p-4 sm:p-6 border-t border-slate-100 bg-white shrink-0 space-y-2.5 sm:space-y-3.5 shadow-top">
              {/* Subtotal Row */}
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-extrabold text-slate-800">Subtotal:</span>
                <span className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {/* View Cart Button */}
              <button
                onClick={() => {
                  closeCartDrawer();
                  navigate('/cart');
                }}
                className="w-full border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-slate-900 font-extrabold py-2.5 sm:py-3 rounded-lg transition-all text-xs cursor-pointer shadow-2xs"
              >
                View Cart
              </button>

              {/* Go to Checkout Button (Signature Brand Red Color) */}
              <button
                onClick={() => {
                  closeCartDrawer();
                  navigate('/checkout');
                }}
                className="w-full bg-[#E31837] hover:bg-[#C8102E] text-white font-extrabold py-2.5 sm:py-3 rounded-lg transition-all text-xs cursor-pointer shadow-md hover:shadow-lg"
              >
                Go to Checkout
              </button>

              {/* Clear All Link */}
              <div className="text-center pt-0.5">
                <button
                  onClick={clearCart}
                  className="text-[11px] font-semibold text-slate-400 hover:text-red-600 transition-colors inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="size-3" />
                  <span>Clear All</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
