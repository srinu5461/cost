// v2.0 - Custom virtual scrolling with Modern Admin UI
import { useState, useMemo, useRef, useEffect } from 'react';
import Fuse from 'fuse.js';
import { useProducts, type Product } from '../../hooks/useProducts';
import { Search, Loader2, RefreshCw, AlertCircle, Package } from 'lucide-react';
import { Input } from './ui/input';

interface VirtualizedProductListProps {
  refreshTrigger?: number;
}

export function VirtualizedProductList({ refreshTrigger }: VirtualizedProductListProps = {}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: products, isLoading, isError, error, refetch } = useProducts(refreshTrigger);

  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(() => {
    if (!products || products.length === 0) return null;

    return new Fuse(products, {
      keys: ['name', 'description', 'brand', 'category', 'code', 'sku'],
      threshold: 0.3,
      ignoreLocation: true,
    });
  }, [products]);

  // Filter products based on search
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    if (!searchQuery.trim()) return products;
    if (!fuse) return products;

    const results = fuse.search(searchQuery);
    return results.map((result) => result.item);
  }, [products, searchQuery, fuse]);

  // Simple virtual scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (!scrollRef.current) return;

      const scrollTop = scrollRef.current.scrollTop;
      const itemHeight = 90;
      const visibleCount = 50;
      const bufferCount = 10;

      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferCount);
      const end = start + visibleCount + bufferCount * 2;

      setVisibleRange({ start, end });
    };

    const scrollEl = scrollRef.current;
    if (scrollEl) {
      scrollEl.addEventListener('scroll', handleScroll);
      return () => scrollEl.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Render a single product row
  const renderProduct = (product: Product, index: number) => {
    return (
      <div
        key={index}
        className="border-b border-slate-200 px-4 py-3 hover:bg-slate-50 flex items-center justify-between gap-4 transition-all group cursor-default"
        style={{ height: '90px' }}
      >
        {/* Product Image */}
        <div className="relative shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-white">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name || 'Product'}
              className="size-14 object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="size-14 bg-slate-50 flex items-center justify-center text-slate-300">
              <Package className="size-6" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xs sm:text-sm font-extrabold text-[#0f172a] truncate group-hover:text-[#E31837] transition-colors">
            {product.name || 'Unnamed Product'}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {product.category && (
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {product.category}
              </span>
            )}
            <span className="text-xs font-mono font-semibold text-slate-400">
              {product.code || product.sku || 'No SKU'}
            </span>
            {product.brand && (
              <span className="text-xs font-bold text-slate-500">
                • {product.brand}
              </span>
            )}
          </div>
        </div>

        {/* Price */}
        <div className="text-right shrink-0">
          <span className="text-xs sm:text-sm font-black text-[#0f172a] bg-slate-50 px-3 py-1 rounded-lg border border-slate-200 inline-block">
            ${typeof product.price === 'number' ? product.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : product.price}
          </span>
        </div>
      </div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-white rounded-xl border border-slate-200 shadow-xs p-8">
        <div className="text-center">
          <RefreshCw className="size-8 animate-spin text-[#E31837] mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading products from CDN cache...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const needsSync = errorMessage.includes('not found') || errorMessage.includes('sync first');

    return (
      <div className="flex items-center justify-center h-full bg-white rounded-xl border border-slate-200 shadow-xs p-8">
        <div className="text-center max-w-md">
          <div className="size-12 bg-rose-50 text-[#E31837] rounded-xl flex items-center justify-center mx-auto mb-3 border border-rose-200">
            <AlertCircle className="size-6" />
          </div>
          <h2 className="text-base font-extrabold text-[#0f172a] mb-1">
            {needsSync ? 'Products Not Synced' : 'Failed to Load Products'}
          </h2>
          <p className="text-xs font-medium text-slate-500 mb-4">
            {needsSync
              ? 'The products JSON cache file has not been built yet. Click "Sync to CDN" above to build it.'
              : errorMessage
            }
          </p>
          {!needsSync && (
            <button
              onClick={() => refetch()}
              className="h-9 px-4 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-all shadow-2xs flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <RefreshCw className="size-3.5" />
              Retry Loading
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Search Toolbar */}
      <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 w-full shrink-0">
        <div className="relative max-w-sm sm:max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search products by code, name, category, or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-xs sm:text-sm font-semibold w-full"
          />
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 w-full sm:w-auto justify-between sm:justify-end">
          <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 font-semibold">
            Loaded: {filteredProducts.length.toLocaleString()} of {products?.length.toLocaleString() || 0}
          </span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="h-8 px-3 text-xs font-bold text-[#E31837] hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Main List Card Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between shrink-0">
          <h2 className="text-sm sm:text-base font-black text-[#0f172a] tracking-tight flex items-center gap-2">
            Virtualized Catalog Items
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {filteredProducts.length.toLocaleString()} items
            </span>
          </h2>
        </div>

        <div className="flex-1 min-h-0 relative">
          {!filteredProducts || filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="size-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-[#0f172a]">No products found</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div ref={scrollRef} className="h-full overflow-y-auto custom-scrollbar">
              <div style={{ height: filteredProducts.length * 90, position: 'relative' }}>
                <div style={{ position: 'absolute', top: visibleRange.start * 90, left: 0, right: 0 }}>
                  {filteredProducts.slice(visibleRange.start, visibleRange.end).map((product, idx) =>
                    renderProduct(product, visibleRange.start + idx)
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

