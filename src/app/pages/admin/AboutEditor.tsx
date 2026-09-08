import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { 
  Loader2, 
  Save, 
  Eye, 
  AlertCircle, 
  CheckCircle2, 
  FileText, 
  ArrowLeft, 
  Type, 
  Link2,
  RefreshCw,
  Info,
  Sparkles,
  Clock
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { notify } from '../../utils/notifications';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

const DEFAULT_CONTENT = `
<h1 style="text-align: center; color: #0f172a; font-weight: 900;">About Costplus100</h1>

<p style="font-size: 1.125rem; line-height: 1.75rem; color: #334155;">
  We are a group of highly experienced catering industry suppliers with more than 30 years of combined industry knowledge.
  After supplying some of Australia's biggest organisations, we came together to create a fresh business model designed to
  benefit everyday consumers, cafés, caterers, and businesses alike.
</p>

<p style="font-size: 1.125rem; line-height: 1.75rem; color: #334155;">
  Over the years, we have supplied major organisations including <strong>Coles Group, Woolworths Group, The Coffee Club</strong>,
  and state councils — just to name a few.
</p>

<div style="background-color: rgba(227, 24, 55, 0.05); border-left: 4px solid #E31837; padding: 1.5rem; margin: 2rem 0; border-radius: 0.5rem;">
  <p style="font-size: 1.25rem; font-weight: bold; color: #0f172a; margin: 0;">
    Our goal is simple:<br>
    bring honesty, transparency, and fair pricing back into the industry.
  </p>
</div>

<h2 style="margin-top: 2.5rem; color: #0f172a; font-weight: 800;">A Different Way of Doing Business</h2>

<p style="font-size: 1.125rem; line-height: 1.75rem; color: #334155;">
  Think of us as a <strong>buying club without the membership fees</strong>, hidden catches, or marketing gimmicks.
</p>

<p style="font-size: 1.125rem; line-height: 1.75rem; color: #334155;">
  We operate on a straightforward and publicly declared pricing model:
</p>

<div style="background-color: #0f172a; color: white; padding: 2rem; border-radius: 0.75rem; margin: 1.5rem 0; text-align: center;">
  <p style="font-size: 2rem; font-weight: 900; margin-bottom: 0.75rem; color: #ffffff;">
    Cost Price + $100 Markup
  </p>
  <p style="font-size: 1.25rem; margin: 0; color: #e2e8f0;">No more.</p>
</div>

<p style="font-size: 1.125rem; line-height: 1.75rem; color: #334155;">
  That means when you contact us, we will provide you with the <strong>true cost price</strong> plus our fixed $100 margin —
  what many would call "mates rates."
</p>

<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0;">
  <div style="background-color: #f8fafc; padding: 1rem; border-radius: 0.5rem; text-align: center; border: 1px solid #e2e8f0;">
    <p style="font-weight: bold; color: #E31837; font-size: 1.125rem; margin: 0;">No inflated margins</p>
  </div>
  <div style="background-color: #f8fafc; padding: 1rem; border-radius: 0.5rem; text-align: center; border: 1px solid #e2e8f0;">
    <p style="font-weight: bold; color: #E31837; font-size: 1.125rem; margin: 0;">No hidden fees</p>
  </div>
  <div style="background-color: #f8fafc; padding: 1rem; border-radius: 0.5rem; text-align: center; border: 1px solid #e2e8f0;">
    <p style="font-weight: bold; color: #E31837; font-size: 1.125rem; margin: 0;">No bull</p>
  </div>
</div>

<h2 style="margin-top: 2.5rem; color: #0f172a; font-weight: 800;">Total Transparency</h2>

<p style="font-size: 1.125rem; line-height: 1.75rem; color: #334155;">
  We believe customers deserve to know exactly what they are paying for. That's why we openly declare our pricing structure and publicly invite Fair Trading authorities to review any sale at any time.
</p>

<div style="background: linear-gradient(to right, #E31837, #c41530); color: white; padding: 2rem; border-radius: 0.75rem; margin: 2rem 0; text-align: center;">
  <p style="font-size: 1.5rem; font-weight: 900; margin: 0;">
    Simple, fair, and transparent — the way business should be.
  </p>
</div>
`;

export function AboutEditor() {
  const [content, setContent] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    fetchAboutContent();
  }, []);

  const fetchAboutContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_URL}/cms/about-content`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          setContent(data.content);
          setLastUpdated(data.lastUpdated || '');
        } else {
          setContent(DEFAULT_CONTENT);
        }
      } else {
        setContent(DEFAULT_CONTENT);
      }
    } catch (err) {
      console.error('Error fetching About content:', err);
      setContent(DEFAULT_CONTENT);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`${API_URL}/cms/about-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          content: content,
          lastUpdated: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save About content');
      }

      const now = new Date().toISOString();
      setLastUpdated(now);
      notify.success('About Us page saved successfully!');
    } catch (err: any) {
      console.error('Error saving About content:', err);
      notify.error('Failed to save About content: ' + (err?.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const loadDefaultContent = () => {
    setContent(DEFAULT_CONTENT);
    notify.info('Loaded default About Us template');
  };

  // Quill editor configuration
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'indent': '-1'}, { 'indent': '+1' }],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'align': [] }],
      ['link'],
      ['clean']
    ],
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'color', 'background',
    'align',
    'link'
  ];

  const wordCount = useMemo(() => {
    return content.replace(/<[^>]*>?/gm, '').split(/\s+/).filter(word => word.length > 0).length;
  }, [content]);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[400px] space-y-3">
        <Loader2 className="size-8 animate-spin text-[#E31837]" />
        <p className="text-xs font-bold text-slate-500">Loading About Us editor...</p>
      </div>
    );
  }

  if (previewMode) {
    return (
      <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
        {/* Header Bar */}
        <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
              <Eye className="size-6 text-[#E31837]" />
              About Us Live Storefront Preview
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Preview how your About Us page appears to storefront visitors
            </p>
          </div>

          <button
            onClick={() => setPreviewMode(false)}
            className="h-10 px-5 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold transition-all shadow-2xs flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
          >
            <ArrowLeft className="size-4" />
            Back to Editor
          </button>
        </div>

        {/* Live Browser Window Mockup */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="bg-slate-100 px-3.5 py-2 border-b border-slate-200 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400 border border-red-500/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border border-amber-500/20" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400 border border-green-500/20" />
            </div>
            <div className="mx-auto bg-white rounded-md px-8 py-0.5 text-[10px] text-slate-400 font-bold border border-slate-200/80 shadow-2xs">
              costplus100.com.au/about
            </div>
          </div>
          
          <div className="p-4 sm:p-8 md:p-12 bg-white flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto">
              <div
                className="prose prose-slate max-w-none text-slate-800 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <FileText className="size-6 text-[#E31837]" />
            About Us Editor
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Edit rich HTML content and company values for your About Us storefront page
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 shrink-0">
          {lastUpdated && (
            <span className="h-10 px-3 bg-slate-100 border border-slate-200 rounded-xl text-[#0f172a] text-[10px] font-extrabold tracking-wider uppercase inline-flex items-center gap-1.5 shrink-0">
              <Clock className="size-3.5 text-[#E31837]" />
              Updated: {new Date(lastUpdated).toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadDefaultContent}
            className="h-10 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <RefreshCw className="size-4 text-[#E31837]" />
            Load Default
          </button>
          <button
            onClick={() => setPreviewMode(true)}
            className="h-10 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Eye className="size-4 text-blue-600" />
            Preview Page
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="h-10 px-5 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50 shrink-0"
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
          <strong>Rich Content Editor:</strong> Use the rich text toolbar below to format headings, bullet lists, custom callout boxes, and links. Click <strong>Preview Page</strong> to verify your layout.
        </div>
      </div>

      {/* Main Grid Section */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-start">
        {/* Editor Container */}
        <div className="lg:col-span-3">
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Sparkles className="size-5 text-[#E31837]" />
                About Page Content Editor
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 font-medium">
                Format your company story, brand guarantees, and pricing philosophy
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 bg-white">
              <div className="quill-editor-wrapper">
                <ReactQuill
                  theme="snow"
                  value={content}
                  onChange={setContent}
                  modules={modules}
                  formats={formats}
                  style={{ minHeight: '480px' }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-4">
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-black text-[#0f172a] uppercase tracking-wider">
                Content Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold">
                  <Type className="size-5 text-[#E31837]" />
                </div>
                <div>
                  <div className="text-xl font-black text-[#0f172a] leading-none">{wordCount}</div>
                  <div className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider mt-1">Total Word Count</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-black text-[#0f172a] uppercase tracking-wider">
                SEO & Content Quality Checklist
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 font-semibold">Include main H1 heading</p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-700 font-semibold">Detail Cost Plus $100 model</p>
              </div>
              <div className="flex items-start gap-2.5">
                {content.includes('<a ') || content.includes('href') ? (
                  <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <Link2 className="size-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <p className="text-xs text-slate-700 font-semibold">Include internal storefront links</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

