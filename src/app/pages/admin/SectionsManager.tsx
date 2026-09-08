import { useState, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  GripVertical, 
  Eye, 
  EyeOff, 
  ArrowUp, 
  ArrowDown, 
  Tag, 
  Palette, 
  Type, 
  Loader2, 
  Layers,
  Info,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { DeleteConfirmModal } from '../../components/ui/DeleteConfirmModal';
import { notify } from '../../utils/notifications';

interface SectionConfig {
  id: string;
  name: string;
  badge: string;
  badgeColor: string;
  badgeIcon: string;
  enabled: boolean;
  order: number;
}

const defaultSections: SectionConfig[] = [
  {
    id: 'featured',
    name: 'Featured Equipment',
    badge: '⭐ Featured',
    badgeColor: 'bg-blue-600',
    badgeIcon: '⭐',
    enabled: true,
    order: 1,
  },
  {
    id: 'popular',
    name: 'Popular Products',
    badge: '🔥 Popular',
    badgeColor: 'bg-purple-600',
    badgeIcon: '🔥',
    enabled: true,
    order: 2,
  },
  {
    id: 'promotion',
    name: 'Special Offers',
    badge: '🎉 Promo',
    badgeColor: 'bg-red-600',
    badgeIcon: '🎉',
    enabled: true,
    order: 3,
  },
];

const badgeColorOptions = [
  { value: 'bg-[#E31837]', label: 'Brand Red', preview: 'bg-[#E31837]' },
  { value: 'bg-[#0f172a]', label: 'Brand Navy', preview: 'bg-[#0f172a]' },
  { value: 'bg-blue-600', label: 'Blue', preview: 'bg-blue-600' },
  { value: 'bg-purple-600', label: 'Purple', preview: 'bg-purple-600' },
  { value: 'bg-emerald-600', label: 'Green', preview: 'bg-emerald-600' },
  { value: 'bg-orange-600', label: 'Orange', preview: 'bg-orange-600' },
  { value: 'bg-pink-600', label: 'Pink', preview: 'bg-pink-600' },
  { value: 'bg-indigo-600', label: 'Indigo', preview: 'bg-indigo-600' },
  { value: 'bg-teal-600', label: 'Teal', preview: 'bg-teal-600' },
];

const iconOptions = ['⭐', '🔥', '🎉', '💎', '✨', '🏆', '🎯', '💰', '🌟', '🎁', '⚡', '🔖'];

export function SectionsManager() {
  const [sections, setSections] = useState<SectionConfig[]>(defaultSections);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  useEffect(() => {
    loadSections();
  }, []);

  const loadSections = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/sections-config`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          setSections(data);
        }
      }
    } catch (error) {
      console.error('Failed to load sections:', error);
      notify.error('Failed to load sections configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveSections = async () => {
    setSaving(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/sections-config`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify(sections),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      notify.success('Sections configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save sections:', error);
      notify.error('Failed to save sections configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateSection = (id: string, updates: Partial<SectionConfig>) => {
    setSections(sections.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const toggleEnabled = (id: string) => {
    updateSection(id, { enabled: !sections.find(s => s.id === id)?.enabled });
  };

  const moveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === sections.length - 1)
    ) {
      return;
    }

    const newSections = [...sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    
    newSections.forEach((s, i) => {
      s.order = i + 1;
    });

    setSections(newSections);
  };

  const confirmDeleteSection = () => {
    if (!deleteTargetId) return;
    setSections(sections.filter(s => s.id !== deleteTargetId));
    setDeleteTargetId(null);
    notify.success('Custom section removed');
  };

  const addNewSection = () => {
    const newSection: SectionConfig = {
      id: `custom-${Date.now()}`,
      name: 'New Section',
      badge: '✨ New',
      badgeColor: 'bg-blue-600',
      badgeIcon: '✨',
      enabled: true,
      order: sections.length + 1,
    };
    setSections([...sections, newSection]);
    notify.success('New section added to configuration');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 font-sans">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin text-[#E31837] mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-500">Loading homepage layout configurations...</p>
        </div>
      </div>
    );
  }

  const enabledCount = sections.filter(s => s.enabled).length;
  const disabledCount = sections.filter(s => !s.enabled).length;

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Layers className="size-6 text-[#E31837]" />
            Homepage Sections Layout
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Customize section display names, order, badge tags, and visibility on the storefront
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={addNewSection}
            className="h-10 px-4 bg-white border border-slate-200 text-[#0f172a] hover:bg-slate-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="size-4 text-[#E31837]" />
            Add Section
          </button>
          <button
            onClick={saveSections}
            disabled={saving}
            className="h-10 px-5 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Top 3 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">TOTAL SECTIONS</p>
              <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">{sections.length}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Configured layout rows</p>
            </div>
            <div className="size-11 rounded-xl bg-blue-50 border border-slate-200 flex items-center justify-center shrink-0 text-blue-600">
              <Layers className="size-5.5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">ENABLED SECTIONS</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600">{enabledCount}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">Visible on homepage</p>
            </div>
            <div className="size-11 rounded-xl bg-emerald-50 border border-slate-200 flex items-center justify-center shrink-0 text-emerald-600">
              <CheckCircle2 className="size-5.5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">HIDDEN SECTIONS</p>
              <p className="text-2xl sm:text-3xl font-black text-amber-600">{disabledCount}</p>
              <p className="text-xs text-amber-600 font-semibold mt-1">Toggled off</p>
            </div>
            <div className="size-11 rounded-xl bg-amber-50 border border-slate-200 flex items-center justify-center shrink-0 text-amber-600">
              <EyeOff className="size-5.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Guide Banner */}
      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 flex items-center gap-3 text-xs sm:text-sm text-blue-900 font-medium">
        <Info className="size-5 text-blue-600 shrink-0" />
        <div>
          <strong>Section Styling Tips:</strong> Edit Section Name to change the title on the homepage. Change Badge Color & Icon to style product card tags. Click <strong>Save Configuration</strong> to apply live changes.
        </div>
      </div>

      {/* Sections Config Cards List */}
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`bg-white rounded-xl p-5 shadow-xs border transition-all ${
              section.enabled ? 'border-slate-200' : 'border-slate-200 bg-slate-50/60 opacity-80'
            }`}
          >
            <div className="flex flex-col md:flex-row items-start gap-4">
              {/* Reorder Buttons Column */}
              <div className="flex md:flex-col items-center gap-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shrink-0">
                <button
                  onClick={() => moveSection(section.id, 'up')}
                  disabled={index === 0}
                  className="size-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  title="Move up"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <div className="p-1 text-slate-300">
                  <GripVertical className="size-4" />
                </div>
                <button
                  onClick={() => moveSection(section.id, 'down')}
                  disabled={index === sections.length - 1}
                  className="size-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
                  title="Move down"
                >
                  <ArrowDown className="size-3.5" />
                </button>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 w-full space-y-4">
                <div className="flex items-center justify-between gap-3 flex-wrap border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                      Order #{section.order}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                      section.enabled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {section.enabled ? 'Enabled' : 'Hidden'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleEnabled(section.id)}
                      className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                        section.enabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                      }`}
                    >
                      {section.enabled ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                      {section.enabled ? 'Visible' : 'Hidden'}
                    </button>

                    {!['featured', 'popular', 'promotion'].includes(section.id) && (
                      <button
                        onClick={() => setDeleteTargetId(section.id)}
                        className="size-9 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 flex items-center justify-center text-[#E31837] cursor-pointer"
                        title="Delete custom section"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Inputs Column */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-extrabold text-slate-500 mb-1.5 block uppercase tracking-wider">
                        Section Display Heading *
                      </label>
                      <Input
                        value={section.name}
                        onChange={(e) => updateSection(section.id, { name: e.target.value })}
                        placeholder="e.g. Featured Equipment"
                        className="h-10 bg-slate-50 border-slate-200 rounded-xl text-xs sm:text-sm font-extrabold text-[#0f172a]"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-slate-500 mb-1.5 block uppercase tracking-wider">
                        Badge Tag Label *
                      </label>
                      <Input
                        value={section.badge}
                        onChange={(e) => updateSection(section.id, { badge: e.target.value })}
                        placeholder="e.g. ⭐ Featured"
                        className="h-10 bg-slate-50 border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700"
                      />
                    </div>
                  </div>

                  {/* Badges & Icons Column */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-extrabold text-slate-500 mb-1.5 block uppercase tracking-wider">
                        Badge Accent Color
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {badgeColorOptions.map((color) => (
                          <button
                            key={color.value}
                            onClick={() => updateSection(section.id, { badgeColor: color.value })}
                            className={`size-7 rounded-lg transition-all ${color.preview} cursor-pointer border ${
                              section.badgeColor === color.value
                                ? 'ring-2 ring-offset-1 ring-[#0f172a] scale-110 border-white'
                                : 'border-transparent opacity-80 hover:opacity-100'
                            }`}
                            title={color.label}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-extrabold text-slate-500 mb-1.5 block uppercase tracking-wider">
                        Badge Icon Emoji
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {iconOptions.map((icon) => (
                          <button
                            key={icon}
                            onClick={() => updateSection(section.id, { 
                              badgeIcon: icon,
                              badge: `${icon} ${section.badge.split(' ').slice(1).join(' ')}`
                            })}
                            className={`size-8 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer border ${
                              section.badgeIcon === icon 
                                ? 'bg-rose-50 border-[#E31837] text-[#E31837] scale-110 shadow-2xs font-bold' 
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Preview Tag */}
                    <div className="pt-1">
                      <label className="text-xs font-extrabold text-slate-500 mb-1 block uppercase tracking-wider">
                        Card Badge Preview
                      </label>
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-center">
                        <span className={`${section.badgeColor} text-white font-extrabold text-xs px-3 py-1 rounded-md shadow-2xs`}>
                          {section.badge}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add New Section Card */}
      <button
        onClick={addNewSection}
        className="w-full bg-white hover:bg-rose-50/40 border-2 border-dashed border-slate-200 hover:border-[#E31837] rounded-xl p-6 transition-all text-center cursor-pointer group space-y-1"
      >
        <div className="size-10 rounded-xl bg-slate-100 group-hover:bg-rose-100 text-slate-400 group-hover:text-[#E31837] flex items-center justify-center mx-auto transition-colors">
          <Plus className="size-5" />
        </div>
        <p className="text-sm font-extrabold text-[#0f172a] group-hover:text-[#E31837] transition-colors">
          + Add New Custom Homepage Section
        </p>
        <p className="text-xs text-slate-400 font-medium">Create a new section row for products</p>
      </button>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteSection}
        title="Delete Custom Section"
        description="Are you sure you want to delete this custom section configuration? This action cannot be undone."
      />
    </div>
  );
}
