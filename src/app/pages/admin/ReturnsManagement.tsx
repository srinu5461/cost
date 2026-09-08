import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Input } from '../../components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../../components/ui/select';
import { 
  Package, Search, Eye, CheckCircle, Clock, 
  DollarSign, Download, RotateCcw, Calendar, AlertCircle
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface ReturnItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Return {
  id: string;
  returnNumber: string;
  orderId: string;
  customer: {
    name: string;
    email: string;
  };
  items: ReturnItem[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  refundAmount: number;
  createdAt: string;
  processedAt?: string;
}

export function ReturnsManagement() {
  const navigate = useNavigate();
  const [returns, setReturns] = useState<Return[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    totalRefunded: 0,
  });

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const response = await fetch(`${API_URL}/returns/list`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReturns(data.returns || []);
        calculateStats(data.returns || []);
      }
    } catch (error) {
      console.error('Error fetching returns:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (returnsList: Return[]) => {
    const stats = {
      total: returnsList.length,
      pending: returnsList.filter(r => r.status === 'pending').length,
      approved: returnsList.filter(r => r.status === 'approved').length,
      rejected: returnsList.filter(r => r.status === 'rejected').length,
      totalRefunded: returnsList
        .filter(r => r.status === 'refunded')
        .reduce((sum, r) => sum + (r.refundAmount || 0), 0),
    };
    setStats(stats);
  };

  const filteredReturns = returns.filter(ret => {
    const matchesSearch = 
      ret.returnNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.orderId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || ret.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 border border-amber-200 rounded-full font-bold text-xs uppercase tracking-wider">
            <Clock className="size-3.5" />
            Pending Review
          </span>
        );
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200 rounded-full font-bold text-xs uppercase tracking-wider">
            <CheckCircle className="size-3.5" />
            Approved
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-800 border border-red-200 rounded-full font-bold text-xs uppercase tracking-wider">
            <AlertCircle className="size-3.5" />
            Rejected
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full font-bold text-xs uppercase tracking-wider">
            <CheckCircle className="size-3.5" />
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full font-bold text-xs uppercase tracking-wider">
            {status}
          </span>
        );
    }
  };

  const exportReturns = () => {
    window.open(
      `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049/returns/export`,
      '_blank'
    );
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
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <RotateCcw className="size-6 text-[#E31837]" />
            Returns & Refunds Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            Process customer return requests, inspect items, and issue refunds
          </p>
        </div>
        <button
          onClick={exportReturns}
          className="h-10 px-5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto"
        >
          <Download className="size-4" />
          Export Returns
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'TOTAL RETURNS', value: stats.total, icon: Package, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'PENDING REVIEW', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'APPROVED REQUESTS', value: stats.approved, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'TOTAL REFUNDED', value: `$${stats.totalRefunded.toFixed(2)}`, icon: DollarSign, color: 'text-[#E31837]', bg: 'bg-rose-50' },
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

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
        <div className="relative max-w-sm sm:max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search by return #, order #, customer name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-xs sm:text-sm font-semibold w-full"
          />
        </div>
        <div className="w-full sm:w-44 shrink-0">
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val)}>
            <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:ring-1 focus:ring-[#E31837] text-xs sm:text-sm font-bold text-slate-700 cursor-pointer">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-slate-200 rounded-xl shadow-xl z-50">
              <SelectItem value="all" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-700">All Statuses</SelectItem>
              <SelectItem value="pending" className="cursor-pointer text-xs sm:text-sm font-bold text-amber-700">Pending</SelectItem>
              <SelectItem value="approved" className="cursor-pointer text-xs sm:text-sm font-bold text-blue-700">Approved</SelectItem>
              <SelectItem value="rejected" className="cursor-pointer text-xs sm:text-sm font-bold text-rose-700">Rejected</SelectItem>
              <SelectItem value="refunded" className="cursor-pointer text-xs sm:text-sm font-bold text-emerald-700">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        {/* Table Header */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-sm font-extrabold text-[#0f172a]">Returns List</h3>
          <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full">
            {filteredReturns.length} Total Records
          </span>
        </div>

        {filteredReturns.length > 0 ? (
          <div className="w-full overflow-x-auto bg-white">
            <div className="min-w-[850px]">
              {/* Header row */}
              <div className="flex items-center px-6 py-3.5 border-b border-slate-200 bg-slate-50/80">
                <div className="w-[30%] text-[11px] font-bold text-slate-500 uppercase tracking-wider">Return Details</div>
                <div className="w-[30%] text-[11px] font-bold text-slate-500 uppercase tracking-wider">Customer</div>
                <div className="w-[20%] text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</div>
                <div className="w-[10%] text-[11px] font-bold text-slate-500 uppercase tracking-wider">Refund Amount</div>
                <div className="w-[10%] text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</div>
              </div>

              {/* Data Rows */}
              <div className="divide-y divide-slate-200">
                {filteredReturns.map((ret) => (
                  <div key={ret.id} className="flex items-center px-6 py-4 hover:bg-slate-50/80 transition-colors">
                    <div className="w-[30%] flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                        <RotateCcw className="size-4" />
                      </div>
                      <div>
                        <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 block w-fit">
                          {ret.returnNumber}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 mt-1">
                          <Calendar className="size-3 text-slate-400" />
                          <span>Order: {ret.orderId} • {new Date(ret.createdAt).toLocaleDateString('en-AU')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="w-[30%] min-w-0 pr-4">
                      <p className="font-extrabold text-sm text-[#0f172a] truncate">{ret.customer?.name}</p>
                      <p className="text-xs font-semibold text-slate-500 truncate">{ret.customer?.email}</p>
                    </div>

                    <div className="w-[20%]">
                      {getStatusBadge(ret.status)}
                    </div>

                    <div className="w-[10%]">
                      <p className="font-black text-[#0f172a] text-sm">${(ret.refundAmount || 0).toFixed(2)}</p>
                      <p className="text-xs font-semibold text-slate-500">
                        {ret.items?.length || 0} {ret.items?.length === 1 ? 'Item' : 'Items'}
                      </p>
                    </div>

                    <div className="w-[10%] flex justify-end gap-1.5">
                      <button
                        onClick={() => navigate(`/admin/returns/${ret.id}`)}
                        className="size-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-all flex items-center justify-center cursor-pointer shadow-2xs"
                        title="View Return Details"
                      >
                        <Eye className="size-3.5" />
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
              <Package className="size-8 text-slate-400" />
            </div>
            <h3 className="text-base font-black text-[#0f172a] mb-1">No return requests found</h3>
            <p className="text-xs text-slate-500 font-medium">
              Try adjusting your search query or status filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
