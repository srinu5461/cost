import { useCMS } from '../../context/CMSContext';
import { useAdmin } from '../../context/AdminContext';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { AlertTriangle, Database, User, Mail, Power, PowerOff, DollarSign, Settings as SettingsIcon, ShieldAlert, Monitor, Info, LogOut, CheckCircle2, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { notify } from '../../utils/notifications';

export function Settings() {
  // ✅ Safe access to CMS context with fallback
  let data, initializeData;
  try {
    const cms = useCMS();
    data = cms.data;
    initializeData = cms.initializeData;
  } catch (e) {
    console.error('Settings: CMSProvider not available, using empty data');
    data = {
      products: [],
      categories: [],
      categoryTree: [],
      header: { logo: '', phone: '', workingHours: '', navigation: [] },
      footer: { about: '', email: '', phone: '', address: '', socialMedia: {} },
      homepage: { hero: { title: '', subtitle: '', image: '' }, features: [] },
    };
    initializeData = async () => {};
  }
  
  const { logout, user } = useAdmin();
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('We are currently performing scheduled maintenance. Please check back soon!');
  const [loading, setLoading] = useState(false);
  const [loadingFetch, setLoadingFetch] = useState(true);

  // Cost+$100 Universal Pricing toggle
  const [costPlusUniversalEnabled, setCostPlusUniversalEnabled] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('costplus100_universal_pricing_enabled');
    if (saved === 'false') {
      setCostPlusUniversalEnabled(false);
    }
  }, []);

  const toggleCostPlusUniversal = () => {
    const newValue = !costPlusUniversalEnabled;
    localStorage.setItem('costplus100_universal_pricing_enabled', newValue ? 'true' : 'false');
    setCostPlusUniversalEnabled(newValue);
    notify.success(`Cost+$100 pricing policy set to ${newValue ? 'Universal' : 'VIP Only'}`);
  };

  // Fetch current maintenance mode status
  useEffect(() => {
    fetchMaintenanceMode();
  }, []);

  const fetchMaintenanceMode = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/maintenance`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setMaintenanceMode(data.enabled || false);
        setMaintenanceMessage(data.message || 'We are currently performing scheduled maintenance. Please check back soon!');
      }
    } catch (error) {
      console.error('Failed to fetch maintenance mode:', error);
    } finally {
      setLoadingFetch(false);
    }
  };

  const toggleMaintenanceMode = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/maintenance`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
            'X-API-Key': publicAnonKey,
          },
          body: JSON.stringify({
            enabled: !maintenanceMode,
            message: maintenanceMessage,
          }),
        }
      );

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `Server returned ${response.status}`);
      }

      setMaintenanceMode(!maintenanceMode);
      notify.success(`Maintenance mode ${!maintenanceMode ? 'enabled' : 'disabled'} successfully!`);
    } catch (error) {
      console.error('Failed to update maintenance mode:', error);
      notify.error(`Failed to update maintenance mode: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReinitialize = async () => {
    if (confirm('Are you sure you want to reinitialize the database with default data? This will overwrite existing content.')) {
      try {
        await initializeData();
        notify.success('Database reinitialized successfully!');
        window.location.reload();
      } catch (error) {
        notify.error('Failed to reinitialize database');
        console.error(error);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <SettingsIcon className="size-6 text-[#E31837]" />
            Global System Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Configure site maintenance states, universal pricing rules, admin credentials, and database engines
          </p>
        </div>

        <button
          onClick={logout}
          className="h-10 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all border border-slate-200 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer shrink-0"
        >
          <LogOut className="size-4 text-slate-500" />
          Logout Admin Session
        </button>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>System Control:</strong> System settings apply instantly across the storefront, pricing engine, and API endpoints.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Maintenance Mode */}
          <Card className={`bg-white rounded-xl shadow-xs border overflow-hidden transition-all ${
            maintenanceMode ? 'border-amber-300 ring-1 ring-amber-300' : 'border-slate-200'
          }`}>
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                {maintenanceMode ? (
                  <PowerOff className="size-5 text-amber-600 animate-pulse" />
                ) : (
                  <Power className="size-5 text-[#E31837]" />
                )}
                Storefront Maintenance Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              {loadingFetch ? (
                <div className="flex justify-center py-6">
                  <RefreshCw className="size-6 animate-spin text-[#E31837]" />
                </div>
              ) : (
                <>
                  <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                    maintenanceMode ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200/80'
                  }`}>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Status</p>
                      <p className={`text-xs font-black flex items-center gap-1.5 ${
                        maintenanceMode ? 'text-amber-700' : 'text-emerald-700'
                      }`}>
                        {maintenanceMode ? (
                          <><div className="size-2 rounded-full bg-amber-500 animate-pulse" /> Maintenance Active</>
                        ) : (
                          <><div className="size-2 rounded-full bg-emerald-500" /> Storefront Live & Online</>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={toggleMaintenanceMode}
                      disabled={loading}
                      className={`h-9 px-5 rounded-xl font-extrabold text-xs shadow-2xs transition-all cursor-pointer w-full sm:w-auto ${
                        maintenanceMode 
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                          : 'bg-amber-500 hover:bg-amber-600 text-white'
                      }`}
                    >
                      {loading ? 'Updating...' : maintenanceMode ? 'Bring Site Online' : 'Enable Maintenance'}
                    </button>
                  </div>

                  <div>
                    <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Customer Maintenance Message</label>
                    <textarea
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      rows={3}
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs font-medium focus:border-[#E31837] focus:ring-[#E31837] outline-none"
                      placeholder="Enter the message displayed to users when maintenance is active..."
                    />
                    <p className="text-[11px] font-medium text-slate-400 mt-1">
                      Rendered on the maintenance splash page while site access is restricted
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Cost+$100 Universal Pricing */}
          <Card className={`bg-white rounded-xl shadow-xs border overflow-hidden transition-all ${
            costPlusUniversalEnabled ? 'border-purple-200 ring-1 ring-purple-200' : 'border-slate-200'
          }`}>
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <DollarSign className="size-5 text-purple-600" />
                Cost+$100 Universal Pricing Policy
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                costPlusUniversalEnabled ? 'bg-purple-50/80 border-purple-200' : 'bg-slate-50 border-slate-200/80'
              }`}>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Visibility Mode</p>
                  <p className={`text-xs font-black flex items-center gap-1.5 ${
                    costPlusUniversalEnabled ? 'text-purple-700' : 'text-slate-600'
                  }`}>
                    {costPlusUniversalEnabled ? (
                      <><div className="size-2 rounded-full bg-purple-500" /> Active for All Store Visitors</>
                    ) : (
                      <><div className="size-2 rounded-full bg-slate-400" /> Restricted to Logged-in Commercial Buyers</>
                    )}
                  </p>
                </div>
                <button
                  onClick={toggleCostPlusUniversal}
                  className={`h-9 px-5 rounded-xl font-extrabold text-xs shadow-2xs transition-all cursor-pointer w-full sm:w-auto ${
                    costPlusUniversalEnabled 
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800' 
                      : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                >
                  {costPlusUniversalEnabled ? 'Turn Off Universal' : 'Turn On Universal'}
                </button>
              </div>

              <div className="text-xs font-semibold text-slate-600 space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-[#0f172a] font-mono text-[11px]">
                    $500 - $10,000
                  </span>
                  <span>Displays Cost+$100 wholesale pricing calculation directly to visitors</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-[#0f172a] font-mono text-[11px]">
                    Over $10,000
                  </span>
                  <span>Shows instant commercial "Call for Quote" CTA button</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Administration */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Database className="size-5 text-[#E31837]" />
                Database Administration & Seed Tools
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="bg-red-50/80 border border-red-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-100 rounded-full text-red-600 shrink-0">
                    <ShieldAlert className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs text-red-900">Reinitialize Seed Database</h3>
                    <p className="text-[11px] font-semibold text-red-700 leading-snug mt-0.5">
                      Restores initial product catalog, categories, and settings.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={handleReinitialize} 
                  className="h-9 px-4 bg-white hover:bg-red-50 text-red-700 border border-red-300 rounded-xl font-bold text-xs shadow-2xs shrink-0 cursor-pointer transition-all"
                >
                  Reinitialize Data
                </button>
              </div>
            </CardContent>
          </Card>
          
        </div>

        {/* Right Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Account Info */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <User className="size-5 text-[#E31837]" />
                Admin Account Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="p-2 bg-white rounded-lg shadow-2xs shrink-0 border border-slate-100">
                  <User className="size-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Admin Name</p>
                  <p className="text-xs font-bold text-[#0f172a]">{user?.user_metadata?.name || 'Admin Administrator'}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                <div className="p-2 bg-white rounded-lg shadow-2xs shrink-0 border border-slate-100">
                  <Mail className="size-4 text-slate-600" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Email Address</p>
                  <p className="text-xs font-bold text-[#0f172a]">{user?.email || 'info@costplus100.com.au'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Metrics */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Monitor className="size-5 text-blue-600" />
                Database Engine & Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3 text-xs font-semibold">
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Total Products</span>
                <span className="font-mono font-bold text-[#0f172a] bg-slate-100 px-2 py-0.5 rounded">{data.products.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Categories</span>
                <span className="font-mono font-bold text-[#0f172a] bg-slate-100 px-2 py-0.5 rounded">{data.categories.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-slate-100">
                <span className="text-slate-500">Navigation Items</span>
                <span className="font-mono font-bold text-[#0f172a] bg-slate-100 px-2 py-0.5 rounded">{data.header.navigation.length}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-500">Storage Backend</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px]">
                  <Database className="size-3" /> Supabase PostgREST
                </span>
              </div>
            </CardContent>
          </Card>
          
        </div>

      </div>
    </div>
  );
}

export default Settings;