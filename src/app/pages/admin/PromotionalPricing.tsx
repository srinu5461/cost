import { useState, useEffect } from 'react';
import { Save, Loader2, Search, Percent, DollarSign, Tag, AlertCircle, CheckCircle, X, Plus, Trash2, Layers, RefreshCw } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Product } from '../../types/product';
import { DeleteConfirmModal } from '../../components/ui/DeleteConfirmModal';
import { notify } from '../../utils/notifications';
import { Input } from '../../components/ui/input';

interface Promotion {
  id: string;
  productId: string;
  productCode?: string;
  productName?: string;
  promotionalPrice: number;
  active: boolean;
}

interface PendingChange {
  productId: string;
  dbPrice?: number;
  promoPrice?: number;
  dbPriceInput?: string;
  promoPriceInput?: string;
}

export function PromotionalPricing() {
  const [products, setProducts] = useState<Product[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map());
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'promo' | 'noPromo' | 'changed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      const productsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/products?limit=999999`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );

      if (productsResponse.ok) {
        const data = await productsResponse.json();
        const productsArray = Array.isArray(data) ? data : (data.products || []);
        setProducts(productsArray);
      }

      const promotionsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/promotions`,
        { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
      );

      if (promotionsResponse.ok) {
        const promotionsData = await promotionsResponse.json();
        setPromotions(Array.isArray(promotionsData) ? promotionsData : []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      notify.error('Failed to load products database');
    } finally {
      setLoading(false);
    }
  };

  const handleDbPriceChange = (productId: string, value: string) => {
    const newChanges = new Map(pendingChanges);
    const existing = newChanges.get(productId) || { productId };
    existing.dbPriceInput = value;

    if (value === '') {
      delete existing.dbPrice;
    } else {
      const price = parseFloat(value);
      if (!isNaN(price) && price >= 0) {
        existing.dbPrice = price;
      }
    }

    newChanges.set(productId, existing);
    setPendingChanges(newChanges);
  };

  const handlePromoPriceChange = (productId: string, value: string) => {
    const newChanges = new Map(pendingChanges);
    const existing = newChanges.get(productId) || { productId };
    existing.promoPriceInput = value;

    if (value === '') {
      delete existing.promoPrice;
    } else {
      const price = parseFloat(value);
      if (!isNaN(price) && price >= 0) {
        existing.promoPrice = price;
      }
    }

    newChanges.set(productId, existing);
    setPendingChanges(newChanges);
  };

  const removePendingChange = (productId: string) => {
    const newChanges = new Map(pendingChanges);
    newChanges.delete(productId);
    setPendingChanges(newChanges);
  };

  const saveAllChanges = async () => {
    if (pendingChanges.size === 0) {
      notify.info('No pending changes to save');
      return;
    }

    const errors: string[] = [];
    const productUpdates: any[] = [];
    const promotionUpdates: any[] = [];

    pendingChanges.forEach((change, productId) => {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const currentDbPrice = typeof product.price === 'string' ? parseFloat(product.price) : product.price;
      const newDbPrice = change.dbPrice !== undefined ? change.dbPrice : currentDbPrice;
      const promoPrice = change.promoPrice;

      if (promoPrice !== undefined && promoPrice >= newDbPrice) {
        errors.push(`${product.name}: Promo price ($${promoPrice}) must be lower than Base DB price ($${newDbPrice})`);
      }

      if (change.dbPrice !== undefined && change.dbPrice !== currentDbPrice) {
        productUpdates.push({
          id: product.id,
          price: change.dbPrice,
        });
      }

      if (promoPrice !== undefined) {
        promotionUpdates.push({
          productId: product.id,
          productCode: product.code || product.sku,
          productName: product.name,
          promotionalPrice: promoPrice,
        });
      }
    });

    if (errors.length > 0) {
      notify.error(`Please fix validation errors:\n${errors.slice(0, 3).join('\n')}`);
      return;
    }

    setSaving(true);
    try {
      let dbPricesUpdated = 0;

      if (productUpdates.length > 0) {
        try {
          const productsResponse = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/products/bulk-update`,
            {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${publicAnonKey}`,
              },
              body: JSON.stringify({ updates: productUpdates }),
            }
          );

          if (productsResponse.ok) {
            dbPricesUpdated = productUpdates.length;
          }
        } catch (bulkError) {
          console.warn('Bulk DB update not available', bulkError);
        }
      }

      if (promotionUpdates.length > 0) {
        const promotionsResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/promotions/bulk`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({ promotions: promotionUpdates }),
          }
        );

        if (!promotionsResponse.ok) {
          throw new Error('Failed to update promotions');
        }
      }

      notify.success(`Saved changes successfully! (${promotionUpdates.length} promo prices updated)`);
      setPendingChanges(new Map());
      await loadData();
    } catch (error) {
      console.error('Failed to save changes:', error);
      notify.error('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const clearAllChanges = () => {
    setPendingChanges(new Map());
    notify.info('Discarded unsaved pending changes');
  };

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | 'ALL' | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDeletePromotion = async () => {
    if (!deleteTarget) return;
    setDeleting(true);

    try {
      if (deleteTarget === 'ALL') {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/promotions`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` }
          }
        );

        if (response.ok) {
          setDeleteTarget(null);
          notify.success('Cleared all promotional prices');
          loadData();
        } else {
          notify.error('Failed to clear promotional pricing');
        }
      } else {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/promotions/${deleteTarget.id}`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${publicAnonKey}` }
          }
        );

        if (response.ok) {
          setDeleteTarget(null);
          notify.success('Promotional price removed');
          loadData();
        } else {
          notify.error('Failed to remove promotional price');
        }
      }
    } catch (error) {
      console.error('Error removing promotion:', error);
      notify.error('Failed to remove promotional pricing');
    } finally {
      setDeleting(false);
    }
  };

  const toggleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedProducts.size === currentPageProducts.length) {
      setSelectedProducts(new Set());
    } else {
      const allIds = new Set(currentPageProducts.map(p => p.id));
      setSelectedProducts(allIds);
    }
  };

  const applyBulkDbPrice = (price: string) => {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      notify.warning('Please enter a valid price');
      return;
    }

    const newChanges = new Map(pendingChanges);
    selectedProducts.forEach(productId => {
      const existing = newChanges.get(productId) || { productId };
      existing.dbPrice = parsedPrice;
      existing.dbPriceInput = price;
      newChanges.set(productId, existing);
    });
    setPendingChanges(newChanges);
    setSelectedProducts(new Set());
    notify.success(`Applied DB price $${parsedPrice} to ${selectedProducts.size} items`);
  };

  const applyBulkPromoPrice = (price: string) => {
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      notify.warning('Please enter a valid price');
      return;
    }

    const newChanges = new Map(pendingChanges);
    selectedProducts.forEach(productId => {
      const existing = newChanges.get(productId) || { productId };
      existing.promoPrice = parsedPrice;
      existing.promoPriceInput = price;
      newChanges.set(productId, existing);
    });
    setPendingChanges(newChanges);
    setSelectedProducts(new Set());
    notify.success(`Applied Promo price $${parsedPrice} to ${selectedProducts.size} items`);
  };

  const getPromotionForProduct = (productId: string): Promotion | undefined => {
    return promotions.find(p => p.productId === productId);
  };

  const getCurrentDbPrice = (product: Product): number => {
    const change = pendingChanges.get(product.id);
    if (change?.dbPrice !== undefined) return change.dbPrice;
    return typeof product.price === 'string' ? parseFloat(product.price) : product.price;
  };

  const getCurrentPromoPrice = (product: Product): number | undefined => {
    const change = pendingChanges.get(product.id);
    if (change?.promoPrice !== undefined) return change.promoPrice;
    const promo = getPromotionForProduct(product.id);
    return promo?.promotionalPrice;
  };

  const calculateStats = (product: Product) => {
    const dbPrice = getCurrentDbPrice(product);
    const promoPrice = getCurrentPromoPrice(product);

    if (!promoPrice) return null;

    const savings = dbPrice - promoPrice;
    const discountPercent = ((savings / dbPrice) * 100);
    const isValid = promoPrice < dbPrice;

    return {
      dbPrice,
      promoPrice,
      savings,
      discountPercent: Math.round(discountPercent),
      isValid,
    };
  };

  const filteredProducts = products
    .filter(product => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        product.name.toLowerCase().includes(searchLower) ||
        product.code?.toLowerCase().includes(searchLower) ||
        product.brand?.toLowerCase().includes(searchLower);

      const hasPromo = getCurrentPromoPrice(product) !== undefined;
      const hasChanges = pendingChanges.has(product.id);

      const matchesFilter = filterMode === 'all' ||
        (filterMode === 'promo' && hasPromo) ||
        (filterMode === 'noPromo' && !hasPromo) ||
        (filterMode === 'changed' && hasChanges);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      const aHasChanges = pendingChanges.has(a.id);
      const bHasChanges = pendingChanges.has(b.id);
      if (aHasChanges && !bHasChanges) return -1;
      if (!aHasChanges && bHasChanges) return 1;
      return 0;
    });

  const promoCount = products.filter(p => getCurrentPromoPrice(p) !== undefined).length;
  const currentPageProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 font-sans">
        <div className="text-center">
          <RefreshCw className="size-8 animate-spin text-[#E31837] mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading promotional pricing database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Tag className="size-6 text-[#E31837]" />
            Promotional Pricing Engine
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Set special discounted pricing and run targeted promotions across your product catalog
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {promoCount > 0 && (
            <button
              onClick={() => setDeleteTarget('ALL')}
              className="h-10 px-4 bg-white border border-rose-200 text-[#E31837] hover:bg-rose-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="size-4" />
              Clear All Promos
            </button>
          )}
          <button
            onClick={saveAllChanges}
            disabled={saving || pendingChanges.size === 0}
            className="h-10 px-5 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Floating Unsaved Changes Alert Banner */}
      {pendingChanges.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="size-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0 border border-amber-200">
              <AlertCircle className="size-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black text-amber-900">
                {pendingChanges.size} Unsaved Price {pendingChanges.size > 1 ? 'Changes' : 'Change'}
              </h3>
              <p className="text-xs text-amber-700 font-medium mt-0.5">
                You have modified promotional rates. Click "Apply & Save Changes" to update the live catalog.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={clearAllChanges}
              className="h-9 px-4 bg-white border border-amber-200 hover:bg-amber-100 text-amber-800 rounded-xl font-bold text-xs cursor-pointer flex-1 sm:flex-none"
            >
              Discard
            </button>
            <button
              onClick={saveAllChanges}
              disabled={saving}
              className="h-9 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs flex-1 sm:flex-none"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              Apply & Save Changes
            </button>
          </div>
        </div>
      )}

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">TOTAL PRODUCTS</p>
              <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">{products.length.toLocaleString()}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Catalog items</p>
            </div>
            <div className="size-11 rounded-xl bg-blue-50 border border-slate-200 flex items-center justify-center shrink-0 text-blue-600">
              <Layers className="size-5.5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">ACTIVE PROMOTIONS</p>
              <p className="text-2xl sm:text-3xl font-black text-[#E31837]">{promoCount}</p>
              <p className="text-xs text-[#E31837] font-semibold mt-1">Products on special rate</p>
            </div>
            <div className="size-11 rounded-xl bg-rose-50 border border-slate-200 flex items-center justify-center shrink-0 text-[#E31837]">
              <Tag className="size-5.5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">PENDING CHANGES</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-600">{pendingChanges.size}</p>
              <p className="text-xs text-amber-600 font-semibold mt-1">Unsaved rate modifications</p>
            </div>
            <div className="size-11 rounded-xl bg-amber-50 border border-slate-200 flex items-center justify-center shrink-0 text-amber-600">
              <Percent className="size-5.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: Search & Filter Mode Tabs */}
      <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 flex flex-col lg:flex-row items-center justify-between gap-3 w-full">
        <div className="relative max-w-sm sm:max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search products by code, name, or brand..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-xs sm:text-sm font-semibold w-full"
          />
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl w-full lg:w-auto overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3.5 py-1.5 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${
              filterMode === 'all' ? 'bg-white text-[#0f172a] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Products ({products.length})
          </button>
          <button
            onClick={() => setFilterMode('promo')}
            className={`px-3.5 py-1.5 rounded-lg font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              filterMode === 'promo' ? 'bg-[#E31837] text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Promoted ({promoCount})
          </button>
          <button
            onClick={() => setFilterMode('noPromo')}
            className={`px-3.5 py-1.5 rounded-lg font-extrabold text-xs transition-all cursor-pointer ${
              filterMode === 'noPromo' ? 'bg-white text-[#0f172a] shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Regular ({products.length - promoCount})
          </button>
          <button
            onClick={() => setFilterMode('changed')}
            className={`px-3.5 py-1.5 rounded-lg font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
              filterMode === 'changed' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Changed ({pendingChanges.size})
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (when selected) */}
      {selectedProducts.size > 0 && (
        <div className="bg-[#0f172a] text-white rounded-xl p-3.5 shadow-xs border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-xs">
            <span className="bg-white/20 text-white px-2.5 py-1 rounded-lg">
              {selectedProducts.size} selected
            </span>
            <span>Apply bulk promotional pricing:</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                step="0.01"
                id="bulkPromoPrice"
                placeholder="Promo Price ($)"
                className="w-36 h-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400 text-xs font-bold rounded-xl"
              />
              <button
                onClick={() => {
                  const input = document.getElementById('bulkPromoPrice') as HTMLInputElement;
                  if (input.value) {
                    applyBulkPromoPrice(input.value);
                    input.value = '';
                  }
                }}
                className="h-9 px-3 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Set Promo
              </button>
            </div>
            <button
              onClick={() => setSelectedProducts(new Set())}
              className="text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-black text-[#0f172a] tracking-tight flex items-center gap-2">
            Catalog Promotional Pricing Table
            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
              {filteredProducts.length} items
            </span>
          </h2>
          <span className="text-xs font-semibold text-slate-500">
            Showing {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredProducts.length)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[850px]">
            <thead className="bg-slate-50/50 border-b border-slate-200 text-xs font-extrabold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={currentPageProducts.length > 0 && selectedProducts.size === currentPageProducts.length}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-[#E31837] focus:ring-[#E31837] cursor-pointer"
                  />
                </th>
                <th className="p-4">Product Info</th>
                <th className="p-4 w-44">Base Price ($)</th>
                <th className="p-4 w-44">Promo Price ($)</th>
                <th className="p-4 w-36">Discount / Savings</th>
                <th className="p-4 w-28">Status</th>
                <th className="p-4 text-right w-24">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs sm:text-sm font-semibold text-[#0f172a]">
              {currentPageProducts.map((product) => {
                const stats = calculateStats(product);
                const hasChanges = pendingChanges.has(product.id);
                const change = pendingChanges.get(product.id);
                const dbPrice = getCurrentDbPrice(product);
                const promoPrice = getCurrentPromoPrice(product);
                const isSelected = selectedProducts.has(product.id);

                const dbPriceDisplay = change?.dbPriceInput !== undefined ? change.dbPriceInput : dbPrice.toFixed(2);
                const promoPriceDisplay = change?.promoPriceInput !== undefined ? change.promoPriceInput : (promoPrice?.toFixed(2) || '');

                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-slate-50 transition-colors ${isSelected ? 'bg-blue-50/50' : hasChanges ? 'bg-amber-50/40' : ''}`}
                  >
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectProduct(product.id)}
                        className="rounded border-slate-300 text-[#E31837] focus:ring-[#E31837] cursor-pointer"
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.mainImageUrl || product.image || 'https://via.placeholder.com/60'}
                          alt={product.name}
                          className="size-12 object-cover rounded-xl border border-slate-200 bg-white shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-extrabold text-[#0f172a] truncate">{product.name}</p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-[11px] font-mono font-semibold text-slate-400">
                              {product.code || product.sku || 'No SKU'}
                            </span>
                            {product.brand && (
                              <span className="text-xs font-bold text-slate-500">• {product.brand}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Input
                        type="number"
                        step="0.01"
                        value={dbPriceDisplay}
                        onChange={(e) => handleDbPriceChange(product.id, e.target.value)}
                        className="h-9 bg-slate-50 border-slate-200 rounded-xl text-xs font-bold"
                      />
                    </td>
                    <td className="p-4">
                      <Input
                        type="number"
                        step="0.01"
                        value={promoPriceDisplay}
                        onChange={(e) => handlePromoPriceChange(product.id, e.target.value)}
                        placeholder="Set promo"
                        className={`h-9 border-slate-200 rounded-xl text-xs font-bold ${promoPrice ? 'bg-rose-50 border-rose-200 text-[#E31837]' : 'bg-slate-50'}`}
                      />
                    </td>
                    <td className="p-4">
                      {stats ? (
                        stats.isValid ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-[#E31837]">-${stats.savings.toFixed(2)}</span>
                            <span className="text-[10px] font-extrabold bg-rose-50 text-[#E31837] border border-rose-200 px-1.5 py-0.5 rounded-md">
                              {stats.discountPercent}% OFF
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                            Invalid (Promo &gt;= Base)
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 font-medium">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      {hasChanges ? (
                        <span className="text-[10px] font-extrabold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          Unsaved
                        </span>
                      ) : promoPrice ? (
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          Promoted
                        </span>
                      ) : (
                        <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                          Regular
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {hasChanges && (
                          <button
                            onClick={() => removePendingChange(product.id)}
                            className="size-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 cursor-pointer"
                            title="Undo changes"
                          >
                            <X className="size-3.5" />
                          </button>
                        )}
                        {!hasChanges && promoPrice && (
                          <button
                            onClick={() => setDeleteTarget({ id: product.id, name: product.name })}
                            className="size-8 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-[#E31837] cursor-pointer"
                            title="Remove promo price"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-start gap-3 px-4 py-3 bg-slate-50/50 border-t border-slate-200">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 disabled:opacity-50 cursor-pointer"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-slate-500">
              Page {currentPage} of {totalPages} ({filteredProducts.length} items)
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 disabled:opacity-50 cursor-pointer"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeletePromotion}
        title={deleteTarget === 'ALL' ? "Clear All Promotional Pricing" : "Remove Promotional Price"}
        description={
          deleteTarget === 'ALL'
            ? "Are you sure you want to remove ALL promotional pricing across the entire catalog? This action cannot be undone."
            : `Are you sure you want to remove the promotional pricing for "${typeof deleteTarget === 'object' && deleteTarget ? deleteTarget.name : 'this product'}"?`
        }
        loading={deleting}
      />
    </div>
  );
}
