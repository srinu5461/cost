import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Tag, Calendar, Sparkles, CheckCircle2, XCircle, Search, Info, X } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import type { Special, SpecialType, BOGODiscountType, SpecialApplyTo } from '../../../types/specials';
import { DeleteConfirmModal } from '../../components/ui/DeleteConfirmModal';
import { notify } from '../../utils/notifications';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

export function SpecialsManager() {
  const [specials, setSpecials] = useState<Special[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSpecial, setEditingSpecial] = useState<Special | null>(null);
  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Special>>({
    name: '',
    type: 'bogo',
    active: true,
    applyTo: 'brand',
    targetIds: [],
    priority: 1,
    stackWithMultibuy: false,
    stackWithCustomerDiscount: true,
    badge: 'SPECIAL',
    badgeColor: '#E31837',
    showOnProductCard: true,
    bogoConfig: {
      buyQuantity: 1,
      getQuantity: 1,
      discountType: 'percentage',
      discountValue: 50,
      applyToLowest: true,
      allowSameItem: true,
      allowMixMatch: true
    }
  });

  const [targetInput, setTargetInput] = useState('');

  useEffect(() => {
    fetchSpecials();
  }, []);

  const fetchSpecials = async () => {
    try {
      const response = await fetch(`${API_URL}/specials`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();
      if (data.success) {
        setSpecials(data.specials || []);
      }
    } catch (error: any) {
      console.error('Error fetching specials:', error);
      notify.error('Failed to load specials');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingSpecial
        ? `${API_URL}/specials/${editingSpecial.id}`
        : `${API_URL}/specials`;

      const response = await fetch(url, {
        method: editingSpecial ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        notify.success(editingSpecial ? 'Special updated successfully!' : 'Special created successfully!');
        setShowForm(false);
        setEditingSpecial(null);
        resetForm();
        fetchSpecials();
      } else {
        notify.error(`Error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error saving special:', error);
      notify.error('Failed to save special');
    }
  };

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteSpecial = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);

    try {
      const response = await fetch(`${API_URL}/specials/${deleteTargetId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });

      const data = await response.json();
      if (data.success) {
        notify.success('Special promotion deleted successfully!');
        setDeleteTargetId(null);
        fetchSpecials();
      } else {
        notify.error(`Error: ${data.error}`);
      }
    } catch (error: any) {
      console.error('Error deleting special:', error);
      notify.error('Failed to delete special');
    } finally {
      setDeleting(false);
    }
  };

  const searchPolarProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/specials/search/polar`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();

      if (data.success) {
        notify.info(`Found ${data.count} Polar products matching search criteria.`);
      }
    } catch (error: any) {
      console.error('Error searching:', error);
      notify.error('Failed to search products');
    }
  };

  const showAllBrands = async () => {
    try {
      const response = await fetch(`${API_URL}/specials/brands`, {
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      const data = await response.json();

      if (data.success) {
        notify.info(`Catalog contains ${data.count} unique brand entries.`);
      }
    } catch (error: any) {
      console.error('Error fetching brands:', error);
      notify.error('Failed to fetch brands');
    }
  };

  const handlePreview = async () => {
    try {
      const response = await fetch(`${API_URL}/specials/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`
        },
        body: JSON.stringify({
          applyTo: formData.applyTo,
          targetIds: formData.targetIds
        })
      });

      const data = await response.json();
      if (data.success) {
        setPreviewData(data);
        setShowPreview(true);
      } else {
        notify.error(`Preview failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Error previewing:', error);
      notify.error(`Failed to load preview: ${error.message}`);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'bogo',
      active: true,
      applyTo: 'brand',
      targetIds: [],
      priority: 1,
      stackWithMultibuy: false,
      stackWithCustomerDiscount: true,
      badge: 'SPECIAL',
      badgeColor: '#E31837',
      showOnProductCard: true,
      bogoConfig: {
        buyQuantity: 1,
        getQuantity: 1,
        discountType: 'percentage',
        discountValue: 50,
        applyToLowest: true,
        allowSameItem: true,
        allowMixMatch: true
      }
    });
    setTargetInput('');
  };

  const addTarget = () => {
    if (targetInput.trim() && !formData.targetIds?.includes(targetInput.trim())) {
      setFormData({
        ...formData,
        targetIds: [...(formData.targetIds || []), targetInput.trim()]
      });
      setTargetInput('');
    }
  };

  const removeTarget = (target: string) => {
    setFormData({
      ...formData,
      targetIds: formData.targetIds?.filter(t => t !== target) || []
    });
  };

  const editSpecial = (special: Special) => {
    setEditingSpecial(special);
    setFormData(special);
    setShowForm(true);
  };

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Tag className="size-6 text-[#E31837]" />
            Specials & BOGO Promotions
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Configure custom product discounts, clearance deals, and buy-one-get-one promotional rules
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => {
              setShowForm(true);
              setEditingSpecial(null);
              resetForm();
            }}
            className="h-10 px-5 bg-[#E31837] hover:bg-[#E31837]/90 text-white rounded-xl font-bold text-xs shadow-2xs flex items-center gap-2 shrink-0 cursor-pointer transition-all"
          >
            <Plus className="size-4" />
            Create Special
          </button>
        )}
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>BOGO Engine:</strong> BOGO rules calculate live savings in cart & checkout automatically based on lowest pricing or mix-and-match thresholds.
        </div>
      </div>

      {/* Specials List View */}
      {!showForm && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-500 text-sm font-semibold">
              Loading active specials & BOGO rules...
            </div>
          ) : specials.length === 0 ? (
            <div className="p-12 text-center text-slate-500 space-y-3">
              <Tag className="size-12 mx-auto text-slate-300" />
              <p className="text-base font-black text-slate-800">No Active Specials Configured</p>
              <p className="text-xs text-slate-500">Create your first BOGO promotion or percentage discount rule above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="p-3">Special Name</th>
                    <th className="p-3">Promotion Type</th>
                    <th className="p-3">Scope</th>
                    <th className="p-3">Active Window</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {specials.map((special) => (
                    <tr key={special.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="font-bold text-slate-900 text-sm">{special.name}</div>
                          <div>
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider shadow-2xs"
                              style={{ backgroundColor: special.badgeColor || '#E31837', color: 'white' }}
                            >
                              {special.badge}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-semibold">
                        {special.type === 'bogo' && (
                          <span className="text-purple-700 bg-purple-50 px-2 py-1 rounded-lg border border-purple-200">
                            BOGO: Buy {special.bogoConfig?.buyQuantity} Get {special.bogoConfig?.getQuantity} ({special.bogoConfig?.discountValue}{special.bogoConfig?.discountType === 'percentage' ? '%' : '$'} OFF)
                          </span>
                        )}
                        {special.type === 'percentage' && (
                          <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200 font-bold">
                            {special.discountValue}% OFF
                          </span>
                        )}
                        {special.type === 'fixed_amount' && (
                          <span className="text-blue-700 bg-blue-50 px-2 py-1 rounded-lg border border-blue-200 font-bold">
                            ${special.discountValue} OFF
                          </span>
                        )}
                        {special.type === 'fixed_price' && (
                          <span className="text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 font-bold">
                            Fixed ${special.fixedPrice}
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="font-bold text-slate-800 capitalize">{special.applyTo}</div>
                        <div className="text-[11px] text-slate-500 font-medium">{special.targetIds?.length || 0} target item(s)</div>
                      </td>
                      <td className="p-3 text-[11px] text-slate-600 whitespace-nowrap">
                        {new Date(special.startDate).toLocaleDateString()} - {new Date(special.endDate).toLocaleDateString()}
                      </td>
                      <td className="p-3">
                        {special.active ? (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full border border-emerald-200 uppercase tracking-wider">
                            Active
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-full border border-slate-200 uppercase tracking-wider">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => editSpecial(special)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Special"
                          >
                            <Edit2 className="size-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTargetId(special.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Special"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Form Card View */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-5 sm:p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="text-lg sm:text-xl font-black text-[#0f172a] flex items-center gap-2">
              <Sparkles className="size-5 text-[#E31837]" />
              {editingSpecial ? 'Edit Special Promotion' : 'Create New Special Promotion'}
            </h2>
            <button
              onClick={() => {
                setShowForm(false);
                setEditingSpecial(null);
                resetForm();
              }}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            {/* Special Name */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-700 uppercase tracking-wider">
                Special Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E31837]/20"
                placeholder="e.g., Thor Brand BOGO - Buy 1 Get 2nd Half Price"
              />
            </div>

            {/* Special Type Selector */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 uppercase tracking-wider">
                Promotion Type *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'bogo', label: 'BOGO Deal', sub: 'Buy X Get Y' },
                  { id: 'percentage', label: 'Percentage Off', sub: 'X% Discount' },
                  { id: 'fixed_amount', label: 'Fixed Amount Off', sub: '$X Discount' },
                  { id: 'fixed_price', label: 'Fixed Price', sub: 'Clearance Price' }
                ].map((item) => (
                  <label
                    key={item.id}
                    className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                      formData.type === item.id 
                        ? 'border-[#E31837] bg-red-50/30 ring-1 ring-[#E31837]' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="type"
                      value={item.id}
                      checked={formData.type === item.id}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as SpecialType })}
                      className="size-4 text-[#E31837] mr-2"
                    />
                    <div>
                      <div className="font-bold text-slate-900">{item.label}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{item.sub}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* BOGO Rules Config Box */}
            {formData.type === 'bogo' && (
              <div className="border border-purple-200 rounded-xl p-4 bg-purple-50/40 space-y-4">
                <h3 className="font-black text-purple-900 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="size-4 text-purple-600" />
                  BOGO Execution Parameters
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-purple-900">Buy Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.bogoConfig?.buyQuantity || 1}
                      onChange={(e) => setFormData({
                        ...formData,
                        bogoConfig: { ...formData.bogoConfig!, buyQuantity: parseInt(e.target.value) }
                      })}
                      className="w-full h-9 mt-1 px-3 border border-purple-200 rounded-xl bg-white text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-purple-900">Get Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.bogoConfig?.getQuantity || 1}
                      onChange={(e) => setFormData({
                        ...formData,
                        bogoConfig: { ...formData.bogoConfig!, getQuantity: parseInt(e.target.value) }
                      })}
                      className="w-full h-9 mt-1 px-3 border border-purple-200 rounded-xl bg-white text-xs font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-purple-900">Discount Type</label>
                    <select
                      value={formData.bogoConfig?.discountType || 'percentage'}
                      onChange={(e) => setFormData({
                        ...formData,
                        bogoConfig: { ...formData.bogoConfig!, discountType: e.target.value as BOGODiscountType }
                      })}
                      className="w-full h-9 mt-1 px-3 border border-purple-200 rounded-xl bg-white text-xs font-semibold"
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed_amount">Fixed Amount ($)</option>
                      <option value="free">Free (100% off)</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-purple-900">Discount Value</label>
                    <input
                      type="number"
                      min="0"
                      max={formData.bogoConfig?.discountType === 'percentage' ? 100 : undefined}
                      value={formData.bogoConfig?.discountValue || 50}
                      onChange={(e) => setFormData({
                        ...formData,
                        bogoConfig: { ...formData.bogoConfig!, discountValue: parseFloat(e.target.value) }
                      })}
                      className="w-full h-9 mt-1 px-3 border border-purple-200 rounded-xl bg-white text-xs font-semibold"
                      disabled={formData.bogoConfig?.discountType === 'free'}
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.bogoConfig?.applyToLowest ?? true}
                      onChange={(e) => setFormData({
                        ...formData,
                        bogoConfig: { ...formData.bogoConfig!, applyToLowest: e.target.checked }
                      })}
                      className="size-4 text-purple-600 rounded"
                    />
                    <span className="font-semibold text-purple-900">Apply discount to lowest priced item</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.bogoConfig?.allowSameItem ?? true}
                      onChange={(e) => setFormData({
                        ...formData,
                        bogoConfig: { ...formData.bogoConfig!, allowSameItem: e.target.checked }
                      })}
                      className="size-4 text-purple-600 rounded"
                    />
                    <span className="font-semibold text-purple-900">Allow same item (buy 2 of identical product)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.bogoConfig?.allowMixMatch ?? true}
                      onChange={(e) => setFormData({
                        ...formData,
                        bogoConfig: { ...formData.bogoConfig!, allowMixMatch: e.target.checked }
                      })}
                      className="size-4 text-purple-600 rounded"
                    />
                    <span className="font-semibold text-purple-900">Allow mix & match across targeted catalog items</span>
                  </label>
                </div>
              </div>
            )}

            {/* Standard Discount Value */}
            {(formData.type === 'percentage' || formData.type === 'fixed_amount' || formData.type === 'fixed_price') && (
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider">
                  {formData.type === 'percentage' && 'Discount Percentage (%)'}
                  {formData.type === 'fixed_amount' && 'Discount Amount ($)'}
                  {formData.type === 'fixed_price' && 'New Fixed Price ($)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={formData.type === 'fixed_price' ? (formData.fixedPrice || '') : (formData.discountValue || '')}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    if (formData.type === 'fixed_price') {
                      setFormData({ ...formData, fixedPrice: value });
                    } else {
                      setFormData({ ...formData, discountValue: value });
                    }
                  }}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold"
                />
              </div>
            )}

            {/* Scope / Apply To */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 uppercase tracking-wider">
                Apply Special To *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['brand', 'category', 'product', 'sitewide'] as SpecialApplyTo[]).map((type) => (
                  <label
                    key={type}
                    className={`flex items-center p-3 border rounded-xl cursor-pointer transition-all ${
                      formData.applyTo === type 
                        ? 'border-[#E31837] bg-red-50/30 ring-1 ring-[#E31837]' 
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="applyTo"
                      value={type}
                      checked={formData.applyTo === type}
                      onChange={(e) => setFormData({ ...formData, applyTo: e.target.value as SpecialApplyTo, targetIds: [] })}
                      className="size-4 text-[#E31837] mr-2"
                    />
                    <span className="font-bold text-slate-900 capitalize">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Target Input Chips */}
            {formData.applyTo !== 'sitewide' && (
              <div className="space-y-2">
                <label className="font-bold text-slate-700 uppercase tracking-wider">
                  Target {formData.applyTo === 'brand' ? 'Brand Names' : formData.applyTo === 'category' ? 'Category IDs' : 'Product Codes'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTarget())}
                    className="flex-1 h-10 px-3 border border-slate-200 rounded-xl bg-white text-xs font-medium"
                    placeholder={
                      formData.applyTo === 'brand' ? 'e.g., Thor' :
                      formData.applyTo === 'category' ? 'e.g., cat-123' :
                      'e.g., ABC123'
                    }
                  />
                  <button
                    type="button"
                    onClick={addTarget}
                    className="h-10 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold text-xs cursor-pointer transition-all"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {formData.targetIds?.map((target) => (
                    <span
                      key={target}
                      className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full font-bold text-xs border border-slate-200 flex items-center gap-1.5"
                    >
                      {target}
                      <button
                        type="button"
                        onClick={() => removeTarget(target)}
                        className="text-slate-400 hover:text-red-600 font-bold"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Date Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate?.split('T')[0] || ''}
                  onChange={(e) => setFormData({ ...formData, startDate: new Date(e.target.value).toISOString() })}
                  className="w-full h-10 mt-1 px-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider">End Date</label>
                <input
                  type="date"
                  value={formData.endDate?.split('T')[0] || ''}
                  onChange={(e) => setFormData({ ...formData, endDate: new Date(e.target.value).toISOString() })}
                  className="w-full h-10 mt-1 px-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold"
                />
              </div>
            </div>

            {/* Badge Configuration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider">Badge Text</label>
                <input
                  type="text"
                  value={formData.badge}
                  onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                  className="w-full h-10 mt-1 px-3 border border-slate-200 rounded-xl bg-white text-xs font-semibold"
                  placeholder="SALE, BOGO, etc."
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 uppercase tracking-wider">Badge Color</label>
                <input
                  type="color"
                  value={formData.badgeColor}
                  onChange={(e) => setFormData({ ...formData, badgeColor: e.target.value })}
                  className="w-full h-10 mt-1 px-2 border border-slate-200 rounded-xl cursor-pointer"
                />
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.active ?? true}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="size-4 text-[#E31837] rounded"
                />
                <span>Active Special Rule</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.showOnProductCard ?? true}
                  onChange={(e) => setFormData({ ...formData, showOnProductCard: e.target.checked })}
                  className="size-4 text-[#E31837] rounded"
                />
                <span>Show promotional badge on storefront product cards</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.stackWithCustomerDiscount ?? true}
                  onChange={(e) => setFormData({ ...formData, stackWithCustomerDiscount: e.target.checked })}
                  className="size-4 text-[#E31837] rounded"
                />
                <span>Stack with customer-level pricing tier discounts</span>
              </label>
            </div>

            {/* Form Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handlePreview}
                  className="h-10 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs border border-slate-200 cursor-pointer transition-all"
                >
                  Preview Affected Products
                </button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSpecial(null);
                    resetForm();
                  }}
                  className="h-10 px-5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl font-bold text-xs cursor-pointer transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="h-10 px-6 bg-[#E31837] hover:bg-[#E31837]/90 text-white rounded-xl font-bold text-xs shadow-2xs cursor-pointer transition-all"
                >
                  {editingSpecial ? 'Update Special' : 'Create Special'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Preview Modal Overlay */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col font-sans border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="text-sm font-black flex items-center gap-2">
                <Search className="size-4 text-[#E31837]" />
                Preview Affected Catalog Items ({previewData.count})
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {previewData.products?.map((product: any) => (
                  <div key={product.code} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/50">
                    <div className="font-bold text-slate-900 text-sm">{product.name}</div>
                    <div className="font-mono text-slate-500 font-semibold text-[11px] mt-0.5">{product.code}</div>
                    <div className="font-extrabold text-emerald-700 text-xs mt-1.5">${product.price?.toFixed(2)}</div>
                    {product.brand && <div className="text-[10px] font-semibold text-slate-400 mt-0.5">Brand: {product.brand}</div>}
                  </div>
                ))}
              </div>
              {previewData.count > 50 && (
                <p className="text-center text-xs text-slate-500 font-semibold mt-4">
                  Showing first 50 of {previewData.count} affected products
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteSpecial}
        title="Delete Special Promotion"
        description="Are you sure you want to delete this special deal/BOGO promotion? This action cannot be undone."
        loading={deleting}
      />
    </div>
  );
}
