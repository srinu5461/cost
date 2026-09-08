// AI Chatbot Settings - Admin configuration for the AI assistant
import { useState, useEffect } from 'react';
import { Save, Bot, MessageCircle, AlertCircle, CheckCircle, Settings as SettingsIcon, RefreshCw, KeyRound, Sparkles, Zap, Lightbulb, Info, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { projectId, publicAnonKey } from '../../../../utils/supabase/info';
import { notify } from '../../utils/notifications';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

export function AIChatbotSettings() {
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
  
  const [config, setConfig] = useState({
    enabled: false,
    welcomeMessage: 'Hello! 👋 I\'m your Costplus100 AI assistant. I can help you with:\n\n• Finding products\n• Checking stock availability\n• Order tracking\n• Shipping information\n• Product recommendations\n• Pricing inquiries\n\nHow can I help you today?',
    quickActions: [
      'Show me popular products',
      'Track my order',
      'What are your shipping options?',
      'Tell me about your return policy',
    ],
    fallbackToHuman: true,
    offlineMessage: 'Our AI assistant is currently offline. Please call us at (08) 6165 8444.',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/ai/config`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.config) {
          setConfig(data.config);
        }
        setApiKeyConfigured(data.apiKeyConfigured);
      }
    } catch (error) {
      console.error('Failed to load AI config:', error);
      notify.error('Failed to load AI configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_URL}/ai/config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (response.ok) {
        notify.success('AI chatbot settings saved successfully!');
      } else {
        notify.error('Failed to save AI chatbot settings');
      }
    } catch (error) {
      console.error('Save error:', error);
      notify.error('Error saving AI chatbot settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 flex flex-col items-center justify-center gap-3 font-sans">
        <RefreshCw className="size-8 animate-spin text-[#E31837]" />
        <p className="text-xs font-bold text-slate-500">Loading AI chatbot settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Bot className="size-6 text-[#E31837]" />
            AI Chatbot & Virtual Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Configure your OpenAI GPT-powered customer support assistant widget and prompt triggers
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
              Save AI Settings
            </>
          )}
        </button>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>AI Customer Support:</strong> The floating assistant widget uses OpenAI GPT models to answer buyer inquiries regarding equipment specs, freight costs, and order statuses 24/7.
        </div>
      </div>

      {/* API Key Status Banner */}
      {!apiKeyConfigured ? (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-4 sm:p-5 space-y-3">
          <div className="flex items-start gap-3">
            <KeyRound className="size-5 text-amber-600 mt-0.5 shrink-0" />
            <div className="flex-1 space-y-1">
              <h3 className="font-extrabold text-amber-900 text-sm">OpenAI API Key Secret Required</h3>
              <p className="text-xs font-semibold text-amber-800 leading-relaxed">
                Add your OpenAI API key to enable live GPT customer conversations:
              </p>
            </div>
          </div>

          <div className="bg-white/90 border border-amber-200 rounded-lg p-3 text-xs font-semibold text-amber-900 space-y-1.5 pl-4">
            <div className="text-[11px] text-amber-800 font-medium space-y-1">
              <p>1. Generate an API key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="font-bold text-blue-600 hover:underline">platform.openai.com/api-keys</a></p>
              <p>2. Open Supabase Dashboard → Edge Functions → Secrets</p>
              <p>3. Create secret named <strong className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-900">OPENAI_API_KEY</strong> starting with <code className="font-bold">sk-...</code></p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
          <div className="p-2 bg-emerald-100/80 rounded-full shrink-0">
            <CheckCircle className="size-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-extrabold text-emerald-900 text-sm">OpenAI API Key Active</h3>
            <p className="text-xs font-semibold text-emerald-700">
              Your AI chatbot is connected to OpenAI and ready for customer support conversations
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <SettingsIcon className="size-5 text-[#E31837]" />
                Assistant Greeting & Behavior
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-4">
              
              {/* Welcome Message */}
              <div>
                <Label className="text-xs font-extrabold text-slate-700 mb-1.5 flex items-center gap-2">
                  <MessageCircle className="size-4 text-[#E31837]" />
                  Welcome Greeting Message <span className="text-[#E31837]">*</span>
                </Label>
                <Textarea
                  value={config.welcomeMessage}
                  onChange={(e) => setConfig({ ...config, welcomeMessage: e.target.value })}
                  rows={5}
                  placeholder="Enter the initial message users see when opening the chat..."
                  className="text-xs font-medium px-3 py-2 border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                />
                <p className="text-[11px] font-medium text-slate-400 mt-1">First message rendered inside the chat bubble</p>
              </div>

              {/* Quick Action Buttons */}
              <div>
                <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">Quick Action Preset Buttons</Label>
                <div className="space-y-2">
                  {config.quickActions.map((action, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={action}
                        onChange={(e) => {
                          const newActions = [...config.quickActions];
                          newActions[index] = e.target.value;
                          setConfig({ ...config, quickActions: newActions });
                        }}
                        placeholder={`Quick action ${index + 1}`}
                        className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                      />
                      <button
                        onClick={() => {
                          const newActions = config.quickActions.filter((_, i) => i !== index);
                          setConfig({ ...config, quickActions: newActions });
                        }}
                        className="size-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-all shrink-0 cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setConfig({
                        ...config,
                        quickActions: [...config.quickActions, '']
                      });
                    }}
                    className="w-full h-8 border border-dashed border-slate-300 hover:border-slate-400 text-slate-600 hover:text-[#0f172a] rounded-lg text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer mt-1"
                  >
                    <Plus className="size-3.5" />
                    Add Quick Action Question
                  </button>
                </div>
                <p className="text-[11px] font-medium text-slate-400 mt-1">Clickable suggested prompts shown above the chat input</p>
              </div>

              {/* Offline Message */}
              <div>
                <Label className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                  Offline Fallback Message <span className="text-[#E31837]">*</span>
                </Label>
                <Input
                  value={config.offlineMessage}
                  onChange={(e) => setConfig({ ...config, offlineMessage: e.target.value })}
                  placeholder="Message shown when chatbot is offline..."
                  className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                />
                <p className="text-[11px] font-medium text-slate-400 mt-1">Displayed if OpenAI service is unavailable</p>
              </div>

              {/* Toggles */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div>
                    <h3 className="font-extrabold text-xs text-[#0f172a]">Enable AI Support Widget</h3>
                    <p className="text-[11px] font-medium text-slate-500">
                      Display the floating assistant widget on storefront pages
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.enabled}
                      onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E31837]"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <div>
                    <h3 className="font-extrabold text-xs text-[#0f172a]">Human Support Handover</h3>
                    <p className="text-[11px] font-medium text-slate-500">
                      Offer phone and email contact buttons if AI cannot resolve inquiry
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.fallbackToHuman}
                      onChange={(e) => setConfig({ ...config, fallbackToHuman: e.target.checked })}
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
                  {saving ? 'Saving...' : 'Save AI Settings'}
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
                <Sparkles className="size-5 text-blue-600" />
                AI Assistant Capabilities
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 space-y-3">
              
              <div className="flex items-start gap-3 p-3 bg-blue-50/80 border border-blue-200 rounded-xl">
                <Bot className="size-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-xs text-blue-900">Commercial Catalog Intelligence</h3>
                  <p className="text-[11px] font-semibold text-blue-700 mt-0.5">
                    Analyzes commercial equipment specifications, dimensions, power requirements, and warranties
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl">
                <Zap className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-xs text-emerald-900">Instant Freight & Depot Quotes</h3>
                  <p className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                    Answers questions regarding tail-lift delivery vs zero-freight depot pickup
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <Lightbulb className="size-4 text-slate-600 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-xs text-slate-800">24/7 Conversion Automation</h3>
                  <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                    Guides commercial buyers through bulk equipment quotes and order checkout
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

export default AIChatbotSettings;