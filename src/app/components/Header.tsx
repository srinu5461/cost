import { createPortal } from 'react-dom';
import { useState, useEffect, useRef, useMemo, FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router';
import { Search, ShoppingCart, User, Menu, X, Heart, Phone, Clock, ChevronDown, ChevronRight, ArrowRight, Tag, Award, Grid3x3, Mail, Package, LogOut, BookOpen, Home, Snowflake, ShieldCheck, Armchair, ChefHat, Wine, Shirt, Utensils, Sparkles, Coffee, FileText, History, Trash2, ShoppingBag, LayoutGrid } from 'lucide-react';

const categoryIconMap: Record<string, any> = {
  Armchair: Armchair,
  ChefHat: ChefHat,
  Wine: Wine,
  Package: Package,
  Shirt: Shirt,
  Utensils: Utensils,
  Sparkles: Sparkles,
  Snowflake: Snowflake,
  Coffee: Coffee,
  Grid3x3: Grid3x3,
};

import { useCart } from '../context/CartContext';
import { useCMS, CategoryNode } from '../context/CMSContext';
import { logger } from '../utils/logger';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { categoryToSlug } from '../utils/slugify';
import { buildCategoryTree } from '../utils/categoryTree';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { CategoryNavigation } from './CategoryNavigation';
import { QuoteModal } from './QuoteModal';
import { headerConfig } from '../../config/header';
import { useProducts } from '../../hooks/useProducts';
import { staticCategories } from '../../config/categories';
import { getSpecialsForProduct } from '../utils/bogoCalculator';

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
}

// Logo Component with text positioned lower and closer to circle
export function Logo({ className = "h-12 w-auto", isDarkBg = false }: { className?: string; isDarkBg?: boolean }) {
  const textColor = isDarkBg ? "#FFFFFF" : "#2D3748";
  return (
    <svg
      className={className}
      viewBox="0 0 350 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Costplus100 Logo"
    >
      {/* Main Circle Background */}
      <circle cx="40" cy="40" r="34" fill={isDarkBg ? "#E31837" : "#2D3748"} />

      {/* C+ Text in Circle */}
      <text
        x="40"
        y="52"
        fontSize="34"
        fontWeight="900"
        fill="white"
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="-2"
      >
        C+
      </text>

      {/* 100 Badge */}
      <rect x="52" y="16" width="40" height="22" rx="11" fill={isDarkBg ? "#FFFFFF" : "#E31837"} />
      <text
        x="72"
        y="32"
        fontSize="14"
        fontWeight="900"
        fill={isDarkBg ? "#E31837" : "white"}
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        100
      </text>

      {/* COSTPLUS100 Text - moved down and closer to circle */}
      <text
        x="85"
        y="54"
        fontSize="28"
        fontWeight="900"
        fill={textColor}
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="1"
      >
        COST
      </text>
      <text
        x="170"
        y="54"
        fontSize="28"
        fontWeight="900"
        fill="#E31837"
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="1"
      >
        PLUS
      </text>
      <text
        x="255"
        y="54"
        fontSize="28"
        fontWeight="900"
        fill={textColor}
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="1"
      >
        100
      </text>

      {/* Tagline */}
      <text
        x="85"
        y="70"
        fontSize="9"
        fontWeight="700"
        fill={isDarkBg ? "#F87171" : "#E31837"}
        fontFamily="Arial, Helvetica, sans-serif"
        letterSpacing="2"
      >
        TOTAL TRANSPARENCY - NO CATCH
      </text>
    </svg>
  );
}

