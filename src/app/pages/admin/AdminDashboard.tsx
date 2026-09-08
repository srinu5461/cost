import { Link } from 'react-router';
import { useAdmin } from '../../context/AdminContext';
import { useCMS } from '../../context/CMSContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import {
  Package,
  Layout,
  Settings,
  FileText,
  Home,
  LayoutGrid,
  Percent,
  Search,
  Trash2,
  RefreshCw,
  Database,
  Clock,
  CheckCircle2,
  Tag
} from 'lucide-react';
import { useState, useEffect, startTransition } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { toast } from 'sonner';
import { getCachedDataIDB, isIndexedDBSupported } from '../../utils/indexedDB';

export function AdminDashboard() {
  const { isAuthenticated } = useAdmin();
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cacheClearing, setCacheClearing] = useState(false);
  const [buildCacheLoading, setBuildCacheLoading] = useState(false);
  const [lastCacheCleared, setLastCacheCleared] = useState<string | null>(null);
  const [lastCacheBuilt, setLastCacheBuilt] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<any>(null);
  const [checkingCache, setCheckingCache] = useState(false);
  const [productCount, setProductCount] = useState<number>(0);
  const [categoryCount, setCategoryCount] = useState<number>(0);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  
  // ✅ Safe access to CMS context with fallback
  let data, clearCache, refreshData, cacheTimestamp, cmsLoading;
  try {
    const cms = useCMS();
    data = cms.data;
    clearCache = cms.clearCache;
    refreshData = cms.refreshData;
    cacheTimestamp = cms.cacheTimestamp;
    cmsLoading = cms.loading;
  } catch (e) {
    console.error('AdminDashboard: CMSProvider not available, using empty data');
    data = {
      products: [],
      categories: [],
      categoryTree: [],
      header: { logo: '', phone: '', workingHours: '', navigation: [] },
      footer: { about: '', email: '', phone: '', address: '', socialMedia: {} },
      homepage: { hero: { title: '', subtitle: '', image: '' }, features: [] },
    };
    clearCache = () => {};
    refreshData = async () => {};
    cacheTimestamp = null;
    cmsLoading = false;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Fetch actual product and category counts
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/products-count`,
          { headers: { 'Authorization': `Bearer ${publicAnonKey}` } }
        );
        const result = await response.json();
        console.log('📊 Products count API response:', result);
        setProductCount(result.totalCount || 0);

        // Categories from CMS data
        setCategoryCount(data.categories?.length || 0);
      } catch (error) {
        console.error('Failed to fetch counts:', error);
      }
    };
    fetchCounts();
  }, [data.categories]);

  console.log('📊 AdminDashboard Stats:', {
    productCount,
    categoryCount,
    cmsLoading
  });

  const stats = [
    { label: 'Total Products', value: productCount || '...', icon: Package },
    { label: 'Categories', value: categoryCount || data.categories.length, icon: LayoutGrid },
    { label: 'In Stock', value: '...', icon: Package },
    { label: 'Out of Stock', value: '...', icon: Package },
  ];

  const quickLinks = [
    { 
      title: 'Manage Products', 
      description: 'Add, edit, or delete products',
      icon: Package,
      path: '/admin/products',
      color: 'bg-blue-500'
    },
    { 
      title: 'Edit Header', 
      description: 'Customize header and navigation',
      icon: Layout,
      path: '/admin/header',
      color: 'bg-green-500'
    },
    { 
      title: 'Edit Footer', 
      description: 'Update footer content',
      icon: FileText,
      path: '/admin/footer',
      color: 'bg-purple-500'
    },
    { 
      title: 'Homepage Settings', 
      description: 'Customize homepage sections',
      icon: Home,
      path: '/admin/homepage',
      color: 'bg-orange-500'
    },
    { 
      title: 'Categories', 
      description: 'Manage product categories',
      icon: LayoutGrid,
      path: '/admin/categories',
      color: 'bg-pink-500'
    },
    {
      title: 'Profit Margins',
      description: 'Configure tiered pricing margins',
      icon: Percent,
      path: '/admin/profit-margin-settings',
      color: 'bg-emerald-500'
    },
    {
      title: 'Specials & BOGO',
      description: 'Manage promotions and special offers',
      icon: Tag,
      path: '/admin/specials',
      color: 'bg-red-500'
    },
    {
      title: 'Settings',
      description: 'General CMS settings',
      icon: Settings,
      path: '/admin/settings',
      color: 'bg-slate-500'
    },
  ];

  const queryProduct = async (code: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/products/query/${code}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      const result = await response.json();
      setQueryResult(result);
    } catch (error) {
      console.error('Query error:', error);
      setQueryResult({ error: String(error) });
    } finally {
      setLoading(false);
    }
  };

  const handleProductsDiagnostic = async () => {
    try {
      toast.info('Running diagnostic...');

      // Fetch featured sections IDs (the most important data)
      const sectionsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/featured-sections`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );

      console.log('📡 Response status:', sectionsResponse.status);

      if (!sectionsResponse.ok) {
        const errorText = await sectionsResponse.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Server returned ${sectionsResponse.status}: ${errorText.substring(0, 100)}`);
      }

      const sectionsData = await sectionsResponse.json();
      console.log('📦 Full sections data:', JSON.stringify(sectionsData, null, 2));

      // Check if IDs are numeric (wrong) or alphanumeric codes (correct)
      const featured = sectionsData.featured || [];
      const popular = sectionsData.popular || [];
      const promotion = sectionsData.promotion || [];

      const featuredSample = featured.slice(0, 5);
      const isNumeric = featuredSample.length > 0 && featuredSample.every((id: any) =>
        typeof id === 'number' || (typeof id === 'string' && !isNaN(Number(id)) && /^\d+$/.test(id))
      );

      const message = `🔍 DIAGNOSTIC RESULTS:

Featured: ${featured.length} items
Sample IDs: ${featuredSample.length > 0 ? featuredSample.join(', ') : 'None'}

Popular: ${popular.length} items
Sample IDs: ${popular.slice(0, 3).join(', ') || 'None'}

Promotional: ${promotion.length} items
Sample IDs: ${promotion.slice(0, 3).join(', ') || 'None'}

${isNumeric ?
'❌ PROBLEM: IDs are NUMERIC (1, 2, 3...)\n\n→ Go to Featured Products page\n→ Click "Save Changes"\n→ Then use Force Rebuild Cache' :
featuredSample.length === 0 ?
'⚠️ NO FEATURED PRODUCTS CONFIGURED\n\n→ Go to Featured Products page\n→ Add products\n→ Save' :
'✅ GOOD: IDs are PRODUCT CODES\n\n→ Use "Force Rebuild Cache" button\n→ Check if products appear'}

(Full data in console)`;

      console.log('✅ Diagnostic complete');
      alert(message);
      toast.success('Diagnostic complete');
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      alert(`⚠️ DIAGNOSTIC FAILED\n\nError: ${errorMsg}\n\nTry:\n1. Check if backend is deployed\n2. Check browser console for details\n3. Try Force Rebuild Cache button instead`);
      toast.error('Diagnostic failed - see alert');
    }
  };

  const handleForceRebuildCache = async () => {
    setCacheClearing(true);
    try {
      toast.info('Rebuilding section caches...');

      // Step 1: REBUILD section caches (this is the important part!)
      const rebuildResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/rebuild-section-cache`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` }
        }
      );

      if (!rebuildResponse.ok) {
        throw new Error('Rebuild failed');
      }

      const rebuildData = await rebuildResponse.json();
      console.log('✅ Rebuild result:', rebuildData);
      toast.success(`✅ Rebuilt: ${rebuildData.counts?.featured || 0} featured, ${rebuildData.counts?.popular || 0} popular, ${rebuildData.counts?.promotion || 0} promo`, { duration: 3000 });

      // Step 2: Clear localStorage
      localStorage.removeItem('costplus100_homepage_data');
      localStorage.removeItem('costplus100_homepage_timestamp');
      localStorage.removeItem('costplus100_homepage_cache_version');

      // Clear CMS cache too
      clearCache();

      // Step 3: Wait for cache to propagate
      await new Promise(resolve => setTimeout(resolve, 500));

      const verifyResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/homepage-data?v=${Date.now()}&force=true`,
        {
          cache: 'no-store',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Cache-Control': 'no-cache'
          }
        }
      );

      if (verifyResponse.ok) {
        const verifyData = await verifyResponse.json();

        const featuredCount = verifyData.featured?.length || 0;
        const popularCount = verifyData.popular?.length || 0;
        const promoCount = verifyData.promotion?.length || 0;

        console.log('✅ Fresh data fetched:', { featuredCount, popularCount, promoCount });
        console.log('Sample featured IDs:', verifyData.featured?.slice(0, 3).map((p: any) => p.code));

        if (featuredCount > 0 || popularCount > 0 || promoCount > 0) {
          toast.success(`✅ SUCCESS! Featured: ${featuredCount}, Popular: ${popularCount}, Promo: ${promoCount}. Refresh homepage now!`, { duration: 10000 });
        } else {
          toast.warning('⚠️ Still showing 0 products. Make sure Featured Products page has product codes saved, not numeric IDs.', { duration: 10000 });
        }
      } else {
        const errorText = await verifyResponse.text();
        console.error('Verify failed:', errorText);
        toast.error('Cache cleared but could not verify. Try refreshing homepage.', { duration: 5000 });
      }

      setLastCacheCleared(new Date().toLocaleString());
    } catch (error) {
      console.error('Force rebuild error:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setCacheClearing(false);
    }
  };

  const handleClearCache = async () => {
    setCacheClearing(true);
    try {
      // Clear CMS cache (session storage)
      clearCache();

      // Rebuild section caches for homepage
      try {
        const rebuildResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/rebuild-section-cache`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        if (rebuildResponse.ok) {
          const result = await rebuildResponse.json();
          console.log('✅ Section caches rebuilt:', result);
          toast.info(`Rebuilt: ${result.counts?.featured || 0} featured, ${result.counts?.popular || 0} popular, ${result.counts?.promotion || 0} promo`);
        } else {
          const error = await rebuildResponse.json();
          console.error('❌ Rebuild failed:', error);
          toast.error(`Rebuild failed: ${error.error || 'Unknown error'}`);
        }
      } catch (rebuildError) {
        console.warn('Failed to rebuild section cache:', rebuildError);
        toast.error('Failed to rebuild section cache');
      }

      setLastCacheCleared(new Date().toLocaleString());
      toast.success('✅ All caches cleared and rebuilt! Fresh data will load on next visit.', { duration: 4000 });
    } catch (error) {
      console.error('Cache clearing error:', error);
      toast.error('Failed to clear cache. Please try again.');
    } finally {
      setCacheClearing(false);
    }
  };

  const handleClearAndRefresh = async () => {
    setCacheClearing(true);
    try {
      // Clear CMS cache
      clearCache();
      
      // Rebuild section caches for homepage
      try {
        const rebuildResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/rebuild-section-cache`,
          {
            method: 'POST',
            headers: { 
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );
        
        if (rebuildResponse.ok) {
          const result = await rebuildResponse.json();
          console.log('✅ Section caches rebuilt:', result);
        }
      } catch (rebuildError) {
        console.warn('Failed to rebuild section cache:', rebuildError);
      }
      
      toast.info('Clearing cache and refreshing data...');
      
      // Refresh data
      await refreshData();
      
      setLastCacheCleared(new Date().toLocaleString());
      toast.success('✅ Cache cleared and data refreshed!', { duration: 4000 });
    } catch (error) {
      console.error('Cache clearing error:', error);
      toast.error('Failed to clear and refresh. Please try again.');
    } finally {
      setCacheClearing(false);
    }
  };

  const handleBuildCache = async () => {
    setBuildCacheLoading(true);
    try {
      toast.info('🔨 Building consolidated cache in database...');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/cms/build-cache`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setLastCacheBuilt(new Date().toLocaleString());
        toast.success(
          `✅ Cache built successfully! ${result.stats.categories} categories, ${result.stats.categoryTree} category tree nodes. Build time: ${result.stats.buildTime}ms`,
          { duration: 5000 }
        );

        // Auto-refresh cache status
        handleCheckCacheStatus();
      } else {
        const error = await response.json();
        toast.error(`Failed to build cache: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Build cache error:', error);
      toast.error('Failed to build cache. Please try again.');
    } finally {
      setBuildCacheLoading(false);
    }
  };

  const handleCheckCacheStatus = async () => {
    setCheckingCache(true);
    try {
      // Check server-side caches
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/cms/cache-status`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      let result: any = {};
      if (response.ok) {
        result = await response.json();
      } else {
        toast.error('Failed to check cache status');
      }

      // Check IndexedDB cache (client-side)
      let indexedDBStatus = {
        supported: false,
        products: 0,
      };

      if (isIndexedDBSupported()) {
        try {
          const cachedProducts = await getCachedDataIDB('products', '1');
          indexedDBStatus = {
            supported: true,
            products: Array.isArray(cachedProducts) ? cachedProducts.length : 0,
          };
        } catch (e) {
          console.warn('Failed to check IndexedDB:', e);
          indexedDBStatus = { supported: true, products: 0 };
        }
      }

      setCacheStatus({
        ...result,
        indexedDB: indexedDBStatus,
      });
    } catch (error) {
      console.error('Check cache status error:', error);
      toast.error('Failed to check cache status');
    } finally {
      setCheckingCache(false);
    }
  };

  return (
    <div className="w-full pb-12">
      <div className="mb-6 bg-white rounded-xl p-5 sm:p-8 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight">Admin Dashboard</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Welcome to the Cost Plus 100 CMS control center</p>
        </div>
      </div>

      {/* Stats Cards with visible border border-slate-200 & rounded-xl */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-5 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/40 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">{stat.value}</p>
              </div>
              <div className="size-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <stat.icon className="size-5.5 text-[#E31837]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Quick Product Query */}
        <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col">
          <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
            <div className="size-9 rounded-xl bg-slate-100 flex items-center justify-center border border-slate-200">
              <Search className="size-4.5 text-slate-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0f172a]">Quick Product Query</h2>
              <p className="text-xs text-slate-500 font-medium">Test database lookups by code</p>
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex flex-wrap gap-2.5 mb-4">
              <button 
                onClick={() => queryProduct('FZ433')}
                disabled={loading}
                className="bg-[#0f172a] hover:bg-[#1e293b] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                {loading ? 'Querying...' : 'Query FZ433'}
              </button>
              <button 
                onClick={() => setQueryResult(null)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
            
            {queryResult && (
              <div className="bg-slate-900 rounded-xl p-4 max-h-[300px] overflow-auto border border-slate-800">
                <pre className="text-xs text-green-400 font-mono">
                  {JSON.stringify(queryResult, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {/* Database Diagnostics */}
          <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-blue-200 relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4 relative">
              <div className="size-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-200">
                <Database className="size-4.5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-blue-950">Database Diagnostics</h2>
                <p className="text-xs font-semibold text-blue-700">
                  {data.products.length === 0 ? (
                    <span className="text-rose-600 font-bold">⚠️ No products found!</span>
                  ) : (
                    `${data.products.length} products loaded`
                  )}
                </p>
              </div>
            </div>
            
            <div className="space-y-3 relative">
              {data.products.length === 0 ? (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl">
                  <p className="font-bold text-rose-800 text-xs">No products in database!</p>
                  <p className="text-[11px] sm:text-xs text-rose-700 mt-1 font-medium">
                    You need to import products. Click &quot;Import Products&quot; to add your catalog.
                  </p>
                </div>
              ) : null}
              
              <div className="flex flex-wrap gap-2.5">
                <button 
                  onClick={() => {
                    startTransition(() => {
                      window.location.href = '/admin/database-diagnostics';
                    });
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center transition-colors cursor-pointer"
                >
                  <Database className="size-3.5 mr-1.5" />
                  Check Database Keys
                </button>
                <button 
                  onClick={() => {
                    startTransition(() => {
                      window.location.href = '/admin/import-products';
                    });
                  }}
                  className="bg-white border border-blue-300 text-blue-700 hover:bg-blue-50 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center transition-colors cursor-pointer"
                >
                  <Package className="size-3.5 mr-1.5" />
                  Import Products
                </button>
              </div>
            </div>
          </div>

          {/* System Health Check */}
          <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-emerald-200 relative overflow-hidden flex-1">
            <div className="flex items-center gap-3 mb-3 relative">
              <div className="size-9 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-200">
                <CheckCircle2 className="size-4.5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-emerald-950">System Health Check</h2>
                <p className="text-xs font-semibold text-emerald-700">Verify all system components</p>
              </div>
            </div>
            
            <div className="space-y-3 relative">
              <p className="text-xs text-emerald-800 font-medium">
                Check edge functions, database connections, and CMS endpoints in one place.
              </p>
              <button 
                onClick={() => {
                  startTransition(() => {
                    window.location.href = '/admin/system-health-check';
                  });
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center transition-colors cursor-pointer"
              >
                <CheckCircle2 className="size-3.5 mr-1.5" />
                Run System Health Check
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Centralized Cache Management */}
      <div className="bg-white rounded-xl p-5 sm:p-7 shadow-xs border border-rose-200 mb-8 relative overflow-hidden space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="size-10 rounded-xl bg-rose-50 flex items-center justify-center border border-rose-200 shrink-0">
            <Database className="size-5 text-[#E31837]" />
          </div>
          <div>
            <h2 className="text-base sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              Centralized Cache Management
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Clear all application caches from one place. Use this after making any changes in admin (products, prices, categories, homepage sections, etc.)
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          {/* Box 1: When to Build Cache? */}
          <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-extrabold text-blue-900 flex items-center gap-2">
              <Database className="size-4 text-blue-600" />
              When to Build Cache?
            </p>
            <ul className="text-xs text-blue-800 space-y-1 ml-5 list-disc font-medium leading-relaxed">
              <li><strong>After importing products</strong> - Consolidates 13,781+ keys into fast cache</li>
              <li><strong>After updating categories</strong> - Rebuilds category hierarchy</li>
              <li><strong>First time setup</strong> - Creates optimized database cache</li>
              <li><strong>When server is slow</strong> - Eliminates loading thousands of individual keys</li>
            </ul>
            <p className="text-xs font-bold text-blue-900 pt-1">
              💡 <strong>Benefit:</strong> Customers load data from 1 query instead of 13,781!
            </p>
          </div>

          {/* Box 2: When to Clear Cache? */}
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 space-y-2">
            <p className="text-xs font-extrabold text-amber-900 flex items-center gap-2">
              <Clock className="size-4 text-amber-600" />
              When to Clear Cache?
            </p>
            <ul className="text-xs text-amber-800 space-y-1 ml-5 list-disc font-medium leading-relaxed">
              <li>After bulk price updates (Uropa sync, manual updates)</li>
              <li>After adding/editing/deleting products</li>
              <li>After changing homepage featured sections</li>
              <li>After updating categories or navigation</li>
              <li>When customers report seeing old/stale data</li>
            </ul>
            <p className="text-xs font-bold text-amber-900 pt-1">
              ⚠️ <strong>Important:</strong> Customer browsers cache data until you clear it here!
            </p>
          </div>

          {/* Box 3: Version-based Cache Banner */}
          <div className="bg-blue-50/40 border border-blue-200 rounded-xl p-3.5 space-y-1 text-xs text-blue-900 font-medium">
            <div className="font-extrabold">Cache System: Version-based (no time expiration)</div>
            <div>Current version: <span className="font-mono font-bold">1</span></div>
            <div className="text-[11px] text-blue-700">💡 Customers see cached data instantly. Clear cache here to force fresh data for all users.</div>
          </div>

          {/* Box 4: Admin Cache Age */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-700 font-medium flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <strong>Admin Cache Age:</strong> <span className="font-mono font-bold">{lastCacheCleared || '0 minutes old'}</span>
            </div>
            <div className="text-slate-400 text-[11px] font-normal">
              (This is your local cache age - customer cache is independent)
            </div>
          </div>

          {/* Row 1 Main Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <button
              onClick={handleBuildCache}
              disabled={buildCacheLoading || cacheClearing}
              className="h-10 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Database className="size-4" />
              {buildCacheLoading ? 'Building Cache...' : 'Build Cache'}
            </button>
            <button
              onClick={handleClearCache}
              disabled={cacheClearing || buildCacheLoading}
              className="h-10 bg-[#E31837] hover:bg-red-700 disabled:bg-rose-300 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <Trash2 className="size-4" />
              {cacheClearing ? 'Clearing...' : 'Clear All Caches'}
            </button>
            <button
              onClick={handleClearAndRefresh}
              disabled={cacheClearing || buildCacheLoading}
              className="h-10 bg-white border border-[#E31837] text-[#E31837] hover:bg-rose-50 disabled:opacity-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <RefreshCw className="size-4" />
              {cacheClearing ? 'Working...' : 'Clear & Reload Data'}
            </button>
          </div>

          {/* Secondary Full-Width Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleForceRebuildCache}
              disabled={cacheClearing}
              className="w-full h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-all"
            >
              ⚡ Force Rebuild Cache
            </button>

            <button
              onClick={() => {
                localStorage.removeItem('costplus100_homepage_data');
                localStorage.removeItem('costplus100_homepage_timestamp');
                localStorage.removeItem('costplus100_homepage_cache_version');
                toast.success('Homepage cache cleared! Redirecting...', { duration: 2000 });
                setTimeout(() => window.location.href = '/', 1000);
              }}
              className="w-full h-10 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-2xs transition-all"
            >
              🔄 Clear Homepage & Refresh
            </button>

            <button
              onClick={handleProductsDiagnostic}
              className="w-full h-10 bg-white border border-orange-300 text-orange-700 hover:bg-orange-50 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              🔍 Diagnose Cache Issue
            </button>
          </div>

          {/* Problem Found Helper Card */}
          <div className="bg-rose-50/60 border border-rose-200 rounded-xl p-4 space-y-2 text-xs text-rose-900">
            <p className="font-extrabold text-rose-900 flex items-center gap-1.5">
              ⚠️ PROBLEM FOUND
            </p>
            <p className="font-medium text-rose-800">
              Featured sections have old numeric IDs (1, 2, 3...) instead of product codes (AB-SA14...). This is why cache shows 0 products.
            </p>
            <div className="space-y-1 pt-1 font-medium">
              <div><strong>OPTION 1 (Quick Fix):</strong> Go to <Link to="/admin/featured-products" className="underline font-bold">Featured Products page</Link> → Click &quot;Save Changes&quot; button (even without making changes). This will overwrite old IDs with product codes.</div>
              <div><strong>OPTION 2 (Manual):</strong> Go to Featured Products → Remove all → Re-add products → Save.</div>
            </div>
          </div>

          {/* Check Cache Status Trigger */}
          <div>
            <button
              onClick={handleCheckCacheStatus}
              disabled={checkingCache}
              className="w-full h-10 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Search className="size-4" />
              {checkingCache ? 'Checking Cache Status...' : 'Check Cache Status'}
            </button>
          </div>

          {cacheStatus && (
            <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
              <h4 className="text-xs font-bold text-white flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                <Database className="size-4 text-emerald-400" />
                Live Cache Status Payload
              </h4>
              <pre className="text-[11px] text-slate-300 font-mono overflow-auto max-h-[300px]">
                {JSON.stringify(cacheStatus, null, 2)}
              </pre>
            </div>
          )}

          {/* Collapsible Technical Details Accordion */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50/50">
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="w-full p-3.5 text-left text-xs font-extrabold text-slate-800 flex items-center justify-between hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span>▶</span> Technical Details (How Cache System Works)
              </span>
              <span className="text-slate-400 font-normal text-[11px]">
                {showTechnicalDetails ? 'Hide' : 'Expand'}
              </span>
            </button>
            {showTechnicalDetails && (
              <div className="p-4 border-t border-slate-200 space-y-3 text-xs text-slate-600 font-medium bg-white">
                <p>1. <strong>Database Consolidation:</strong> Consolidates 13,781+ individual keys into cached payload blobs for instant query execution.</p>
                <p>2. <strong>Client-Side IndexedDB:</strong> Automatically caches catalog data in browser storage to reduce server latency.</p>
                <p>3. <strong>Cache Invalidation:</strong> Increments cache version timestamp so all connected users pull updated pricing instantly upon clearing.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions Links */}
      <div>
        <h2 className="text-base sm:text-lg font-black text-[#0f172a] mb-4 tracking-tight">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {quickLinks.map((link) => (
            <Link key={link.path} to={link.path} className="group block h-full">
              <div className="bg-white rounded-xl p-5 h-full shadow-xs border border-slate-200 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#E31837] hover:shadow-sm flex flex-col items-start">
                <div className={`${link.color.replace('bg-', 'bg-opacity-10 text-').replace('500', '600')} bg-slate-50 text-slate-700 size-10 rounded-xl flex items-center justify-center mb-3 transition-colors shrink-0`}>
                  <link.icon className="size-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-[#0f172a] mb-1 group-hover:text-[#E31837] transition-colors">{link.title}</h3>
                <p className="text-xs text-slate-500 font-medium leading-normal">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}