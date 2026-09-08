import { useState, useEffect, startTransition } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { 
  Award, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  GripVertical,
  ChevronUp,
  ChevronDown,
  ListTree,
  Settings2,
  Info,
  Sparkles,
  Layers,
  Link
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { toast } from 'sonner';
import { DeleteConfirmModal } from '../../components/ui/DeleteConfirmModal';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface MenuBrand {
  id: string;
  name: string;
  slug: string;
  path?: string; // Custom path (optional, defaults to /brands/{slug})
  sortOrder: number;
  enabled: boolean;
}

export function MenuBrandsManager() {
  const { isAuthenticated } = useAdmin();
  const [brands, setBrands] = useState<MenuBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [menuSettings, setMenuSettings] = useState({ showPromotions: true, showBrands: true });
  const [savingMenuSettings, setSavingMenuSettings] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    path: '',
    enabled: true,
  });

  useEffect(() => {
    if (isAuthenticated) {
      loadBrands();
      loadMenuSettings();
    }
  }, [isAuthenticated]);

  const loadMenuSettings = async () => {
    try {
      const response = await fetch(`${API_URL}/settings/menu`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.menuSettings) {
          setMenuSettings(data.menuSettings);
        }
      }
    } catch (error) {
      console.error('Error loading menu settings:', error);
    }
  };

  const saveMenuSettings = async () => {
    setSavingMenuSettings(true);
    try {
      const response = await fetch(`${API_URL}/settings/menu`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({ menuSettings })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Menu visibility settings saved successfully!');
      } else {
        toast.error('Failed to save menu settings: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error saving menu settings:', error);
      toast.error('Failed to save menu settings');
    } finally {
      setSavingMenuSettings(false);
    }
  };

  const loadBrands = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/menu-brands`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load menu brands');
      }

      const data = await response.json();
      setBrands(data.brands || []);
    } catch (error) {
      console.error('Error loading menu brands:', error);
      toast.error('Failed to load menu brands');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      toast.error('Name and slug are required');
      return;
    }

    try {
      setSaving(true);

      if (editingId) {
        const response = await fetch(`${API_URL}/menu-brands/${editingId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Failed to update brand');
        }

        toast.success('Brand updated successfully');
      } else {
        const response = await fetch(`${API_URL}/menu-brands`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error('Failed to create brand');
        }

        toast.success('Brand added successfully');
      }

      setFormData({ name: '', slug: '', path: '', enabled: true });
      setEditingId(null);
      setIsAddingNew(false);
      startTransition(() => {
        loadBrands();
      });
    } catch (error) {
      console.error('Error saving brand:', error);
      toast.error('Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (brand: MenuBrand) => {
    setEditingId(brand.id);
    setFormData({
      name: brand.name,
      slug: brand.slug,
      path: brand.path || '',
      enabled: brand.enabled,
    });
    setIsAddingNew(false);
  };

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteBrand = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);

    try {
      const response = await fetch(`${API_URL}/menu-brands/${deleteTargetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete brand');
      }

      toast.success('Brand deleted successfully');
      setDeleteTargetId(null);
      startTransition(() => {
        loadBrands();
      });
    } catch (error) {
      console.error('Error deleting brand:', error);
      toast.error('Failed to delete brand');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`${API_URL}/menu-brands/${id}/toggle`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle brand');
      }

      toast.success(enabled ? 'Brand enabled' : 'Brand disabled');
      startTransition(() => {
        loadBrands();
      });
    } catch (error) {
      console.error('Error toggling brand:', error);
      toast.error('Failed to toggle brand');
    }
  };

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = brands.findIndex(b => b.id === id);
    if (currentIndex === -1) return;

    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === brands.length - 1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const newBrands = [...brands];
    const [movedBrand] = newBrands.splice(currentIndex, 1);
    newBrands.splice(newIndex, 0, movedBrand);

    const updatedBrands = newBrands.map((brand, index) => ({
      ...brand,
      sortOrder: index,
    }));

    startTransition(() => {
      setBrands(updatedBrands);
    });

    try {
      const response = await fetch(`${API_URL}/menu-brands/reorder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          brands: updatedBrands.map(b => ({ id: b.id, sortOrder: b.sortOrder })) 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder brands');
      }

      toast.success('Brand menu order updated');
    } catch (error) {
      console.error('Error reordering brands:', error);
      toast.error('Failed to update order');
      startTransition(() => {
        loadBrands();
      });
    }
  };

  const handleCancel = () => {
    setFormData({ name: '', slug: '', path: '', enabled: true });
    setEditingId(null);
    setIsAddingNew(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <ListTree className="size-6 text-[#E31837]" />
            Menu Brands Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage manufacturer brands and custom links featured in the main navigation mega menu
          </p>
        </div>

        {!isAddingNew && !editingId && (
          <button
            onClick={() => setIsAddingNew(true)}
            className="h-10 px-5 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer shrink-0"
          >
            <Plus className="size-4 text-[#E31837]" />
            Add New Brand
          </button>
        )}
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Storefront Mega Menu Sync:</strong> Active brands appear directly under the <strong>Brands</strong> dropdown in the top store navigation header.
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Main Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Add New / Edit Brand Form Card */}
          {(isAddingNew || editingId) && (
            <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden ring-1 ring-slate-900/5">
              <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                  <Award className="size-5 text-[#E31837]" />
                  {editingId ? 'Edit Brand Entry' : 'Add New Brand to Menu'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-xs font-extrabold text-slate-700 mb-1.5 block">Brand Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Polar Refrigeration"
                      className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    />
                    <p className="text-[11px] text-slate-400 font-medium mt-1">Display name in mega menu dropdown</p>
                  </div>

                  <div>
                    <Label htmlFor="slug" className="text-xs font-extrabold text-slate-700 mb-1.5 block">Brand Slug</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                      placeholder="e.g. polar"
                      className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    />
                    <p className="text-[11px] text-slate-400 font-medium mt-1">URL slug (lowercase, hyphenated)</p>
                  </div>

                  <div className="sm:col-span-2">
                    <Label htmlFor="path" className="text-xs font-extrabold text-slate-700 mb-1.5 block">Custom Path (Optional)</Label>
                    <Input
                      id="path"
                      value={formData.path}
                      onChange={(e) => setFormData({ ...formData, path: e.target.value })}
                      placeholder="e.g. /brands/polar or /categories/refrigeration"
                      className="h-9 text-xs font-mono border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                    />
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      {formData.path ? `Custom Link Target: ${formData.path}` : `Default Route: /brands/${formData.slug || 'slug'}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="space-y-0.5">
                    <Label htmlFor="enabled" className="text-xs font-extrabold text-[#0f172a] cursor-pointer block">
                      Brand Active & Visible
                    </Label>
                    <p className="text-[11px] text-slate-500 font-medium">Show brand in the mega menu</p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
                  />
                </div>

                <div className="flex gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="h-9 px-5 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 flex-1 sm:flex-none"
                  >
                    <Save className="size-4" />
                    {saving ? 'Saving...' : 'Save Brand'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="h-9 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer flex-1 sm:flex-none"
                  >
                    <X className="size-4" />
                    Cancel
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Current Menu Brands List Card */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
              <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
                <Layers className="size-5 text-[#E31837]" />
                Current Menu Brands
              </CardTitle>
              <span className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-0.5 text-xs font-black text-[#0f172a]">
                {brands.length} Brands
              </span>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              {loading ? (
                <div className="text-center py-10 text-slate-400 text-xs font-bold animate-pulse">
                  Loading menu brands...
                </div>
              ) : brands.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-slate-500 text-xs font-semibold">
                  No brands defined yet. Click "Add New Brand" to create your first brand link.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {brands.map((brand, index) => (
                    <div
                      key={brand.id}
                      className={`group flex items-center gap-2.5 p-3 border rounded-xl transition-all duration-200 ${
                        !brand.enabled 
                          ? 'bg-slate-50/80 border-slate-200 opacity-65' 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                      }`}
                    >
                      {/* Order Controls */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleReorder(brand.id, 'up')}
                          disabled={index === 0}
                          className="size-5 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                          title="Move up"
                        >
                          <ChevronUp className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleReorder(brand.id, 'down')}
                          disabled={index === brands.length - 1}
                          className="size-5 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                          title="Move down"
                        >
                          <ChevronDown className="size-3.5" />
                        </button>
                      </div>

                      {/* Brand Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-[#0f172a] text-xs sm:text-sm truncate">
                            {brand.name}
                          </span>
                          {!brand.enabled && (
                            <span className="text-[10px] font-extrabold text-slate-400 bg-slate-200 px-1.5 py-0.2 rounded uppercase">
                              Hidden
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate flex items-center gap-1 mt-0.5">
                          <Link className="size-3 shrink-0 text-slate-400" />
                          {brand.path || `/brands/${brand.slug}`}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleToggleEnabled(brand.id, !brand.enabled)}
                          className={`size-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                            brand.enabled 
                              ? 'bg-[#2D3748] text-white hover:bg-[#1a202c]' 
                              : 'bg-slate-100 text-slate-400 border border-slate-200 hover:bg-slate-200'
                          }`}
                          title={brand.enabled ? 'Disable brand' : 'Enable brand'}
                        >
                          <Award className="size-4" />
                        </button>
                        
                        <button
                          onClick={() => handleEdit(brand)}
                          disabled={editingId === brand.id}
                          className="size-8 rounded-lg border border-slate-200 text-slate-600 hover:bg-[#2D3748] hover:text-white transition-all flex items-center justify-center cursor-pointer disabled:opacity-50"
                          title="Edit brand"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        
                        <button
                          onClick={() => setDeleteTargetId(brand.id)}
                          className="size-8 rounded-lg border border-rose-100 text-[#E31837] hover:bg-[#E31837] hover:text-white transition-all flex items-center justify-center cursor-pointer"
                          title="Delete brand"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-4">
          {/* Menu Visibility Settings Card */}
          <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-xs font-black text-[#0f172a] uppercase tracking-wider flex items-center gap-2">
                <Settings2 className="size-4 text-[#E31837]" />
                Global Menu Visibility
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl gap-3">
                <div>
                  <h3 className="text-xs font-extrabold text-[#0f172a]">Promotions Link</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Show Promotions in main navbar</p>
                </div>
                <Switch
                  checked={menuSettings.showPromotions}
                  onCheckedChange={(checked) => setMenuSettings({ ...menuSettings, showPromotions: checked })}
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl gap-3">
                <div>
                  <h3 className="text-xs font-extrabold text-[#0f172a]">Brands Dropdown</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Show Brands in main navbar</p>
                </div>
                <Switch
                  checked={menuSettings.showBrands}
                  onCheckedChange={(checked) => setMenuSettings({ ...menuSettings, showBrands: checked })}
                />
              </div>

              <button
                onClick={saveMenuSettings}
                disabled={savingMenuSettings}
                className="w-full h-10 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Save className="size-4" />
                {savingMenuSettings ? 'Saving Settings...' : 'Apply Global Settings'}
              </button>
            </CardContent>
          </Card>

          {/* How Routing Works Info Box */}
          <Card className="bg-[#0f172a] border-none shadow-md rounded-xl overflow-hidden text-white">
            <CardHeader className="pb-3 border-b border-slate-800 bg-slate-900/60">
              <CardTitle className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="size-4 text-[#E31837]" />
                How Brand Routing Works
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-2.5 text-xs text-slate-300 font-medium leading-relaxed">
              <div className="flex items-start gap-2">
                <span className="text-[#E31837] font-bold">•</span>
                <span>Active brands automatically populate under <strong>Brands</strong> in the header mega menu.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#E31837] font-bold">•</span>
                <span>You can set a <strong>Custom Path</strong> to link to any category or store page.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#E31837] font-bold">•</span>
                <span>Default routing resolves to <code className="bg-slate-800 text-rose-300 px-1 py-0.5 rounded font-mono text-[10px]">/brands/[slug]</code>.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#E31837] font-bold">•</span>
                <span>Toggle active status to hide a brand without permanently deleting its database record.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteBrand}
        title="Delete Brand"
        description="Are you sure you want to delete this brand link? This action cannot be undone."
        loading={deleting}
      />
    </div>
  );
}