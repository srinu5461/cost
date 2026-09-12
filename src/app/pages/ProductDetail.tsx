import { useParams, Link, useNavigate } from 'react-router';
import { categoryToSlug } from '../utils/slugify';
import { useState, useMemo, useEffect } from 'react';
import { useCMS, CategoryNode } from '../context/CMSContext';
import { useCart } from '../context/CartContext';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  CheckCircle2,
  Star,
  Plus,
  Minus,
  ChevronRight,
  ChevronDown,
  ChevronLeft,
  MapPin,
  Award,
  RefreshCw,
  Zap,
  RotateCcw,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
import { ProductCard } from '../components/ProductCard';
import { buildCategoryTree } from '../utils/categoryTree';
import { AgeRestrictionModal } from '../components/AgeRestrictionModal';
import { SizeSelector } from '../components/SizeSelector';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { getProductBadge, getSpecialsForProduct } from '../utils/bogoCalculator';
import { SEOHead, generateProductSchema, generateBreadcrumbSchema } from '../components/SEOHead';
import { useProducts } from '../../hooks/useProducts';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

export function ProductDetail() {
  const { id } = useParams();

  // ✅ Get metadata from CMS
  let data;
  let refreshData: (() => Promise<void>) | undefined;
  let cmsLoading = false;
  try {
    const cms = useCMS();
    data = cms.data;
    refreshData = cms.refreshData;
    cmsLoading = cms.loading;
  } catch (e) {
    console.error('ProductDetail: CMSProvider not available, using empty data');
    data = {
      products: [],
      categories: [],
      categoryTree: [],
      header: { logo: '', phone: '', workingHours: '', navigation: [] },
      footer: { about: '', email: '', phone: '', address: '', socialMedia: {} },
      homepage: { hero: { title: '', subtitle: '', image: '' }, features: [] },
    };
  }

  // ⚡ DIRECT PRODUCT API: Fetch single product for direct URLs (Google Ads, etc)
  const [apiProduct, setApiProduct] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // ⚡ DON'T load CDN JSON for single product pages (wasteful to load 13,781 products for 1 product)
  // Instead, we'll fetch this single product from API or use CMS products if already loaded

  // Use CMS products ONLY if they're already loaded (don't wait for them)
  const allProducts = data.products || [];

  // CDN products for related products (avoids OOM server fetch)
  const { data: cdnProducts } = useProducts();

  const loading = cmsLoading;

  // ⚡ Load cached product immediately for instant display on refresh
  const [cachedProduct, setCachedProduct] = useState(() => {
    try {
      const cached = localStorage.getItem(`product_${id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Get current cache version from localStorage
        const currentVersion = localStorage.getItem('cms_cache_version') || '1';
        const cacheVersion = parsed.version || '1';

        // Use cache if version matches (no time expiration!)
        if (currentVersion === cacheVersion) {
          // ✅ VALIDATE: Check that cached product actually matches the requested ID
          const cachedProductId = parsed.product?.code || parsed.product?.productCode || parsed.product?.sku || parsed.product?.id;
          const idsMatch = cachedProductId === id;

          if (idsMatch) {
            console.log(`✅ [ProductDetail] Using cached product for ${id} (version: ${cacheVersion})`);
            return parsed.product;
          } else {
            console.warn(`⚠️ [ProductDetail] Initial cache ID mismatch! Requested ${id} but cache has ${cachedProductId}`);
          }
        } else {
          console.log(`⚠️ [ProductDetail] Cache version mismatch for ${id}, will load fresh`);
        }
      }
    } catch (error) {
      console.warn('[ProductDetail] Failed to load cached product:', error);
    }
    return null;
  });

  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [sizePrice, setSizePrice] = useState<number | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [openSection, setOpenSection] = useState<string | null>('specs');
  const [showAgeRestrictionModal, setShowAgeRestrictionModal] = useState(false);
  const [pendingCartAction, setPendingCartAction] = useState<'add' | 'buy' | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [specialBadge, setSpecialBadge] = useState<{ text: string; color: string } | null>(null);
  const [activeSpecial, setActiveSpecial] = useState<any>(null);
  const [showImageZoom, setShowImageZoom] = useState(false);
  const [zoomImageIndex, setZoomImageIndex] = useState(0);
  const [isWishlist, setIsWishlist] = useState(false);

  // 📑 3-Tab System state (Description | Specification | Reviews)
  const [activeTab, setActiveTab] = useState<'description' | 'specification' | 'reviews'>('description');

  // 🔍 Amazon-style Image Magnifier state & position calculation
  const [isHovered, setIsHovered] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
    setZoomPos({ x, y });
  };

  // 🎯 Promotional pricing from separate promotions API
  const [promotion, setPromotion] = useState<{ id: string; productId: string; promotionalPrice: number; active: boolean } | null>(null);

  // 🔥 FIX: Move customer state hooks BEFORE early return
  // Get customer from localStorage
  const [customerData, setCustomerData] = useState(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('customer');
    return stored ? JSON.parse(stored) : null;
  });

  // Refresh customer session data on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const refreshCustomerSession = async () => {
      const stored = localStorage.getItem('customer');
      if (!stored) return;

      try {
        const customer = JSON.parse(stored);
        if (!customer.email) return;

        // Fetch fresh customer data from server
        const response = await fetch(
          `${API_URL}/customers/by-email/${encodeURIComponent(customer.email)}`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const freshData = await response.json();

          // Check if permissions have changed
          const costPriceChanged = customer.can_see_cost_price !== freshData.can_see_cost_price;
          const discountChanged = customer.discount_percentage !== freshData.discount_percentage;
          const costPlusHundredChanged = customer.cost_plus_hundred_access !== freshData.cost_plus_hundred_access;
          const permissionsChanged = costPriceChanged || discountChanged || costPlusHundredChanged;

          if (permissionsChanged) {
            // Update localStorage with fresh data
            localStorage.setItem('customer', JSON.stringify(freshData));
            setCustomerData(freshData);

            // Force page refresh to show updated prices
            setTimeout(() => {
              window.location.reload();
            }, 500);
          }
        }
      } catch (error) {
        console.error('Error refreshing customer session:', error);
      }
    };

    refreshCustomerSession();
  }, []); // Run once on mount

  // ⚡ CRITICAL: Reset state when navigating between products
  useEffect(() => {
    console.log(`🔄 [ProductDetail] Route changed to product ${id}, resetting state...`);

    // Reset API state
    setApiProduct(null);
    setApiLoading(false);
    setApiError(null);

    // Load fresh cached product for this ID
    try {
      const cached = localStorage.getItem(`product_${id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        const currentVersion = localStorage.getItem('cms_cache_version') || '1';
        const cacheVersion = parsed.version || '1';

        if (currentVersion === cacheVersion) {
          // ✅ VALIDATE: Check that cached product actually matches the requested ID
          const cachedProductId = parsed.product?.code || parsed.product?.productCode || parsed.product?.sku || parsed.product?.id;
          const idsMatch = cachedProductId === id;

          console.log(`🔍 [ProductDetail] Cache validation:`, {
            requestedId: id,
            cachedProductId,
            cachedProductName: parsed.product?.name,
            idsMatch
          });

          if (idsMatch) {
            console.log(`✅ [ProductDetail] Using cached product for ${id}`);
            setCachedProduct(parsed.product);
          } else {
            console.warn(`⚠️ [ProductDetail] Cache ID mismatch! Requested ${id} but cache has ${cachedProductId}, will load fresh`);
            setCachedProduct(null);
          }
        } else {
          console.log(`⚠️ [ProductDetail] Cache version mismatch for ${id}, will load fresh`);
          setCachedProduct(null);
        }
      } else {
        setCachedProduct(null);
      }
    } catch (error) {
      console.warn('[ProductDetail] Failed to load cached product:', error);
      setCachedProduct(null);
    }

    // Reset UI state
    setSelectedImage(0);
    setQuantity(1);
    setOpenSection('specs');
  }, [id]); // Re-run when id changes

  // ⚡ ALWAYS fetch single product from API when no product found
  // This is faster than loading 13,781 products from CDN just to show 1 product
  useEffect(() => {
    // Check if we already have the product from CMS data
    const productInCMS = allProducts.find(p =>
      p.id === id || p.code === id || p.productCode === id || p.sku === id
    );

    // Debug logging
    console.log(`🔍 [ProductDetail] Checking if should fetch from API:`, {
      id,
      productInCMS: !!productInCMS,
      cachedProduct: !!cachedProduct,
      apiLoading,
      apiProduct: !!apiProduct,
      allProductsCount: allProducts.length,
    });

    const shouldFetchFromAPI =
      id &&
      !productInCMS &&
      !cachedProduct &&
      !apiLoading &&
      !apiProduct;

    if (shouldFetchFromAPI) {
      console.log(`⚡ [Single Product API] Fetching product ${id} from database (faster than loading 13,781 products from CDN)`);
      setApiLoading(true);
      setApiError(null);

      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      fetch(`${API_URL}/product/${id}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        signal: controller.signal,
      })
        .then(res => {
          clearTimeout(timeoutId);
          if (!res.ok) {
            return res.json().then(data => {
              throw new Error(data.error || `Product not found: ${res.status}`);
            });
          }
          return res.json();
        })
        .then(product => {
          console.log(`✅ [Single Product API] Loaded ${product.name || product.code} from database (1 product in ~200ms vs 13,781 products in ~5s from CDN)`);
          setApiProduct(product);
          setApiLoading(false);
        })
        .catch(err => {
          clearTimeout(timeoutId);
          if (err.name === 'AbortError') {
            console.warn(`⚠️  [Single Product API] Request timed out`);
            setApiError('Request timed out');
          } else {
            console.warn(`⚠️  [Single Product API] Failed to fetch product:`, err);
            setApiError(err.message);
          }
          setApiLoading(false);
        });
    }
  }, [id, allProducts, cachedProduct, apiLoading, apiProduct]);

  // ⚡ FAST PATH: Try to find product in loaded data first
  let product = allProducts.find(p => p.id === id);

  // ✅ If not found by ID, try to find by code/productCode/SKU
  if (!product) {
    product = allProducts.find(p =>
      p.code === id ||
      p.productCode === id ||
      p.sku === id
    );
  }

  // ⚡ PRIORITY: API product (for direct URLs) > Products array > Cached
  // BUT: Validate that apiProduct actually matches the requested ID (prevent stale state during navigation)
  const apiProductMatches = apiProduct && (
    apiProduct.id === id ||
    apiProduct.code === id ||
    apiProduct.productCode === id ||
    apiProduct.sku === id
  );

  const finalProduct = apiProductMatches ? apiProduct : product;

  // ⚡ Cache the product when loaded for instant display on next visit
  useEffect(() => {
    if (finalProduct && id) {
      try {
        // ✅ VALIDATE: Only cache if product actually matches the requested ID
        const productId = finalProduct.code || finalProduct.productCode || finalProduct.sku || finalProduct.id;
        const idsMatch = productId === id;

        console.log(`💾 [ProductDetail] Cache check:`, {
          requestedId: id,
          productId,
          productName: finalProduct.name,
          idsMatch,
          willCache: idsMatch
        });

        if (!idsMatch) {
          console.warn(`⚠️ [ProductDetail] NOT caching - product ID mismatch! Requested ${id} but got ${productId}`);
          return;
        }

        // Get current cache version
        const currentVersion = localStorage.getItem('cms_cache_version') || '1';

        localStorage.setItem(`product_${id}`, JSON.stringify({
          product: finalProduct,
          timestamp: Date.now(),
          version: currentVersion
        }));
        console.log(`✅ [ProductDetail] Cached product ${id} (${finalProduct.name})`);

        // Update cached product state if it was different
        if (cachedProduct?.id !== finalProduct.id) {
          setCachedProduct(finalProduct);
        }
      } catch (error) {
        console.warn('[ProductDetail] Failed to cache product:', error);
      }
    }
  }, [finalProduct, id]);

  // Refresh customer session on mount
  useEffect(() => {
    if (finalProduct) {
      // Product loaded - no logging needed
    }
  }, [finalProduct]);

  // Fetch special badge and special data for this product (works with cached product too)
  useEffect(() => {
    const fetchSpecialData = async () => {
      const productToCheck = finalProduct || cachedProduct;
      if (productToCheck) {
        const productCode = productToCheck.code || productToCheck.sku || '';
        const brand = productToCheck.brand;
        const categoryId = productToCheck.categoryId;

        if (productCode || brand || categoryId) {
          // Fetch badge
          const badge = await getProductBadge(productCode, brand, categoryId);
          setSpecialBadge(badge);

          // Fetch actual special data for pricing
          const specials = await getSpecialsForProduct(productCode, brand, categoryId);
          if (specials && specials.length > 0) {
            setActiveSpecial(specials[0]);
          } else {
            setActiveSpecial(null);
          }
        }
      }
    };

    fetchSpecialData();
  }, [finalProduct?.code, finalProduct?.sku, finalProduct?.brand, finalProduct?.categoryId, cachedProduct]);

  // Build category tree for path resolution
  const categoryTree = useMemo(() => {
    return buildCategoryTree(data.categoryTree);
  }, [data.categoryTree]);

  // Build category ID → full path mapping
  const categoryIdToPath = useMemo(() => {
    const map = new Map<string, string>();

    const buildCategoryMap = (nodes: CategoryNode[]) => {
      for (const node of nodes) {
        if (node.id) {
          map.set(node.id, node.fullPath);
        }
        if ((node as any).categoryId) {
          map.set((node as any).categoryId, node.fullPath);
        }
        if (node.children && node.children.length > 0) {
          buildCategoryMap(node.children);
        }
      }
    };

    buildCategoryMap(categoryTree);
    return map;
  }, [categoryTree]);

  // ⚡ Use cached product while fresh data loads, prefer API/fresh data if available
  // BUT: Validate that cachedProduct actually matches the requested ID (prevent stale cache during navigation)
  const cachedProductMatches = cachedProduct && (
    cachedProduct.id === id ||
    cachedProduct.code === id ||
    cachedProduct.productCode === id ||
    cachedProduct.sku === id
  );

  const displayProduct = finalProduct || (cachedProductMatches ? cachedProduct : null);

  // 🖼️ Product images - MUST BE BEFORE EARLY RETURNS
  const productImage = displayProduct?.image || 'https://via.placeholder.com/400x400?text=No+Image';
  const productImages = useMemo(() => {
    // Priority: images > galleryImages > allImages > main image
    if (displayProduct?.images && Array.isArray(displayProduct.images) && displayProduct.images.length > 0) {
      return displayProduct.images;
    }
    if (displayProduct?.galleryImages && Array.isArray(displayProduct.galleryImages) && displayProduct.galleryImages.length > 0) {
      return displayProduct.galleryImages;
    }
    if (displayProduct?.allImages && Array.isArray(displayProduct.allImages) && displayProduct.allImages.length > 0) {
      return displayProduct.allImages;
    }
    // Otherwise, use the main product image
    return [productImage];
  }, [displayProduct?.images, displayProduct?.galleryImages, displayProduct?.allImages, productImage]);

  // ⚡ Log data source for debugging - MUST BE BEFORE EARLY RETURNS
  useEffect(() => {
    if (displayProduct) {
      const source = apiProduct
        ? 'Single Product API (1 product in ~200ms - faster than loading 13,781 from CDN)'
        : data.products && data.products.length > 0
          ? 'CMS Database (all products already loaded)'
          : 'Cached (localStorage)';

      console.log(`✅ [ProductDetail] Product loaded from: ${source}`);
      console.log(`ℹ️  Product: ${displayProduct.name || displayProduct.code}`);
    }
  }, [displayProduct, apiProduct, data.products]);

  // 🎯 Fetch promotional pricing for this product
  useEffect(() => {
    if (!displayProduct?.id) {
      setPromotion(null);
      return;
    }

    const fetchPromotion = async () => {
      try {
        const response = await fetch(
          `${API_URL}/promotions/product/${displayProduct.id}`,
          {
            headers: { 'Authorization': `Bearer ${publicAnonKey}` },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data && data.active) {
            setPromotion(data);
          } else {
            setPromotion(null);
          }
        } else {
          setPromotion(null);
        }
      } catch (error) {
        console.debug('Promotion fetch failed:', error);
        setPromotion(null);
      }
    };

    fetchPromotion();
  }, [displayProduct?.id]);

  // Reset selected image index if it's out of bounds - MUST BE BEFORE EARLY RETURNS
  useEffect(() => {
    if (selectedImage >= productImages.length) {
      setSelectedImage(0);
    }
  }, [productImages.length, selectedImage]);

  // Related products: use CDN chunks (avoids OOM server fetch)
  const allProductsForRelated = cdnProducts && cdnProducts.length > 0
    ? cdnProducts
    : allProducts;

  // Filter related products from the same category
  const relatedAccessoriesAndSpares = useMemo(() => {
    if (!displayProduct) {
      return [];
    }

    // Use allProductsForRelated (fetched specifically for related products)
    const productsToFilter = allProductsForRelated.length > 0 ? allProductsForRelated : allProducts;

    if (productsToFilter.length === 0) {
      return [];
    }

    const currentProductId = displayProduct.id;
    const currentProductCode = displayProduct.code;
    const currentProductSku = displayProduct.sku;
    const currentCategory = displayProduct.category || displayProduct.categoryName;
    const currentCategoryId = displayProduct.categoryId;
    const currentBrand = displayProduct.brand;

    // Normalize category strings to handle "Refrigeration & Ice Machines" vs "Refrigeration And Ice Machines"
    const normalizeCategory = (cat: string) => {
      if (!cat) return '';
      return cat.toLowerCase().replace(/\s+/g, ' ').replace(/\s*&\s*/g, ' and ').trim();
    };

    const currentCatNormalized = normalizeCategory(currentCategory);

    // Filter for products from the same category, preferably same brand
    const sameCategoryProducts = productsToFilter
      .filter(p => {
        // Must not be the current product (check all ID fields)
        const isDifferent =
          p.id !== currentProductId &&
          p.code !== currentProductCode &&
          p.code !== currentProductId &&
          p.sku !== currentProductSku &&
          p.sku !== currentProductId;

        if (!isDifferent) return false;

        // Normalize product categories for comparison
        const productCategoryNormalized = normalizeCategory(p.category || '');
        const productCategoryNameNormalized = normalizeCategory(p.categoryName || '');

        // Check if same category (with normalization to handle & vs and)
        const categoryNameMatch = currentCatNormalized && (
          productCategoryNormalized === currentCatNormalized ||
          productCategoryNameNormalized === currentCatNormalized
        );

        const categoryIdMatch = currentCategoryId && (p.categoryId === currentCategoryId);

        return categoryNameMatch || categoryIdMatch;
      });

    // Prioritize same brand within the same category
    const sameBrandProducts = sameCategoryProducts.filter(p => currentBrand && p.brand === currentBrand);

    // If we have same brand products, prioritize those, otherwise use all same category
    const productsToShow = sameBrandProducts.length > 0 ? sameBrandProducts : sameCategoryProducts;

    // Shuffle to get random products instead of always the same first 4
    const shuffled = [...productsToShow].sort(() => Math.random() - 0.5);
    const filtered = shuffled.slice(0, 4);

    return filtered;
  }, [displayProduct, allProductsForRelated, allProducts]); // Re-calculate when product loads or products list changes

  // Get accessories - ONLY from product's specific accessories field
  const accessories = useMemo(() => {
    if (!displayProduct?.accessories || displayProduct.accessories.length === 0) {
      return [];
    }
    const productsToFilter = allProductsForRelated.length > 0 ? allProductsForRelated : allProducts;
    if (productsToFilter.length === 0) {
      return [];
    }
    return productsToFilter.filter(p => displayProduct.accessories?.includes(p.id));
  }, [displayProduct, allProductsForRelated, allProducts]);

  // ⚡ Show loading state if still loading and no cached version
  const isStillLoading = (loading || apiLoading) && !finalProduct && !cachedProduct;

  if (isStillLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-20">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-slate-200 rounded w-64"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-square bg-slate-200 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-12 bg-slate-200 rounded w-3/4"></div>
              <div className="h-6 bg-slate-200 rounded w-1/4"></div>
              <div className="h-32 bg-slate-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ⚡ Show not found only if we're done loading AND no product found
  if (!displayProduct && !loading && !apiLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-20 text-center">
        <h1 className="text-3xl mb-4">Product Not Found</h1>
        <p className="text-muted-foreground mb-6">
          The product you're looking for (ID/Code: {id}) could not be found in our catalog.
        </p>
        <Link to="/products">
          <Button>
            <ArrowLeft className="mr-2 size-4" />
            Back to Products
          </Button>
        </Link>
      </div>
    );
  }

  const customer = customerData;

  // Check customer pricing level
  const canBuyAtCostPrice = customer?.can_see_cost_price || false;
  const customerDiscountPercentage = customer?.discount_percentage || 0;
  const hasCostPlusHundredAccess = customer?.cost_plus_hundred_access || false;

  // Get the cost price (tradePrice from Uropa API is the supplier's selling price = our cost)
  const productCostPrice = displayProduct.tradePrice || displayProduct.baseCost || displayProduct.costPrice || 0;

  // Universal Cost+$100 logic (all customers, $500–$10,000 product price, toggle on)
  const universalCostPlusEnabled = localStorage.getItem('costplus100_universal_pricing_enabled') !== 'false';
  const productPriceForRange = displayProduct.price || 0;
  const inCostPlusRange = productPriceForRange >= 500 && productPriceForRange <= 10000;
  const showUniversalCostPlus = universalCostPlusEnabled && inCostPlusRange && productCostPrice > 0;

  // Legacy per-customer Cost+$100 (when universal toggle is off)
  const costPlusHundredCategories = ['refrigeration', 'ice machines', 'commercial kitchen machines'];
  const categoryForCostPlusCheck = displayProduct.category?.toLowerCase() || '';
  const isInCostPlusHundredCategory = costPlusHundredCategories.some(cat => categoryForCostPlusCheck.includes(cat));
  const meetsMinimumPriceThreshold = productCostPrice >= 500;
  const showLegacyCostPlus = !universalCostPlusEnabled && hasCostPlusHundredAccess && isInCostPlusHundredCategory && meetsMinimumPriceThreshold;

  const hasPromotion = promotion !== null;
  const promotionalPrice = hasPromotion ? promotion.promotionalPrice : null;
  const promotionalSavings = hasPromotion ? (displayProduct.price - promotion.promotionalPrice) : null;
  const wasPrice = hasPromotion ? displayProduct.price : null;

  // Special discount pricing (from specials system - BOGO, percentage, etc.)
  let specialDiscountPrice = null;
  let specialDiscountSavings = null;
  let specialDiscountPercent = null;
  if (activeSpecial && !hasPromotion) {
    if (activeSpecial.type === 'percentage' && activeSpecial.discountValue) {
      specialDiscountPercent = activeSpecial.discountValue;
      specialDiscountPrice = displayProduct.price * (1 - activeSpecial.discountValue / 100);
      specialDiscountSavings = displayProduct.price - specialDiscountPrice;
    } else if (activeSpecial.type === 'fixed_amount' && activeSpecial.discountValue) {
      specialDiscountPrice = Math.max(0, displayProduct.price - activeSpecial.discountValue);
      specialDiscountSavings = activeSpecial.discountValue;
    }
  }

  // Base price - use size variant price if selected, otherwise use product price
  const basePrice = sizePrice !== null ? sizePrice : displayProduct.price;

  let displayPrice = basePrice;
  let actualSellingPrice = basePrice;
  let priceLabel = 'Price';
  let showCostPrice = false;

  // Priority: Promotional > Special Discount > Universal Cost+$100 > Legacy Cost+$100 > Cost Price > VIP Discount > Regular
  if (hasPromotion) {
    displayPrice = sizePrice !== null ? sizePrice : promotionalPrice!;
    actualSellingPrice = sizePrice !== null ? sizePrice : promotionalPrice!;
    priceLabel = 'Promotional Price';
  } else if (specialDiscountPrice !== null) {
    displayPrice = sizePrice !== null ? sizePrice : specialDiscountPrice;
    actualSellingPrice = sizePrice !== null ? sizePrice : specialDiscountPrice;
    priceLabel = 'Special Price';
  } else if (showUniversalCostPlus) {
    const costPlusHundredPrice = (productCostPrice + 150) * 1.025;
    displayPrice = sizePrice !== null ? sizePrice : costPlusHundredPrice;
    actualSellingPrice = sizePrice !== null ? sizePrice : costPlusHundredPrice;
    priceLabel = 'Cost+$100 Price';
    showCostPrice = true;
  } else if (showLegacyCostPlus) {
    const costPlusHundredPrice = (productCostPrice + 150) * 1.025;
    displayPrice = sizePrice !== null ? sizePrice : costPlusHundredPrice;
    actualSellingPrice = sizePrice !== null ? sizePrice : costPlusHundredPrice;
    priceLabel = 'Your Cost+$100 Price';
    showCostPrice = true;
  } else if (canBuyAtCostPrice) {
    displayPrice = sizePrice !== null ? sizePrice : productCostPrice;
    actualSellingPrice = sizePrice !== null ? sizePrice : productCostPrice;
    priceLabel = 'Your Cost Price';
    showCostPrice = true;
  } else {
    displayPrice = basePrice;
    actualSellingPrice = basePrice;
    priceLabel = customerDiscountPercentage > 0 ? `Price (before ${customerDiscountPercentage}% discount)` : 'Price';
  }

  // Calculate discounted price if customer has discount (only when no promotion)
  const originalPrice = basePrice;
  const discountedPrice = !hasPromotion && customerDiscountPercentage > 0
    ? basePrice * (1 - customerDiscountPercentage / 100)
    : basePrice;

  const handleAddToCart = () => {
    // Check if product has size variants and no size is selected
    if (displayProduct.sizeVariants && displayProduct.sizeVariants.length > 0 && !selectedSize) {
      alert('Please select a size before adding to cart');
      return;
    }

    // Check if product is age restricted
    if (displayProduct.ageRestricted) {
      setPendingCartAction('add');
      setShowAgeRestrictionModal(true);
      return;
    }

    // Attach promotional price, size, and size price to product if they exist
    let productToAdd = { ...displayProduct };

    if (hasPromotion) {
      productToAdd.promotionalPrice = promotion.promotionalPrice;
    }

    if (selectedSize && sizePrice !== null) {
      productToAdd.selectedSize = selectedSize;
      productToAdd.price = sizePrice; // Override price with size-specific price
    }

    addToCart(productToAdd, quantity);
    // Show success feedback (could add a toast here)
  };

  const handleBuyNow = () => {
    // Check if product has size variants and no size is selected
    if (displayProduct.sizeVariants && displayProduct.sizeVariants.length > 0 && !selectedSize) {
      alert('Please select a size before proceeding');
      return;
    }

    // Check if product is age restricted
    if (displayProduct.ageRestricted) {
      setPendingCartAction('buy');
      setShowAgeRestrictionModal(true);
      return;
    }

    // Attach promotional price, size, and size price to product if they exist
    let productToAdd = { ...displayProduct };

    if (hasPromotion) {
      productToAdd.promotionalPrice = promotion.promotionalPrice;
    }

    if (selectedSize && sizePrice !== null) {
      productToAdd.selectedSize = selectedSize;
      productToAdd.price = sizePrice; // Override price with size-specific price
    }

    addToCart(productToAdd, quantity);
    navigate('/checkout');
  };

  const handleAgeRestrictionConfirm = () => {
    setShowAgeRestrictionModal(false);

    // Attach promotional price, size, and size price to product if they exist
    let productToAdd = { ...displayProduct };

    if (hasPromotion) {
      productToAdd.promotionalPrice = promotion.promotionalPrice;
    }

    if (selectedSize && sizePrice !== null) {
      productToAdd.selectedSize = selectedSize;
      productToAdd.price = sizePrice; // Override price with size-specific price
    }

    // Add to cart
    addToCart(productToAdd, quantity);

    // If buy now, navigate to checkout
    if (pendingCartAction === 'buy') {
      navigate('/checkout');
    }

    setPendingCartAction(null);
  };

  const handleAgeRestrictionClose = () => {
    setShowAgeRestrictionModal(false);
    setPendingCartAction(null);
  };

  const incrementQuantity = () => setQuantity(q => q + 1);
  const decrementQuantity = () => setQuantity(q => Math.max(1, q - 1));

  const handlePrevImage = () => {
    if (productImages.length > 0) {
      setSelectedImage((prev) => (prev === 0 ? productImages.length - 1 : prev - 1));
    }
  };

  const handleNextImage = () => {
    if (productImages.length > 0) {
      setSelectedImage((prev) => (prev === productImages.length - 1 ? 0 : prev + 1));
    }
  };

  // Handle size selection
  const handleSizeChange = (size: string, price: number) => {
    setSelectedSize(size);
    setSizePrice(price);
  };

  // Defensive checks for product properties
  const productName = displayProduct?.name || 'Unnamed Product';
  const productPrice = typeof displayProduct?.price === 'number' ? displayProduct.price : parseFloat(String(displayProduct?.price || 0).replace(/[^0-9.-]+/g, '')) || 0;
  const productCategory = displayProduct?.category || 'Uncategorized';
  const productDescription = displayProduct?.description;
  const productBrand = displayProduct?.brand;
  const uropaPromisedDate = displayProduct?.uropaPromisedDate || (displayProduct as any)?.uropa_promised_date || (displayProduct as any)?.promised_date || '';
  const backorderMessage = (displayProduct as any)?.uropaAvailabilityMessage || (displayProduct as any)?.backorderMessage || '';
  const backOrderAvailable = Boolean(
    uropaPromisedDate ||
    ((displayProduct as any)?.uropaMessageEnum === 'AM_ON_BACKORDER' && backorderMessage.toLowerCase() !== 'in stock')
  );
  const promisedDateInFuture = uropaPromisedDate ? new Date(uropaPromisedDate) > new Date() : false;

  const rawInStock = displayProduct?.inStock ?? (displayProduct as any)?.in_stock ?? (displayProduct as any)?.is_in_stock;
  const stockQty = displayProduct?.stockQuantity ?? (displayProduct as any)?.stock_quantity ?? (displayProduct as any)?.stock ?? (displayProduct as any)?.qty;
  const isExplicitOutOfStock = (displayProduct as any)?.out_of_stock === true || (displayProduct as any)?.isOutOfStock === true || (displayProduct as any)?.status === 'OUT_OF_STOCK' || (displayProduct as any)?.availability === 'out of stock' || (displayProduct as any)?.availability === 'Out of Stock';

  let computedInStock = true;
  if (isExplicitOutOfStock) {
    computedInStock = false;
  } else if (rawInStock === false || rawInStock === 'false' || rawInStock === 0) {
    computedInStock = false;
  } else if (typeof stockQty === 'number' && stockQty <= 0) {
    computedInStock = false;
  } else if (rawInStock === true || rawInStock === 'true' || rawInStock === 1) {
    computedInStock = true;
  }

  const productInStock = promisedDateInFuture ? false : computedInStock;
  const productRating = displayProduct?.rating || 4.7;
  const productBrandLogo = displayProduct?.brandLogo || displayProduct?.brandLogoUrl;
  const productCode = displayProduct?.code || displayProduct?.sku || '';

  // Get full category path - try to resolve from category IDs first
  let fullCategoryPath = displayProduct?.wholePath || productCategory;

  // If wholePath is not available, try to build it from category level IDs
  if (!displayProduct?.wholePath || displayProduct?.wholePath === productCategory) {
    const productCategoryIds = [
      (displayProduct as any).categoryLevel1Id,
      (displayProduct as any).categoryLevel2Id,
      (displayProduct as any).categoryLevel3Id,
      (displayProduct as any).categoryLevel4Id,
    ].filter(Boolean);

    // Try to find the full path for the deepest category level
    for (let i = productCategoryIds.length - 1; i >= 0; i--) {
      const categoryId = productCategoryIds[i];
      const resolvedPath = categoryIdToPath.get(categoryId);

      if (resolvedPath) {
        fullCategoryPath = resolvedPath;
        break;
      }
    }
  }

  const categorySegments = fullCategoryPath.split('>').map(s => s.trim()).filter(Boolean);

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC]">
      {/* SEO Meta Tags and Structured Data */}
      {displayProduct && (
        <SEOHead
          title={`${displayProduct.name} - ${displayProduct.brand || 'Commercial Equipment'} | CostPlus Catering Equipment`}
          description={`${displayProduct.description || displayProduct.name} - ${displayProduct.brand ? `${displayProduct.brand} brand. ` : ''}Professional catering equipment for Sydney, Melbourne, Brisbane. ${displayProduct.inStock ? 'In stock.' : ''} Buy online with competitive pricing and Australia-wide delivery.`}
          keywords={`${displayProduct.name}, ${displayProduct.brand || ''}, ${fullCategoryPath.replace(/>/g, ',')}, commercial catering equipment, catering equipment sydney, catering equipment melbourne, catering equipment brisbane, restaurant equipment, hospitality supplies, professional kitchen equipment`}
          image={productImages[0]}
          type="product"
          canonical={`https://costplus100.com.au/products/${id}`}
          schema={{
            '@context': 'https://schema.org',
            '@graph': [
              generateProductSchema(displayProduct),
              generateBreadcrumbSchema([
                { name: 'Home', url: '/' },
                ...categorySegments.map((segment, index) => ({
                  name: segment,
                  url: `/products/c/${categoryToSlug(categorySegments.slice(0, index + 1).join(' > '))}`
                })),
                { name: displayProduct.name, url: `/products/${id}` }
              ])
            ]
          }}
        />
      )}

      {/* ── TOP BREADCRUMB BAR ── */}
      <div className="bg-transparent">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-4 pb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm flex-wrap font-medium text-slate-500">
              <Link to="/" className="hover:text-[#E31837] transition-colors">
                Home
              </Link>
              <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
              {categorySegments.map((segment, index) => (
                <div key={index} className="flex items-center gap-1.5">
                  <Link
                    to={`/products/c/${categoryToSlug(categorySegments.slice(0, index + 1).join(' > '))}`}
                    className="hover:text-[#E31837] transition-colors"
                  >
                    {segment}
                  </Link>
                  <ChevronRight className="size-3.5 text-slate-400 shrink-0" />
                </div>
              ))}
              {/* Product name highlighted in bold red (#E31837) matching Image 3 */}
              <span className="text-[#E31837] font-extrabold truncate max-w-[280px] sm:max-w-md">
                {productName}
              </span>
            </div>

            {/* Refresh Button */}
            {refreshData && (
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setRefreshing(true);
                  try {
                    localStorage.removeItem('cms_data_cache');
                    localStorage.removeItem('cms_cache_timestamp');
                    await refreshData();
                  } catch (error) {
                    console.error('Failed to refresh data:', error);
                  } finally {
                    setRefreshing(false);
                  }
                }}
                disabled={refreshing}
                className="flex items-center gap-2 text-xs"
              >
                <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN PRODUCT DETAILS SECTION (EXACT MATCH OF SCREENSHOT) ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ── LEFT COLUMN: PRODUCT GALLERY CARD (MATCHING SCREENSHOT) ── */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs flex flex-col justify-between">
            {/* Main Big Image Box with Red "LOW PRICE" Badge & Amazon-Style Magnifier */}
            <div
              className="relative w-full h-[320px] sm:h-[420px] bg-white rounded-xl p-4 flex items-center justify-center overflow-hidden cursor-zoom-in group"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onMouseMove={handleMouseMove}
              onClick={() => {
                setZoomImageIndex(selectedImage);
                setShowImageZoom(true);
              }}
            >
              {/* Top-Left OUT OF STOCK / LOW PRICE Badge */}
              <div className="absolute top-3 left-3 z-10 pointer-events-none">
                {!productInStock ? (
                  <span className="bg-red-600 hover:bg-red-600 text-white font-extrabold text-[10px] sm:text-xs px-2.5 py-1 rounded-md shadow-xs uppercase tracking-wider">
                    OUT OF STOCK
                  </span>
                ) : (
                  <span className="bg-[#E31837] text-white font-extrabold text-[10px] sm:text-xs px-2.5 py-1 rounded-md shadow-xs uppercase tracking-wider">
                    LOW PRICE
                  </span>
                )}
              </div>

              {/* Special Badge if any */}
              {specialBadge && (
                <Badge
                  className="absolute top-3 right-3 font-bold z-10 text-xs px-2.5 py-1 pointer-events-none"
                  style={{ backgroundColor: specialBadge.color, color: 'white' }}
                >
                  {specialBadge.text}
                </Badge>
              )}

              {/* Zoom Instruction Hint Badge (Shows on hover) */}
              <div className="absolute bottom-3 right-3 z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full backdrop-blur-xs flex items-center gap-1">
                <ZoomIn className="size-3" /> Hover to Zoom
              </div>

              {/* Main Product Image with Amazon-Style Dynamic Mouse Tracking Magnifier */}
              <img
                src={productImages[selectedImage]}
                alt={productName}
                className="w-full h-full object-contain transition-transform duration-150 ease-out select-none"
                style={{
                  transform: isHovered ? 'scale(2.5)' : 'scale(1)',
                  transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`
                }}
              />
            </div>

            {/* Horizontal Thumbnail Strip Flanked with < and > Arrows (Red Highlighted Active Border) */}
            <div className="flex items-center justify-center gap-3 mt-5">
              {productImages.length > 1 && (
                <button
                  onClick={handlePrevImage}
                  className="size-7 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                  aria-label="Previous Image"
                >
                  <ChevronLeft className="size-4 stroke-[2.5]" />
                </button>
              )}

              <div className="flex items-center justify-center gap-3 flex-wrap">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(idx);
                    }}
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden transition-all cursor-pointer p-1 bg-white ${
                      selectedImage === idx
                        ? 'border-2 border-[#E31837] shadow-sm'
                        : 'border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${productName} thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>

              {productImages.length > 1 && (
                <button
                  onClick={handleNextImage}
                  className="size-7 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-slate-900 flex items-center justify-center cursor-pointer shrink-0 transition-colors"
                  aria-label="Next Image"
                >
                  <ChevronRight className="size-4 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>

          {/* ── RIGHT COLUMN: PRODUCT INFO & PRICING (COMPACT & BALANCED) ── */}
          <div className="lg:col-span-6 space-y-3.5">
            
            {/* Brand Logo */}
            {productBrand && (
              <div className="mb-1">
                {productBrandLogo ? (
                  <img
                    src={productBrandLogo}
                    alt={productBrand}
                    className="h-8 object-contain max-w-[120px]"
                  />
                ) : (
                  <span className="text-[11px] font-black text-[#0284C7] uppercase tracking-wider block">
                    {productBrand}
                  </span>
                )}
              </div>
            )}

            {/* Product Title Section */}
            <div>
              <div className="flex items-start gap-2">
                <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-[#0F172A] tracking-tight leading-snug flex-1">
                  {productName}
                </h1>
                {displayProduct.ageRestricted && (
                  <Badge className="bg-orange-500 hover:bg-orange-500 font-bold text-[10px] px-2 py-0.5 shrink-0">
                    🔞 18+ Only
                  </Badge>
                )}
              </div>


              {/* Rating + Reviews + Wishlist & Share Row */}
              <div className="flex items-center justify-between pt-2.5 border-b border-slate-200/60 pb-2.5 mt-1">
                <div className="flex items-center gap-2.5 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="flex items-center text-amber-400">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`size-3.5 ${i < Math.floor(productRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-slate-900 ml-1">{productRating}</span>
                    <span className="text-slate-400 font-medium">(24 reviews)</span>
                  </div>
                  <span className="text-slate-300">|</span>
                  <button className="text-slate-600 hover:text-[#E31837] font-semibold text-[11px] transition-colors cursor-pointer">
                    Write a review
                  </button>
                </div>

                {/* Wishlist & Share Action Buttons */}
                <div className="flex items-center gap-3 text-slate-500">
                  <button className="hover:text-[#E31837] transition-colors cursor-pointer" title="Add to Wishlist">
                    <Heart className="size-4 stroke-[2]" />
                  </button>
                  <button className="hover:text-[#E31837] transition-colors cursor-pointer" title="Share Product">
                    <Share2 className="size-4 stroke-[2]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Pricing Section */}
            <div className="space-y-1.5">              
              {hasPromotion ? (
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs text-slate-400 font-semibold">Retail Price</span>
                    <span className="text-base text-slate-400 line-through font-bold">${wasPrice!.toFixed(2)}</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-[#E31837]">${displayPrice.toFixed(2)}</span>
                    <span className="bg-[#E31837] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">SAVE ${promotionalSavings!.toFixed(2)}</span>
                    <span className="text-xs font-bold text-slate-500">ex GST</span>
                  </div>
                </div>
              ) : (showUniversalCostPlus || showLegacyCostPlus) ? (
                <div>
                  {displayProduct.price > displayPrice && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs text-slate-400 font-semibold">Retail Price</span>
                      <span className="text-lg text-slate-400 line-through font-bold">${displayProduct.price.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-black text-[#E31837]">${displayPrice.toFixed(2)}</span>
                   <span className="text-xs font-bold text-slate-500">ex GST</span>

                    <span className="bg-[#8B5CF6] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">COSTPlUS100 Price</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-black text-[#E31837]">${displayPrice.toFixed(2)}</span>
                  <span className="text-xs font-bold text-slate-500">ex GST</span>
                </div>
              )}


              {/* Product Code & Stock Status */}
              <div className="space-y-1 pt-0.5">
                {productCode && (
                  <div className="text-xs font-medium text-slate-600">
                    Product Code: <span className="font-extrabold text-slate-900">{productCode}</span>
                  </div>
                )}
                {productInStock && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <CheckCircle2 className="size-3.5 fill-emerald-600 text-white shrink-0" />
                    <span>In Stock</span>
                  </div>
                )}
                {backOrderAvailable && (
                  <div className="flex flex-col gap-1 py-2 px-3 bg-amber-50 border border-amber-200 rounded mt-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-bold text-amber-800">{backorderMessage}</span>
                    </div>
                    {uropaPromisedDate && (
                      <span className="text-[11px] text-amber-700 font-medium pl-6">
                        Expected: {new Date(uropaPromisedDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                )}
                {!productInStock && !backOrderAvailable && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 mt-1">
                    <X className="size-3.5 text-red-600 shrink-0" />
                    <span>Out of Stock</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quantity Selector Row */}
            <div className="pt-1">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-extrabold text-slate-900 uppercase tracking-wider">Quantity</span>
                <div className="flex items-center border border-slate-200 rounded-xl bg-white h-9 shadow-2xs">
                  <button
                    onClick={decrementQuantity}
                    className="h-full px-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors rounded-l-xl font-extrabold cursor-pointer text-sm"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-8 text-center text-xs font-extrabold text-slate-900 outline-none"
                  />
                  <button
                    onClick={incrementQuantity}
                    className="h-full px-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors rounded-r-xl font-extrabold cursor-pointer text-sm"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons Row (Red Add to Cart + Dark Navy Buy Now with Lightning Icon) */}
            <div className="pt-1">
              <div className="flex items-center gap-3">
                {/* Add to Cart Button (Always Red Add to Cart; Masked & Disabled when Not in Stock) */}
                <Button
                  size="lg"
                  className={`flex-1 h-11 font-extrabold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 ${
                    !productInStock && !backOrderAvailable
                      ? 'bg-[#E31837] opacity-50 pointer-events-none cursor-not-allowed shadow-none text-white'
                      : 'bg-[#E31837] hover:bg-[#C8102E] text-white cursor-pointer shadow-md'
                  }`}
                  onClick={handleAddToCart}
                  disabled={!productInStock && !backOrderAvailable}
                >
                  <ShoppingCart className="size-4" />
                  <span>Add to Cart</span>
                </Button>

                {/* Buy Now Button (Dark Navy with Lightning Icon; Masked & Disabled when Not in Stock) */}
                <Button
                  size="lg"
                  className={`flex-1 h-11 font-extrabold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-2 ${
                    !productInStock && !backOrderAvailable
                      ? 'bg-[#0B132A] opacity-50 pointer-events-none cursor-not-allowed shadow-none text-white'
                      : 'bg-[#0B132A] hover:bg-slate-800 text-white cursor-pointer shadow-md'
                  }`}
                  onClick={handleBuyNow}
                  disabled={!productInStock && !backOrderAvailable}
                >
                  <Zap className="size-4 fill-white text-white" />
                  <span>Buy Now</span>
                </Button>
              </div>
            </div>

            {/* Secure Payment Logos */}
            <div className="mt-3 border border-slate-200/80 rounded-xl p-3 bg-slate-50/50">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Secure Payment</div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <img src="/pyamentimages/visa.png" alt="Visa" className="h-7 object-contain rounded px-0.5" />
                <img src="/pyamentimages/mastercard.png" alt="Mastercard" className="h-7 object-contain rounded px-0.5" />
                <img src="/pyamentimages/amercianexpress.png" alt="American Express" className="h-7 object-contain rounded px-0.5" />
                <img src="/pyamentimages/gpay.png" alt="Google Pay" className="h-7 object-contain rounded px-0.5" />
              </div>
            </div>

          </div>
        </div>

        {/* ── 3-TAB SYSTEM: DESCRIPTION | SPECIFICATION | REVIEWS (MATCHING USER SCREENSHOTS) ── */}
        <div className="mt-10 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Tab Navigation Headers */}
          <div className="flex items-center gap-8 px-6 sm:px-8 border-b border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('description')}
              className={`py-4 font-bold text-sm sm:text-base cursor-pointer transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'description'
                  ? 'border-[#E31837] text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Description
            </button>

            <button
              onClick={() => setActiveTab('specification')}
              className={`py-4 font-bold text-sm sm:text-base cursor-pointer transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'specification'
                  ? 'border-[#E31837] text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Specification
            </button>

            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-4 font-bold text-sm sm:text-base cursor-pointer transition-all border-b-2 whitespace-nowrap ${
                activeTab === 'reviews'
                  ? 'border-[#E31837] text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              Reviews (3)
            </button>
          </div>

          {/* Tab 1: Description */}
          {activeTab === 'description' && (
            <div className="p-6 sm:p-8 space-y-4 leading-relaxed text-slate-600 text-sm">
              <h3 className="text-base font-bold text-slate-900 mb-2">Product Description</h3>
              {productDescription ? (
                <div dangerouslySetInnerHTML={{ __html: productDescription }} />
              ) : (
                <p className="text-slate-600">
                  Professional-grade {productName} engineered for commercial food service kitchens. Designed for high performance, reliability, and daily commercial operation.
                </p>
              )}
            </div>
          )}

          {/* Tab 2: Specification (Side-by-Side 2-Column Desktop Grid in Image Box Style) */}
          {activeTab === 'specification' && (() => {
            const specItems: Array<{ label: string; value: string }> = [
              { label: 'Category', value: productCategory }
            ];

            if (productBrand) specItems.push({ label: 'Brand', value: productBrand });
            if (productCode) specItems.push({ label: 'SKU / Code', value: productCode });
            specItems.push({ label: 'Stock Status', value: 'In Stock' });

            if (displayProduct.specifications && Array.isArray(displayProduct.specifications)) {
              displayProduct.specifications
                .filter((spec: any) => {
                  const label = typeof spec === 'object' ? (spec.name || spec.label || spec.key) : '';
                  const labelStr = label ? String(label).toLowerCase() : '';
                  return !['clearance category', 'featured product', 'type', 'internal'].some(f => labelStr.includes(f));
                })
                .forEach((spec: any, idx: number) => {
                  const label = typeof spec === 'object' ? (spec.name || spec.label || spec.key) : `Spec ${idx + 1}`;
                  const val = typeof spec === 'object' ? (spec.value || spec.val || spec.data) : String(spec);
                  specItems.push({ label: String(label), value: String(val) });
                });
            } else if (displayProduct.specifications && typeof displayProduct.specifications === 'object') {
              Object.entries(displayProduct.specifications).forEach(([k, v]) => {
                specItems.push({ label: String(k), value: String(v) });
              });
            }

            const half = Math.ceil(specItems.length / 2);
            const leftItems = specItems.slice(0, half);
            const rightItems = specItems.slice(half);

            return (
              <div className="p-6 sm:p-8">
                <p className="text-xs sm:text-sm font-semibold text-slate-500 mb-5">
                  Specifications of <span className="text-slate-900 font-bold">{productName}</span>
                </p>

                {/* Side-by-Side 2-Column Grid on Desktop */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Left Column Table (Reference Image Box Style) */}
                  <div className="border border-slate-200/90 rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-xs sm:text-sm border-collapse">
                      <tbody className="divide-y divide-slate-200/80">
                        {leftItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                            <td className="w-5/12 sm:w-4/12 py-3.5 px-5 font-medium text-slate-500 border-r border-slate-200/80">
                              {item.label}
                            </td>
                            <td className="py-3.5 px-5 font-medium text-slate-700">
                              {item.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Right Column Table (Reference Image Box Style) */}
                  <div className="border border-slate-200/90 rounded-lg overflow-hidden bg-white">
                    <table className="w-full text-xs sm:text-sm border-collapse">
                      <tbody className="divide-y divide-slate-200/80">
                        {rightItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/40 transition-colors">
                            <td className="w-5/12 sm:w-4/12 py-3.5 px-5 font-medium text-slate-500 border-r border-slate-200/80">
                              {item.label}
                            </td>
                            <td className="py-3.5 px-5 font-medium text-slate-700">
                              {item.value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                </div>
              </div>
            );
          })()}

          {/* Tab 3: Reviews (Upgraded Premium Design) */}
          {activeTab === 'reviews' && (
            <div className="p-6 sm:p-8 space-y-8">
              
              {/* Rating Summary Banner Card */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100/60 border border-slate-200/80 rounded-2xl p-6 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  
                  {/* Average Rating Big Score */}
                  <div className="md:col-span-4 flex items-center gap-4">
                    <div className="size-20 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-center">
                      <span className="text-5xl font-black text-slate-900">
                        5
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Average Rating</div>
                      <div className="flex items-center gap-1 text-amber-400 mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                      <div className="text-xs font-semibold text-slate-500 mt-1">
                        Based on <span className="text-slate-900 font-bold">3 verified reviews</span>
                      </div>
                    </div>
                  </div>

                  {/* Rating Breakdown Progress Bars */}
                  <div className="md:col-span-4 space-y-2 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-amber-500 font-bold shrink-0">5 ★★★★★</span>
                      <div className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full w-full"></div>
                      </div>
                      <span className="w-9 text-right font-bold text-slate-700">100%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-slate-400 font-bold shrink-0">4 ★★★★☆</span>
                      <div className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full w-0"></div>
                      </div>
                      <span className="w-9 text-right font-medium text-slate-400">0%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-slate-400 font-bold shrink-0">3 ★★★☆☆</span>
                      <div className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full w-0"></div>
                      </div>
                      <span className="w-9 text-right font-medium text-slate-400">0%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-slate-400 font-bold shrink-0">2 ★★☆☆☆</span>
                      <div className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full w-0"></div>
                      </div>
                      <span className="w-9 text-right font-medium text-slate-400">0%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-14 text-slate-400 font-bold shrink-0">1 ★☆☆☆☆</span>
                      <div className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400 rounded-full w-0"></div>
                      </div>
                      <span className="w-9 text-right font-medium text-slate-400">0%</span>
                    </div>
                  </div>

                  {/* Login Prompt / Write Review Box */}
                  <div className="md:col-span-4 bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs text-center">
                    {customerData ? (
                      <div>
                        <p className="text-xs font-medium text-slate-600 mb-3">
                          Logged in as <span className="font-bold text-slate-900">{customerData.name || customerData.email}</span>
                        </p>
                        <Button className="w-full bg-[#E31837] hover:bg-[#C8102E] text-white font-extrabold text-xs py-2.5 rounded-xl cursor-pointer shadow-sm">
                          Write a Review
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 mb-1">
                          Share your experience
                        </p>
                        <p className="text-xs text-slate-500 font-medium mb-3">
                          To give a review, you need to login first.
                        </p>
                        <button
                          onClick={() => navigate('/login')}
                          className="w-full border-2 border-slate-900 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2 text-xs font-extrabold transition-all cursor-pointer shadow-xs"
                        >
                          Login to Review
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Product Reviews List Cards */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-base font-extrabold text-slate-900">
                    Customer Feedback <span className="text-xs font-bold text-slate-400 ml-1">(3)</span>
                  </h4>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-md border border-slate-200/60 flex items-center gap-1.5 cursor-pointer hover:bg-slate-200/60 transition-colors">
                    Filter: 5 Star Reviews ▾
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Review Card 1 */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-3 hover:border-slate-300 transition-all">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="size-11 rounded-full overflow-hidden border border-slate-200 shrink-0">
                          <img
                            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                            alt="Ivor Barber"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-sm font-extrabold text-slate-900">Ivor Barber Lesley Figueroa</h5>
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                              ✔ Verified Purchase
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Reviewed on 4-8-2026</div>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                      "I appreciated the choice. Great value for money. Delivery was fast to Sydney and the equipment arrived in perfect commercial condition!"
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
                      <span className="text-[11px] font-medium">Was this review helpful?</span>
                      <button className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#E31837] bg-slate-50 hover:bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/80 transition-colors cursor-pointer">
                        👍 Helpful (12)
                      </button>
                    </div>
                  </div>

                  {/* Review Card 2 */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-3 hover:border-slate-300 transition-all">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className="size-11 rounded-full overflow-hidden border border-slate-200 shrink-0">
                          <img
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                            alt="Blaine Keller"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="text-sm font-extrabold text-slate-900">Blaine Keller</h5>
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-200/60 flex items-center gap-1">
                              ✔ Verified Purchase
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-medium mt-0.5">Reviewed on 31-7-2026</div>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                      "I appreciated this buy! Excellent experience with the Cost+$100 pricing transparency. Will definitely reorder for our next commercial kitchen setup."
                    </p>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
                      <span className="text-[11px] font-medium">Was this review helpful?</span>
                      <button className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#E31837] bg-slate-50 hover:bg-slate-100 px-3 py-1 rounded-lg border border-slate-200/80 transition-colors cursor-pointer">
                        👍 Helpful (9)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Accessories - Show product-specific accessories first, then related products from same category */}
        {accessories.length > 0 ? (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-[#2D3748]">
              Recommended Accessories
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {accessories.map((accessory) => (
                <ProductCard key={accessory.id} product={accessory} />
              ))}
            </div>
          </div>
        ) : null}

        {relatedAccessoriesAndSpares.length > 0 ? (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-[#2D3748]">
              {displayProduct?.category || displayProduct?.categoryName
                ? `More ${displayProduct.category || displayProduct.categoryName} Products`
                : 'Related Products'}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {relatedAccessoriesAndSpares.map((relatedProduct) => (
                <ProductCard key={relatedProduct.id} product={relatedProduct} />
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Age Restriction Modal */}
      <AgeRestrictionModal
        isOpen={showAgeRestrictionModal}
        onClose={handleAgeRestrictionClose}
        onConfirm={handleAgeRestrictionConfirm}
        productName={productName}
      />

      {/* ── IMAGE ZOOM LIGHTBOX MODAL (SEMI-TRANSPARENT GLASSMORPHIC DESIGN) ── */}
      {showImageZoom && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
          onClick={() => setShowImageZoom(false)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100/80 flex flex-col items-center justify-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowImageZoom(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 size-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 flex items-center justify-center cursor-pointer transition-all hover:scale-105 z-20 shadow-xs"
              aria-label="Close Lightbox"
            >
              <X className="size-5 stroke-[2.5]" />
            </button>

            {/* Product Title Header */}
            <div className="w-full text-center mb-4 pr-8 pl-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900 truncate max-w-lg mx-auto">
                {productName}
              </h3>
            </div>

            {/* Image Preview Stage */}
            <div className="relative w-full h-[55vh] sm:h-[65vh] bg-[#F8FAFC] rounded-2xl p-4 sm:p-8 flex items-center justify-center overflow-hidden border border-slate-100">
              {/* Previous Button */}
              {productImages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomImageIndex((prev) =>
                      prev === 0 ? productImages.length - 1 : prev - 1
                    );
                  }}
                  className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 size-11 rounded-full bg-white/90 hover:bg-white border border-slate-200 shadow-md text-slate-800 flex items-center justify-center transition-all hover:scale-110 cursor-pointer z-10"
                  aria-label="Previous Image"
                >
                  <ChevronLeft className="size-6 stroke-[2.5]" />
                </button>
              )}

              {/* Product Image */}
              <img
                src={productImages[zoomImageIndex]}
                alt={`${productName} - Image ${zoomImageIndex + 1}`}
                className="max-w-full max-h-full object-contain drop-shadow-sm select-none"
              />

              {/* Next Button */}
              {productImages.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setZoomImageIndex((prev) =>
                      prev === productImages.length - 1 ? 0 : prev + 1
                    );
                  }}
                  className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 size-11 rounded-full bg-white/90 hover:bg-white border border-slate-200 shadow-md text-slate-800 flex items-center justify-center transition-all hover:scale-110 cursor-pointer z-10"
                  aria-label="Next Image"
                >
                  <ChevronRight className="size-6 stroke-[2.5]" />
                </button>
              )}

              {/* Image Counter Badge */}
              {productImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-slate-900/90 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-full shadow-md backdrop-blur-xs">
                  {zoomImageIndex + 1} / {productImages.length}
                </div>
              )}
            </div>

            {/* Thumbnail Navigation Strip inside Modal */}
            {productImages.length > 1 && (
              <div className="flex items-center justify-center gap-2.5 mt-4 overflow-x-auto w-full p-1">
                {productImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setZoomImageIndex(idx)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden transition-all cursor-pointer p-1 bg-white shrink-0 ${
                      zoomImageIndex === idx
                        ? 'border-2 border-[#E31837] shadow-sm ring-2 ring-[#E31837]/20 scale-105'
                        : 'border border-slate-200 hover:border-slate-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}