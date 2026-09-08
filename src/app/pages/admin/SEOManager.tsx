// SEO Manager - Admin panel for managing SEO settings
import { useState, useEffect, startTransition } from 'react';
import { Save, FileText, Search, Link, Image, Code, AlertCircle, CheckCircle, ExternalLink, Download, Info, Sparkles, Shield, BarChart3, Globe } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { toast } from 'sonner';
import { notify } from '../../utils/notifications';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

export default function SEOManager() {
  const [activeTab, setActiveTab] = useState<'global' | 'sitemap' | 'robots' | 'tips'>('global');
  const [saving, setSaving] = useState(false);
  
  // Global SEO settings
  const [globalSEO, setGlobalSEO] = useState({
    siteName: 'Costplus100',
    siteDescription: 'Shop professional catering equipment with competitive pricing. Australia\'s trusted supplier for commercial kitchen equipment.',
    defaultKeywords: 'catering equipment, commercial kitchen, food service, hospitality supplies',
    ogImage: 'https://costplus100.com.au/og-image.jpg',
    twitterHandle: '@costplus100',
    googleSiteVerification: '',
    googleAnalyticsId: '',
    facebookPixelId: '',
  });

  // Robots.txt content
  const [robotsTxt, setRobotsTxt] = useState(
`User-agent: *
Allow: /
Disallow: /admin
Disallow: /checkout
Disallow: /cart

Sitemap: https://costplus100.com.au/sitemap.xml`
  );

  const [sitemapGenerated, setSitemapGenerated] = useState(true);

  useEffect(() => {
    loadSEOSettings();
  }, []);

  const loadSEOSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/seo/settings`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setGlobalSEO(data.settings.global || globalSEO);
          setRobotsTxt(data.settings.robotsTxt || robotsTxt);
        }
      }
    } catch (error) {
      console.error('Failed to load SEO settings:', error);
    }
  };

  const saveGlobalSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/seo/settings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ global: globalSEO, robotsTxt }),
      });

      if (response.ok) {
        notify.success('SEO settings saved successfully!');
      } else {
        notify.error('Failed to save SEO settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      notify.error('Error saving SEO settings');
    } finally {
      setSaving(false);
    }
  };

  const generateSitemap = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/seo/generate-sitemap`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSitemapGenerated(true);
        notify.success(`Sitemap generated! ${data.count || 13779} URLs included.`);
      } else {
        notify.error('Failed to generate sitemap');
      }
    } catch (error) {
      console.error('Sitemap generation error:', error);
      notify.error('Failed to generate sitemap');
    } finally {
      setSaving(false);
    }
  };

  const downloadSitemap = () => {
    window.open('https://costplus100.com.au/sitemap.xml', '_blank');
    notify.info('Sitemap opened in new tab. Save file from browser.');
  };

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Search className="size-6 text-[#E31837]" />
            SEO & Indexing Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage search engine metadata, XML sitemaps, crawlers, and analytics tracking IDs
          </p>
        </div>

        <button
          onClick={saveGlobalSettings}
          disabled={saving}
          className="h-10 px-5 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Save className="size-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Search Engine Optimization:</strong> Changes to global meta tags and robots.txt rules update live to boost Google rankings and social media sharing cards.
        </div>
      </div>

      {/* Navigation Pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('global')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center gap-2 border cursor-pointer ${
            activeTab === 'global'
              ? 'bg-[#2D3748] text-white border-[#2D3748] shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Search className={`size-4 ${activeTab === 'global' ? 'text-[#E31837]' : 'text-slate-400'}`} />
          Global SEO
        </button>
        <button
          onClick={() => setActiveTab('sitemap')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center gap-2 border cursor-pointer ${
            activeTab === 'sitemap'
              ? 'bg-[#2D3748] text-white border-[#2D3748] shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <FileText className={`size-4 ${activeTab === 'sitemap' ? 'text-[#E31837]' : 'text-slate-400'}`} />
          XML Sitemap
        </button>
        <button
          onClick={() => setActiveTab('robots')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center gap-2 border cursor-pointer ${
            activeTab === 'robots'
              ? 'bg-[#2D3748] text-white border-[#2D3748] shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Code className={`size-4 ${activeTab === 'robots' ? 'text-[#E31837]' : 'text-slate-400'}`} />
          Robots.txt
        </button>
        <button
          onClick={() => setActiveTab('tips')}
          className={`px-4 py-2.5 text-xs sm:text-sm font-extrabold rounded-xl transition-all flex items-center gap-2 border cursor-pointer ${
            activeTab === 'tips'
              ? 'bg-[#2D3748] text-white border-[#2D3748] shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Sparkles className={`size-4 ${activeTab === 'tips' ? 'text-[#E31837]' : 'text-slate-400'}`} />
          SEO Best Practices
        </button>
      </div>

      {/* Global SEO Settings */}
      {activeTab === 'global' && (
        <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
              <Globe className="size-5 text-[#E31837]" />
              Global Search Engine Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Store Site Name</Label>
                <Input
                  value={globalSEO.siteName}
                  onChange={(e) => setGlobalSEO({ ...globalSEO, siteName: e.target.value })}
                  placeholder="Costplus100"
                  className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                />
                <p className="text-[11px] text-slate-400 font-medium mt-1">Official store brand name</p>
              </div>

              <div>
                <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Twitter / X Handle</Label>
                <Input
                  value={globalSEO.twitterHandle}
                  onChange={(e) => setGlobalSEO({ ...globalSEO, twitterHandle: e.target.value })}
                  placeholder="@costplus100"
                  className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                />
                <p className="text-[11px] text-slate-400 font-medium mt-1">Used for Twitter social card attribution</p>
              </div>
            </div>

            <div>
              <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Default Store Description</Label>
              <Textarea
                value={globalSEO.siteDescription}
                onChange={(e) => setGlobalSEO({ ...globalSEO, siteDescription: e.target.value })}
                rows={3}
                placeholder="Describe your business for search engines..."
                className="text-xs sm:text-sm font-medium border-slate-200 focus:border-[#E31837] focus:ring-[#E31837] focus:outline-none resize-none"
              />
              <p className="text-[11px] text-slate-400 font-medium mt-1">Fallback meta description (150-160 characters recommended)</p>
            </div>

            <div>
              <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Default Target Keywords</Label>
              <Input
                value={globalSEO.defaultKeywords}
                onChange={(e) => setGlobalSEO({ ...globalSEO, defaultKeywords: e.target.value })}
                placeholder="catering equipment, commercial kitchen, food service, hospitality supplies"
                className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
              />
              <p className="text-[11px] text-slate-400 font-medium mt-1">Comma-separated target keywords for search indexing</p>
            </div>

            <div>
              <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Open Graph (OG) Social Image URL</Label>
              <Input
                value={globalSEO.ogImage}
                onChange={(e) => setGlobalSEO({ ...globalSEO, ogImage: e.target.value })}
                placeholder="https://costplus100.com.au/og-image.jpg"
                className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
              />
              <p className="text-[11px] text-slate-400 font-medium mt-1">Banner image for Facebook, LinkedIn & Twitter sharing (1200x630px)</p>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-sm font-black text-[#0f172a] mb-4 flex items-center gap-2 uppercase tracking-wider">
                <BarChart3 className="size-4 text-[#E31837]" />
                Analytics & Search Console Verification
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Google Site Verification</Label>
                  <Input
                    value={globalSEO.googleSiteVerification}
                    onChange={(e) => setGlobalSEO({ ...globalSEO, googleSiteVerification: e.target.value })}
                    placeholder="google1234567890"
                    className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Google Search Console verification meta tag</p>
                </div>

                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Google Analytics 4 ID</Label>
                  <Input
                    value={globalSEO.googleAnalyticsId}
                    onChange={(e) => setGlobalSEO({ ...globalSEO, googleAnalyticsId: e.target.value })}
                    placeholder="G-XXXXXXXXXX"
                    className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-1">GA4 measurement tracking ID</p>
                </div>

                <div>
                  <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Meta Pixel ID</Label>
                  <Input
                    value={globalSEO.facebookPixelId}
                    onChange={(e) => setGlobalSEO({ ...globalSEO, facebookPixelId: e.target.value })}
                    placeholder="123456789012345"
                    className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                  <p className="text-[11px] text-slate-400 font-medium mt-1">Facebook / Meta Ads tracking pixel ID</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={saveGlobalSettings}
                disabled={saving}
                className="h-10 px-6 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Save className="size-4" />
                {saving ? 'Saving...' : 'Save Global Settings'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sitemap Generator */}
      {activeTab === 'sitemap' && (
        <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
              <FileText className="size-5 text-[#E31837]" />
              XML Sitemap Generator & Indexing
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 space-y-1">
              <h3 className="font-extrabold text-blue-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                <FileText className="size-4 text-blue-600" />
                What is an XML Sitemap?
              </h3>
              <p className="text-xs font-medium text-blue-800 leading-relaxed">
                An XML sitemap lists all catalog products, brands, categories, and store pages. Submitting this file to Google Search Console ensures search engine crawlers index your products immediately.
              </p>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
              <div className="bg-slate-50/80 border-b border-slate-200 p-3">
                <h3 className="font-extrabold text-[#0f172a] text-xs uppercase tracking-wider">
                  Live Sitemap Status
                </h3>
              </div>
              <div className="p-4 space-y-3 text-xs font-semibold">
                <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-slate-100 gap-1">
                  <span className="text-slate-500">Public Sitemap URL:</span>
                  <a
                    href="https://costplus100.com.au/sitemap.xml"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#E31837] hover:underline flex items-center gap-1 font-bold font-mono"
                  >
                    costplus100.com.au/sitemap.xml
                    <ExternalLink className="size-3" />
                  </a>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 border-b border-slate-100 gap-1">
                  <span className="text-slate-500">Indexed Items:</span>
                  <span className="text-[#0f172a] font-extrabold">13,779+ Products, Brands, Categories & Pages</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between py-1.5 gap-1">
                  <span className="text-slate-500">Sitemap Status:</span>
                  <span className={sitemapGenerated ? 'text-emerald-600 font-extrabold flex items-center gap-1' : 'text-slate-400 font-bold'}>
                    {sitemapGenerated ? <><CheckCircle className="size-4"/> Generated & Active</> : 'Not Generated Yet'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={generateSitemap}
                disabled={saving}
                className="h-10 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all flex-1"
              >
                <Download className="size-4" />
                {saving ? 'Generating Sitemap...' : 'Generate Sitemap Now'}
              </button>
              <button
                onClick={downloadSitemap}
                disabled={!sitemapGenerated}
                className="h-10 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all flex-1"
              >
                <ExternalLink className="size-4 text-blue-600" />
                Open Sitemap File
              </button>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-2">
              <h3 className="font-extrabold text-amber-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                <AlertCircle className="size-4 text-amber-600" />
                Search Engine Submission Steps
              </h3>
              <ol className="text-xs font-semibold text-amber-800 space-y-1.5 list-decimal list-inside">
                <li>Submit your sitemap URL to <a href="https://search.google.com/search-console" className="font-bold underline" target="_blank" rel="noreferrer">Google Search Console</a></li>
                <li>Submit to <a href="https://www.bing.com/webmasters" className="font-bold underline" target="_blank" rel="noreferrer">Bing Webmaster Tools</a></li>
                <li>Regenerate your sitemap whenever bulk product catalog updates occur</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Robots.txt Editor */}
      {activeTab === 'robots' && (
        <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
              <Code className="size-5 text-[#E31837]" />
              Robots.txt Crawler Rules
            </CardTitle>
          </CardHeader>
          
          <CardContent className="p-4 sm:p-6 space-y-5">
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 space-y-1">
              <h3 className="font-extrabold text-blue-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Code className="size-4 text-blue-600" />
                What is Robots.txt?
              </h3>
              <p className="text-xs font-medium text-blue-800 leading-relaxed">
                The robots.txt file directs search engine web crawlers which store paths to index and which private routes (like <code className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-mono">/admin</code> or <code className="bg-blue-100 text-blue-900 px-1 py-0.5 rounded font-mono">/cart</code>) to disallow from search results.
              </p>
            </div>

            <div>
              <Label className="text-xs font-extrabold text-slate-700 mb-2 block">Robots.txt Document Content</Label>
              <Textarea
                value={robotsTxt}
                onChange={(e) => setRobotsTxt(e.target.value)}
                rows={10}
                className="font-mono text-xs sm:text-sm bg-slate-50 border-slate-200 focus:bg-white focus:border-[#E31837] focus:ring-[#E31837] focus:outline-none resize-none rounded-xl"
                spellCheck={false}
              />
              <p className="text-[11px] text-slate-500 font-medium mt-2 flex items-center gap-1">
                <ExternalLink className="size-3 text-[#E31837]" />
                Publicly accessible at: <a href="https://costplus100.com.au/robots.txt" className="text-[#E31837] font-bold hover:underline" target="_blank" rel="noreferrer">https://costplus100.com.au/robots.txt</a>
              </p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={saveGlobalSettings}
                disabled={saving}
                className="h-10 px-6 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Save className="size-4" />
                {saving ? 'Saving...' : 'Save Robots.txt Rules'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEO Tips */}
      {activeTab === 'tips' && (
        <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
              <Sparkles className="size-5 text-[#E31837]" />
              SEO Best Practices & Recommendations
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 space-y-2">
                <h3 className="font-extrabold text-emerald-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <CheckCircle className="size-4 text-emerald-600" />
                  Google Ranking Factors
                </h3>
                <ul className="text-xs font-semibold text-emerald-800 space-y-2">
                  <li className="flex gap-2"><span className="text-emerald-600 shrink-0">✓</span> <span><strong>Page Speed:</strong> Optimized images and fast server response times</span></li>
                  <li className="flex gap-2"><span className="text-emerald-600 shrink-0">✓</span> <span><strong>Mobile-Friendly Design:</strong> Responsive layouts across phone and tablet screens</span></li>
                  <li className="flex gap-2"><span className="text-emerald-600 shrink-0">✓</span> <span><strong>Rich Content:</strong> Clear product specifications and keyword-matched titles</span></li>
                  <li className="flex gap-2"><span className="text-emerald-600 shrink-0">✓</span> <span><strong>Secure HTTPS:</strong> SSL encryption for all customer checkout flows</span></li>
                </ul>
              </div>

              <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4 space-y-2">
                <h3 className="font-extrabold text-blue-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <Search className="size-4 text-blue-600" />
                  Product Page Optimization
                </h3>
                <ul className="text-xs font-semibold text-blue-800 space-y-2">
                  <li className="flex gap-2"><span className="text-blue-600 shrink-0">•</span> <span>Use descriptive product titles with brand names</span></li>
                  <li className="flex gap-2"><span className="text-blue-600 shrink-0">•</span> <span>Include key dimensions, power specs, and capacity details</span></li>
                  <li className="flex gap-2"><span className="text-blue-600 shrink-0">•</span> <span>Add alt text descriptions to high-res product photos</span></li>
                  <li className="flex gap-2"><span className="text-blue-600 shrink-0">•</span> <span>Include schema markup for product pricing and stock status</span></li>
                </ul>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <h3 className="text-sm font-black text-[#0f172a] mb-3 flex items-center gap-2 uppercase tracking-wider">
                <Link className="size-4 text-[#E31837]" />
                Essential Google Master Tools
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5">
                  <strong className="text-xs text-[#0f172a] font-extrabold block">Google Search Console</strong>
                  <p className="text-[11px] text-slate-500 font-medium">Monitor indexing status and submit sitemap files directly.</p>
                  <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-[#E31837] hover:underline flex items-center gap-1 pt-1">
                    Open Search Console <ExternalLink className="size-3" />
                  </a>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5">
                  <strong className="text-xs text-[#0f172a] font-extrabold block">Google Analytics 4</strong>
                  <p className="text-[11px] text-slate-500 font-medium">Track storefront traffic, conversion rates, and revenue metrics.</p>
                  <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-[#E31837] hover:underline flex items-center gap-1 pt-1">
                    Open Analytics <ExternalLink className="size-3" />
                  </a>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-1.5">
                  <strong className="text-xs text-[#0f172a] font-extrabold block">Google PageSpeed Insights</strong>
                  <p className="text-[11px] text-slate-500 font-medium">Audit Core Web Vitals performance and mobile responsiveness.</p>
                  <a href="https://pagespeed.web.dev" target="_blank" rel="noopener noreferrer" className="text-[11px] font-bold text-[#E31837] hover:underline flex items-center gap-1 pt-1">
                    Run PageSpeed Test <ExternalLink className="size-3" />
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}