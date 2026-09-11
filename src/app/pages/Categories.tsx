import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router';
import { useCMS, CategoryNode } from '../context/CMSContext';
import { useCart } from '../context/CartContext';
import { buildCategoryTree } from '../utils/categoryTree';
import { categoryToSlug } from '../utils/slugify';
import { useProducts } from '../../hooks/useProducts';
import { SEOHead, generateBreadcrumbSchema } from '../components/SEOHead';
import {
  Search,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Package,
  Layers,
  Snowflake,
  ChefHat,
  Utensils,
  Armchair,
  ShoppingBag,
  Shirt,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  Tag,
  Filter
} from 'lucide-react';

export function Categories() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [activeMobileCategory, setActiveMobileCategory] = useState<string>('furniture');
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});

  // Live product data for accurate item counts
  const { data: cdnProducts = [] } = useProducts();

  const toggleSubcategoryExpand = (fullPath: string) => {
    setExpandedSubcategories(prev => ({
      ...prev,
      [fullPath]: !prev[fullPath]
    }));
  };

  let cartCount = 0;
  try {
    const cart = useCart();
    cartCount = cart.cartCount;
  } catch (e) {
    cartCount = 0;
  }

  // Load CMS categories data
  let data: any = {};
  try {
    const cms = useCMS();
    data = cms.data;
  } catch (e) {
    data = { categoryTree: [], products: [] };
  }

  // Build structured category tree
  const categoryTree: CategoryNode[] = useMemo(() => {
    return buildCategoryTree(data.categoryTree || []);
  }, [data.categoryTree]);

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

    cdnProducts.forEach((p: any) => {
      const productCategoryIds = [
        p.categoryLevel1Id,
        p.categoryLevel2Id,
        p.categoryLevel3Id,
        p.categoryLevel4Id,
        p.categoryId
      ].filter((id): id is string => Boolean(id) && typeof id === 'string' && id.trim() !== '');

      const matchedPaths = new Set<string>();

      productCategoryIds.forEach((id) => {
        const fullPath = categoryIdToPath.get(id.trim());
        if (fullPath) {
          const parts = fullPath.split(' > ');
          parts.forEach((_, i) => matchedPaths.add(parts.slice(0, i + 1).join(' > ')));
        }
      });

      // Fallback if product has category string directly
      if (p.category && matchedPaths.size === 0) {
        const catStr = String(p.category).trim();
        const mapped = categoryIdToPath.get(catStr.toLowerCase()) || catStr;
        const parts = mapped.split(' > ');
        parts.forEach((_, i) => matchedPaths.add(parts.slice(0, i + 1).join(' > ')));
      }

      matchedPaths.forEach((path) => {
        counts.set(path, (counts.get(path) || 0) + 1);
      });
    });

    return counts;
  }, [cdnProducts, categoryIdToPath]);

  // Compute accurate category item count
  const getCategoryTotalCount = (node: CategoryNode): number => {
    const directCount = categoryProductCounts.get(node.fullPath) ||
      categoryProductCounts.get(node.name) ||
      (node.path ? categoryProductCounts.get(node.path) : 0);

    if (directCount && directCount > 0) return directCount;

    if (node.children && node.children.length > 0) {
      return node.children.reduce((sum, child) => {
        return sum + getCategoryTotalCount(child);
      }, 0);
    }

    return node.productCount || 0;
  };

  // Static rich category visual cards fallback mapping
  const staticCategoryCards = [
    {
      name: 'Furniture',
      slug: 'furniture',
      fullPath: 'Furniture',
      image: '/categories_images/Furniture.png',
      description: 'Restaurant chairs, bar stools, dining tables, stainless steel benches, and outdoor seating.',
      icon: Armchair,
      color: 'text-indigo-500',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      group: 'furniture'
    },
    {
      name: 'Commercial Kitchen Machines',
      slug: 'commercial-kitchen-machines',
      fullPath: 'Commercial Kitchen Machines',
      image: '/categories_images/commercialkitchen.png',
      description: 'Heavy-duty ovens, fryers, griddles, food processors, and prep equipment built for performance.',
      icon: ChefHat,
      color: 'text-amber-500',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      group: 'cooking'
    },
    {
      name: 'Tableware & Bar Supplies',
      slug: 'tableware-bar-supplies',
      fullPath: 'Tableware & Bar Supplies',
      image: '/categories_images/tableware.png',
      description: 'Premium glassware, crockery, cutlery, bar accessories, and elegant table presentation essentials.',
      icon: Utensils,
      color: 'text-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      group: 'tableware'
    },
    {
      name: 'Consumables',
      slug: 'consumables',
      fullPath: 'Consumables',
      image: '/categories_images/consuambles.png',
      description: 'Takeaway packaging, paper cups, food containers, napkins, bags, and eco-friendly disposable supplies.',
      icon: ShoppingBag,
      color: 'text-rose-500',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      group: 'consumables'
    },
    {
      name: 'Clothing, Aprons & Footwear',
      slug: 'clothing-aprons-footwear',
      fullPath: 'Clothing, Aprons & Footwear',
      image: '/categories_images/clothing.png',
      description: 'Professional chef jackets, trousers, waterproof aprons, slip-resistant footwear, and kitchen uniforms.',
      icon: Shirt,
      color: 'text-violet-500',
      badgeBg: 'bg-violet-50 text-violet-700 border-violet-200',
      group: 'clothing'
    },
    {
      name: 'Kitchenware & Storage',
      slug: 'kitchenware-storage',
      fullPath: 'Kitchenware & Storage',
      image: '/categories_images/kitchenware.png',
      description: 'Stainless steel pots, gastronorm pans, storage containers, shelving racks, and chef utensils.',
      icon: Package,
      color: 'text-teal-500',
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
      group: 'kitchenware'
    },
    {
      name: 'Cleaning & Hygiene',
      slug: 'cleaning-hygiene',
      fullPath: 'Cleaning & Hygiene',
      image: '/categories_images/cleaning.png',
      description: 'Commercial dishwashers, sanitizers, cleaning chemicals, mops, trash cans, and hygiene products.',
      icon: Sparkles,
      color: 'text-blue-500',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      group: 'cleaning'
    },
    {
      name: 'Refrigeration & Ice Machines',
      slug: 'refrigeration-ice-machines',
      fullPath: 'Refrigeration & Ice Machines',
      image: '/categories_images/refrigirator.png',
      description: 'Upright fridges, chest freezers, glass door display chillers, counter prep units, and commercial ice makers.',
      icon: Snowflake,
      color: 'text-sky-500',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
      group: 'refrigeration'
    },
    {
      name: 'Clearance And Special Offers',
      slug: 'clearance-special-offers',
      fullPath: 'Clearance And Special Offers',
      image: '/categories_images/clearncesale.png',
      description: 'Discounted commercial equipment, clearance sales, and limited trade specials.',
      icon: Tag,
      color: 'text-red-500',
      badgeBg: 'bg-red-50 text-red-700 border-red-200',
      group: 'clearance'
    },
    {
      name: 'Simco Equipment',
      slug: 'simco-equipment',
      fullPath: 'Simco Equipment',
      image: '/categories_images/simcom.png',
      description: 'High-performance commercial cooking ranges, gas fryers, griddles, and refrigeration by Simco.',
      icon: ChefHat,
      color: 'text-[#E31837]',
      badgeBg: 'bg-rose-50 text-[#E31837] border-rose-200',
      group: 'simco'
    }
  ];

  // Selected active mobile department
  const activeMobileCard = staticCategoryCards.find(c => c.slug === activeMobileCategory) || staticCategoryCards[0];
  const activeMobileLiveNode = categoryTree.find(n => n.name.toLowerCase() === activeMobileCard.name.toLowerCase() || n.fullPath.toLowerCase() === activeMobileCard.fullPath.toLowerCase());

  // Filter categories by search query and group
  const filteredCategories = useMemo(() => {
    let tree = categoryTree.length > 0 ? categoryTree : staticCategoryCards.map(c => ({
      name: c.name,
      code: c.slug,
      fullPath: c.fullPath,
      imageUrl: c.image,
      productCount: 0,
      children: []
    }));

    if (selectedGroup !== 'all') {
      tree = tree.filter(node => {
        const staticMatch = staticCategoryCards.find(sc => sc.name.toLowerCase() === node.name.toLowerCase() || sc.fullPath.toLowerCase() === node.fullPath.toLowerCase());
        if (staticMatch) return staticMatch.group === selectedGroup;
        return true;
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      tree = tree.filter(node => {
        const matchesName = node.name.toLowerCase().includes(q);
        const matchesChild = node.children?.some(child => child.name.toLowerCase().includes(q));
        return matchesName || matchesChild;
      });
    }

    return tree;
  }, [categoryTree, searchQuery, selectedGroup]);

  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Categories', path: '/categories' }
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFC] w-full max-w-[100vw]">
      {/* SEO Meta Tags */}
      <SEOHead
        title="Explore Catering Equipment Categories — CostPlus100"
        description="Browse all commercial catering equipment categories. From refrigeration and commercial ovens to tableware, furniture, and kitchenware."
        keywords="catering categories, commercial fridges, kitchen machines, tableware, restaurant furniture, kitchenware, cleaning supplies"
        canonical="https://costplus100.com.au/categories"
        schema={generateBreadcrumbSchema(breadcrumbs.map(c => ({ name: c.name, url: c.path })))}
      />

      {/* ── 📱 NATIVE MOBILE APP LAYOUT (< 600px / sm:hidden) ── */}
      <div className="block sm:hidden min-h-screen bg-white text-slate-800 pb-16">

        {/* Clean Light Header */}
        <div className="sticky top-0 z-40 bg-white text-slate-900 px-4 py-3 flex items-center justify-center border-b border-slate-200 shadow-2xs">
          <h1 className="text-base font-extrabold tracking-tight text-slate-900">
            All Categories
          </h1>
        </div>

        {/* E-COMMERCE NATIVE APP SPLIT VIEW (ICON TOP / NAME UNDERNEATH SIDEBAR + ACCORDION PANEL) */}
        <div className="flex h-[calc(100vh-49px)] overflow-hidden">

          {/* LEFT SIDEBAR: ICON ON TOP, NAME UNDERNEATH */}
          <div className="w-[105px] shrink-0 bg-slate-50 border-r border-slate-200/80 overflow-y-auto divide-y divide-slate-200/50">
            {[
              { name: 'Furniture', slug: 'furniture', icon: Armchair },
              { name: 'Commercial Kitchen Machines', slug: 'commercial-kitchen-machines', icon: ChefHat },
              { name: 'Tableware & Bar Supplies', slug: 'tableware-bar-supplies', icon: Utensils },
              { name: 'Consumables', slug: 'consumables', icon: ShoppingBag },
              { name: 'Clothing, Aprons & Footwear', slug: 'clothing-aprons-footwear', icon: Shirt },
              { name: 'Kitchenware & Storage', slug: 'kitchenware-storage', icon: Package },
              { name: 'Cleaning & Hygiene', slug: 'cleaning-hygiene', icon: Sparkles },
              { name: 'Refrigeration & Ice Machines', slug: 'refrigeration-ice-machines', icon: Snowflake },
              { name: 'Clearance And Special Offers', slug: 'clearance-special-offers', icon: Tag },
              { name: 'Simco Equipment', slug: 'simco-equipment', icon: ChefHat },
            ].map((dept) => {
              const IconComp = dept.icon;
              const isSelected = activeMobileCategory === dept.slug;
              return (
                <button
                  key={dept.slug}
                  onClick={() => setActiveMobileCategory(dept.slug)}
                  className={`w-full py-3.5 px-1.5 flex flex-col items-center justify-center text-center gap-1.5 transition-all relative cursor-pointer ${isSelected
                      ? 'bg-white text-[#E31837] font-extrabold shadow-2xs'
                      : 'text-slate-700 hover:bg-slate-100 font-bold'
                    }`}
                >
                  {/* Active Left Indicator Bar */}
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-[#E31837] rounded-r-full" />
                  )}

                  <div className={`size-8 rounded-xl flex items-center justify-center transition-transform ${isSelected ? 'bg-rose-50 text-[#E31837] scale-105 shadow-2xs' : 'bg-slate-100 text-slate-600'
                    }`}>
                    <IconComp className="size-4.5 shrink-0" />
                  </div>

                  <span className="text-[10px] leading-tight font-extrabold line-clamp-2 px-0.5">
                    {dept.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* RIGHT PANEL: SUBCATEGORIES ACCORDION LIST */}
          <div className="flex-1 bg-white overflow-y-auto p-3.5 space-y-2.5">

            {/* Header for Active Department */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-1">
              <h2 className="text-xs font-black text-[#E31837] uppercase tracking-wider">
                {activeMobileCard?.name}
              </h2>
              <Link
                to={`/products/c/${activeMobileCard?.slug}`}
                className="text-[11px] font-extrabold text-slate-500 hover:text-[#E31837] flex items-center gap-0.5"
              >
                <span>View All</span>
                <ChevronRight className="size-3" />
              </Link>
            </div>

            {/* Filter-style Subcategories Accordions */}
            {activeMobileLiveNode?.children && activeMobileLiveNode.children.length > 0 ? (
              <div className="space-y-2">
                {activeMobileLiveNode.children.map((sub: any) => {
                  const isExpanded = !!expandedSubcategories[sub.fullPath];
                  const hasChildren = sub.children && sub.children.length > 0;

                  return (
                    <div
                      key={sub.fullPath}
                      className="border border-slate-200/90 rounded-xl bg-slate-50 overflow-hidden transition-all shadow-2xs"
                    >
                      {/* Card Header */}
                      <div
                        onClick={() => {
                          if (hasChildren) {
                            toggleSubcategoryExpand(sub.fullPath);
                          } else {
                            navigate(`/products/c/${categoryToSlug(sub.fullPath)}`);
                          }
                        }}
                        className="px-3.5 py-3 flex items-center justify-between cursor-pointer hover:bg-rose-50/50 transition-colors"
                      >
                        <Link
                          to={`/products/c/${categoryToSlug(sub.fullPath)}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-extrabold text-slate-800 hover:text-[#E31837] transition-colors"
                        >
                          {sub.name}
                        </Link>

                        <div className="flex items-center gap-1.5">
                          {hasChildren ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSubcategoryExpand(sub.fullPath);
                              }}
                              className="p-0.5 text-slate-400 hover:text-[#E31837] transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="size-4 text-[#E31837]" />
                              ) : (
                                <ChevronDown className="size-4 text-slate-500" />
                              )}
                            </button>
                          ) : (
                            <ChevronRight className="size-3.5 text-slate-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Down List */}
                      {isExpanded && hasChildren && (
                        <div className="bg-white border-t border-slate-200/80 px-3.5 py-2 space-y-1.5 divide-y divide-slate-100">
                          {sub.children.map((child: any) => (
                            <Link
                              key={child.fullPath}
                              to={`/products/c/${categoryToSlug(child.fullPath)}`}
                              className="flex items-center justify-between py-2 text-xs font-bold text-slate-700 hover:text-[#E31837] transition-colors group"
                            >
                              <span>{child.name}</span>
                              <ChevronRight className="size-3.5 text-slate-400 group-hover:text-[#E31837] transition-colors" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  to={`/products/c/${activeMobileCard?.slug}`}
                  className="bg-slate-50 hover:bg-rose-50/50 border border-slate-200/80 rounded-xl px-3.5 py-3 flex items-center justify-between transition-all cursor-pointer shadow-2xs group"
                >
                  <span className="text-xs font-extrabold text-slate-800 group-hover:text-[#E31837]">
                    All {activeMobileCard?.name}
                  </span>
                  <ChevronRight className="size-4 text-slate-400 group-hover:text-[#E31837]" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 🖥️ DESKTOP LAYOUT (hidden sm:block) ── */}
      <div className="hidden sm:block">
        {/* ── 1. DARK NAVY HERO HEADER ── */}
        <div className="w-full bg-[#0F172A] border-b border-slate-800 text-white py-10 sm:py-12 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full">
            {/* Breadcrumb Trail */}
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-3">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span className="text-slate-600">/</span>
              <span className="text-white font-bold">Categories</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider mb-3">
                  <Layers className="size-3.5" />
                  <span>Complete Commercial Catalog</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
                  Explore Departments &amp; Categories
                </h1>
                <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-xl leading-relaxed">
                  Discover over 13,779+ certified commercial kitchen products, refrigeration units, cooking ranges, tableware, and catering supplies.
                </p>
              </div>

              {/* Quick Search Bar inside Hero */}
              <div className="w-full md:w-80 shrink-0">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 text-xs font-semibold bg-slate-800/90 border border-slate-700/80 text-white placeholder:text-slate-400 rounded-xl focus:outline-none focus:border-[#E31837] focus:ring-2 focus:ring-[#E31837]/30 transition-all shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold bg-slate-700 px-1.5 py-0.5 rounded-full"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. CATEGORY GROUP FILTER TABS ── */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 my-6 sm:my-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: 'all', label: 'All Departments', icon: Layers },
              { id: 'furniture', label: 'Furniture', icon: Armchair },
              { id: 'cooking', label: 'Commercial Kitchen Machines', icon: ChefHat },
              { id: 'tableware', label: 'Tableware & Bar Supplies', icon: Utensils },
              { id: 'consumables', label: 'Consumables', icon: ShoppingBag },
              { id: 'clothing', label: 'Clothing, Aprons & Footwear', icon: Shirt },
              { id: 'kitchenware', label: 'Kitchenware & Storage', icon: Package },
              { id: 'cleaning', label: 'Cleaning & Hygiene', icon: Sparkles },
              { id: 'refrigeration', label: 'Refrigeration & Ice Machines', icon: Snowflake },
              { id: 'clearance', label: 'Clearance And Special Offers', icon: Tag },
              { id: 'simco', label: 'Simco Equipment', icon: ChefHat },
            ].map((tab) => {
              const IconComp = tab.icon;
              const isActive = selectedGroup === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedGroup(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all cursor-pointer border ${isActive
                    ? 'bg-[#0F172A] text-white border-[#0F172A] shadow-md'
                    : 'bg-white text-slate-700 border-slate-200/80 hover:bg-slate-100 hover:text-slate-900 shadow-2xs'
                    }`}
                >
                  <IconComp className={`size-3.5 ${isActive ? 'text-[#E31837]' : 'text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. FEATURED MAJOR CATEGORY CARDS GRID ── */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 mb-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {staticCategoryCards
              .filter(card => selectedGroup === 'all' || card.group === selectedGroup)
              .filter(card => !searchQuery || card.name.toLowerCase().includes(searchQuery.toLowerCase()) || card.description.toLowerCase().includes(searchQuery.toLowerCase()))
              .map((card) => {
                const IconComponent = card.icon;
                const liveNode = categoryTree.find(n => n.name.toLowerCase() === card.name.toLowerCase() || n.fullPath.toLowerCase() === card.fullPath.toLowerCase());
                const children = liveNode?.children || [];

                return (
                  <div
                    key={card.slug}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group hover:-translate-y-1"
                  >
                    {/* Category Image Header */}
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={card.image}
                        alt={card.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                      {/* Top Icon Badge */}
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md p-2 rounded-xl border border-white/40 shadow-sm flex items-center justify-center">
                        <IconComponent className={`size-4 ${card.color}`} />
                      </div>

                      {/* Category Title & Badge over image */}
                      <div className="absolute bottom-3 left-3 right-3 text-white">
                        <h3 className="font-extrabold text-base leading-snug drop-shadow-sm group-hover:text-amber-300 transition-colors">
                          {card.name}
                        </h3>
                      </div>
                    </div>

                    {/* Card Content & Subcategories List */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2">
                        {card.description}
                      </p>

                      {/* Subcategories Pills */}
                      {children.length > 0 && (
                        <div className="pt-2 border-t border-slate-100">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">Popular Subcategories</p>
                          <div className="flex flex-wrap gap-1.5">
                            {children.slice(0, 4).map((sub: any) => (
                              <Link
                                key={sub.fullPath}
                                to={`/products/c/${categoryToSlug(sub.fullPath)}`}
                                className="text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-[#E31837] hover:text-white px-2.5 py-1 rounded-md transition-all truncate max-w-[130px]"
                              >
                                {sub.name}
                              </Link>
                            ))}
                            {children.length > 4 && (
                              <span className="text-[10px] font-bold text-slate-400 px-1.5 py-1">
                                +{children.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <div className="pt-2">
                        <Link
                          to={`/products/c/${card.slug}`}
                          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl bg-slate-50 hover:bg-[#E31837] text-slate-800 hover:text-white font-extrabold text-xs transition-all border border-slate-200/80 hover:border-[#E31837] group/btn"
                        >
                          <span>Explore All {card.name.split(' ')[0]}</span>
                          <ArrowRight className="size-3.5 group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* ── 4. FULL CATEGORIES TREE EXPANDED SECTION ── */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                All Catering Equipment Departments &amp; Subcategories
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Click any category or subcategory to view matching commercial products.</p>
            </div>
            <span className="text-xs font-extrabold text-[#E31837] bg-red-50 px-3 py-1 rounded-full border border-red-100">
              {filteredCategories.length} Departments
            </span>
          </div>

          {/* Multi-column Category Tree Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((node) => {
              const hasChildren = node.children && node.children.length > 0;
              const totalCount = getCategoryTotalCount(node);
              const isDeptCollapsed = expandedSubcategories[node.fullPath] === false;

              return (
                <div key={node.fullPath} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all">
                  {/* Header Row: Category Title Link (Left) + Count Badge & Toggle Down Arrow (Right) */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 gap-2">
                    <Link
                      to={`/products/c/${categoryToSlug(node.fullPath)}`}
                      className="font-extrabold text-sm text-slate-900 hover:text-[#E31837] transition-colors flex items-center gap-1.5 group truncate min-w-0"
                    >
                      <span className="truncate">{node.name}</span>
                      <ArrowRight className="size-3.5 text-slate-400 group-hover:text-[#E31837] group-hover:translate-x-0.5 transition-all shrink-0" />
                    </Link>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-extrabold text-[#E31837] bg-rose-50 border border-rose-100/80 px-2.5 py-0.5 rounded-full shrink-0">
                        {totalCount} {totalCount === 1 ? 'Item' : 'Items'}
                      </span>

                      {hasChildren && (
                        <button
                          onClick={() => {
                            setExpandedSubcategories(prev => ({
                              ...prev,
                              [node.fullPath]: prev[node.fullPath] === false ? true : false
                            }));
                          }}
                          className="p-1 rounded-lg text-slate-400 hover:text-[#E31837] hover:bg-slate-100 transition-colors cursor-pointer"
                          title={isDeptCollapsed ? "Open category list" : "Close category list"}
                        >
                          <ChevronDown className={`size-4 transition-transform duration-200 ${isDeptCollapsed ? '' : 'rotate-180 text-[#E31837]'}`} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subcategory List with Expandable Level 3 Sub-subcategories */}
                  {hasChildren && !isDeptCollapsed ? (
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                      {node.children!.map((child) => {
                        const childCount = getCategoryTotalCount(child);
                        const hasSubChildren = child.children && child.children.length > 0;
                        const isChildExpanded = !!expandedSubcategories[child.fullPath];

                        return (
                          <div key={child.fullPath} className="space-y-1">
                            <div className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 text-xs font-semibold text-slate-700 hover:text-[#E31837] transition-colors group/sub">
                              <Link
                                to={`/products/c/${categoryToSlug(child.fullPath)}`}
                                className="flex items-center gap-1.5 flex-1 min-w-0"
                              >
                                <span className="truncate">{child.name}</span>
                                <span className="text-[10px] text-slate-400 group-hover/sub:text-[#E31837] font-bold shrink-0">
                                  ({childCount})
                                </span>
                              </Link>

                              <div className="flex items-center gap-1 shrink-0">
                                <Link
                                  to={`/products/c/${categoryToSlug(child.fullPath)}`}
                                  className="p-1 text-slate-300 hover:text-[#E31837] transition-colors"
                                  title={`Go to ${child.name}`}
                                >
                                  <ArrowRight className="size-3" />
                                </Link>

                                {hasSubChildren && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setExpandedSubcategories(prev => ({
                                        ...prev,
                                        [child.fullPath]: !prev[child.fullPath]
                                      }));
                                    }}
                                    className="p-1 rounded text-slate-400 hover:text-[#E31837] hover:bg-slate-100 transition-colors cursor-pointer"
                                    title="Toggle subcategories"
                                  >
                                    <ChevronDown className={`size-3.5 transition-transform duration-200 ${isChildExpanded ? 'rotate-180 text-[#E31837]' : ''}`} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Level 3 Sub-subcategories Inline List */}
                            {hasSubChildren && isChildExpanded && (
                              <div className="ml-4 pl-2.5 border-l-2 border-slate-200 space-y-1 py-1 animate-in fade-in duration-150">
                                {child.children!.map((subLeaf) => {
                                  const leafCount = getCategoryTotalCount(subLeaf);
                                  return (
                                    <Link
                                      key={subLeaf.fullPath}
                                      to={`/products/c/${categoryToSlug(subLeaf.fullPath)}`}
                                      className="flex items-center justify-between py-1 px-2 text-[11px] font-medium text-slate-600 hover:text-[#E31837] hover:bg-slate-100 rounded transition-colors"
                                    >
                                      <span className="truncate">• {subLeaf.name}</span>
                                      <span className="text-[10px] text-slate-400 font-bold shrink-0">
                                        ({leafCount})
                                      </span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : !isDeptCollapsed ? (
                    <p className="text-xs text-slate-400 italic">No subcategories listed</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
