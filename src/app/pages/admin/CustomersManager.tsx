import { useState, useEffect } from 'react';
import { User, Search, Eye, Edit, Trash2, Loader2, UserPlus, Mail, Phone, DollarSign, Shield, Users } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Switch } from '../../components/ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { DeleteConfirmModal } from '../../components/ui/DeleteConfirmModal';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

export function CustomersManager() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [accessFilter, setAccessFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteTargetCustomer, setDeleteTargetCustomer] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    canSeeCostPrice: false,
    discountPercentage: 0,
    costPlusHundredAccess: false
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    let filtered = customers;

    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.phone?.includes(searchTerm)
      );
    }

    if (accessFilter === 'cost_price') {
      filtered = filtered.filter(c => c.can_see_cost_price);
    } else if (accessFilter === 'cost_plus_hundred') {
      filtered = filtered.filter(c => c.cost_plus_hundred_access);
    } else if (accessFilter === 'discount') {
      filtered = filtered.filter(c => c.discount_percentage > 0);
    } else if (accessFilter === 'retail') {
      filtered = filtered.filter(c => !c.can_see_cost_price && !c.cost_plus_hundred_access && (!c.discount_percentage || c.discount_percentage === 0));
    }

    setFilteredCustomers(filtered);
  }, [searchTerm, accessFilter, customers]);

  const fetchCustomers = async () => {
    try {
      setError(null);
      const response = await fetch(`${API_URL}/customers?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Cache-Control': 'no-cache',
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setCustomers(data.customers || []);
      setFilteredCustomers(data.customers || []);
      setError(null);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
      setError('Could not load customer database.');
      setCustomers([]);
      setFilteredCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setViewDialogOpen(true);
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setFormData({
      firstName: customer.first_name || '',
      lastName: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      password: '',
      canSeeCostPrice: customer.can_see_cost_price || false,
      discountPercentage: customer.discount_percentage || 0,
      costPlusHundredAccess: customer.cost_plus_hundred_access || false
    });
    setEditDialogOpen(true);
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      const response = await fetch(`${API_URL}/customers/${selectedCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update customer');

      await fetch(`${API_URL}/customers/${selectedCustomer.id}/update-access-levels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          canSeeCostPrice: formData.canSeeCostPrice,
          discountPercentage: formData.discountPercentage,
          costPlusHundredAccess: formData.costPlusHundredAccess,
        }),
      });

      setEditDialogOpen(false);
      await fetchCustomers();
    } catch (error) {
      console.error('Failed to update customer:', error);
      alert('Failed to update customer');
    }
  };

  const handleAddCustomer = async () => {
    try {
      const response = await fetch(`${API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add customer');
      }

      await fetchCustomers();
      setAddDialogOpen(false);
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        canSeeCostPrice: false,
        discountPercentage: 0,
        costPlusHundredAccess: false
      });
    } catch (error: any) {
      console.error('Failed to add customer:', error);
      alert(error.message || 'Failed to add customer');
    }
  };

  const confirmDeleteCustomer = async () => {
    if (!deleteTargetCustomer) return;
    setDeleting(true);

    try {
      const response = await fetch(`${API_URL}/customers/${deleteTargetCustomer.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete customer');
      }

      setDeleteTargetCustomer(null);
      await fetchCustomers();
    } catch (error) {
      console.error('Failed to delete customer:', error);
      alert('Failed to delete customer');
    } finally {
      setDeleting(false);
    }
  };

  const stats = {
    total: customers.length,
    costPrice: customers.filter(c => c.can_see_cost_price).length,
    costPlusHundred: customers.filter(c => c.cost_plus_hundred_access).length,
    discount: customers.filter(c => c.discount_percentage > 0).length,
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto pb-8 space-y-5">
        <div className="animate-pulse space-y-4">
          <div className="h-20 w-full bg-slate-100 rounded-xl border border-slate-200"></div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl border border-slate-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5">
      {/* Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight">Customers</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Manage your customers and their access levels
          </p>
        </div>
        <button 
          onClick={() => {
            setFormData({
              firstName: '',
              lastName: '',
              email: '',
              phone: '',
              password: '',
              canSeeCostPrice: false,
              discountPercentage: 0,
              costPlusHundredAccess: false
            });
            setAddDialogOpen(true);
          }}
          className="h-10 px-5 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer w-full sm:w-auto"
        >
          <UserPlus className="size-4" />
          Add Customer
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL CUSTOMERS', value: stats.total, icon: Users, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'WHOLESALE (COST)', value: stats.costPrice, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'COST + $100 ACCESS', value: stats.costPlusHundred, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'DISCOUNT ACCOUNTS', value: stats.discount, icon: DollarSign, color: 'text-blue-600', bg: 'bg-blue-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">{stat.value}</p>
              </div>
              <div className={`size-11 rounded-xl ${stat.bg} border border-slate-200 flex items-center justify-center shrink-0`}>
                <stat.icon className={`size-5.5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 flex items-center gap-3 text-xs font-bold">
          <Shield className="size-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        <div className="relative max-w-sm sm:max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-xs sm:text-sm font-semibold w-full"
          />
        </div>
        <div className="w-full sm:w-48 shrink-0">
          <Select value={accessFilter} onValueChange={(val) => setAccessFilter(val)}>
            <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:ring-1 focus:ring-[#E31837] text-xs sm:text-sm font-bold text-slate-700 cursor-pointer">
              <SelectValue placeholder="All Access Levels" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 rounded-xl shadow-xl z-50">
              <SelectItem value="all" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-700">All Access Levels</SelectItem>
              <SelectItem value="cost_price" className="cursor-pointer text-xs sm:text-sm font-bold text-emerald-700">Cost Price (Wholesale)</SelectItem>
              <SelectItem value="cost_plus_hundred" className="cursor-pointer text-xs sm:text-sm font-bold text-purple-700">Cost + $100</SelectItem>
              <SelectItem value="discount" className="cursor-pointer text-xs sm:text-sm font-bold text-blue-700">Discounted</SelectItem>
              <SelectItem value="retail" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-600">Standard Retail</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-sm font-extrabold text-[#0f172a]">Customers List</h3>
          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full">
            {filteredCustomers.length} Total Records
          </span>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="text-center p-12 bg-white">
            <div className="bg-slate-50 size-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <User className="size-8 text-slate-400" />
            </div>
            <h3 className="text-base font-black text-[#0f172a] mb-1">No customers found</h3>
            <p className="text-xs text-slate-500 font-medium">Try adjusting your search query or filter</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto bg-white">
            <div className="min-w-[900px]">
              {/* Header row */}
              <div className="flex items-center px-6 py-3.5 border-b border-slate-200 bg-slate-50/80">
                <div className="w-[30%] text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer</div>
                <div className="w-[20%] text-[11px] font-bold text-slate-500 uppercase tracking-wider">Contact Info</div>
                <div className="w-[25%] text-[11px] font-bold text-slate-500 uppercase tracking-wider">Access Level</div>
                <div className="w-[15%] text-[11px] font-bold text-slate-500 uppercase tracking-wider">Joined Date</div>
                <div className="w-[10%] text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-slate-200">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="flex items-center px-6 py-4 hover:bg-slate-50/80 transition-colors">
                    <div className="w-[30%] flex items-center gap-4">
                      <div className="size-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 shadow-xs shrink-0">
                        <span className="font-extrabold text-slate-600 text-sm">
                          {customer.first_name?.[0]}{customer.last_name?.[0]}
                        </span>
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-[#0f172a]">{customer.first_name} {customer.last_name}</div>
                        <div className="text-[11px] font-semibold text-slate-400">ID: {customer.id}</div>
                      </div>
                    </div>
                    <div className="w-[20%]">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1">
                        <Mail className="size-3.5 text-slate-400" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                        <Phone className="size-3 text-slate-400" />
                        <span>{customer.phone || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="w-[25%]">
                      {customer.can_see_cost_price ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                          <DollarSign className="size-3" />
                          Cost Price
                        </span>
                      ) : customer.cost_plus_hundred_access ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 border border-purple-200 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                          <DollarSign className="size-3" />
                          Cost + $100
                        </span>
                      ) : customer.discount_percentage > 0 ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                          <DollarSign className="size-3" />
                          {customer.discount_percentage}% OFF
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-extrabold rounded-full uppercase tracking-wider">
                          Retail (Normal)
                        </span>
                      )}
                    </div>
                    <div className="w-[15%] text-xs font-semibold text-slate-500">
                      {new Date(customer.created_at).toLocaleDateString('en-AU', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="w-[10%] flex justify-end gap-1.5">
                      <button
                        onClick={() => handleViewCustomer(customer)}
                        className="size-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                        title="View Details"
                      >
                        <Eye className="size-3.5" />
                      </button>
                      <button
                        onClick={() => handleEditCustomer(customer)}
                        className="size-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                        title="Edit Customer"
                      >
                        <Edit className="size-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetCustomer(customer)}
                        className="size-8 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 hover:text-rose-700 flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                        title="Delete Customer"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View Customer Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border border-slate-200 rounded-xl shadow-xl">
          <DialogHeader className="p-5 border-b border-slate-200 bg-slate-50/50">
            <DialogTitle className="text-lg font-black text-[#0f172a]">Customer Details</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Customer ID</Label>
                  <p className="font-mono text-xs font-bold text-[#0f172a] bg-slate-50 p-2.5 rounded-lg border border-slate-200">#{selectedCustomer.id}</p>
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Joined Date</Label>
                  <p className="text-xs font-bold text-[#0f172a] bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    {new Date(selectedCustomer.created_at).toLocaleDateString('en-AU')}
                  </p>
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">First Name</Label>
                  <p className="text-xs font-bold text-[#0f172a] bg-slate-50 p-2.5 rounded-lg border border-slate-200">{selectedCustomer.first_name}</p>
                </div>
                <div>
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Last Name</Label>
                  <p className="text-xs font-bold text-[#0f172a] bg-slate-50 p-2.5 rounded-lg border border-slate-200">{selectedCustomer.last_name}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Email</Label>
                  <p className="text-xs font-bold text-[#0f172a] bg-slate-50 p-2.5 rounded-lg border border-slate-200">{selectedCustomer.email}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Phone</Label>
                  <p className="text-xs font-bold text-[#0f172a] bg-slate-50 p-2.5 rounded-lg border border-slate-200">{selectedCustomer.phone || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Customer Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border border-slate-200 rounded-xl shadow-xl">
          <DialogHeader className="p-5 border-b border-slate-200 bg-slate-50/50">
            <DialogTitle className="text-lg font-black text-[#0f172a]">Add New Customer</DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-wider">Create a new customer account</DialogDescription>
          </DialogHeader>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">First Name *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                  className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white text-xs font-semibold"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Last Name *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                  className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white text-xs font-semibold"
                />
              </div>
            </div>
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white text-xs font-semibold"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phone *</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
                className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white text-xs font-semibold"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Password *</Label>
              <Input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white text-xs font-semibold"
              />
            </div>
            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <Switch
                checked={formData.canSeeCostPrice}
                onCheckedChange={(e) => setFormData({...formData, canSeeCostPrice: e})}
              />
              <Label className="text-xs font-bold text-[#0f172a] uppercase tracking-wider cursor-pointer m-0">Can See Cost Price</Label>
            </div>
          </div>
          <DialogFooter className="p-5 border-t border-slate-200 bg-slate-50/50 sm:justify-end gap-2">
            <button 
              type="button" 
              onClick={() => setAddDialogOpen(false)}
              className="h-10 px-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              Cancel
            </button>
            <button 
              onClick={handleAddCustomer} 
              className="h-10 px-5 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              Add Customer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col max-h-[90vh]">
          <DialogHeader className="p-5 border-b border-slate-200 bg-slate-50/50">
            <DialogTitle className="text-lg font-black text-[#0f172a]">Edit Customer</DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-400 uppercase tracking-wider">Update customer information</DialogDescription>
          </DialogHeader>
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">First Name *</Label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  required
                  className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white text-xs font-semibold"
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Last Name *</Label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  required
                  className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white text-xs font-semibold"
                />
              </div>
            </div>
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white text-xs font-semibold"
              />
            </div>
            <div>
              <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phone *</Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                required
                className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white text-xs font-semibold"
              />
            </div>

            {/* Access Levels */}
            <div className="border-t border-slate-200 pt-4 mt-4">
              <h3 className="text-xs font-extrabold mb-3 flex items-center gap-2 text-[#0f172a]">
                <Shield className="size-4 text-slate-400" />
                Customer Pricing Level
              </h3>
              
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                      Cost Price Level
                    </Label>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed mt-0.5">
                      Customer buys at cost price.
                    </p>
                  </div>
                  <Switch
                    checked={formData.canSeeCostPrice}
                    onCheckedChange={(checked) => {
                      setFormData({
                        ...formData,
                        canSeeCostPrice: checked,
                        discountPercentage: checked ? 0 : formData.discountPercentage,
                        costPlusHundredAccess: checked ? false : formData.costPlusHundredAccess
                      });
                    }}
                  />
                </div>

                <div className="flex items-start justify-between gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="space-y-1 flex-1">
                    <Label className="text-xs font-bold text-slate-700 flex items-center gap-2 uppercase tracking-wider">
                      Cost + $100 Pricing
                    </Label>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed mt-0.5">
                      Customer pays Cost + $100 on specified categories.
                    </p>
                  </div>
                  <Switch
                    checked={formData.costPlusHundredAccess}
                    onCheckedChange={(checked) => {
                      setFormData({
                        ...formData,
                        costPlusHundredAccess: checked,
                        canSeeCostPrice: checked ? false : formData.canSeeCostPrice,
                        discountPercentage: checked ? 0 : formData.discountPercentage
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="p-5 border-t border-slate-200 bg-slate-50/50 sm:justify-end gap-2">
            <button 
              type="button" 
              onClick={() => setEditDialogOpen(false)}
              className="h-10 px-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
            >
              Cancel
            </button>
            <button 
              onClick={handleUpdateCustomer} 
              className="h-10 px-5 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              Update Customer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTargetCustomer}
        onClose={() => setDeleteTargetCustomer(null)}
        onConfirm={confirmDeleteCustomer}
        title="Delete Customer Account"
        description={`Are you sure you want to delete ${deleteTargetCustomer?.first_name || ''} ${deleteTargetCustomer?.last_name || ''}? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}