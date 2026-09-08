import { useState, useEffect } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Textarea } from '../../components/ui/textarea';
import { 
  Plus, 
  Trash2, 
  Save, 
  MoveUp, 
  MoveDown, 
  Upload, 
  Eye, 
  EyeOff, 
  LayoutTemplate, 
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { notify } from '../../utils/notifications';

interface BannerSlide {
  id: string;
  image: string;
  badge: string;
  title: string;
  description: string;
  order: number;
  active?: boolean;
  link?: string;
}

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

const BANNER_PRESETS = [
  { label: 'Commercial Kitchen', url: 'https://images.unsplash.com/photo-1767785990437-dfe1fe516fe8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  { label: 'Refrigeration Line', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  { label: 'Cooking Range', url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
];

export function BannersManager() {
  const [banners, setBanners] = useState<BannerSlide[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<string | null>(null);

  // Load banners on component mount
  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    setLoading(true);
    try {
      const url = `${API_URL}/banners`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBanners(data || []);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch banners:', response.status, errorText);
      }
    } catch (error) {
      console.error('Failed to load banners (exception):', error);
    } finally {
      setLoading(false);
    }
  };

  const saveBanners = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/banners`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(banners),
      });
      
      if (response.ok) {
        localStorage.removeItem('costplus100_homepage_data');
        localStorage.removeItem('costplus100_homepage_timestamp');
        localStorage.removeItem('costplus100_homepage_cache_version');
        const now = new Date().toLocaleTimeString();
        setLastSaved(now);
        notify.success('Banners saved successfully! Homepage cache updated.');
      } else {
        const errorText = await response.text();
        console.error('Failed to save banners:', errorText);
        notify.error('Failed to save banners');
      }
    } catch (error: any) {
      notify.error('Failed to save banners: ' + (error?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const addBanner = () => {
    const newBanner: BannerSlide = {
      id: Date.now().toString(),
      image: BANNER_PRESETS[0].url,
      badge: 'Commercial Grade',
      title: 'Equip Your Kitchen for Success',
      description: 'Commercial-grade catering equipment from leading brands.',
      order: 0,
      active: true,
      link: '/products',
    };
    const reordered = [newBanner, ...banners].map((b, i) => ({ ...b, order: i }));
    setBanners(reordered);
    notify.info('Added new banner slide');
  };

  const updateBanner = (id: string, field: keyof BannerSlide, value: string | boolean) => {
    setBanners(banners.map(banner => 
      banner.id === id ? { ...banner, [field]: value } : banner
    ));
  };

  const toggleBannerActive = (id: string) => {
    setBanners(banners.map(banner => 
      banner.id === id ? { ...banner, active: !banner.active } : banner
    ));
  };

  const deleteBanner = (id: string) => {
    setBanners(banners.filter(b => b.id !== id));
    notify.info('Banner removed');
  };

  const cleanupInvalidBanners = () => {
    const validBanners = banners.filter(b => 
      b.image && 
      b.image.trim() !== '' && 
      !b.image.includes('placeholder') &&
      (b.image.startsWith('http') || b.image.startsWith('data:'))
    );
    
    const removedCount = banners.length - validBanners.length;
    setBanners(validBanners);
    notify.info(`Removed ${removedCount} invalid banner(s). Click "Save All" to apply.`);
  };

  const moveBanner = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newBanners = [...banners];
      [newBanners[index], newBanners[index - 1]] = [newBanners[index - 1], newBanners[index]];
      setBanners(newBanners.map((b, i) => ({ ...b, order: i })));
    } else if (direction === 'down' && index < banners.length - 1) {
      const newBanners = [...banners];
      [newBanners[index], newBanners[index + 1]] = [newBanners[index + 1], newBanners[index]];
      setBanners(newBanners.map((b, i) => ({ ...b, order: i })));
    }
  };

  const handleImageUpload = async (bannerId: string, file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify.warning('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      notify.warning('Image size must be less than 5MB');
      return;
    }

    setUploadingImage(bannerId);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/banners/upload`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        body: formData,
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Upload failed');
      }

      const { url } = await response.json();
      updateBanner(bannerId, 'image', url);
      notify.success('Image uploaded successfully!');
    } catch (error: any) {
      console.error('Image upload error:', error);
      notify.error('Failed to upload image: ' + (error?.message || 'Unknown error'));
    } finally {
      setUploadingImage(null);
    }
  };

  const activeCount = banners.filter(b => b.active !== false).length;
  const inactiveCount = banners.filter(b => b.active === false).length;

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <LayoutTemplate className="size-6 text-[#E31837]" />
            Banners Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage storefront homepage hero carousel slides, promo badges, and direct links
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <button
            onClick={cleanupInvalidBanners}
            className="h-10 px-4 bg-white border border-rose-200 text-[#E31837] hover:bg-rose-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="size-4" />
            Remove Invalid
          </button>
          <button
            onClick={addBanner}
            className="h-10 px-4 bg-white border border-slate-200 text-[#0f172a] hover:bg-slate-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-4 text-[#E31837]" />
            Add Banner
          </button>
          <button
            onClick={saveBanners}
            disabled={saving || loading}
            className="h-10 px-5 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
          >
            <Save className="size-4" />
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Homepage Carousel Sync:</strong> Active banners rotate automatically on the main storefront homepage. Click <strong>Save All Changes</strong> to update live banners immediately.
        </div>
      </div>

      {/* Banners List Section */}
      <div className="space-y-4">
        {banners.length === 0 ? (
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardContent className="p-12 text-center space-y-3">
              <ImageIcon className="size-12 text-slate-300 mx-auto" />
              <h3 className="text-base font-extrabold text-[#0f172a]">No Banners Configured</h3>
              <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto">
                Add your first promotional banner slide to display in the main homepage carousel.
              </p>
              <button
                onClick={addBanner}
                className="h-10 px-5 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold text-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="size-4" />
                Add First Banner
              </button>
            </CardContent>
          </Card>
        ) : (
          banners.map((banner, index) => {
            const isBannerActive = banner.active !== false;

            return (
              <Card key={banner.id} className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden transition-all hover:border-slate-300">
                {/* Banner Header */}
                <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="size-7 rounded-lg bg-[#2D3748] text-white flex items-center justify-center text-xs font-black">
                      #{index + 1}
                    </span>
                    <CardTitle className="text-base text-[#2D3748] font-extrabold truncate max-w-xs sm:max-w-md">
                      {banner.title || `Banner Slide #${index + 1}`}
                    </CardTitle>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase border ${
                      isBannerActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {isBannerActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleBannerActive(banner.id)}
                      className={`h-8 px-2.5 rounded-lg text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isBannerActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                      title={isBannerActive ? 'Click to hide banner' : 'Click to show banner'}
                    >
                      {isBannerActive ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                      <span className="hidden sm:inline">{isBannerActive ? 'Visible' : 'Hidden'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBanner(index, 'up')}
                      disabled={index === 0}
                      className="size-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                      title="Move Up"
                    >
                      <MoveUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveBanner(index, 'down')}
                      disabled={index === banners.length - 1}
                      className="size-8 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                      title="Move Down"
                    >
                      <MoveDown className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBanner(banner.id)}
                      className="size-8 rounded-lg bg-rose-50 border border-rose-200 text-[#E31837] hover:bg-rose-100 flex items-center justify-center cursor-pointer ml-1"
                      title="Delete Banner"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                    {/* Settings Form Column */}
                    <div className="space-y-3.5">
                      {/* Image URL & File Upload */}
                      <div>
                        <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Image URL / Upload</label>
                        <div className="flex gap-2">
                          <Input
                            value={banner.image || ''}
                            onChange={(e) => updateBanner(banner.id, 'image', e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="flex-1 h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                          />
                          <button
                            type="button"
                            onClick={() => document.getElementById(`file-${banner.id}`)?.click()}
                            disabled={uploadingImage === banner.id}
                            className="h-9 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <Upload className="size-3.5 text-[#E31837]" />
                            <span>{uploadingImage === banner.id ? 'Uploading...' : 'Upload'}</span>
                          </button>
                          <input
                            type="file"
                            id={`file-${banner.id}`}
                            className="hidden"
                            accept="image/*"
                            onChange={(e) => handleImageUpload(banner.id, e.target.files?.[0] as File)}
                          />
                        </div>

                        {/* Presets */}
                        <div className="mt-2 space-y-1">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Presets:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {BANNER_PRESETS.map((preset, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => updateBanner(banner.id, 'image', preset.url)}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border transition-all cursor-pointer ${
                                  banner.image === preset.url
                                    ? 'bg-[#E31837] text-white border-[#E31837]'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                {preset.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Badge & Link Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Badge Pill Text</label>
                          <Input
                            value={banner.badge || ''}
                            onChange={(e) => updateBanner(banner.id, 'badge', e.target.value)}
                            placeholder="e.g. Professional Equipment"
                            className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Link URL (Shop Button)</label>
                          <Input
                            value={banner.link || ''}
                            onChange={(e) => updateBanner(banner.id, 'link', e.target.value)}
                            placeholder="/products or /brands/Polar"
                            className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                          />
                        </div>
                      </div>

                      {/* Banner Title */}
                      <div>
                        <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Banner Main Title</label>
                        <Input
                          value={banner.title || ''}
                          onChange={(e) => updateBanner(banner.id, 'title', e.target.value)}
                          placeholder="Equip Your Kitchen for Success"
                          className="h-9 text-xs sm:text-sm font-extrabold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Banner Description</label>
                        <Textarea
                          value={banner.description || ''}
                          onChange={(e) => updateBanner(banner.id, 'description', e.target.value)}
                          placeholder="Commercial-grade catering equipment from leading brands..."
                          rows={2}
                          className="p-2.5 text-xs font-medium border-slate-200 focus:border-[#E31837] focus:ring-[#E31837] rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Live Banner Mockup Column */}
                    <div>
                      <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Storefront Banner Preview</label>
                      <div className="relative bg-slate-900 rounded-xl overflow-hidden min-h-[220px] border border-slate-200 shadow-md flex items-center p-5 sm:p-6">
                        {banner.image ? (
                          <div className="absolute inset-0">
                            <img 
                              src={banner.image}
                              alt={banner.title || 'Banner'}
                              className="w-full h-full object-cover opacity-40"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-transparent" />
                          </div>
                        ) : null}

                        <div className="relative z-10 space-y-2 max-w-md">
                          {banner.badge && (
                            <span className="inline-block px-2.5 py-0.5 bg-[#E31837] text-white text-[9px] font-black uppercase tracking-wider rounded">
                              {banner.badge}
                            </span>
                          )}
                          <h3 className="text-white text-lg sm:text-xl font-black leading-tight">
                            {banner.title || 'Banner Title Placeholder'}
                          </h3>
                          <p className="text-white/80 text-xs font-medium line-clamp-2 leading-relaxed">
                            {banner.description || 'Banner description placeholder...'}
                          </p>

                          {banner.link && (
                            <div className="pt-2">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#E31837] text-white rounded-lg text-[10px] font-black uppercase tracking-wider shadow-xs">
                                SHOP NOW
                                <ExternalLink className="size-3" />
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}