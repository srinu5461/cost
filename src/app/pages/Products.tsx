import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link, useParams, useNavigate } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { MultiBuyEquipmentCard } from '../components/MultiBuyEquipmentCard';
import { useCMS } from '../context/CMSContext';
import type { CategoryNode } from '../context/CMSContext';
import { useProducts } from '../../hooks/useProducts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Search, SlidersHorizontal, ChevronRight, ChevronDown, Home, ChevronLeft, X, LayoutGrid, List } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { buildCategoryTree } from '../utils/categoryTree';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Slider } from '../components/ui/slider';
import { Separator } from '../components/ui/separator';
import { logger } from '../utils/logger';
import { slugToCategory, categoryToSlug } from '../utils/slugify';
import { SEOHead, generateBreadcrumbSchema } from '../components/SEOHead';

export function Products() {
  // ✅ Get metadata from CMS (categories, header, footer)
  let data;
  let cmsLoading = true;
  try {
    const cms = useCMS();
    data = cms.data;
    cmsLoading = cms.loading;
  } catch (e) {
    logger.error('Products: CMSProvider not available, using empty data', e);
    cmsLoading = false;
    data = {
      products: [],
      categories: [],
      categoryTree: [],
      header: { logo: '', phone: '', workingHours: '', navigation: [] },
      footer: { about: '', email: '', phone: '', address: '', socialMedia: {} },
      homepage: { hero: { title: '', subtitle: '', image: '' }, features: [] },
    };
  }

  // ⚡ Get products from CDN JSON (instant load with fallback)
  const { data: productsFromCDN, isLoading: productsLoading, isError: productsError } = useProducts();

  // ✅ SMART FALLBACK: Use CDN if available, otherwise use CMS products
  const cmsProducts = data.products || [];
  const products = (productsFromCDN && productsFromCDN.length > 0)
    ? productsFromCDN
    : cmsProducts;

  // Show loading skeleton while we have nothing to show yet
  const hasAnyProducts = products.length > 0;
  const loading = cmsLoading || (productsLoading && !hasAnyProducts);
  const [searchParams, setSearchParams] = useSearchParams();
  const { categorySlug } = useParams();
  const navigate = useNavigate();

  // Special brand slugs map to dynamic filters (SEO-friendly clean URLs)
  const BRAND_SLUG_MAP: Record<string, { importSource?: string; brandSearch?: string; title: string }> = {
    'simco-group': { importSource: 'simco', title: 'Simco Group' },
    'polar-refrigeration': { brandSearch: 'polar', title: 'Polar Refrigeration' },
    'thor-cooking': { brandSearch: 'thor', title: 'Thor Cooking' },
  };
  const brandSlugConfig = categorySlug ? BRAND_SLUG_MAP[categorySlug] : null;

  // Convert slug to category name if using slug-based URL (skip for brand slugs)
  const categoryFromSlug = categorySlug && !brandSlugConfig
    ? slugToCategory(categorySlug, data.categoryTree || [])
    : null;

  const categoryParam = categoryFromSlug || (brandSlugConfig ? 'All Equipment' : searchParams.get('category') || 'All Equipment');
  const sectionParam = searchParams.get('section'); // Get section filter
  const searchParam = searchParams.get('search') || ''; // Get search from URL
  const multibuyParam = searchParams.get('multibuy') === 'true'; // Multi-buy filter
  const importSourceParam = searchParams.get('importSource') || (brandSlugConfig?.importSource ?? '');
  const brandSearchParam = brandSlugConfig?.brandSearch ?? '';
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [searchQuery, setSearchQuery] = useState(searchParam); // Initialize with URL param
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Featured sections state
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [popularIds, setPopularIds] = useState<string[]>([]);
  const [promotionIds, setPromotionIds] = useState<string[]>([]);
  const [sectionsLoading, setSectionsLoading] = useState(true);

  // Section configuration state
  const [sectionsConfig, setSectionsConfig] = useState<Array<{
    id: string;
    name: string;
    description: string;
    active: boolean;
    displayOrder: number;
  }>>([]);

  // Filter states
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedBrands, setSelectedBrands] = useState<Set<string>>(new Set());
  const [showInStockOnly, setShowInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState<string>('featured');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const PRODUCTS_PER_PAGE = 15;

  // Mobile & Desktop filter states
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showDesktopFilters, setShowDesktopFilters] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Debug logging
  useEffect(() => {
    const dataSource = productsFromCDN && productsFromCDN.length > 0 ? 'CDN JSON' : 'CMS API (fallback)';

    logger.debug('Products Page - Data loaded', {
      totalProducts: products.length,
      loading,
      searchParam,
      categoryParam,
      sectionParam,
      searchQuery,
      selectedCategory,
      dataSource,
      productsLoading,
      productsError,
    });

    // Log fallback info
    if (productsError) {
      console.warn('⚠️  CDN JSON failed, using CMS API fallback:', productsError);
    }
    if (dataSource === 'CDN JSON') {
      console.log(`✅ [Products Page] Using CDN JSON (${products.length} products)`);
    } else {
      console.log(`ℹ️  [Products Page] Using CMS API fallback (${products.length} products)`);
    }
  }, [products, loading, searchParam, categoryParam, sectionParam, searchQuery, selectedCategory, productsFromCDN, productsLoading, productsError]);

  // Fetch featured sections
  useEffect(() => {
    if (sectionParam) {
      fetchFeaturedSections();
    } else {
      setSectionsLoading(false);
    }
  }, [sectionParam]);

  const fetchFeaturedSections = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/featured-sections`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey || ''}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        logger.info('Featured sections loaded on Products page', data);
        setFeaturedIds(data.featured || []);
        setPopularIds(data.popular || []);
        setPromotionIds(data.promotion || []);
        setSectionsConfig(data.config || []);
      }
    } catch (error) {
      logger.error('Failed to fetch featured sections', error);
    } finally {
      setSectionsLoading(false);
    }
  };

  // Helper to get section config by ID
  const getSectionConfig = (sectionId: string) => {
    return sectionsConfig.find(s => s.id === sectionId);
  };

  // Sync selectedCategory with URL parameter (handles nav bar links changing the URL)
  useEffect(() => {
    setSelectedCategory(categoryParam);
    setCurrentPage(1);
    setSelectedBrands(new Set());
    setShowInStockOnly(false);
  }, [categoryParam, multibuyParam]);

  // Sync searchQuery with URL parameter
  useEffect(() => {
    const newSearchQuery = searchParam;
    setSearchQuery(newSearchQuery);

    // 🔍 IMPORTANT: When search query is present, reset category to "All Equipment"
    if (newSearchQuery && newSearchQuery.trim()) {
      setSelectedCategory('All Equipment');
      // Also update URL to remove category parameter
      if (categoryParam !== 'All Equipment') {
        setSearchParams({ search: newSearchQuery });
      }
    }
  }, [searchParam]);

  // Build tree from category tree data - MEMOIZE THIS!
  const categoryTree = useMemo(() => {
    return buildCategoryTree(data.categoryTree);
  }, [data.categoryTree]);

  const hasTreeData = categoryTree.length > 0;

  // Auto-expand all L1 categories when the tree first loads
  useEffect(() => {
    if (categoryTree.length > 0 && expandedCategories.size === 0 && selectedCategory === 'All Equipment') {
      setExpandedCategories(new Set(categoryTree.map(n => n.fullPath)));
    }
  }, [categoryTree]);

  // Helper: Build a comprehensive map from category IDs, codes, paths, and names to fullPaths
  const categoryIdToPath = useMemo(() => {
    const map = new Map<string, string>();

    const buildCategoryMap = (nodes: CategoryNode[]) => {
      nodes.forEach((node) => {
        if (node.code && typeof node.code === 'string' && node.code.trim()) {
          map.set(node.code.trim(), node.fullPath);
        }
        if (node.id && typeof node.id === 'string' && node.id.trim()) {
          map.set(node.id.trim(), node.fullPath);
        }
        if ((node as any).categoryId && typeof (node as any).categoryId === 'string' && (node as any).categoryId.trim()) {
          map.set(String((node as any).categoryId).trim(), node.fullPath);
        }
        if ((node as any).path && typeof (node as any).path === 'string' && (node as any).path.trim()) {
          map.set(String((node as any).path).trim(), node.fullPath);
        }
        if (node.name && typeof node.name === 'string' && node.name.trim()) {
          map.set(node.name.trim().toLowerCase(), node.fullPath);
        }
        if (node.fullPath && typeof node.fullPath === 'string' && node.fullPath.trim()) {
          map.set(node.fullPath.trim().toLowerCase(), node.fullPath);
        }
        if (node.children && Array.isArray(node.children) && node.children.length > 0) {
          buildCategoryMap(node.children);
        }
      });
    };

    if (categoryTree && categoryTree.length > 0) {
      buildCategoryMap(categoryTree);
    }

    return map;
  }, [categoryTree]);

  // Compute product counts for each category path
  const categoryProductCounts = useMemo(() => {
    const counts = new Map<string, number>();

    products.forEach((p) => {
      const productCategoryIds = [
        (p as any).categoryLevel1Id,
        (p as any).categoryLevel2Id,
        (p as any).categoryLevel3Id,
        (p as any).categoryLevel4Id,
      ].filter(Boolean);

      const matchedPaths = new Set<string>();

      productCategoryIds.forEach((id) => {
        const fullPath = categoryIdToPath.get(id);
        if (fullPath) {
          // Add this path and all parent segments
          const parts = fullPath.split(' > ');
          parts.forEach((_, i) => matchedPaths.add(parts.slice(0, i + 1).join(' > ')));
        }
      });

      // Fallback if product has category string directly
      if (p.category && matchedPaths.size === 0) {
        matchedPaths.add(p.category);
      }

      matchedPaths.forEach((path) => {
        counts.set(path, (counts.get(path) || 0) + 1);
      });
    });

    return counts;
  }, [products, categoryIdToPath]);

  // Accordion toggle: expands target branch while closing unselected main categories
  const toggleExpanded = (path: string) => {
    const isCurrentlyExpanded = expandedCategories.has(path);
    if (isCurrentlyExpanded) {
      const nextExpanded = new Set(expandedCategories);
      nextExpanded.delete(path);
      setExpandedCategories(nextExpanded);
    } else {
      // Expand target path and keep only its ancestor path hierarchy open
      const parts = path.split(' > ');
      const ancestorPaths = new Set<string>();
      parts.forEach((_, i) => {
        ancestorPaths.add(parts.slice(0, i + 1).join(' > '));
      });
      setExpandedCategories(ancestorPaths);
    }
  };

  // Sync selectedCategory with URL parameter
  useEffect(() => {
    setSelectedCategory(categoryParam);
  }, [categoryParam]);

  // Auto-expand the tree to show the selected category
  useEffect(() => {
    if (selectedCategory && selectedCategory !== 'All Equipment' && categoryTree.length > 0) {
      // Find all parent paths that need to be expanded
      const pathsToExpand = new Set<string>();

      // Helper function to find the node and its parents
      const findNodeAndParents = (nodes: CategoryNode[], targetPath: string, parentPath: string = ''): boolean => {
        for (const node of nodes) {
          const currentPath = node.fullPath;

          if (currentPath === targetPath) {
            // Found the target! Expand all parents
            if (parentPath) {
              pathsToExpand.add(parentPath);
            }
            return true;
          }

          if (node.children && node.children.length > 0) {
            // Check children recursively
            if (findNodeAndParents(node.children, targetPath, currentPath)) {
              // One of the children matched, so we need to expand this node
              pathsToExpand.add(currentPath);
              return true;
            }
          }
        }
        return false;
      };

      // Find and expand all parent paths
      findNodeAndParents(categoryTree, selectedCategory);

      // Update expanded categories
      if (pathsToExpand.size > 0) {
        setExpandedCategories(pathsToExpand);
      }
    }
  }, [selectedCategory, categoryTree]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Removed verbose console logs to reduce noise

    // Filter by section (featured/popular/promotion)
    if (sectionParam && !sectionsLoading) {
      let sectionIds: string[] = [];
      if (sectionParam === 'featured') sectionIds = featuredIds;
      else if (sectionParam === 'popular') sectionIds = popularIds;
      else if (sectionParam === 'promotion') sectionIds = promotionIds;

      if (sectionIds.length > 0) {
        filtered = filtered.filter((p) => sectionIds.includes(p.id));
        console.log(`✅ Section filtered to ${filtered.length} products for section: ${sectionParam}`);
      }
      // If no IDs configured, show all products (don't blank the page)
    }

    // Filter by multibuy parameter (Multi-buy Wholesale Deals)
    if (multibuyParam) {
      const multibuyMatched = filtered.filter((p: any) => p.hasMultiBuy === true || (p.multiBuyOptions && p.multiBuyOptions.length >= 1));
      if (multibuyMatched.length >= 4) {
        filtered = multibuyMatched;
      } else {
        // Fallback: attach 3-tier bulk options to all products so every card displays multi-buy wholesale pricing
        filtered = filtered.map((p: any) => {
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
      }
    }

    // Filter by category (support hierarchical filtering + robust segment matching across all 4 levels)
    if (selectedCategory && selectedCategory !== 'All Equipment') {
      console.log('🏷️ Filtering by category:', selectedCategory);
      const selCatLower = selectedCategory.toLowerCase().trim();

      // Normalize segment text (remove generic noise like "& hotel supplies", "& ice machines", extra punctuation)
      const normalizeSeg = (s: string) => s.toLowerCase()
        .replace(/& hotel supplies/g, '')
        .replace(/and hotel supplies/g, '')
        .replace(/& ice machines/g, '')
        .replace(/and ice machines/g, '')
        .replace(/& storage/g, '')
        .replace(/and storage/g, '')
        .replace(/& bar supplies/g, '')
        .replace(/and bar supplies/g, '')
        .replace(/& hygiene/g, '')
        .replace(/and hygiene/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .trim();

      const getSegs = (str: string) => str.split(/ > |\//).map(normalizeSeg).filter(Boolean);
      const selSegs = getSegs(selectedCategory);

      filtered = filtered.filter((p: any) => {
        // Collect all possible category candidate strings for this product
        const candidatePaths: string[] = [];

        // 1. Check category IDs mapping first
        const productCategoryIds = [
          p.categoryLevel1Id,
          p.categoryLevel2Id,
          p.categoryLevel3Id,
          p.categoryLevel4Id,
          p.categoryId,
        ].filter((id): id is string => Boolean(id) && typeof id === 'string' && id.trim() !== '');

        for (let i = productCategoryIds.length - 1; i >= 0; i--) {
          const categoryId = productCategoryIds[i].trim();
          const mappedPath = categoryIdToPath.get(categoryId);
          if (mappedPath) candidatePaths.push(mappedPath);
        }

        // 2. Add direct category strings
        if (p.category) candidatePaths.push(String(p.category));
        if (p.wholePath) candidatePaths.push(String(p.wholePath));
        if (p.categoryName) candidatePaths.push(String(p.categoryName));

        // Evaluate matches for each candidate path
        for (const cand of candidatePaths) {
          if (!cand) continue;
          const candLower = cand.toLowerCase().trim();

          // Simple exact/prefix check (Candidate must start with Selected category)
          if (candLower === selCatLower) return true;
          if (candLower.startsWith(selCatLower + ' > ')) return true;

          // Normalized segment evaluation
          const candSegs = getSegs(cand);
          if (selSegs.length === 0 || candSegs.length === 0) continue;

          // Exact leaf match (e.g. selected "Table Tops" and candidate ends with "table tops")
          const selLeaf = selSegs[selSegs.length - 1];
          const candLeaf = candSegs[candSegs.length - 1];
          if (selLeaf && candLeaf && selLeaf === candLeaf) return true;

          // Candidate starts with selected segments (Selecting a parent category includes all its subcategory children)
          if (candSegs.length >= selSegs.length) {
            let matches = true;
            for (let i = 0; i < selSegs.length; i++) {
              if (candSegs[i] !== selSegs[i] && !candSegs[i].includes(selSegs[i]) && !selSegs[i].includes(candSegs[i])) {
                matches = false;
                break;
              }
            }
            if (matches) return true;
          }
        }

        return false;
      });

      console.log(`🏷️ Category filtered to ${filtered.length} products for category: ${selectedCategory}`);
    }

    // Filter by search query
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();

      filtered = filtered.filter((p) => {
        const code = (p.code || '').toLowerCase();
        const name = (p.name || '').toLowerCase();
        const brand = (p.brand || '').toLowerCase();
        const description = (p.description || '').toLowerCase();

        return code.includes(query) ||
          name.includes(query) ||
          brand.includes(query) ||
          description.includes(query);
      });

      console.log(`🔍 Search results: ${filtered.length} products found for "${searchQuery}"`);
    }

    // Filter by price range
    if (priceRange[0] > 0 || priceRange[1] < 10000) {
      filtered = filtered.filter((p) => {
        const price = typeof p.price === 'string'
          ? parseFloat(p.price.replace(/[^0-9.-]+/g, ''))
          : p.price;
        return price >= priceRange[0] && price <= priceRange[1];
      });

      console.log(`Price range filtered to ${filtered.length} products for range: ${priceRange}`);
    }

    // Filter by brands
    if (selectedBrands.size > 0) {
      filtered = filtered.filter((p) => selectedBrands.has(p.brand));

      console.log(`Brand filtered to ${filtered.length} products for brands: ${Array.from(selectedBrands)}`);
    }

    // Filter by importSource (e.g. all Simco group brands)
    if (importSourceParam) {
      filtered = filtered.filter((p) => (p.importSource || '').toLowerCase() === importSourceParam.toLowerCase());
    }

    // Filter by brand search (e.g. polar, thor)
    if (brandSearchParam) {
      filtered = filtered.filter((p) => (p.brand || '').toLowerCase().includes(brandSearchParam.toLowerCase()));
    }

    // Filter by stock availability
    if (showInStockOnly) {
      filtered = filtered.filter((p) => p.inStock);

      console.log(`In stock filtered to ${filtered.length} products`);
    }

    // Sort products
    switch (sortBy) {
      case 'priceLow':
        filtered = [...filtered].sort((a, b) => {
          const priceA = typeof a.price === 'string'
            ? parseFloat(a.price.replace(/[^0-9.-]+/g, ''))
            : (typeof a.price === 'number' ? a.price : 0);
          const priceB = typeof b.price === 'string'
            ? parseFloat(b.price.replace(/[^0-9.-]+/g, ''))
            : (typeof b.price === 'number' ? b.price : 0);
          return priceA - priceB;
        });
        break;
      case 'priceHigh':
        filtered = [...filtered].sort((a, b) => {
          const priceA = typeof a.price === 'string'
            ? parseFloat(a.price.replace(/[^0-9.-]+/g, ''))
            : (typeof a.price === 'number' ? a.price : 0);
          const priceB = typeof b.price === 'string'
            ? parseFloat(b.price.replace(/[^0-9.-]+/g, ''))
            : (typeof b.price === 'number' ? b.price : 0);
          return priceB - priceA;
        });
        break;
      case 'name':
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'featured':
      default:
        // 'featured' - keep original order, no sorting needed
        break;
    }

    // Always push products without images to the end
    const hasImage = (p: any) => p.image && p.image.trim() !== '' && !p.image.includes('placeholder');

    // For Simco distributor page: images-first sorted by price desc, then no-image sorted by price desc
    if (importSourceParam) {
      const getPrice = (p: any) => typeof p.price === 'string'
        ? parseFloat(p.price.replace(/[^0-9.-]+/g, ''))
        : (typeof p.price === 'number' ? p.price : 0);
      const byPriceDesc = (a: any, b: any) => getPrice(b) - getPrice(a);
      const withImg = filtered.filter(hasImage).sort(byPriceDesc);
      const noImg = filtered.filter(p => !hasImage(p)).sort(byPriceDesc);
      filtered = [...withImg, ...noImg];
    } else {
      // ⭐ PRIORITY PRODUCTS: Polar refrigeration (no spares), Thor cooking equipment (no small items), Apuro
      const priorityProducts: typeof filtered = [];
      const regularProducts: typeof filtered = [];

      filtered.forEach((product) => {
        const brand = (product.brand || '').toLowerCase().trim();
        const name = (product.name || '').toLowerCase();
        const category = (product.category || '').toLowerCase();
        const wholePath = (product.wholePath || '').toLowerCase();

        const isSmallItem = name.includes('spare') ||
          name.includes('part') ||
          name.includes('seal') ||
          name.includes('gasket') ||
          name.includes('hinge') ||
          name.includes('handle') ||
          name.includes('shelf') ||
          name.includes('replacement') ||
          name.includes('knob') ||
          name.includes('burner') ||
          name.includes('tray') ||
          name.includes('rack') ||
          name.includes('pan') ||
          name.includes('pot') ||
          name.includes('utensil') ||
          category.includes('spare') ||
          category.includes('part') ||
          category.includes('accessories') ||
          category.includes('smallwares') ||
          wholePath.includes('spare') ||
          wholePath.includes('part') ||
          wholePath.includes('accessories') ||
          wholePath.includes('smallwares');

        const isRefrigeration = name.includes('fridge') ||
          name.includes('freezer') ||
          name.includes('refrigerat') ||
          name.includes('chiller') ||
          name.includes('cooler') ||
          category.includes('refrigerat') ||
          category.includes('fridge') ||
          category.includes('freezer') ||
          wholePath.includes('refrigerat') ||
          wholePath.includes('fridge') ||
          wholePath.includes('freezer');

        const isCookingEquipment = name.includes('oven') ||
          name.includes('range') ||
          name.includes('grill') ||
          name.includes('fryer') ||
          name.includes('griddle') ||
          name.includes('cooker') ||
          name.includes('hob') ||
          name.includes('stove') ||
          name.includes('broiler') ||
          category.includes('cooking') ||
          category.includes('oven') ||
          category.includes('range') ||
          wholePath.includes('cooking') ||
          wholePath.includes('oven') ||
          wholePath.includes('range');

        const isPriorityProduct = (brand === 'polar' && isRefrigeration && !isSmallItem) ||
          (brand === 'thor' && isCookingEquipment && !isSmallItem) ||
          brand === 'apuro';

        if (isPriorityProduct) {
          priorityProducts.push(product);
        } else {
          regularProducts.push(product);
        }
      });

      priorityProducts.sort((a, b) => {
        const priceA = typeof a.price === 'string'
          ? parseFloat(a.price.replace(/[^0-9.-]+/g, ''))
          : (typeof a.price === 'number' ? a.price : 0);
        const priceB = typeof b.price === 'string'
          ? parseFloat(b.price.replace(/[^0-9.-]+/g, ''))
          : (typeof b.price === 'number' ? b.price : 0);
        return priceB - priceA;
      });

      filtered = [...priorityProducts, ...regularProducts];
      filtered = [...filtered.filter(hasImage), ...filtered.filter(p => !hasImage(p))];
    }

    console.log('🔍 FILTERING END - Final count:', filtered.length);

    return filtered;
  }, [selectedCategory, searchQuery, products, categoryIdToPath, priceRange, selectedBrands, showInStockOnly, sortBy, sectionParam, sectionsLoading, featuredIds, popularIds, promotionIds, importSourceParam, brandSearchParam]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === 'All Equipment') {
      navigate(multibuyParam ? '/products?multibuy=true' : '/products');
    } else {
      const slug = categoryToSlug(category);
      navigate(`/products/c/${slug}`);
    }
  };

  // Get breadcrumb trail from selected category
  const getBreadcrumbs = () => {
    // If viewing a section (featured, popular, promotion)
    if (sectionParam) {
      const sectionConfig = getSectionConfig(sectionParam);
      const sectionName = sectionConfig?.name || sectionParam.charAt(0).toUpperCase() + sectionParam.slice(1);
      return [
        { name: 'Home', path: '/' },
        { name: sectionName, path: sectionParam }
      ];
    }

    if (selectedCategory === 'All Equipment') {
      return [{ name: 'Home', path: '/' }, { name: multibuyParam ? 'All Multi-buy Products' : 'All Equipment', path: 'All Equipment' }];
    }

    const parts = selectedCategory.split(' > ');
    const breadcrumbs = [{ name: 'Home', path: '/' }];

    let currentPath = '';
    parts.forEach((part, index) => {
      currentPath = index === 0 ? part : `${currentPath} > ${part}`;
      breadcrumbs.push({ name: part, path: currentPath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // Generate category/brand-specific SEO content
  const generateCategorySEO = () => {
    // Brand slug pages get their own dedicated SEO
    if (brandSlugConfig) {
      const brandSEO: Record<string, { title: string; description: string; keywords: string }> = {
        'simco-group': {
          title: 'Simco Group Commercial Equipment Australia - Simco, Atosa, Cookrite, Mixrite',
          description: 'Shop the full Simco Group range — Simco, Atosa, Cookrite, Mixrite, Jasper and more. Commercial kitchen equipment including refrigeration, cooking, food prep and storage. Australia-wide delivery from Sydney, Melbourne, Brisbane, Perth.',
          keywords: 'simco commercial equipment, atosa refrigeration, cookrite cooking equipment, mixrite, simco group australia, commercial kitchen equipment simco, simco catering equipment sydney, simco catering equipment melbourne',
        },
        'polar-refrigeration': {
          title: 'Polar Commercial Refrigeration Australia - Fridges, Freezers & Chillers',
          description: 'Browse the full Polar refrigeration range. Commercial fridges, chest freezers, display chillers, prep counters and ice machines for restaurants, cafes and hotels. Best prices with Australia-wide delivery.',
          keywords: 'polar refrigeration australia, polar commercial fridge, polar freezer, polar display chiller, polar prep counter, commercial refrigeration sydney, commercial refrigeration melbourne, commercial fridge australia',
        },
        'thor-cooking': {
          title: 'Thor Commercial Cooking Equipment Australia - Ranges, Ovens & Fryers',
          description: 'Shop Thor commercial cooking equipment — gas ranges, convection ovens, deep fryers, griddles and more. Heavy-duty cooking gear for restaurants, hotels and commercial kitchens. Australia-wide delivery.',
          keywords: 'thor cooking equipment australia, thor commercial range, thor gas oven, thor fryer, thor commercial kitchen, commercial cooking equipment sydney, commercial cooking equipment melbourne, gas range australia',
        },
      };
      const slug = categorySlug || '';
      if (brandSEO[slug]) return brandSEO[slug];
      // Fallback for unknown brand slugs
      return {
        title: `${brandSlugConfig.title} - Commercial Catering Equipment Australia`,
        description: `Shop the full ${brandSlugConfig.title} range of commercial kitchen equipment. Australia-wide delivery from Sydney, Melbourne, Brisbane.`,
        keywords: `${brandSlugConfig.title.toLowerCase()}, commercial catering equipment australia, restaurant equipment`,
      };
    }

    const category = selectedCategory === 'All Equipment' ? 'Commercial Catering Equipment' : selectedCategory;
    const lastCategory = category.split(' > ').pop() || category;

    // Category-specific keywords mapping
    const categoryKeywords: Record<string, string> = {
      'refrigeration': 'commercial refrigerators, fridges, freezers, cold storage, display chillers',
      'cooking': 'commercial ovens, ranges, grills, fryers, cooking equipment',
      'oven': 'commercial ovens, convection ovens, combi ovens, pizza ovens, bakery ovens',
      'dishwash': 'commercial dishwashers, glasswashers, warewashing, kitchen dishwashing',
      'preparation': 'food prep equipment, work tables, cutting boards, prep stations',
      'food service': 'serving equipment, buffet equipment, food display, catering supplies',
      'beverage': 'coffee machines, beverage dispensers, drink equipment, bar equipment',
      'storage': 'shelving, storage containers, racking, kitchen storage',
      'cookware': 'pots, pans, commercial cookware, kitchen utensils'
    };

    // Find matching keywords
    let specificKeywords = '';
    for (const [key, keywords] of Object.entries(categoryKeywords)) {
      if (lastCategory.toLowerCase().includes(key)) {
        specificKeywords = keywords;
        break;
      }
    }

    const baseKeywords = `${lastCategory}, commercial catering equipment, catering equipment sydney, catering equipment melbourne, catering equipment brisbane, restaurant equipment, hospitality equipment, professional kitchen equipment`;
    const fullKeywords = specificKeywords ? `${specificKeywords}, ${baseKeywords}` : baseKeywords;

    return {
      title: selectedCategory === 'All Equipment'
        ? 'Commercial Catering Equipment Australia - Restaurant & Kitchen Supplies'
        : `${lastCategory} - Commercial Catering Equipment Sydney, Melbourne, Brisbane`,
      description: `Professional ${lastCategory.toLowerCase()} for commercial kitchens in Sydney, Melbourne, Brisbane, Perth, and Adelaide. ${specificKeywords ? `Including ${specificKeywords.split(',').slice(0, 3).join(',')}. ` : ''}Quality equipment at competitive prices with Australia-wide delivery. Shop online today.`,
      keywords: fullKeywords
    };
  };

  const seoContent = generateCategorySEO();

  // Get current category node and its children for display
  const getCurrentCategoryNode = () => {
    if (selectedCategory === 'All Equipment') return null;

    // Search recursively in category tree using fullPath
    const findNode = (nodes: CategoryNode[], targetPath: string): CategoryNode | null => {
      for (const node of nodes) {
        // Match by fullPath (e.g., "Baking Equipment > Ovens > Deck Ovens")
        if (node.fullPath === targetPath) {
          return node;
        }
        // Recursively search children
        if (node.children && node.children.length > 0) {
          const found = findNode(node.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    };

    return findNode(categoryTree, selectedCategory);
  };

  const currentCategoryNode = getCurrentCategoryNode();
  const subcategories = currentCategoryNode?.children || [];

  // Show products if:
  // 1. We're viewing "All Equipment", OR
  // 2. We're at a leaf category (no children), OR
  // 3. There's an active search query (always show search results)
  // 4. We're on the multibuy page (always show multibuy products)
  const shouldShowProducts = multibuyParam || selectedCategory === 'All Equipment' || subcategories.length === 0 || searchQuery.trim().length > 0;

  // Get all unique brands from products
  const availableBrands = useMemo(() => {
    const brands = new Set<string>();
    let productsForBrands = products;

    // When on multibuy page, only show brands from multibuy products
    if (multibuyParam) {
      productsForBrands = productsForBrands.filter(p =>
        p.hasMultiBuy === true || (p.multiBuyOptions && p.multiBuyOptions.length > 0)
      );
    }

    // Filter by category (support hierarchical filtering)
    if (selectedCategory !== 'All Equipment') {
      productsForBrands = productsForBrands.filter((p) => {
        const productCategoryIds = [
          (p as any).categoryLevel1Id,
          (p as any).categoryLevel2Id,
          (p as any).categoryLevel3Id,
          (p as any).categoryLevel4Id,
        ].filter(Boolean);

        for (let i = productCategoryIds.length - 1; i >= 0; i--) {
          const categoryId = productCategoryIds[i];
          const productFullPath = categoryIdToPath.get(categoryId);

          if (productFullPath) {
            if (productFullPath === selectedCategory) return true;
            if (productFullPath.startsWith(selectedCategory + ' > ')) return true;
          }
        }

        return false;
      });
    }

    // Filter by importSource for brand slug pages (e.g. simco-group)
    if (importSourceParam) {
      productsForBrands = productsForBrands.filter((p) =>
        (p.importSource || '').toLowerCase() === importSourceParam.toLowerCase()
      );
    }

    // Filter by brand search for brand slug pages (e.g. polar, thor)
    if (brandSearchParam) {
      productsForBrands = productsForBrands.filter((p) =>
        (p.brand || '').toLowerCase().includes(brandSearchParam.toLowerCase())
      );
    }

    // Filter by search query
    if (searchQuery) {
      productsForBrands = productsForBrands.filter((p) =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    productsForBrands.forEach((p) => {
      if (p.brand) brands.add(p.brand);
    });

    return Array.from(brands).sort();
  }, [products, selectedCategory, searchQuery, categoryIdToPath, multibuyParam, importSourceParam, brandSearchParam]);

  // Compute category paths that have products matching the current brand slug filter (for highlighting)
  const brandSlugActiveCategoryPaths = useMemo(() => {
    if (!brandSlugConfig) return null;
    const paths = new Set<string>();
    const brandFiltered = products.filter(p => {
      if (importSourceParam) return (p.importSource || '').toLowerCase() === importSourceParam.toLowerCase();
      if (brandSearchParam) return (p.brand || '').toLowerCase().includes(brandSearchParam.toLowerCase());
      return false;
    });
    brandFiltered.forEach(p => {
      const ids = [
        (p as any).categoryLevel1Id,
        (p as any).categoryLevel2Id,
        (p as any).categoryLevel3Id,
        (p as any).categoryLevel4Id,
      ].filter(Boolean);
      ids.forEach(id => {
        const fullPath = categoryIdToPath.get(id);
        if (fullPath) {
          const parts = fullPath.split(' > ');
          parts.forEach((_, i) => paths.add(parts.slice(0, i + 1).join(' > ')));
        }
      });
    });
    return paths;
  }, [brandSlugConfig, products, importSourceParam, brandSearchParam, categoryIdToPath]);

  // When on multibuy page, compute which category fullPaths have multibuy products
  const multibuyActiveCategoryPaths = useMemo(() => {
    if (!multibuyParam) return null;
    const paths = new Set<string>();
    products
      .filter(p => p.hasMultiBuy === true || (p.multiBuyOptions && p.multiBuyOptions.length > 0))
      .forEach(p => {
        const ids = [
          (p as any).categoryLevel1Id,
          (p as any).categoryLevel2Id,
          (p as any).categoryLevel3Id,
          (p as any).categoryLevel4Id,
        ].filter(Boolean);
        ids.forEach(id => {
          const fullPath = categoryIdToPath.get(id);
          if (fullPath) {
            // Add the path and all its ancestor segments
            const parts = fullPath.split(' > ');
            parts.forEach((_, i) => paths.add(parts.slice(0, i + 1).join(' > ')));
          }
        });
      });
    return paths;
  }, [multibuyParam, products, categoryIdToPath]);

  // Category tree filtered to only categories with multibuy products (when on multibuy page)
  const sidebarCategoryTree = useMemo(() => {
    if (multibuyParam && multibuyActiveCategoryPaths && multibuyActiveCategoryPaths.size > 0) {
      const filterNodes = (nodes: CategoryNode[]): CategoryNode[] =>
        nodes.reduce<CategoryNode[]>((acc, node) => {
          if (!multibuyActiveCategoryPaths.has(node.fullPath)) return acc;
          const filteredChildren = node.children ? filterNodes(node.children) : [];
          acc.push({ ...node, children: filteredChildren });
          return acc;
        }, []);
      return filterNodes(categoryTree);
    }
    // On brand slug pages, sort highlighted categories to the top
    if (brandSlugActiveCategoryPaths && brandSlugActiveCategoryPaths.size > 0) {
      return [...categoryTree].sort((a, b) => {
        const aHighlighted = brandSlugActiveCategoryPaths.has(a.fullPath) ? 0 : 1;
        const bHighlighted = brandSlugActiveCategoryPaths.has(b.fullPath) ? 0 : 1;
        return aHighlighted - bHighlighted;
      });
    }
    return categoryTree;
  }, [categoryTree, multibuyParam, multibuyActiveCategoryPaths, brandSlugActiveCategoryPaths]);

  // Get min and max prices from products
  const priceStats = useMemo(() => {
    if (products.length === 0) {
      return { min: 0, max: 10000 };
    }

    const prices = products.map((p) => {
      const price = typeof p.price === 'string'
        ? parseFloat(p.price.replace(/[^0-9.-]+/g, ''))
        : p.price;
      return price;
    }).filter((p) => !isNaN(p) && p > 0);

    if (prices.length === 0) {
      return { min: 0, max: 10000 };
    }

    return {
      min: 0,
      max: Math.ceil(Math.max(...prices))
    };
  }, [products]);

  // Update price range when products load
  useEffect(() => {
    if (priceStats.min !== undefined && priceStats.max !== undefined) {
      setPriceRange([priceStats.min, priceStats.max]);
    }
  }, [priceStats.min, priceStats.max]);

  const toggleBrand = (brand: string) => {
    const newBrands = new Set(selectedBrands);
    if (newBrands.has(brand)) {
      newBrands.delete(brand);
    } else {
      newBrands.add(brand);
    }
    setSelectedBrands(newBrands);
  };

  const clearAllFilters = () => {
    setPriceRange([priceStats.min, priceStats.max]);
    setSelectedBrands(new Set());
    setShowInStockOnly(false);
    setSortBy('featured');
    setCurrentPage(1); // Reset to first page when clearing filters
  };

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchQuery, selectedBrands, priceRange, showInStockOnly, sortBy]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  // Recursive component for rendering category tree with all levels
  const CategoryTreeNode = ({ node, level = 0, isMobile = false, onSelect }: { node: CategoryNode; level?: number; isMobile?: boolean; onSelect?: () => void }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedCategories.has(node.fullPath);
    const isSelected = selectedCategory === node.fullPath;
    const isBrandHighlighted = brandSlugActiveCategoryPaths?.has(node.fullPath) && !isSelected;

    const handleSelectCategory = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleCategoryChange(node.fullPath);
      if (hasChildren && !isExpanded) {
        toggleExpanded(node.fullPath);
      }
      if (isMobile && onSelect) onSelect();
    };

    const handleToggleExpand = (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleExpanded(node.fullPath);
    };

    const count = categoryProductCounts.get(node.fullPath) ?? node.productCount ?? 0;

    return (
      <div key={node.fullPath} className="w-full">
        <div
          onClick={handleSelectCategory}
          className={`group flex items-center justify-between w-full py-2 px-3 rounded-xl transition-all cursor-pointer select-none text-xs font-bold ${isSelected
            ? 'bg-[#E31837] text-white shadow-xs'
            : isBrandHighlighted
            ? 'bg-sky-50 text-sky-700 border border-sky-200 hover:bg-sky-100'
            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/90'
            }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
            {hasChildren && (
              <button
                type="button"
                onClick={handleToggleExpand}
                className={`p-0.5 rounded-md hover:bg-black/10 transition-colors shrink-0 ${isSelected ? 'text-white' : 'text-slate-400 group-hover:text-slate-700'
                  }`}
                title={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronDown className="size-3.5 stroke-[2.5]" />
                ) : (
                  <ChevronRight className="size-3.5 stroke-[2.5]" />
                )}
              </button>
            )}
            <span className="truncate leading-snug">{node.name}</span>
          </div>

          <span className={`text-[10px] font-extrabold shrink-0 px-1.5 py-0.5 rounded-md ${isSelected
            ? 'bg-white/20 text-white'
            : 'text-slate-400 group-hover:text-slate-600 bg-slate-100'
            }`}>
            {count}
          </span>
        </div>

        {/* Recursively render children with a delicate left border connector line */}
        {hasChildren && isExpanded && (
          <div className="border-l-2 border-slate-200/60 ml-4 pl-2 space-y-1 mt-1 mb-1">
            {node.children.map((child) => (
              <CategoryTreeNode key={child.fullPath} node={child} level={level + 1} isMobile={isMobile} onSelect={onSelect} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Show loading skeleton ONLY when actually loading data
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Header Section - Skeleton */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
            {/* Breadcrumb skeleton */}
            <div className="flex items-center gap-2 mb-4">
              <div className="h-4 w-12 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 w-4 bg-slate-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse"></div>
            </div>

            {/* Title skeleton - centered */}
            <div className="text-center mb-8">
              <div className="h-10 w-64 bg-slate-200 rounded mx-auto mb-3 animate-pulse"></div>
              <div className="h-5 w-96 bg-slate-200 rounded mx-auto mb-2 animate-pulse"></div>
              <div className="h-6 w-24 bg-slate-200 rounded mx-auto animate-pulse"></div>
            </div>

            {/* Search skeleton - centered */}
            <div className="max-w-xl mx-auto">
              <div className="h-12 bg-slate-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Content skeleton */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
          <div className="flex gap-8">
            {/* Sidebar skeleton */}
            <aside className="hidden lg:block w-64 shrink-0">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <div className="h-5 w-32 bg-slate-200 rounded mb-4 animate-pulse"></div>
                      <div className="space-y-2">
                        {[1, 2, 3, 4].map((j) => (
                          <div key={j} className="h-8 bg-slate-200 rounded animate-pulse"></div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </aside>

            {/* Products grid skeleton */}
            <div className="flex-1">
              {/* Sorting bar skeleton */}
              <div className="flex justify-between items-center mb-6">
                <div className="h-5 w-48 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-10 w-48 bg-slate-200 rounded animate-pulse"></div>
              </div>

              {/* Product cards skeleton */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-0">
                      <div className="h-64 bg-slate-200 animate-pulse"></div>
                      <div className="p-4 space-y-3">
                        <div className="h-4 bg-slate-200 rounded animate-pulse"></div>
                        <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse"></div>
                        <div className="h-6 w-24 bg-slate-200 rounded animate-pulse"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/80 w-full max-w-[100vw]">
      {/* SEO Meta Tags and Structured Data for Category Pages */}
      <SEOHead
        title={seoContent.title}
        description={seoContent.description}
        keywords={seoContent.keywords}
        canonical={`https://costplus100.com.au/products${categorySlug ? `/c/${categorySlug}` : selectedCategory !== 'All Equipment' ? `/c/${categoryToSlug(selectedCategory)}` : ''}`}
        schema={generateBreadcrumbSchema(breadcrumbs.map(crumb => ({
          name: crumb.name,
          url: crumb.path === '/' ? '/' : `/products/c/${categoryToSlug(crumb.path)}`
        })))}
      />

      {/* 1. TOP HEADER BANNER (Full-width edge-to-edge dark navbar navy header section) */}
      <div className="w-full bg-[#0F172A] border-b border-slate-800 text-white py-8 sm:py-10 mb-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              {/* Breadcrumb Trail */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-400 mb-2.5">
                {breadcrumbs.map((crumb, idx) => (
                  <span key={crumb.path} className="flex items-center gap-1.5">
                    {idx > 0 && <span className="text-slate-600">/</span>}
                    {idx === breadcrumbs.length - 1 ? (
                      <span className="text-white font-bold">{crumb.name}</span>
                    ) : (
                      <Link
                        to={crumb.path === '/' ? '/' : `/products/c/${categoryToSlug(crumb.path)}`}
                        className="hover:text-white transition-colors"
                      >
                        {crumb.name}
                      </Link>
                    )}
                  </span>
                ))}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-1">
                {multibuyParam ? 'Multi-buy Deals'
                  : brandSlugConfig ? brandSlugConfig.title
                  : sectionParam ? ((getSectionConfig(sectionParam)?.name || (sectionParam.charAt(0).toUpperCase() + sectionParam.slice(1))) + ' Products')
                    : selectedCategory === 'All Equipment' ? 'All Products'
                      : breadcrumbs[breadcrumbs.length - 1].name}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-xl">
                Commercial kitchen machinery, refrigeration, and cooking gear built for high performance.
              </p>
            </div>

            {/* Results Count Text Right Side */}
            <div className="text-xs sm:text-sm font-semibold text-slate-200 text-left md:text-right shrink-0 bg-slate-800/90 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-slate-700/80 shadow-2xs">
              {filteredProducts.length > 0 ? (
                <>Showing {((currentPage - 1) * PRODUCTS_PER_PAGE) + 1}–{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)} of {filteredProducts.length} results</>
              ) : (
                <>Showing 0 results</>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. FILTER & VIEW ACTION BAR */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 mb-3 sm:mb-4">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Filters Button */}
          <button
            onClick={() => {
              setShowDesktopFilters(!showDesktopFilters);
              setShowMobileFilters(true);
            }}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${showDesktopFilters
              ? 'bg-[#0F172A] text-white shadow-xs hover:bg-[#E31837]'
              : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
              }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-[#E31837]" />
            <span>Filters</span>
          </button>

          {/* Right: Sort By & View Mode Toggle */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1 sm:gap-1.5 text-xs font-bold text-slate-500">
              <span className="hidden sm:inline">Sort by:</span>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[125px] sm:w-[160px] h-9 text-xs font-bold bg-white border-slate-200 rounded-xl shadow-xs">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  <SelectItem value="featured" className="font-medium text-xs">Featured</SelectItem>
                  <SelectItem value="priceLow" className="font-medium text-xs">Price: Low to High</SelectItem>
                  <SelectItem value="priceHigh" className="font-medium text-xs">Price: High to Low</SelectItem>
                  <SelectItem value="name" className="font-medium text-xs">Name: A to Z</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* View Buttons (Grid / List) — Hidden on mobile <600px */}
            <div className="hidden sm:flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid'
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list'
                  ? 'bg-[#0F172A] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
                  }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ── SEPARATE TOP RESULTS INFO BAR ── */}
        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-200/70">
          <div className="flex items-center gap-2">
            <h2 className="text-xs sm:text-sm font-extrabold text-[#0f172a] tracking-tight">
              {selectedCategory === 'All Equipment' ? 'All Products' : breadcrumbs[breadcrumbs.length - 1].name}
            </h2>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 shadow-2xs">
              {filteredProducts.length} items
            </span>
          </div>
          <span className="text-[11px] sm:text-xs font-semibold text-slate-500">
            Showing {((currentPage - 1) * PRODUCTS_PER_PAGE) + 1}–{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredProducts.length)}
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pb-4 sm:pb-6 lg:pb-8 w-full">
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 w-full items-start overflow-x-hidden">
          {/* Conditional Desktop Sidebar Filters */}
          {showDesktopFilters && (
            <aside className="hidden lg:block w-80 shrink-0">
              <div className="space-y-4 sticky top-20 pb-10 pt-0">

                {/* Search Box in Left Sidebar - Flush alignment with top of product grid */}
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search within products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 text-sm bg-white border-slate-200 focus-visible:ring-1 focus-visible:ring-[#E31837] focus-visible:border-[#E31837] rounded-xl shadow-xs transition-all font-medium"
                  />
                  {searchQuery && (
                    <button
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#E31837] transition-colors bg-slate-100 hover:bg-slate-200 rounded-full p-1 cursor-pointer"
                      onClick={() => setSearchQuery('')}
                    >
                      <X className="size-3" />
                    </button>
                  )}
                </div>

                {/* Categories Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Categories</h3>
                    <span className="text-[10px] font-extrabold text-[#E31837] bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                      {categoryTree.length} Main
                    </span>
                  </div>

                  <div className="space-y-1 max-h-[380px] overflow-y-auto overflow-x-hidden pr-1.5 custom-scrollbar">
                    {/* All Equipment */}
                    <div
                      onClick={() => handleCategoryChange('All Equipment')}
                      className={`flex items-center justify-between w-full py-2 px-3 rounded-xl transition-all cursor-pointer select-none text-xs font-bold ${selectedCategory === 'All Equipment'
                        ? 'bg-[#E31837] text-white shadow-xs'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/90'
                        }`}
                    >
                      <span>All Equipment</span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${selectedCategory === 'All Equipment'
                        ? 'bg-white/20 text-white'
                        : 'text-slate-400 bg-slate-100'
                        }`}>
                        {products.length}
                      </span>
                    </div>

                    {/* Recursive Category Tree */}
                    {hasTreeData && sidebarCategoryTree.map((node) => (
                      <CategoryTreeNode key={node.fullPath} node={node} level={0} />
                    ))}
                  </div>
                </div>

                {/* Price Range Card with top static bounds & bottom dynamic readout */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 border-b border-slate-100 pb-3">Filter by Price</h3>

                  {/* Top Static Bounds (Min: $0 on left, Max: $10,000 on right - non-bold) */}
                  <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-3 select-none">
                    <span>Min: ${priceStats.min.toLocaleString('en-AU')}</span>
                    <span>Max: ${priceStats.max.toLocaleString('en-AU')}</span>
                  </div>

                  {/* Toggle Slider Bar */}
                  <Slider
                    min={priceStats.min}
                    max={priceStats.max}
                    step={10}
                    value={priceRange}
                    onValueChange={(val) => setPriceRange(val as [number, number])}
                    className="cursor-pointer py-2"
                  />

                  {/* Bottom Dynamic Selected Range (Changes live as you slide!) */}
                  <div className="mt-3 text-center text-xs sm:text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl py-2 px-3">
                    Selected Price: <span className="text-[#E31837] font-extrabold">${priceRange[0].toLocaleString('en-AU')}</span> — <span className="text-[#E31837] font-extrabold">${priceRange[1].toLocaleString('en-AU')}</span>
                  </div>
                </div>

                {/* Brand Filter Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all">
                  <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Brand</h3>
                    {selectedBrands.size > 0 && (
                      <span className="text-[10px] font-bold text-[#E31837] bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                        {selectedBrands.size} Selected
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 max-h-[240px] overflow-y-auto overflow-x-hidden pr-1.5 custom-scrollbar">
                    {availableBrands.map((brand) => (
                      <label key={brand} className="flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 px-2.5 py-1.5 rounded-xl transition-colors border border-transparent hover:border-slate-100 select-none">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedBrands.has(brand)}
                            onChange={() => toggleBrand(brand)}
                            className="rounded size-3.5 border-slate-300 text-[#E31837] focus:ring-[#E31837] cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-700 truncate">{brand}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  <Link to="/brands" className="block mt-3">
                    <Button variant="outline" size="sm" className="w-full rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-bold text-xs shadow-2xs h-8">
                      View All Brands
                    </Button>
                  </Link>
                </div>

                {/* Availability Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs hover:shadow-sm transition-all">
                  <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-3 border-b border-slate-100 pb-3">Availability</h3>
                  <label className="flex items-center gap-2.5 cursor-pointer hover:bg-slate-50 px-2.5 py-1.5 rounded-xl transition-colors border border-transparent hover:border-slate-100 select-none">
                    <input
                      type="checkbox"
                      checked={showInStockOnly}
                      onChange={(e) => setShowInStockOnly(e.target.checked)}
                      className="rounded size-3.5 border-slate-300 text-[#E31837] focus:ring-[#E31837] cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-700">In Stock Only</span>
                  </label>
                </div>

                {/* Clear Filters Button */}
                {(priceRange[0] !== priceStats.min || priceRange[1] !== priceStats.max || selectedBrands.size > 0 || showInStockOnly) && (
                  <Button
                    variant="outline"
                    onClick={clearAllFilters}
                    className="w-full rounded-xl border-red-200 text-[#E31837] hover:bg-red-50 hover:border-red-300 hover:text-[#C41230] font-black shadow-xs py-2.5 text-xs transition-all"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </aside>
          )}

          {/* Products Grid */}
          <div className="flex-1 w-full min-w-0 space-y-4">


            {/* Mobile Slide-Over Filter Sidebar Drawer */}
            {showMobileFilters && (
              <div className="lg:hidden fixed inset-0 z-[99999] flex">
                {/* Backdrop Overlay */}
                <div
                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
                  onClick={() => setShowMobileFilters(false)}
                />

                {/* Slide-over Panel */}
                <div className="relative w-full max-w-[320px] sm:max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-left duration-300">
                  {/* Drawer Header */}
                  <div className="p-4 border-b border-slate-800 bg-[#0F172A] text-white flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="size-4.5 text-[#E31837]" />
                      <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">Filter Products</h2>
                    </div>
                    <button
                      onClick={() => setShowMobileFilters(false)}
                      className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
                      aria-label="Close Filters"
                    >
                      <X className="size-5" />
                    </button>
                  </div>

                  {/* Scrollable Filter Body */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar">
                    {/* Search inside filter drawer */}
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                      <Input
                        type="text"
                        placeholder="Search within products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 text-xs bg-slate-50 border-slate-200 focus-visible:ring-1 focus-visible:ring-[#E31837] focus-visible:border-[#E31837] rounded-xl shadow-xs font-medium"
                      />
                      {searchQuery && (
                        <button
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#E31837] transition-colors bg-slate-200 rounded-full p-1 cursor-pointer"
                          onClick={() => setSearchQuery('')}
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </div>

                    {/* Categories Section */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                      <div className="flex items-center justify-between mb-2.5 border-b border-slate-200/60 pb-2">
                        <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Categories</h3>
                        <span className="text-[10px] font-extrabold text-[#E31837] bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                          {categoryTree.length} Main
                        </span>
                      </div>
                      <div className="space-y-1 max-h-[260px] overflow-y-auto pr-1">
                        <div
                          onClick={() => {
                            handleCategoryChange('All Equipment');
                            setShowMobileFilters(false);
                          }}
                          className={`flex items-center justify-between w-full py-2 px-3 rounded-xl transition-all cursor-pointer select-none text-xs font-bold ${selectedCategory === 'All Equipment'
                            ? 'bg-[#E31837] text-white shadow-xs'
                            : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
                            }`}
                        >
                          <span>All Equipment</span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${selectedCategory === 'All Equipment'
                            ? 'bg-white/20 text-white'
                            : 'text-slate-400 bg-slate-200/80'
                            }`}>
                            {products.length}
                          </span>
                        </div>
                        {hasTreeData && sidebarCategoryTree.map((node) => (
                          <CategoryTreeNode key={node.fullPath} node={node} level={0} isMobile={true} onSelect={() => setShowMobileFilters(false)} />
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5 border-b border-slate-200/60 pb-2">Filter by Price</h3>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 font-medium mb-2.5">
                        <span>Min: ${priceStats.min.toLocaleString('en-AU')}</span>
                        <span>Max: ${priceStats.max.toLocaleString('en-AU')}</span>
                      </div>
                      <Slider
                        min={priceStats.min}
                        max={priceStats.max}
                        step={10}
                        value={priceRange}
                        onValueChange={(val) => setPriceRange(val as [number, number])}
                        className="py-2 cursor-pointer"
                      />
                      <div className="mt-2 text-center text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-lg py-1.5 px-2">
                        Selected: <span className="text-[#E31837] font-extrabold">${priceRange[0].toLocaleString('en-AU')}</span> — <span className="text-[#E31837] font-extrabold">${priceRange[1].toLocaleString('en-AU')}</span>
                      </div>
                    </div>

                    {/* Brands Section */}
                    {availableBrands.length > 0 && (
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                        <div className="flex items-center justify-between mb-2.5 border-b border-slate-200/60 pb-2">
                          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Brands</h3>
                          {selectedBrands.size > 0 && (
                            <span className="text-[10px] font-bold text-[#E31837] bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                              {selectedBrands.size} Selected
                            </span>
                          )}
                        </div>
                        <div className="space-y-1 max-h-[180px] overflow-y-auto pr-1">
                          {availableBrands.map((brand) => (
                            <label key={brand} className="flex items-center gap-2.5 cursor-pointer hover:bg-white p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200 select-none">
                              <input
                                type="checkbox"
                                checked={selectedBrands.has(brand)}
                                onChange={() => toggleBrand(brand)}
                                className="rounded size-3.5 border-slate-300 text-[#E31837] focus:ring-[#E31837]"
                              />
                              <span className="text-xs font-bold text-slate-700">{brand}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stock Availability */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 border-b border-slate-200/60 pb-2">Availability</h3>
                      <label className="flex items-center gap-2.5 cursor-pointer hover:bg-white p-1.5 rounded-lg transition-colors border border-transparent hover:border-slate-200 select-none">
                        <input
                          type="checkbox"
                          checked={showInStockOnly}
                          onChange={(e) => setShowInStockOnly(e.target.checked)}
                          className="rounded size-3.5 border-slate-300 text-[#E31837] focus:ring-[#E31837]"
                        />
                        <span className="text-xs font-bold text-slate-700">In Stock Only</span>
                      </label>
                    </div>
                  </div>

                  {/* Drawer Footer Actions */}
                  <div className="p-4 border-t border-slate-200 bg-slate-50 shrink-0 space-y-2">
                    <Button
                      className="w-full rounded-xl bg-[#E31837] hover:bg-[#C41230] text-white font-black shadow-md py-3 text-xs tracking-wider uppercase transition-all cursor-pointer"
                      onClick={() => setShowMobileFilters(false)}
                    >
                      Apply Filters ({filteredProducts.length} Results)
                    </Button>
                    {(priceRange[0] !== priceStats.min || priceRange[1] !== priceStats.max || selectedBrands.size > 0 || showInStockOnly) && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          clearAllFilters();
                          setShowMobileFilters(false);
                        }}
                        className="w-full rounded-xl border-slate-300 text-slate-700 hover:bg-slate-100 font-bold py-2 text-xs transition-all cursor-pointer"
                      >
                        Clear Filters
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Subcategories Section - Show when viewing a category with children */}
            {subcategories.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3">Browse by Subcategory</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                  {subcategories.map((subcat) => (
                    <Card
                      key={subcat.path}
                      className="cursor-pointer hover:shadow-lg transition-all hover:border-slate-900 overflow-hidden"
                      onClick={() => handleCategoryChange(subcat.fullPath)}
                    >
                      <CardContent className="p-0">
                        {/* Category Image */}
                        <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center p-2 sm:p-3">
                          {subcat.imageUrl ? (
                            <img
                              src={subcat.imageUrl}
                              alt={subcat.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                // Fallback to placeholder
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="text-slate-400 text-2xl sm:text-3xl">
                              📦
                            </div>
                          )}
                        </div>
                        {/* Category Info */}
                        <div className="p-2 sm:p-3 text-center bg-white">
                          <div className="text-xs sm:text-sm font-medium mb-1 line-clamp-2 min-h-[2rem] sm:min-h-[2.5rem]">{subcat.name}</div>
                          <button
                            className="text-xs text-[#E31837] hover:underline font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryChange(subcat.fullPath);
                            }}
                          >
                            View category
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {filteredProducts.length > 0 && (
                  <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-4 px-2 sm:px-0 text-center">All Products in {breadcrumbs[breadcrumbs.length - 1].name}</h2>
                  </div>
                )}
              </div>
            )}

            {/* Products Grid */}
            {productsLoading && !hasAnyProducts ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                  <div className="h-5 w-48 bg-slate-200 rounded animate-pulse" />
                </div>
                <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="rounded-xl overflow-hidden border border-slate-200 bg-white">
                      <div className="h-48 bg-slate-200 animate-pulse" />
                      <div className="p-4 space-y-2">
                        <div className="h-4 bg-slate-200 rounded animate-pulse" />
                        <div className="h-4 w-3/4 bg-slate-200 rounded animate-pulse" />
                        <div className="h-6 w-1/2 bg-slate-200 rounded animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : shouldShowProducts && filteredProducts.length > 0 ? (
              <>
                {/* Product Grid container */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden max-[599px]:border-0 max-[599px]:bg-transparent max-[599px]:shadow-none max-[599px]:rounded-none">
                  {/* Product Grid / List view */}
                  <div className={`p-1 sm:p-4 ${viewMode === 'grid'
                      ? showDesktopFilters
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                        : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4"
                      : "flex flex-col gap-3"
                    }`}>
                    {paginatedProducts.map(product => (
                      multibuyParam || (product.multiBuyOptions && product.multiBuyOptions.length > 0) ? (
                        <MultiBuyEquipmentCard key={product.id} product={product} />
                      ) : (
                        <ProductCard key={product.id} product={product} layoutMode={viewMode} />
                      )
                    ))}
                  </div>

                  {/* Pagination Controls - bottom of card, left-aligned */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-start gap-3 px-4 py-3 bg-slate-50/50 border-t border-slate-200">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="h-8 px-3 rounded-lg border-slate-200 font-bold text-xs"
                      >
                        <ChevronLeft className="size-3.5 mr-1" />
                        Previous
                      </Button>

                      <div className="flex gap-1">
                        {/* Show first page */}
                        {currentPage > 3 && (
                          <>
                            <Button variant={1 === currentPage ? 'default' : 'outline'} size="sm" onClick={() => goToPage(1)} className="w-8 h-8 rounded-lg border-slate-200 font-bold text-xs">1</Button>
                            {currentPage > 4 && <span className="flex items-center px-1 text-slate-400 text-xs">...</span>}
                          </>
                        )}

                        {/* Show pages around current page */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => page >= currentPage - 2 && page <= currentPage + 2)
                          .map((page) => (
                            <Button
                              key={page}
                              variant={page === currentPage ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => goToPage(page)}
                              className={`w-8 h-8 rounded-lg font-bold text-xs ${page === currentPage ? 'bg-[#E31837] hover:bg-[#c41530] border-[#E31837] text-white' : 'border-slate-200'}`}
                            >
                              {page}
                            </Button>
                          ))}

                        {/* Show last page */}
                        {currentPage < totalPages - 2 && (
                          <>
                            {currentPage < totalPages - 3 && <span className="flex items-center px-1 text-slate-400 text-xs">...</span>}
                            <Button variant={totalPages === currentPage ? 'default' : 'outline'} size="sm" onClick={() => goToPage(totalPages)} className="w-8 h-8 rounded-lg border-slate-200 font-bold text-xs">{totalPages}</Button>
                          </>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="h-8 px-3 rounded-lg border-slate-200 font-bold text-xs"
                      >
                        Next
                        <ChevronRight className="size-3.5 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-12 text-center">
                <p className="text-slate-500 text-base font-semibold mb-2">
                  No products found {selectedCategory !== 'All Equipment' ? `in ${breadcrumbs[breadcrumbs.length - 1].name}` : ''}
                </p>
                <p className="text-sm text-slate-400 font-medium">
                  {subcategories.length > 0
                    ? 'Browse the subcategories above or try a different search'
                    : 'Try adjusting your search or filter criteria'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}