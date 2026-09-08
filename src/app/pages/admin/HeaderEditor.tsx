import { useState } from 'react';
import { useCMS } from '../../context/CMSContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  Save, 
  Plus, 
  Trash2, 
  Upload, 
  Eye, 
  EyeOff, 
  ChevronUp, 
  ChevronDown, 
  Image as ImageIcon, 
  LayoutTemplate, 
  Search, 
  ShoppingCart, 
  GripVertical,
  Phone,
  Clock,
  Menu,
  CheckCircle2,
  Sparkles,
  Info,
  RefreshCw
} from 'lucide-react';
import { logger } from '../../utils/logger';
import { notify } from '../../utils/notifications';

// Default Costplus100 logo as inline SVG data URL
const defaultLogoUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cmVjdCB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHJ4PSI4IiBmaWxsPSIjRTMxODM3Ii8+CiAgPHRleHQgeD0iNTAlIiB5PSI1NCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZm9udC13ZWlnaHQ9ImJvbGQiIGZpbGw9IndoaXRlIj5DKzEwMDwvdGV4dD4KPC9zdmc+';

export function HeaderEditor() {
  let data, updateHeader;
  try {
    const cms = useCMS();
    data = cms.data;
    updateHeader = cms.updateHeader;
  } catch (e) {
    logger.error('HeaderEditor: CMSProvider not available, using empty data');
    data = {
      products: [],
      categories: [],
      categoryTree: [],
      header: { logo: '', phone: '', workingHours: '', navigation: [] },
      footer: { about: '', email: '', phone: '', address: '', socialMedia: {} },
      homepage: { hero: { title: '', subtitle: '', image: '' }, features: [] },
    };
    updateHeader = async () => {};
  }

  // Normalize navigation to ensure it's an array
  const normalizeNavigation = (nav: any[]) => {
    if (!nav || !Array.isArray(nav)) {
      return [];
    }

    return nav.map((item, index) => ({
      label: item.label || item.name || '',
      href: item.href || item.url || item.link || '/',
      enabled: item.enabled !== false,
      order: typeof item.order === 'number' ? item.order : index,
    }));
  };

  // Initialize state with normalized data
  const [header, setHeader] = useState(() => {
    return {
      logo: data.header?.logo || 'CostPlus100',
      logoUrl: data.header?.logoUrl || '',
      phone: data.header?.phone || '1300 000 100',
      workingHours: data.header?.workingHours || 'Mon-Fri: 8:00 AM - 5:00 PM EST',
      navigation: normalizeNavigation(data.header?.navigation || []),
    };
  });

  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleSave = () => {
    setSaving(true);
    updateHeader(header).then(() => {
      const now = new Date().toLocaleTimeString();
      setLastSaved(now);
      notify.success('Header settings saved successfully!');
    }).catch((error: any) => {
      logger.error('Failed to save header', error);
      notify.error('Failed to save header: ' + (error?.message || 'Unknown error'));
    }).finally(() => {
      setSaving(false);
    });
  };

  const addNavItem = () => {
    const maxOrder = Math.max(0, ...header.navigation.map(item => item.order || 0));
    setHeader({
      ...header,
      navigation: [...header.navigation, { 
        label: 'New Link', 
        href: '/products', 
        enabled: true,
        order: maxOrder + 1
      }]
    });
    notify.info('Added navigation link');
  };

  const updateNavItem = (index: number, field: 'label' | 'href', value: string) => {
    const newNav = [...header.navigation];
    newNav[index] = { ...newNav[index], [field]: value };
    setHeader({ ...header, navigation: newNav });
  };

  const toggleNavItemEnabled = (index: number) => {
    const newNav = [...header.navigation];
    newNav[index] = { 
      ...newNav[index], 
      enabled: newNav[index].enabled === false ? true : false 
    };
    setHeader({ ...header, navigation: newNav });
  };

  const moveNavItem = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === header.navigation.length - 1)
    ) {
      return;
    }

    const newNav = [...header.navigation];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newNav[index], newNav[targetIndex]] = [newNav[targetIndex], newNav[index]];
    newNav.forEach((item, i) => { item.order = i; });
    
    setHeader({ ...header, navigation: newNav });
  };

  const deleteNavItem = (index: number) => {
    setHeader({
      ...header,
      navigation: header.navigation.filter((_, i) => i !== index)
    });
    notify.info('Navigation link removed');
  };

  const handleLogoUrlChange = (url: string) => {
    setHeader({ ...header, logoUrl: url });
  };

  const resetToDefaultLogo = () => {
    setHeader({ ...header, logoUrl: defaultLogoUrl });
    notify.info('Reset to default brand logo');
  };

  const logoUrl = header.logoUrl || defaultLogoUrl;

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    
    if (file.size > 2 * 1024 * 1024) {
      notify.warning('Logo file size must be less than 2MB');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      notify.warning('Please select a valid image file');
      return;
    }
    
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        handleLogoUrlChange(dataUrl);
        setUploading(false);
        notify.success('Logo uploaded! Click "Save Changes" to apply.');
      };
      reader.onerror = () => {
        notify.error('Failed to read image file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error: any) {
      notify.error('Failed to load logo: ' + (error?.message || 'Unknown error'));
      setUploading(false);
    }
  };

  const activeNavCount = header.navigation.filter(item => item.enabled !== false).length;
  const disabledNavCount = header.navigation.filter(item => item.enabled === false).length;

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <LayoutTemplate className="size-6 text-[#E31837]" />
            Header Editor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Customize storefront brand logo, top contact info, and navigation bar links
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={resetToDefaultLogo}
            className="h-10 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <ImageIcon className="size-4 text-[#E31837]" />
            Reset Logo
          </button>
          <button
            onClick={addNavItem}
            className="h-10 px-4 bg-white border border-slate-200 text-[#0f172a] hover:bg-slate-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-4 text-[#E31837]" />
            Add Link
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
          <strong>Live Storefront Preview:</strong> Updates to your brand logo, top contact info, or menu order are reflected instantly in the Storefront Live Preview window below.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Settings Column */}
        <div className="space-y-4">
          {/* Logo Settings Card */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <ImageIcon className="size-5 text-[#E31837]" />
                Storefront Logo Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div>
                <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Current Brand Logo</label>
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 flex items-center justify-center min-h-[70px]">
                  <img 
                    src={logoUrl} 
                    alt={header.logo || 'Brand Logo'} 
                    className="h-10 w-auto object-contain drop-shadow-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Logo URL</label>
                <div className="flex gap-2">
                  <Input
                    value={header.logoUrl || ''}
                    onChange={(e) => handleLogoUrlChange(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                  <button 
                    type="button"
                    onClick={resetToDefaultLogo}
                    className="h-9 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
                    title="Reset to default logo"
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Logo Alt Text</label>
                  <Input
                    value={header.logo}
                    onChange={(e) => setHeader({ ...header, logo: e.target.value })}
                    placeholder="CostPlus100"
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Upload Image File</label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="h-9 text-xs border-slate-200 file:bg-[#2D3748] file:text-white file:border-0 file:rounded-md file:px-2.5 file:py-1 file:mr-2 file:text-xs file:font-bold cursor-pointer"
                    />
                    {uploading && <span className="text-xs text-[#E31837] font-bold shrink-0">Uploading...</span>}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information Card */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Phone className="size-5 text-[#E31837]" />
                Top Bar Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-4 sm:p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Store Phone Number</label>
                  <Input
                    value={header.phone}
                    onChange={(e) => setHeader({ ...header, phone: e.target.value })}
                    placeholder="1300 000 100"
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>
                <div>
                  <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Working Hours</label>
                  <Input
                    value={header.workingHours}
                    onChange={(e) => setHeader({ ...header, workingHours: e.target.value })}
                    placeholder="Mon-Fri: 8:00 AM - 5:00 PM EST"
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation Menu List Card */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row justify-between items-center">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Menu className="size-5 text-[#E31837]" />
                Navigation Menu ({header.navigation.length})
              </CardTitle>
              <Button onClick={addNavItem} size="sm" variant="outline" className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 rounded-lg shadow-2xs font-bold text-xs">
                <Plus className="size-3.5 mr-1 text-[#E31837]" />
                Add Link
              </Button>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 space-y-2.5 max-h-[420px] overflow-y-auto custom-scrollbar">
              {header.navigation.map((item, index) => {
                const isEnabled = item.enabled !== false;
                return (
                  <div 
                    key={index} 
                    className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                      isEnabled 
                        ? 'bg-white border-slate-200 hover:border-slate-300' 
                        : 'bg-slate-50/80 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="text-slate-300 cursor-grab">
                      <GripVertical className="size-4" />
                    </div>

                    {/* Order Controls */}
                    <div className="flex flex-col gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveNavItem(index, 'up')}
                        disabled={index === 0}
                        className="size-5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600 flex items-center justify-center cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveNavItem(index, 'down')}
                        disabled={index === header.navigation.length - 1}
                        className="size-5 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-600 flex items-center justify-center cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown className="size-3" />
                      </button>
                    </div>

                    {/* Inputs */}
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input
                        value={item.label}
                        onChange={(e) => updateNavItem(index, 'label', e.target.value)}
                        placeholder="Menu Label"
                        className="text-xs font-semibold h-8 border-slate-200"
                      />
                      <Input
                        value={item.href}
                        onChange={(e) => updateNavItem(index, 'href', e.target.value)}
                        placeholder="/products"
                        className="text-xs font-mono h-8 border-slate-200"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => toggleNavItemEnabled(index)}
                        className={`size-8 rounded-lg flex items-center justify-center transition-all cursor-pointer border ${
                          isEnabled
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                        title={isEnabled ? "Hide from menu" : "Show in menu"}
                      >
                        {isEnabled ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteNavItem(index)}
                        className="size-8 rounded-lg bg-rose-50 border border-rose-200 text-[#E31837] hover:bg-rose-100 flex items-center justify-center cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {header.navigation.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No navigation items. Click "Add Link" to create one.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Storefront Header Preview Column */}
        <div>
          <Card className="lg:sticky lg:top-24 bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center justify-between">
                <span>Storefront Header Live Preview</span>
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

                {/* Top Info Strip */}
                <div className="bg-[#2D3748] text-white text-[11px] font-bold p-2.5">
                  <div className="flex justify-between items-center px-3">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1.5 text-slate-100">
                        <Phone className="size-3 text-[#E31837]" />
                        {header.phone || '1300 000 100'}
                      </span>
                      <span className="hidden sm:inline text-slate-300 font-normal">
                        {header.workingHours || 'Mon-Fri: 8am - 5pm'}
                      </span>
                    </div>
                    <div className="flex gap-3 text-slate-300 font-medium text-[10px]">
                      <span className="hover:text-white cursor-pointer">About</span>
                      <span className="hover:text-white cursor-pointer">Contact</span>
                    </div>
                  </div>
                </div>

                {/* Main Header Bar */}
                <div className="bg-white p-3.5 border-b border-slate-100">
                  <div className="flex items-center justify-between gap-3 px-2">
                    {/* Brand Logo */}
                    <div className="bg-white rounded-lg p-1 max-w-[140px] h-10 flex items-center shrink-0">
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt={header.logo || 'Logo'} 
                          className="max-h-full max-w-full object-contain drop-shadow-xs"
                        />
                      ) : (
                        <span className="text-xs text-slate-400 font-black">COSTPLUS100</span>
                      )}
                    </div>
                    
                    {/* Search Bar Mockup */}
                    <div className="hidden sm:flex flex-1 max-w-xs items-center gap-2 text-xs text-slate-400 border border-slate-200 rounded-xl px-3 py-1.5 bg-slate-50">
                      <Search className="size-3.5 text-slate-400" />
                      <span>Search products...</span>
                    </div>
                    
                    {/* Cart Button Mockup */}
                    <div className="text-xs bg-[#E31837] text-white font-extrabold px-3 py-2 rounded-xl flex items-center gap-1.5 shadow-2xs shrink-0">
                      <ShoppingCart className="size-3.5" />
                      <span>Cart (0)</span>
                    </div>
                  </div>
                </div>

                {/* Primary Navigation Bar */}
                <div className="bg-slate-50/80 p-2 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-1 px-2">
                    {header.navigation
                      .filter(item => item.enabled !== false)
                      .slice(0, 7)
                      .map((item, index) => (
                        <div
                          key={index}
                          className="px-3 py-1 text-[11px] font-extrabold text-slate-700 bg-white hover:text-[#E31837] rounded-lg border border-slate-200/70 shadow-2xs transition-colors cursor-pointer"
                        >
                          {item.label || 'Link'}
                        </div>
                      ))}
                    {header.navigation.filter(item => item.enabled !== false).length > 7 && (
                      <div className="px-2 py-1 text-[10px] font-bold text-slate-400">
                        +{header.navigation.filter(item => item.enabled !== false).length - 7} more
                      </div>
                    )}
                    {header.navigation.filter(item => item.enabled !== false).length === 0 && (
                      <div className="px-3 py-1 text-[11px] font-bold text-slate-400 italic">
                        Navigation menu is empty
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