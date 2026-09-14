import { Link } from 'react-router';
import { Star, ShoppingCart, Check, Tag, AlertCircle, Truck, Phone } from 'lucide-react';
import { Product } from '../types/product';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useCart } from '../context/CartContext';
import { memo, useState, useEffect } from 'react';
import { getProductBadge, getSpecialsForProduct } from '../utils/bogoCalculator';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface ProductCardProps {
  product: Product;
  sectionTag?: 'featured' | 'popular' | 'promotion';
  priority?: boolean; // ⚡ NEW: For priority loading of first 4 images
  layoutMode?: 'grid' | 'list';
}

interface Promotion {
  id: string;
  productId: string;
  promotionalPrice: number;
  active: boolean;
}

// ⚡ OPTIMIZATION: Wrap in React.memo to prevent unnecessary re-renders
export const ProductCard = memo(function ProductCard({ product, sectionTag, priority, layoutMode = 'grid' }: ProductCardProps) {
  const { addToCart } = useCart();

  // 🎯 BOGO/Special badge state
  const [specialBadge, setSpecialBadge] = useState<{ text: string; color: string } | null>(null);
  const [activeSpecial, setActiveSpecial] = useState<any>(null);

  // 🎯 Promotional pricing from separate promotions API
  const [promotion, setPromotion] = useState<Promotion | null>(null);

  // 🎯 Customer Pricing (VIP, Cost Price, or Cost+$100)
  const [customerDiscountPercentage, setCustomerDiscountPercentage] = useState(0);
  const [canBuyAtCostPrice, setCanBuyAtCostPrice] = useState(false);
  const [hasCostPlusHundredAccess, setHasCostPlusHundredAccess] = useState(false);
  // 🌍 Global Cost+$100 toggle — admin controlled via Settings page
  const [universalCostPlusEnabled, setUniversalCostPlusEnabled] = useState(true);

  // Check for customer pricing and global settings
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
        // Only show VIP discount for discount % customers (not cost price or cost+$100 customers)
        if (!costPriceAccess && !costPlusHundredAccess && discountPercentage > 0) {
          setCustomerDiscountPercentage(discountPercentage);
        }
      }
    } catch (e) {
      // Ignore errors
    }

    // Read global Cost+$100 toggle (default: enabled)
    const globalToggle = localStorage.getItem('costplus100_universal_pricing_enabled');
    if (globalToggle === 'false') {
      setUniversalCostPlusEnabled(false);
    }
  }, []);

  // Fetch promotional pricing for this product (only if not already attached)
  useEffect(() => {
    // If promotional price is already on the product, use it directly
    if ((product as any).promotionalPrice) {
      console.log(`[ProductCard] ✅ Using pre-attached promotional price for ${product.name}: $${(product as any).promotionalPrice}`);
      setPromotion({
        id: 'attached',
        productId: product.id,
        promotionalPrice: (product as any).promotionalPrice,
        active: true
      });
      return;
    }

    // Otherwise fetch from API
    const fetchPromotion = async () => {
      try {
        console.log(`[ProductCard] Fetching promotion for product ${product.id} (${product.name})`);
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/promotions/product/${product.id}`,
          {
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log(`[ProductCard] Promotion response for ${product.name}:`, data);
          if (data && data.active) {
            setPromotion(data);
            console.log(`[ProductCard] ✅ Set active promotion for ${product.name}:`, data);
          } else {
            console.log(`[ProductCard] No active promotion for ${product.name}`);
          }
        } else {
          console.log(`[ProductCard] Failed to fetch promotion for ${product.name}:`, response.status);
        }
      } catch (error) {
        // Silently skip promotion fetch errors - product will display without promotion
        console.log(`[ProductCard] Promotion unavailable for ${product.name}, continuing without promotion`);
      }
    };

    fetchPromotion();
  }, [product.id, (product as any).promotionalPrice]);

  // Fetch special badge and special data for this product
  useEffect(() => {
    const fetchSpecialData = async () => {
      const productCode = product.code || product.sku || '';
      const brand = product.brand;
      const categoryId = product.categoryId;

      console.log(`[Badge Debug] ${product.name?.substring(0, 30)} - Code: ${productCode}, Brand: ${brand}`);

      if (productCode || brand || categoryId) {
        // Fetch badge
        const badge = await getProductBadge(productCode, brand, categoryId);
        console.log(`[Badge Result] ${productCode}:`, badge);
        setSpecialBadge(badge);

        // Fetch actual special data for pricing
        const specials = await getSpecialsForProduct(productCode, brand, categoryId);
        if (specials && specials.length > 0) {
          // Use the first (highest priority) special
          setActiveSpecial(specials[0]);
          console.log(`[Special Data] Found special for ${product.name}:`, specials[0]);
        }
      }
    };

    fetchSpecialData();
  }, [product.code, product.sku, product.brand, product.categoryId]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();

    console.log('[ProductCard] handleAddToCart - Current state:', {
      productName: product.name,
      productId: product.id,
      promotion: promotion,
      hasPromotion: hasPromotion,
      promotionState: promotion
    });

    // Attach promotional price to product if it exists
    const productWithPromo = hasPromotion
      ? { ...product, promotionalPrice: promotion.promotionalPrice }
      : product;

    console.log('[ProductCard] Adding to cart:', {
      name: product.name,
      hasPromotion,
      promotion: promotion,
      promotionalPrice: hasPromotion ? promotion.promotionalPrice : 'none',
      regularPrice: product.price,
      productWithPromo
    });
addToCart(productWithPromo);
  };
// Defensive checks for product properties
  const productName = product?.name || 'Unnamed Product';
  const productImage = product?.image || 'https://via.placeholder.com/400x300?text=No+Image';
  const productPrice = product?.price || 0;
  const productRating = product?.rating || 0;
  const productBrand = product?.brand || '';
  const productCode = product?.code || product?.sku || (product as any)?.productCode || '';
  const isKnownBackorderProduct = productCode.toUpperCase() === 'GH429-A';
 const uropaPromisedDate = product?.uropaPromisedDate || '';
const uropaAvailabilityMessage = (product as any)?.uropaAvailabilityMessage || '';
const uropaMessageEnum = (product as any)?.uropaMessageEnum || '';
const uropaShipDirect = (product as any)?.uropaShipDirect || '';
// AM_DIRECT = "Despatched By Supplier" — not warehouse stock, treat as out of stock
const isDirectShip = uropaMessageEnum === 'AM_DIRECT' || uropaShipDirect === 'DIRECT';
const backOrderAvailable = Boolean(
  uropaPromisedDate ||
  (uropaMessageEnum === 'AM_ON_BACKORDER' && uropaAvailabilityMessage.toLowerCase() !== 'in stock')
);
const promisedDateInFuture = uropaPromisedDate ? new Date(uropaPromisedDate) > new Date() : false;
  const rawInStock = product?.inStock ?? (product as any)?.in_stock ?? (product as any)?.is_in_stock;
  const stockQty = product?.stockQuantity ?? (product as any)?.stock_quantity ?? (product as any)?.stock ?? (product as any)?.qty;
  const isExplicitOutOfStock = (product as any)?.out_of_stock === true || (product as any)?.isOutOfStock === true || (product as any)?.status === 'OUT_OF_STOCK' || (product as any)?.availability === 'out of stock' || (product as any)?.availability === 'Out of Stock';

  let computedInStock = true;
  if (isKnownBackorderProduct || isExplicitOutOfStock) {
    computedInStock = false;
  } else if (rawInStock === false || rawInStock === 'false' || rawInStock === 0) {
    computedInStock = false;
  } else if (typeof stockQty === 'number' && stockQty <= 0) {
    computedInStock = false;
  } else if (rawInStock === true || rawInStock === 'true' || rawInStock === 1) {
    computedInStock = true;
  }

  const productInStock = (promisedDateInFuture || isKnownBackorderProduct || isDirectShip) ? false : computedInStock;
  const productBrandLogo = product?.brandLogo || product?.brandLogoUrl;
  const hasMultibuy = product?.multiBuyOptions && product.multiBuyOptions.length > 0;

  // Promotional pricing (from separate promotions system)
  // Compare promotion.promotionalPrice with current DB price (product.price)
  const hasPromotion = promotion !== null;
  const promotionalPrice = hasPromotion ? promotion.promotionalPrice : null;
  const promotionalSavings = hasPromotion ? (productPrice - promotion.promotionalPrice) : null;
  const wasPrice = hasPromotion ? productPrice : null; // Current DB price becomes "was price"

  // Fallback: Old wasPrice system (for backwards compatibility)
  const hasWasPrice = !hasPromotion && product?.wasPrice && parseFloat(String(product.wasPrice)) > productPrice;
  const oldWasPrice = hasWasPrice ? parseFloat(String(product.wasPrice)) : null;
  const isPromotion = sectionTag === 'promotion';

  // Special discount pricing (from specials system - BOGO, percentage, etc.)
  let specialDiscountPrice = null;
  let specialDiscountSavings = null;
  let specialDiscountPercent = null;
  if (activeSpecial && !hasPromotion) {
    if (activeSpecial.type === 'percentage' && activeSpecial.discountValue) {
      specialDiscountPercent = activeSpecial.discountValue;
      specialDiscountPrice = productPrice * (1 - activeSpecial.discountValue / 100);
      specialDiscountSavings = productPrice - specialDiscountPrice;
    } else if (activeSpecial.type === 'fixed_amount' && activeSpecial.discountValue) {
      specialDiscountPrice = Math.max(0, productPrice - activeSpecial.discountValue);
      specialDiscountSavings = activeSpecial.discountValue;
    }
  }

  // Customer Pricing (Cost Price, Cost+$100, or VIP)
  const costPrice = product?.costPrice || product?.tradePrice || product?.baseCost || 0;
  const hasCostPrice = canBuyAtCostPrice && costPrice > 0;
  const hasVipDiscount = !canBuyAtCostPrice && customerDiscountPercentage > 0;

  // 🌍 Universal Cost+$100 pricing: applies to ALL customers when global toggle is on
  // Range: $500–$10,000 product price. Above $10,000 → "Call for Quote"
  const inCostPlusRange = productPrice >= 500 && productPrice <= 10000;
  const isCallForQuote = universalCostPlusEnabled && productPrice > 10000;
  const showUniversalCostPlus = universalCostPlusEnabled && inCostPlusRange && costPrice > 0;
  const universalCostPlusPrice = (costPrice + 150) * 1.025;

  // Legacy per-customer Cost+$100 (used when global toggle is off)
  const costPlusHundredCategories = ['refrigeration', 'ice machines', 'commercial kitchen machines'];
  const productCategory = (product.category as string)?.toLowerCase() || '';
  const isInCostPlusHundredCategory = costPlusHundredCategories.some(cat => productCategory.includes(cat));
  const meetsMinimumPriceThreshold = costPrice >= 500;
  const costPlusHundredPrice = (costPrice + 150) * 1.025;
  const showLegacyCostPlus = !universalCostPlusEnabled && hasCostPlusHundredAccess && isInCostPlusHundredCategory && meetsMinimumPriceThreshold;

  // Calculate display price based on priority:
  // 1. Promotional price
  // 2. Special discount
  // 3. Universal Cost+$100 ($500–$10,000, all customers)
  // 4. Legacy Cost+$100 (per-customer permission, only when universal toggle off)
  // 5. Cost price (for cost price customers)
  // 6. VIP discounted price
  // 7. Regular price
  let displayPrice = productPrice;
  if (hasPromotion) {
    displayPrice = promotionalPrice!;
  } else if (specialDiscountPrice !== null) {
    displayPrice = specialDiscountPrice;
  } else if (showUniversalCostPlus) {
    displayPrice = universalCostPlusPrice;
  } else if (showLegacyCostPlus) {
    displayPrice = costPlusHundredPrice;
  } else if (hasCostPrice) {
    displayPrice = costPrice;
  } else if (hasVipDiscount) {
    displayPrice = productPrice * (1 - customerDiscountPercentage / 100);
  }

  const renderPricingBlock = () => {
    if (isCallForQuote) {
      return (
        <div className="flex flex-col mb-1 justify-end">
          <div className="flex items-center justify-between mb-1">
            <span />
            <span className="bg-slate-800 text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs flex items-center gap-1">
              <Phone className="size-2 sm:size-2.5" /> CALL FOR QUOTE
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-1.5">
            <span className="text-lg sm:text-xl font-black text-[#E31837]">
              ${productPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
          </div>
        </div>
      );
    }
    if (hasPromotion) {
      return (
        <div className="flex flex-col mb-1 justify-end">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">Retail Price</span>
            <span className="text-[10px] sm:text-xs text-slate-400 line-through font-semibold">
              ${wasPrice!.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
            <span className="text-lg sm:text-xl font-black text-[#E31837]">
              ${displayPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="bg-[#E31837] text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
              SAVE ${(productPrice - promotion!.promotionalPrice).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
          </div>
        </div>
      );
    }
    if (specialDiscountPrice !== null) {
      return (
        <div className="flex flex-col mb-1 justify-end">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">Retail Price</span>
            <span className="text-[10px] sm:text-xs text-slate-400 line-through font-semibold">
              ${productPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
            <span className="text-lg sm:text-xl font-black text-[#E31837]">
              ${displayPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="bg-purple-600 text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
              {specialDiscountPercent ? `${specialDiscountPercent}% OFF` : `SAVE $${specialDiscountSavings!.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
          </div>
        </div>
      );
    }
    if (showUniversalCostPlus || showLegacyCostPlus) {
      return (
        <div className="flex flex-col mb-1 justify-end">
          {productPrice > displayPrice && (
            <div className="flex items-center gap-1 mb-1">
              <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">Regular Price:</span>
              <span className="text-[10px] sm:text-xs text-slate-400 line-through font-semibold">
                ${productPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
            <span className="text-lg sm:text-xl font-black text-[#E31837] leading-none">
              ${displayPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
            <span className="bg-[#8B5CF6] text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs whitespace-nowrap">
              Costplus100 Price
            </span>
          </div>
        </div>
      );
    }
    if (hasCostPrice) {
      return (
        <div className="flex flex-col mb-1 justify-end">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">Retail Price</span>
            <span className="text-[10px] sm:text-xs text-slate-400 line-through font-semibold">
              ${productPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
            <span className="text-lg sm:text-xl font-black text-[#E31837]">
              ${displayPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="bg-amber-600 text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
              COST PRICE
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
          </div>
        </div>
      );
    }
    if (hasVipDiscount) {
      return (
        <div className="flex flex-col mb-1 justify-end">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">Retail Price</span>
            <span className="text-[10px] sm:text-xs text-slate-400 line-through font-semibold">
              ${productPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
            <span className="text-lg sm:text-xl font-black text-[#E31837]">
              ${displayPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="bg-green-600 text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
              -{customerDiscountPercentage}% VIP
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
          </div>
        </div>
      );
    }
    if (isPromotion && oldWasPrice) {
      return (
        <div className="flex flex-col mb-1 justify-end">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">Retail Price</span>
            <span className="text-[10px] sm:text-xs text-slate-400 line-through font-semibold">
              ${oldWasPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
            <span className="text-lg sm:text-xl font-black text-[#E31837]">
              ${productPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="bg-[#E31837] text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
              SAVE ${(oldWasPrice - productPrice).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
          </div>
        </div>
      );
    }
    return (
      <div className="flex flex-col mb-1 justify-end">
        <div className="flex items-baseline gap-1.5 mb-1.5">
          <span className="text-lg sm:text-xl font-black text-[#E31837]">
            ${productPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
        </div>
      </div>
    );
  };

  if (layoutMode === 'list') {
    return (
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6 hover:shadow-lg hover:border-slate-300 transition-all relative group w-full items-start">
        {/* ── LEFT COLUMN: Product Image Container Only ── */}
        <Link
          to={`/products/${product.id}`}
          className="block w-full sm:w-52 md:w-60 lg:w-64 h-48 sm:h-52 rounded-xl bg-slate-50/60 p-3 flex items-center justify-center relative overflow-hidden group/img cursor-pointer shrink-0"
        >
          {/* Brand logo — bottom-right pill */}
          {productBrandLogo ? (
            <div className="absolute bottom-2 right-2 bg-white/95 border border-slate-100 rounded px-1.5 py-0.5 shadow-sm z-10">
              <img src={productBrandLogo} alt={productBrand} className="h-5 max-w-[60px] object-contain" />
            </div>
          ) : productBrand ? (
            <span className="absolute bottom-2 right-2 text-[10px] font-black text-[#0284C7] uppercase tracking-wider z-10 bg-white/90 px-1.5 py-0.5 rounded shadow-sm max-w-[50%] truncate">
              {productBrand}
            </span>
          ) : null}

          {/* Special / Promo Badge */}
          {specialBadge ? (
            <div
              className="absolute top-2 right-2 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded shadow-md z-10"
              style={{ backgroundColor: specialBadge.color }}
            >
              {specialBadge.text}
            </div>
          ) : sectionTag && (
            <Badge className={`absolute top-2 right-2 font-bold shadow-md text-[10px] sm:text-xs ${sectionTag === 'featured'
                ? 'bg-blue-600 hover:bg-blue-600'
                : sectionTag === 'popular'
                  ? 'bg-purple-600 hover:bg-purple-600'
                  : 'bg-[#E31837] hover:bg-[#E31837]'
              }`}>
              {sectionTag === 'featured' && '⭐ Featured'}
              {sectionTag === 'popular' && '🔥 Popular'}
              {sectionTag === 'promotion' && '🎉 Promo'}
            </Badge>
          )}

          {/* Age Restricted Badge */}
          {product.ageRestricted && (
            <div className="absolute bottom-2 left-2 z-10">
              <Badge className="bg-orange-500 hover:bg-orange-500 font-bold shadow-md text-[10px] sm:text-xs">
                <AlertCircle className="size-3 mr-1" />
                18+
              </Badge>
            </div>
          )}

          {/* MultiBuy Badge */}
          {hasMultibuy && (
            <div className="absolute bottom-2 right-2 z-10">
              <Badge className="bg-orange-600 hover:bg-orange-600 font-bold shadow-md text-[10px] sm:text-xs">
                <Tag className="size-3 mr-1" />
                MultiBuy
              </Badge>
            </div>
          )}

          <img
            src={productImage}
            alt={productName}
            loading={priority ? "eager" : "lazy"}
            fetchpriority={priority ? "high" : undefined}
            className="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-300"
            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
          />
        </Link>

        {/* ── RIGHT COLUMN: All Content (Code, Stock, Title, Price, Ratings/Shipping, Buttons) ── */}
        <div className="flex-1 flex flex-col justify-between min-w-0 h-full w-full">
          <div>
            {/* Code & In Stock Row */}
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-500 font-medium">
                Code: <span className="font-extrabold text-slate-900">{productCode}</span>
              </span>
              {backOrderAvailable ? (
                <div className="flex flex-col items-end gap-0.5 shrink-0">
                  <div className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs shadow-2xs">
                    <Check className="size-3 text-amber-600 stroke-[3]" />
                    <span>On Backorder</span>
                  </div>
                  {uropaPromisedDate && (
                    <span className="text-[10px] text-amber-600 font-medium">
                      Est. {new Date(uropaPromisedDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  )}
                  {!uropaPromisedDate && uropaAvailabilityMessage && (
                    <span className="text-[10px] text-amber-600 font-medium text-right">
                      {uropaAvailabilityMessage}
                    </span>
                  )}
                </div>
              ) : productInStock ? (
                <div className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs shrink-0 shadow-2xs">
                  <Check className="size-3 text-emerald-600 stroke-[3]" />
                  <span>In Stock</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 font-bold text-red-700 bg-red-50 border border-red-200/80 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs shrink-0 shadow-2xs">
                  <AlertCircle className="size-3 text-red-600" />
                  <span>Out of Stock</span>
                </div>
              )}
            </div>

            {/* Product Title */}
            <Link to={`/products/${product.id}`} className="hover:text-[#E31837] transition-colors block mb-3 cursor-pointer">
              <h3 className="text-sm sm:text-base font-extrabold text-[#0F172A] line-clamp-2 leading-snug">
                {productName}
              </h3>
            </Link>

            {/* Pricing Block */}
            {renderPricingBlock()}

            {/* Review Stars & Dispatched by Supplier (inside Right Column) */}
            <div className="flex items-center gap-3 text-xs border-t border-slate-100 pt-3 my-3">
              <div className="flex items-center gap-1 text-slate-300">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`size-3 ${i < Math.floor(productRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'fill-slate-100 text-slate-200'
                        }`}
                    />
                  ))}
                </div>
                <span className="text-slate-400 font-medium">({productRating || 0})</span>
              </div>

              <div className="h-3 w-px bg-slate-200" />

              <div className="flex items-center gap-1 text-slate-500 font-medium">
                <Truck className="size-3.5 shrink-0" />
                <span>Dispatched by Supplier</span>
              </div>
            </div>
          </div>

          {/* Action Buttons inside Right Column */}
          <div className="flex items-center gap-2.5 sm:w-80 w-full mt-2">
            <button
              onClick={handleAddToCart}
              disabled={!productInStock && !backOrderAvailable}
              className={`flex-[1.5] text-xs font-black py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${!productInStock
                  ? 'bg-[#E31837] opacity-50 pointer-events-none cursor-not-allowed shadow-none'
                  : 'bg-[#E31837] hover:bg-[#C8102E] text-white cursor-pointer shadow-md'
                }`}
            >
              <ShoppingCart className="size-3.5" /> Add to Cart
            </button>
            <Link
              to={`/products/${product.id}`}
              className="flex-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-black py-2.5 rounded-xl transition-all text-center flex items-center justify-center whitespace-nowrap cursor-pointer"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all relative group h-full">
      <div>
        {/* ── PRODUCT IMAGE CONTAINER ── */}
        <Link
          to={`/products/${product.id}`}
          className="block w-full h-44 sm:h-52 rounded-xl bg-slate-50/60 p-3 flex items-center justify-center mb-3 relative overflow-hidden group/img cursor-pointer"
        >
          {/* Out of Stock Badge — top-left */}
          {!productInStock && (
            <span className="absolute top-2 left-2 text-[10px] sm:text-xs font-extrabold bg-red-600 text-white uppercase tracking-wider px-2 py-0.5 rounded shadow-md z-10">
              OUT OF STOCK
            </span>
          )}
          {/* Brand logo — bottom-right pill, clear of product image */}
          {productBrandLogo ? (
            <div className="absolute bottom-2 right-2 bg-white/95 border border-slate-100 rounded px-1.5 py-0.5 shadow-sm z-10">
              <img src={productBrandLogo} alt={productBrand} className="h-5 max-w-[60px] object-contain" />
            </div>
          ) : productBrand ? (
            <span className="absolute bottom-2 right-2 text-[10px] font-black text-[#0284C7] uppercase tracking-wider z-10 bg-white/90 px-1.5 py-0.5 rounded shadow-sm max-w-[50%] truncate">
              {productBrand}
            </span>
          ) : null}
          {/* Special / Promo Badge (Top Right) */}
          {specialBadge ? (
            <div
              className="absolute top-2 right-2 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded shadow-md z-10"
              style={{ backgroundColor: specialBadge.color }}
            >
              {specialBadge.text}
            </div>
          ) : sectionTag && (
            <Badge className={`absolute top-2 right-2 font-bold shadow-md text-[10px] sm:text-xs ${sectionTag === 'featured'
              ? 'bg-blue-600 hover:bg-blue-600'
              : sectionTag === 'popular'
                ? 'bg-purple-600 hover:bg-purple-600'
                : 'bg-[#E31837] hover:bg-[#E31837]'
              }`}>
              {sectionTag === 'featured' && '⭐ Featured'}
              {sectionTag === 'popular' && '🔥 Popular'}
              {sectionTag === 'promotion' && '🎉 Promo'}
            </Badge>
          )}

          {/* Age Restricted (Bottom Left) */}
          {product.ageRestricted && (
            <div className="absolute bottom-2 left-2 z-10">
              <Badge className="bg-orange-500 hover:bg-orange-500 font-bold shadow-md text-[10px] sm:text-xs">
                <AlertCircle className="size-3 mr-1" />
                18+
              </Badge>
            </div>
          )}

          {/* MultiBuy (Bottom Right) */}
          {hasMultibuy && (
            <div className="absolute bottom-2 right-2 z-10">
              <Badge className="bg-orange-600 hover:bg-orange-600 font-bold shadow-md text-[10px] sm:text-xs">
                <Tag className="size-3 mr-1" />
                MultiBuy
              </Badge>
            </div>
          )}

          <img
            src={productImage}
            alt={productName}
            loading={priority ? "eager" : "lazy"}
            fetchpriority={priority ? "high" : undefined}
            className="w-full h-full object-contain group-hover/img:scale-105 transition-transform duration-300"
            onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image'; }}
          />
        </Link>

        {/* ── CODE & IN STOCK ROW ── */}
        <div className="flex items-center justify-between text-[11px] sm:text-xs mb-1.5">
          <span className="text-slate-500 font-medium truncate pr-2">
            Code: <span className="font-extrabold text-slate-900">{productCode}</span>
          </span>
          {backOrderAvailable ? (
            <div className="flex flex-col items-end gap-0.5 shrink-0">
              <div className="flex items-center gap-1 font-bold text-amber-700 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-full text-[10px] sm:text-xs shadow-2xs">
                <Check className="size-3 text-amber-600 stroke-[3]" />
                <span>On Backorder</span>
              </div>
              {uropaPromisedDate && (
                <span className="text-[10px] text-amber-600 font-medium">
                  Est. {new Date(uropaPromisedDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              )}
              {!uropaPromisedDate && uropaAvailabilityMessage && (
                <span className="text-[10px] text-amber-600 font-medium text-right">
                  {uropaAvailabilityMessage}
                </span>
              )}
            </div>
          ) : productInStock ? (
            <div className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full text-[10px] sm:text-xs shrink-0 shadow-2xs">
              <Check className="size-3 text-emerald-600 stroke-[3]" />
              <span>In Stock</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 font-bold text-red-700 bg-red-50 border border-red-200/80 px-2 py-0.5 rounded-full text-[10px] sm:text-xs shrink-0 shadow-2xs">
              <AlertCircle className="size-3 text-red-600" />
              <span>Out of Stock</span>
            </div>
          )}
        </div>

        {/* ── PRODUCT TITLE ── */}
        <Link to={`/products/${product.id}`} className="hover:text-[#E31837] transition-colors block mb-2 cursor-pointer">
          <h3 className="text-xs sm:text-sm font-extrabold text-[#0F172A] line-clamp-3 leading-snug min-h-[34px] sm:min-h-[40px]">
            {productName}
          </h3>
        </Link>

        {/* ── PRICING BLOCK ── */}
        <div className="flex flex-col mb-1 min-h-[46px] sm:min-h-[50px] justify-end">
          {isCallForQuote ? (
            <>
              {/* Call for Quote state */}
              <div className="flex items-center justify-between mb-1">
                <span />
                <span className="bg-slate-800 text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs flex items-center gap-1">
                  <Phone className="size-2 sm:size-2.5" /> CALL FOR QUOTE
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1.5">
                <span className="text-lg sm:text-xl font-black text-[#E31837]">
                  ${productPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
              </div>
            </>
          ) : hasPromotion ? (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">Retail Price</span>
                <span className="text-[10px] sm:text-xs text-slate-400 line-through font-semibold">
                  ${wasPrice!.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
                <span className="text-lg sm:text-xl font-black text-[#E31837]">
                  ${displayPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="bg-[#E31837] text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                  SAVE ${(productPrice - promotion!.promotionalPrice).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
              </div>
            </>
          ) : specialDiscountPrice !== null ? (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">Retail Price</span>
                <span className="text-[10px] sm:text-xs text-slate-400 line-through font-semibold">
                  ${productPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
                <span className="text-lg sm:text-xl font-black text-[#E31837]">
                  ${displayPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="bg-purple-600 text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                  {specialDiscountPercent ? `${specialDiscountPercent}% OFF` : `SAVE $${specialDiscountSavings!.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
              </div>
            </>
          ) : (showUniversalCostPlus || showLegacyCostPlus) ? (
            <>
              {productPrice > displayPrice && (
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">Regular Price:</span>
                  <span className="text-[10px] sm:text-xs text-slate-400 line-through font-semibold">
                    ${productPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                <span className="text-lg sm:text-xl font-black text-[#E31837] leading-none">
                  ${displayPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
                <span className="bg-[#8B5CF6] text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs whitespace-nowrap">
                  Costplus100 Price
                </span>
              </div>
            </>
          ) : hasCostPrice ? (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">Retail Price</span>
                <span className="text-[10px] sm:text-xs text-slate-400 line-through font-semibold">
                  ${productPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
                <span className="text-lg sm:text-xl font-black text-[#E31837]">
                  ${displayPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="bg-amber-600 text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                  COST PRICE
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
              </div>
            </>
          ) : hasVipDiscount ? (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">Retail Price</span>
                <span className="text-[10px] sm:text-xs text-slate-400 line-through font-semibold">
                  ${productPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
                <span className="text-lg sm:text-xl font-black text-[#E31837]">
                  ${displayPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="bg-green-600 text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                  -{customerDiscountPercentage}% VIP
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
              </div>
            </>
          ) : isPromotion && oldWasPrice ? (
            <>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">Retail Price</span>
                <span className="text-[10px] sm:text-xs text-slate-400 line-through font-semibold">
                  ${oldWasPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1.5 flex-wrap">
                <span className="text-lg sm:text-xl font-black text-[#E31837]">
                  ${productPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="bg-[#E31837] text-white font-extrabold text-[8px] sm:text-[9px] px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                  SAVE ${(oldWasPrice - productPrice).toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
              </div>
            </>
          ) : (
            <>
              {/* Empty state for alignment to keep height consistent */}
              <div className="flex items-center justify-between mb-1 h-[18px]">
                <span />
              </div>
              <div className="flex items-baseline gap-1.5 mb-1.5">
                <span className="text-lg sm:text-xl font-black text-[#E31837]">
                  ${productPrice.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 font-medium">Ex GST</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div>
        {/* ── BOTTOM METADATA BAR ── */}
        <div className="border-t border-slate-100 pt-2.5 mb-3 flex items-center justify-between text-[10px] sm:text-[11px]">
          {/* Review Stars & Count */}
          <div className="flex items-center gap-1 text-slate-300">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`size-2.5 sm:size-3 ${i < Math.floor(productRating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-slate-100 text-slate-200'
                    }`}
                />
              ))}
            </div>
            <span className="text-slate-400 font-medium">({productRating || 0})</span>
          </div>

          <div className="h-3 w-px bg-slate-200" />

          {/* Supplier Shipping */}
          <div className="flex items-center gap-1 text-slate-500 font-medium">
            <Truck className="size-3 sm:size-3.5 shrink-0" />
            <span>Dispatched by Supplier</span>
          </div>
        </div>

        {/* ── ACTION BUTTONS ── */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleAddToCart}
            disabled={!productInStock && !backOrderAvailable}
            className={`flex-[1.5] text-[10px] sm:text-xs font-black py-2 sm:py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 whitespace-nowrap ${!productInStock
                ? 'bg-[#E31837] opacity-50 pointer-events-none cursor-not-allowed shadow-none'
                : 'bg-[#E31837] hover:bg-[#C8102E] text-white cursor-pointer shadow-md'
              }`}
          >
            <ShoppingCart className="size-3 sm:size-3.5" /> Add to Cart
          </button>
          <Link
            to={`/products/${product.id}`}
            className="flex-1 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-[10px] sm:text-xs font-black py-2 sm:py-2.5 rounded-xl transition-all text-center flex items-center justify-center whitespace-nowrap cursor-pointer"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
});