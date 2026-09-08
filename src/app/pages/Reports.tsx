import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { 
  DollarSign, ShoppingCart, Users, Package, TrendingUp, 
  FileText, Receipt, Clock, AlertCircle, Download, RotateCcw
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface DashboardData {
  revenue: {
    total: number;
    monthly: number;
  };
  orders: {
    total: number;
    pending: number;
  };
  customers: {
    total: number;
  };
  quotations: {
    total: number;
    pending: number;
    accepted: number;
  };
  invoices: {
    total: number;
    unpaid: number;
    overdue: number;
    unpaidAmount: number;
  };
  products: {
    total: number;
  };
}

interface SalesReport {
  period: string;
  totalSales: number;
  totalOrders: number;
  paidOrders: number;
  averageOrderValue: number;
  salesByDate: Array<{
    date: string;
    sales: number;
    orders: number;
  }>;
}

interface TopProduct {
  id: string;
  name: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

export function Reports() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  useEffect(() => {
    fetchDashboardData();
    fetchSalesReport(selectedPeriod);
    fetchTopProducts();
  }, [selectedPeriod]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_URL}/reports/dashboard`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data.dashboard);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchSalesReport = async (period: string) => {
    try {
      const response = await fetch(`${API_URL}/reports/sales?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSalesReport(data.report);
      }
    } catch (error) {
      console.error('Error fetching sales report:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTopProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/reports/products`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTopProducts(data.report?.topProducts?.slice(0, 10) || []);
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
    }
  };

  const exportReport = () => {
    window.open(`${API_URL}/reports/export/comprehensive?period=${selectedPeriod}`, '_blank');
  };

  if (loading || !dashboardData) {
    return (
      <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
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
    <div className="max-w-7xl mx-auto pb-8 space-y-5 font-sans">
      {/* Header Card */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight flex items-center gap-2">
            <TrendingUp className="size-6 text-[#E31837]" />
            Reports & Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Track your business performance and key sales metrics</p>
        </div>
        <button
          onClick={exportReport}
          className="h-10 px-5 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer w-full sm:w-auto"
        >
          <Download className="size-4" />
          Export Report
        </button>
      </div>

      {/* Primary Key Metrics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">TOTAL REVENUE</p>
              <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">${dashboardData.revenue.total.toLocaleString()}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                This month: <strong className="text-emerald-600 font-bold">${dashboardData.revenue.monthly.toLocaleString()}</strong>
              </p>
            </div>
            <div className="size-11 rounded-xl bg-emerald-50 border border-slate-200 flex items-center justify-center shrink-0 text-emerald-600">
              <DollarSign className="size-5.5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">TOTAL ORDERS</p>
              <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">{dashboardData.orders.total}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                <strong className="text-amber-600 font-bold">{dashboardData.orders.pending}</strong> pending orders
              </p>
            </div>
            <div className="size-11 rounded-xl bg-blue-50 border border-slate-200 flex items-center justify-center shrink-0 text-blue-600">
              <ShoppingCart className="size-5.5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">TOTAL CUSTOMERS</p>
              <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">{dashboardData.customers.total}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Active customer accounts</p>
            </div>
            <div className="size-11 rounded-xl bg-purple-50 border border-slate-200 flex items-center justify-center shrink-0 text-purple-600">
              <Users className="size-5.5" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">TOTAL PRODUCTS</p>
              <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">{dashboardData.products.total}</p>
              <p className="text-xs text-slate-500 font-semibold mt-1">Active catalog items</p>
            </div>
            <div className="size-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 text-slate-600">
              <Package className="size-5.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Quotations Breakdown Card */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
            <FileText className="size-4 text-blue-600" />
            <h3 className="text-xs font-black text-[#0f172a] uppercase tracking-wider">Quotations Overview</h3>
          </div>
          <div className="p-4 space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Total Quotations:</span>
              <span className="font-extrabold text-[#0f172a]">{dashboardData.quotations.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Pending Quotes:</span>
              <span className="font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs">{dashboardData.quotations.pending}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Accepted Quotes:</span>
              <span className="font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full text-xs">{dashboardData.quotations.accepted}</span>
            </div>
          </div>
        </div>

        {/* Invoices Breakdown Card */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
            <Receipt className="size-4 text-emerald-600" />
            <h3 className="text-xs font-black text-[#0f172a] uppercase tracking-wider">Invoices Breakdown</h3>
          </div>
          <div className="p-4 space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Total Invoices:</span>
              <span className="font-extrabold text-[#0f172a]">{dashboardData.invoices.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Unpaid Invoices:</span>
              <span className="font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-0.5 rounded-full text-xs">{dashboardData.invoices.unpaid}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Overdue Invoices:</span>
              <span className="font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2.5 py-0.5 rounded-full text-xs">{dashboardData.invoices.overdue}</span>
            </div>
          </div>
        </div>

        {/* Unpaid Amount Card */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-2">
            <DollarSign className="size-4 text-[#E31837]" />
            <h3 className="text-xs font-black text-[#0f172a] uppercase tracking-wider">Outstanding Invoices Amount</h3>
          </div>
          <div className="p-4 space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-semibold">Unpaid Balance:</span>
              <span className="text-base font-black text-[#E31837] bg-rose-50 border border-rose-200 px-3 py-1 rounded-lg">
                ${dashboardData.invoices.unpaidAmount.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              Track customer payments and follow up on overdue amounts.
            </p>
          </div>
        </div>
      </div>

      {/* Sales Report Container */}
      {salesReport && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-sm font-black text-[#0f172a]">Sales Performance Breakdown</h3>
            <div className="w-full sm:w-44">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="h-9 bg-white border-slate-200 rounded-xl hover:bg-slate-50 text-xs sm:text-sm font-bold text-slate-700 cursor-pointer">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                  <SelectItem value="day" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-700">Today</SelectItem>
                  <SelectItem value="week" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-700">This Week</SelectItem>
                  <SelectItem value="month" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-700">This Month</SelectItem>
                  <SelectItem value="year" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-700">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Total Sales</p>
                <p className="text-xl sm:text-2xl font-black text-[#0f172a]">${salesReport.totalSales.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Total Orders</p>
                <p className="text-xl sm:text-2xl font-black text-[#0f172a]">{salesReport.totalOrders}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Paid Orders</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-600">{salesReport.paidOrders}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-1">Avg Order Value</p>
                <p className="text-xl sm:text-2xl font-black text-[#E31837]">${salesReport.averageOrderValue.toFixed(2)}</p>
              </div>
            </div>

            {/* Sales by Date Chart */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Sales Trend By Date</h4>
              {salesReport.salesByDate.slice(-7).map((day, idx) => (
                <div key={`${day.date}-${idx}`} className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3 rounded-xl transition-colors">
                  <span className="text-xs font-bold text-slate-700 w-28 shrink-0">{new Date(day.date).toLocaleDateString('en-AU')}</span>
                  <div className="flex-1 bg-slate-200 rounded-full h-7 relative overflow-hidden">
                    <div 
                      className="absolute inset-y-0 left-0 bg-[#0f172a] flex items-center px-3 text-white text-xs font-bold rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.max((day.sales / Math.max(...salesReport.salesByDate.map(d => d.sales))) * 100, 10)}%` 
                      }}
                    >
                      ${day.sales.toFixed(0)}
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-500 w-24 text-right shrink-0">{day.orders} order(s)</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Products Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50">
          <h3 className="text-sm font-black text-[#0f172a]">Top Selling Products</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {topProducts.map((product, index) => (
            <div key={product.id} className="flex items-center gap-4 p-4 hover:bg-slate-50/80 transition-colors">
              <div className="size-9 flex items-center justify-center bg-slate-100 border border-slate-200 text-slate-700 rounded-xl font-black text-xs shrink-0">
                #{index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs sm:text-sm font-extrabold text-[#0f172a] truncate">{product.name}</h4>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">
                  {product.totalQuantity} units sold • {product.orderCount} order(s)
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-xs sm:text-sm font-black text-[#E31837]">
                  ${product.totalRevenue.toLocaleString()}
                </p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Revenue</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
