import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  DollarSign, ShoppingCart, Users, Package, 
  AlertCircle, Download, RotateCcw, Filter, BarChart3, TrendingUp, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Input } from '../../components/ui/input';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface DashboardData {
  revenue: {
    total: number;
    monthly: number;
    previousMonth: number;
    growth: number;
  };
  orders: {
    total: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
  };
  quotations: {
    total: number;
    pending: number;
    accepted: number;
    rejected: number;
    conversionRate: number;
  };
  invoices: {
    total: number;
    unpaid: number;
    overdue: number;
    paid: number;
    unpaidAmount: number;
    paidAmount: number;
  };
  returns: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    totalRefunded: number;
  };
  products: {
    total: number;
    lowStock: number;
    outOfStock: number;
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
  sku: string;
  totalQuantity: number;
  totalRevenue: number;
  orderCount: number;
}

interface TopCustomer {
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
}

export function ReportsAdvanced() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [topCustomers, setTopCustomers] = useState<TopCustomer[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [reportType, setReportType] = useState<'overview' | 'sales' | 'products' | 'customers' | 'inventory'>('overview');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    fetchAllData();
  }, [selectedPeriod, startDate, endDate]);

  const fetchAllData = async () => {
    setLoading(true);
    await Promise.all([
      fetchDashboardData(),
      fetchSalesReport(selectedPeriod),
      fetchTopProducts(),
      fetchTopCustomers(),
    ]);
    setLoading(false);
  };

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
      let url = `${API_URL}/reports/sales?period=${period}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      
      const response = await fetch(url, {
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
        setTopProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error fetching top products:', error);
    }
  };

  const fetchTopCustomers = async () => {
    try {
      const response = await fetch(`${API_URL}/reports/customers`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTopCustomers(data.customers || []);
      }
    } catch (error) {
      console.error('Error fetching top customers:', error);
    }
  };

  const exportReport = (type: string) => {
    window.open(`${API_URL}/reports/export/${type}?period=${selectedPeriod}`, '_blank');
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
            <BarChart3 className="size-6 text-[#E31837]" />
            Business Analytics & Reports
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">Real-time revenue metrics, sales trends, top products, and customer insights</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={fetchAllData}
            className="h-10 px-4 bg-white border border-slate-200 text-[#0f172a] hover:bg-slate-50 rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="size-4" />
            Refresh
          </button>
          <button 
            onClick={() => exportReport('comprehensive')}
            className="h-10 px-5 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl font-bold transition-all shadow-2xs text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="size-4" />
            Export Full Report
          </button>
        </div>
      </div>

      {/* Tab Navigation Pill Bar */}
      <div className="bg-white rounded-xl p-2 shadow-xs border border-slate-200">
        <div className="flex gap-1.5 flex-wrap">
          <button
            className={`h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${reportType === 'overview' ? 'bg-[#0f172a] text-white shadow-2xs' : 'bg-transparent text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setReportType('overview')}
          >
            <BarChart3 className="size-4" />
            Overview
          </button>
          <button
            className={`h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${reportType === 'sales' ? 'bg-[#0f172a] text-white shadow-2xs' : 'bg-transparent text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setReportType('sales')}
          >
            <DollarSign className="size-4" />
            Sales Performance
          </button>
          <button
            className={`h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${reportType === 'products' ? 'bg-[#0f172a] text-white shadow-2xs' : 'bg-transparent text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setReportType('products')}
          >
            <Package className="size-4" />
            Top Products
          </button>
          <button
            className={`h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${reportType === 'customers' ? 'bg-[#0f172a] text-white shadow-2xs' : 'bg-transparent text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setReportType('customers')}
          >
            <Users className="size-4" />
            Top Customers
          </button>
          <button
            className={`h-9 px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${reportType === 'inventory' ? 'bg-[#0f172a] text-white shadow-2xs' : 'bg-transparent text-slate-600 hover:bg-slate-100'}`}
            onClick={() => setReportType('inventory')}
          >
            <AlertCircle className="size-4" />
            Inventory Health
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200">
        <div className="flex flex-col md:flex-row gap-3 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-extrabold text-slate-500 mb-1 block uppercase tracking-wider">Selected Time Period</label>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 text-xs sm:text-sm font-bold text-slate-700 cursor-pointer">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-slate-200 rounded-xl shadow-xl z-50">
                <SelectItem value="day" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-700">Today</SelectItem>
                <SelectItem value="week" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-700">This Week</SelectItem>
                <SelectItem value="month" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-700">This Month</SelectItem>
                <SelectItem value="quarter" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-700">This Quarter</SelectItem>
                <SelectItem value="year" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-700">This Year</SelectItem>
                <SelectItem value="custom" className="cursor-pointer text-xs sm:text-sm font-bold text-slate-700">Custom Date Range</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedPeriod === 'custom' && (
            <>
              <div className="flex-1 w-full">
                <label className="text-xs font-extrabold text-slate-500 mb-1 block uppercase tracking-wider">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 text-xs font-semibold"
                />
              </div>
              <div className="flex-1 w-full">
                <label className="text-xs font-extrabold text-slate-500 mb-1 block uppercase tracking-wider">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 text-xs font-semibold"
                />
              </div>
            </>
          )}
          
          <button 
            onClick={fetchAllData}
            className="h-10 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-xs font-bold px-4 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs w-full md:w-auto"
          >
            <Filter className="size-4" />
            Apply Filter
          </button>
        </div>
      </div>

      {/* Overview Tab Content */}
      {reportType === 'overview' && dashboardData && (
        <div className="space-y-5">
          {/* Primary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">TOTAL REVENUE</p>
                  <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">${dashboardData.revenue?.total?.toFixed(2) || '0.00'}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {(dashboardData.revenue?.growth || 0) >= 0 ? (
                      <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <ArrowUpRight className="size-3 mr-0.5" />
                        +{(dashboardData.revenue?.growth || 0).toFixed(1)}%
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <ArrowDownRight className="size-3 mr-0.5" />
                        {(dashboardData.revenue?.growth || 0).toFixed(1)}%
                      </span>
                    )}
                    <span className="text-xs text-slate-500 font-semibold">vs prev period</span>
                  </div>
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
                  <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">{dashboardData.orders?.total || 0}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    <strong className="text-blue-600 font-bold">{dashboardData.orders?.pending || 0}</strong> pending dispatch
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
                  <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">{dashboardData.customers?.total || 0}</p>
                  <p className="text-xs text-slate-500 font-semibold mt-1">
                    <strong className="text-purple-600 font-bold">{dashboardData.customers?.new || 0}</strong> new customer accounts
                  </p>
                </div>
                <div className="size-11 rounded-xl bg-purple-50 border border-slate-200 flex items-center justify-center shrink-0 text-purple-600">
                  <Users className="size-5.5" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200 transition-all hover:border-[#E31837]/30 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-[13px] font-extrabold text-slate-500 mb-1">CATALOG PRODUCTS</p>
                  <p className="text-2xl sm:text-3xl font-black text-[#0f172a]">{dashboardData.products?.total || 0}</p>
                  <p className="text-xs text-[#E31837] font-bold mt-1">
                    {dashboardData.products?.lowStock || 0} low stock items
                  </p>
                </div>
                <div className="size-11 rounded-xl bg-rose-50 border border-slate-200 flex items-center justify-center shrink-0 text-[#E31837]">
                  <Package className="size-5.5" />
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-xs font-black text-[#0f172a] uppercase tracking-wider">Quotations Overview</h3>
              </div>
              <div className="p-4 space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Total Quotes:</span>
                  <span className="font-extrabold text-[#0f172a]">{dashboardData.quotations?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Pending:</span>
                  <span className="font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full text-xs">{dashboardData.quotations?.pending || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Accepted:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full text-xs">{dashboardData.quotations?.accepted || 0}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Conversion Rate</span>
                  <span className="text-sm font-black text-[#0f172a]">{(dashboardData.quotations?.conversionRate || 0).toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-xs font-black text-[#0f172a] uppercase tracking-wider">Invoices Breakdown</h3>
              </div>
              <div className="p-4 space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Total Invoices:</span>
                  <span className="font-extrabold text-[#0f172a]">{dashboardData.invoices?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Unpaid:</span>
                  <span className="font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full text-xs">{dashboardData.invoices?.unpaid || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Overdue:</span>
                  <span className="font-bold text-rose-700 bg-rose-100 border border-rose-200 px-2 py-0.5 rounded-full text-xs">{dashboardData.invoices?.overdue || 0}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Unpaid Amount</span>
                  <span className="text-sm font-black text-[#E31837]">${(dashboardData.invoices?.unpaidAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50/50">
                <h3 className="text-xs font-black text-[#0f172a] uppercase tracking-wider">Returns & Refunds</h3>
              </div>
              <div className="p-4 space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Total Requests:</span>
                  <span className="font-extrabold text-[#0f172a]">{dashboardData.returns?.total || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Pending:</span>
                  <span className="font-bold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full text-xs">{dashboardData.returns?.pending || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-semibold">Approved:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full text-xs">{dashboardData.returns?.approved || 0}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Total Refunded</span>
                  <span className="text-sm font-black text-[#0f172a]">${(dashboardData.returns?.totalRefunded || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sales Performance Tab */}
      {reportType === 'sales' && salesReport && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Sales Revenue</p>
              <p className="text-2xl sm:text-3xl font-black text-[#0f172a] mt-1">${(salesReport.totalSales || 0).toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Orders Placed</p>
              <p className="text-2xl sm:text-3xl font-black text-[#0f172a] mt-1">{salesReport.totalOrders || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Paid & Completed Orders</p>
              <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">{salesReport.paidOrders || 0}</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200">
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Average Order Value</p>
              <p className="text-2xl sm:text-3xl font-black text-[#E31837] mt-1">${(salesReport.averageOrderValue || 0).toFixed(2)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h3 className="text-xs font-black text-[#0f172a] uppercase tracking-wider">Sales Breakdown By Date</h3>
            </div>
            <div className="p-4 space-y-3">
              {(salesReport.salesByDate || []).map((item) => (
                <div key={item.date} className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs sm:text-sm">
                  <div className="w-28 font-bold text-[#0f172a]">{item.date}</div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#0f172a] rounded-full transition-all"
                        style={{
                          width: salesReport.totalSales > 0 ? `${(item.sales / salesReport.totalSales) * 100}%` : '0%',
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-36 text-right">
                    <div className="font-black text-[#0f172a]">${item.sales.toFixed(2)}</div>
                    <div className="text-xs font-semibold text-slate-500">{item.orders} order(s)</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Top Products Tab */}
      {reportType === 'products' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-xs font-black text-[#0f172a] uppercase tracking-wider">Top Selling Equipment & Supplies</h3>
            <button onClick={() => exportReport('products')} className="h-8 px-3 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center gap-1.5 cursor-pointer">
              <Download className="size-3.5" />
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[#0f172a] font-black uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">SKU / Code</th>
                  <th className="py-3 px-4 text-right">Units Sold</th>
                  <th className="py-3 px-4 text-right">Order Count</th>
                  <th className="py-3 px-4 text-right">Total Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {topProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-[#0f172a]">
                      {product.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 font-semibold text-xs">
                      {product.sku}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-700">
                      {product.totalQuantity}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-600">
                      {product.orderCount}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-[#E31837]">
                      ${(product.totalRevenue || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top Customers Tab */}
      {reportType === 'customers' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-xs font-black text-[#0f172a] uppercase tracking-wider">Top Spenders & Repeat Customers</h3>
            <button onClick={() => exportReport('customers')} className="h-8 px-3 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs flex items-center gap-1.5 cursor-pointer">
              <Download className="size-3.5" />
              Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[#0f172a] font-black uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4 text-right">Total Orders</th>
                  <th className="py-3 px-4 text-right">Lifetime Spend</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {topCustomers.map((customer, index) => (
                  <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-extrabold text-[#0f172a]">
                      {customer.name}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-500">
                      {customer.email}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-700">
                      {customer.totalOrders}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-[#E31837]">
                      ${(customer.totalSpent || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Tab */}
      {reportType === 'inventory' && dashboardData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200">
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Total Products</p>
            <p className="text-2xl sm:text-3xl font-black text-[#0f172a] mt-1">{dashboardData.products?.total || 0}</p>
            <p className="text-xs text-slate-500 font-semibold mt-1">Active items in database</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200">
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Low Stock Warning</p>
            <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">{dashboardData.products?.lowStock || 0}</p>
            <p className="text-xs text-amber-700 font-semibold mt-1">Items below minimum stock threshold</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-xs border border-slate-200">
            <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">Out of Stock</p>
            <p className="text-2xl sm:text-3xl font-black text-[#E31837] mt-1">{dashboardData.products?.outOfStock || 0}</p>
            <p className="text-xs text-rose-700 font-semibold mt-1">Items currently out of stock</p>
          </div>
        </div>
      )}
    </div>
  );
}
