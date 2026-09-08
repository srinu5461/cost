import { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { useCMS } from '../context/CMSContext';
import { useCart } from '../context/CartContext';
import { useProducts } from '../../hooks/useProducts';


import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { ChevronLeft, ChevronRight, ChevronDown, Menu, ShieldCheck, Truck, CreditCard, HeadphonesIcon, Award, TrendingUp, ArrowRight, Phone, Mail, Search, X, ShoppingCart, Plus, Minus, Armchair, ChefHat, Snowflake, Coffee, Sparkles, Utensils, Umbrella, Baby, Grid3x3, Eye, CheckCircle2, Wine, Package, Shirt, BookOpen, Home as HomeIcon, Tag, User, Crown, Shield, Box, Users, Star, Headphones, DollarSign } from 'lucide-react';

import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';


import { projectId, publicAnonKey } from '/utils/supabase/info';
import { fetchWithRetry, getOptimizedImageUrl } from '../utils/env';
import { logger } from '../utils/logger';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { updateSEOTags, homepageSEO } from '../utils/seo';
import { SEOHead, generateOrganizationSchema, generateLocalBusinessSchema } from '../components/SEOHead';
import { heroConfig } from '../../config/hero';
import heroBannerImg from '../../imports/hero-banner.png';
import { buildCategoryTree } from '../utils/categoryTree';
import { categoryToSlug } from '../utils/slugify';
import { staticCategories } from '../../config/categories';
import { TrustBadges } from '../components/TrustBadges';
import { FeaturedEquipmentCard } from '../components/FeaturedEquipmentCard';
import { MultiBuyEquipmentCard } from '../components/MultiBuyEquipmentCard';
// Convert Supabase Storage URLs to WebP using image transformation API
function toWebP(url: string, width?: number): string {
  if (!url || !url.includes('supabase.co/storage')) return url;
  const params = new URLSearchParams();
  params.set('format', 'webp');
  params.set('quality', '95');
  if (width) params.set('width', String(Math.round(width * 1.5)));
  return `${url}?${params.toString()}`;
}


const categoryIconMap: Record<string, any> = {
  Armchair: Armchair,
  ChefHat: ChefHat,
  Snowflake: Snowflake,
  Coffee: Coffee,
  Wine: Wine,
  Package: Package,
  Shirt: Shirt,
  Sparkles: Sparkles,
  Utensils: Utensils,
  Umbrella: Umbrella,
  Baby: Baby,
  Grid3x3: Grid3x3,
};


// ⚡ CACHE KEYS
const CACHE_KEY_HOMEPAGE = 'costplus100_homepage_data';
const CACHE_KEY_TIMESTAMP = 'costplus100_homepage_timestamp';
const CACHE_KEY_VERSION = 'costplus100_homepage_cache_version';
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

// ⚡ INSTANT CACHE: Try to load from localStorage first
const getCachedData = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY_HOMEPAGE);
    const timestamp = localStorage.getItem(CACHE_KEY_TIMESTAMP);
    const version = localStorage.getItem(CACHE_KEY_VERSION);

    if (cached && timestamp && version) {
      const age = Date.now() - parseInt(timestamp);
      if (age < CACHE_DURATION) {
        return JSON.parse(cached);
      }
    }
  } catch (error) {
    // Ignore cache errors
  }
  return null;
};

// ⚡ Save to cache
const setCachedData = (data: any) => {
  try {
    localStorage.setItem(CACHE_KEY_HOMEPAGE, JSON.stringify(data));
    localStorage.setItem(CACHE_KEY_TIMESTAMP, Date.now().toString());
    localStorage.setItem(CACHE_KEY_VERSION, '1.0.0'); // Add a version number
  } catch (error) {
    // Ignore cache errors
  }
};

let renderCount = 0;
let featuredLoaded = false; // module-level flag: prevent re-fetching featured IDs on navigation back