export function Header() {
  // ===== ALL HOOKS MUST BE AT THE TOP =====
  const { getCartCount, openCartDrawer } = useCart();
  const cms = useCMS();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [menuBrands, setMenuBrands] = useState<any[]>([]);
  const [menuSettings, setMenuSettings] = useState({ showPromotions: true, showBrands: true });
  const [isCategorySidebarOpen, setIsCategorySidebarOpen] = useState(true);
  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [expandedDrawerCategories, setExpandedDrawerCategories] = useState<Record<string, boolean>>({});
  const [isHeaderCategoriesOpen, setIsHeaderCategoriesOpen] = useState(false);
  const [activeHeaderCategory, setActiveHeaderCategory] = useState<any | null>(null);
  const [activeSubCategory, setActiveSubCategory] = useState<any | null>(null);
  const [isStickySearchOpen, setIsStickySearchOpen] = useState(false);

  const getCategoryIconDetails = (name: string) => {
    const n = name.toLowerCase();
    let icon = Grid3x3;
    let bg = '#FFF1F2';
    let color = '#E31837';

    if (n.includes('furniture') || n.includes('chair') || n.includes('table')) { icon = Armchair; bg = '#FFF1F2'; color = '#E31837'; }
    else if (n.includes('machine') || n.includes('cooking') || n.includes('kitchen machine')) { icon = ChefHat; bg = '#EFF6FF'; color = '#2563EB'; }
    else if (n.includes('tableware') || n.includes('bar') || n.includes('glass')) { icon = Wine; bg = '#F0F9FF'; color = '#0284C7'; }
    else if (n.includes('consumable') || n.includes('paper') || n.includes('pack')) { icon = Package; bg = '#FEF3C7'; color = '#D97706'; }
    else if (n.includes('clothing') || n.includes('apron') || n.includes('uniform')) { icon = Shirt; bg = '#ECFDF5'; color = '#059669'; }
    else if (n.includes('ware') || n.includes('storage') || n.includes('utensil')) { icon = Utensils; bg = '#F3E8FF'; color = '#7C3AED'; }
    else if (n.includes('clean') || n.includes('hygiene') || n.includes('wash')) { icon = Sparkles; bg = '#FFEDD5'; color = '#EA580C'; }
    else if (n.includes('refrigeration') || n.includes('ice') || n.includes('fridge') || n.includes('freezer')) { icon = Snowflake; bg = '#CCFBF1'; color = '#0D9488'; }
    else if (n.includes('clearance') || n.includes('special') || n.includes('offer') || n.includes('deal')) { icon = Tag; bg = '#FEF2F2'; color = '#DC2626'; }

    return { icon, bg, color };
  };

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sy = window.scrollY;
          if (sy > 60) {
            setIsScrolled(true);
          } else if (sy < 15) {
            setIsScrolled(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleDrawerCategory = (path: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedDrawerCategories(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  useEffect(() => {
    const handleToggleCategorySidebar = () => setIsCategoryDrawerOpen(prev => !prev);
    const handleToggleProfileSidebar = () => setIsProfileDrawerOpen(prev => !prev);

    window.addEventListener('toggleCategorySidebar', handleToggleCategorySidebar);
    window.addEventListener('toggleProfileSidebar', handleToggleProfileSidebar);

    return () => {
      window.removeEventListener('toggleCategorySidebar', handleToggleCategorySidebar);
      window.removeEventListener('toggleProfileSidebar', handleToggleProfileSidebar);
    };
  }, []);

  // 🔒 Lock body and document root scroll when any mobile/profile drawer is open to prevent double scrollbars
  useEffect(() => {
    if (isProfileDrawerOpen || isCategoryDrawerOpen || isMobileMenuOpen || isStickySearchOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isProfileDrawerOpen, isCategoryDrawerOpen, isMobileMenuOpen, isStickySearchOpen]);
  const searchRef = useRef<HTMLDivElement>(null);

  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // ⚡ PRODUCTS FROM CDN JSON: Load products for search from CDN JSON (instant load)
  const { data: productsFromCDN } = useProducts();


  // Check if customer is logged in
  useEffect(() => {
    const checkCustomer = () => {
      logger.info('Header: Checking customer data from localStorage...');
      const customerData = localStorage.getItem('customer');
      logger.info('Header: Raw localStorage data:', customerData);

      if (customerData) {
        try {
          const parsedCustomer = JSON.parse(customerData);
          logger.info('Header: Parsed customer:', parsedCustomer);
          setCustomer(parsedCustomer);
        } catch (error) {
          logger.error('Header: Error parsing customer data:', error);
          localStorage.removeItem('customer');
        }
      } else {
        logger.info('Header: No customer data found in localStorage');
        setCustomer(null);
      }
    };

    checkCustomer();

    // Listen for storage changes (for cross-tab sync)
    window.addEventListener('storage', checkCustomer);

    // Custom event for same-tab updates
    window.addEventListener('customerLogin', checkCustomer as any);
    window.addEventListener('customerLogout', checkCustomer as any);

    logger.info('Header: Event listeners attached');

    return () => {
      window.removeEventListener('storage', checkCustomer);
      window.removeEventListener('customerLogin', checkCustomer as any);
      window.removeEventListener('customerLogout', checkCustomer as any);
    };
  }, []);

  // Debug: Log customer state changes
  useEffect(() => {
    logger.info('Header: Customer state updated:', customer);
  }, [customer]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!target) return;

      const isInsideDesktop = searchRef.current && searchRef.current.contains(target);
      const isInsideMobile = mobileSearchRef.current && mobileSearchRef.current.contains(target);

      if (!isInsideDesktop && !isInsideMobile) {
        setShowSearchResults(false);
      }
    };

    if (showSearchResults) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showSearchResults]);

  // Data from providers
  const cartCount = getCartCount();

  // ⚡ PROGRESSIVE CATEGORY LOADING: Show L1 first, then L2/L3 in background
  const [showFullTree, setShowFullTree] = useState(false);

  // ⚡ CACHE: Memoize category tree to prevent rebuilding on every render
  const fullCategoryTree = useMemo(() => {
    return buildCategoryTree(cms.data.categoryTree);
  }, [cms.data.categoryTree]);

  // ⚡ STATIC FALLBACK: Convert static categories to CategoryNode format
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

  // Load menu brands from database
  useEffect(() => {
    const loadMenuBrands = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/menu-brands`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const enabledBrands = (data.brands || [])
            .filter((brand: any) => brand.enabled)
            .sort((a: any, b: any) => a.sortOrder - b.sortOrder);
          setMenuBrands(enabledBrands);
        }
      } catch (error) {
        console.error('Error loading menu brands:', error);
      }
    };

    loadMenuBrands();
  }, []);

  // Load menu settings
  useEffect(() => {
    const loadMenuSettings = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/settings/menu`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.menuSettings) {
            setMenuSettings(data.menuSettings);
          }
        }
      } catch (error) {
        console.error('Error loading menu settings:', error);
      }
    };

    loadMenuSettings();
  }, []);

  // ⚡ Guaranteed Complete Categories Tree for Mobile Drawer & Mega Menu (Merges database & static items so 0 items are missing)
  const mergedDrawerCategories = useMemo(() => {
    const cmsCategories = buildCategoryTree(cms.data.categoryTree || []);
    const baseSource = cmsCategories.length > 0 ? cmsCategories : fullCategoryTree;

    const list: any[] = [];

    // 1. Process all categories from CMS / Database first
    (baseSource.length > 0 ? baseSource : staticCategoryNodes).forEach((cat: any) => {
      const normName = (cat.name || '').toLowerCase().trim();
      const slugKey = (cat.slug || categoryToSlug(cat.name)).toLowerCase();

      // Match static category for fallback icons and subchildren if empty
      const staticMatch = staticCategories.find(s =>
        s.slug === slugKey ||
        s.name.toLowerCase() === normName ||
        normName.includes(s.name.toLowerCase()) ||
        s.name.toLowerCase().includes(normName)
      );

      const dbChildren = cat.children || [];
      const staticChildren = staticMatch?.children || [];
      const finalChildren = dbChildren.length > 0 ? dbChildren : staticChildren;

      list.push({
        ...staticMatch,
        ...cat,
        displayName: cat.name.replace(/\b\w/g, (l: string) => l.toUpperCase()),
        iconName: staticMatch?.iconName || cat.iconName || 'Grid3x3',
        children: finalChildren,
        enabled: true
      });
    });

    // 2. Explicitly ensure all static categories (including Clearance And Special Offers) are in the list
    staticCategories.forEach((sc: any) => {
      const scSlug = sc.slug.toLowerCase();
      const scName = sc.name.toLowerCase();

      const alreadyInList = list.some(item =>
        (item.slug && item.slug.toLowerCase() === scSlug) ||
        (item.name && item.name.toLowerCase() === scName)
      );

      if (!alreadyInList) {
        list.push({
          ...sc,
          displayName: sc.name,
          children: sc.children || [],
          enabled: true
        });
      }
    });

    return list;
  }, [cms.data.categoryTree, fullCategoryTree]);

  // ⚡ L1-ONLY tree for initial display (instant load)
  const l1CategoryTree = useMemo(() => {
    // If no data loaded yet, use static categories
    if (fullCategoryTree.length === 0) {
      return staticCategoryNodes;
    }
    // Only show top-level categories (no children) initially
    return fullCategoryTree.map(cat => ({
      ...cat,
      children: [] // Hide children initially for instant display
    }));
  }, [fullCategoryTree, staticCategoryNodes]);

  // Use L1-only tree initially, then switch to full tree after delay
  const categoryTree = showFullTree ? fullCategoryTree : l1CategoryTree;

  // ⚡ Progressively show full tree after L1 is rendered
  useEffect(() => {
    if (fullCategoryTree.length > 0 && !showFullTree) {
      // Show L1 immediately, then reveal L2/L3 after 100ms
      const timer = setTimeout(() => {
        setShowFullTree(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [fullCategoryTree, showFullTree]);

  const header = headerConfig;

  // Handle logout
  const handleLogout = () => {
    logger.info('Header: Logging out customer...');
    localStorage.removeItem('customer');
    setCustomer(null);
    setShowProfileMenu(false);

    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('customerLogout'));

    // Navigate to home page
    navigate('/');
  };

  // Use CDN products for search (or fallback to CMS)
  const products = (productsFromCDN && productsFromCDN.length > 0)
    ? productsFromCDN
    : cms.data.products || [];

  // Search functionality - OPTIMIZED for large datasets
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      return [];
    }

    // Early return if no products available (still loading)
    if (products.length === 0) {
      return [];
    }

    console.log(`🔍 Search triggered with ${products.length} products available`);

    const query = searchQuery.toLowerCase().trim();
    const startTime = performance.now();
    const maxResults = 50;
    const results = [];

    // Early exit optimization: stop once we have enough results
    for (let i = 0; i < products.length && results.length < maxResults; i++) {
      const product = products[i];
      const code = (product.code || '').toLowerCase();
      const name = (product.name || '').toLowerCase();
      const brand = (product.brand || '').toLowerCase();

      if (code.includes(query) || name.includes(query) || brand.includes(query)) {
        results.push(product);
      }
    }

    const duration = performance.now() - startTime;
    logger.info(`✅ Search completed in ${duration.toFixed(2)}ms - Found ${results.length} results`);

    // Log the found products
    if (results.length > 0) {
      logger.info('🔍 Search Results:', results.map(p => ({
        code: p.code,
        name: p.name,
        brand: p.brand
      })));
    }

    return results;
  }, [products, searchQuery]);

  const displayedResults = searchResults.slice(0, 10);
  const hasMoreResults = searchResults.length > 10;

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setShowSearchResults(true);
  };

  const handleSearchInputFocus = () => {
    setShowSearchResults(true);
  };

  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('recent_searches');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const saveRecentSearch = (term: string) => {
    if (!term || term.trim().length < 2) return;
    const cleanTerm = term.trim();
    setRecentSearches(prev => {
      const filtered = prev.filter(t => t.toLowerCase() !== cleanTerm.toLowerCase());
      const updated = [cleanTerm, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('recent_searches', JSON.stringify(updated));
      } catch { }
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem('recent_searches');
    } catch { }
  };

  const handleProductClick = () => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
    }
    setShowSearchResults(false);
    setIsMobileMenuOpen(false);
    setSearchQuery('');
  };

  const handleViewAllResults = () => {
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
      setIsMobileMenuOpen(false);
      setSearchQuery('');
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      saveRecentSearch(searchQuery.trim());
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchResults(false);
      setIsMobileMenuOpen(false);
    }
  };

  const categoriesTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCategoriesMouseEnter = () => {
    if (categoriesTimeoutRef.current) {
      clearTimeout(categoriesTimeoutRef.current);
      categoriesTimeoutRef.current = null;
    }
    setIsHeaderCategoriesOpen(true);
  };

  const handleCategoriesMouseLeave = () => {
    if (categoriesTimeoutRef.current) {
      clearTimeout(categoriesTimeoutRef.current);
    }
    categoriesTimeoutRef.current = setTimeout(() => {
      setIsHeaderCategoriesOpen(false);
      setActiveHeaderCategory(null);
      setActiveSubCategory(null);
    }, 180);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full max-w-[100vw] bg-white shadow-md font-['Poppins',sans-serif]">
        {/* Top Bar - Original Contact Info & Links (Hides on scroll & under 1024px) */}
        <div className={`bg-[#0F172A] border-b border-slate-800 text-xs hidden lg:block w-full text-slate-300 transition-all duration-300 overflow-hidden ${isScrolled ? 'max-h-0 py-0 border-none opacity-0' : 'max-h-12 opacity-100'}`}>
          <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full flex items-center justify-between h-10">
            {/* Left Side: Email, Hours, Phone */}
            <div className="flex items-center gap-6 py-2">
              <a href="mailto:admin@costplus100.com.au" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors">
                <Mail className="size-3.5" />
                <span>admin@costplus100.com.au</span>
              </a>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="size-3.5" />
                Mon - Fri: 9:00 AM - 6:00 PM
              </span>
              <a
                href="tel:1800151624"
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E31837] hover:bg-[#C41230] text-white font-extrabold text-xs transition-all shadow-xs group"
                title="Call 1800 151 624"
              >
                <Phone className="size-3.5 text-white animate-pulse" />
                <span className="tracking-wide font-black">1800 151 624</span>
              </a>
            </div>

            {/* Right Side: Contact Us, About Us & Compact Full-Height Get Quote Button */}
            <div className="flex items-center gap-4 sm:gap-5 h-full">
              <Link to="/contact" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors py-2">
                <Mail className="size-3.5" />
                <span>Contact Us</span>
              </Link>
              <span className="text-slate-700">|</span>
              <Link to="/about" className="flex items-center gap-1.5 text-slate-300 hover:text-white transition-colors py-2">
                <BookOpen className="size-3.5" />
                <span>About Us</span>
              </Link>
              <button
                onClick={() => setShowQuoteModal(true)}
                className="h-full flex items-center gap-2 px-3.5 sm:px-4.5 bg-[#E31837] hover:bg-[#C41230] text-white font-extrabold text-xs sm:text-sm transition-colors cursor-pointer shadow-md ml-1"
              >
                <Phone className="size-3.5 text-white" />
                <span className="font-extrabold tracking-wide">Get Quote</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Header Bar - Always White Background on <600px, Dark Navy on 600-1023px at top of page, White on Scroll or Desktop */}
        <div className={`border-b w-full transition-all duration-300 ${isScrolled
          ? 'bg-white border-slate-200 py-1.5 shadow-md text-slate-900'
          : 'bg-white min-[600px]:bg-[#0F172A] lg:bg-white border-slate-200 min-[600px]:border-slate-800 lg:border-slate-200 py-2 sm:py-2.5 text-slate-900 min-[600px]:text-white lg:text-slate-900'
          }`}>
          <div className="max-w-7xl mx-auto max-[370px]:px-2.5 px-4 lg:px-6 w-full relative">
            <div className="flex items-center justify-between gap-2 max-[370px]:gap-1.5 lg:gap-8 xl:gap-10">

              {/* Left Section: Mobile Menu Button (Hidden on < 600px) */}
              <div className="hidden min-[600px]:flex lg:hidden items-center gap-2 shrink-0">
                <button
                  onClick={() => setIsCategoryDrawerOpen(prev => !prev)}
                  className={`lg:hidden p-1.5 rounded-xl border-0 bg-transparent shrink-0 transition-colors cursor-pointer flex items-center justify-center ${isScrolled
                    ? 'hover:bg-slate-100 text-slate-800'
                    : 'hover:bg-slate-800 text-slate-800 min-[600px]:text-white lg:text-slate-800'
                    }`}
                  aria-label="Toggle Menu & Categories"
                >
                  <Menu className={`size-5 sm:size-6 ${isScrolled ? 'text-slate-800' : 'text-slate-800 min-[600px]:text-white lg:text-slate-800'}`} />
                </button>
              </div>

              {/* Logo Section - Left-aligned on <600px (Fixed height on scroll), Centered on 600-1023px, Left-aligned on >=1024px */}
              <div className="max-[599px]:static max-[599px]:translate-x-0 absolute left-1/2 -translate-x-1/2 lg:static lg:translate-x-0 shrink-0 flex items-center">
                <Link to="/" className="flex items-center min-w-0">
                  {/* For < 600px: Always crisp light logo */}
                  <div className="max-[599px]:block hidden">
                    <Logo isDarkBg={false} className="w-auto max-[370px]:h-9.5 h-11" />
                  </div>
                  {/* For 600px to 1023px */}
                  <div className="hidden min-[600px]:block lg:hidden">
                    <Logo isDarkBg={!isScrolled} className={`w-auto transition-all duration-300 ${isScrolled ? 'h-8 sm:h-9' : 'h-9 sm:h-11'}`} />
                  </div>
                  {/* For >= 1024px */}
                  <div className="hidden lg:block">
                    <Logo isDarkBg={false} className={`w-auto transition-all duration-300 ${isScrolled ? 'h-8 sm:h-9' : 'h-9 sm:h-11 md:h-12'}`} />
                  </div>
                </Link>

                {/* Neat Stylized Categories Dropdown Trigger (Desktop - Right Next to Logo) */}
                <div
                  className="hidden lg:block relative ml-5"
                  onMouseEnter={handleCategoriesMouseEnter}
                  onMouseLeave={handleCategoriesMouseLeave}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsHeaderCategoriesOpen(prev => !prev);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-extrabold transition-all cursor-pointer bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-md border border-slate-800 group"
                    title="Categories"
                  >
                    <svg className="size-4 shrink-0 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="7.5" height="7.5" rx="2.5" />
                      <rect x="13.5" y="3" width="7.5" height="7.5" rx="2.5" />
                      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2.5" />
                      <rect x="3" y="13.5" width="7.5" height="7.5" rx="2.5" />
                    </svg>
                    <span className="text-white">Categories</span>
                    <ChevronDown className={`size-3.5 text-white transition-transform duration-200 ${isHeaderCategoriesOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Inline Navigation Links: Home, Catalogue, Brands (Increased font size text-base min-[1200px]:text-lg min-[1200px]:font-extrabold) */}
              <nav className={`hidden lg:flex items-center shrink-0 transition-all duration-300 ${showSearchResults
                ? 'opacity-0 max-w-0 -ml-6 gap-0 pointer-events-none overflow-hidden'
                : 'gap-5 min-[1200px]:gap-8 opacity-100'
                }`}>
                <Link
                  to="/"
                  className={`relative py-1.5 text-sm sm:text-base min-[1200px]:text-lg font-extrabold min-[1200px]:font-black tracking-tight transition-all ${location.pathname === '/'
                    ? 'text-[#E31837] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-[#E31837] after:rounded-full'
                    : 'text-slate-900 hover:text-[#E31837]'
                    }`}
                >
                  Home
                </Link>

                <Link
                  to="/products"
                  className={`relative py-1.5 text-sm sm:text-base min-[1200px]:text-lg font-extrabold min-[1200px]:font-black tracking-tight transition-all ${location.pathname === '/products'
                    ? 'text-[#E31837] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-[#E31837] after:rounded-full'
                    : 'text-slate-900 hover:text-[#E31837]'
                    }`}
                >
                  Catalogue
                </Link>

                <Link
                  to="/brands"
                  className={`relative py-1.5 text-sm sm:text-base min-[1200px]:text-lg font-extrabold min-[1200px]:font-black tracking-tight transition-all ${location.pathname === '/brands'
                    ? 'text-[#E31837] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[3px] after:bg-[#E31837] after:rounded-full'
                    : 'text-slate-900 hover:text-[#E31837]'
                    }`}
                >
                  Brands
                </Link>
              </nav>

              {/* Desktop Search Bar (>= 1024px) - Expands smoothly when active */}
              <div ref={searchRef} className={`hidden lg:flex relative ml-auto transition-all duration-300 ${showSearchResults
                ? 'flex-1 w-full -ml-4 lg:-ml-8'
                : 'w-[190px] min-[1200px]:w-[260px]'
                }`}>
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative flex items-center">
                    <input
                      type="search"
                      placeholder="Search Product"
                      value={searchQuery}
                      onChange={handleSearchInputChange}
                      onFocus={handleSearchInputFocus}
                      className="w-full h-9.5 sm:h-10.5 pl-4 pr-10 rounded-full bg-white hover:bg-slate-50/80 border border-slate-300 hover:border-slate-400 focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/15 outline-none transition-all text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 font-medium shadow-2xs"
                    />
                    <button
                      type="submit"
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#E31837] p-1 transition-colors cursor-pointer"
                      aria-label="Search"
                    >
                      <Search className="size-4 text-slate-600 hover:text-[#E31837]" />
                    </button>
                  </div>
                </form>

                {/* Search Dropdown Modal - Full width matching the search bar up to Categories */}
                {showSearchResults && (
                  <div className="hidden md:block absolute top-full left-0 right-0 w-full mt-2.5 bg-white border border-slate-200/90 rounded-2xl shadow-2xl z-[100] p-5 animate-in fade-in slide-in-from-top-2 duration-200">
                    {searchQuery.trim().length < 2 ? (
                      <div>
                        {/* Recent Searches Header & Pills */}
                        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
                          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                            <History className="size-4 text-[#E31837]" />
                            <span>Recent Searches</span>
                          </h3>
                          {recentSearches.length > 0 && (
                            <button
                              onClick={clearRecentSearches}
                              className="text-xs text-slate-400 hover:text-[#E31837] transition-colors flex items-center gap-1 font-semibold cursor-pointer"
                            >
                              <Trash2 className="size-3" />
                              <span>Clear</span>
                            </button>
                          )}
                        </div>

                        {recentSearches.length > 0 ? (
                          <div className="flex flex-wrap gap-2 py-1">
                            {recentSearches.map((term, i) => (
                              <button
                                key={i}
                                onClick={() => {
                                  setSearchQuery(term);
                                  saveRecentSearch(term);
                                  navigate(`/products?search=${encodeURIComponent(term)}`);
                                  setShowSearchResults(false);
                                }}
                                className="px-3.5 py-1.5 bg-slate-100 hover:bg-[#E31837] text-slate-800 hover:text-white font-bold text-xs rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs group"
                              >
                                <History className="size-3 text-slate-400 group-hover:text-white transition-colors" />
                                <span>{term}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 py-2">No search history yet</p>
                        )}
                      </div>
                    ) : (
                      <div>
                        {/* Search Results Header */}
                        <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
                          <p className="text-xs text-slate-500 font-bold">
                            Found {searchResults.length} product{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
                          </p>
                          {searchResults.length > 0 && (
                            <button
                              onClick={handleViewAllResults}
                              className="text-xs text-[#E31837] font-bold hover:underline cursor-pointer"
                            >
                              View All Results
                            </button>
                          )}
                        </div>

                        {displayedResults.length > 0 ? (
                          <div className="max-h-[420px] overflow-y-auto space-y-1 pr-1">
                            {displayedResults.map((product) => (
                              <Link
                                key={product.id}
                                to={`/products/${product.id}`}
                                onClick={handleProductClick}
                                className="flex items-center gap-3.5 p-2.5 hover:bg-slate-50 rounded-xl transition-colors group"
                              >
                                <div className="w-12 h-12 bg-slate-100 rounded-lg shrink-0 overflow-hidden p-1 border border-slate-200/60">
                                  {(product.mainImageUrl || product.image) ? (
                                    <img src={product.mainImageUrl || product.image} alt={product.name} className="w-full h-full object-contain" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                      <Package className="size-5" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-slate-900 group-hover:text-[#E31837] truncate transition-colors">{product.name}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {product.code && <span className="text-[11px] text-slate-400 font-medium">Code: {product.code}</span>}
                                    {product.brand && <span className="text-[11px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">{product.brand}</span>}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <span className="text-xs text-[#E31837] font-extrabold group-hover:underline">View Product</span>
                                </div>
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-slate-400">
                            <p className="text-sm font-medium">No products found matching "{searchQuery}"</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Far Right Section: Mobile Search, Account & Cart Actions */}
              <div className="flex items-center gap-2 sm:gap-3 min-[1200px]:gap-6 shrink-0 ml-auto lg:ml-0">
                {/* Mobile Phone Call Button (< 600px) */}
                <a
                  href="tel:1800151624"
                  className="max-[599px]:flex hidden items-center gap-1.5 px-3 py-1.5 max-[370px]:px-2.5 max-[370px]:py-1.5 bg-[#E31837] hover:bg-[#C41230] text-white font-extrabold text-xs rounded-xl cursor-pointer shrink-0 shadow-xs transition-colors"
                  title="Call 1800 151 624"
                >
                  <Phone className="size-3.5 text-white shrink-0" />
                  <span className="tracking-wide font-extrabold whitespace-nowrap">1800 151 624</span>
                </a>

                {/* Mobile Search Icon Button (600px to 1023px) */}
                <button
                  onClick={() => setIsStickySearchOpen(prev => !prev)}
                  className={`hidden min-[600px]:flex lg:hidden items-center justify-center p-1.5 rounded-xl border-0 bg-transparent transition-colors cursor-pointer ${isScrolled
                    ? 'hover:bg-slate-100 text-slate-800 hover:text-[#E31837]'
                    : 'hover:bg-slate-800 text-white hover:text-red-400'
                    }`}
                  title="Search Products"
                  aria-label="Toggle Search"
                >
                  <Search className={`size-5 ${isScrolled ? 'text-slate-800' : 'text-white'}`} />
                </button>

                {/* Cart Button (Hidden on < 600px because bottom bar has Cart tab with live counter) */}
                <button
                  onClick={openCartDrawer}
                  className={`hidden min-[600px]:flex items-center gap-1.5 group p-1.5 rounded-xl transition-colors cursor-pointer ${isScrolled
                    ? 'hover:bg-slate-100 text-slate-800 hover:text-[#E31837]'
                    : 'hover:bg-slate-800 lg:hover:bg-slate-100 text-white lg:text-slate-800 hover:text-red-400 lg:hover:text-[#E31837]'
                    }`}
                  title="My Cart"
                >
                  <div className="relative">
                    <ShoppingCart className={`size-5 transition-colors ${isScrolled
                      ? 'text-slate-800 group-hover:text-[#E31837]'
                      : 'text-white lg:text-slate-800 group-hover:text-red-400 lg:group-hover:text-[#E31837]'
                      }`} />
                    <span className="absolute -top-1.5 -right-2 bg-[#E31837] text-white text-[10px] font-extrabold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-2xs">
                      {cartCount}
                    </span>
                  </div>
                  <span className="hidden min-[1200px]:inline font-bold text-[15px] text-slate-800 group-hover:text-[#E31837] transition-colors">
                    Cart
                  </span>
                </button>

                {/* Account / Login Button */}
                {customer ? (
                  <button
                    onClick={() => setIsProfileDrawerOpen(prev => !prev)}
                    className="hidden min-[600px]:flex items-center gap-2.5 cursor-pointer p-1 rounded-xl transition-all hover:bg-slate-100/80 group"
                    title="My Account"
                  >
                    {/* Dark Circular Icon Badge */}
                    <div className="w-9 h-9 rounded-full bg-[#1E293B] group-hover:bg-[#E31837] transition-colors flex items-center justify-center text-white shrink-0 shadow-xs">
                      <User className="size-4.5 text-white" />
                    </div>

                    {/* Stacked Customer Name & Subtitle */}
                    <div className="hidden min-[1200px]:flex flex-col text-left leading-tight pr-0.5">
                      <span className="font-extrabold text-sm text-slate-900 group-hover:text-[#E31837] transition-colors truncate max-w-[110px]">
                        {customer.firstName || (customer.name ? customer.name.split(' ')[0] : 'Kasi')}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-700">
                        My Account
                      </span>
                    </div>

                    {/* Dropdown Arrow */}
                    <ChevronDown className="hidden min-[1200px]:block size-4 text-slate-500 group-hover:text-[#E31837] transition-colors" />
                  </button>
                ) : (
                  <Link
                    to="/customer/login"
                    className="hidden min-[600px]:flex items-center gap-2.5 cursor-pointer p-1 rounded-xl transition-all hover:bg-slate-100/80 group"
                    title="Login"
                  >
                    {/* Red Circular Icon Badge */}
                    <div className="w-9 h-9 rounded-full bg-[#E31837] group-hover:bg-[#C41230] transition-colors flex items-center justify-center text-white shrink-0 shadow-xs">
                      <User className="size-4.5 text-white" />
                    </div>

                    {/* Stacked Login & Subtitle */}
                    <div className="hidden min-[1200px]:flex flex-col text-left leading-tight pr-0.5">
                      <span className="font-extrabold text-sm text-slate-900 group-hover:text-[#E31837] transition-colors">
                        Login
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 group-hover:text-slate-700">
                        or Register
                      </span>
                    </div>

                    {/* Chevron Arrow */}
                    <ChevronRight className="hidden min-[1200px]:block size-4 text-slate-400 group-hover:text-[#E31837] transition-colors" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── MOBILE SEARCH BAR & CART ICON ROW (ONLY FOR SCREENS < 600px) ── */}
        <div className="max-[599px]:block hidden px-3.5 pb-2.5 pt-1.5 bg-white border-b border-slate-200/80 relative">
          <div className="flex items-center gap-2.5 w-full">
            <form onSubmit={handleSearch} className="relative flex-1" ref={mobileSearchRef}>
              <input
                type="text"
                placeholder="Search products, brands, codes..."
                value={searchQuery}
                onChange={handleSearchInputChange}
                onFocus={handleSearchInputFocus}
                className="w-full h-10 pl-4 pr-10 rounded-xl bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/15 outline-none transition-all text-xs font-semibold text-slate-900 placeholder:text-slate-400 shadow-2xs"
              />
              <button
                type="submit"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#E31837] p-1 transition-colors cursor-pointer"
                aria-label="Search"
              >
                <Search className="size-4 text-slate-500 hover:text-[#E31837]" />
              </button>
            </form>

            {/* Cart Icon Button Next to Mobile Search Bar */}
            <button
              onClick={openCartDrawer}
              className="relative p-2 h-10 w-10 rounded-xl bg-slate-100/90 hover:bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-800 hover:text-[#E31837] transition-all cursor-pointer shrink-0 shadow-2xs"
              title="Cart"
              aria-label="Open Cart"
            >
              <ShoppingCart className="size-5 text-slate-800 hover:text-[#E31837]" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#E31837] text-white text-[10px] font-extrabold rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Autocomplete Search Results Dropdown overlay for <600px */}
          {showSearchResults && searchQuery.trim().length >= 2 && displayedResults.length > 0 && (
            <div className="absolute top-full left-3.5 right-3.5 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-[350px] overflow-y-auto z-[99999] p-2">
              <p className="text-[11px] text-slate-400 px-2 py-1 font-bold">
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
              </p>
              {displayedResults.map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  onClick={handleProductClick}
                  className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <div className="w-10 h-10 bg-slate-100 rounded flex-shrink-0 overflow-hidden">
                    {(product.mainImageUrl || product.image) && (
                      <img src={product.mainImageUrl || product.image} alt={product.name} className="w-full h-full object-contain" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{product.name}</p>
                    {product.code && <p className="text-[10px] text-slate-400">Code: {product.code}</p>}
                  </div>
                  <span className="text-[11px] text-[#E31837] font-bold shrink-0">View →</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Mega Dropdown Menu (2-Column) - Bounded strictly inside max-w-7xl content container */}
        {isHeaderCategoriesOpen && (
          <div className="absolute top-full left-0 right-0 w-full pointer-events-none z-[99999]">
            <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full pointer-events-auto">
              <div
                className="bg-white rounded-none border-x border-b border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 flex flex-col"
                onMouseEnter={handleCategoriesMouseEnter}
                onMouseLeave={handleCategoriesMouseLeave}
              >
                {/* 2-Column Clean Layout */}
                <div className="flex divide-x divide-slate-100 min-h-[380px] max-h-[480px]">
                  {/* Left Column: Department List (No Scrollbar, Smaller Font Size) */}
                  <div className="w-72 bg-slate-50/80 p-2.5 shrink-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden flex flex-col justify-between">
                    <div className="space-y-0.5">
                      <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Select Department
                      </div>
                      {(fullCategoryTree.length > 0 ? fullCategoryTree : staticCategoryNodes).map((categoryNode) => {
                        const iconDetails = getCategoryIconDetails(categoryNode.name);
                        const IconComp = iconDetails.icon;
                        const currentCat = activeHeaderCategory || fullCategoryTree[0] || staticCategoryNodes[0];
                        const isHovered = currentCat?.fullPath === categoryNode.fullPath;
                        const displayName = categoryNode.name.replace(/\b\w/g, (l: string) => l.toUpperCase());

                        return (
                          <div
                            key={categoryNode.fullPath}
                            onMouseEnter={() => {
                              setActiveHeaderCategory(categoryNode);
                              setActiveSubCategory(null);
                            }}
                            className={`flex items-center justify-between py-2 px-2.5 rounded-lg transition-all cursor-pointer ${isHovered
                              ? 'bg-white shadow-xs border-l-4 border-[#E31837] text-[#E31837] font-extrabold border-y border-r border-slate-200/80'
                              : 'text-slate-700 font-semibold hover:bg-slate-100/80'
                              }`}
                            onClick={() => {
                              navigate(`/products/c/${categoryToSlug(categoryNode.fullPath)}`);
                              setIsHeaderCategoriesOpen(false);
                              setActiveSubCategory(null);
                            }}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`size-6.5 rounded-md ${iconDetails.bg} flex items-center justify-center shrink-0`}>
                                <IconComp className={`size-3.5 ${iconDetails.color}`} />
                              </div>
                              <span className="text-[11px] truncate font-bold">{displayName}</span>
                            </div>
                            <ChevronRight className={`size-3 shrink-0 ${isHovered ? 'text-[#E31837] translate-x-0.5' : 'text-slate-300'} transition-transform`} />
                          </div>
                        );
                      })}
                    </div>

                    {/* View All Categories Link at Bottom Left */}
                    <div className="pt-2 mt-2 border-t border-slate-200/80">
                      <Link
                        to="/categories"
                        onClick={() => {
                          setIsHeaderCategoriesOpen(false);
                          setActiveSubCategory(null);
                        }}
                        className="flex items-center justify-between py-2 px-2.5 rounded-lg bg-rose-50 hover:bg-[#E31837] text-[#E31837] hover:text-white font-extrabold text-[11px] transition-all cursor-pointer group shadow-2xs border border-rose-200/60 hover:border-[#E31837]"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Grid3x3 className="size-3.5 text-[#E31837] group-hover:text-white transition-colors shrink-0" />
                          <span>View All Categories</span>
                        </div>
                        <ArrowRight className="size-3 text-[#E31837] group-hover:text-white group-hover:translate-x-1 transition-all shrink-0" />
                      </Link>
                    </div>
                  </div>

                  {/* Right Panel: Clean Subcategories Pill Card Grid (Full Width) */}
                  <div className="flex-1 p-5 sm:p-6 overflow-y-auto bg-white flex flex-col justify-between [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-50">
                    {(() => {
                      const currentCat = activeHeaderCategory || fullCategoryTree[0] || staticCategoryNodes[0];
                      if (!currentCat) return null;
                      const displayName = currentCat.name.replace(/\b\w/g, (l: string) => l.toUpperCase());

                      return (
                        <div className="flex flex-col h-full justify-between">
                          <div>
                            {/* Title Header Bar */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-5">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">{displayName}</h3>
                                  <span className="bg-rose-50 text-[#E31837] text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase border border-rose-100">
                                    Commercial Supplies
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">Explore certified commercial equipment and catering stock</p>
                              </div>
                              <Link
                                to={`/products/c/${categoryToSlug(currentCat.fullPath)}`}
                                onClick={() => {
                                  setIsHeaderCategoriesOpen(false);
                                  setActiveSubCategory(null);
                                }}
                                className="text-xs font-extrabold text-white bg-[#E31837] hover:bg-[#C41230] px-4.5 py-2 rounded-lg shadow-2xs transition-all hover:scale-105"
                              >
                                View All
                              </Link>
                            </div>

                            {/* Clean 4-Column Pill Cards Grid on Desktop (Reduced Font Size for 4-in-a-row fit) */}
                            {currentCat.children && currentCat.children.length > 0 ? (
                              <div
                                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5"
                                onMouseLeave={() => setActiveSubCategory(null)}
                              >
                                {currentCat.children.map((subCat: any) => {
                                  const subName = subCat.name.replace(/\b\w/g, (l: string) => l.toUpperCase());
                                  const hasSubItems = subCat.children && subCat.children.length > 0;
                                  const isExpanded = hasSubItems && activeSubCategory?.fullPath === subCat.fullPath;

                                  return (
                                    <div
                                      key={subCat.fullPath}
                                      className="relative group/pill"
                                      onMouseEnter={() => {
                                        if (hasSubItems) setActiveSubCategory(subCat);
                                      }}
                                    >
                                      {/* Clean Pill Button Card */}
                                      <Link
                                        to={`/products/c/${categoryToSlug(subCat.fullPath)}`}
                                        onClick={() => {
                                          setIsHeaderCategoriesOpen(false);
                                          setActiveSubCategory(null);
                                        }}
                                        className={`flex items-center justify-between p-2.5 sm:p-3 rounded-lg border transition-all cursor-pointer ${isExpanded
                                          ? 'bg-white border-[#E31837] shadow-md ring-1 ring-[#E31837]/20'
                                          : 'bg-[#F8FAFC] hover:bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                                          }`}
                                      >
                                        <span className="font-extrabold text-xs text-slate-800 group-hover/pill:text-[#E31837] transition-colors truncate pr-1">
                                          {subName}
                                        </span>
                                        {hasSubItems && (
                                          <ChevronRight className={`size-3.5 transition-transform duration-200 shrink-0 ${isExpanded ? 'text-[#E31837] rotate-90' : 'text-slate-600 group-hover/pill:text-[#E31837]'}`} />
                                        )}
                                      </Link>

                                      {/* Hover Flyout for 3rd level items */}
                                      {isExpanded && hasSubItems && (
                                        <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                                          <p className="text-[10px] font-black uppercase text-slate-400 px-2.5 py-1 tracking-wider">Subcategories</p>
                                          <div className="space-y-0.5 max-h-48 overflow-y-auto">
                                            {subCat.children.map((leaf: any) => {
                                              const leafName = (typeof leaf === 'string' ? leaf : leaf.name).replace(/\b\w/g, (l: string) => l.toUpperCase());
                                              const leafPath = typeof leaf === 'string' ? leaf : leaf.fullPath || leaf.name;

                                              return (
                                                <Link
                                                  key={leafPath}
                                                  to={`/products/c/${categoryToSlug(leafPath)}`}
                                                  onClick={() => {
                                                    setIsHeaderCategoriesOpen(false);
                                                    setActiveSubCategory(null);
                                                  }}
                                                  className="flex items-center justify-between px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-[#E31837] hover:bg-white rounded-lg transition-colors"
                                                >
                                                  <span>• {leafName}</span>
                                                  <ChevronRight className="size-3 text-slate-300" />
                                                </Link>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="py-12 text-center text-slate-400 text-xs">
                                <Package className="size-10 text-slate-300 mx-auto mb-2" />
                                <p className="font-bold text-slate-800 text-sm mb-1">Direct Products in {displayName}</p>
                                <p className="text-slate-500 max-w-md mx-auto mb-4">Browse our complete range of certified commercial kitchen equipment.</p>
                                <Link
                                  to={`/products/c/${categoryToSlug(currentCat.fullPath)}`}
                                  onClick={() => setIsHeaderCategoriesOpen(false)}
                                  className="inline-block px-5 py-2.5 bg-[#E31837] text-white text-xs font-bold rounded-lg shadow-xs hover:bg-[#C41230] transition-colors"
                                >
                                  Shop {displayName} Products Now
                                </Link>
                              </div>
                            )}
                          </div>

                          {/* Guarantee Footer */}
                          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                            <span className="flex items-center gap-2">
                              <ShieldCheck className="size-4 text-[#E31837]" />
                              Cost Plus 100 Guarantee — Total Commercial Pricing Transparency
                            </span>
                            <a href="tel:1800151624" className="font-bold text-[#E31837] hover:underline flex items-center gap-1.5">
                              <Phone className="size-3.5" /> 1800 151 624
                            </a>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sticky & Mobile Slide-Down Search Overlay Bar (Adapts dark/light theme dynamically) */}
        {isStickySearchOpen && (
          <div className={`w-full p-3.5 shadow-2xl animate-in fade-in slide-in-from-top-1 duration-200 relative z-50 border-t ${isScrolled
            ? 'bg-white/98 backdrop-blur-md border-slate-200 text-slate-900'
            : 'bg-[#0B132B]/95 backdrop-blur-md border-slate-800 text-white'
            }`}>
            <div className="max-w-4xl mx-auto relative flex items-center gap-2.5">
              <form onSubmit={handleSearch} className="flex-1 relative flex items-center">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                <input
                  type="search"
                  autoFocus
                  placeholder="Search products by name, code, or brand..."
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  onFocus={handleSearchInputFocus}
                  className={`w-full h-11 pl-10 pr-24 text-xs sm:text-sm placeholder:text-slate-400 border focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/30 outline-none font-medium rounded-xl transition-colors ${isScrolled
                    ? 'bg-slate-50 text-slate-900 border-slate-300 focus:bg-white'
                    : 'bg-slate-800/90 text-white border-slate-700'
                    }`}
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3.5 bg-[#E31837] hover:bg-[#C41230] text-white text-xs font-extrabold rounded-lg transition-colors cursor-pointer"
                >
                  Search
                </button>
              </form>
              <button
                onClick={() => {
                  setIsStickySearchOpen(false);
                  setShowSearchResults(false);
                }}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer shrink-0 ${isScrolled
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-300 border-slate-700'
                  }`}
                aria-label="Close Search"
                title="Close Search"
              >
                <X className="size-5" />
              </button>

              {/* Search Results Dropdown in Sticky Overlay */}
              {showSearchResults && displayedResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-[450px] overflow-y-auto z-[99999]">
                  <div className="p-2">
                    <p className="text-xs text-slate-500 px-3 py-2 font-medium">
                      Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
                    </p>
                    {displayedResults.map((product) => (
                      <Link
                        key={product.id}
                        to={`/products/${product.id}`}
                        onClick={() => {
                          handleProductClick();
                          setIsStickySearchOpen(false);
                        }}
                        className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <div className="w-12 h-12 bg-slate-100 rounded flex-shrink-0 overflow-hidden">
                          {(product.mainImageUrl || product.image) && (
                            <img src={product.mainImageUrl || product.image} alt={product.name} className="w-full h-full object-contain" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">{product.name}</p>
                          {product.code && <p className="text-xs text-slate-500">Code: {product.code}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-[#E31837] font-semibold">View details →</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}


        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="relative lg:hidden bg-white border-t shadow-lg max-h-[60vh] overflow-y-auto z-50">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <nav className="flex flex-col gap-2">
                {/* Categories Section */}
                <div className="border-b pb-3 mb-2">
                  <h3 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-2 px-3">Categories</h3>
                  {categoryTree.filter(cat => cat.enabled !== false).slice(0, 10).map((category) => {
                    const isExpanded = expandedCategory === category.fullPath;
                    const hasChildren = category.children && category.children.length > 0;

                    return (
                      <div key={category.fullPath}>
                        <div className="flex items-center">
                          <Link
                            to={`/products/c/${categoryToSlug(category.fullPath)}`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex-1 flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                          >
                            <span className="font-medium text-sm">{category.name}</span>
                            {category.productCount > 0 && (
                              <span className="text-xs text-slate-500">({category.productCount})</span>
                            )}
                          </Link>
                          {hasChildren && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-2"
                              onClick={() => setExpandedCategory(isExpanded ? null : category.fullPath)}
                            >
                              {isExpanded ? (
                                <ChevronDown className="size-4 text-[#E31837]" />
                              ) : (
                                <ChevronRight className="size-4" />
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Subcategories */}
                        {hasChildren && isExpanded && (
                          <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-3">
                            {category.children.filter(subCat => subCat.enabled !== false).slice(0, 8).map((subCat) => (
                              <Link
                                key={subCat.fullPath}
                                to={`/products/c/${categoryToSlug(subCat.fullPath)}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block p-2 hover:bg-slate-50 rounded text-sm text-slate-700 hover:text-[#E31837] transition-colors"
                              >
                                {subCat.name}
                                {subCat.productCount > 0 && (
                                  <span className="text-xs text-slate-500 ml-1">({subCat.productCount})</span>
                                )}
                              </Link>
                            ))}
                            {category.children.filter(subCat => subCat.enabled !== false).length > 8 && (
                              <Link
                                to={`/products/c/${categoryToSlug(category.fullPath)}`}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block p-2 text-sm text-[#E31837] font-medium"
                              >
                                View All ({category.children.filter(subCat => subCat.enabled !== false).length})
                              </Link>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Main Navigation Links */}
                <div className="border-t pt-2 mt-2">
                  <h3 className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-2 px-3">Quick Links</h3>

                  <Link
                    to="/"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Home className="size-5 text-[#E31837]" />
                    <span className="font-medium">Home</span>
                  </Link>

                  <Link
                    to="/products"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <BookOpen className="size-5 text-[#E31837]" />
                    <span className="font-medium">
                      Costplus <span className="text-[#E31837] font-black">$100</span> Catalogue
                    </span>
                  </Link>

                  <Link
                    to="/contact"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Mail className="size-5 text-[#E31837]" />
                    <span className="font-medium">Contact Us</span>
                  </Link>

                  <a
                    href="tel:1800151624"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 bg-[#E31837]/10 hover:bg-[#E31837]/20 rounded-lg transition-colors w-full text-left"
                  >
                    <Phone className="size-5 text-[#E31837]" />
                    <span className="font-medium text-[#E31837]">Call 1800 151 624</span>
                  </a>

                  <Link
                    to="/brands"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Award className="size-5 text-[#E31837]" />
                    <span className="font-medium">Brands</span>
                  </Link>

                  <Link
                    to="/products?multibuy=true"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors"
                  >
                    <Tag className="size-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">Multi-buy Deals</span>
                  </Link>

                  {/* Dynamic Menu Brands */}
                  {menuBrands.map((brand) => (
                    <Link
                      key={brand.id}
                      to={brand.path || `/brands/${brand.slug}?sort=priceHigh`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                      <Grid3x3 className="size-5 text-[#E31837]" />
                      <span className="font-medium">{brand.name}</span>
                    </Link>
                  ))}
                </div>

                {/* Customer Links in Mobile Menu */}
                {customer ? (
                  <>
                    <div className="border-t pt-2 mt-2">
                      <p className="text-xs uppercase tracking-wide font-semibold text-slate-500 mb-2 px-3">My Account</p>
                      <Link
                        to="/customer/dashboard"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                      >
                        <User className="size-5 text-[#E31837]" />
                        <span className="font-medium">Dashboard</span>
                      </Link>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-2 p-3 hover:bg-red-50 rounded-lg transition-colors w-full text-left text-red-600"
                      >
                        <LogOut className="size-5" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <Link
                    to="/customer/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg transition-colors border-t pt-4 mt-2"
                  >
                    <User className="size-5 text-[#E31837]" />
                    <span className="font-medium">Login / Register</span>
                  </Link>
                )}

                <Link
                  to="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-3 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <span className="font-medium">About Us</span>
                </Link>
              </nav>
            </div>
          </div>
        )}

        {/* ── LEFT OFF-CANVAS CATEGORY DRAWER VIA PORTAL (ONLY FOR SCREENS < 1200px) ── */}
        {createPortal(
          <div
            className={`fixed inset-0 z-[99999] min-[1200px]:hidden flex transition-opacity duration-300 ${isCategoryDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
          >
            {/* Dark Backdrop */}
            <div
              className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 cursor-pointer ${isCategoryDrawerOpen ? 'opacity-100' : 'opacity-0'
                }`}
              onClick={() => setIsCategoryDrawerOpen(false)}
            />

            {/* Left Drawer Panel */}
            <div
              className={`relative w-80 max-w-[85vw] bg-white h-full max-h-screen shadow-2xl flex flex-col z-10 transition-transform duration-300 ease-out ${isCategoryDrawerOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
              {/* Header */}
              <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <Menu className="size-5 text-[#E31837]" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">All Categories</h3>
                </div>
                <button
                  onClick={() => setIsCategoryDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* 3-Level Category Tree - Standard clean outline icons matching reference design */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2.5 custom-scrollbar">
                {mergedDrawerCategories.map((l1: any) => {
                  const displayName = l1.displayName || l1.name.replace(/\b\w/g, (l: string) => l.toUpperCase());
                  const staticMatch = staticCategories.find(s =>
                    s.name.toLowerCase() === l1.name.toLowerCase() ||
                    l1.name.toLowerCase().includes(s.name.toLowerCase()) ||
                    s.name.toLowerCase().includes(l1.name.toLowerCase())
                  );
                  const fallbackDetails = getCategoryIconDetails(l1.name);

                  const IconComponent = staticMatch ? (categoryIconMap[staticMatch.iconName] || Armchair) : fallbackDetails.icon;
                  const keyPath = l1.fullPath || l1.path || l1.slug || l1.name;
                  const isL1Expanded = !!expandedDrawerCategories[keyPath];
                  const hasL2Children = l1.children && l1.children.length > 0;

                  return (
                    <div key={keyPath} className="py-1">
                      <div className="flex items-center justify-between p-2.5 hover:bg-slate-50 transition-colors group rounded-xl">
                        <Link
                          to={`/products/c/${categoryToSlug(l1.fullPath || l1.name)}`}
                          onClick={() => setIsCategoryDrawerOpen(false)}
                          className="flex items-center gap-3.5 min-w-0 flex-1"
                        >
                          <IconComponent className="size-5 text-slate-700 group-hover:text-[#E31837] shrink-0 transition-colors" />

                          <span className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-[#E31837] transition-colors truncate">
                            {displayName}
                          </span>
                        </Link>

                        {hasL2Children && (
                          <button
                            onClick={(e) => toggleDrawerCategory(keyPath, e)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#E31837] hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                            title="Expand subcategories"
                          >
                            <ChevronRight className={`size-4 transition-transform duration-200 ${isL1Expanded ? 'rotate-90 text-[#E31837]' : ''}`} />
                          </button>
                        )}
                      </div>

                      {hasL2Children && isL1Expanded && (
                        <div className="ml-5 pl-3 border-l-2 border-slate-200 my-1 space-y-1.5 animate-in fade-in duration-150">
                          {l1.children.map((l2: any) => {
                            const l2RawName = typeof l2 === 'string' ? l2 : (l2.name || l2.fullPath || '');
                            const l2DisplayName = l2RawName.replace(/\b\w/g, (l: string) => l.toUpperCase());
                            const l2Key = l2.fullPath || l2.path || l2.name || l2DisplayName;
                            const isL2Expanded = !!expandedDrawerCategories[l2Key];
                            const hasL3Children = (l2.children && l2.children.length > 0) || (l2.items && l2.items.length > 0);

                            return (
                              <div key={l2Key}>
                                <div className="flex items-center justify-between py-1.5 px-2 hover:bg-slate-100/70 rounded-lg transition-colors group">
                                  <Link
                                    to={`/products/c/${categoryToSlug(l2.fullPath || l2.name || l2DisplayName)}`}
                                    onClick={() => setIsCategoryDrawerOpen(false)}
                                    className="text-xs font-bold text-slate-800 group-hover:text-[#E31837] transition-colors truncate flex-1"
                                  >
                                    {l2DisplayName}
                                    {l2.productCount > 0 && (
                                      <span className="text-[11px] text-slate-400 font-medium ml-1.5">({l2.productCount})</span>
                                    )}
                                  </Link>

                                  {hasL3Children && (
                                    <button
                                      onClick={(e) => toggleDrawerCategory(l2Key, e)}
                                      className="p-1 rounded text-slate-400 hover:text-[#E31837] shrink-0 cursor-pointer"
                                    >
                                      <ChevronRight className={`size-3.5 transition-transform duration-200 ${isL2Expanded ? 'rotate-90 text-[#E31837]' : ''}`} />
                                    </button>
                                  )}
                                </div>

                                {hasL3Children && isL2Expanded && (
                                  <div className="ml-4 pl-2 border-l border-slate-300 my-1 space-y-1 animate-in fade-in duration-150">
                                    {l2.children?.map((l3: any) => {
                                      const l3Name = (typeof l3 === 'string' ? l3 : l3.name).replace(/\b\w/g, (l: string) => l.toUpperCase());
                                      return (
                                        <Link
                                          key={typeof l3 === 'string' ? l3 : l3.fullPath || l3.name}
                                          to={`/products/c/${categoryToSlug(typeof l3 === 'string' ? l3 : l3.fullPath || l3.name)}`}
                                          onClick={() => setIsCategoryDrawerOpen(false)}
                                          className="block py-1 px-2 text-[11px] font-semibold text-slate-600 hover:text-[#E31837] hover:bg-slate-100 rounded transition-colors"
                                        >
                                          • {l3Name}
                                        </Link>
                                      );
                                    }) || l2.items?.map((item: string) => (
                                      <Link
                                        key={item}
                                        to={`/products/c/${categoryToSlug(item)}`}
                                        onClick={() => setIsCategoryDrawerOpen(false)}
                                        className="block py-1 px-2 text-[11px] font-semibold text-slate-600 hover:text-[#E31837] hover:bg-slate-100 rounded transition-colors"
                                      >
                                        • {item}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="p-3 bg-slate-50 border-t border-slate-200">
                <Link
                  to="/products"
                  onClick={() => setIsCategoryDrawerOpen(false)}
                  className="w-full flex items-center justify-center gap-2 bg-[#E31837] hover:bg-[#C41230] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-colors shadow-xs"
                >
                  <Grid3x3 className="size-4" />
                  <span>View All Products</span>
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* ── RIGHT OFF-CANVAS PROFILE & QUICK LINKS DRAWER VIA PORTAL (ABSOLUTE TOP LAYER z-[99999]) ── */}
        {createPortal(
          <div
            className={`fixed inset-0 z-[99999] flex justify-end transition-opacity duration-300 ${isProfileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
          >
            <div
              className={`fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 cursor-pointer ${isProfileDrawerOpen ? 'opacity-100' : 'opacity-0'
                }`}
              onClick={() => setIsProfileDrawerOpen(false)}
            />

            <div
              className={`relative w-80 max-w-[85vw] bg-white h-full max-h-screen shadow-2xl flex flex-col z-10 pb-16 min-[600px]:pb-0 transition-transform duration-300 ease-out ${isProfileDrawerOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
              <div className="bg-[#0F172A] text-white p-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <User className="size-5 text-[#E31837]" />
                  <h3 className="font-extrabold text-sm uppercase tracking-wider">My Account &amp; Links</h3>
                </div>
                <button
                  onClick={() => setIsProfileDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                {/* Account & Cart */}
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 mb-2 px-1">Account &amp; Cart</h4>
                  <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                    <Link
                      to={customer ? "/customer/dashboard" : "/customer/login"}
                      onClick={() => setIsProfileDrawerOpen(false)}
                      className="flex items-center gap-3 p-2.5 hover:bg-white rounded-lg text-slate-800 hover:text-[#E31837] font-extrabold text-xs transition-colors"
                    >
                      <User className="size-4.5 text-[#E31837]" />
                      <span>{customer ? `${customer.firstName || 'My Account'} (Dashboard)` : 'Log In / Register'}</span>
                    </Link>

                    <Link
                      to="/cart"
                      onClick={() => setIsProfileDrawerOpen(false)}
                      className="flex items-center gap-3 p-2.5 hover:bg-white rounded-lg text-slate-800 hover:text-[#E31837] font-extrabold text-xs transition-colors"
                    >
                      <ShoppingCart className="size-4.5 text-[#E31837]" />
                      <span>My Cart ({cartCount})</span>
                    </Link>
                  </div>
                </div>

                {/* Quick Links */}
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 mb-2 px-1">Quick Links</h4>
                  <div className="space-y-1">
                    <Link to="/" onClick={() => setIsProfileDrawerOpen(false)} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl text-slate-800 hover:text-[#E31837] font-bold text-xs transition-colors">
                      <Home className="size-4 text-[#E31837]" />
                      <span>Home</span>
                    </Link>
                    <Link to="/products" onClick={() => setIsProfileDrawerOpen(false)} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl text-slate-800 hover:text-[#E31837] font-bold text-xs transition-colors">
                      <BookOpen className="size-4 text-[#E31837]" />
                      <span>Costplus <span className="text-[#E31837] font-black">$100</span> Catalogue</span>
                    </Link>
                    <Link to="/contact" onClick={() => setIsProfileDrawerOpen(false)} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl text-slate-800 hover:text-[#E31837] font-bold text-xs transition-colors">
                      <Mail className="size-4 text-[#E31837]" />
                      <span>Contact Us</span>
                    </Link>
                    <Link to="/about" onClick={() => setIsProfileDrawerOpen(false)} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl text-slate-800 hover:text-[#E31837] font-bold text-xs transition-colors">
                      <FileText className="size-4 text-[#E31837]" />
                      <span>About Us</span>
                    </Link>
                    <Link to="/brands" onClick={() => setIsProfileDrawerOpen(false)} className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl text-slate-800 hover:text-[#E31837] font-bold text-xs transition-colors">
                      <Award className="size-4 text-[#E31837]" />
                      <span>Brands</span>
                    </Link>
                    <Link to="/products?multibuy=true" onClick={() => setIsProfileDrawerOpen(false)} className="flex items-center gap-3 p-2.5 bg-amber-50 hover:bg-amber-100 rounded-xl text-amber-900 font-bold text-xs transition-colors">
                      <Tag className="size-4 text-amber-600" />
                      <span>Multi-buy Wholesale Deals</span>
                    </Link>
                    {menuBrands.map((brand) => (
                      <Link
                        key={brand.id}
                        to={brand.path || `/brands/${brand.slug}?sort=priceHigh`}
                        onClick={() => setIsProfileDrawerOpen(false)}
                        className="flex items-center gap-3 p-2.5 hover:bg-slate-50 rounded-xl text-slate-800 hover:text-[#E31837] font-bold text-xs transition-colors"
                      >
                        <ShieldCheck className="size-4 text-[#0284C7]" />
                        <span>{brand.name}</span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Contact & Customer Support Section */}
                <div>
                  <h4 className="text-[11px] uppercase tracking-wider font-extrabold text-slate-400 mb-2 px-1">Contact &amp; Support</h4>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-2.5">
                    <a href="mailto:admin@costplus100.com.au" className="flex items-center gap-2.5 text-xs text-slate-700 hover:text-[#E31837] transition-colors">
                      <Mail className="size-4 text-[#E31837] shrink-0" />
                      <span className="font-semibold truncate">admin@costplus100.com.au</span>
                    </a>
                    <div className="flex items-center gap-2.5 text-xs text-slate-600">
                      <Clock className="size-4 text-slate-500 shrink-0" />
                      <span className="font-medium">Mon – Fri: 9:00 AM – 6:00 PM</span>
                    </div>
                    <a href="tel:1800151624" className="flex items-center gap-2.5 text-xs font-black text-[#E31837]">
                      <Phone className="size-4 text-[#E31837] shrink-0" />
                      <span>1800 151 624</span>
                    </a>

                    <button
                      onClick={() => {
                        setIsProfileDrawerOpen(false);
                        setShowQuoteModal(true);
                      }}
                      className="w-full flex items-center justify-center gap-2 bg-[#E31837] hover:bg-[#C41230] text-white py-2.5 px-4 rounded-xl text-xs font-extrabold transition-colors shadow-xs mt-2 cursor-pointer"
                    >
                      <Phone className="size-4 text-white" />
                      <span>Get Quote</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bottom Drawer Footer: Logout Button */}
              {customer && (
                <div className="p-3 bg-slate-50 border-t border-slate-200 mt-auto shrink-0">
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsProfileDrawerOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 py-2.5 px-4 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    <LogOut className="size-4 text-rose-600" />
                    <span>Logout ({customer.firstName || customer.email})</span>
                  </button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

        {/* ── APP MOBILE FIXED BOTTOM NAVIGATION BAR (ONLY FOR SCREENS < 600px) ── */}
        <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] py-1.5 px-2 min-[600px]:hidden flex items-center justify-around">
          {/* 1. Home */}
          <Link
            to="/"
            onClick={() => {
              setIsCategoryDrawerOpen(false);
              setIsProfileDrawerOpen(false);
            }}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all ${location.pathname === '/' && !isCategoryDrawerOpen && !isProfileDrawerOpen
              ? 'text-[#E31837] font-extrabold scale-105'
              : 'text-slate-500 hover:text-slate-900 font-semibold'
              }`}
          >
            <Home className="size-5" />
            <span className="text-[10px] tracking-tight">Home</span>
          </Link>

          {/* 2. Products */}
          <Link
            to="/products"
            onClick={() => {
              setIsCategoryDrawerOpen(false);
              setIsProfileDrawerOpen(false);
            }}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all ${location.pathname.startsWith('/products') && !isCategoryDrawerOpen && !isProfileDrawerOpen
              ? 'text-[#E31837] font-extrabold scale-105'
              : 'text-slate-500 hover:text-slate-900 font-semibold'
              }`}
          >
            <ShoppingBag className="size-5" />
            <span className="text-[10px] tracking-tight">Products</span>
          </Link>

          {/* 3. Categories */}
          <button
            onClick={() => {
              setIsProfileDrawerOpen(false);
              setIsCategoryDrawerOpen(prev => !prev);
            }}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${isCategoryDrawerOpen || location.pathname === '/categories'
              ? 'text-[#E31837] font-extrabold scale-105'
              : 'text-slate-500 hover:text-slate-900 font-semibold'
              }`}
          >
            <LayoutGrid className="size-5" />
            <span className="text-[10px] tracking-tight">Categories</span>
          </button>

          {/* 4. Cart */}
          <button
            onClick={() => {
              setIsCategoryDrawerOpen(false);
              setIsProfileDrawerOpen(false);
              openCartDrawer();
            }}
            className="flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl text-slate-500 hover:text-slate-900 font-semibold transition-all cursor-pointer relative"
          >
            <div className="relative">
              <ShoppingCart className="size-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-[#E31837] text-white text-[9px] font-black rounded-full h-4 min-w-[16px] px-1 flex items-center justify-center shadow-2xs animate-in zoom-in-50">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] tracking-tight">Cart</span>
          </button>

          {/* 5. Profile */}
          <button
            onClick={() => {
              setIsCategoryDrawerOpen(false);
              setIsProfileDrawerOpen(false);
              navigate('/profile');
            }}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 px-2 rounded-xl transition-all cursor-pointer ${location.pathname === '/profile'
              ? 'text-[#E31837] font-extrabold scale-105'
              : 'text-slate-500 hover:text-slate-900 font-semibold'
              }`}
          >
            <User className="size-5" />
            <span className="text-[10px] tracking-tight">Profile</span>
          </button>
        </div>

      </header>
      <QuoteModal open={showQuoteModal} onClose={() => setShowQuoteModal(false)} />
    </>
  );
}