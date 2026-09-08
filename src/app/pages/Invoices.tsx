import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '../components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import {
  Receipt, Plus, Search, Eye, DollarSign,
  AlertCircle, CheckCircle, Clock, Calendar, Trash2
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId?: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
    company?: string;
  };
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'unpaid' | 'paid' | 'overdue' | 'cancelled';
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  notes?: string;
}

export function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; invoiceNumber: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/invoices/list`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data.invoices || []);
      }
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteInvoice = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/invoices/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        setInvoices(prev => prev.filter(inv => inv.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        alert('Failed to delete invoice');
      }
    } catch (error) {
      console.error('Error deleting invoice:', error);
      alert('Failed to delete invoice');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (invoice: Invoice) => {
    const isOverdue = invoice.status === 'unpaid' && new Date(invoice.dueDate) < new Date();

    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 border border-red-200 rounded-full font-bold text-xs uppercase tracking-wider">
          <AlertCircle className="size-3.5" />
          Overdue
        </span>
      );
    }

    switch (invoice.status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full font-bold text-xs uppercase tracking-wider">
            <CheckCircle className="size-3.5" />
            Paid
          </span>
        );
      case 'unpaid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full font-bold text-xs uppercase tracking-wider">
            <Clock className="size-3.5" />
            Unpaid
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full font-bold text-xs uppercase tracking-wider">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full font-bold text-xs uppercase tracking-wider">
            {invoice.status}
          </span>
        );
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.customer.email.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesStatus = true;
    if (filterStatus === 'overdue') {
      matchesStatus = inv.status === 'unpaid' && new Date(inv.dueDate) < new Date();
    } else if (filterStatus !== 'all') {
      matchesStatus = inv.status === filterStatus;
    }

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: invoices.length,
    unpaid: invoices.filter(i => i.status === 'unpaid').length,
    overdue: invoices.filter(i => i.status === 'unpaid' && new Date(i.dueDate) < new Date()).length,
    unpaidAmount: invoices.filter(i => i.status === 'unpaid').reduce((sum, i) => sum + i.total, 0),
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
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight">Invoices</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Manage customer invoices and track payment statuses</p>
        </div>
        <button
          onClick={() => navigate('/admin/invoices/create')}
          className="h-10 px-5 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer w-full sm:w-auto"
        >
          <Plus className="size-4" />
          Create Invoice
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Invoices', value: stats.total, icon: Receipt, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Unpaid', value: stats.unpaid, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50' },
          { label: 'Unpaid Amount', value: `$${stats.unpaidAmount.toFixed(2)}`, icon: DollarSign, color: 'text-[#E31837]', bg: 'bg-rose-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">{stat.label}</p>
                <p className={`text-2xl sm:text-3xl font-black ${stat.label === 'Overdue' ? 'text-rose-600' : 'text-[#0f172a]'}`}>{stat.value}</p>
              </div>
              <div className={`size-11 rounded-xl ${stat.bg} border border-slate-200 flex items-center justify-center shrink-0`}>
                <stat.icon className={`size-5.5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        <div className="relative max-w-sm sm:max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search invoices by # or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-xs sm:text-sm font-semibold w-full"
          />
        </div>
        <div className="w-full sm:w-44 shrink-0">
          <Select value={filterStatus} onValueChange={(val) => setFilterStatus(val)}>
            <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:ring-1 focus:ring-[#E31837] text-xs sm:text-sm font-bold text-slate-700 cursor-pointer">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 rounded-xl shadow-xl z-50">
              <SelectItem value="all" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-700">All Status</SelectItem>
              <SelectItem value="unpaid" className="cursor-pointer text-xs sm:text-sm font-bold text-amber-700">Unpaid</SelectItem>
              <SelectItem value="overdue" className="cursor-pointer text-xs sm:text-sm font-bold text-rose-700">Overdue</SelectItem>
              <SelectItem value="paid" className="cursor-pointer text-xs sm:text-sm font-bold text-emerald-700">Paid</SelectItem>
              <SelectItem value="cancelled" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-600">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main List Card Container with Border */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Table Header Bar */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-sm font-extrabold text-[#0f172a]">Invoices List</h3>
          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full">
            {filteredInvoices.length} Total Records
          </span>
        </div>

        {filteredInvoices.length > 0 ? (
          <div className="w-full overflow-x-auto bg-white">
            <div className="min-w-[850px]">
              {/* Header row */}
              <div className="flex items-center px-6 py-3.5 border-b border-slate-200 bg-slate-50/80">
                <div className="w-[30%] text-[11px] font-bold text-slate-500 uppercase tracking-wider">Invoice Details</div>
                <div className="w-[30%] text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer</div>
                <div className="w-[20%] text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</div>
                <div className="w-[10%] text-[11px] font-bold text-slate-500 uppercase tracking-wider">Amount</div>
                <div className="w-[10%] text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</div>
              </div>

              {/* Data Rows */}
              <div className="divide-y divide-slate-200">
                {filteredInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center px-6 py-4 hover:bg-slate-50/80 transition-colors">
                    <div className="w-[30%] flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        <Receipt className="size-4" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 block w-fit">
                          {invoice.invoiceNumber}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-1">
                          <Calendar className="size-3 text-slate-400" />
                          <span>{new Date(invoice.createdAt).toLocaleDateString('en-AU')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-[30%] min-w-0 pr-4">
                      <p className="font-extrabold text-sm text-[#0f172a] truncate">{invoice.customer.name}</p>
                      <p className="text-xs font-semibold text-slate-500 truncate">{invoice.customer.email}</p>
                    </div>

                    <div className="w-[20%]">
                      {getStatusBadge(invoice)}
                    </div>

                    <div className="w-[10%]">
                      <p className="font-black text-[#0f172a] text-sm">${invoice.total.toFixed(2)}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {invoice.items?.length || 0} {invoice.items?.length === 1 ? 'Item' : 'Items'}
                      </p>
                    </div>

                    <div className="w-[10%] flex justify-end gap-1.5">
                      <button
                        onClick={() => navigate(`/admin/invoices/${invoice.id}`)}
                        className="size-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                        title="View Details"
                      >
                        <Eye className="size-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget({ id: invoice.id, invoiceNumber: invoice.invoiceNumber });
                        }}
                        className="size-8 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 hover:text-rose-700 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                        title="Delete Invoice"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-12 bg-white">
            <div className="bg-slate-50 size-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200">
              <Receipt className="size-8 text-slate-400" />
            </div>
            <h3 className="text-base font-black text-[#0f172a] mb-1">No invoices found</h3>
            <p className="text-xs text-slate-500 font-medium mb-5">
              {searchQuery || filterStatus !== 'all'
                ? 'Try adjusting your filters to find what you\'re looking for'
                : 'Create your first invoice to get started'}
            </p>
            <button
              onClick={() => navigate('/admin/invoices/create')}
              className="h-10 px-6 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 mx-auto cursor-pointer"
            >
              <Plus className="size-4" />
              Create Invoice
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteInvoice}
        title="Delete Invoice"
        description={deleteTarget ? `Are you sure you want to delete invoice ${deleteTarget.invoiceNumber}? This action cannot be undone.` : ''}
        loading={deleting}
      />
    </div>
  );
}