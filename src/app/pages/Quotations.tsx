import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { 
  FileText, Plus, Search, Eye, CheckCircle, XCircle, Clock, 
  Calendar, DollarSign, User, Package, Trash2
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

import { DeleteConfirmModal } from '../components/ui/DeleteConfirmModal';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface Quotation {
  id: string;
  quotationNumber: string;
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
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  validUntil: string;
  createdAt: string;
  notes?: string;
}

export function Quotations() {
  const navigate = useNavigate();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; quotationNumber: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/quotations/list`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQuotations(data.quotations || []);
      }
    } catch (error) {
      console.error('Error fetching quotations:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteQuotation = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/quotations/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${publicAnonKey}` }
      });
      if (res.ok) {
        setQuotations(prev => prev.filter(q => q.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        alert('Failed to delete quotation');
      }
    } catch (err) {
      console.error('Error deleting quotation:', err);
      alert('Failed to delete quotation');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5"><Clock className="size-3" />Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5"><CheckCircle className="size-3" />Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5"><XCircle className="size-3" />Rejected</Badge>;
      case 'expired':
        return <Badge className="bg-slate-200 text-slate-700 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase tracking-wider flex items-center gap-1.5"><Calendar className="size-3" />Expired</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase tracking-wider">{status}</Badge>;
    }
  };

  const filteredQuotations = quotations.filter(q => {
    const matchesSearch = 
      q.quotationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customer.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || q.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    total: quotations.length,
    pending: quotations.filter(q => q.status === 'pending').length,
    accepted: quotations.filter(q => q.status === 'accepted').length,
    totalValue: quotations.reduce((sum, q) => sum + q.total, 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-64 bg-slate-200 rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight">Quotations</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Manage customer quotations and convert to orders</p>
        </div>
        <button 
          onClick={() => navigate('/admin/quotations/create')}
          className="h-10 px-5 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer w-full sm:w-auto"
        >
          <Plus className="size-4" />
          Create Quotation
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Quotations', value: stats.total, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Accepted', value: stats.accepted, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Total Value', value: `$${stats.totalValue.toFixed(2)}`, icon: DollarSign, color: 'text-[#E31837]', bg: 'bg-rose-50' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">{stat.label}</p>
                <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">{stat.value}</p>
              </div>
              <div className={`size-11 rounded-xl ${stat.bg} border border-slate-100 flex items-center justify-center shrink-0`}>
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
            placeholder="Search quotations by # or customer..."
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
              <SelectItem value="pending" className="cursor-pointer text-xs sm:text-sm font-bold text-amber-700">Pending</SelectItem>
              <SelectItem value="accepted" className="cursor-pointer text-xs sm:text-sm font-bold text-emerald-700">Accepted</SelectItem>
              <SelectItem value="rejected" className="cursor-pointer text-xs sm:text-sm font-bold text-rose-700">Rejected</SelectItem>
              <SelectItem value="expired" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-600">Expired</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quotations List */}
      {filteredQuotations.length > 0 ? (
        <div className="space-y-3">
          {filteredQuotations.map((quotation) => (
            <div key={quotation.id} className="bg-white rounded-xl p-4 shadow-xs hover:shadow-sm transition-all border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
                  <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                    {quotation.quotationNumber}
                  </span>
                  {getStatusBadge(quotation.status)}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-slate-400 shrink-0">
                      <User className="size-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-[#0f172a] truncate">{quotation.customer.name}</p>
                      <p className="text-[11px] font-semibold text-slate-500 truncate">{quotation.customer.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-slate-400 shrink-0">
                      <Package className="size-3.5" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-700">{quotation.items.length} Items</p>
                      <p className="text-[11px] font-semibold text-slate-500">
                        {quotation.items.reduce((sum, item) => sum + item.quantity, 0)} units total
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="bg-rose-50 p-1.5 rounded-lg border border-rose-100 text-[#E31837] shrink-0">
                      <DollarSign className="size-3.5" />
                    </div>
                    <div>
                      <p className="font-black text-[#0f172a] text-sm">${quotation.total.toFixed(2)}</p>
                      <p className="text-[11px] font-semibold text-slate-500">Total (incl. GST)</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 mt-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    <Calendar className="size-3 text-slate-400" />
                    <span>Created: {new Date(quotation.createdAt).toLocaleDateString('en-AU')}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">
                    <Clock className="size-3 text-slate-400" />
                    <span>Valid: {new Date(quotation.validUntil).toLocaleDateString('en-AU')}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 shrink-0">
                <button 
                  onClick={() => navigate(`/admin/quotations/${quotation.id}`)}
                  className="size-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                  title="View Details"
                >
                  <Eye className="size-3.5" />
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget({ id: quotation.id, quotationNumber: quotation.quotationNumber });
                  }}
                  className="size-8 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-100 text-rose-600 hover:text-rose-700 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                  title="Delete Quotation"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl p-10 text-center shadow-xs border border-slate-200">
          <div className="bg-slate-50 size-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
            <FileText className="size-8 text-slate-300" />
          </div>
          <h3 className="text-base font-black text-[#0f172a] mb-1">No quotations found</h3>
          <p className="text-xs text-slate-500 font-medium mb-5">
            {searchQuery || filterStatus !== 'all' 
              ? 'Try adjusting your filters to find what you\'re looking for' 
              : 'Create your first quotation to get started'}
          </p>
          <button 
            onClick={() => navigate('/admin/quotations/create')}
            className="h-10 px-6 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 mx-auto cursor-pointer"
          >
            <Plus className="size-4" />
            Create Quotation
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteQuotation}
        title="Delete Quotation"
        description={deleteTarget ? `Are you sure you want to delete quotation ${deleteTarget.quotationNumber}? This action cannot be undone.` : ''}
        loading={deleting}
      />
    </div>
  );
}
