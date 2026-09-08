import { useState, useEffect } from 'react';
import { Mail, Save, Send, Settings, AlertCircle, CheckCircle, Server, RefreshCw, Key, ArrowRight, ShieldCheck, Info, CheckCircle2 } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { notify } from '../../utils/notifications';

interface EmailConfig {
  provider: 'smtp' | 'resend';
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  senderEmail: string;
  senderName: string;
  adminEmail: string;
  enableNotifications: boolean;
}

export function EmailSettings() {
  const [config, setConfig] = useState<EmailConfig>({
    provider: 'smtp',
    smtpHost: 'smtp.office365.com',
    smtpPort: 587,
    smtpSecure: false,
    senderEmail: 'info@costplus100.com.au',
    senderName: 'Costplus100',
    adminEmail: 'info@costplus100.com.au',
    enableNotifications: true
  });
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [passwordConfigured, setPasswordConfigured] = useState(false);

  const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/email/config`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (!response.ok) {
        console.log('Using default email configuration');
        return;
      }
      
      const data = await response.json();
      if (data.success && data.config) {
        setConfig(data.config);
        setPasswordConfigured(data.passwordConfigured);
      }
    } catch (error: any) {
      console.error('Failed to load email config:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/email/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();
      
      if (data.success) {
        notify.success('Email configuration saved successfully');
      } else {
        notify.error(data.error || 'Failed to save configuration');
      }
    } catch (error: any) {
      console.error('Failed to save config:', error);
      notify.error('Failed to save email configuration');
    } finally {
      setSaving(false);
    }
  };

  const verifyConnection = async () => {
    setVerifying(true);
    try {
      const response = await fetch(`${API_BASE}/email/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        notify.success('SMTP connection verified successfully!');
      } else {
        console.error('SMTP Connection Error:', data.error);
        notify.error(`SMTP connection failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Failed to verify SMTP:', error);
      notify.error(`Network error: ${error.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const sendTestEmail = async () => {
    if (!testEmail) {
      notify.error('Please enter a test email address');
      return;
    }

    setTesting(true);
    try {
      const response = await fetch(`${API_BASE}/email/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ to: testEmail })
      });

      const data = await response.json();
      
      if (data.success) {
        notify.success(`Test email sent to ${testEmail}`);
        setTestEmail('');
      } else {
        notify.error(data.error || 'Failed to send test email');
      }
    } catch (error: any) {
      console.error('Failed to send test email:', error);
      notify.error('Failed to send test email');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 flex flex-col items-center justify-center gap-3 font-sans">
        <RefreshCw className="size-8 animate-spin text-[#E31837]" />
        <p className="text-xs font-bold text-slate-500">Loading email configuration...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Mail className="size-6 text-[#E31837]" />
            Email Dispatch & SMTP Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Configure automated order receipt dispatching, SMTP credentials, and admin alert channels
          </p>
        </div>

        <button
          onClick={saveConfig}
          disabled={saving}
          className="h-10 px-5 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50 shrink-0"
        >
          {saving ? (
            <>
              <RefreshCw className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Save Configuration
            </>
          )}
        </button>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Transactional Emails:</strong> Automated order confirmation, registration welcome, and tax invoice emails are dispatched live via this SMTP server.
        </div>
      </div>

      {/* Password Alert Banner */}
      {!passwordConfigured ? (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="size-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1">
              <h3 className="font-extrabold text-amber-900 text-sm">SMTP Password Secret Not Detected</h3>
              <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                To dispatch emails from <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-amber-900">{config.senderEmail}</code>, configure the SMTP password secret in Supabase:
              </p>
            </div>
          </div>

          <div className="bg-white/90 border border-amber-200 rounded-lg p-3 text-xs font-semibold text-amber-900 space-y-1.5 pl-4">
            <p className="flex items-center gap-2 font-mono">
              <Key className="size-3.5 text-amber-600" />
              SMTP_PASSWORD = <span className="text-slate-400 font-sans italic">your_office365_or_gmail_app_password</span>
            </p>
            <div className="text-[11px] text-amber-800 font-medium space-y-1 pt-1">
              <p>1. Open Supabase Dashboard → Edge Functions → Secrets</p>
              <p>2. Create a secret named <strong>SMTP_PASSWORD</strong></p>
              <p>3. Enter your email password for <strong>{config.senderEmail}</strong></p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100/80 rounded-full">
              <ShieldCheck className="size-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-extrabold text-emerald-900 text-sm">SMTP Password Configured</h3>
              <p className="text-xs font-semibold text-emerald-700">
                Your SMTP authentication secrets are active and ready for dispatching
              </p>
            </div>
          </div>

          <button
            onClick={verifyConnection}
            disabled={verifying}
            className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shrink-0"
          >
            {verifying ? (
              <><RefreshCw className="size-4 animate-spin" />Verifying...</>
            ) : (
              <><Server className="size-4" />Verify SMTP Server</>
            )}
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* SMTP Config Form */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Settings className="size-5 text-[#E31837]" />
                SMTP Host & Credentials
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Host */}
                <div className="sm:col-span-2">
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    SMTP Hostname <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={config.smtpHost}
                    onChange={(e) => setConfig({ ...config, smtpHost: e.target.value })}
                    placeholder="smtp.office365.com"
                    className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                  <p className="text-[11px] font-medium text-slate-400 mt-1">SMTP mail server address</p>
                </div>

                {/* Port */}
                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    SMTP Port <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    type="number"
                    value={config.smtpPort}
                    onChange={(e) => setConfig({ ...config, smtpPort: parseInt(e.target.value) || 587 })}
                    className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>

                {/* Security */}
                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Security Standard <span className="text-[#E31837]">*</span>
                  </Label>
                  <select
                    value={config.smtpSecure ? 'ssl' : 'tls'}
                    onChange={(e) => setConfig({ ...config, smtpSecure: e.target.value === 'ssl' })}
                    className="w-full h-9 px-3 text-xs font-bold border border-slate-200 rounded-md focus:border-[#E31837] focus:ring-[#E31837] outline-none"
                  >
                    <option value="tls">TLS (Port 587)</option>
                    <option value="ssl">SSL (Port 465)</option>
                  </select>
                </div>

                {/* Sender Email */}
                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Sender Email Address <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={config.senderEmail}
                    onChange={(e) => setConfig({ ...config, senderEmail: e.target.value })}
                    placeholder="info@costplus100.com.au"
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>

                {/* Sender Name */}
                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Sender Display Name <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={config.senderName}
                    onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
                    placeholder="Costplus100"
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>

                {/* Admin Recipient Email */}
                <div className="sm:col-span-2">
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Contact Form & Admin Alert Recipient <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={config.adminEmail}
                    onChange={(e) => setConfig({ ...config, adminEmail: e.target.value })}
                    placeholder="info@costplus100.com.au"
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                  <p className="text-[11px] font-medium text-slate-400 mt-1">
                    Storefront contact form submissions and new order alerts are delivered to this inbox
                  </p>
                </div>
                
                {/* Admin Notifications Toggle */}
                <div className="sm:col-span-2 p-4 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between mt-1">
                  <div>
                    <h3 className="font-extrabold text-xs text-[#0f172a]">Admin Order Notifications</h3>
                    <p className="text-[11px] font-medium text-slate-500">
                      Receive instant email notifications when new orders or quotes are created
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enableNotifications}
                      onChange={(e) => setConfig({ ...config, enableNotifications: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E31837]"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={saveConfig}
                  disabled={saving}
                  className="h-10 px-6 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Save className="size-4" />
                  {saving ? 'Saving...' : 'Save Email Config'}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Test Email */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Send className="size-5 text-[#E31837]" />
                Dispatch Test Email
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <p className="text-xs font-semibold text-slate-600">
                Send an immediate test message to verify your SMTP authentication setup:
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="admin@costplus100.com.au"
                  className="flex-1 h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                />
                <button
                  onClick={sendTestEmail}
                  disabled={testing || !testEmail || !passwordConfigured}
                  className="h-9 px-5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shrink-0"
                >
                  {testing ? (
                    <><RefreshCw className="size-4 animate-spin" />Sending...</>
                  ) : (
                    <><Send className="size-4" />Send Test Message</>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
          
        </div>

        {/* Right Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Info className="size-5 text-blue-600" />
                Automated Transactional Emails
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3">
              
              <div className="flex items-start gap-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-xs text-emerald-900">Order Confirmation & Receipt</h3>
                  <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                    Dispatched to buyers immediately upon successful checkout
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50/80 border border-blue-200 rounded-xl">
                <CheckCircle2 className="size-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-xs text-blue-900">Tax Invoice Delivery</h3>
                  <p className="text-[11px] font-semibold text-blue-700 mt-0.5">
                    Includes company ABN, BSB bank deposit info, and itemized GST breakdowns
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <CheckCircle2 className="size-4 text-slate-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-xs text-slate-800">Customer Registration Welcome</h3>
                  <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                    Sent when a commercial client creates a store account
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-amber-50/80 border border-amber-200 rounded-xl">
                <CheckCircle2 className="size-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-xs text-amber-900">Admin New Order Alerts</h3>
                  <p className="text-[11px] font-semibold text-amber-800 mt-0.5">
                    Real-time alert sent to <span className="font-mono font-bold">{config.adminEmail}</span>
                  </p>
                </div>
              </div>
              
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}