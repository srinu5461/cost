import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { RefreshCw, Activity, Layers, Database, Package, Info, CheckCircle2, Zap, Trash2 } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { notify } from '../../utils/notifications';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

export default function Diagnostics() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [homepageData, setHomepageData] = useState<any>(null);
  const [featuredSections, setFeaturedSections] = useState<any>(null);
  const [refreshingCache, setRefreshingCache] = useState(false);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const cmsResponse = await fetch(`${API_URL}/cms/data`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!cmsResponse.ok) {
        throw new Error(`CMS fetch failed: ${cmsResponse.status} ${cmsResponse.statusText}`);
      }

      const cms = await cmsResponse.json();

      const featuredResponse = await fetch(`${API_URL}/featured-sections`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      const featuredData = await featuredResponse.json();
      setFeaturedSections(featuredData);

      const homepageResponse = await fetch(`${API_URL}/homepage-data`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      const homepage = await homepageResponse.json();
      const cacheStatus = homepageResponse.headers.get('X-Cache');
      const cacheAge = homepageResponse.headers.get('X-Cache-Age');
      setHomepageData({
        ...homepage,
        cacheStatus,
        cacheAge: cacheAge ? parseInt(cacheAge) : null,
      });

      const products = cms.products || [];
      const tree = cms.categoryTree || [];

      const levels = {
        1: tree.filter((n: any) => n.level === 1).length,
        2: tree.filter((n: any) => n.level === 2).length,
        3: tree.filter((n: any) => n.level === 3).length,
        4: tree.filter((n: any) => n.level === 4).length,
      };

      const samples = {
        level1: tree.filter((n: any) => n.level === 1).slice(0, 3),
        level2: tree.filter((n: any) => n.level === 2).slice(0, 3),
        level3: tree.filter((n: any) => n.level === 3).slice(0, 3),
        level4: tree.filter((n: any) => n.level === 4).slice(0, 3),
      };

      setData({
        tree,
        products,
        cms,
        levels,
        samples,
        totalCategories: tree.length,
        totalProducts: products.length,
      });
    } catch (error: any) {
      console.error('Diagnostics error:', error);
      notify.error(error.message || 'Error fetching diagnostics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  const refreshCache = async () => {
    setRefreshingCache(true);
    try {
      const response = await fetch(`${API_URL}/homepage-data/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'X-API-Key': publicAnonKey,
        },
      });
      if (!response.ok) {
        throw new Error(`Cache refresh failed: ${response.status} ${response.statusText}`);
      }
      notify.success('Homepage cache refreshed successfully! Product listings updated.');
      setTimeout(() => fetchDiagnostics(), 1000);
    } catch (error: any) {
      console.error('Cache refresh error:', error);
      notify.error(error.message || 'Error refreshing cache');
    } finally {
      setRefreshingCache(false);
    }
  };

  const clearCMSCache = async () => {
    setRefreshingCache(true);
    try {
      const response = await fetch(`${API_URL}/cms/clear-cache`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Cache clear failed: ${response.status} ${response.statusText}`);
      }

      const freshResponse = await fetch(`${API_URL}/cms/data?force=true`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (!freshResponse.ok) {
        throw new Error(`Fresh data fetch failed: ${freshResponse.status}`);
      }
      const freshData = await freshResponse.json();

      notify.success(`CMS cache cleared! Fresh data: ${freshData.products?.length || 0} products, ${freshData.categories?.length || 0} categories.`);
      setTimeout(() => fetchDiagnostics(), 500);
    } catch (error: any) {
      console.error('Cache clear error:', error);
      notify.error(error.message || 'Error clearing cache');
    } finally {
      setRefreshingCache(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Activity className="size-6 text-[#E31837]" />
            Database & System Diagnostics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Inspect category hierarchy distribution, homepage cache age, and backend health
          </p>
        </div>
        <button
          onClick={fetchDiagnostics}
          disabled={loading}
          className="h-10 px-5 bg-[#E31837] hover:bg-[#E31837]/90 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center gap-2 shrink-0 cursor-pointer transition-all disabled:opacity-50"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Diagnostics
        </button>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>System Health Status:</strong> View category tree nesting depth, active product counts, and cache invalidation controls.
        </div>
      </div>

      {data && (
        <div className="space-y-5">
          {/* Overview & Distribution Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Category Summary */}
            <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Database className="size-4 text-blue-600" />
                  Database Catalog Totals
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <span className="text-blue-700 font-bold block text-[10px] uppercase">Total Categories</span>
                    <span className="text-3xl font-black text-blue-900 mt-1 block">{data.totalCategories}</span>
                  </div>
                  <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                    <span className="text-emerald-700 font-bold block text-[10px] uppercase">Total Products</span>
                    <span className="text-3xl font-black text-emerald-900 mt-1 block">{data.totalProducts}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Level Distribution */}
            <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="size-4 text-purple-600" />
                  Category Depth Hierarchy
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <span className="text-slate-500 font-semibold block text-[10px]">Level 1</span>
                    <span className="text-xl font-black text-blue-600 mt-0.5 block">{data.levels[1]}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <span className="text-slate-500 font-semibold block text-[10px]">Level 2</span>
                    <span className="text-xl font-black text-emerald-600 mt-0.5 block">{data.levels[2]}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <span className="text-slate-500 font-semibold block text-[10px]">Level 3</span>
                    <span className="text-xl font-black text-amber-600 mt-0.5 block">{data.levels[3]}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    <span className="text-slate-500 font-semibold block text-[10px]">Level 4</span>
                    <span className="text-xl font-black text-rose-600 mt-0.5 block">{data.levels[4]}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Category Level Samples */}
          {[1, 2, 3, 4].map((level) => (
            <Card key={level} className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Level {level} Category Samples
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 font-medium">
                  First 3 category nodes at hierarchy level {level}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {data.samples[`level${level}`]?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    {data.samples[`level${level}`].map((cat: any, idx: number) => (
                      <div key={idx} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-1.5">
                        <div className="font-bold text-slate-900 text-sm truncate">{cat.name}</div>
                        <div className="font-mono text-slate-500 text-[11px]">{cat.code}</div>
                        <div className="text-[10px] text-slate-600 truncate"><strong>Path:</strong> {cat.path}</div>
                        <div className="text-[10px] text-slate-600 truncate"><strong>Parent:</strong> {cat.parent || 'Root'}</div>
                        <div className="text-[10px] text-slate-600 truncate"><strong>Full Path:</strong> {cat.fullPath}</div>
                        <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-200/60 text-slate-700">
                          <span>Products: <strong>{cat.productCount}</strong></span>
                          <span>Children: <strong>{cat.hasChildren ? 'Yes' : 'No'}</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-semibold italic">No categories defined at this level</p>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Homepage Cache Status */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Zap className="size-4 text-amber-500" />
                Homepage Cache Status & Controls
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="text-slate-500 font-bold text-[10px] uppercase">Cache Status</div>
                  <div className={`text-2xl font-black mt-0.5 ${
                    homepageData?.cacheStatus === 'HIT' ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {homepageData?.cacheStatus || 'MISS'}
                  </div>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <div className="text-slate-500 font-bold text-[10px] uppercase">Cache Age (Seconds)</div>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">
                    {homepageData?.cacheAge ?? '0'}s
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={refreshCache}
                  disabled={refreshingCache}
                  className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <RefreshCw className={`size-4 ${refreshingCache ? 'animate-spin' : ''}`} />
                  Refresh Homepage Cache
                </button>

                <button
                  onClick={clearCMSCache}
                  disabled={refreshingCache}
                  className="flex-1 h-10 bg-[#E31837] hover:bg-[#E31837]/90 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  <Trash2 className="size-4" />
                  Clear CMS Cache & Reload
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Raw Category Tree JSON */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Package className="size-4 text-slate-600" />
                Raw Category Tree Payload (First 10 Nodes)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl overflow-auto text-[11px] font-mono max-h-96 border border-slate-800 shadow-inner">
                {JSON.stringify(data.tree.slice(0, 10), null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}