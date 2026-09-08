import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Save, RefreshCw, AlertTriangle, CheckCircle2, DollarSign, Settings2, Percent, Calculator, Info, RotateCcw } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { notify } from '../../utils/notifications';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface ProfitMargins {
  under50: number;      // Default 50%
  '50to100': number;    // Default 40%
  '100to500': number;   // Default 30%
  '500to1000': number;  // Default 20%
  '1000to5000': number; // Default 15%
  over5000: number;     // Default 12%
}

const DEFAULT_MARGINS: ProfitMargins = {
  under50: 50,
  '50to100': 40,
  '100to500': 30,
  '500to1000': 20,
  '1000to5000': 15,
  over5000: 12
};

export default function ProfitMarginSettings() {
  const [margins, setMargins] = useState<ProfitMargins>(DEFAULT_MARGINS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadMargins();
  }, []);

  const loadMargins = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/settings/profit-margins`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.margins) {
          setMargins(data.margins);
        }
      }
    } catch (error) {
      console.error('Failed to load profit margins:', error);
      notify.error('Failed to load margin settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/settings/profit-margins`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ margins })
      });

      if (response.ok) {
        notify.success('Profit margins saved successfully!');
      } else {
        throw new Error('Failed to save');
      }
    } catch (error) {
      console.error('Failed to save profit margins:', error);
      notify.error('Failed to save margin settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setMargins(DEFAULT_MARGINS);
    notify.info('Reset to default margin values');
  };

  const updateMargin = (key: keyof ProfitMargins, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 1000) {
      setMargins(prev => ({ ...prev, [key]: numValue }));
    }
  };

  const calculateRetailPrice = (costPrice: number, marginPercent: number) => {
    return (costPrice * (1 + marginPercent / 100)).toFixed(2);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 flex flex-col items-center justify-center gap-3 font-sans">
        <RefreshCw className="size-8 animate-spin text-[#E31837]" />
        <p className="text-xs font-bold text-slate-500">Loading profit margins...</p>
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
            Automated Profit Margin Rules
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Configure tier-based profit margins applied automatically during product import and supplier price syncing
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleReset} 
            disabled={saving}
            className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all border border-slate-200 flex items-center justify-center gap-1.5 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
          >
            <RotateCcw className="size-4 text-slate-500" />
            Reset Defaults
          </button>
          
          <button 
            onClick={handleSave} 
            disabled={saving}
            className="h-10 px-5 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold transition-all shadow-2xs flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <><RefreshCw className="size-4 animate-spin" />Saving...</>
            ) : (
              <><Save className="size-4" />Save Margins</>
            )}
          </button>
        </div>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Automatic Margin Calculation:</strong> When new supplier feeds or CSV catalogs are imported, retail prices are derived directly from these profit margin percentages.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Calculator className="size-5 text-[#E31837]" />
                Price Tier Margins
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                
                {/* Under $50 */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1">
                    <Label htmlFor="under50" className="text-xs font-extrabold text-[#0f172a] mb-1 block">Under $50</Label>
                    <p className="text-[11px] font-semibold text-slate-500">Example: $30 cost → <span className="font-bold text-emerald-700">${calculateRetailPrice(30, margins.under50)} retail</span></p>
                  </div>
                  <div className="relative shrink-0 w-32">
                    <Input
                      id="under50"
                      type="number"
                      min="0"
                      max="1000"
                      step="0.1"
                      value={margins.under50}
                      onChange={(e) => updateMargin('under50', e.target.value)}
                      className="h-9 pr-8 text-right font-mono font-bold text-xs border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    />
                    <Percent className="size-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* $50 - $100 */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1">
                    <Label htmlFor="50to100" className="text-xs font-extrabold text-[#0f172a] mb-1 block">$50 - $100</Label>
                    <p className="text-[11px] font-semibold text-slate-500">Example: $75 cost → <span className="font-bold text-emerald-700">${calculateRetailPrice(75, margins['50to100'])} retail</span></p>
                  </div>
                  <div className="relative shrink-0 w-32">
                    <Input
                      id="50to100"
                      type="number"
                      min="0"
                      max="1000"
                      step="0.1"
                      value={margins['50to100']}
                      onChange={(e) => updateMargin('50to100', e.target.value)}
                      className="h-9 pr-8 text-right font-mono font-bold text-xs border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    />
                    <Percent className="size-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* $100 - $500 */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1">
                    <Label htmlFor="100to500" className="text-xs font-extrabold text-[#0f172a] mb-1 block">$100 - $500</Label>
                    <p className="text-[11px] font-semibold text-slate-500">Example: $250 cost → <span className="font-bold text-emerald-700">${calculateRetailPrice(250, margins['100to500'])} retail</span></p>
                  </div>
                  <div className="relative shrink-0 w-32">
                    <Input
                      id="100to500"
                      type="number"
                      min="0"
                      max="1000"
                      step="0.1"
                      value={margins['100to500']}
                      onChange={(e) => updateMargin('100to500', e.target.value)}
                      className="h-9 pr-8 text-right font-mono font-bold text-xs border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    />
                    <Percent className="size-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* $500 - $1000 */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1">
                    <Label htmlFor="500to1000" className="text-xs font-extrabold text-[#0f172a] mb-1 block">$500 - $1,000</Label>
                    <p className="text-[11px] font-semibold text-slate-500">Example: $750 cost → <span className="font-bold text-emerald-700">${calculateRetailPrice(750, margins['500to1000'])} retail</span></p>
                  </div>
                  <div className="relative shrink-0 w-32">
                    <Input
                      id="500to1000"
                      type="number"
                      min="0"
                      max="1000"
                      step="0.1"
                      value={margins['500to1000']}
                      onChange={(e) => updateMargin('500to1000', e.target.value)}
                      className="h-9 pr-8 text-right font-mono font-bold text-xs border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    />
                    <Percent className="size-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* $1000 - $5000 */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1">
                    <Label htmlFor="1000to5000" className="text-xs font-extrabold text-[#0f172a] mb-1 block">$1,000 - $5,000</Label>
                    <p className="text-[11px] font-semibold text-slate-500">Example: $2,000 cost → <span className="font-bold text-emerald-700">${calculateRetailPrice(2000, margins['1000to5000'])} retail</span></p>
                  </div>
                  <div className="relative shrink-0 w-32">
                    <Input
                      id="1000to5000"
                      type="number"
                      min="0"
                      max="1000"
                      step="0.1"
                      value={margins['1000to5000']}
                      onChange={(e) => updateMargin('1000to5000', e.target.value)}
                      className="h-9 pr-8 text-right font-mono font-bold text-xs border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    />
                    <Percent className="size-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {/* Over $5000 */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex-1">
                    <Label htmlFor="over5000" className="text-xs font-extrabold text-[#0f172a] mb-1 block">Over $5,000</Label>
                    <p className="text-[11px] font-semibold text-slate-500">Example: $7,500 cost → <span className="font-bold text-emerald-700">${calculateRetailPrice(7500, margins.over5000)} retail</span></p>
                  </div>
                  <div className="relative shrink-0 w-32">
                    <Input
                      id="over5000"
                      type="number"
                      min="0"
                      max="1000"
                      step="0.1"
                      value={margins.over5000}
                      onChange={(e) => updateMargin('over5000', e.target.value)}
                      className="h-9 pr-8 text-right font-mono font-bold text-xs border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    />
                    <Percent className="size-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Current Margins Grid Summary */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <DollarSign className="size-5 text-emerald-600" />
                Active Margin Grid Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 mb-0.5">Under $50</p>
                  <p className="text-xl font-black text-[#0f172a]">{margins.under50}%</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 mb-0.5">$50 - $100</p>
                  <p className="text-xl font-black text-[#0f172a]">{margins['50to100']}%</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 mb-0.5">$100 - $500</p>
                  <p className="text-xl font-black text-[#0f172a]">{margins['100to500']}%</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 mb-0.5">$500 - $1K</p>
                  <p className="text-xl font-black text-[#0f172a]">{margins['500to1000']}%</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 mb-0.5">$1K - $5K</p>
                  <p className="text-xl font-black text-[#0f172a]">{margins['1000to5000']}%</p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                  <p className="text-[10px] font-extrabold uppercase text-slate-400 mb-0.5">Over $5K</p>
                  <p className="text-xl font-black text-[#0f172a]">{margins.over5000}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
