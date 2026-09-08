import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Label } from '../../components/ui/label';
import { RefreshCw, FileText, CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight, Bug, X, Info } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { notify } from '../../utils/notifications';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface Product {
  id: string;
  code: string;
  name: string;
  brand: string;
  hasDescription: boolean;
  hasSpecifications: boolean;
  ageRestricted: boolean;
  descriptionLength: number;
  specificationsCount: number;
  lastDescriptionSync: string | null;
}

export default function DescriptionSync() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResults, setSyncResults] = useState<any>(null);

  // Debug modal state
  const [debugModalOpen, setDebugModalOpen] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [debugLoading, setDebugLoading] = useState(false);

  // Filters
  const [selectedBrand, setSelectedBrand] = useState('');
  const [skipWithDescription, setSkipWithDescription] = useState(true);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 50;

  // Fetch all available brands on mount
  const fetchBrands = async () => {
    setBrandsLoading(true);
    try {
      const response = await fetch(`${API_URL}/description-sync/brands`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        if (response.status >= 502 && response.status <= 504) {
          throw new Error(`Server temporarily unavailable (${response.status}). Please try again later.`);
        }
        throw new Error(`Failed to fetch brands: ${response.status}`);
      }

      const result = await response.json();
      setAvailableBrands(result.brands || []);
    } catch (error: any) {
      console.error('Error fetching brands:', error);
      notify.error(error.message || 'Error loading brands');
    } finally {
      setBrandsLoading(false);
    }
  };

  // Fetch products for selected brand
  const fetchProductsForBrand = async (brand: string) => {
    if (!brand) {
      setAllProducts([]);
      return;
    }

    setLoading(true);
    try {
      let allFetchedProducts: Product[] = [];
      let page = 1;
      let hasMorePages = true;
      const pageLimit = 1000;

      while (hasMorePages) {
        const response = await fetch(
          `${API_URL}/description-sync/products?brand=${encodeURIComponent(brand)}&page=${page}&limit=${pageLimit}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status >= 502 && response.status <= 504) {
            throw new Error(`Server temporarily unavailable (${response.status}). Please try again.`);
          }
          throw new Error(`Failed to fetch products page ${page}: ${response.status}`);
        }

        const result = await response.json();
        allFetchedProducts = [...allFetchedProducts, ...result.products];
        hasMorePages = result.pagination?.hasNextPage || false;
        page++;

        if (page > 20) break;
      }

      setAllProducts(allFetchedProducts);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      notify.error(error.message || 'Error loading products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrands();
  }, []);

  useEffect(() => {
    if (selectedBrand) {
      fetchProductsForBrand(selectedBrand);
    } else {
      setAllProducts([]);
    }
  }, [selectedBrand]);

  useEffect(() => {
    let filtered = [...allProducts];

    if (selectedBrand) {
      filtered = filtered.filter(p => p.brand === selectedBrand);
    }

    if (skipWithDescription) {
      filtered = filtered.filter(p => !p.hasDescription);
    }

    setFilteredProducts(filtered);
    setCurrentPage(1);
    setSelectedProducts(new Set());
  }, [allProducts, selectedBrand, skipWithDescription]);

  const totalPages = Math.ceil(filteredProducts.length / limit) || 1;
  const startIndex = (currentPage - 1) * limit;
  const endIndex = startIndex + limit;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const toggleProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const selectAll = () => {
    const newSelected = new Set(selectedProducts);
    currentProducts.forEach(p => newSelected.add(p.id));
    setSelectedProducts(newSelected);
  };

  const deselectAll = () => {
    setSelectedProducts(new Set());
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const runBatchSync = async () => {
    if (selectedProducts.size === 0) {
      notify.error('Please select at least one product');
      return;
    }

    if (!confirm(`Sync descriptions and specifications for ${selectedProducts.size} selected product(s)?`)) {
      return;
    }

    setSyncing(true);
    setSyncResults(null);

    try {
      const productCodes = Array.from(selectedProducts).map(id => {
        const product = allProducts.find(p => p.id === id);
        return product?.code;
      }).filter(Boolean) as string[];

      const response = await fetch(`${API_URL}/description-sync/batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productCodes,
          skipWithDescription: false,
          forceUpdate: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Batch sync failed: ${response.status}`);
      }

      const result = await response.json();
      setSyncResults(result);

      if (result.success) {
        notify.success(`Batch sync complete! Updated ${result.summary.descriptionsUpdated} descriptions and ${result.summary.specificationsUpdated} specifications.`);
        setSelectedProducts(new Set());

        if (result.cacheInvalidated) {
          localStorage.removeItem('cms_data_cache');
          localStorage.removeItem('cms_cache_timestamp');
        }
      } else {
        notify.error(`Sync failed: ${result.error}`);
      }
    } catch (error: any) {
      console.error('Batch sync error:', error);
      notify.error(error.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  const openDebugModal = () => {
    setDebugModalOpen(true);
  };

  const closeDebugModal = () => {
    setDebugModalOpen(false);
    setDebugData(null);
  };

  const debugSyncSingleProduct = async (productCode: string) => {
    setDebugLoading(true);
    openDebugModal();

    try {
      const response = await fetch(`${API_URL}/description-sync/single/${productCode}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Sync failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      setDebugData(result);

      if (selectedBrand) {
        await fetchProductsForBrand(selectedBrand);
      }
    } catch (error: any) {
      console.error('Debug sync error:', error);
      setDebugData({
        error: true,
        message: error.message || 'Sync failed'
      });
    } finally {
      setDebugLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <FileText className="size-6 text-[#E31837]" />
            Description & Features Sync
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Sync product descriptions, technical specifications, age restrictions, and thumbnail gallery from Uropa API
          </p>
        </div>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Product Content Sync:</strong> Image gallery thumbnails synced from Uropa are clickable in storefront product detail views to switch the main display image.
        </div>
      </div>

      {/* Debug & Diagnostic Bar */}
      <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Bug className="size-4 text-blue-600" />
            Diagnostic & Cache Utilities
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={async () => {
                try {
                  localStorage.clear();
                  sessionStorage.clear();
                  await fetch(`${API_URL}/cms/data?force=true`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${publicAnonKey}` },
                  });
                  notify.success('Cache cleared! Reloading page...');
                  setTimeout(() => window.location.reload(), 1000);
                } catch (error: any) {
                  notify.error(`Cache clear error: ${error.message}`);
                }
              }}
              className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-2xs cursor-pointer transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="size-3.5" />
              Clear All Cache
            </button>

            <button
              onClick={async () => {
                const code = prompt('Enter product code to check (e.g., CB734):');
                if (!code) return;
                try {
                  const product = allProducts.find(p => p.code === code);
                  if (!product) {
                    notify.error(`Product ${code} not found in current loaded brand list`);
                    return;
                  }
                  const response = await fetch(`${API_URL}/description-sync/debug/${product.id}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${publicAnonKey}` },
                  });
                  if (!response.ok) throw new Error(`Failed: ${response.status}`);
                  const result = await response.json();
                  notify.info(`Product: ${result.productName} | Specs: ${result.data.specificationsCount}`);
                } catch (error: any) {
                  notify.error(`Database check error: ${error.message}`);
                }
              }}
              className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 cursor-pointer transition-all"
            >
              Check Database
            </button>

            <button
              onClick={async () => {
                const code = prompt('Enter product code to compare (e.g., AE157):');
                if (!code) return;
                try {
                  const response = await fetch(`${API_URL}/description-sync/compare/${code}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${publicAnonKey}` },
                  });
                  if (!response.ok) throw new Error(`Failed: ${response.status}`);
                  const result = await response.json();
                  notify.info(`Uropa Specs: ${result.uropa?.specificationsCount} | Description: ${result.uropa?.descriptionLength} chars`);
                } catch (error: any) {
                  notify.error(`Comparison error: ${error.message}`);
                }
              }}
              className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 cursor-pointer transition-all"
            >
              📊 Compare DB vs Uropa
            </button>

            <button
              onClick={async () => {
                const code = prompt('Enter product code to test Uropa API (e.g., AE157):');
                if (!code) return;
                try {
                  const response = await fetch(`${API_URL}/description-sync/test-uropa/${code}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${publicAnonKey}` },
                  });
                  if (!response.ok) throw new Error(`Failed: ${response.status}`);
                  const result = await response.json();
                  notify.info(`API Response for ${code}: ${result.description?.length || 0} chars`);
                } catch (error: any) {
                  notify.error(`Uropa test error: ${error.message}`);
                }
              }}
              className="h-9 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs border border-emerald-200 cursor-pointer transition-all"
            >
              Test Uropa API
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Main Filter & Sync Section */}
      <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-base text-[#0f172a] font-black">
            📝 Filter & Select Products
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 font-medium">
            Updates description, specifications, age restrictions, and thumbnail gallery. Main product images are preserved.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-5">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <Label htmlFor="brand-filter" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Select Brand
              </Label>
              <select
                id="brand-filter"
                className="w-full mt-1.5 h-10 px-3 border border-slate-200 rounded-xl bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E31837]/20"
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                disabled={brandsLoading}
              >
                <option value="">-- Select brand to load products --</option>
                {availableBrands.map(brand => (
                  <option key={brand} value={brand}>{brand}</option>
                ))}
              </select>
              {selectedBrand && (
                <p className="text-[11px] font-semibold text-slate-500 mt-1">
                  {allProducts.length} products loaded for brand
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="skip-description" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Filter Criterion
              </Label>
              <div className="flex items-center mt-3 gap-2">
                <input
                  type="checkbox"
                  id="skip-description"
                  checked={skipWithDescription}
                  onChange={(e) => setSkipWithDescription(e.target.checked)}
                  className="size-4 text-[#E31837] rounded border-slate-300 focus:ring-0 cursor-pointer"
                />
                <label htmlFor="skip-description" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Only show products missing descriptions
                </label>
              </div>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => selectedBrand && fetchProductsForBrand(selectedBrand)}
                disabled={loading || !selectedBrand}
                className="w-full h-10 bg-white hover:bg-slate-100 text-slate-800 rounded-xl font-bold text-xs border border-slate-300 shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
              >
                <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh Brand Products
              </button>
            </div>
          </div>

          {/* Selection & Batch Action Toolbar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-900 text-white rounded-xl shadow-xs">
            <div className="text-xs sm:text-sm font-medium">
              <span className="font-black text-[#E31837] text-base mr-1">{selectedProducts.size}</span>
              products selected
              {selectedProducts.size > 0 && (
                <span className="text-xs text-slate-400 ml-2">(batch limit: 50)</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={selectAll}
                disabled={loading || currentProducts.length === 0}
                className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                Select Page ({currentProducts.length})
              </button>

              <button
                onClick={deselectAll}
                disabled={selectedProducts.size === 0}
                className="h-8 px-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold text-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                Deselect All
              </button>

              <button
                onClick={runBatchSync}
                disabled={syncing || selectedProducts.size === 0}
                className="h-8 px-4 bg-[#E31837] hover:bg-[#E31837]/90 text-white rounded-lg font-bold text-xs shadow-2xs flex items-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                {syncing ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <FileText className="size-3.5" />
                    Sync Selected ({Math.min(selectedProducts.size, 50)})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Products Table */}
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-500 space-x-3">
              <RefreshCw className="size-6 animate-spin text-[#E31837]" />
              <span className="text-sm font-semibold">Loading product data from server...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-500 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
              <AlertCircle className="size-10 mx-auto mb-3 text-slate-400" />
              <p className="font-bold text-sm text-slate-700">No products found matching filters</p>
              <p className="text-xs text-slate-500 mt-1">Select a brand above or adjust filter options.</p>
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                    <tr>
                      <th className="p-3 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={currentProducts.length > 0 && currentProducts.every(p => selectedProducts.has(p.id))}
                          onChange={(e) => e.target.checked ? selectAll() : deselectAll()}
                          className="size-4 text-[#E31837] rounded border-slate-300 focus:ring-0 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">Code</th>
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Brand</th>
                      <th className="p-3 text-center">Description</th>
                      <th className="p-3 text-center">Specs</th>
                      <th className="p-3 text-center">Age Restr.</th>
                      <th className="p-3">Last Sync</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {currentProducts.map((product) => (
                      <tr
                        key={product.id}
                        className={`hover:bg-slate-50/80 transition-colors ${selectedProducts.has(product.id) ? 'bg-red-50/40' : ''}`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedProducts.has(product.id)}
                            onChange={() => toggleProduct(product.id)}
                            className="size-4 text-[#E31837] rounded border-slate-300 focus:ring-0 cursor-pointer"
                          />
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-900">{product.code}</td>
                        <td className="p-3 max-w-xs truncate font-semibold">{product.name}</td>
                        <td className="p-3 text-slate-600">{product.brand}</td>
                        <td className="p-3 text-center">
                          {product.hasDescription ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="size-3" />
                              {product.descriptionLength}c
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <XCircle className="size-3" />
                              Missing
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {product.hasSpecifications ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="size-3" />
                              {product.specificationsCount} items
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                              <XCircle className="size-3" />
                              None
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {product.ageRestricted ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              18+
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="p-3 text-[11px] text-slate-500 whitespace-nowrap">
                          {product.lastDescriptionSync
                            ? new Date(product.lastDescriptionSync).toLocaleDateString()
                            : 'Never'
                          }
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => debugSyncSingleProduct(product.code)}
                            className="h-7 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-[11px] inline-flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Bug className="size-3" />
                            Debug
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="text-xs font-semibold text-slate-500">
                Showing {startIndex + 1} - {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className="h-8 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft className="size-3.5" />
                  Prev
                </button>

                <span className="text-xs font-bold text-slate-700 px-2">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className="h-8 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                >
                  Next
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Sync Results Summary */}
          {syncResults && (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
              <h3 className="font-black text-emerald-900 text-xs sm:text-sm flex items-center gap-2">
                <CheckCircle2 className="size-4 text-emerald-600" />
                Last Sync Execution Summary
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <div className="text-slate-500 font-medium text-[10px]">Descriptions</div>
                  <div className="text-base font-black text-emerald-700">{syncResults.summary?.descriptionsUpdated || 0}</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <div className="text-slate-500 font-medium text-[10px]">Specifications</div>
                  <div className="text-base font-black text-emerald-700">{syncResults.summary?.specificationsUpdated || 0}</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <div className="text-slate-500 font-medium text-[10px]">Thumbnails</div>
                  <div className="text-base font-black text-emerald-700">{syncResults.summary?.imagesUpdated || 0}</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <div className="text-slate-500 font-medium text-[10px]">Skipped</div>
                  <div className="text-base font-black text-slate-700">{syncResults.summary?.skipped || 0}</div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-emerald-100">
                  <div className="text-slate-500 font-medium text-[10px]">Errors</div>
                  <div className="text-base font-black text-red-600">{syncResults.summary?.errors || 0}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Debug Modal Overlay */}
      {debugModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col font-sans border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <h2 className="text-sm font-black flex items-center gap-2">
                <Bug className="size-4 text-[#E31837]" />
                Single Product Sync Diagnostic
              </h2>
              <button
                onClick={closeDebugModal}
                className="p-1 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {debugLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-3">
                  <RefreshCw className="size-8 animate-spin text-[#E31837]" />
                  <span className="text-sm font-semibold">Executing Uropa API payload extraction...</span>
                </div>
              ) : debugData?.error ? (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800">
                  <h3 className="font-bold text-sm mb-1">Diagnostic Error</h3>
                  <p className="text-xs">{debugData.message}</p>
                </div>
              ) : debugData ? (
                <div className="space-y-4 text-xs">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-700">Product Code:</span>
                      <span className="ml-2 font-mono font-black text-slate-900">{debugData.productCode}</span>
                    </div>
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-200 text-emerald-900">
                      {debugData.success ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </div>

                  {/* Database State Before */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-slate-100 p-2.5 font-bold text-slate-800 border-b border-slate-200">
                      📦 Database State (Before Sync)
                    </div>
                    <div className="p-3 space-y-2">
                      <p><strong>Description Length:</strong> {debugData.before?.descriptionLength || 0} chars</p>
                      <p><strong>Specifications Count:</strong> {debugData.before?.specificationsCount || 0} items</p>
                      <p><strong>Age Restricted:</strong> {debugData.before?.ageRestricted ? 'YES' : 'NO'}</p>
                    </div>
                  </div>

                  {/* Saved After */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-emerald-100 p-2.5 font-bold text-emerald-900 border-b border-emerald-200">
                      💾 Saved Database State (After Sync)
                    </div>
                    <div className="p-3 space-y-2">
                      <p><strong>Description Length:</strong> {debugData.after?.descriptionLength || 0} chars</p>
                      <p><strong>Specifications Count:</strong> {debugData.after?.specificationsCount || 0} items</p>
                      <p><strong>Age Restricted:</strong> {debugData.after?.ageRestricted ? 'YES' : 'NO'}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={closeDebugModal}
                className="h-9 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer"
              >
                Close Diagnostic
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}