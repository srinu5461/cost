import { useState, useEffect } from 'react';
import { useCMS } from '../../context/CMSContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  Save, 
  RefreshCw, 
  PanelBottom, 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Mail, 
  Phone, 
  MapPin,
  Building,
  Share2,
  Info
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { notify } from '../../utils/notifications';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

export function FooterEditor() {
  let data, updateFooter;
  try {
    const cms = useCMS();
    data = cms.data;
    updateFooter = cms.updateFooter;
  } catch (e) {
    console.error('FooterEditor: CMSProvider not available, using empty data');
    data = {
      products: [],
      categories: [],
      categoryTree: [],
      header: { logo: '', phone: '', workingHours: '', navigation: [] },
      footer: { about: '', email: '', phone: '', address: '', socialMedia: {} },
      homepage: { hero: { title: '', subtitle: '', image: '' }, features: [] },
    };
    updateFooter = async () => {};
  }
  
  const [footer, setFooter] = useState(data.footer || {
    about: 'Costplus100 is your trusted partner for professional catering equipment. We provide commercial-grade products from leading brands.',
    email: 'info@costplus100.com.au',
    phone: '1300 000 100',
    address: '6/4 Loftus Street Bowral NSW 2576',
    socialMedia: {
      facebook: 'https://facebook.com',
      twitter: 'https://twitter.com',
      instagram: 'https://instagram.com',
      linkedin: 'https://linkedin.com'
    }
  });
  const [isInitializing, setIsInitializing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync with CMS data when it changes
  useEffect(() => {
    if (data.footer) {
      setFooter(data.footer);
    }
  }, [data.footer]);

  const handleInitialize = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch(`${API_URL}/footer/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      const result = await response.json();
      
      if (result.success && result.footer) {
        setFooter(result.footer);
        notify.success('Footer initialized with Costplus100 defaults! Click Save to confirm.');
      } else {
        throw new Error(result.message || 'Failed to initialize footer');
      }
    } catch (error) {
      console.error('Error initializing footer:', error);
      const manualDefaults = {
        about: "Costplus100 is your trusted partner for professional catering equipment. We provide commercial-grade products from leading brands.",
        email: "info@costplus100.com.au",
        phone: "1300 000 100",
        address: "6/4 Loftus Street Bowral NSW 2576",
        socialMedia: {
          facebook: "https://facebook.com",
          twitter: "https://twitter.com",
          instagram: "https://instagram.com",
          linkedin: "https://linkedin.com"
        }
      };
      
      setFooter(manualDefaults);
      notify.info('Loaded default values locally. Click Save to apply.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateFooter(footer);
      notify.success('Footer settings saved successfully!');
    } catch (error: any) {
      console.error('Failed to save footer:', error);
      notify.error('Failed to save footer: ' + (error?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <PanelBottom className="size-6 text-[#E31837]" />
            Footer Editor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Customize storefront footer company description, contact info, address, and social links
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={handleInitialize}
            disabled={isInitializing}
            className="h-10 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`size-4 text-[#E31837] ${isInitializing ? 'animate-spin' : ''}`} />
            Initialize Defaults
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-5 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="size-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Live Preview Sync:</strong> Any updates made to company details or social media links render immediately in the Storefront Live Preview window below.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Settings Column */}
        <div className="space-y-4">
          {/* Company Information Card */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Building className="size-5 text-[#E31837]" />
                Company Information & Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div>
                <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">About Company Description</label>
                <textarea
                  value={footer.about || ''}
                  onChange={(e) => setFooter({ ...footer, about: e.target.value })}
                  className="w-full min-h-[90px] p-3 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#E31837] focus:border-[#E31837] focus:outline-none"
                  placeholder="Company description..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Support Email</label>
                  <Input
                    type="email"
                    value={footer.email || ''}
                    onChange={(e) => setFooter({ ...footer, email: e.target.value })}
                    placeholder="info@costplus100.com.au"
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Support Phone</label>
                  <Input
                    value={footer.phone || ''}
                    onChange={(e) => setFooter({ ...footer, phone: e.target.value })}
                    placeholder="1300 000 100"
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Physical Business Address</label>
                <Input
                  value={footer.address || ''}
                  onChange={(e) => setFooter({ ...footer, address: e.target.value })}
                  placeholder="6/4 Loftus Street Bowral NSW 2576"
                  className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Social Media Links Card */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Share2 className="size-5 text-[#E31837]" />
                Social Media Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Facebook className="size-3.5 text-blue-600" /> Facebook URL
                  </label>
                  <Input
                    value={footer.socialMedia?.facebook || ''}
                    onChange={(e) => setFooter({
                      ...footer,
                      socialMedia: { ...footer.socialMedia, facebook: e.target.value }
                    })}
                    placeholder="https://facebook.com/..."
                    className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Twitter className="size-3.5 text-sky-500" /> Twitter / X URL
                  </label>
                  <Input
                    value={footer.socialMedia?.twitter || ''}
                    onChange={(e) => setFooter({
                      ...footer,
                      socialMedia: { ...footer.socialMedia, twitter: e.target.value }
                    })}
                    placeholder="https://twitter.com/..."
                    className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Instagram className="size-3.5 text-rose-500" /> Instagram URL
                  </label>
                  <Input
                    value={footer.socialMedia?.instagram || ''}
                    onChange={(e) => setFooter({
                      ...footer,
                      socialMedia: { ...footer.socialMedia, instagram: e.target.value }
                    })}
                    placeholder="https://instagram.com/..."
                    className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-1.5">
                    <Linkedin className="size-3.5 text-blue-700" /> LinkedIn URL
                  </label>
                  <Input
                    value={footer.socialMedia?.linkedin || ''}
                    onChange={(e) => setFooter({
                      ...footer,
                      socialMedia: { ...footer.socialMedia, linkedin: e.target.value }
                    })}
                    placeholder="https://linkedin.com/company/..."
                    className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Storefront Footer Preview Column */}
        <div>
          <Card className="lg:sticky lg:top-24 bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center justify-between">
                <span>Storefront Footer Live Preview</span>
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                  Live Mockup
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 bg-slate-100/60 space-y-4">
              <div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-lg bg-white ring-1 ring-slate-900/5">
                {/* Browser Top Navigation Bar */}
                <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400 border border-red-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500/20" />
                    <div className="w-2.5 h-2.5 rounded-full bg-green-400 border border-green-500/20" />
                  </div>
                  <div className="mx-auto bg-white rounded-md px-8 py-0.5 text-[10px] text-slate-400 font-bold border border-slate-200/80 shadow-2xs">
                    costplus100.com.au
                  </div>
                </div>

                {/* Main Dark Storefront Footer */}
                <div className="bg-[#2D3748] text-white p-6 space-y-4 text-xs">
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-white mb-1">
                      CostPlus<span className="text-[#E31837]">100</span>
                    </h3>
                    <p className="text-slate-300 text-xs font-medium leading-relaxed">
                      {footer.about || 'Company description placeholder...'}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs font-medium pt-2 border-t border-slate-700/60">
                    <p className="text-slate-200 flex items-center gap-2">
                      <Mail className="size-3.5 text-[#E31837]" /> {footer.email || 'info@costplus100.com.au'}
                    </p>
                    <p className="text-slate-200 flex items-center gap-2">
                      <Phone className="size-3.5 text-[#E31837]" /> {footer.phone || '1300 000 100'}
                    </p>
                    <p className="text-slate-200 flex items-center gap-2">
                      <MapPin className="size-3.5 text-[#E31837]" /> {footer.address || '6/4 Loftus Street Bowral NSW 2576'}
                    </p>
                  </div>

                  {/* Social Icons Bar */}
                  <div className="flex gap-2 pt-3 border-t border-slate-700/60">
                    {footer.socialMedia?.facebook && (
                      <div className="size-8 bg-slate-800 hover:bg-[#E31837] rounded-lg flex items-center justify-center text-white transition-colors cursor-pointer border border-slate-700">
                        <Facebook className="size-4" />
                      </div>
                    )}
                    {footer.socialMedia?.twitter && (
                      <div className="size-8 bg-slate-800 hover:bg-[#E31837] rounded-lg flex items-center justify-center text-white transition-colors cursor-pointer border border-slate-700">
                        <Twitter className="size-4" />
                      </div>
                    )}
                    {footer.socialMedia?.instagram && (
                      <div className="size-8 bg-slate-800 hover:bg-[#E31837] rounded-lg flex items-center justify-center text-white transition-colors cursor-pointer border border-slate-700">
                        <Instagram className="size-4" />
                      </div>
                    )}
                    {footer.socialMedia?.linkedin && (
                      <div className="size-8 bg-slate-800 hover:bg-[#E31837] rounded-lg flex items-center justify-center text-white transition-colors cursor-pointer border border-slate-700">
                        <Linkedin className="size-4" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}