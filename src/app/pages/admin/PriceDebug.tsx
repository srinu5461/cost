import { useState } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Search, RefreshCw, Bug, Info, Clock, Code } from 'lucide-react';
import { notify } from '../../utils/notifications';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

export default function PriceDebug() {
  const [productCode, setProductCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const lookupProduct = async () => {
    if (!productCode.trim()) {
      notify.error('Please enter a product code');
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const response = await fetch(
        `${API_URL}/debug/product/${encodeURIComponent(productCode.trim())}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to lookup product');
      }

      setResult(data);
      notify.success(`Product ${data.product?.code} loaded successfully`);
    } catch (err: any) {
      console.error('Error:', err);
      notify.error(err.message || 'Product lookup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Bug className="size-6 text-[#E31837]" />
            Database Price Diagnostic Tool
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Inspect raw database values, pricing fields, and update timestamps for any product code
          </p>
        </div>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Pricing Engine Diagnostic:</strong> View stored database prices (`price`, `baseCost`, `tradePrice`, `sellingPrice`) to verify tier calculation consistency.
        </div>
      </div>

      {/* Search Input Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Product Code
            </label>
            <input
              type="text"
              value={productCode}
              onChange={(e) => setProductCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  lookupProduct();
                }
              }}
              placeholder="Enter product code (e.g., CD085-A)"
              className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E31837]/20"
            />
          </div>
          <button
            onClick={lookupProduct}
            disabled={loading || !productCode.trim()}
            className="h-10 px-6 bg-[#E31837] hover:bg-[#E31837]/90 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="size-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="size-4" />
                Lookup Product
              </>
            )}
          </button>
        </div>
      </div>

      {/* Diagnostic Results */}
      {result && result.success && (
        <div className="space-y-5">
          {/* Product Overview Card */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              Product Overview
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div className="text-slate-500 font-semibold text-[10px] uppercase">Code</div>
                <div className="text-base font-black text-slate-900 font-mono mt-0.5">{result.product.code}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div className="text-slate-500 font-semibold text-[10px] uppercase">Name</div>
                <div className="text-xs font-bold text-slate-800 truncate mt-0.5">{result.product.name || 'N/A'}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div className="text-slate-500 font-semibold text-[10px] uppercase">Brand</div>
                <div className="text-xs font-bold text-slate-800 truncate mt-0.5">{result.product.brand || 'N/A'}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                <div className="text-slate-500 font-semibold text-[10px] uppercase">Database ID</div>
                <div className="text-[11px] font-mono text-slate-600 truncate mt-0.5">{result.product.id}</div>
              </div>
            </div>
          </div>

          {/* Pricing Grid Card */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
              💰 Pricing Attributes (Stored in Database)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
                <div className="text-xs font-bold text-emerald-800 font-mono">product.price</div>
                <div className="text-2xl font-black text-emerald-900 mt-1">
                  ${result.pricing.price?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-[10px] font-bold text-emerald-700 mt-1.5 flex items-center gap-1">
                  <span>←</span> Storefront displays this field
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="text-xs font-bold text-blue-800 font-mono">product.sellingPrice</div>
                <div className="text-2xl font-black text-blue-900 mt-1">
                  ${result.pricing.sellingPrice?.toFixed(2) || 'N/A'}
                </div>
              </div>

              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                <div className="text-xs font-bold text-purple-800 font-mono">product.sellPrice</div>
                <div className="text-2xl font-black text-purple-900 mt-1">
                  ${result.pricing.sellPrice?.toFixed(2) || 'N/A'}
                </div>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200">
                <div className="text-xs font-bold text-amber-800 font-mono">product.baseCost</div>
                <div className="text-2xl font-black text-amber-900 mt-1">
                  ${result.pricing.baseCost?.toFixed(2) || 'N/A'}
                </div>
                <div className="text-[10px] font-bold text-amber-700 mt-1.5">Supplier Cost Price</div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-xs font-bold text-slate-700 font-mono">product.costPrice</div>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  ${result.pricing.costPrice?.toFixed(2) || 'N/A'}
                </div>
              </div>

              <div className="bg-pink-50 p-4 rounded-xl border border-pink-200">
                <div className="text-xs font-bold text-pink-800 font-mono">product.tradePrice</div>
                <div className="text-2xl font-black text-pink-900 mt-1">
                  ${result.pricing.tradePrice?.toFixed(2) || 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Update Timestamps Card */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6 space-y-4">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <Clock className="size-4 text-slate-600" />
              Update Timestamps
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="font-bold text-slate-600 text-[10px] uppercase">lastBulkUpdate</div>
                <div className="font-semibold text-slate-900 mt-1">
                  {result.timestamps.lastBulkUpdate || 'Not set'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="font-bold text-slate-600 text-[10px] uppercase">lastPriceUpdate</div>
                <div className="font-semibold text-slate-900 mt-1">
                  {result.timestamps.lastPriceUpdate || 'Not set'}
                </div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="font-bold text-slate-600 text-[10px] uppercase">lastManualUpdate</div>
                <div className="font-semibold text-slate-900 mt-1">
                  {result.timestamps.lastManualUpdate || 'Not set'}
                </div>
              </div>
            </div>
            
            {(result.timestamps.lastBulkUpdate || result.timestamps.lastPriceUpdate) && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800">
                ✅ Product has sync timestamps recorded. Storefront will consume <strong>product.price</strong> directly without dynamic fallback logic.
              </div>
            )}
          </div>

          {/* Raw JSON Code Viewer Card */}
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6 space-y-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-2">
              <Code className="size-4 text-slate-600" />
              Raw Database Record
            </h2>
            <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl overflow-auto text-[11px] font-mono max-h-96 border border-slate-800 shadow-inner">
              {JSON.stringify(result.product, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
