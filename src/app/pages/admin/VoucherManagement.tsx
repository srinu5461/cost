import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Loader2, Plus, Trash2, Ticket, Calendar, Users, DollarSign, Check, X, Search, Filter, Info, Sparkles, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { DeleteConfirmModal } from '../../components/ui/DeleteConfirmModal';
import { notify } from '../../utils/notifications';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface Voucher {
  id: string;
  code: string;
  type: 'fixed' | 'percentage';
  value: number;
  min_purchase: number;
  max_uses: number | null;
  used_count: number;
  active: boolean;
  expires_at: string | null;
  customer_specific: string | null;
  created_at: string;
}

export function VoucherManagement() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    type: 'fixed' as 'fixed' | 'percentage',
    value: '',
    minPurchase: '',
    maxUses: '',
    expiresAt: '',
    customerSpecific: '',
  });

  useEffect(() => {
    fetchVouchers();
  }, []);

  const fetchVouchers = async () => {
    try {
      const response = await fetch(`${API_URL}/vouchers/list`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setVouchers(data.vouchers);
      }
    } catch (error) {
      console.error('Error fetching vouchers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/vouchers/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          code: formData.code.toUpperCase(),
          type: formData.type,
          value: parseFloat(formData.value),
          minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase) : 0,
          maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
          expiresAt: formData.expiresAt || null,
          customerSpecific: formData.customerSpecific || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setVouchers([data.voucher, ...vouchers]);
        setDialogOpen(false);
        setFormData({
          code: '',
          type: 'fixed',
          value: '',
          minPurchase: '',
          maxUses: '',
          expiresAt: '',
          customerSpecific: '',
        });
        notify.success('Voucher created successfully!');
      } else {
        notify.error(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating voucher:', error);
      notify.error('Failed to create voucher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (voucher: Voucher) => {
    try {
      const response = await fetch(`${API_URL}/vouchers/${voucher.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ active: !voucher.active }),
      });

      const data = await response.json();
      if (data.success) {
        setVouchers(vouchers.map(v =>
          v.id === voucher.id ? { ...v, active: !v.active } : v
        ));
        notify.success(`Voucher ${!voucher.active ? 'activated' : 'deactivated'}`);
      }
    } catch (error) {
      console.error('Error updating voucher:', error);
      notify.error('Failed to update voucher state');
    }
  };

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDeleteVoucher = async () => {
    if (!deleteTargetId) return;
    setDeleting(true);

    try {
      const response = await fetch(`${API_URL}/vouchers/${deleteTargetId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setVouchers(vouchers.filter(v => v.id !== deleteTargetId));
        setDeleteTargetId(null);
        notify.success('Voucher deleted');
      } else {
        notify.error('Failed to delete voucher');
      }
    } catch (error) {
      console.error('Error deleting voucher:', error);
      notify.error('Failed to delete voucher');
    } finally {
      setDeleting(false);
    }
  };

  // Filter vouchers
  const filteredVouchers = vouchers.filter(v => {
    const matchesSearch = v.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.customer_specific && v.customer_specific.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (statusFilter === 'active') return matchesSearch && v.active;
    if (statusFilter === 'inactive') return matchesSearch && !v.active;
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-16 flex flex-col items-center justify-center gap-3 font-sans">
        <Loader2 className="size-8 animate-spin text-[#E31837]" />
        <p className="text-xs font-bold text-slate-500">Loading discount vouchers...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <Ticket className="size-6 text-[#E31837]" />
            Voucher & Discount Manager
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Create coupon codes, set fixed or percentage discounts, and manage usage limits
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <button className="h-10 px-5 bg-[#E31837] hover:bg-[#c4122c] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer shrink-0">
              <Plus className="size-4" />
              Create New Voucher
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-xl p-0 border-0 overflow-hidden rounded-xl shadow-2xl font-sans">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-extrabold text-[#0f172a] flex items-center gap-2">
                  <Ticket className="size-5 text-[#E31837]" />
                  Create Promotional Voucher
                </DialogTitle>
                <DialogDescription className="text-xs font-medium text-slate-500 mt-0.5">
                  Configure discount code rules and customer usage limits
                </DialogDescription>
              </div>
            </div>
            
            <form onSubmit={handleCreateVoucher} className="p-6 bg-white space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code" className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Voucher Code <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    id="code"
                    placeholder="COSTPLUS100"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                    className="h-9 text-xs font-mono font-bold uppercase border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                  <p className="text-[11px] font-medium text-slate-400 mt-1">Unique code customers enter at checkout</p>
                </div>

                <div>
                  <Label htmlFor="type" className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Discount Type <span className="text-[#E31837]">*</span>
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'fixed' | 'percentage') => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="h-9 text-xs font-semibold border-slate-200">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="value" className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    {formData.type === 'fixed' ? 'Discount Amount ($)' : 'Discount Percentage (%)'} <span className="text-[#E31837]">*</span>
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    step="0.01"
                    min="0"
                    max={formData.type === 'percentage' ? '100' : undefined}
                    placeholder={formData.type === 'fixed' ? '50.00' : '15'}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>

                <div>
                  <Label htmlFor="minPurchase" className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Minimum Cart Spend ($)
                  </Label>
                  <Input
                    id="minPurchase"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.minPurchase}
                    onChange={(e) => setFormData({ ...formData, minPurchase: e.target.value })}
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>

                <div>
                  <Label htmlFor="maxUses" className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Maximum Total Redemption Count
                  </Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>

                <div>
                  <Label htmlFor="expiresAt" className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Expiration Date
                  </Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <Label htmlFor="customerSpecific" className="text-xs font-extrabold text-slate-700 mb-1.5 block">
                    Restricted Customer Email (Optional)
                  </Label>
                  <Input
                    id="customerSpecific"
                    type="email"
                    placeholder="customer@restaurant.com.au"
                    value={formData.customerSpecific}
                    onChange={(e) => setFormData({ ...formData, customerSpecific: e.target.value })}
                    className="h-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
                  />
                  <p className="text-[11px] font-medium text-slate-400 mt-1">Restrict voucher redemption to a specific VIP buyer email</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setDialogOpen(false)}
                  className="h-9 px-4 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="h-9 px-5 bg-[#2D3748] hover:bg-[#1a202c] text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {submitting ? (
                    <><Loader2 className="size-4 animate-spin" />Creating...</>
                  ) : (
                    'Create Voucher'
                  )}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Tip Banner */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-3.5 flex items-center gap-3 text-xs sm:text-sm text-slate-700 font-medium">
        <Info className="size-5 text-[#E31837] shrink-0" />
        <div>
          <strong>Checkout Discount Redemption:</strong> Active vouchers are evaluated automatically during cart summary calculations and customer checkout.
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by code or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-xs font-semibold border-slate-200 focus:border-[#E31837] focus:ring-[#E31837]"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer border transition-all ${
              statusFilter === 'all'
                ? 'bg-[#2D3748] text-white border-[#2D3748]'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All ({vouchers.length})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer border transition-all ${
              statusFilter === 'active'
                ? 'bg-[#2D3748] text-white border-[#2D3748]'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Active ({vouchers.filter(v => v.active).length})
          </button>
          <button
            onClick={() => setStatusFilter('inactive')}
            className={`px-3 py-1.5 rounded-lg text-xs font-extrabold cursor-pointer border transition-all ${
              statusFilter === 'inactive'
                ? 'bg-[#2D3748] text-white border-[#2D3748]'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Inactive ({vouchers.filter(v => !v.active).length})
          </button>
        </div>
      </div>

      {/* Vouchers Grid */}
      {filteredVouchers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-xl shadow-xs border-dashed text-center p-6">
          <Ticket className="size-12 mb-3 text-slate-300" />
          <h3 className="text-base font-extrabold text-[#0f172a] mb-1">No vouchers found</h3>
          <p className="text-xs font-medium text-slate-500 mb-5">
            {searchQuery ? 'Try adjusting your search criteria' : 'Create your first promotional voucher code'}
          </p>
          <button
            onClick={() => setDialogOpen(true)}
            className="h-9 px-4 bg-[#E31837] hover:bg-[#c4122c] text-white rounded-xl font-bold text-xs shadow-2xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Plus className="size-4" />
            Create Voucher
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredVouchers.map((voucher) => (
            <Card key={voucher.id} className="bg-white rounded-xl shadow-xs border border-slate-200 flex flex-col hover:border-slate-300 transition-all overflow-hidden group">
              <div className="p-4 sm:p-5 flex flex-col h-full space-y-4">
                
                {/* Coupon Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-lg font-black font-mono tracking-tight text-[#0f172a]">
                        {voucher.code}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        voucher.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}>
                        {voucher.active ? 'Active' : 'Inactive'}
                      </span>
                      {voucher.type === 'fixed' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold border border-blue-200">
                          ${voucher.value.toFixed(2)} OFF
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[10px] font-extrabold border border-purple-200">
                          {voucher.value}% OFF
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setDeleteTargetId(voucher.id)}
                    className="size-7 rounded-lg text-slate-400 hover:text-[#E31837] hover:bg-red-50 flex items-center justify-center transition-all cursor-pointer opacity-80 sm:opacity-0 group-hover:opacity-100"
                    title="Delete Voucher"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>

                {/* Details Breakdown */}
                <div className="grid grid-cols-2 gap-2 text-xs font-medium pt-3 border-t border-slate-100">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Redemptions</p>
                    <p className="text-xs font-extrabold text-slate-800">
                      {voucher.used_count} / {voucher.max_uses || '∞'}
                    </p>
                  </div>
                  {voucher.min_purchase > 0 && (
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Min Spend</p>
                      <p className="text-xs font-extrabold text-slate-800">${voucher.min_purchase.toFixed(2)}</p>
                    </div>
                  )}
                  {voucher.expires_at && (
                    <div className="col-span-2">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5">Expires</p>
                      <p className="text-xs font-semibold text-slate-700">
                        {new Date(voucher.expires_at).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {voucher.customer_specific && (
                    <div className="col-span-2 pt-1">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-0.5 flex items-center gap-1">
                        <Users className="size-3 text-blue-600" /> Exclusive to
                      </p>
                      <p className="text-xs font-bold text-slate-800 truncate" title={voucher.customer_specific}>
                        {voucher.customer_specific}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Toggle Bar */}
                <div className="mt-auto pt-3 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400 font-semibold">
                  <span>Created {new Date(voucher.created_at).toLocaleDateString()}</span>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={voucher.active}
                      onChange={() => handleToggleActive(voucher)}
                      className="sr-only peer"
                    />
                    <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#E31837]"></div>
                  </label>
                </div>

              </div>
            </Card>
          ))}
        </div>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteVoucher}
        title="Delete Voucher"
        description="Are you sure you want to delete this discount voucher? This action cannot be undone."
        loading={deleting}
      />
    </div>
  );
}

