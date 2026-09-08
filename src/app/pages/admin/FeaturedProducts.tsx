import { useState, useEffect } from 'react';
import { 
  Search, 
  Save, 
  Loader2, 
  Plus, 
  Trash2, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Flame, 
  Tag, 
  Clock, 
  CheckCircle2, 
  Package,
  Star,
  Info
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Product } from '../../types/product';
import { logger } from '../../utils/logger';
import { notify } from '../../utils/notifications';
import { Input } from '../../components/ui/input';

type SectionType = 'featured' | 'popular' | 'promotion';

export function FeaturedProducts() {
  const [activeTab, setActiveTab] = useState<SectionType>('featured');
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [allSearchResults, setAllSearchResults] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingTab, setLoadingTab] = useState(false);
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination state
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const RESULTS_PER_PAGE = 50;
  
  // Selected product IDs for each section
  const [featuredIds, setFeaturedIds] = useState<string[]>([]);
  const [popularIds, setPopularIds] = useState<string[]>([]);
  const [promotionIds, setPromotionIds] = useState<string[]>([]);

  const MAX_PRODUCTS_PER_SECTION = 20;

  useEffect(() => {
    loadSectionData();
  }, []);

  // Load selected products whenever tab changes OR IDs change
  useEffect(() => {
    const loadProducts = async () => {
      const currentIds = getCurrentIds();
      logger.debug(`Loading products for ${activeTab}`, { count: currentIds.length });
      
      setSelectedProducts([]);
      setError(null);
      
      if (currentIds.length === 0) {
        setLoadingTab(false);
        return;
      }

      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/products/batch`,
          {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ codes: currentIds }),
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to load products: ${response.status}`);
        }

        const products = await response.json();
        logger.info(`Loaded products for ${activeTab}`, { count: products.length });
        setSelectedProducts(products);
      } catch (error) {
        logger.error('Failed to load selected products', error);
        setError(`Failed to load products: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setLoadingTab(false);
      }
    };

    loadProducts();
  }, [activeTab, featuredIds, popularIds, promotionIds]);

  const getCurrentIds = () => {
    switch (activeTab) {
      case 'featured': return featuredIds;
      case 'popular': return popularIds;
      case 'promotion': return promotionIds;
    }
  };

  const setCurrentIds = (ids: string[]) => {
    switch (activeTab) {
      case 'featured': setFeaturedIds(ids); break;
      case 'popular': setPopularIds(ids); break;
      case 'promotion': setPromotionIds(ids); break;
    }
  };

  const loadSectionData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/featured-sections`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to load sections: ${response.status}`);
      }

      const data = await response.json();
      setFeaturedIds(data.featured || []);
      setPopularIds(data.popular || []);
      setPromotionIds(data.promotion || []);
      logger.info('Section data loaded successfully');
    } catch (error) {
      logger.error('Failed to load section data', error);
      setError(`Failed to load section data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const searchProducts = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setAllSearchResults([]);
      setSearchPage(1);
      setSearchTotal(0);
      return;
    }

    setSearching(true);
    setError(null);
    try {
      const currentIds = getCurrentIds();
      const excludeParam = currentIds.length > 0 ? `&exclude=${currentIds.join(',')}` : '';
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/products/search?q=${encodeURIComponent(searchTerm)}&page=1&limit=10000${excludeParam}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      const allResults = data.products || [];
      
      setAllSearchResults(allResults);
      setSearchTotal(allResults.length);
      setSearchPage(1);
      
      setSearchResults(allResults.slice(0, RESULTS_PER_PAGE));
      
      logger.info('Search completed', { 
        query: searchTerm, 
        totalResults: allResults.length 
      });
    } catch (error) {
      logger.error('Failed to search products', error);
      setError(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSearching(false);
    }
  };

  const goToPage = (page: number) => {
    const totalPages = Math.ceil(searchTotal / RESULTS_PER_PAGE);
    if (page < 1 || page > totalPages) return;
    
    setSearchPage(page);
    const start = (page - 1) * RESULTS_PER_PAGE;
    const end = start + RESULTS_PER_PAGE;
    setSearchResults(allSearchResults.slice(start, end));
  };

  const addProduct = (product: Product) => {
    const currentIds = getCurrentIds();
    if (currentIds.length >= MAX_PRODUCTS_PER_SECTION) {
      notify.warning(`Maximum ${MAX_PRODUCTS_PER_SECTION} products allowed per section`);
      return;
    }

    setCurrentIds([...currentIds, product.code]);
    setSelectedProducts([...selectedProducts, product]);
    
    const newAllResults = allSearchResults.filter(p => p.code !== product.code);
    setAllSearchResults(newAllResults);
    
    const start = (searchPage - 1) * RESULTS_PER_PAGE;
    const end = start + RESULTS_PER_PAGE;
    setSearchResults(newAllResults.slice(start, end));
    setSearchTotal(newAllResults.length);
    
    notify.success(`Added "${product.name}" to ${activeTab} section`);
  };

  const removeProduct = (productCode: string) => {
    const currentIds = getCurrentIds();
    setCurrentIds(currentIds.filter(id => id !== productCode));
    setSelectedProducts(selectedProducts.filter(p => p.code !== productCode));
    notify.info('Product removed from section');
  };

  const saveSectionAssignments = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/featured-sections`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-API-Key': publicAnonKey,
          },
          body: JSON.stringify({
            featured: featuredIds,
            popular: popularIds,
            promotion: promotionIds,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to save: ${response.status} - ${errorData}`);
      }

      const timestamp = new Date().toLocaleTimeString();
      setLastSaved(timestamp);
      notify.success('Section assignments saved successfully!');
      logger.info('Section assignments saved', { timestamp });

      fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/sync-featured`,
        { method: 'POST', headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      ).catch(() => {});
    } catch (error) {
      logger.error('Failed to save section assignments', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setError(`Failed to save: ${errorMsg}`);
      notify.error('Failed to save section assignments: ' + errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Sparkles className="size-6 text-[#E31837]" />
            Homepage Sections Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Curate Featured, Popular, and Special Promotional products on the homepage (max 20 per section)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            disabled={loading || loadingTab}
            className="h-10 px-4 bg-white border border-slate-200 text-[#0f172a] hover:bg-slate-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {showSearch ? <X className="size-4" /> : <Plus className="size-4 text-[#E31837]" />}
            {showSearch ? 'Close Search' : 'Add Products'}
          </button>
          <button
            onClick={saveSectionAssignments}
            disabled={saving || loading}
            className="h-10 px-5 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-[#E31837] font-semibold">
            <X className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">FEATURED ITEMS</p>
              <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">{featuredIds.length} <span className="text-sm text-slate-400 font-bold">/ {MAX_PRODUCTS_PER_SECTION}</span></p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Homepage hero collection</p>
            </div>
            <div className="size-11 rounded-xl bg-amber-50 border border-slate-200 flex items-center justify-center shrink-0 text-amber-600">
              <Star className="size-5.5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">POPULAR ITEMS</p>
              <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">{popularIds.length} <span className="text-sm text-slate-400 font-bold">/ {MAX_PRODUCTS_PER_SECTION}</span></p>
              <p className="text-xs text-orange-600 font-semibold mt-1">Top customer favorites</p>
            </div>
            <div className="size-11 rounded-xl bg-orange-50 border border-slate-200 flex items-center justify-center shrink-0 text-orange-600">
              <Flame className="size-5.5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">PROMOTIONAL ITEMS</p>
              <p className="text-2xl sm:text-3xl font-black text-[#E31837]">{promotionIds.length} <span className="text-sm text-slate-400 font-bold">/ {MAX_PRODUCTS_PER_SECTION}</span></p>
              <p className="text-xs text-[#E31837] font-semibold mt-1">On-sale special deals</p>
            </div>
            <div className="size-11 rounded-xl bg-rose-50 border border-slate-200 flex items-center justify-center shrink-0 text-[#E31837]">
              <Tag className="size-5.5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">LAST SYNCED</p>
              <p className="text-xl sm:text-2xl font-black text-[#0f172a] truncate">{lastSaved || 'Saved'}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Auto-rebuild active
              </p>
            </div>
            <div className="size-11 rounded-xl bg-emerald-50 border border-slate-200 flex items-center justify-center shrink-0 text-emerald-600">
              <Clock className="size-5.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Auto Rebuild Banner */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-blue-900 font-medium">
        <Info className="size-5 text-blue-600 shrink-0" />
        <div>
          <strong>Auto-Rebuild Enabled:</strong> Caches auto-update within 5 mins when you click <strong>Save All Changes</strong>. For instant updates, clear cache from Dashboard.
        </div>
      </div>

      {/* Section Tabs Bar */}
      <div className="bg-white rounded-xl p-1.5 shadow-xs border border-slate-200 flex items-center gap-2">
        {(['featured', 'popular', 'promotion'] as SectionType[]).map((tab) => {
          const count = tab === 'featured' ? featuredIds.length : tab === 'popular' ? popularIds.length : promotionIds.length;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setShowSearch(false);
                setSearchTerm('');
                setSearchResults([]);
                setAllSearchResults([]);
                setSearchPage(1);
                setSearchTotal(0);
                setLoadingTab(true);
                setError(null);
              }}
              className={`flex-1 h-10 rounded-lg text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#0f172a] text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <span className="capitalize">{tab} Section</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
              }`}>
                {count} / {MAX_PRODUCTS_PER_SECTION}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Add Panel */}
      {showSearch && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm sm:text-base font-black text-[#0f172a]">
              Search Catalog to Add to {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h2>
            <button onClick={() => setShowSearch(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
              <X className="size-4" />
            </button>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search products by code, name, or brand..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !searching) {
                    setSearchPage(1);
                    searchProducts();
                  }
                }}
                className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl text-xs sm:text-sm font-semibold"
              />
            </div>
            <button
              onClick={() => {
                setSearchPage(1);
                searchProducts();
              }}
              disabled={searching || !searchTerm.trim()}
              className="h-10 px-5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Search Results Table */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600">
                <span>Found <strong>{searchTotal.toLocaleString()}</strong> matching products</span>
                {searchTotal > RESULTS_PER_PAGE && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(searchPage - 1)}
                      disabled={searchPage === 1}
                      className="h-7 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-50 cursor-pointer"
                    >
                      Previous
                    </button>
                    <span>Page {searchPage} of {Math.ceil(searchTotal / RESULTS_PER_PAGE)}</span>
                    <button
                      onClick={() => goToPage(searchPage + 1)}
                      disabled={searchPage * RESULTS_PER_PAGE >= searchTotal}
                      className="h-7 px-2.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-50 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-96 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider sticky top-0 bg-slate-50">
                    <tr>
                      <th className="p-3">Image</th>
                      <th className="p-3">Code / SKU</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Brand</th>
                      <th className="p-3">Price</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs sm:text-sm font-semibold text-[#0f172a]">
                    {searchResults.map((product) => (
                      <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3">
                          <img
                            src={product.mainImageUrl || product.image || 'https://via.placeholder.com/60'}
                            alt={product.name}
                            className="size-10 object-cover rounded-lg border border-slate-200 bg-white"
                          />
                        </td>
                        <td className="p-3 font-mono text-slate-500">{product.code || product.sku || '-'}</td>
                        <td className="p-3 font-bold max-w-xs truncate">{product.name}</td>
                        <td className="p-3 text-slate-500">{product.brand || '-'}</td>
                        <td className="p-3 font-black">${product.price?.toFixed(2) || '0.00'}</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => addProduct(product)}
                            disabled={getCurrentIds().length >= MAX_PRODUCTS_PER_SECTION}
                            className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 ml-auto cursor-pointer disabled:opacity-50"
                          >
                            <Plus className="size-3.5" />
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Selected Products Table Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-black text-[#0f172a] tracking-tight flex items-center gap-2">
            Selected {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Products
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {selectedProducts.length} / {MAX_PRODUCTS_PER_SECTION}
            </span>
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="size-8 animate-spin text-[#E31837] mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">Loading section data...</p>
          </div>
        ) : loadingTab ? (
          <div className="p-12 text-center">
            <Loader2 className="size-8 animate-spin text-[#E31837] mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-500">Loading {activeTab} items...</p>
          </div>
        ) : selectedProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="size-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-[#0f172a]">No products selected for {activeTab}</p>
            <p className="text-xs text-slate-500 mt-1">Click "Add Products" above to search and populate this section</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50/50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-12">#</th>
                  <th className="p-4">Image</th>
                  <th className="p-4">Code / SKU</th>
                  <th className="p-4">Product Name</th>
                  <th className="p-4">Brand</th>
                  <th className="p-4">Price</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs sm:text-sm font-semibold text-[#0f172a]">
                {selectedProducts.map((product, index) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-slate-400 font-mono">{index + 1}</td>
                    <td className="p-4">
                      <img
                        src={product.mainImageUrl || product.image || 'https://via.placeholder.com/60'}
                        alt={product.name}
                        className="size-12 object-cover rounded-xl border border-slate-200 bg-white"
                      />
                    </td>
                    <td className="p-4 font-mono text-slate-500">{product.code || product.sku || '-'}</td>
                    <td className="p-4 font-extrabold">{product.name}</td>
                    <td className="p-4 text-slate-500">{product.brand || '-'}</td>
                    <td className="p-4 font-black text-[#0f172a]">
                      ${product.price?.toFixed(2) || '0.00'}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => removeProduct(product.code)}
                        className="size-9 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-[#E31837] ml-auto transition-colors cursor-pointer"
                        title="Remove product"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}