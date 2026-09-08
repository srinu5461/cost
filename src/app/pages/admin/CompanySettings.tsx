import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Building2, Save, Loader2, Info, MapPin, Mail, Globe, Phone, FileText, CheckCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { notify } from '../../utils/notifications';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

export function CompanySettings() {
  const [loading, setLoading] = useState(false);
  const [loadingFetch, setLoadingFetch] = useState(true);
  
  const [companyInfo, setCompanyInfo] = useState({
    companyName: 'COSTPLUS100 PTY LTD',
    tradingName: 'Costplus100',
    abn: '12 345 678 901',
    address: '123 Industrial Drive',
    city: 'Sydney',
    state: 'NSW',
    postcode: '2000',
    country: 'Australia',
    phone: '1300 COSTPLUS',
    email: 'info@costplus100.com.au',
    supportEmail: 'support@costplus100.com.au',
    website: 'www.costplus100.com.au',
    tagline: 'CATERING EQUIPMENT SOLUTIONS',
  });

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const response = await fetch(`${API_URL}/email/company-info`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.companyInfo) {
          setCompanyInfo(data.companyInfo);
        }
      }
    } catch (error) {
      console.error('Failed to fetch company info:', error);
    } finally {
      setLoadingFetch(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/email/company-info`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(companyInfo),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save company information');
      }

      notify.success('Company information saved successfully!');
    } catch (error) {
      console.error('Error saving company info:', error);
      notify.error(`Failed to save: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setCompanyInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loadingFetch) {
    return (
      <div className="max-w-7xl mx-auto py-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="size-8 animate-spin text-[#E31837]" />
        <p className="text-xs font-bold text-slate-500">Loading company information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Building2 className="size-6 text-[#E31837]" />
            Company & Business Details
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Configure company legal info, ABN, physical address, and contact details for GST tax invoices and customer emails
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={loading}
          className="h-10 px-5 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50 shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="size-4" />
              Save Company Info
            </>
          )}
        </button>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Official Documents & Tax Invoices:</strong> These business details populate all tax invoices, order receipts, quotation PDFs, and customer transactional emails.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Main Edit Form (Left Side) */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* Company Details */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Building2 className="size-5 text-[#E31837]" />
                Legal & Trading Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Legal Company Name <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={companyInfo.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    placeholder="COSTPLUS100 PTY LTD"
                  />
                </div>

                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Trading Name <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={companyInfo.tradingName}
                    onChange={(e) => handleChange('tradingName', e.target.value)}
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    placeholder="Costplus100"
                  />
                </div>

                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    ABN (Australian Business Number) <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={companyInfo.abn}
                    onChange={(e) => handleChange('abn', e.target.value)}
                    className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    placeholder="12 345 678 901"
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Mandatory for ATO tax compliance and GST invoices
                  </p>
                </div>

                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Company Tagline / Slogan
                  </Label>
                  <Input
                    type="text"
                    value={companyInfo.tagline}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    placeholder="CATERING EQUIPMENT SOLUTIONS"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Address */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <MapPin className="size-5 text-[#E31837]" />
                Registered Business Address
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sm:col-span-4">
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Street Address <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={companyInfo.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    placeholder="123 Industrial Drive"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    City / Suburb <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={companyInfo.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    placeholder="Sydney"
                  />
                </div>

                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    State <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={companyInfo.state}
                    onChange={(e) => handleChange('state', e.target.value)}
                    className="h-9 text-xs font-bold uppercase border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    placeholder="NSW"
                  />
                </div>

                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Postcode <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={companyInfo.postcode}
                    onChange={(e) => handleChange('postcode', e.target.value)}
                    className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    placeholder="2000"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Country <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={companyInfo.country}
                    onChange={(e) => handleChange('country', e.target.value)}
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    placeholder="Australia"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Mail className="size-5 text-[#E31837]" />
                Communication & Support Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Phone Number <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={companyInfo.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    placeholder="1300 COSTPLUS"
                  />
                </div>

                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Website URL
                  </Label>
                  <Input
                    type="text"
                    value={companyInfo.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    placeholder="www.costplus100.com.au"
                  />
                </div>

                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Public Customer Email <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    type="email"
                    value={companyInfo.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    placeholder="info@costplus100.com.au"
                  />
                </div>

                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Internal Support Email
                  </Label>
                  <Input
                    type="email"
                    value={companyInfo.supportEmail}
                    onChange={(e) => handleChange('supportEmail', e.target.value)}
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    placeholder="support@costplus100.com.au"
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-1">
                    Storefront contact form submissions are routed here
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Right Sidebar - Preview & Info */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Live Invoice Preview */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden sticky top-4">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <FileText className="size-5 text-[#E31837]" />
                Tax Invoice Document Mockup
              </CardTitle>
              <CardDescription className="text-xs font-medium text-slate-500">Real-time preview of tax receipts generated for customers</CardDescription>
            </CardHeader>
            <CardContent className="p-4 bg-slate-100/70">
              
              {/* Paper Document Mockup */}
              <div className="bg-white border border-slate-200 rounded-xl shadow-md overflow-hidden min-h-[340px]">
                
                {/* Document Header */}
                <div className="p-5 border-b-2 border-slate-100 relative">
                  <div className="absolute top-3 right-3 bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">
                    <span className="text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">Tax Invoice</span>
                  </div>

                  <h2 className="text-lg font-black text-[#0f172a] tracking-tight">{companyInfo.tradingName.toUpperCase() || 'COMPANY NAME'}</h2>
                  {companyInfo.tagline && (
                    <p className="text-[#E31837] text-[10px] font-extrabold tracking-widest uppercase mt-0.5">{companyInfo.tagline}</p>
                  )}
                  
                  <div className="mt-4 flex flex-col gap-0.5">
                    <p className="text-xs font-extrabold text-slate-800">{companyInfo.companyName || 'Legal Entity Name'}</p>
                    <p className="text-[11px] text-slate-500">ABN: <span className="font-mono font-bold text-slate-700">{companyInfo.abn || 'XX XXX XXX XXX'}</span></p>
                  </div>
                </div>

                {/* Document Body */}
                <div className="p-5 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Registered Address</p>
                    <p className="text-[11px] font-medium text-slate-700">{companyInfo.address || 'Street Address'}</p>
                    <p className="text-[11px] font-medium text-slate-700">
                      {companyInfo.city || 'City'}, {companyInfo.state || 'State'} {companyInfo.postcode || 'Postcode'}
                    </p>
                    <p className="text-[11px] font-medium text-slate-700">{companyInfo.country || 'Australia'}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Contact Channels</p>
                    <p className="text-[11px] text-slate-700 font-mono font-bold">{companyInfo.phone || 'Phone Number'}</p>
                    <p className="text-[11px] text-slate-700 font-medium">{companyInfo.email || 'Email Address'}</p>
                    <p className="text-[11px] text-[#E31837] font-bold">{companyInfo.website || 'Website'}</p>
                  </div>
                </div>

                {/* Document Skeleton Lines */}
                <div className="px-5 pb-5 mt-2 space-y-2">
                  <div className="h-0.5 w-full bg-slate-100 rounded-full"></div>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                    <span>INVOICE #INV-2026-0042</span>
                    <span>TOTAL: $1,245.00 INC GST</span>
                  </div>
                  <div className="h-0.5 w-3/4 bg-slate-100 rounded-full"></div>
                </div>

              </div>

            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}