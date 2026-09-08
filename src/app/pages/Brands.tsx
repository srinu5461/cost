import { useState, useMemo } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router';
import { ProductCard } from '../components/ProductCard';
import { useCMS } from '../context/CMSContext';
import { useProducts } from '../../hooks/useProducts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Search, ChevronRight, Package, ChevronLeft, X, Sparkles, Building2, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Slider } from '../components/ui/slider';
import { SEOHead, generateBreadcrumbSchema } from '../components/SEOHead';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';

export function Brands() {
  const { brandName } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get metadata from CMS & Products CDN
  const cms = useCMS();
  const data = cms.data;
  const cmsLoading = cms.loading;

  const { data: productsFromCDN, isLoading: productsLoading } = useProducts();

  const products = (productsFromCDN && productsFromCDN.length > 0)
    ? productsFromCDN
    : data.products || [];

  const loading = cmsLoading || (productsLoading && !data.products?.length);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLetter, setSelectedLetter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const sortParam = searchParams.get('sort');
  const [sortBy, setSortBy] = useState<string>(sortParam || 'priceHigh');

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const PRODUCTS_PER_PAGE = 16;

  // Get all unique brands with accurate product counts and logos
  const brands = useMemo(() => {
    const brandMap = new Map<string, {
      name: string;
      productCount: number;
      logoUrl?: string;
      products: typeof products;
    }>();

    products.forEach((p: any) => {
      if (p.brand) {
        const brandNameClean = p.brand.trim();
        if (!brandNameClean) return;
        const existing = brandMap.get(brandNameClean);
        if (existing) {
          existing.productCount++;
          existing.products.push(p);
          if (!existing.logoUrl && (p.brandLogoUrl || p.brandLogo)) {
            existing.logoUrl = p.brandLogoUrl || p.brandLogo;
          }
        } else {
          brandMap.set(brandNameClean, {
            name: brandNameClean,
            productCount: 1,
            logoUrl: p.brandLogoUrl || p.brandLogo,
            products: [p]
          });
        }
      }
    });

    return Array.from(brandMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [products]);

  // Extract available first letters
  const availableLetters = useMemo(() => {
    const letters = new Set<string>();
    brands.forEach((b) => {
      const firstChar = b.name.charAt(0).toUpperCase();
      if (/[A-Z]/.test(firstChar)) {
        letters.add(firstChar);
      } else {
        letters.add('#');
      }
    });
    return Array.from(letters).sort();
  }, [brands]);

  // Filter brands by search query AND letter selection
  const filteredBrands = useMemo(() => {
    return brands.filter((b) => {
      const matchesSearch = !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase());
      const firstChar = b.name.charAt(0).toUpperCase();
      const matchesLetter = selectedLetter === 'ALL' ||
        (selectedLetter === '#' ? !/[A-Z]/.test(firstChar) : firstChar === selectedLetter);
      return matchesSearch && matchesLetter;
    });
  }, [brands, searchQuery, selectedLetter]);

  // Group filtered brands alphabetically
  const groupedBrands = useMemo(() => {
    const groups: { [key: string]: typeof brands } = {};
    filteredBrands.forEach((b) => {
      const firstChar = b.name.charAt(0).toUpperCase();
      const key = /[A-Z]/.test(firstChar) ? firstChar : '#';
      if (!groups[key]) groups[key] = [];
      groups[key].push(b);
    });
    return groups;
  }, [filteredBrands]);

  // Top featured high-volume brands
  const featuredBrands = useMemo(() => {
    return [...brands]
      .sort((a, b) => b.productCount - a.productCount)
      .slice(0, 8);
  }, [brands]);

  // Get details for currently selected brand (if on /brands/:brandName)
  const selectedBrand = brandName ? brands.find(b => b.name.toLowerCase() === brandName.toLowerCase()) : null;

  // Categories for selected brand
  const brandCategories = useMemo(() => {
    if (!selectedBrand) return [];
    const categorySet = new Set<string>();
    selectedBrand.products.forEach(p => {
      const categoryLevel4 = (p as any).categoryLevel4;
      const categoryLevel3 = (p as any).categoryLevel3;
      const categoryLevel2 = (p as any).categoryLevel2;
      const categoryLevel1 = (p as any).categoryLevel1;

      const category = categoryLevel4 || categoryLevel3 || categoryLevel2 || categoryLevel1 || p.category;
      if (category) categorySet.add(category);
    });
    return Array.from(categorySet).sort();
  }, [selectedBrand]);

  // Price stats for selected brand
  const brandPriceStats = useMemo(() => {
    if (!selectedBrand || selectedBrand.products.length === 0) return { min: 0, max: 10000 };
    const prices = selectedBrand.products.map((p) => {
      const price = typeof p.price === 'string'
        ? parseFloat(p.price.replace(/[^0-9.-]+/g, ''))
        : p.price;
      return price;
    }).filter((p) => !isNaN(p) && p > 0);

    if (prices.length === 0) return { min: 0, max: 10000 };

    return {
      min: 0,
      max: Math.ceil(Math.max(...prices))
    };
  }, [selectedBrand]);

  // Filtered products for selected brand
  const filteredBrandProducts = useMemo(() => {
    if (!selectedBrand) return [];

    let filtered = selectedBrand.products;

    if (priceRange[0] > brandPriceStats.min || priceRange[1] < brandPriceStats.max) {
      filtered = filtered.filter((p) => {
        const price = typeof p.price === 'string'
          ? parseFloat(p.price.replace(/[^0-9.-]+/g, ''))
          : p.price;
        return price >= priceRange[0] && price <= priceRange[1];
      });
    }

    if (selectedCategories.size > 0) {
      filtered = filtered.filter((p) => {
        const categoryLevel4 = (p as any).categoryLevel4;
        const categoryLevel3 = (p as any).categoryLevel3;
        const categoryLevel2 = (p as any).categoryLevel2;
        const categoryLevel1 = (p as any).categoryLevel1;

        const category = categoryLevel4 || categoryLevel3 || categoryLevel2 || categoryLevel1 || p.category;
        return category && selectedCategories.has(category);
      });
    }

    return filtered;
  }, [selectedBrand, priceRange, selectedCategories, brandPriceStats]);

  // Sorted brand products
  const sortedBrandProducts = useMemo(() => {
    if (!selectedBrand) return [];

    const productsArray = Array.from(filteredBrandProducts);

    switch (sortBy) {
      case 'priceLow':
        return productsArray.sort((a, b) => {
          const priceA = typeof a.price === 'string' ? parseFloat(a.price.replace(/[^0-9.-]+/g, '')) : (a.price || 0);
          const priceB = typeof b.price === 'string' ? parseFloat(b.price.replace(/[^0-9.-]+/g, '')) : (b.price || 0);
          return priceA - priceB;
        });
      case 'priceHigh':
        return productsArray.sort((a, b) => {
          const priceA = typeof a.price === 'string' ? parseFloat(a.price.replace(/[^0-9.-]+/g, '')) : (a.price || 0);
          const priceB = typeof b.price === 'string' ? parseFloat(b.price.replace(/[^0-9.-]+/g, '')) : (b.price || 0);
          return priceB - priceA;
        });
      case 'name':
        return productsArray.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'featured':
      default:
        return productsArray.sort((a, b) => {
          const priceA = typeof a.price === 'string' ? parseFloat(a.price.replace(/[^0-9.-]+/g, '')) : (a.price || 0);
          const priceB = typeof b.price === 'string' ? parseFloat(b.price.replace(/[^0-9.-]+/g, '')) : (b.price || 0);
          return priceB - priceA;
        });
    }
  }, [filteredBrandProducts, sortBy]);

  const toggleCategory = (category: string) => {
    const newCategories = new Set(selectedCategories);
    if (newCategories.has(category)) {
      newCategories.delete(category);
    } else {
      newCategories.add(category);
    }
    setSelectedCategories(newCategories);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setPriceRange([brandPriceStats.min, brandPriceStats.max]);
    setSelectedCategories(new Set());
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(sortedBrandProducts.length / PRODUCTS_PER_PAGE);
  const paginatedBrandProducts = sortedBrandProducts.slice(
    (currentPage - 1) * PRODUCTS_PER_PAGE,
    currentPage * PRODUCTS_PER_PAGE
  );

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  // ----------------------------------------------------
  // SINGLE BRAND PAGE VIEW (/brands/:brandName)
  // ----------------------------------------------------
  if (brandName && selectedBrand) {
    return (
      <div className="min-h-screen bg-slate-50/80 w-full max-w-[100vw]">
        {/* Top Header Banner matching Products Page styling */}
        <div className="w-full bg-[#0F172A] text-white py-8 sm:py-10 mb-6 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                {/* Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-3">
                  <Link to="/" className="hover:text-white transition-colors">Home</Link>
                  <span className="text-slate-600">/</span>
                  <Link to="/brands" className="hover:text-white transition-colors">Brands</Link>
                  <span className="text-slate-600">/</span>
                  <span className="text-white font-bold">{selectedBrand.name}</span>
                </div>

                <div className="flex items-center gap-3">
                  {selectedBrand.logoUrl && (
                    <div className="w-14 h-14 bg-white rounded-xl p-2 flex items-center justify-center shrink-0 shadow-md border border-slate-200">
                      <img
                        src={selectedBrand.logoUrl}
                        alt={selectedBrand.name}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-0.5">
                      {selectedBrand.name} Equipment
                    </h1>
                    <p className="text-slate-300 text-xs sm:text-sm font-medium">
                      Official commercial catering and kitchen machinery from {selectedBrand.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Brand Count Pill */}
              <div className="flex items-center gap-2 self-start md:self-auto">
                <span className="text-xs sm:text-sm font-bold text-white bg-[#E31837] px-4 py-2 rounded-xl shadow-xs border border-red-500/30 flex items-center gap-2">
                  <Package className="size-4" />
                  {sortedBrandProducts.length} Products Available
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-12">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Sidebar Filters */}
            <aside className="w-full lg:w-64 shrink-0">
              <div className="space-y-4 sticky top-24">
                {/* Price Range Card matching Products.tsx */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">FILTER BY PRICE</h3>

                  <div className="flex items-center justify-between text-xs text-slate-600 font-medium mb-3 select-none">
                    <span>Min: ${brandPriceStats.min.toLocaleString('en-AU')}</span>
                    <span>Max: ${brandPriceStats.max.toLocaleString('en-AU')}</span>
                  </div>

                  <Slider
                    min={brandPriceStats.min}
                    max={brandPriceStats.max}
                    step={10}
                    value={priceRange}
                    onValueChange={(val) => setPriceRange(val as [number, number])}
                    className="cursor-pointer py-2"
                  />

                  <div className="mt-3 text-center text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200/60 rounded-xl py-2 px-3">
                    Selected Price: <span className="text-[#E31837] font-extrabold">${priceRange[0].toLocaleString('en-AU')}</span> — <span className="text-[#E31837] font-extrabold">${priceRange[1].toLocaleString('en-AU')}</span>
                  </div>
                </div>

                {/* Categories Filter Card */}
                {brandCategories.length > 0 && (
                  <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Categories</h3>
                      <span className="text-[10px] font-extrabold text-[#E31837] bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                        {brandCategories.length}
                      </span>
                    </div>

                    <div className="space-y-1.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                      {brandCategories.map((category) => (
                        <label
                          key={category}
                          className="flex items-center justify-between gap-2 cursor-pointer hover:bg-slate-50 px-2.5 py-1.5 rounded-xl transition-colors select-none"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedCategories.has(category)}
                              onChange={() => toggleCategory(category)}
                              className="rounded size-3.5 border-slate-300 text-[#E31837] focus:ring-[#E31837] cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-700 truncate">{category}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clear Filters Button */}
                {(priceRange[0] !== brandPriceStats.min || priceRange[1] !== brandPriceStats.max || selectedCategories.size > 0) && (
                  <Button
                    variant="outline"
                    onClick={clearFilters}
                    className="w-full rounded-xl border-red-200 text-[#E31837] hover:bg-red-50 hover:border-red-300 hover:text-[#C41230] font-black shadow-xs py-2.5 text-xs transition-all"
                  >
                    Clear All Filters
                  </Button>
                )}
              </div>
            </aside>

            {/* Products Grid Area */}
            <div className="flex-1 min-w-0">
              {/* Sorting and Results Bar */}
              <div className="bg-white border border-slate-200/80 rounded-2xl p-4 mb-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs sm:text-sm font-bold text-slate-700">
                  Showing <span className="text-[#E31837]">{sortedBrandProducts.length > 0 ? ((currentPage - 1) * PRODUCTS_PER_PAGE) + 1 : 0}–{Math.min(currentPage * PRODUCTS_PER_PAGE, sortedBrandProducts.length)}</span> of <span className="text-slate-900">{sortedBrandProducts.length}</span> products
                </p>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-full sm:w-[210px] h-9 text-xs font-bold bg-slate-50 border-slate-200 rounded-xl">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl font-medium text-xs">
                      <SelectItem value="featured">Featured First</SelectItem>
                      <SelectItem value="priceHigh">Price: High to Low</SelectItem>
                      <SelectItem value="priceLow">Price: Low to High</SelectItem>
                      <SelectItem value="name">Name: A to Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {sortedBrandProducts.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {paginatedBrandProducts.map((product: any, idx: number) => (
                      <ProductCard key={product?.id || `brand-prod-${idx}`} product={product} />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="mt-8 flex justify-center items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="rounded-xl font-bold text-xs"
                      >
                        <ChevronLeft className="size-4 mr-1" />
                        Previous
                      </Button>

                      <div className="flex gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => page >= currentPage - 2 && page <= currentPage + 2)
                          .map((page) => (
                            <Button
                              key={page}
                              variant={page === currentPage ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => goToPage(page)}
                              className={`w-9 h-9 rounded-xl font-bold text-xs ${
                                page === currentPage ? 'bg-[#E31837] text-white hover:bg-red-700' : ''
                              }`}
                            >
                              {page}
                            </Button>
                          ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="rounded-xl font-bold text-xs"
                      >
                        Next
                        <ChevronRight className="size-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
                  <Package className="size-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-extrabold text-slate-900 mb-1">
                    No products found for {selectedBrand.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-5">
                    Try clearing your price range or category filters to see all available models.
                  </p>
                  <Button
                    onClick={clearFilters}
                    className="bg-[#E31837] hover:bg-red-700 text-white rounded-xl text-xs font-bold px-5 py-2.5"
                  >
                    Reset Brand Filters
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // ALL BRANDS DIRECTORY OVERVIEW (/brands)
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50/80 w-full max-w-[100vw]">
      {/* 1. TOP HEADER BANNER matching Products Page */}
      <div className="w-full bg-[#0F172A] text-white py-8 sm:py-10 mb-6 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              {/* Breadcrumbs */}
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 mb-2.5">
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
                <span className="text-slate-600">/</span>
                <span className="text-white font-bold">Brands Directory</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mb-2">
                Official Commercial Brands
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm font-medium max-w-xl">
                Browse our complete portfolio of top-rated catering equipment manufacturers with direct factory pricing.
              </p>
            </div>

            {/* Total Brands Count Pill */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs sm:text-sm font-black text-white bg-[#E31837] px-4 py-2.5 rounded-2xl shadow-xs border border-red-500/30 flex items-center gap-2">
                <Building2 className="size-4" />
                {brands.length} Official Brands
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 pb-16 space-y-8">
        {/* 2. SEARCH BAR & ALPHABETICAL JUMP INDEX */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Search Input Box */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by brand name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] rounded-xl font-bold transition-all outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 bg-slate-200/70 hover:bg-slate-200 rounded-full p-0.5"
                >
                  <X className="size-3" />
                </button>
              )}
            </div>

            {/* Active Count & Clear Filter */}
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
              <span className="text-xs font-bold text-slate-500">
                Showing <span className="text-[#E31837] font-extrabold">{filteredBrands.length}</span> of {brands.length} Brands
              </span>

              {(searchQuery || selectedLetter !== 'ALL') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedLetter('ALL');
                  }}
                  className="text-xs font-bold text-[#E31837] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <X className="size-3.5" />
                  Reset Filter
                </button>
              )}
            </div>
          </div>

          {/* Alphabetical A-Z Filter Buttons */}
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider mr-1">Index:</span>
            <button
              onClick={() => setSelectedLetter('ALL')}
              className={`px-3 py-1 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                selectedLetter === 'ALL'
                  ? 'bg-[#E31837] text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
            >
              ALL
            </button>

            {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '#'].map((letter) => {
              const hasBrands = availableLetters.includes(letter);
              const isSelected = selectedLetter === letter;
              return (
                <button
                  key={letter}
                  disabled={!hasBrands}
                  onClick={() => setSelectedLetter(letter)}
                  className={`w-7 h-7 text-xs font-extrabold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'bg-[#E31837] text-white shadow-2xs'
                      : hasBrands
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                      : 'bg-slate-50 text-slate-300 opacity-40 cursor-not-allowed'
                  }`}
                >
                  {letter}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. FEATURED POPULAR BRANDS BAR (Show top brands when viewing ALL) */}
        {selectedLetter === 'ALL' && !searchQuery && featuredBrands.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="size-4 text-[#E31837]" />
                Top Featured Brands
              </h2>
              <span className="text-xs font-bold text-slate-400">Highest Catalog Volume</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3.5 sm:gap-4">
              {featuredBrands.map((brand) => (
                <Link
                  key={`feat-${brand.name}`}
                  to={`/brands/${encodeURIComponent(brand.name.toLowerCase())}`}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col items-center justify-between text-center hover:border-[#E31837] hover:shadow-lg transition-all group cursor-pointer h-36 sm:h-40 relative overflow-hidden"
                >
                  <div className="w-full h-16 flex items-center justify-center p-1">
                    {brand.logoUrl ? (
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        className="max-h-14 max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="size-11 bg-[#0F172A] text-white rounded-xl flex items-center justify-center font-black text-sm group-hover:bg-[#E31837] transition-colors">
                        {brand.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="w-full text-center pb-1">
                    <span className="text-xs font-bold text-slate-800 line-clamp-1 group-hover:text-[#E31837] transition-colors block mb-1">
                      {brand.name}
                    </span>
                    <span className="text-[10px] sm:text-xs font-bold text-white bg-[#0F172A] group-hover:bg-[#E31837] px-2.5 py-1 rounded-lg block w-fit mx-auto shadow-2xs transition-colors">
                      {brand.productCount} {brand.productCount === 1 ? 'Product' : 'Products'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* 4. ALPHABETICAL BRAND GROUPS GRID */}
        {filteredBrands.length > 0 ? (
          <div className="space-y-8">
            {Object.keys(groupedBrands).sort().map((letterKey) => {
              const brandList = groupedBrands[letterKey];
              return (
                <div key={letterKey} className="space-y-4">
                  {/* Letter Section Header */}
                  <div className="flex items-center gap-3 border-b border-slate-200/80 pb-2">
                    <div className="size-8 rounded-xl bg-[#0F172A] text-white flex items-center justify-center font-black text-sm shadow-2xs">
                      {letterKey}
                    </div>
                    <h2 className="text-base font-black text-slate-900">
                      Brands starting with "{letterKey}"
                    </h2>
                    <span className="text-xs font-extrabold text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200/60 ml-auto">
                      {brandList.length} {brandList.length === 1 ? 'Brand' : 'Brands'}
                    </span>
                  </div>

                  {/* Brand Cards Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5 sm:gap-4">
                    {brandList.map((brand) => (
                      <Link
                        key={brand.name}
                        to={`/brands/${encodeURIComponent(brand.name.toLowerCase())}`}
                        className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center justify-between text-center hover:border-[#E31837] hover:shadow-lg transition-all duration-300 group cursor-pointer h-36 sm:h-40 relative overflow-hidden"
                      >
                        {/* Logo Container */}
                        <div className="w-full h-16 flex items-center justify-center p-1">
                          {brand.logoUrl ? (
                            <img
                              src={brand.logoUrl}
                              alt={brand.name}
                              className="max-h-14 max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className="size-12 bg-slate-100 group-hover:bg-[#0F172A] text-slate-700 group-hover:text-white rounded-xl flex items-center justify-center font-black text-base transition-colors border border-slate-200/60">
                              {brand.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Brand Name & Product Count Pill */}
                        <div className="w-full text-center pb-1 space-y-1">
                          <h3 className="text-xs font-extrabold text-slate-900 line-clamp-1 group-hover:text-[#E31837] transition-colors">
                            {brand.name}
                          </h3>
                          <div className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold text-white bg-[#0F172A] group-hover:bg-[#E31837] px-2.5 py-1 rounded-lg shadow-2xs transition-colors">
                            <Package className="size-3 text-slate-300 group-hover:text-white" />
                            <span>{brand.productCount} {brand.productCount === 1 ? 'Item' : 'Items'}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
            <Search className="size-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-extrabold text-slate-900 mb-1">
              No matching brands found
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              We couldn't find any brands matching "{searchQuery}" under letter "{selectedLetter}".
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedLetter('ALL');
              }}
              className="bg-[#E31837] hover:bg-red-700 text-white rounded-xl text-xs font-bold px-5 py-2.5"
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}