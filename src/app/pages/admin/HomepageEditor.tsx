import { useState, useEffect } from 'react';
import { useCMS } from '../../context/CMSContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  Save, 
  Plus, 
  Trash2, 
  LayoutTemplate, 
  Sparkles, 
  Image as ImageIcon,
  Shield, 
  Clock, 
  Headphones, 
  Truck, 
  Award, 
  Star,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Eye,
  RefreshCw,
  Info
} from 'lucide-react';
import { notify } from '../../utils/notifications';

const defaultHomepage = {
  hero: {
    title: 'Equip Your Kitchen for Success',
    subtitle: 'Commercial-grade catering equipment from leading brands. Quality you can trust, prices you\'ll love.',
    image: 'https://images.unsplash.com/photo-1767785990437-dfe1fe516fe8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBjb21tZXJjaWFsJTIwa2l0Y2hlbiUyMHJlc3RhdXJhbnR8ZW58MXx8fHwxNzc0NDE0ODIyfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
  },
  features: [
    {
      icon: 'shield',
      title: 'Commercial Grade',
      description: 'All equipment meets NSF and professional kitchen standards',
    },
    {
      icon: 'clock',
      title: 'Fast Delivery',
      description: 'Quick dispatch and reliable shipping to get you operational fast',
    },
    {
      icon: 'headphones',
      title: 'Expert Guidance',
      description: 'Our specialists help you choose the right equipment for your needs',
    },
  ],
};

