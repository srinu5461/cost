import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { 
  Building2, CreditCard, DollarSign, Save, Check, 
  AlertCircle, RefreshCw, Link as LinkIcon, Info, Shield, CheckCircle2
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { notify } from '../../utils/notifications';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface BankDetails {
  bankName: string;
  accountName: string;
  bsb: string;
  accountNumber: string;
  reference: string;
}

interface CompanyInfo {
  companyName: string;
  tradingName: string;
  abn: string;
  address: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
  email: string;
  website: string;
}

interface PaymentSettings {
  enableEway: boolean;
  enablePaypal: boolean;
  enableSquare: boolean;
  enableBankTransfer: boolean;
  defaultPaymentMethod: string;
  ewaySandboxMode: boolean;
  paypalSandboxMode: boolean;
  squareSandboxMode: boolean;
}

export function PaymentSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [bankDetails, setBankDetails] = useState<BankDetails>({
    bankName: '',
    accountName: '',
    bsb: '',
    accountNumber: '',
    reference: 'Please use invoice number as reference',
  });
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    companyName: '',
    tradingName: '',
    abn: '',
    address: '',
    city: '',
    state: '',
    postcode: '',
    country: 'Australia',
    phone: '',
    email: '',
    website: '',
  });
  
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    enableEway: true,
    enablePaypal: true,
    enableSquare: false,
    enableBankTransfer: true,
    defaultPaymentMethod: 'eway',
    ewaySandboxMode: true,
    paypalSandboxMode: true,
    squareSandboxMode: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      // Fetch bank details
      const bankResponse = await fetch(`${API_URL}/settings/bank-details`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (bankResponse.ok) {
        const data = await bankResponse.json();
        if (data.bankDetails) {
          setBankDetails(data.bankDetails);
        }
      }
      
      // Fetch company info
      const companyResponse = await fetch(`${API_URL}/settings/company-info`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (companyResponse.ok) {
        const data = await companyResponse.json();
        if (data.companyInfo) {
          setCompanyInfo(data.companyInfo);
        }
      }
      
      // Fetch payment settings
      const paymentResponse = await fetch(`${API_URL}/settings/payment-settings`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (paymentResponse.ok) {
        const data = await paymentResponse.json();
        if (data.paymentSettings) {
          setPaymentSettings(data.paymentSettings);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBankDetails = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/settings/bank-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ bankDetails }),
      });

      if (response.ok) {
        notify.success('Bank details saved successfully!');
      } else {
        notify.error('Failed to save bank details');
      }
    } catch (error) {
      console.error('Error saving bank details:', error);
      notify.error('Failed to save bank details');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePaymentSettings = async () => {
    try {
      setSaving(true);
      const response = await fetch(`${API_URL}/settings/payment-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ paymentSettings }),
      });

      if (response.ok) {
        notify.success('Payment settings saved successfully!');
      } else {
        notify.error('Failed to save payment settings');
      }
    } catch (error) {
      console.error('Error saving payment settings:', error);
      notify.error('Failed to save payment settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 flex flex-col items-center justify-center gap-3 font-sans">
        <RefreshCw className="size-8 animate-spin text-[#E31837]" />
        <p className="text-xs font-bold text-slate-500">Loading payment gateways and bank settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <CreditCard className="size-6 text-[#E31837]" />
            Payment Gateways & Banking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Configure storefront checkout gateways (eWay, PayPal, Square) and direct bank deposit details for tax invoices
          </p>
        </div>

        <button
          onClick={handleSavePaymentSettings}
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
              Save Payment Settings
            </>
          )}
        </button>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Checkout Integrations:</strong> Active payment options are automatically presented during checkout and embedded in invoice emails for customer convenience.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column - Payment Gateways (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <CreditCard className="size-5 text-[#E31837]" />
                Storefront Payment Gateways
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              
              {/* eWay Gateway */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-slate-100 rounded-xl">
                      <CreditCard className="size-5 text-[#2D3748]" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-[#0f172a]">eWay Payment Gateway</p>
                      <p className="text-xs font-medium text-slate-500">Credit card & debit card processing (Visa, Mastercard, AMEX)</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentSettings.enableEway}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, enableEway: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E31837]"></div>
                  </label>
                </div>

                {paymentSettings.enableEway && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-extrabold text-slate-700">Sandbox Test Environment</p>
                        <p className="text-[11px] font-medium text-slate-400">Enable for staging test transactions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentSettings.ewaySandboxMode}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, ewaySandboxMode: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    {paymentSettings.ewaySandboxMode ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-2">
                        <AlertCircle className="size-3.5 text-amber-600 shrink-0" />
                        <span className="text-[11px] font-bold text-amber-800">Sandbox Test Mode Active</span>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center gap-2">
                        <Check className="size-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[11px] font-bold text-emerald-800">Live Production Mode Active</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* PayPal Gateway */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <DollarSign className="size-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-[#0f172a]">PayPal Express</p>
                      <p className="text-xs font-medium text-slate-500">PayPal balance & Pay in 4 installment options</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentSettings.enablePaypal}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, enablePaypal: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E31837]"></div>
                  </label>
                </div>

                {paymentSettings.enablePaypal && (
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-extrabold text-slate-700">Sandbox Test Environment</p>
                        <p className="text-[11px] font-medium text-slate-400">Enable for test account checkouts</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={paymentSettings.paypalSandboxMode}
                          onChange={(e) => setPaymentSettings({ ...paymentSettings, paypalSandboxMode: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    {paymentSettings.paypalSandboxMode ? (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-2">
                        <AlertCircle className="size-3.5 text-amber-600 shrink-0" />
                        <span className="text-[11px] font-bold text-amber-800">Sandbox Test Mode Active</span>
                      </div>
                    ) : (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 flex items-center gap-2">
                        <Check className="size-3.5 text-emerald-600 shrink-0" />
                        <span className="text-[11px] font-bold text-emerald-800">Live Production Mode Active</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Square Gateway */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 rounded-xl">
                      <CreditCard className="size-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-[#0f172a]">Square Payments</p>
                      <p className="text-xs font-medium text-slate-500">Credit card & Google Pay / Apple Pay integrations</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentSettings.enableSquare}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, enableSquare: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E31837]"></div>
                  </label>
                </div>
              </div>

              {/* Bank Transfer Gateway */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 rounded-xl">
                      <Building2 className="size-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-extrabold text-sm text-[#0f172a]">Direct Bank Deposit</p>
                      <p className="text-xs font-medium text-slate-500">Direct BSB and Account Number invoice payments</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={paymentSettings.enableBankTransfer}
                      onChange={(e) => setPaymentSettings({ ...paymentSettings, enableBankTransfer: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E31837]"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={handleSavePaymentSettings}
                  disabled={saving}
                  className="h-10 px-6 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Save className="size-4" />
                  {saving ? 'Saving...' : 'Save Gateways'}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Payment Link Guide */}
          <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 space-y-2">
            <h3 className="font-extrabold text-blue-900 flex items-center gap-2 text-xs uppercase tracking-wider">
              <Info className="size-4 text-blue-600" />
              How Checkout & Invoice Payments Work
            </h3>
            <div className="text-xs font-semibold text-blue-800 space-y-1.5 leading-relaxed">
              <p><strong>1. Invoice Button:</strong> Tax invoices automatically feature a instant <strong>PAY NOW</strong> link routing customers to online checkout.</p>
              <p><strong>2. Online Cards:</strong> Customers can clear invoices using eWay, PayPal, or Square card options.</p>
              <p><strong>3. Direct BSB Deposit:</strong> Direct bank transfer instructions automatically append to invoice PDFs with invoice number references.</p>
            </div>
          </div>
        </div>

        {/* Right Column - Bank Transfer Details (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Building2 className="size-5 text-[#E31837]" />
                Direct Bank Transfer Account
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div>
                <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                  Bank Name <span className="text-[#E31837]">*</span>
                </Label>
                <Input
                  value={bankDetails.bankName}
                  onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  placeholder="Commonwealth Bank"
                  className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                />
              </div>
              
              <div>
                <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                  Account Name <span className="text-[#E31837]">*</span>
                </Label>
                <Input
                  value={bankDetails.accountName}
                  onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                  placeholder="COSTPLUS100 PTY LTD"
                  className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    BSB Number <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    value={bankDetails.bsb}
                    onChange={(e) => setBankDetails({ ...bankDetails, bsb: e.target.value })}
                    placeholder="063-000"
                    className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>
                
                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Account Number <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    value={bankDetails.accountNumber}
                    onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                    placeholder="1234 5678"
                    className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                  Payment Reference Instructions
                </Label>
                <Input
                  value={bankDetails.reference}
                  onChange={(e) => setBankDetails({ ...bankDetails, reference: e.target.value })}
                  placeholder="Please use invoice number as reference"
                  className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                />
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  Appears directly below bank details on printed & PDF invoices
                </p>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  onClick={handleSaveBankDetails}
                  disabled={saving}
                  className="h-10 px-6 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Save className="size-4" />
                  {saving ? 'Saving...' : 'Save Bank Details'}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Storefront Payment Badges Preview */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Shield className="size-5 text-[#E31837]" />
                Storefront Payment Badges
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3">
              <p className="text-xs font-semibold text-slate-600">
                Customer checkout security badge preview:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {paymentSettings.enableEway && (
                  <span className="px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-black border border-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600" /> eWay Secured
                  </span>
                )}
                {paymentSettings.enablePaypal && (
                  <span className="px-3 py-1.5 bg-blue-50 text-blue-800 rounded-lg text-xs font-black border border-blue-200 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-blue-600" /> PayPal Express
                  </span>
                )}
                {paymentSettings.enableSquare && (
                  <span className="px-3 py-1.5 bg-purple-50 text-purple-800 rounded-lg text-xs font-black border border-purple-200 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-purple-600" /> Square Pay
                  </span>
                )}
                {paymentSettings.enableBankTransfer && (
                  <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-black border border-emerald-200 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-emerald-600" /> Direct Deposit
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
