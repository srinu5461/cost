import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Key, 
  CheckCircle, 
  AlertCircle, 
  Save,
  RefreshCw,
  Shield,
  Trash2,
  ArrowRight,
  TrendingUp,
  Database,
  Link as LinkIcon,
  Info,
  ExternalLink
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Link } from 'react-router';
import { DeleteConfirmModal } from '../../components/ui/DeleteConfirmModal';
import { notify } from '../../utils/notifications';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface UropaConfig {
  token: string;
  apiUrl: string;
  hasEnvToken: boolean;
  hasEnvApiUrl: boolean;
  lastVerified: string | null;
}

export default function UropaTokenAuth() {
  const [token, setToken] = useState('');
  const [apiUrl, setApiUrl] = useState('https://p1-api.nisbets.com.au/occ/v2/uropa-au');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [saved, setSaved] = useState(false);
  const [config, setConfig] = useState<UropaConfig | null>(null);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/uropa/config`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(data.config);
          setToken(data.config.token || '');
          setApiUrl(data.config.apiUrl || 'https://p1-api.nisbets.com.au/occ/v2/uropa-au');
          setSaved(true);
          
          if (data.config.token) {
            testCurrentToken(data.config.token, data.config.apiUrl);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load config:', error);
      notify.error('Failed to load Uropa configuration');
    } finally {
      setLoading(false);
    }
  };

  const testCurrentToken = async (tokenToTest?: string, apiUrlToTest?: string) => {
    const testToken = tokenToTest || token;
    if (!testToken) return;
    
    try {
      const response = await fetch(`${API_URL}/price-sync/test-api`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const data = await response.json();
      setTestResult(data);
    } catch (error) {
      console.error('Test error:', error);
      setTestResult({
        success: false,
        message: 'Failed to test API connection: ' + (error instanceof Error ? error.message : 'Unknown error')
      });
    }
  };

  const verifyToken = async () => {
    if (!token || !apiUrl) {
      notify.error('Please enter both API URL and Token');
      return;
    }

    setVerifying(true);
    setTestResult(null);

    try {
      const response = await fetch(`${API_URL}/uropa/verify-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, apiUrl })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Token verification failed');
      }

      const result = await response.json();
      
      if (result.valid) {
        notify.success('Token verified successfully! Connected to Uropa API.');
        setTestResult({ 
          success: true, 
          message: 'Successfully connected to Uropa API. Your credentials are working correctly!' 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: result.error || 'Failed to verify token' 
        });
        throw new Error(result.error || 'Invalid token');
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      notify.error(error.message || 'Failed to verify token');
    } finally {
      setVerifying(false);
    }
  };

  const saveConfig = async () => {
    if (!token || !apiUrl) {
      notify.error('Please enter both API URL and Token');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/uropa/config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, apiUrl })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save configuration');
      }

      const data = await response.json();
      setSaved(true);
      setConfig(data.config);
      notify.success('Uropa API configuration saved successfully!');
    } catch (error: any) {
      console.error('Save error:', error);
      notify.error(error.message || 'Failed to save configuration');
    } finally {
      setLoading(false);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteConfig = async () => {
    setDeleting(true);

    try {
      const response = await fetch(`${API_URL}/uropa/config`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete configuration');
      }

      setToken('');
      setApiUrl('https://p1-api.nisbets.com.au/occ/v2/uropa-au');
      setConfig(null);
      setSaved(false);
      setTestResult(null);
      setShowDeleteModal(false);
      notify.success('Configuration deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      notify.error('Failed to delete configuration');
    } finally {
      setDeleting(false);
    }
  };

  // Debug token storage
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [debugging, setDebugging] = useState(false);

  const debugToken = async () => {
    setDebugging(true);
    try {
      const response = await fetch(`${API_URL}/uropa/debug-token`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const data = await response.json();
      setDebugInfo(data.debug);
      notify.info('Storage debug information fetched');
    } catch (error) {
      console.error('Debug error:', error);
      notify.error('Failed to debug token storage');
    } finally {
      setDebugging(false);
    }
  };

  if (loading && !config && !token) {
    return (
      <div className="max-w-7xl mx-auto py-16 flex flex-col items-center justify-center gap-3 font-sans">
        <RefreshCw className="size-8 animate-spin text-[#E31837]" />
        <p className="text-xs font-bold text-slate-500">Loading Uropa API configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Key className="size-6 text-[#E31837]" />
            Uropa API Authentication
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Configure Uropa API endpoints and Bearer tokens for automatic product price synchronization
          </p>
        </div>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Wholesale Synchronization:</strong> The Uropa API connects CostPlus100 directly to Nisbets/Uropa wholesale feeds for real-time cost updates and product mapping.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Configuration Form */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Key className="size-5 text-[#E31837]" />
                API Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              
              {/* API URL Field */}
              <div className="space-y-1.5">
                <Label htmlFor="apiUrl" className="text-xs font-extrabold text-[#0f172a]">Uropa API URL</Label>
                <div className="relative">
                  <LinkIcon className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="apiUrl"
                    type="text"
                    placeholder="https://p1-api.nisbets.com.au/occ/v2/uropa-au"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="h-9 pl-9 font-mono text-xs border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>
                <p className="text-[11px] font-medium text-slate-400">
                  Base endpoint URL for Uropa OCC API
                </p>
              </div>

              {/* Token Field */}
              <div className="space-y-1.5">
                <Label htmlFor="token" className="text-xs font-extrabold text-[#0f172a]">API Bearer Token</Label>
                <div className="relative">
                  <Key className="size-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <Input
                    id="token"
                    type="text"
                    placeholder="Enter your Uropa API token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className="h-9 pl-9 font-mono text-xs border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>
                {token && (
                  <p className="text-[11px] font-bold text-slate-600">
                    Token length: {token.length} characters
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={verifyToken} 
                  disabled={verifying || !token || !apiUrl}
                  className="h-9 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all border border-slate-200 flex items-center justify-center gap-1.5 text-xs cursor-pointer disabled:opacity-50"
                >
                  {verifying ? (
                    <><RefreshCw className="size-3.5 animate-spin" />Verifying...</>
                  ) : (
                    <><CheckCircle className="size-3.5 text-emerald-600" />Verify Credentials</>
                  )}
                </button>

                <button
                  onClick={saveConfig} 
                  disabled={loading || !token || !apiUrl}
                  className="h-9 px-5 bg-[#E31837] hover:bg-[#c4122c] text-white rounded-xl font-bold transition-all shadow-2xs flex items-center justify-center gap-2 text-xs cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <><RefreshCw className="size-3.5 animate-spin" />Saving...</>
                  ) : (
                    <><Save className="size-3.5" />{saved ? 'Update Config' : 'Save Config'}</>
                  )}
                </button>

                <button
                  onClick={debugToken} 
                  disabled={debugging}
                  className="h-9 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs ml-auto transition-all border border-slate-200 cursor-pointer disabled:opacity-50"
                >
                  {debugging ? 'Checking...' : '🔍 Debug Storage'}
                </button>

                {config && (
                  <button
                    onClick={() => setShowDeleteModal(true)} 
                    disabled={loading || deleting}
                    className="h-9 px-3 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl font-bold text-xs transition-all border border-red-200 cursor-pointer disabled:opacity-50"
                    title="Delete Configuration"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>

              {/* Debug Info Display */}
              {debugInfo && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-medium space-y-2">
                  <h4 className="font-extrabold text-[#0f172a] flex items-center gap-2">
                    <Info className="size-4 text-[#E31837]" />
                    Debug Storage Overview
                  </h4>
                  <div className="space-y-2 text-[11px]">
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-700">KV Token (uropa_api_token):</p>
                      {debugInfo.kvToken?.exists ? (
                        <p className="text-emerald-700 font-mono mt-0.5">✅ Exists ({debugInfo.kvToken.length} chars)</p>
                      ) : (
                        <p className="text-red-600 font-bold mt-0.5">❌ Not found in KV</p>
                      )}
                    </div>
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                      <p className="font-bold text-slate-700">Environment Variable (UROPA_API_TOKEN):</p>
                      {debugInfo.envToken?.exists ? (
                        <p className="text-blue-700 font-mono mt-0.5">✅ Exists in Env</p>
                      ) : (
                        <p className="text-slate-500 font-bold mt-0.5">❌ Not set in Env</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Connection Card */}
          {saved && (
            <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                  <Shield className="size-5 text-[#E31837]" />
                  Test API Connection
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-3">
                <button
                  onClick={verifyToken}
                  disabled={verifying}
                  className="h-9 px-5 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold text-xs shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {verifying ? (
                    <><RefreshCw className="size-3.5 animate-spin" />Testing...</>
                  ) : (
                    <><Shield className="size-3.5" />Test Connection</>
                  )}
                </button>

                {testResult && (
                  <div className={`p-4 rounded-xl border ${
                    testResult.success 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                      : 'bg-red-50 border-red-200 text-red-900'
                  }`}>
                    <div className="flex items-start gap-3">
                      {testResult.success ? (
                        <CheckCircle className="size-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="size-5 text-red-600 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 text-xs font-semibold">
                        <p>{testResult.message}</p>
                        {testResult.success && (
                          <div className="mt-3 pt-2.5 border-t border-emerald-200">
                            <Link to="/admin/uropa-price-sync">
                              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-800 hover:text-emerald-950 underline">
                                Open Price Sync Manager <ArrowRight className="size-3.5" />
                              </span>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Current Status */}
          {config && saved && (
            <Card className="bg-emerald-50/90 border border-emerald-200 shadow-xs rounded-xl overflow-hidden">
              <CardContent className="p-4 sm:p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-sm">
                  <CheckCircle className="size-5 text-emerald-600" />
                  Uropa API Connected
                </div>
                
                <div className="space-y-2 text-xs font-semibold">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">API URL</span>
                    <code className="block bg-white/80 border border-emerald-200 text-emerald-900 px-2.5 py-1.5 rounded-lg font-mono text-[11px] truncate">
                      {config.apiUrl}
                    </code>
                  </div>
                  
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block mb-0.5">Token Status</span>
                    <div className="bg-white/80 border border-emerald-200 p-2.5 rounded-lg text-emerald-900 text-[11px]">
                      {config.hasEnvToken ? (
                        <p className="font-bold">🔐 UROPA_API_TOKEN set in environment</p>
                      ) : (
                        <p className="font-mono">Token: {token ? `${token.substring(0, 14)}...` : '(none)'}</p>
                      )}
                      <p className="text-[10px] text-emerald-700 mt-1">Verified: {config.lastVerified ? new Date(config.lastVerified).toLocaleString() : 'Never'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Tools */}
          {saved && (
            <Card className="bg-[#2D3748] text-white border-none shadow-xs rounded-xl overflow-hidden">
              <CardHeader className="pb-3 border-b border-white/10">
                <CardTitle className="text-sm font-extrabold flex items-center gap-2 text-white">
                  <TrendingUp className="size-4 text-[#E31837]" />
                  Uropa-Powered Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 space-y-2">
                <Link to="/admin/uropa-price-sync" className="block">
                  <div className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                        <TrendingUp className="size-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Price Sync Manager</div>
                        <div className="text-[10px] text-slate-400">Compare & update prices</div>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-slate-400" />
                  </div>
                </Link>

                <Link to="/admin/products" className="block">
                  <div className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg text-blue-400">
                        <Database className="size-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">Product Manager</div>
                        <div className="text-[10px] text-slate-400">Manage equipment catalog</div>
                      </div>
                    </div>
                    <ArrowRight className="size-4 text-slate-400" />
                  </div>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Configuration Help */}
          <Card className="bg-amber-50/70 border border-amber-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-amber-200/60 bg-amber-100/40">
              <CardTitle className="text-xs font-extrabold text-amber-900 flex items-center gap-2">
                <Info className="size-4 text-amber-600" />
                Configuration Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3 text-xs font-medium text-amber-950">
              <div>
                <p className="font-extrabold text-amber-900 mb-0.5">🔗 API Endpoint URL:</p>
                <p className="text-[11px]">The base OCC endpoint for Nisbets/Uropa AU (<code className="font-mono bg-amber-100 px-1 rounded">https://p1-api.nisbets.com.au/occ/v2/uropa-au</code>)</p>
              </div>
              <div>
                <p className="font-extrabold text-amber-900 mb-0.5">🔑 Bearer Token:</p>
                <p className="text-[11px]">Your wholesale API authentication token used to sign requests.</p>
              </div>
            </CardContent>
          </Card>
        </div>

      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteConfig}
        title="Delete API Configuration"
        description="Are you sure you want to delete the Uropa API configuration? This will clear saved credentials."
        loading={deleting}
      />
    </div>
  );
}