const IMAGE_PRESETS = [
  { label: 'Commercial Kitchen', url: 'https://images.unsplash.com/photo-1767785990437-dfe1fe516fe8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  { label: 'Stainless Refrigeration', url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
  { label: 'Professional Oven', url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080' },
];

const normalizeHomepage = (rawHomepage: any) => {
  if (!rawHomepage || typeof rawHomepage !== 'object') {
    return defaultHomepage;
  }

  const hero = {
    title: typeof rawHomepage.hero?.title === 'string' ? rawHomepage.hero.title : defaultHomepage.hero.title,
    subtitle: typeof rawHomepage.hero?.subtitle === 'string' ? rawHomepage.hero.subtitle : defaultHomepage.hero.subtitle,
    image: typeof rawHomepage.hero?.image === 'string' ? rawHomepage.hero.image : defaultHomepage.hero.image,
  };

  const features = Array.isArray(rawHomepage.features)
    ? rawHomepage.features.map((f: any) => ({
        icon: typeof f?.icon === 'string' ? f.icon : 'shield',
        title: typeof f?.title === 'string' ? f.title : 'Feature Title',
        description: typeof f?.description === 'string' ? f.description : 'Feature description...',
      }))
    : defaultHomepage.features;

  return { hero, features };
};

export function HomepageEditor() {
  let cmsData: any = null;
  let updateHomePageFunc: any = null;

  try {
    const cms = useCMS();
    cmsData = cms?.data;
    updateHomePageFunc = cms?.updateHomePage;
  } catch (e) {
    console.error('HomepageEditor: CMSProvider not available');
  }

  const [homepage, setHomepage] = useState(() => normalizeHomepage(cmsData?.homepage));
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  // Sync state when CMSContext loads or updates data asynchronously
  useEffect(() => {
    if (cmsData?.homepage) {
      setHomepage(normalizeHomepage(cmsData.homepage));
    }
  }, [cmsData?.homepage]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (updateHomePageFunc) {
        await updateHomePageFunc(homepage);
        const now = new Date().toLocaleTimeString();
        setLastSaved(now);
        notify.success('Homepage settings saved successfully!');
      } else {
        notify.error('CMS Provider unavailable');
      }
    } catch (error: any) {
      console.error('Failed to save homepage:', error);
      notify.error('Failed to save homepage', error.message || 'Unknown error');
    } finally {
      setSaving(false);
    }
  };

  const updateHeroField = (field: 'title' | 'subtitle' | 'image', value: string) => {
    setHomepage((prev) => ({
      ...prev,
      hero: {
        ...(prev.hero || defaultHomepage.hero),
        [field]: value,
      },
    }));
  };

  const addFeature = () => {
    setHomepage((prev) => ({
      ...prev,
      features: [
        ...(prev.features || []),
        { icon: 'star', title: 'New Feature', description: 'Feature description...' },
      ],
    }));
  };

  const updateFeature = (index: number, field: 'icon' | 'title' | 'description', value: string) => {
    setHomepage((prev) => {
      const newFeatures = [...(prev.features || [])];
      newFeatures[index] = {
        ...(newFeatures[index] || { icon: 'shield', title: '', description: '' }),
        [field]: value,
      };
      return { ...prev, features: newFeatures };
    });
  };

  const moveFeature = (index: number, direction: 'up' | 'down') => {
    const newFeatures = [...(homepage?.features || [])];
    if (direction === 'up' && index > 0) {
      [newFeatures[index], newFeatures[index - 1]] = [newFeatures[index - 1], newFeatures[index]];
    } else if (direction === 'down' && index < newFeatures.length - 1) {
      [newFeatures[index], newFeatures[index + 1]] = [newFeatures[index + 1], newFeatures[index]];
    }
    setHomepage(prev => ({ ...prev, features: newFeatures }));
  };

  const deleteFeature = (index: number) => {
    setHomepage((prev) => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index),
    }));
  };

  const hero = homepage?.hero || defaultHomepage.hero;
  const features = Array.isArray(homepage?.features) ? homepage.features : defaultHomepage.features;

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Banner Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <LayoutTemplate className="size-6 text-[#E31837]" />
            Homepage Editor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Customize your hero banner headline, background image, and feature highlight cards
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="h-10 px-5 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
        >
          <Save className="size-4" />
          {saving ? 'Saving Changes...' : 'Save Changes'}
        </button>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Live Preview Sync:</strong> Any changes made to Hero Title, Subtitle, or Feature items are rendered instantly in the Live Preview frame on the right.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {/* Settings Form Column */}
        <div className="space-y-4">
          {/* Hero Section Card */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Sparkles className="size-5 text-[#E31837]" />
                Hero Section Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-5">
              <div>
                <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Hero Main Title</label>
                <Input
                  value={hero.title || ''}
                  onChange={(e) => updateHeroField('title', e.target.value)}
                  placeholder="Equip Your Kitchen for Success"
                  className="h-10 text-sm font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Hero Subtitle</label>
                <textarea
                  value={hero.subtitle || ''}
                  onChange={(e) => updateHeroField('subtitle', e.target.value)}
                  className="w-full min-h-[90px] p-3 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#E31837] focus:border-[#E31837] focus:outline-none"
                  placeholder="Commercial-grade catering equipment from leading brands..."
                />
              </div>

              <div>
                <label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Hero Background Image URL</label>
                <Input
                  value={hero.image || ''}
                  onChange={(e) => updateHeroField('image', e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="h-10 text-xs sm:text-sm font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                />
                
                {/* Image Presets */}
                <div className="mt-2.5 space-y-1.5">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Or select an HD Preset image:</span>
                  <div className="flex flex-wrap gap-2">
                    {IMAGE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => updateHeroField('image', preset.url)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                          hero.image === preset.url
                            ? 'bg-[#E31837] text-white border-[#E31837]'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features Section Card */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row justify-between items-center">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Shield className="size-5 text-[#E31837]" />
                Feature Highlights ({features.length})
              </CardTitle>
              <Button
                onClick={addFeature}
                size="sm"
                variant="outline"
                className="bg-white hover:bg-slate-50 border-slate-200 text-slate-700 rounded-lg shadow-2xs font-bold text-xs"
              >
                <Plus className="size-3.5 mr-1 text-[#E31837]" />
                Add Feature
              </Button>
            </CardHeader>
            <CardContent className="space-y-3.5 p-4 sm:p-5">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="p-3.5 border border-slate-200/90 rounded-xl bg-slate-50/60 space-y-3 relative group transition-all hover:border-slate-300"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="size-6 rounded-md bg-[#2D3748] text-white flex items-center justify-center text-[10px] font-black">
                        #{index + 1}
                      </span>
                      <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                        {feature.title || `Feature ${index + 1}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveFeature(index, 'up')}
                        disabled={index === 0}
                        className="size-7 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                        title="Move Up"
                      >
                        <ChevronUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveFeature(index, 'down')}
                        disabled={index === features.length - 1}
                        className="size-7 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-900 disabled:opacity-30 flex items-center justify-center cursor-pointer"
                        title="Move Down"
                      >
                        <ChevronDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteFeature(index)}
                        className="size-7 rounded-lg bg-rose-50 border border-rose-200 text-[#E31837] hover:bg-rose-100 flex items-center justify-center cursor-pointer ml-1"
                        title="Delete Feature"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-extrabold text-slate-500 mb-1 block">Icon Key</label>
                      <Input
                        value={feature.icon || ''}
                        onChange={(e) => updateFeature(index, 'icon', e.target.value)}
                        placeholder="shield, clock, headphones"
                        className="text-xs font-mono bg-white h-9 border-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-extrabold text-slate-500 mb-1 block">Title</label>
                      <Input
                        value={feature.title || ''}
                        onChange={(e) => updateFeature(index, 'title', e.target.value)}
                        placeholder="Commercial Grade"
                        className="text-xs font-semibold bg-white h-9 border-slate-200"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-extrabold text-slate-500 mb-1 block">Description</label>
                    <textarea
                      value={feature.description || ''}
                      onChange={(e) => updateFeature(index, 'description', e.target.value)}
                      className="w-full min-h-[50px] p-2 border border-slate-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-[#E31837] focus:outline-none font-medium"
                      placeholder="Feature description..."
                    />
                  </div>
                </div>
              ))}

              {features.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-xs font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  No features configured. Click "Add Feature" to create one.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Column */}
        <div>
          <Card className="lg:sticky lg:top-24 bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center justify-between">
                <span>Storefront Live Preview</span>
                <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
                  Live View
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 bg-slate-100/60 space-y-4">
              {/* Browser Mockup Window */}
              <div className="border border-slate-200/90 rounded-xl overflow-hidden shadow-lg bg-white ring-1 ring-slate-900/5">
                {/* Browser Top Navigation Header */}
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

                {/* Hero Section Live Mockup */}
                <div className="relative bg-slate-900 text-white p-6 sm:p-8 min-h-[180px] flex items-center overflow-hidden">
                  {hero.image ? (
                    <div className="absolute inset-0">
                      <img
                        src={hero.image}
                        alt="Hero background"
                        className="w-full h-full object-cover opacity-35"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-transparent" />
                    </div>
                  ) : null}

                  <div className="relative z-10 space-y-2">
                    <span className="inline-block px-2.5 py-0.5 bg-[#E31837] text-white text-[9px] font-black uppercase tracking-wider rounded">
                      COMMERCIAL SUPPLIES
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white leading-tight">
                      {hero.title || 'Hero Title Placeholder'}
                    </h2>
                    <p className="text-xs text-slate-200 max-w-sm line-clamp-2 leading-relaxed">
                      {hero.subtitle || 'Hero Subtitle Placeholder'}
                    </p>
                    <div className="pt-2 flex items-center gap-2">
                      <span className="px-3 py-1.5 bg-[#E31837] text-white text-[11px] font-extrabold rounded-lg shadow-xs">
                        Shop Equipment →
                      </span>
                    </div>
                  </div>
                </div>

                {/* Features Highlights Live Mockup */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Feature Badges Preview
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {features.map((feature, index) => (
                      <div 
                        key={index} 
                        className="bg-white border border-slate-200/80 p-3 rounded-xl shadow-2xs flex items-start gap-3 transition-all"
                      >
                        <div className="size-8 rounded-lg bg-rose-50 text-[#E31837] flex items-center justify-center shrink-0 font-bold border border-red-100">
                          {feature.icon === 'clock' ? <Clock className="size-4" /> :
                           feature.icon === 'headphones' ? <Headphones className="size-4" /> :
                           feature.icon === 'truck' ? <Truck className="size-4" /> :
                           feature.icon === 'award' ? <Award className="size-4" /> :
                           feature.icon === 'star' ? <Star className="size-4" /> :
                           <Shield className="size-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs font-black text-slate-900 leading-tight">
                            {feature.title || 'Feature Title'}
                          </h4>
                          <p className="text-[11px] text-slate-500 font-medium leading-snug mt-0.5">
                            {feature.description || 'Feature description...'}
                          </p>
                        </div>
                      </div>
                    ))}
                    {features.length === 0 && (
                      <p className="text-xs text-slate-400 italic text-center py-2">No features configured</p>
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