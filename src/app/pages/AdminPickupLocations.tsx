import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { 
  MapPin, 
  Plus, 
  Pencil, 
  Trash2, 
  Loader2,
  Clock,
  MapPinned,
  CheckCircle2,
  XCircle,
  Info,
  Building2,
  Search
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';
import { notify } from '../utils/notifications';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

const AUSTRALIAN_STATES = [
  { value: 'NSW', label: 'New South Wales (NSW)' },
  { value: 'VIC', label: 'Victoria (VIC)' },
  { value: 'QLD', label: 'Queensland (QLD)' },
  { value: 'SA', label: 'South Australia (SA)' },
  { value: 'WA', label: 'Western Australia (WA)' },
  { value: 'TAS', label: 'Tasmania (TAS)' },
  { value: 'NT', label: 'Northern Territory (NT)' },
  { value: 'ACT', label: 'Australian Capital Territory (ACT)' },
];

interface PickupLocation {
  id: string;
  name: string;
  address: string;
  state: string;
  hours: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function AdminPickupLocations() {
  const [locations, setLocations] = useState<PickupLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    state: '',
    hours: '',
    active: true
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch(`${API_URL}/pickup-locations`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      const data = await response.json();
      
      if (data.success) {
        setLocations(data.locations);
      }
    } catch (error) {
      console.error('Error fetching pickup locations:', error);
      notify.error('Failed to load pickup locations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url = editingId 
        ? `${API_URL}/pickup-locations/${editingId}`
        : `${API_URL}/pickup-locations`;
      
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        await fetchLocations();
        resetForm();
        notify.success(editingId ? 'Location updated successfully!' : 'Location added successfully!');
      } else {
        notify.error(data.error || 'Failed to save location');
      }
    } catch (error) {
      console.error('Error saving pickup location:', error);
      notify.error('Failed to save location');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (location: PickupLocation) => {
    setFormData({
      name: location.name,
      address: location.address,
      state: location.state,
      hours: location.hours,
      active: location.active
    });
    setEditingId(location.id);
    setShowAddForm(true);
  };

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteLocation = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);

    try {
      const response = await fetch(`${API_URL}/pickup-locations/${deleteTargetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        setDeleteTargetId(null);
        await fetchLocations();
        notify.success('Pickup location removed');
      } else {
        notify.error(data.error || 'Failed to delete location');
      }
    } catch (error) {
      console.error('Error deleting pickup location:', error);
      notify.error('Failed to delete location');
    } finally {
      setDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      address: '',
      state: '',
      hours: '',
      active: true
    });
    setEditingId(null);
    setShowAddForm(false);
  };

  const filteredLocations = locations.filter(loc => 
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="size-8 animate-spin text-[#E31837]" />
        <p className="text-xs font-bold text-slate-500">Loading pickup locations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <MapPin className="size-6 text-[#E31837]" />
            Click & Collect Pickup Locations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage warehouse depot pickup locations for local commercial equipment buyers
          </p>
        </div>

        <button 
          onClick={() => {
            if (showAddForm && editingId) {
              resetForm();
            } else {
              setShowAddForm(!showAddForm);
            }
          }}
          className="h-10 px-5 bg-[#E31837] hover:bg-[#c4122c] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer shrink-0"
        >
          <Plus className="size-4" />
          {showAddForm ? 'Close Form' : 'Add Pickup Location'}
        </button>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Checkout Click & Collect:</strong> Active warehouses are presented during checkout when buyers choose zero-freight local depot pickup.
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
          <CardHeader className="pb-3 border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-base text-[#2D3748] font-extrabold flex items-center gap-2">
              <MapPinned className="size-5 text-[#E31837]" />
              {editingId ? 'Edit Warehouse Location' : 'Add New Warehouse Location'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Label htmlFor="name" className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Location / Warehouse Name <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Sydney Commercial Kitchen Warehouse"
                    required
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="address" className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Full Street Address <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Industrial Ave, Sydney NSW 2000"
                    required
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>

                <div>
                  <Label htmlFor="state" className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    State <span className="text-[#E31837]">*</span>
                  </Label>
                  <select
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full h-9 px-3 text-xs font-bold border border-slate-200 rounded-md focus:border-[#E31837] focus:ring-[#E31837] outline-none"
                    required
                  >
                    <option value="">Select a state</option>
                    {AUSTRALIAN_STATES.map((state) => (
                      <option key={state.value} value={state.value}>
                        {state.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="hours" className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Operating Hours <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    id="hours"
                    value={formData.hours}
                    onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                    placeholder="Mon-Fri: 8:00 AM - 5:00 PM"
                    required
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>
                
                <div className="sm:col-span-2 pt-1">
                  <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div>
                      <h3 className="font-extrabold text-xs text-[#0f172a]">Active Location Status</h3>
                      <p className="text-[11px] font-medium text-slate-500">
                        Enable to make this warehouse selectable during customer checkout
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.active}
                        onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E31837]"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
                <button 
                  type="button" 
                  onClick={resetForm}
                  className="h-9 px-4 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={saving}
                  className="h-9 px-5 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {saving ? (
                    <><Loader2 className="size-4 animate-spin" />Saving...</>
                  ) : (
                    <>{editingId ? 'Update Warehouse' : 'Save Warehouse'}</>
                  )}
                </button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search warehouse by name or state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
          />
        </div>

        <div className="text-xs font-extrabold text-slate-500">
          Total Depots: <span className="text-[#0f172a]">{filteredLocations.length}</span>
        </div>
      </div>

      {/* Locations Grid */}
      {filteredLocations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-xl shadow-xs border-dashed text-center p-6">
          <MapPin className="size-12 mb-3 text-slate-300" />
          <h3 className="text-base font-extrabold text-[#0f172a] mb-1">No pickup locations found</h3>
          <p className="text-xs font-medium text-slate-500 mb-5">
            {searchQuery ? 'Try adjusting your search filters' : 'Add your first warehouse pickup depot using the button above'}
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="h-9 px-4 bg-[#E31837] hover:bg-[#c4122c] text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="size-4" />
            Add Pickup Location
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((location) => (
            <Card 
              key={location.id} 
              className={`bg-white rounded-xl shadow-xs border flex flex-col transition-all overflow-hidden group ${
                location.active ? 'border-slate-200 hover:border-slate-300' : 'border-slate-200/60 opacity-60'
              }`}
            >
              <div className="p-4 sm:p-5 flex flex-col h-full space-y-4">
                
                {/* Location Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-extrabold text-[#0f172a] tracking-tight mb-1.5">
                      {location.name}
                    </h3>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        location.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {location.active ? 'Active' : 'Inactive'}
                      </span>
                      {location.state && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-200">
                          {location.state}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(location)}
                      className="size-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-all cursor-pointer"
                      title="Edit Location"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetId(location.id)}
                      className="size-7 rounded-lg text-slate-400 hover:text-[#E31837] hover:bg-red-50 flex items-center justify-center transition-all cursor-pointer"
                      title="Delete Location"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="space-y-3 pt-3 border-t border-slate-100 text-xs font-semibold text-slate-700">
                  <div className="flex items-start gap-2">
                    <MapPinned className="size-4 text-[#E31837] shrink-0 mt-0.5" />
                    <p className="leading-snug text-slate-600 font-medium">
                      {location.address}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Clock className="size-4 text-slate-400 shrink-0" />
                    <p className="text-slate-600 font-medium">
                      {location.hours}
                    </p>
                  </div>
                </div>

              </div>
            </Card>
          ))}
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteLocation}
        title="Delete Pickup Location"
        description="Are you sure you want to delete this pickup location? This action cannot be undone."
        loading={deleting}
      />
    </div>
  );
}

export default AdminPickupLocations;