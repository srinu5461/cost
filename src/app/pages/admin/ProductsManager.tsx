import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useCMS } from '../../context/CMSContext';
import { Product } from '../../types/product';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { CategorySelector } from '../../components/admin/CategorySelector';
import { buildCategoryTree } from '../../utils/categoryTree';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Save,
  X,
  Upload,
  Image as ImageIcon,
  RefreshCw,
  Package,
  CheckCircle2,
  AlertCircle,
  Eye,
  Tag
} from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { logger } from '../../utils/logger';
import { notify } from '../../utils/notifications';
import { DeleteConfirmModal } from '../../components/ui/DeleteConfirmModal';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

export function ProductsManager() {
  logger.debug('ProductsManager component mounted');

  const navigate = useNavigate();
  const cms = useCMS();
  const { refreshData } = cms;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Equipment');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 50;
  const batchSize = 200;

  // Fetch products in batches
  const fetchProducts = async (offset: number = 0, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const response = await fetch(`${API_URL}/products?limit=${batchSize}&offset=${offset}&_t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMsg = `Failed to fetch products: ${response.status} - ${errorText}`;
        setLastError(errorMsg);
        throw new Error(errorMsg);
      }

      const data = await response.json();
      const newProducts = (data.products || []).filter((p: any) => p && typeof p === 'object');
      const total = data.pagination?.total || newProducts.length;

      setTotalProducts(total);

      if (append) {
        setProducts(prev => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
      }

      setHasMore((offset + newProducts.length) < total);
      setLastError(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setLastError(errorMsg);
      notify.error('Failed to load products: ' + errorMsg);
      if (!append) {
        setProducts([]);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setProducts([]);
    setCurrentPage(1);
    await fetchProducts(0, false);
    setIsRefreshing(false);
  };

  const loadMoreProducts = () => {
    const currentOffset = products.length;
    fetchProducts(currentOffset, true);
  };

  const loadAllProducts = async () => {
    let offset = products.length;
    const maxBatches = 50;
    let batchCount = 0;

    setLoadingMore(true);

    try {
      while (hasMore && batchCount < maxBatches) {
        const response = await fetch(`${API_URL}/products?limit=${batchSize}&offset=${offset}&_t=${Date.now()}`, {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          },
          cache: 'no-store'
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch batch: ${response.status}`);
        }

        const data = await response.json();
        const newProducts = (data.products || []).filter((p: any) => p && typeof p === 'object');
        const total = data.pagination?.total || newProducts.length;

        if (newProducts.length === 0) {
          break;
        }

        setProducts(prev => [...prev, ...newProducts]);
        setTotalProducts(total);

        offset += newProducts.length;
        batchCount++;

        if (offset >= total) {
          setHasMore(false);
          break;
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }

      notify.success(`Loaded all ${offset} products`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      notify.error('Failed to load all products: ' + errorMsg);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchProducts(0, false);
  }, []);

  const filteredProducts = products.filter(p => p && typeof p === 'object').filter(p =>
    (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (p.category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (p.description?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (p.code?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ).filter(p =>
    selectedCategory === 'All Equipment' || p.category === selectedCategory
  );

  const handleCreateProduct = () => {
    const newProduct: Product = {
      id: Date.now().toString(),
      code: '',
      sku: '',
      name: 'New Product',
      description: '',
      specifications: '',
      price: 0,
      category: cms.data.categories[1] || 'General',
      categoryLevel1: '',
      categoryLevel2: '',
      categoryLevel3: '',
      categoryLevel4: '',
      categoryLevel1Id: '',
      categoryLevel2Id: '',
      categoryLevel3Id: '',
      categoryLevel4Id: '',
      categoryId: '',
      wholePath: '',
      image: '',
      allImages: [],
      galleryImages: [],
      brand: '',
      brandLogo: '',
      rating: 4.5,
      inStock: true,
      status: true,
      features: [],
      multiBuyOptions: []
    };
    setEditingProduct(newProduct);
    setIsAddDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingProduct) return;

    try {
      const isNewProduct = isAddDialogOpen && !products.find(p => p.id === editingProduct.id);

      if (isNewProduct) {
        if (!editingProduct.name || !editingProduct.name.trim()) {
          notify.error('Product name is required');
          return;
        }
        if (!editingProduct.code || !editingProduct.code.trim()) {
          notify.error('Product code is required');
          return;
        }

        const productToSave = {
          ...editingProduct,
          id: editingProduct.code.trim(),
          code: editingProduct.code.trim(),
        };

        const response = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(productToSave),
        });

        if (!response.ok) {
          throw new Error(`Failed to add product: ${response.status}`);
        }

        setEditingProduct(productToSave);
        notify.success('Product added successfully');
      } else {
        const response = await fetch(`${API_URL}/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(editingProduct),
        });

        if (!response.ok) {
          throw new Error(`Failed to update product: ${response.status}`);
        }

        notify.success('Product updated successfully');
      }

      if (isNewProduct) {
        setProducts([]);
        setCurrentPage(1);
        await fetchProducts(0, false);
      } else {
        setProducts(prevProducts =>
          prevProducts.map(p =>
            p.id === editingProduct.id ? editingProduct : p
          )
        );
      }

      if (isAddDialogOpen) {
        setIsAddDialogOpen(false);
      }
      setEditingProduct(null);
    } catch (error) {
      notify.error('Failed to save product: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const confirmDeleteProduct = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);

    try {
      const response = await fetch(`${API_URL}/products/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete product: ${response.status}`);
      }

      notify.success('Product deleted successfully');
      setProducts(prevProducts => prevProducts.filter(p => p.id !== deleteTargetId));
      setTotalProducts(prev => prev - 1);

      if (editingProduct?.id === deleteTargetId) {
        setEditingProduct(null);
      }
      setDeleteTargetId(null);
    } catch (error) {
      notify.error('Failed to delete product: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage) || 1;
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Package className="size-6 text-[#E31837]" />
            Products Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {products.length} of {totalProducts > 0 ? totalProducts.toLocaleString() : '?'} equipment items loaded in catalog
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || loading}
            className="h-10 px-4 bg-white border border-slate-200 text-[#0f172a] hover:bg-slate-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate('/admin/import-products')}
            className="h-10 px-4 bg-white border border-slate-200 text-[#0f172a] hover:bg-slate-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Upload className="size-4" />
            Import CSV
          </button>
          <button
            onClick={handleCreateProduct}
            className="h-10 px-5 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
          >
            <Plus className="size-4" />
            Add Product
          </button>
        </div>
      </div>

      {/* Top 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">TOTAL LOADED</p>
              <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">{products.length.toLocaleString()}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Total in database: <strong>{totalProducts.toLocaleString()}</strong></p>
            </div>
            <div className="size-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
              <Package className="size-5.5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">IN STOCK ITEMS</p>
              <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">{products.filter(p => p.inStock ?? true).length.toLocaleString()}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Ready for dispatch</p>
            </div>
            <div className="size-11 rounded-xl bg-emerald-50 border border-slate-200 flex items-center justify-center shrink-0 text-emerald-600">
              <CheckCircle2 className="size-5.5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">OUT OF STOCK</p>
              <p className="text-2xl sm:text-3xl font-black text-[#E31837]">{products.filter(p => !(p.inStock ?? true)).length.toLocaleString()}</p>
              <p className="text-xs text-[#E31837] font-semibold mt-1">Requires reorder</p>
            </div>
            <div className="size-11 rounded-xl bg-rose-50 border border-slate-200 flex items-center justify-center shrink-0 text-[#E31837]">
              <AlertCircle className="size-5.5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">ENABLED IN STORE</p>
              <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">{products.filter(p => p.status ?? true).length.toLocaleString()}</p>
              <p className="text-xs text-blue-600 font-semibold mt-1">Active store listings</p>
            </div>
            <div className="size-11 rounded-xl bg-blue-50 border border-slate-200 flex items-center justify-center shrink-0 text-blue-600">
              <Tag className="size-5.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Search & Category Filter Toolbar */}
      <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        <div className="relative max-w-sm sm:max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search products by code, name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-xs sm:text-sm font-semibold w-full"
          />
        </div>
        <div className="w-full sm:w-44 shrink-0">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 cursor-pointer">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 rounded-xl shadow-xl z-50">
              <SelectItem value="All Equipment" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-700">All Categories</SelectItem>
              {cms.data.categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="cursor-pointer text-xs sm:text-sm font-bold text-slate-700">{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Products Grid / Editor Container */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_450px] gap-4 items-start">
        {/* Products List Panel */}
        <div className="space-y-3">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <h2 className="text-sm sm:text-base font-black text-[#0f172a] tracking-tight flex items-center gap-2">
                All Products Catalog
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {filteredProducts.length} items
                </span>
              </h2>
            </div>

            {loading && (
              <div className="p-8 text-center">
                <RefreshCw className="size-8 animate-spin mx-auto mb-2 text-[#E31837]" />
                <p className="text-xs font-bold text-slate-500">Loading catalog items...</p>
              </div>
            )}

            {!loading && filteredProducts.length === 0 && (
              <div className="p-8 text-center">
                <Package className="size-10 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-[#0f172a]">No products found</p>
                <p className="text-xs text-slate-500 mt-1">Try adjusting your search criteria or category filter</p>
              </div>
            )}

            <div className="p-3 space-y-2.5">
              {currentProducts.map((product) => (
                <div
                  key={product.id}
                  onClick={() => setEditingProduct(product)}
                  className={`group cursor-pointer rounded-xl border bg-white p-3.5 transition-all shadow-xs hover:shadow-sm ${
                    editingProduct?.id === product.id ? 'border-[#E31837] ring-1 ring-[#E31837]' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex gap-3.5 items-center">
                    <div className="relative shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-white">
                      <img
                        src={product.image || 'https://via.placeholder.com/80'}
                        alt={product.name || 'Product'}
                        className="size-16 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h3 className="mb-1 text-xs sm:text-sm font-extrabold text-[#0f172a] truncate group-hover:text-[#E31837] transition-colors">
                        {product.name || 'Unnamed Product'}
                      </h3>
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                          {product.category || 'Uncategorized'}
                        </span>
                        <span className="text-xs font-mono font-semibold text-slate-400">{product.code}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          (product.inStock ?? true) 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {(product.inStock ?? true) ? 'In Stock' : 'Out of Stock'}
                        </span>
                        <span className="text-xs font-black text-[#0f172a] ml-auto bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          ${(product.price ?? 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        className="size-9 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors cursor-pointer"
                        title="Edit Product"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingProduct(product);
                        }}
                      >
                        <Edit className="size-4" />
                      </button>
                      <button
                        className="size-9 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-[#E31837] transition-colors cursor-pointer"
                        title="Delete Product"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetId(product.id);
                        }}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {!loading && products.length > 0 && totalPages > 1 && (
              <div className="flex items-center justify-start gap-3 px-4 py-3 bg-slate-50/50 border-t border-slate-200">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="h-8 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 disabled:opacity-50 cursor-pointer"
                >
                  Previous
                </button>
                <span className="text-xs font-semibold text-slate-500">
                  Page {currentPage} of {totalPages} ({filteredProducts.length} products)
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

          {/* Load More Card — bottom left under products */}
          {!loading && hasMore && (
            <div className="bg-[#EFF6FF] border border-blue-200 rounded-xl p-4 flex flex-col items-center gap-3 text-center">
              <p className="text-sm font-bold text-[#1D4ED8]">
                <strong>{(totalProducts - products.length).toLocaleString()} more products</strong> available to load
              </p>
              <div className="flex items-center gap-3 flex-wrap justify-center">
                <button
                  onClick={loadMoreProducts}
                  disabled={loadingMore}
                  className="h-10 px-5 bg-white border border-slate-300 text-[#0f172a] hover:bg-slate-50 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs transition-all"
                >
                  <RefreshCw className={`size-4 ${loadingMore ? 'animate-spin' : ''}`} />
                  Load Next {batchSize}
                </button>
                <button
                  onClick={loadAllProducts}
                  disabled={loadingMore}
                  className="h-10 px-5 bg-[#1e293b] hover:bg-[#0f172a] text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-xs transition-all"
                >
                  <RefreshCw className={`size-4 ${loadingMore ? 'animate-spin' : ''}`} />
                  Load All Remaining
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit / Create Form Panel */}
        <div className="lg:sticky lg:top-20 h-fit">
          {editingProduct ? (
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black text-[#0f172a] uppercase tracking-wider">
                    {editingProduct.id === editingProduct.code && !products.find(p => p.id === editingProduct.id) ? 'Create New Product' : 'Edit Product Details'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(null);
                    setIsAddDialogOpen(false);
                  }}
                  className="size-7 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="p-4 space-y-4 max-h-[calc(100vh-10rem)] overflow-y-auto custom-scrollbar">
                <div>
                  <label className="text-xs font-extrabold text-slate-500 mb-1 block uppercase tracking-wider">Product Name *</label>
                  <Input
                    value={editingProduct.name || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="h-10 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-extrabold text-slate-500 mb-1 block uppercase tracking-wider">Product Code / SKU *</label>
                    <Input
                      value={editingProduct.code || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, code: e.target.value })}
                      className="h-10 bg-slate-50 border-slate-200 rounded-xl text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-extrabold text-slate-500 mb-1 block uppercase tracking-wider">Price ($) *</label>
                    <Input
                      type="number"
                      value={editingProduct.price || 0}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: parseFloat(e.target.value) || 0 })}
                      className="h-10 bg-slate-50 border-slate-200 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-500 mb-1 block uppercase tracking-wider">Primary Category</label>
                  <Select
                    value={editingProduct.category || 'General'}
                    onValueChange={(val) => setEditingProduct({ ...editingProduct, category: val })}
                  >
                    <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                      {cms.data.categories.map((cat) => (
                        <SelectItem key={cat} value={cat} className="cursor-pointer text-xs font-bold text-slate-700">{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-500 mb-1 block uppercase tracking-wider">Main Image URL</label>
                  <Input
                    value={editingProduct.image || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    className="h-10 bg-slate-50 border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-500 mb-1 block uppercase tracking-wider">Description</label>
                  <textarea
                    rows={4}
                    value={editingProduct.description || ''}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium focus:ring-1 focus:ring-[#E31837] focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-2 border-t border-slate-200">
                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setIsAddDialogOpen(false);
                    }}
                    className="flex-1 h-10 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 h-10 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl text-xs font-bold cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <Save className="size-4" />
                    Save Product
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 text-center">
              <Package className="size-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-[#0f172a]">No product selected</p>
              <p className="text-xs text-slate-500 mt-1">Select a product from the list to view or edit details, or click "+ Add Product".</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteProduct}
        title="Delete Equipment Product"
        description="Are you sure you want to permanently delete this product from the catalog? This action cannot be undone."
        confirmText="Delete Product"
        loading={deleting}
      />
    </div>
  );
}