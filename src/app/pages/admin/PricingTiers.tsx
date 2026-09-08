import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Settings2, Save, RefreshCw, Calculator, Percent, AlertTriangle, Info, CheckCircle2, FlaskConical, BarChart3, Receipt } from 'lucide-react';
import { notify } from '../../utils/notifications';

interface PricingTier {
  min: number;
  max: number;
  markup: number;
  label: string;
}

interface PricingConfig {
  tiers: PricingTier[];
  minimumMargin: number;
  gstRate: number;
}

export default function PricingTiers() {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [updateStats, setUpdateStats] = useState<any>(null);
  
  // Test single product feature
  const [testProductCode, setTestProductCode] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [testLoading, setTestLoading] = useState(false);

  // Load pricing config
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);

      const url = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/pricing/config`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 5000);

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to load pricing config: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      if (!data.config) {
        throw new Error('No config in response');
      }

      setConfig(data.config);
    } catch (error: any) {
      console.error('Error loading config:', error);
      if (error.name === 'AbortError') {
        notify.error('Request timeout - API took too long to respond');
      } else {
        notify.error(error.message || 'Failed to load pricing config');
      }

      // Default fallback
      setConfig({
        tiers: [
          { min: 5000, max: Infinity, markup: 0.12, label: '$5000+' },
          { min: 2000, max: 4999.99, markup: 0.15, label: '$2000-$4999' },
          { min: 1000, max: 1999.99, markup: 0.20, label: '$1000-$1999' },
          { min: 500, max: 999.99, markup: 0.30, label: '$500-$999' },
          { min: 100, max: 499.99, markup: 0.40, label: '$100-$499' },
          { min: 50, max: 99.99, markup: 0.45, label: '$50-$99' },
          { min: 0, max: 49.99, markup: 0.50, label: 'Under $50' }
        ],
        minimumMargin: 0.15,
        gstRate: 0.10
      });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;

    try {
      setSaving(true);

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/pricing/config`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save pricing config');
      }

      notify.success('Pricing configuration saved successfully!');
    } catch (error: any) {
      console.error('Error saving config:', error);
      notify.error(error.message || 'Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  const updateAllPrices = async () => {
    if (!confirm('⚠️ This will recalculate prices for ALL products based on the current pricing tiers. Cost prices will NOT be changed. Continue?')) {
      return;
    }

    try {
      setUpdating(true);
      setUpdateStats(null);

      // Save config first
      const saveResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/pricing/config`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        }
      );

      if (!saveResponse.ok) {
        throw new Error('Failed to save pricing config before bulk update');
      }

      let offset = 0;
      let totalProducts = 0;
      let totalUpdated = 0;
      let totalUnchanged = 0;
      let totalErrors = 0;
      const startTime = Date.now();
      let consecutiveFailures = 0;
      const MAX_RETRIES = 3;

      while (true) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 60000);

          const response = await fetch(
            `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/pricing/bulk-update`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${publicAnonKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ offset, batchSize: 100 }),
              signal: controller.signal,
            }
          );

          clearTimeout(timeoutId);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const data = await response.json();

          consecutiveFailures = 0;

          totalProducts = data.total;
          totalUpdated += data.updated || 0;
          totalUnchanged += data.unchanged || 0;
          totalErrors += data.errors || 0;

          setUpdateStats({
            total: data.total,
            processed: data.processed,
            updated: totalUpdated,
            unchanged: totalUnchanged,
            errors: totalErrors,
            progress: data.progress,
            currentBatch: data.batchNumber,
            totalBatches: data.totalBatches,
            message: data.message,
          });

          if (data.completed) {
            const duration = Date.now() - startTime;
            setUpdating(false);
            notify.success(`Updated ${totalUpdated.toLocaleString()} of ${totalProducts.toLocaleString()} products in ${(duration / 1000).toFixed(1)}s!`);
            break;
          }

          offset = data.nextOffset;
          await new Promise(resolve => setTimeout(resolve, 200));

        } catch (batchError: any) {
          consecutiveFailures++;
          if (consecutiveFailures >= MAX_RETRIES) {
            throw new Error(`Failed after ${MAX_RETRIES} consecutive attempts: ${batchError.message}`);
          }
          const retryDelay = Math.min(1000 * Math.pow(2, consecutiveFailures), 5000);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
      }

    } catch (error: any) {
      console.error('Fatal error in bulk update:', error);
      notify.error(`Bulk update failed: ${error.message}`);
      setUpdating(false);
    }
  };

  const testSingleProduct = async () => {
    if (!testProductCode.trim()) {
      notify.error('Please enter a product code');
      return;
    }

    try {
      setTestLoading(true);
      setTestResult(null);

      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/pricing/config`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        }
      );

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/pricing/test-single`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productCode: testProductCode.trim() }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to test product');
      }

      const data = await response.json();
      setTestResult(data);
      notify.success('Single product test completed');
    } catch (error: any) {
      console.error('Error testing product:', error);
      notify.error(error.message || 'Failed to test product');
    } finally {
      setTestLoading(false);
    }
  };

  const updateTier = (index: number, field: keyof PricingTier, value: any) => {
    if (!config) return;
    
    const newTiers = [...config.tiers];
    newTiers[index] = {
      ...newTiers[index],
      [field]: field === 'markup' ? parseFloat(value) : (field === 'label' ? value : parseFloat(value))
    };
    
    setConfig({ ...config, tiers: newTiers });
  };

  const calculateExample = (cost: number) => {
    if (!config) return { selling: 0, markup: 0, margin: 0, tier: '' };

    let markupPercent = 0.12;
    let tierLabel = '';
    
    for (const tier of config.tiers) {
      if (cost >= tier.min && cost < tier.max) {
        markupPercent = tier.markup;
        tierLabel = tier.label;
        break;
      }
    }

    const sellingPrice = cost * (1 + markupPercent);
    const minPrice = cost * (1 + config.minimumMargin);
    const finalPrice = Math.max(sellingPrice, minPrice);
    
    const dollarMarkup = finalPrice - cost;
    const marginPercent = (dollarMarkup / finalPrice) * 100;

    return {
      selling: finalPrice.toFixed(2),
      markup: (markupPercent * 100).toFixed(0),
      margin: marginPercent.toFixed(2),
      tier: tierLabel
    };
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 flex flex-col items-center justify-center gap-3 font-sans">
        <RefreshCw className="size-8 animate-spin text-[#E31837]" />
        <p className="text-xs font-bold text-slate-500">Loading pricing configuration...</p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="max-w-7xl mx-auto py-16 font-sans">
        <Card className="border-red-200 bg-red-50 text-center p-6">
          <AlertTriangle className="size-10 text-red-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-red-800">Failed to load pricing configuration</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Settings2 className="size-6 text-[#E31837]" />
            Tiered Wholesale Pricing Matrix
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage cost range markups, minimum profit margin floors, and bulk price recalculation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={saveConfig}
            disabled={saving}
            className="h-10 px-4 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold transition-all shadow-2xs flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <><RefreshCw className="size-4 animate-spin" />Saving...</>
            ) : (
              <><Save className="size-4" />Save Matrix</>
            )}
          </button>

          <button
            onClick={updateAllPrices}
            disabled={updating}
            className="h-10 px-4 bg-[#E31837] hover:bg-[#c4122c] text-white rounded-xl font-bold transition-all shadow-2xs flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
          >
            {updating ? (
              <><RefreshCw className="size-4 animate-spin" />Recalculating...</>
            ) : (
              <><RefreshCw className="size-4" />Recalculate All Prices</>
            )}
          </button>
        </div>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Wholesale Tiering:</strong> Higher cost products receive tighter markups, while lower cost accessories utilize higher markup margins. Cost prices are never altered.
        </div>
      </div>

      {/* Top Grid: Formula & Margin */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Formula Display */}
        <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
              <Calculator className="size-5 text-[#E31837]" />
              Pricing Calculation Formula
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 flex flex-col justify-center">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono font-bold text-sm sm:text-base text-[#0f172a] text-center tracking-tight">
              Selling Price = Cost × (1 + Tier Markup%)
            </div>
            <p className="text-[11px] font-medium text-slate-400 text-center mt-2">
              Applies GST & minimum profit margin floors automatically
            </p>
          </CardContent>
        </Card>

        {/* Minimum Margin Setting */}
        <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
              <Percent className="size-5 text-amber-600" />
              Minimum Margin Floor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={config.minimumMargin}
                onChange={(e) => setConfig({ ...config, minimumMargin: parseFloat(e.target.value) || 0 })}
                className="w-24 h-9 px-3 border border-slate-200 rounded-xl font-mono text-center font-bold text-xs text-[#0f172a] focus:border-[#E31837] focus:ring-[#E31837] outline-none"
                step="0.01"
                min="0"
                max="1"
              />
              <span className="text-xs font-black text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200">
                {(config.minimumMargin * 100).toFixed(0)}% Profit Margin Floor
              </span>
            </div>
            
            {config.minimumMargin === 0 && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs font-bold text-red-700 flex items-center gap-2">
                <AlertTriangle className="size-4 shrink-0 text-red-500" />
                Warning: Minimum margin disabled. Products may yield sub-optimal profit margins.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pricing Tiers Table */}
      <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
        <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
            <BarChart3 className="size-5 text-[#E31837]" />
            Markup Tiers Matrix
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-semibold">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-extrabold tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Cost Range Label</th>
                  <th className="px-4 py-3 text-left">Min Cost ($)</th>
                  <th className="px-4 py-3 text-left">Max Cost ($)</th>
                  <th className="px-4 py-3 text-left">Markup (%)</th>
                  <th className="px-4 py-3 text-left">Calculation Example</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {config.tiers.map((tier, index) => {
                  const exampleCost = tier.min + (tier.max === Infinity ? 500 : (tier.max - tier.min) / 2);
                  const example = calculateExample(exampleCost);
                  
                  return (
                    <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2.5">
                        <input
                          type="text"
                          value={tier.label}
                          onChange={(e) => updateTier(index, 'label', e.target.value)}
                          className="w-full h-8 px-2.5 text-xs font-bold border border-slate-200 rounded-lg focus:border-[#E31837] outline-none"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="relative w-24">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                          <input
                            type="number"
                            value={tier.min}
                            onChange={(e) => updateTier(index, 'min', e.target.value)}
                            className="w-full h-8 pl-6 pr-2 text-xs font-mono border border-slate-200 rounded-lg focus:border-[#E31837] outline-none"
                            step="0.01"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        {tier.max === Infinity ? (
                          <div className="h-8 flex items-center px-3 text-slate-400 font-extrabold bg-slate-50 border border-slate-200/60 rounded-lg w-24 justify-center">∞</div>
                        ) : (
                          <div className="relative w-24">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                            <input
                              type="number"
                              value={tier.max || ''}
                              onChange={(e) => updateTier(index, 'max', e.target.value)}
                              className="w-full h-8 pl-6 pr-2 text-xs font-mono border border-slate-200 rounded-lg focus:border-[#E31837] outline-none"
                              step="0.01"
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={tier.markup}
                            onChange={(e) => updateTier(index, 'markup', e.target.value)}
                            className="w-20 h-8 px-2.5 text-xs font-mono border border-slate-200 rounded-lg focus:border-[#E31837] outline-none"
                            step="0.01"
                            min="0"
                            max="1"
                          />
                          <span className="text-[11px] font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            {(tier.markup * 100).toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-[#0f172a]">
                            <span className="text-slate-400 font-medium">${exampleCost.toFixed(2)}</span> → ${example.selling}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {example.markup}% markup • {example.margin}% margin
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        
        {/* Test Single Product */}
        <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
              <FlaskConical className="size-5 text-[#E31837]" />
              Test Price Calculation
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 w-full">
                <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Product Code</label>
                <input
                  type="text"
                  value={testProductCode}
                  onChange={(e) => setTestProductCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      testSingleProduct();
                    }
                  }}
                  placeholder="e.g., CD085-A"
                  className="w-full h-9 px-3 text-xs font-semibold border border-slate-200 rounded-xl focus:border-[#E31837] outline-none"
                />
              </div>
              <button
                onClick={testSingleProduct}
                disabled={testLoading || !testProductCode.trim()}
                className="h-9 px-5 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold text-xs shadow-2xs shrink-0 cursor-pointer disabled:opacity-50 transition-all w-full sm:w-auto"
              >
                {testLoading ? 'Testing...' : 'Test Product'}
              </button>
            </div>

            {testResult && (
              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-3">
                <h3 className={`text-xs font-extrabold flex items-center gap-1.5 ${
                  testResult.success ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  {testResult.success ? <CheckCircle2 className="size-4" /> : <AlertTriangle className="size-4" />}
                  {testResult.success ? 'Test Calculation Successful' : 'Test Failed'}
                </h3>
                
                {testResult.success && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Cost Price</div>
                      <div className="text-sm font-black text-[#0f172a]">${testResult.before.costPrice}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Old Price</div>
                      <div className="text-sm font-black text-slate-400 line-through">${testResult.before.sellingPrice}</div>
                    </div>
                    <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <div className="text-[10px] font-extrabold uppercase text-emerald-700">New Price</div>
                      <div className="text-sm font-black text-emerald-700">${testResult.after.sellingPrice}</div>
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <div className="text-[10px] font-extrabold uppercase text-slate-400">Tier</div>
                      <div className="text-sm font-black text-blue-700 truncate">{testResult.after.tierLabel}</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pricing Examples */}
        <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
              <Receipt className="size-5 text-[#E31837]" />
              Live Pricing Examples
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 gap-3">
              {[35, 150, 750, 3200].map((cost) => {
                const result = calculateExample(cost);
                return (
                  <div key={cost} className="bg-slate-50 rounded-xl p-3 border border-slate-200/80">
                    <div className="text-[10px] font-extrabold uppercase text-slate-400">Cost: ${cost.toFixed(2)}</div>
                    <div className="text-xs font-black text-[#E31837] mt-0.5">{result.tier}</div>
                    <div className="text-lg font-black text-[#0f172a] tracking-tight mt-1">
                      ${result.selling}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500 mt-0.5">
                      {result.markup}% markup • {result.margin}% margin
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Update Stats */}
      {updateStats && (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-5 shadow-xs space-y-3">
          <h3 className="text-sm font-black text-emerald-900 flex items-center gap-2">
            {updating ? (
              <><RefreshCw className="size-4 animate-spin text-emerald-600" /> Processing Bulk Recalculation...</>
            ) : (
              <><CheckCircle2 className="size-4 text-emerald-600" /> Bulk Recalculation Complete</>
            )}
          </h3>
          
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-extrabold text-center">
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
              <div className="text-lg font-black text-emerald-900">{(updateStats.total || 0).toLocaleString()}</div>
              <div className="text-[10px] uppercase text-emerald-700">Total Products</div>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
              <div className="text-lg font-black text-blue-900">{(updateStats.processed || 0).toLocaleString()}</div>
              <div className="text-[10px] uppercase text-blue-700">Processed</div>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
              <div className="text-lg font-black text-emerald-600">{(updateStats.updated || 0).toLocaleString()}</div>
              <div className="text-[10px] uppercase text-emerald-600">Updated</div>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
              <div className="text-lg font-black text-slate-600">{(updateStats.unchanged || 0).toLocaleString()}</div>
              <div className="text-[10px] uppercase text-slate-500">Unchanged</div>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200">
              <div className="text-lg font-black text-red-600">{(updateStats.errors || 0).toLocaleString()}</div>
              <div className="text-[10px] uppercase text-red-600">Errors</div>
            </div>
          </div>
          
          {updating && (
            <div className="space-y-1.5 pt-1">
              <div className="w-full bg-emerald-200/50 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-emerald-600 h-full transition-all duration-300 flex items-center justify-center text-[9px] text-white font-bold"
                  style={{ width: `${updateStats.progress || 0}%` }}
                >
                  {updateStats.progress || 0}%
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}