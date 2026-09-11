import { useState } from 'react';
import { Link } from 'react-router';
import { CheckCircle2, Star, Truck, ShoppingCart, Minus, Plus } from 'lucide-react';
import { Product } from '../types/product';
import { useCart } from '../context/CartContext';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface MultiBuyEquipmentCardProps {
  product: Product;
}

export function MultiBuyEquipmentCard({ product }: MultiBuyEquipmentCardProps) {
  const { addToCart } = useCart();
  const [qty, setQty] = useState(1);

  const productName = product?.name || 'Commercial Multi-Buy Item';
  const productImage = (product as any)?.mainImageUrl || product?.image || 'https://via.placeholder.com/400x300?text=No+Image';
  const productBrand = product?.brand || 'VOGUE';
  const productBrandLogo = product?.brandLogo || (product as any)?.brandLogoUrl || '';
  const productCode = product?.code || product?.sku || 'MB-001';
  const basePrice = typeof product?.price === 'number' ? product.price : parseFloat(String(product?.price || 0));

  const tiers: any[] = product?.multiBuyOptions || [];
  // Find tier matching current quantity
  const activeTier = [...tiers].reverse().find((t: any) => qty >= t.quantity);
  const effectivePrice = activeTier ? activeTier.price : basePrice;

  // Secondary tier highlight option (e.g. buy 2+ or 5+)
  const highlightOption = tiers.find((t: any) => t.quantity > 1) || tiers[0];

  const wasPrice = product?.wasPrice
    ? parseFloat(String(product.wasPrice))
    : (basePrice > 0 ? basePrice * 1.2 : null);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product, qty);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-3 sm:p-4 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all relative group h-full">
      <div>
        {/* ── PRODUCT IMAGE CONTAINER WITH BRAND & MULTI-BUY BADGES ── */}
        <Link
          to={`/products/${product.id}`}
          className="block w-full h-36 sm:h-52 rounded-xl bg-slate-50/60 p-2 flex items-center justify-center mb-2 sm:mb-3 relative overflow-hidden group/img cursor-pointer"
        >
          {/* Brand Badge (Top-Left) */}
          {productBrandLogo ? (
  <img src={productBrandLogo} alt={productBrand} className="absolute top-2 left-2 h-6 object-contain max-w-[80px] z-10" />
) : (
  <span className="absolute top-2 left-2 text-[10px] sm:text-xs font-black text-[#0284C7] uppercase tracking-wider z-10">
    {productBrand}
  </span>
)}

          {/* Multi-Buy Deal Badge (Top-Right) */}
          <span className="absolute top-2 right-2 bg-amber-500 text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs z-10">
            MULTI-BUY
          </span>

          <ImageWithFallback
            src={productImage}
            alt={productName}
            className="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-300"
          />
        </Link>

        {/* ── CODE (LEFT) & IN STOCK (RIGHT) ROW ── */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1 sm:mb-1.5">
          <span className="text-slate-500 font-medium truncate">
            Code: <span className="font-extrabold text-slate-900">{productCode}</span>
          </span>
          <div className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-1.5 py-0.5 rounded-full text-[9px] sm:text-xs shrink-0 shadow-2xs">
            <CheckCircle2 className="size-2.5 sm:size-3 fill-emerald-600 text-white shrink-0" />
            <span>In Stock</span>
          </div>
        </div>

        {/* ── PRODUCT TITLE ── */}
        <Link to={`/products/${product.id}`} className="hover:text-[#E31837] transition-colors block mb-1 sm:mb-2 cursor-pointer">
          <h3 className="text-xs sm:text-sm font-bold text-[#0F172A] line-clamp-2 leading-tight sm:h-10">
            {productName}
          </h3>
        </Link>

        {/* ── TOP PRICING ROW: Was Price (Left) + Savings/Tier Badge (Right) ── */}
        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
          {wasPrice && wasPrice > effectivePrice ? (
            <span className="text-[11px] sm:text-sm text-slate-400 line-through font-semibold">
              ${wasPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          ) : <span />}
          {activeTier ? (
            <span className="bg-emerald-600 text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
              {activeTier.quantity}+ PACK DISCOUNT
            </span>
          ) : (
            <span className="bg-amber-500 text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
              BULK DISCOUNT
            </span>
          )}
        </div>

        {/* ── BOTTOM PRICING ROW: Red Amount (Left) + Ex GST (Right) ── */}
        <div className="flex items-baseline gap-1 mb-1.5 sm:mb-2">
          <span className="text-base sm:text-xl font-black text-[#E31837]">
            ${effectivePrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
        </div>

        {/* ── MULTI-BUY HIGHLIGHT TIER PILL ── */}
        {highlightOption && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-lg px-2 py-1 mb-2 flex items-center justify-between">
            <span className="text-[10px] sm:text-[11px] font-bold text-amber-900">
              Buy {highlightOption.quantity}+ items:
            </span>
            <span className="text-[11px] sm:text-xs font-extrabold text-[#E31837]">
              ${highlightOption.price?.toFixed(2)} <span className="text-[9px] sm:text-[10px] font-normal text-amber-700">each</span>
            </span>
          </div>
        )}
      </div>

      <div>
        {/* ── BOTTOM METADATA BAR: Review Stars/Count (Left) + Dispatched by Supplier (Right) ── */}
        <div className="border-t border-slate-100 pt-2 mb-2 flex items-center justify-between text-[10px] sm:text-[11px]">
          <div className="flex items-center gap-1 text-slate-300 text-xs">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-2.5 sm:size-3 fill-slate-200 text-slate-300" />
              ))}
            </div>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">(0)</span>
          </div>

          <div className="h-3 w-px bg-slate-200" />

          <div className="flex items-center gap-1 text-slate-600 font-medium">
            <Truck className="size-3 sm:size-3.5 text-slate-500 shrink-0" />
            <span className="truncate">Dispatched by Supplier</span>
          </div>
        </div>

        {/* ── ACTION BUTTONS: Add to Cart + View Details ── */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-[#E31837] hover:bg-[#C8102E] text-white text-[11px] sm:text-xs font-black py-2 sm:py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <ShoppingCart className="size-3.5" /> Add to Cart
          </button>
          <Link
            to={`/products/${product.id}`}
            className="flex-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[11px] sm:text-xs font-black py-2 sm:py-2.5 rounded-xl transition-all text-center flex items-center justify-center whitespace-nowrap"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}