export function Home() {
  renderCount++;
  console.log(`🏠 HOME RENDER #${renderCount}`);
  // ✅ Get metadata from CMS (categories, header, footer)
  let data, cmsLoading;
  try {
    const cms = useCMS();
    data = cms.data;
    cmsLoading = cms.loading;
  } catch (e) {
    logger.error('Home: CMSProvider not available, using empty data');
    data = {
      products: [],
      categories: [],
      categoryTree: [],
      header: { logo: '', phone: '', workingHours: '', navigation: [] },
      footer: { about: '', email: '', phone: '', address: '', socialMedia: {} },
      homepage: { hero: { title: '', subtitle: '', image: '' }, features: [] },
    };
    cmsLoading = false;
  }

  // ⚡ Load products from CDN (already cached by React Query)
  const { data: productsFromCDN, isLoading: productsLoading } = useProducts();
  const { addToCart } = useCart();
  const products = productsFromCDN || [];

  // Build hierarchical category tree (Level 1 -> Level 2 -> Level 3)
  const fullCategoryTree = useMemo(() => {
    return buildCategoryTree(data.categoryTree || []);
  }, [data.categoryTree]);

  const staticCategoryNodes = useMemo(() => {
    return staticCategories.map(cat => ({
      name: cat.name,
      slug: cat.slug,
      code: cat.slug,
      path: cat.path,
      fullPath: cat.path,
      level: 1,
      parent: '',
      imageUrl: '',
      productCount: 0,
      hasChildren: false,
      children: [],
      enabled: cat.enabled
    }));
  }, []);

  const categoryTree = fullCategoryTree.length > 0 ? fullCategoryTree : staticCategoryNodes;
  const topLevelCategories = categoryTree.filter(cat => cat.enabled !== false);

  // Use categories from CMSContext
  useEffect(() => {
    if (data.categories && data.categories.length > 0) {
      setHomepageCategories(data.categories);
    }
    if (data.categoryTree && data.categoryTree.length > 0) {
      setHomepageCategoryTree(data.categoryTree);
    }
  }, [data.categories, data.categoryTree]);

  // ⚡ ENABLE CACHE: Load from cache first for instant display
  // Check cache on mount - load cached data immediately if available
  useEffect(() => {
    const cachedData = getCachedData();
    if (cachedData && products && products.length > 0) {
      console.log('⚡ INSTANT CACHE HIT: Loading from localStorage');

      // Load cached IDs and filter from current products
      const featuredIds = cachedData.featuredIds || [];
      const popularIds = cachedData.popularIds || [];
      const promotionIds = cachedData.promotionIds || [];

      const cached = {
        featured: products.filter((p: any) =>
          featuredIds.includes(p.code) || featuredIds.includes(p.id)
        ).sort((a: any, b: any) => {
          const priceA = parseFloat(a.price || a.standardPrice || 0);
          const priceB = parseFloat(b.price || b.standardPrice || 0);
          return priceB - priceA; // High to low
        }).slice(0, 20),
        popular: products.filter((p: any) =>
          popularIds.includes(p.code) || popularIds.includes(p.id)
        ).slice(0, 20),
        promotional: products.filter((p: any) =>
          promotionIds.includes(p.code) || promotionIds.includes(p.id)
        ).slice(0, 20),
        banners: cachedData.banners || [],
        sectionsConfig: cachedData.sectionsConfig || []
      };

      setFeaturedProducts(cached.featured);
      setPopularProducts(cached.popular);
      setPromotionalProducts(cached.promotional);
      setSectionsConfig(cached.sectionsConfig);
      setSectionsLoaded(true);

      // Only set banners after checking if they're valid
      if (cached.banners && cached.banners.length > 0) {
        // Filter to only valid banners
        const validBanners = cached.banners.filter((b: any) =>
          b.active !== false &&
          b.image &&
          b.image.trim() !== '' &&
          !b.image.includes('placeholder') &&
          (b.image.startsWith('http') || b.image.startsWith('data:') || b.image.startsWith('/'))
        );

        if (validBanners.length > 0) {
          setBanners(validBanners);
          // Delay showing carousel to allow static banner to render first
          setTimeout(() => {
            setBannersLoaded(true);
          }, 500);
        }
      }
    }
  }, [products.length]); // Run when products load

  const [featuredProducts, setFeaturedProductsRaw] = useState<any[]>([]);
  const [popularProducts, setPopularProductsRaw] = useState<any[]>([]);
  const [promotionalProducts, setPromotionalProductsRaw] = useState<any[]>([]);
  const [forceRenderKey, setForceRenderKey] = useState(0);
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<any | null>(null);
  const [hoveredSubCategory, setHoveredSubCategory] = useState<any | null>(null);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const categorySlidesToShow = useMemo(() => {
    if (windowWidth < 480) return 2;
    if (windowWidth < 640) return 3;
    if (windowWidth < 768) return 4;
    if (windowWidth < 1024) return 5;
    return 6;
  }, [windowWidth]);

  const productSlidesToShow = useMemo(() => {
    if (windowWidth < 640) return 1;
    if (windowWidth < 768) return 2;
    if (windowWidth < 1024) return 3;
    return 4;
  }, [windowWidth]);

  const promoSlidesToShow = useMemo(() => {
    if (windowWidth < 600) return 1;
    if (windowWidth < 1220) return 2;
    return 3;
  }, [windowWidth]);

  useEffect(() => {
    const handleToggleProfileSidebar = () => {
      setIsProfileDrawerOpen(prev => !prev);
    };

    window.addEventListener('toggleProfileSidebar', handleToggleProfileSidebar);
    return () => window.removeEventListener('toggleProfileSidebar', handleToggleProfileSidebar);
  }, []);
  const [expandedDrawerCategories, setExpandedDrawerCategories] = useState<Record<string, boolean>>({});

  const toggleDrawerCategory = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedDrawerCategories(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  useEffect(() => {
    const handleToggleCategorySidebar = (e: any) => {
      if (e?.detail?.open !== undefined) {
        setIsSidebarOpen(e.detail.open);
      } else {
        setIsSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('toggleCategorySidebar', handleToggleCategorySidebar);
    return () => window.removeEventListener('toggleCategorySidebar', handleToggleCategorySidebar);
  }, []);




  // Wrap setters to log every state change
  const setFeaturedProducts = (data: any[]) => {
    console.log('📝 setFeaturedProducts called with:', data.length, 'items, first:', data[0]?.code);
    if (data.length > 0 && data[0]?.code) {
      console.log('   Full codes:', data.map(p => p.code).slice(0, 5).join(', '));
    }
    setFeaturedProductsRaw(data);
  };

  const setPopularProducts = (data: any[]) => {
    console.log('📝 setPopularProducts called with:', data.length, 'items, first:', data[0]?.code);
    setPopularProductsRaw(data);
  };

  const setPromotionalProducts = (data: any[]) => {
    console.log('📝 setPromotionalProducts called with:', data.length, 'items, first:', data[0]?.code);
    setPromotionalProductsRaw(data);
  };
  const [homepageCategories, setHomepageCategories] = useState<string[]>([]);
  const [homepageCategoryTree, setHomepageCategoryTree] = useState<any[]>([]);

  // ⚡ LOAD BANNERS: Start from localStorage cache instantly to prevent image flashing on refresh
  const [banners, setBanners] = useState<any[]>(() => {
    try {
      const cached = getCachedData();
      if (cached?.banners && cached.banners.length > 0) {
        return cached.banners.filter((b: any) =>
          b.active !== false &&
          b.image &&
          b.image.trim() !== '' &&
          !b.image.includes('placeholder') &&
          (b.image.startsWith('http') || b.image.startsWith('data:'))
        );
      }
    } catch (e) { }
    return [];
  });
  const [bannersLoaded, setBannersLoaded] = useState(true);

  const [sectionsLoaded, setSectionsLoaded] = useState(false);
  const [sectionsConfig, setSectionsConfig] = useState<any[]>([]);

  // ⚡ STATIC HERO: Use as fallback only when no banners
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef<any>(null);
  const featuredSliderRef = useRef<any>(null);
  const multiBuySliderRef = useRef<any>(null);
  const polarSliderRef = useRef<any>(null);
  const thorSliderRef = useRef<any>(null);
  const categorySliderRef = useRef<any>(null);
  const categoryContainerRef = useRef<HTMLDivElement>(null);

  // State for Popular Departments section tabs
  const [popularTab, setPopularTab] = useState<'new' | 'popular' | 'featured' | 'flash'>('new');

  // Auto-rotating brands index (rotates every 3 seconds to cover all brands)
  const [brandOffset, setBrandOffset] = useState(0);
  const [brandSlideState, setBrandSlideState] = useState<'idle' | 'out' | 'in'>('idle');




  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryContainerRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300;
      categoryContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };






  // ⚡ Carousel Auto-play Interval for Hero Banner Slides
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 4500);
    return () => clearInterval(timer);
  }, []);


  // ✅ DEBUG: Track loading errors for production debugging
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>({});
  const lastFetchTimeRef = useRef<number>(0);

  // ✅ REMOVED: Don't show cached banners immediately - always load fresh from server
  // This ensures static banner shows first while carousel loads

  // ⚡ Load featured product IDs from dedicated CDN file, but use CDN chunk product
  // data for prices so they stay in sync with sync-products (not sync-featured).
  useEffect(() => {
    // Only run once per browser session — prevents re-fetch on navigation back causing product flicker
    if (featuredLoaded) return;

    const loadFeaturedFromCDN = async () => {
      try {
        const urlRes = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/featured-url`,
          { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
        );
        if (!urlRes.ok) return;
        const { url } = await urlRes.json();
        if (!url) return;

        const dataRes = await fetch(url, { cache: 'no-store' });
        if (!dataRes.ok) return;
        const data = await dataRes.json();

        if (data.products && data.products.length > 0) {
          // Use CDN chunk products for pricing (fresh after sync-products),
          // falling back to featured-products.json only if chunks not loaded yet.
          const sourceProducts = products.length > 0 ? products : data.products;

          const featured = sourceProducts.filter((p: any) => data.featuredIds?.includes(p.code) || data.featuredIds?.includes(p.id));
          const popular = sourceProducts.filter((p: any) => data.popularIds?.includes(p.code) || data.popularIds?.includes(p.id));
          const promo = sourceProducts.filter((p: any) => data.promoIds?.includes(p.code) || data.promoIds?.includes(p.id));

          if (featured.length > 0) setFeaturedProducts(featured);
          if (popular.length > 0) setPopularProducts(popular);
          if (promo.length > 0) setPromotionalProducts(promo);
          setSectionsLoaded(true);
          featuredLoaded = true;
          console.log(`⚡ [Featured CDN] Loaded ${featured.length} featured products (source: ${products.length > 0 ? 'CDN chunks' : 'featured-products.json'})`);
        }
      } catch (e) {
        // Silently fall through to full product load
      }
    };
    loadFeaturedFromCDN();
  }, [products.length]);

  // Fetch featured sections when products are loaded
  useEffect(() => {
    // Update SEO meta tags for homepage
    updateSEOTags(homepageSEO);

    // Only fetch when products are loaded
    if (products && products.length > 0) {
      // Check if we have fresh cached data
      const cachedData = getCachedData();
      if (cachedData) {
        console.log('⚡ Cache is fresh - skipping server fetch');
        // Cache is already loaded in the other useEffect
        return;
      }

      console.log('🔄 No cache or stale - fetching from server...');
      fetchHomepageData();
    }
  }, [products.length]); // Re-run when products load

  const fetchSectionsConfig = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/sections-config`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSectionsConfig(data);
      }
    } catch (error) {
      // Silently fail - use default section names
    }
  };

  const fetchHomepageData = async () => {
    const fetchId = Math.random().toString(36).substring(7);
    try {
      console.log(`🔄 [${fetchId}] Fetching homepage metadata (sections IDs + banners)...`);

      // Fetch sections IDs AND banners from backend
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/homepage-metadata`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const metadata = await response.json();
        console.log('📦 Metadata received:', {
          featuredIds: metadata.featuredIds?.length || 0,
          popularIds: metadata.popularIds?.length || 0,
          promotionIds: metadata.promotionIds?.length || 0,
          banners: metadata.banners?.length || 0,
          sectionsConfig: metadata.sectionsConfig?.length || 0
        });

        // Wait for products to load from CDN
        if (!products || products.length === 0) {
          console.log('⏳ Waiting for products to load from CDN...');
          // Store metadata for when products arrive
          return;
        }

        // Filter products from CDN by the IDs
        const featuredIds = metadata.featuredIds || [];
        const popularIds = metadata.popularIds || [];
        const promotionIds = metadata.promotionIds || [];

        const newFeatured = products.filter((p: any) =>
          featuredIds.includes(p.code) ||
          featuredIds.includes(p.id) ||
          featuredIds.includes(p.sku) ||
          featuredIds.includes(p.productCode)
        )
          .sort((a: any, b: any) => {
            const priceA = parseFloat(a.price || a.standardPrice || 0);
            const priceB = parseFloat(b.price || b.standardPrice || 0);
            return priceB - priceA; // High to low
          })
          .slice(0, 20);

        const newPopular = products.filter((p: any) =>
          popularIds.includes(p.code) ||
          popularIds.includes(p.id) ||
          popularIds.includes(p.sku) ||
          popularIds.includes(p.productCode)
        ).slice(0, 20);

        const newPromo = products.filter((p: any) =>
          promotionIds.includes(p.code) ||
          promotionIds.includes(p.id) ||
          promotionIds.includes(p.sku) ||
          promotionIds.includes(p.productCode)
        ).slice(0, 20);

        console.log(`✅ Filtered from CDN: ${newFeatured.length} featured, ${newPopular.length} popular, ${newPromo.length} promo`);

        setFeaturedProducts(newFeatured);
        setPopularProducts(newPopular);
        setPromotionalProducts(newPromo);

        // Set banners from metadata
        const bannersData = metadata.banners || [];
        const hasValidBanners = bannersData.length > 0 &&
          bannersData.some((b: any) =>
            b.active !== false &&
            b.image &&
            b.image.trim() !== '' &&
            !b.image.includes('placeholder') &&
            (b.image.startsWith('http') || b.image.startsWith('data:'))
          );

        if (hasValidBanners) {
          const validBanners = bannersData.filter((b: any) =>
            b.active !== false &&
            b.image &&
            b.image.trim() !== '' &&
            !b.image.includes('placeholder') &&
            (b.image.startsWith('http') || b.image.startsWith('data:'))
          );
          const sortedBanners = validBanners.sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0));
          setBanners(sortedBanners);
          setBannersLoaded(true);
          console.log(`✅ Set ${sortedBanners.length} banners`);
        } else {
          console.log('📸 No banners - showing static banner');
          setBanners([]);
          setBannersLoaded(false);
        }

        // Set sections config
        if (metadata.sectionsConfig) {
          setSectionsConfig(metadata.sectionsConfig);
        }

        // ⚡ SAVE TO CACHE: Store IDs and metadata for instant loading next time
        setCachedData({
          featuredIds: metadata.featuredIds || [],
          popularIds: metadata.popularIds || [],
          promotionIds: metadata.promotionIds || [],
          banners: bannersData,
          sectionsConfig: metadata.sectionsConfig || []
        });

        console.log(`✅ [${fetchId}] Homepage metadata loaded and cached!`);
        console.log('✅ Homepage data loaded successfully!');
      } else {
        const errorText = await response.text();
        console.error('❌ /homepage-data error response:', response.status, errorText);
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      // FALLBACK: Don't use fallback data - just log error
      console.error('❌ CATCH BLOCK RUNNING! Error:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'No stack');
      console.log('⚠️ FALLBACK DISABLED - Homepage will show empty until server is available');
      // Don't overwrite with old product.section data
    } finally {
      console.log('✅ fetchHomepageData completed');
      setSectionsLoaded(true);
    }
  };

  // ⚡ Banner loading handled in fetchHomepageData with preloading
  const fetchBannersInBackground = async () => {
    // Banner loading now integrated into fetchHomepageData with image preloading
    return;
  };

  // ⚡ Filter active banners - always filter from banners array
  const activeBanners = banners.filter((b: any) =>
    b.active !== false &&
    b.image &&
    b.image.trim() !== '' &&
    !b.image.includes('placeholder') &&
    (b.image.startsWith('http') || b.image.startsWith('data:'))
  );

  // Debug: Log state changes
  useEffect(() => {
    console.log('🔄 STATE CHANGED (useEffect fired):');
    console.log('  Featured:', featuredProducts.length, 'first:', featuredProducts[0]?.code);
    if (featuredProducts.length > 0) {
      console.log('  All featured codes:', featuredProducts.map(p => p.code).slice(0, 5).join(', '));
    }
  }, [featuredProducts, popularProducts, promotionalProducts]);

  // Debug: Log banner data and loading state (run only once)
  useEffect(() => {
    const debugInfo = {
      bannersLoaded,
      bannersCount: banners.length,
      activeBannersCount: activeBanners.length,
      shouldShowStatic: !bannersLoaded || activeBanners.length === 0,
      shouldShowCarousel: bannersLoaded && activeBanners.length > 0,
      importedBannerPath: heroBannerImg
    };
    console.log('🎯 Banner Debug:', debugInfo);
  }, [bannersLoaded, banners.length, activeBanners.length]); // ✅ Only re-run when counts change, not array refs

  // ✅ Pagination for sections (8 products per page)
  const [featuredPage, setFeaturedPage] = useState(0);
  const [popularPage, setPopularPage] = useState(0);
  const [promotionPage, setPromotionPage] = useState(0);
  const PRODUCTS_PER_PAGE = 8;

  // ✅ Compute section products with proper fallback handling
  // ✅ Products are now fetched directly from /homepage-data endpoint (cached on server)
  // No need to filter from all products - we get them ready to use!

  // Paginated products for each section
  const displayFeaturedProducts = useMemo(() => {
    const start = featuredPage * PRODUCTS_PER_PAGE;
    return featuredProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [featuredProducts, featuredPage]);

  const displayPopularProducts = useMemo(() => {
    const start = popularPage * PRODUCTS_PER_PAGE;
    return popularProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [popularProducts, popularPage]);

  const displayPromotionalProducts = useMemo(() => {
    const start = promotionPage * PRODUCTS_PER_PAGE;
    return promotionalProducts.slice(start, start + PRODUCTS_PER_PAGE);
  }, [promotionalProducts, promotionPage]);

  // Calculate total pages for each section
  const featuredTotalPages = Math.ceil(featuredProducts.length / PRODUCTS_PER_PAGE);
  const popularTotalPages = Math.ceil(popularProducts.length / PRODUCTS_PER_PAGE);
  const promotionTotalPages = Math.ceil(promotionalProducts.length / PRODUCTS_PER_PAGE);

  // Multi-buy products — those with multiBuyOptions or top items with bulk tiers
  const multiBuyProducts = useMemo(() => {
    const matched = products.filter((p: any) => p.multiBuyOptions && p.multiBuyOptions.length >= 1);
    if (matched.length >= 4) return matched.slice(0, 12);

    const fallback = products.slice(0, 8).map((p: any) => {
      const price = typeof p.price === 'number' ? p.price : parseFloat(String(p.price || 50));
      return {
        ...p,
        multiBuyOptions: p.multiBuyOptions || [
          { quantity: 1, price: price },
          { quantity: 5, price: Math.round(price * 0.9 * 100) / 100 },
          { quantity: 10, price: Math.round(price * 0.82 * 100) / 100 },
        ]
      };
    });
    return [...matched, ...fallback].slice(0, 12);
  }, [products]);

  // Polar Refrigeration products
  const polarProducts = useMemo(() => {
    const matched = products.filter((p: any) => {
      const brand = (p.brand || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return brand.includes('polar') || (name.includes('polar') && (cat.includes('refrig') || name.includes('freezer') || name.includes('fridge') || name.includes('cooler') || name.includes('counter')));
    });
    if (matched.length >= 4) return matched.slice(0, 12);

    const refrigFallback = products
      .filter((p: any) => {
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return cat.includes('refrig') || name.includes('fridge') || name.includes('freezer') || name.includes('cooler') || name.includes('counter') || name.includes('ice');
      })
      .slice(0, 10)
      .map(p => ({ ...p, brand: p.brand || 'POLAR' }));

    return [...matched, ...refrigFallback].slice(0, 12);
  }, [products]);

  // Thor Range products
  const thorProducts = useMemo(() => {
    const matched = products.filter((p: any) => {
      const brand = (p.brand || '').toLowerCase();
      const name = (p.name || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();
      return brand.includes('thor') || name.includes('thor') || (cat.includes('cook') && (name.includes('range') || name.includes('oven') || name.includes('fryer') || name.includes('griddle') || name.includes('hotplate')));
    });
    if (matched.length >= 4) return matched.slice(0, 12);

    const cookingFallback = products
      .filter((p: any) => {
        const cat = (p.category || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        return cat.includes('cook') || name.includes('range') || name.includes('oven') || name.includes('fryer') || name.includes('griddle') || name.includes('burner');
      })
      .slice(0, 10)
      .map(p => ({ ...p, brand: p.brand || 'THOR' }));

    return [...matched, ...cookingFallback].slice(0, 12);
  }, [products]);

  // Popular Departments Products Filter (8 items for 4x2 grid)
  const departmentProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    let list: any[] = [];
    if (popularTab === 'new') {
      list = [...products].reverse().slice(0, 8);
    } else if (popularTab === 'popular') {
      list = [...products].sort((a: any, b: any) => (b.reviews_count || 0) - (a.reviews_count || 0)).slice(0, 8);
    } else if (popularTab === 'featured') {
      const feat = products.filter((p: any) => p.is_featured);
      list = feat.length >= 8 ? feat.slice(0, 8) : [...feat, ...products].slice(0, 8);
    } else if (popularTab === 'flash') {
      const flashItems = products.filter((p: any) => p.originalPrice && p.originalPrice > p.price);
      list = flashItems.length >= 8 ? flashItems.slice(0, 8) : multiBuyProducts.slice(0, 8);
    }

    if (list.length < 8) {
      const existingIds = new Set(list.map((p: any) => p.id));
      for (const p of products) {
        if (!existingIds.has(p.id)) {
          list.push(p);
          if (list.length === 8) break;
        }
      }
    }

    return list.slice(0, 8);
  }, [products, popularTab, multiBuyProducts]);




  // Extract ALL unique brands from products for auto-rotating TOP BRANDS
  const allBrandsList = useMemo(() => {
    const brandMap = new Map<string, { name: string; cat: string; logoUrl?: string }>();
    if (products && products.length > 0) {
      products.forEach((p: any) => {
        if (p.brand && !brandMap.has(p.brand)) {
          brandMap.set(p.brand, {
            name: p.brand,
            cat: p.category || 'Commercial Equipment',
logoUrl: p.brandLogoUrl || p.brandLogo || ''
          });
        }
      });
    }

    const list = Array.from(brandMap.values());
    const fallbackBrands = [
      { name: 'POLAR', cat: 'Commercial Refrigeration', logoUrl: '' },
      { name: 'THOR', cat: 'Commercial Cooking', logoUrl: '' },
      { name: 'APURO', cat: 'Kitchen Equipment', logoUrl: '' },
      { name: 'BUFFALO', cat: 'Catering Supplies', logoUrl: '' },
      { name: 'ROBOT COUPE', cat: 'Food Prep Machines', logoUrl: '' },
      { name: 'VOLLRATH', cat: 'Foodservice Utensils', logoUrl: '' },
      { name: 'CAMBRO', cat: 'Storage & Transport', logoUrl: '' },
      { name: 'WARING', cat: 'Commercial Blenders', logoUrl: '' },
      { name: 'CHEFMASTER', cat: 'Beverage & Prep', logoUrl: '' },
    ];

    if (list.length === 0) return fallbackBrands;
    if (list.length < 9) return [...list, ...fallbackBrands].slice(0, 15);
    return list;
  }, [products]);

  // ⚡ Slow & Graceful Sliding Auto-Rotate for Top Brands
  useEffect(() => {
    if (allBrandsList.length <= 1) return;
    const interval = setInterval(() => {
      // Step 1: Slowly slide out to the left
      setBrandSlideState('out');

      setTimeout(() => {
        // Step 2: Swap brand offset & set enter position from the right
        setBrandOffset((prev) => (prev + 1) % allBrandsList.length);
        setBrandSlideState('in');

        // Step 3: Animate slowly into normal position
        requestAnimationFrame(() => {
          setTimeout(() => {
            setBrandSlideState('idle');
          }, 40);
        });
      }, 700);
    }, 4500);

    return () => clearInterval(interval);
  }, [allBrandsList.length]);

  // Extract unique brands from products with their logos from database
  const brands = useMemo(() => {
    const brandMap = new Map<string, { name: string; logoUrl: string }>();

    products.forEach((p) => {
      if (p.brand && (p.brandLogoUrl || p.brandLogo) && !brandMap.has(p.brand)) {
  brandMap.set(p.brand, {
    name: p.brand,
    logoUrl: p.brandLogoUrl || p.brandLogo
  });
      }
    });

    return Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Get section configuration - filter only active sections
  const activeSections = useMemo(() => {
    return sectionsConfig
      .filter(section => section.active)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  }, [sectionsConfig]);

  // Helper to get section config by ID
  const getSectionConfig = (sectionId: string) => {
    return sectionsConfig.find(s => s.id === sectionId);
  };

  // Carousel settings
  const carouselSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: false,
    arrows: true,
  };

  // ✅ Show skeletons if we don't have products to display in sections yet
  // Check actual section products, not just global products array
  // PERMANENT FIX: Only show skeleton during initial load (sectionsLoaded = false)
  // After that, show sections even if empty (admin hasn't configured them yet)
  const isFullyLoading = !sectionsLoaded;

  // Product Card Skeleton Component
  const ProductCardSkeleton = () => (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      {/* Image area */}
      <div className="aspect-square relative overflow-hidden bg-slate-100">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100 animate-[shimmer_1.5s_infinite]" style={{ backgroundSize: '200% 100%' }} />
      </div>
      {/* Content area */}
      <div className="p-3 space-y-2.5">
        {/* Brand badge */}
        <div className="h-3 w-16 bg-slate-200 rounded-full animate-pulse" />
        {/* Product name — two lines */}
        <div className="space-y-1.5">
          <div className="h-4 bg-slate-200 rounded animate-pulse w-full" />
          <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4" />
        </div>
        {/* Price */}
        <div className="h-6 bg-slate-200 rounded animate-pulse w-1/3" />
        {/* Add to cart button */}
        <div className="h-9 bg-slate-200 rounded-lg animate-pulse w-full" />
      </div>
    </div>
  );

  // Brand Card Skeleton Component
  const BrandCardSkeleton = () => (
    <div className="flex-shrink-0 bg-white rounded-xl p-5 md:p-6 border-2 border-slate-200 min-w-[180px] max-w-[180px]">
      <div className="w-full h-32 mb-4 rounded-lg bg-slate-200 animate-pulse"></div>
      <div className="h-4 bg-slate-200 rounded animate-pulse w-3/4 mx-auto"></div>
    </div>
  );

  return (
    <div className="min-h-screen w-full max-w-[100vw] bg-[#FAFAFC]">
      <h1 className="sr-only">Catering Equipment &amp; Commercial Kitchen Supplies Australia | Cost Plus 100</h1>
      {/* SEO Meta Tags and Structured Data for Homepage */}
      <SEOHead
        title="CostPlus Catering Equipment - Professional Kitchen Equipment Australia"
        description="Australia's premier supplier of commercial catering equipment. Shop 13,777+ professional products from leading brands. Serving Sydney, Melbourne, Brisbane, Perth, and Adelaide with competitive pricing for restaurants, hotels, and professional kitchens."
        keywords="catering equipment australia, catering equipment sydney, catering equipment melbourne, catering equipment brisbane, catering equipment perth, catering equipment adelaide, commercial kitchen equipment, commercial kitchen equipment sydney, commercial kitchen equipment melbourne, restaurant equipment, hospitality equipment, commercial cooking equipment, food service equipment, professional catering supplies australia"
        schema={{
          '@context': 'https://schema.org',
          '@graph': [
            generateOrganizationSchema(),
            generateLocalBusinessSchema()
          ]
        }}
      />

      {/* Removed top red banner - moved to CTA section */}

      {/* DEBUG ERROR BANNER - Shows if data fails to load */}
      {loadingError && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 mb-4" role="alert">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-bold flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  Unable to Connect to Server
                </p>
                <p className="text-sm mt-1">
                  The application is running in offline mode with default content. Some features may be limited.
                </p>
                {Object.keys(debugInfo).length > 0 && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer hover:underline">Technical Details (for debugging)</summary>
                    <pre className="text-xs mt-1 overflow-auto bg-yellow-100 p-2 rounded">{JSON.stringify(debugInfo, null, 2)}</pre>
                  </details>
                )}
              </div>
              <button
                onClick={() => {
                  setLoadingError(null);
                  setDebugInfo({});
                  window.location.reload();
                }}
                className="ml-4 px-3 py-1 bg-yellow-200 hover:bg-yellow-300 text-yellow-900 rounded text-sm font-medium transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── HERO: EXACT MATCH TO REFERENCE IMAGE (herosection.png) ── */}
      <div className="w-full relative overflow-hidden bg-[#070D18] pt-6 sm:pt-16 lg:pt-28 pb-7 sm:pb-4 min-h-[220px] sm:min-h-[580px] flex items-center" data-banner-type="hero-static">
        {/* Commercial Kitchen Background Photography with Reduced Zoom & Crisp Right Oven Focus */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="/images/herosection.png"
            alt="Commercial Kitchen Equipment - Professional Equipment Trusted by Experts"
            className="w-full h-full object-cover sm:object-contain object-right opacity-95"
          />
          {/* Gradient Overlay for Crisp Text Readability on Left */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#070D18] via-[#070D18]/90 to-transparent max-w-4xl" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070D18] via-transparent to-[#070D18]/40" />
        </div>

        {/* Hero Content Container */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 relative flex flex-col justify-between h-full pt-2 pb-1">
          {/* Top Row: Left Text Content + Right Glass Stat Card */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 lg:gap-12 w-full mb-0 sm:mb-6 lg:mb-8">

            {/* ── LEFT COLUMN: Text Content & Pill Buttons ── */}
            <div className="max-w-2xl text-white">
              {/* Top Pill Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/40 bg-amber-500/10 text-amber-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-3 sm:mb-5 backdrop-blur-sm">
                <Shield className="size-3.5 sm:size-4 text-amber-400" />
                <span>AUSTRALIA'S TRUSTED B2B SUPPLY PARTNER</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight font-serif mb-3 sm:mb-4">
                Professional Equipment.<br />
                Trusted by Experts.<br />
                <span className="text-[#F59E0B] font-serif block mt-0.5">Built for Your Business.</span>
              </h1>

              {/* Subtitle Paragraph */}
              <p className="text-slate-300 text-xs sm:text-base leading-snug max-w-lg mb-2 sm:mb-7 font-medium">
                Premium catering equipment and supplies at wholesale prices. Quality you can trust. Service you can rely on.
              </p>

              {/* Action Buttons: Side-by-side on Mobile (< 480px) */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3.5 mb-5 sm:mb-6 w-full max-w-sm sm:max-w-none">
                <Link
                  to="products/c/simco-equipment"
                  className="px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-full bg-[#E31837] hover:bg-[#C8102E] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center text-center shadow-md shadow-red-900/30 transition-all hover:scale-105"
                >
                  <span>Explore Simco Category Range</span>
                </Link>

                <Link
                  to="/products/c/simco-equipment-upright-storage-fridge-and-freezers"
                  className="px-3.5 sm:px-6 py-2.5 sm:py-3 rounded-full border border-slate-700/80 bg-slate-900/70 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center text-center backdrop-blur-sm transition-all hover:scale-105"
                >
                  <span>Simco Products</span>
                </Link>
              </div>

              {/* ── HERO STATS COUNTERS (Product Count & Brand Count) - Hidden on < 600px ── */}
              <div className="hidden min-[600px]:grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3.5 pt-1 sm:pt-2 mb-2 sm:mb-4">
                {/* Stat 1: Product Count */}
                <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:px-4 sm:py-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-amber-500/40 hover:bg-slate-900/80 transition-all duration-300 group shadow-lg shadow-black/20">
                  <div className="size-8.5 sm:size-10 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/20 transition-all shrink-0">
                    <Package className="size-4 sm:size-5" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base sm:text-xl font-black text-white tracking-tight group-hover:text-amber-400 transition-colors">
                        13,777+
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-300 leading-tight">
                      Products Count
                    </p>
                  </div>
                </div>

                {/* Stat 2: Brand Count */}
                <div className="flex items-center gap-2.5 sm:gap-3 p-2.5 sm:px-4 sm:py-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md hover:border-amber-500/40 hover:bg-slate-900/80 transition-all duration-300 group shadow-lg shadow-black/20">
                  <div className="size-8.5 sm:size-10 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all shrink-0">
                    <Award className="size-4 sm:size-5" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base sm:text-xl font-black text-white tracking-tight group-hover:text-rose-400 transition-colors">
                        150+
                      </span>
                    </div>
                    <p className="text-[10px] sm:text-xs font-semibold text-slate-300 leading-tight">
                      Top Brands
                    </p>
                  </div>
                </div>

                
              </div>
            </div>

          </div>

          {/* ── BOTTOM FULL-WIDTH TRANSPARENT TRUST BADGES STRIP (Visible only on screens >= 600px) ── */}
          <div className="hidden min-[600px]:block w-full mt-4 sm:mt-5 pt-3 pb-0 border-t border-slate-800/80 z-20">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 divide-y-0 sm:divide-x divide-slate-800/80 gap-y-3 gap-x-2 sm:gap-0 items-center min-h-[56px]">

              {/* Item 1: Best Price Guaranteed */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-2 sm:px-4 py-1">
                <div className="w-9 h-9 rounded-full bg-rose-950/60 border border-rose-800/40 flex items-center justify-center text-rose-500 shrink-0 shadow-2xs">
                  <ShieldCheck className="size-4.5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white leading-tight">Best Price</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold leading-tight mt-0.5">Guaranteed</p>
                </div>
              </div>

              {/* Item 2: 1-800-151-624 */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-2 sm:px-4 py-1">
                <div className="w-9 h-9 rounded-full bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-2xs">
                  <Phone className="size-4.5 stroke-[2.2]" />
                </div>
                <div>
                  <a href="tel:1800151624" className="text-xs sm:text-sm font-extrabold text-white leading-tight hover:text-[#E31837] transition-colors block">
                    1-800-151-624
                  </a>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold leading-tight mt-0.5">Call for prices</p>
                </div>
              </div>

              {/* Item 3: Square */}
              <div className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2.5 px-2 sm:px-4 py-1.5 sm:py-1 border-y sm:border-y-0 border-slate-800/80 my-0.5 sm:my-0">
                <svg className="w-7 h-7 shrink-0" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="20" height="20" rx="5" fill="#FFFFFF" />
                  <rect x="7" y="7" width="10" height="10" rx="2" fill="#000000" />
                  <rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="#FFFFFF" />
                </svg>
                <span className="text-sm sm:text-base font-black text-white tracking-tight">
                  Square
                </span>
              </div>

              {/* Item 4: Nisbets Wholesale Range */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-2 sm:px-4 py-1">
                <div className="w-9 h-9 rounded-full bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-blue-400 shrink-0 shadow-2xs">
                  <Tag className="size-4.5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white leading-tight">Nisbets</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold leading-tight mt-0.5">Wholesale Range</p>
                </div>
              </div>

              {/* Item 5: Total Transparency */}
              <div className="flex items-center gap-2.5 sm:gap-3 px-2 sm:px-4 py-1">
                <div className="w-9 h-9 rounded-full bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-2xs">
                  <DollarSign className="size-4.5 stroke-[2.2]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-extrabold text-white leading-tight">Total</h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-semibold leading-tight mt-0.5">Transparency</p>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* ── CATEGORIES SECTION (COMPACT MARGINS ON MOBILE <600px) ── */}
      <div className="max-w-7xl mx-auto px-4 lg:px-6 max-[599px]:my-2 my-4 sm:my-5">
        {/* Header Row: Title Left (Reduced Font Size & Weight on <600px), View All Link + Desktop Arrows Right */}
        <div className="flex items-center justify-between max-[599px]:mb-2 mb-4 sm:mb-5">
          <h2 className="text-base sm:text-xl md:text-2xl font-bold max-[599px]:font-semibold text-slate-900 tracking-tight">
            Explore Categories
          </h2>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/categories" className="text-xs sm:text-sm font-bold text-[#E31837] hover:underline flex items-center gap-1">
              <span>View all</span>
              <ChevronRight className="size-4" />
            </Link>

            {/* Desktop Navigation Arrows */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => categorySliderRef.current?.slickPrev()}
                className="w-8.5 h-8.5 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] transition-all cursor-pointer"
                aria-label="Previous Category"
              >
                <ChevronLeft className="size-4" />
              </button>
              <button
                onClick={() => categorySliderRef.current?.slickNext()}
                className="w-8.5 h-8.5 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] transition-all cursor-pointer"
                aria-label="Next Category"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 8-Category Carousel Slider */}
        <div className="relative">
          <Slider
            key={`cat-slider-${categorySlidesToShow}`}
            ref={categorySliderRef}
            dots={false}
            infinite={true}
            speed={500}
            slidesToShow={categorySlidesToShow}
            slidesToScroll={1}
            autoplay={true}
            autoplaySpeed={5000}
            arrows={false}
            swipe={true}
            swipeToSlide={true}
            touchMove={true}
            draggable={true}
            touchThreshold={10}
          >
            {[
              {
                name: 'Furniture',
                path: '/products/c/furniture',
                image: '/categories_images/Furniture.png',
              },
              {
                name: 'Commercial Kitchen Machines',
                path: '/products/c/commercial-kitchen-machines',
                image: '/categories_images/commercialkitchen.png',
              },
              {
                name: 'Tableware & Bar Supplies',
                path: '/products/c/tableware-bar-supplies',
                image: '/categories_images/tableware.png',
              },
              {
                name: 'Consumables',
                path: '/products/c/consumables',
                image: '/categories_images/consuambles.png',
              },
              {
                name: 'Clothing, Aprons & Footwear',
                path: '/products/c/clothing-aprons-footwear',
                image: '/categories_images/clothing.png',
              },
              {
                name: 'Kitchenware & Storage',
                path: '/products/c/kitchenware-storage',
                image: '/categories_images/kitchenware.png',
              },
              {
                name: 'Cleaning & Hygiene',
                path: '/products/c/cleaning-hygiene',
                image: '/categories_images/cleaning.png',
              },
              {
                name: 'Refrigeration & Ice Machines',
                path: '/products/c/refrigeration-ice-machines',
                image: '/categories_images/refrigirator.png',
              },
              {
                name: 'Clearance And Special Offers',
                path: '/products/c/clearance-special-offers',
                image: '/categories_images/clearncesale.png',
              },
              {
                name: 'Simco Equipment',
                path: '/products/c/simco-equipment',
                image: '/categories_images/simcom.png',
              },
            ].map((catItem, idx) => (
              <div key={idx} className="px-1 sm:px-2 h-full pb-1">
                <Link
                  to={catItem.path}
                  className="flex flex-col items-center text-center cursor-pointer group h-full relative"
                >
                  {/* Equipment Image Container (Compact height & width) */}
                  <div className="w-full h-22 sm:h-28 md:h-32 flex items-center justify-center p-0 overflow-hidden relative rounded-xl sm:rounded-2xl bg-white border border-slate-200/70 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.08)] shrink-0 transition-all">
                    <img
                      src={catItem.image}
                      alt={catItem.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* HOVER OVERLAY DIRECTLY UPON IMAGE */}
                    <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-[1px] hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-2xl z-10">
                      <span className="bg-[#E31837] hover:bg-[#C41230] text-white text-[10px] font-extrabold px-3 py-1 rounded-full shadow-md tracking-wider uppercase transform group-hover:scale-105 transition-transform duration-300">
                        Shop Now →
                      </span>
                    </div>
                  </div>

                  {/* Category Title Below (Compact Text & Gap) */}
                  <div className="w-full pt-2 mt-0.5">
                    <h3 className="font-bold text-slate-900 text-[11px] sm:text-xs line-clamp-2 transition-colors group-hover:text-[#E31837] flex items-center justify-center text-center leading-tight">
                      {catItem.name}
                    </h3>
                  </div>
                </Link>
              </div>
            ))}
          </Slider>
        </div>

        {/* Mobile Navigation Arrows (Hidden on <600px as requested) */}
        <div className="hidden items-center justify-center gap-2 mt-4">
          <button
            onClick={() => categorySliderRef.current?.slickPrev()}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-xs transition-all cursor-pointer"
            aria-label="Previous Category"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            onClick={() => categorySliderRef.current?.slickNext()}
            className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-xs transition-all cursor-pointer"
            aria-label="Next Category"
          >
            <ChevronRight className="size-5" />
          </button>
        </div>
      </div>

      {/* ── FULL-WIDTH ALTERNATING 2-COLOR SECTIONS (WHITE / SLIGHT GRAY bg-[#F8FAFC]) ── */}

      {/* ── SECTION 1: FEATURED COMMERCIAL EQUIPMENT (FULL-WIDTH SLIGHT GRAY bg-[#F8FAFC]) ── */}
      {displayFeaturedProducts.length > 0 && (
        <section className="max-[599px]:py-2 py-4 md:py-5 w-full">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full">
            <div className="flex items-center justify-between max-[599px]:mb-2 mb-4 sm:mb-5">
              <div>
                <h2 className="text-base sm:text-lg md:text-xl font-bold max-[599px]:font-semibold text-slate-900 tracking-tight">
                  {getSectionConfig('featured')?.name || 'Featured Equipment'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 hidden sm:block">
                  High-quality refrigeration and commercial solutions for your business.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link to="/products?section=featured" className="text-xs sm:text-sm font-bold text-[#E31837] hover:underline">
                  View all
                </Link>
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={() => featuredSliderRef.current?.slickPrev()}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-2xs transition-all cursor-pointer"
                    aria-label="Previous Featured Products"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    onClick={() => featuredSliderRef.current?.slickNext()}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-2xs transition-all cursor-pointer"
                    aria-label="Next Featured Products"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative -mx-2.5">
              <Slider
                key={`featured-slider-${productSlidesToShow}`}
                ref={featuredSliderRef}
                dots={false}
                infinite={true}
                speed={500}
                slidesToShow={productSlidesToShow}
                slidesToScroll={1}
                autoplay={true}
                autoplaySpeed={4500}
                arrows={false}
                swipe={true}
                swipeToSlide={true}
                touchMove={true}
                draggable={true}
                touchThreshold={10}
              >
                {displayFeaturedProducts.map((product) => (
                  <div key={`${product.id}-${forceRenderKey}`} className="px-2.5 h-full pb-3">
                    <FeaturedEquipmentCard product={product} />
                  </div>
                ))}
              </Slider>
            </div>

            {/* Mobile Navigation Arrows (Hidden) */}
            <div className="hidden items-center justify-center gap-2 mt-4">
              <button
                onClick={() => featuredSliderRef.current?.slickPrev()}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-xs transition-all cursor-pointer"
                aria-label="Previous Featured Products"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={() => featuredSliderRef.current?.slickNext()}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-xs transition-all cursor-pointer"
                aria-label="Next Featured Products"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── 3 CATEGORY PROMO BANNERS ABOVE POLAR (FRIDGE, FURNITURE, KITCHEN) ── */}
      <section className="py-4 md:py-5 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full">
          <div className="relative -mx-2">
            <Slider
              key={`promo1-slider-${promoSlidesToShow}`}
              dots={false}
              infinite={promoSlidesToShow < 3}
              speed={600}
              slidesToShow={promoSlidesToShow}
              slidesToScroll={1}
              autoplay={promoSlidesToShow < 3}
              autoplaySpeed={4500}
              arrows={false}
              swipe={true}
              swipeToSlide={true}
              touchMove={true}
              draggable={true}
              touchThreshold={10}
            >
              {/* 1. Fridge Banner */}
              <div className="px-2">
                <Link
                  to="/products/c/refrigeration-ice-machines"
                  className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-slate-200/80 hover:border-[#E31837]/40 transition-all duration-300 group aspect-[1672/941] w-full bg-slate-900 flex items-center justify-center cursor-pointer"
                >
                  <ImageWithFallback
                    src="/categoriesbanner/fridgebanner.jpg"
                    alt="Commercial Refrigeration & Ice Machines"
                    className="w-full h-full object-fill group-hover:brightness-[1.03] group-hover:contrast-[1.02] transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-5 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-[#E31837] hover:bg-[#C41230] text-white text-xs font-extrabold px-4.5 py-2 rounded-full shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 tracking-wider uppercase">
                      <span>Shop Now</span>
                      <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </div>

              {/* 2. Furniture Banner */}
              <div className="px-2">
                <Link
                  to="/products/c/furniture"
                  className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-slate-200/80 hover:border-[#E31837]/40 transition-all duration-300 group aspect-[1672/941] w-full bg-slate-900 flex items-center justify-center cursor-pointer"
                >
                  <ImageWithFallback
                    src="/categoriesbanner/furnitirebanner.jpg"
                    alt="Commercial Furniture & Dining"
                    className="w-full h-full object-fill group-hover:brightness-[1.03] group-hover:contrast-[1.02] transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-5 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-[#E31837] hover:bg-[#C41230] text-white text-xs font-extrabold px-4.5 py-2 rounded-full shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 tracking-wider uppercase">
                      <span>Shop Now</span>
                      <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </div>

              {/* 3. Kitchen Banner */}
              <div className="px-2">
                <Link
                  to="/products/c/commercial-kitchen-machines"
                  className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-slate-200/80 hover:border-[#E31837]/40 transition-all duration-300 group aspect-[1672/941] w-full bg-slate-900 flex items-center justify-center cursor-pointer"
                >
                  <ImageWithFallback
                    src="/categoriesbanner/kitchenbanner.jpg"
                    alt="Commercial Kitchen Equipment"
                    className="w-full h-full object-fill group-hover:brightness-[1.03] group-hover:contrast-[1.02] transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-5 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-[#E31837] hover:bg-[#C41230] text-white text-xs font-extrabold px-4.5 py-2 rounded-full shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 tracking-wider uppercase">
                      <span>Shop Now</span>
                      <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </div>
            </Slider>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: POLAR COMMERCIAL REFRIGERATION (FULL-WIDTH PURE WHITE bg-white) ── */}
      {polarProducts.length > 0 && (
        <section className="py-4 md:py-5 w-full">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div>
                <div className="flex flex-col min-[600px]:flex-row items-start min-[600px]:items-center gap-1 min-[600px]:gap-2">
                  <span className="text-[10px] sm:text-xs font-black text-[#0284C7] bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                    POLAR
                  </span>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold max-[599px]:font-semibold text-slate-900 tracking-tight">
                    Polar Commercial Refrigeration
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 hidden sm:block">
                  Industry-standard commercial fridges, display freezers, prep counters &amp; ice machines.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link to="/products?search=polar" className="text-xs sm:text-sm font-bold text-[#E31837] hover:underline">
                  View all
                </Link>
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={() => polarSliderRef.current?.slickPrev()}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-2xs transition-all cursor-pointer"
                    aria-label="Previous Polar Products"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    onClick={() => polarSliderRef.current?.slickNext()}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-2xs transition-all cursor-pointer"
                    aria-label="Next Polar Products"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative -mx-2.5">
              <Slider
                key={`polar-slider-${productSlidesToShow}`}
                ref={polarSliderRef}
                dots={false}
                infinite={true}
                speed={500}
                slidesToShow={productSlidesToShow}
                slidesToScroll={1}
                autoplay={true}
                autoplaySpeed={4800}
                arrows={false}
                swipe={true}
                swipeToSlide={true}
                touchMove={true}
                draggable={true}
                touchThreshold={10}
              >
                {polarProducts.map((product) => (
                  <div key={`polar-${product.id}`} className="px-2.5 h-full pb-3">
                    <FeaturedEquipmentCard product={product} />
                  </div>
                ))}
              </Slider>
            </div>

            {/* Mobile Navigation Arrows (Hidden) */}
            <div className="hidden items-center justify-center gap-2 mt-4">
              <button
                onClick={() => polarSliderRef.current?.slickPrev()}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-xs transition-all cursor-pointer"
                aria-label="Previous Polar Products"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={() => polarSliderRef.current?.slickNext()}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-xs transition-all cursor-pointer"
                aria-label="Next Polar Products"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 3: THOR COMMERCIAL COOKING (FULL-WIDTH SLIGHT GRAY bg-[#F8FAFC]) ── */}
      {thorProducts.length > 0 && (
        <section className="py-4 md:py-5 w-full">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div>
                <div className="flex flex-col min-[600px]:flex-row items-start min-[600px]:items-center gap-1 min-[600px]:gap-2">
                  <span className="text-[10px] sm:text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                    THOR
                  </span>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold max-[599px]:font-semibold text-slate-900 tracking-tight">
                    Thor Commercial Cooking &amp; Ranges
                  </h2>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 hidden sm:block">
                  Heavy-duty gas &amp; electric ranges, ovens, fryers, griddles &amp; hot plates built to perform.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link to="/products?search=thor" className="text-xs sm:text-sm font-bold text-[#E31837] hover:underline">
                  View all
                </Link>
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={() => thorSliderRef.current?.slickPrev()}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-2xs transition-all cursor-pointer"
                    aria-label="Previous Thor Products"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    onClick={() => thorSliderRef.current?.slickNext()}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-2xs transition-all cursor-pointer"
                    aria-label="Next Thor Products"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative -mx-2.5">
              <Slider
                key={`thor-slider-${productSlidesToShow}`}
                ref={thorSliderRef}
                dots={false}
                infinite={true}
                speed={500}
                slidesToShow={productSlidesToShow}
                slidesToScroll={1}
                autoplay={true}
                autoplaySpeed={5200}
                arrows={false}
                swipe={true}
                swipeToSlide={true}
                touchMove={true}
                draggable={true}
                touchThreshold={10}
              >
                {thorProducts.map((product) => (
                  <div key={`thor-${product.id}`} className="px-2.5 h-full pb-3">
                    <FeaturedEquipmentCard product={product} />
                  </div>
                ))}
              </Slider>
            </div>

            {/* Mobile Navigation Arrows (Hidden) */}
            <div className="hidden items-center justify-center gap-2 mt-4">
              <button
                onClick={() => thorSliderRef.current?.slickPrev()}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-xs transition-all cursor-pointer"
                aria-label="Previous Thor Products"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={() => thorSliderRef.current?.slickNext()}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-xs transition-all cursor-pointer"
                aria-label="Next Thor Products"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── 3 CATEGORY PROMO BANNERS AFTER THOR (CLOTHING, CONSUMABLES, TABLEWARE) ── */}
      <section className="py-4 md:py-5 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full">
          <div className="relative -mx-2">
            <Slider
              key={`promo2-slider-${promoSlidesToShow}`}
              dots={false}
              infinite={promoSlidesToShow < 3}
              speed={600}
              slidesToShow={promoSlidesToShow}
              slidesToScroll={1}
              autoplay={promoSlidesToShow < 3}
              autoplaySpeed={4500}
              arrows={false}
              swipe={true}
              swipeToSlide={true}
              touchMove={true}
              draggable={true}
              touchThreshold={10}
            >
              {/* 1. Clothing Banner */}
              <div className="px-2">
                <Link
                  to="/products/c/clothing"
                  className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-slate-200/80 hover:border-[#E31837]/40 transition-all duration-300 group aspect-[1672/941] w-full bg-slate-900 flex items-center justify-center cursor-pointer"
                >
                  <ImageWithFallback
                    src="/categoriesbanner/clothingbanner.jpg"
                    alt="Chef Clothing & Aprons"
                    className="w-full h-full object-fill group-hover:brightness-[1.03] group-hover:contrast-[1.02] transition-all duration-300"
                  />
                  {/* Hover Dark Gradient Overlay & Slide-up Shop Now Button */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-5 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-[#E31837] hover:bg-[#C41230] text-white text-xs font-extrabold px-4.5 py-2 rounded-full shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 tracking-wider uppercase">
                      <span>Shop Now</span>
                      <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </div>

              {/* 2. Consumables Banner */}
              <div className="px-2">
                <Link
                  to="/products/c/consumables"
                  className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-slate-200/80 hover:border-[#E31837]/40 transition-all duration-300 group aspect-[1672/941] w-full bg-slate-900 flex items-center justify-center cursor-pointer"
                >
                  <ImageWithFallback
                    src="/categoriesbanner/consumablesbanner.jpg"
                    alt="Catering Consumables & Stock"
                    className="w-full h-full object-fill group-hover:brightness-[1.03] group-hover:contrast-[1.02] transition-all duration-300"
                  />
                  {/* Hover Dark Gradient Overlay & Slide-up Shop Now Button */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-5 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-[#E31837] hover:bg-[#C41230] text-white text-xs font-extrabold px-4.5 py-2 rounded-full shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 tracking-wider uppercase">
                      <span>Shop Now</span>
                      <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </div>

              {/* 3. Tableware Banner */}
              <div className="px-2">
                <Link
                  to="/products/c/tableware-bar-supplies"
                  className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-slate-200/80 hover:border-[#E31837]/40 transition-all duration-300 group aspect-[1672/941] w-full bg-slate-900 flex items-center justify-center cursor-pointer"
                >
                  <ImageWithFallback
                    src="/categoriesbanner/tablewarebanner.jpg"
                    alt="Tableware & Bar Supplies"
                    className="w-full h-full object-fill group-hover:brightness-[1.03] group-hover:contrast-[1.02] transition-all duration-300"
                  />
                  {/* Hover Dark Gradient Overlay & Slide-up Shop Now Button */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-5 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-[#E31837] hover:bg-[#C41230] text-white text-xs font-extrabold px-4.5 py-2 rounded-full shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 tracking-wider uppercase">
                      <span>Shop Now</span>
                      <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </div>
            </Slider>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: MULTI-BUY WHOLESALE DEALS (FULL-WIDTH PURE WHITE bg-white) ── */}
      {false && multiBuyProducts.length > 0 && (
        <section className="py-4 md:py-5 w-full">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full">
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div>
                <h2 className="text-base sm:text-lg md:xl font-bold max-[599px]:font-semibold text-slate-900 tracking-tight">
                  Multi-buy Wholesale Deals
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1 hidden sm:block">
                  Save more when you order in bulk. Tiered discounts applied automatically.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <Link to="/products?multibuy=true" className="text-xs sm:text-sm font-bold text-[#E31837] hover:underline">
                  View all
                </Link>
                <div className="hidden sm:flex items-center gap-1">
                  <button
                    onClick={() => multiBuySliderRef.current?.slickPrev()}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-2xs transition-all cursor-pointer"
                    aria-label="Previous Multi-buy Deals"
                  >
                    <ChevronLeft className="size-5" />
                  </button>
                  <button
                    onClick={() => multiBuySliderRef.current?.slickNext()}
                    className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-2xs transition-all cursor-pointer"
                    aria-label="Next Multi-buy Deals"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="relative -mx-2.5">
              <Slider
                key={`multibuy-slider-${productSlidesToShow}`}
                ref={multiBuySliderRef}
                dots={false}
                infinite={true}
                speed={500}
                slidesToShow={productSlidesToShow}
                slidesToScroll={1}
                autoplay={true}
                autoplaySpeed={5000}
                arrows={false}
                swipe={true}
                swipeToSlide={true}
                touchMove={true}
                draggable={true}
                touchThreshold={10}
              >
                {multiBuyProducts.map((product) => (
                  <div key={`multibuy-${product.id}`} className="px-2.5 h-full pb-3">
                    <MultiBuyEquipmentCard product={product} />
                  </div>
                ))}
              </Slider>
            </div>

            {/* Mobile Navigation Arrows (Hidden) */}
            <div className="hidden items-center justify-center gap-2 mt-4">
              <button
                onClick={() => multiBuySliderRef.current?.slickPrev()}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-xs transition-all cursor-pointer"
                aria-label="Previous Multi-buy Deals"
              >
                <ChevronLeft className="size-5" />
              </button>
              <button
                onClick={() => multiBuySliderRef.current?.slickNext()}
                className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-50 hover:text-[#E31837] shadow-xs transition-all cursor-pointer"
                aria-label="Next Multi-buy Deals"
              >
                <ChevronRight className="size-5" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── 3 CATEGORY PROMO BANNERS AFTER MULTI-BUY DEALS (CLEANING, CLEARANCE, SIMCO) ── */}
      <section className="py-4 md:py-5 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full">
          <div className="relative -mx-2">
            <Slider
              key={`promo3-slider-${promoSlidesToShow}`}
              dots={false}
              infinite={promoSlidesToShow < 3}
              speed={600}
              slidesToShow={promoSlidesToShow}
              slidesToScroll={1}
              autoplay={promoSlidesToShow < 3}
              autoplaySpeed={4500}
              arrows={false}
              swipe={true}
              swipeToSlide={true}
              touchMove={true}
              draggable={true}
              touchThreshold={10}
            >
              {/* 1. Cleaning Banner */}
              <div className="px-2">
                <Link
                  to="/products/c/cleaning-hygiene"
                  className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-slate-200/80 hover:border-[#E31837]/40 transition-all duration-300 group aspect-[1672/941] w-full bg-slate-900 flex items-center justify-center cursor-pointer"
                >
                  <ImageWithFallback
                    src="/categoriesbanner/cleaningbanner.jpg"
                    alt="Cleaning & Hygiene Supplies"
                    className="w-full h-full object-fill group-hover:brightness-[1.03] group-hover:contrast-[1.02] transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-5 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-[#E31837] hover:bg-[#C41230] text-white text-xs font-extrabold px-4.5 py-2 rounded-full shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 tracking-wider uppercase">
                      <span>Shop Now</span>
                      <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </div>

              {/* 2. Clearance Banner */}
              <div className="px-2">
                <Link
                  to="/products/c/clearance-special-offers"
                  className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-slate-200/80 hover:border-[#E31837]/40 transition-all duration-300 group aspect-[1672/941] w-full bg-slate-900 flex items-center justify-center cursor-pointer"
                >
                  <ImageWithFallback
                    src="/categoriesbanner/clearencebaner.jpg"
                    alt="Clearance & Special Offers"
                    className="w-full h-full object-fill group-hover:brightness-[1.03] group-hover:contrast-[1.02] transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-5 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-[#E31837] hover:bg-[#C41230] text-white text-xs font-extrabold px-4.5 py-2 rounded-full shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 tracking-wider uppercase">
                      <span>Shop Now</span>
                      <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </div>

              {/* 3. Simco Banner */}
              <div className="px-2">
                <Link
                  to="/products/c/simco-equipment"
                  className="relative rounded-2xl overflow-hidden shadow-md hover:shadow-xl border border-slate-200/80 hover:border-[#E31837]/40 transition-all duration-300 group aspect-[1672/941] w-full bg-slate-900 flex items-center justify-center cursor-pointer"
                >
                  <ImageWithFallback
                    src="/categoriesbanner/simcobanner.jpg"
                    alt="Simco Commercial Equipment"
                    className="w-full h-full object-fill group-hover:brightness-[1.03] group-hover:contrast-[1.02] transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-5 z-10">
                    <span className="inline-flex items-center gap-1.5 bg-[#E31837] hover:bg-[#C41230] text-white text-xs font-extrabold px-4.5 py-2 rounded-full shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-transform duration-300 tracking-wider uppercase">
                      <span>Shop Now</span>
                      <ChevronRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </div>
            </Slider>
          </div>
        </div>
      </section>


      {/* ── SECTION 7: TOP BRANDS (FULL-WIDTH SLIGHT GRAY bg-[#F8FAFC]) ── */}
      <section className="py-3 sm:py-5 w-full">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-slate-800 text-xs sm:text-lg font-bold max-[599px]:font-semibold uppercase tracking-wide">
              TOP BRANDS
            </h2>
            <Link to="/brands" className="text-xs sm:text-sm font-bold text-[#E31837] hover:underline flex items-center gap-1">
              <span>View all</span>
              <ChevronRight className="size-4" />
            </Link>
          </div>

          {(() => {
            const featuredBrand = allBrandsList[brandOffset % allBrandsList.length];
            const rightBrands = Array.from({ length: 8 }, (_, i) => allBrandsList[(brandOffset + 1 + i) % allBrandsList.length]);

            const getInnerTransformClass = () => {
              if (brandSlideState === 'out') {
                return '-translate-x-12 opacity-0 scale-95';
              }
              if (brandSlideState === 'in') {
                return 'translate-x-12 opacity-0 scale-95';
              }
              return 'translate-x-0 opacity-100 scale-100';
            };

            return (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-2.5 sm:gap-4 items-stretch">
                {/* Left Featured Big Card */}
                <Link
                  to={`/products?search=${encodeURIComponent(featuredBrand.name)}`}
                  className="lg:col-span-1 border border-slate-200/80 rounded-xl bg-white p-2.5 sm:p-5 flex items-center justify-center text-center hover:border-slate-300 hover:shadow-xs transition-colors cursor-pointer group h-full min-h-[110px] sm:min-h-[235px] lg:min-h-[265px] overflow-hidden"
                >
                  <div className={`w-full h-full flex items-center justify-center p-1 transition-all duration-1000 cubic-bezier(0.25, 1, 0.5, 1) transform ${getInnerTransformClass()}`}>
                    {featuredBrand.logoUrl ? (
                      <img
                        src={featuredBrand.logoUrl}
                        alt={featuredBrand.name}
                        className="max-h-20 sm:max-h-40 max-w-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full aspect-square max-w-[100px] sm:max-w-[145px] bg-slate-900 text-white rounded-md p-2 sm:p-3.5 flex flex-col items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-700 ease-out">
                        <span className="text-sm sm:text-2xl font-black tracking-widest text-white uppercase text-center line-clamp-2">
                          {featuredBrand.name}
                        </span>
                        <span className="text-[8px] sm:text-[9px] font-bold tracking-widest text-amber-400 uppercase mt-0.5">
                          BRAND
                        </span>
                      </div>
                    )}
                  </div>
                </Link>

                {/* Right 4x2 Grid */}
                <div className="lg:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                  {rightBrands.map((brand, idx) => {
                    const delayMs = brandSlideState === 'out' ? idx * 40 : idx * 60;
                    return (
                      <Link
                        key={`brand-${brand.name}-${idx}`}
                        to={`/products?search=${encodeURIComponent(brand.name)}`}
                        className="border border-slate-200/80 rounded-xl bg-white p-2 sm:p-4 flex items-center justify-center text-center hover:border-slate-300 hover:shadow-xs transition-colors cursor-pointer group h-16 sm:h-28 lg:h-30 overflow-hidden"
                      >
                        <div
                          style={{ transitionDelay: `${delayMs}ms` }}
                          className={`w-full h-full flex items-center justify-center p-1 transition-all duration-1000 cubic-bezier(0.25, 1, 0.5, 1) transform ${getInnerTransformClass()}`}
                        >
                          {brand.logoUrl ? (
                            <img
                              src={brand.logoUrl}
                              alt={brand.name}
                              className="max-h-10 sm:max-h-16 max-w-full object-contain group-hover:scale-105 transition-transform duration-700 ease-out"
                            />
                          ) : (
                            <div className="w-full h-9 sm:h-11 bg-slate-50 border border-slate-100 rounded-md flex items-center justify-center p-1 sm:p-2 group-hover:bg-slate-100 group-hover:scale-105 transition-all duration-700 ease-out">
                              <span className="text-[10px] sm:text-sm font-bold sm:font-black tracking-wider text-slate-800 uppercase line-clamp-1">
                                {brand.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      </section>
    </div>
  );
}