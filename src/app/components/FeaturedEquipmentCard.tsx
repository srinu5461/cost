import { Link } from 'react-router';
import { CheckCircle2, Star, Truck, ShoppingCart } from 'lucide-react';
import { Product } from '../types/product';
import { useCart } from '../context/CartContext';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface FeaturedEquipmentCardProps {
  product: Product;
  badgeText?: string;
}

export function FeaturedEquipmentCard({ product }: FeaturedEquipmentCardProps) {
  const { addToCart } = useCart();

  const productName = product?.name || 'Commercial Equipment';
  const productImage = product?.image || 'https://via.placeholder.com/400x300?text=No+Image';
  const productBrandLogo = product?.brandLogo || product?.brandLogoUrl || '';
  const productBrand = product?.brand || 'POLAR';
  const productCode = product?.code || product?.sku || 'GL009-A';
  const productPrice = typeof product?.price === 'number' ? product.price : parseFloat(String(product?.price || 0));

  // Cost+$100 calculation ($500–$10,000 range)
  const isCostPlusEligible = productPrice >= 500 && productPrice <= 10000;
  const wasPrice = product?.wasPrice
    ? parseFloat(String(product.wasPrice))
    : (isCostPlusEligible ? productPrice * 1.33 : (productPrice > 0 ? productPrice * 1.25 : null));

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_10px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.08)] hover:border-slate-300 transition-all duration-300 p-3 sm:p-4 flex flex-col justify-between relative group h-full">
      <div>
        {/* ── PRODUCT IMAGE CONTAINER WITH BRAND BADGE AT TOP LEFT ── */}
        <Link
          to={`/products/${product.id}`}
          className="block w-full h-36 sm:h-60 rounded-xl bg-white p-2 flex items-center justify-center mb-2 sm:mb-3 relative overflow-hidden group/img cursor-pointer"
        >
          {/* Brand Badge directly upon image at top-left */}
         {productBrandLogo ? (
  <img src={productBrandLogo} alt={productBrand} className="absolute top-2 left-2 h-6 object-contain max-w-[80px] z-10" />
) : (
  <span className="absolute top-2 left-2 text-[10px] sm:text-xs font-black text-[#0284C7] uppercase tracking-wider z-10">
    {productBrand}
  </span>
)}

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

        {/* ── TOP PRICING ROW: Cut Amount (Left) + COST+$100 Badge (Right) ── */}
        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
          {wasPrice && wasPrice > productPrice ? (
            <span className="text-[11px] sm:text-sm text-slate-400 line-through font-semibold">
              ${wasPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          ) : <span />}
          <span className="bg-[#8B5CF6] text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
            COST +$100
          </span>
        </div>

        {/* ── BOTTOM PRICING ROW: Red Amount (Left) + Ex GST (Right next to it) ── */}
        <div className="flex items-baseline gap-1 mb-1.5 sm:mb-2.5">
          <span className="text-base sm:text-xl font-black text-[#E31837]">
            ${productPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
        </div>
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
