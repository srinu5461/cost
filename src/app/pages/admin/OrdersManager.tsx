import { useState, useEffect } from 'react';
import { Package, Search, Eye, Edit, Trash2, Loader2, Calendar, DollarSign, Truck, Mail, Receipt, MoreVertical } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { Textarea } from '../../components/ui/textarea';
import { Checkbox } from '../../components/ui/checkbox';
import { useNavigate } from 'react-router';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

const ORDERS_PER_PAGE = 50;

export function OrdersManager() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [actionMenu, setActionMenu] = useState<{ order: any; top: number; left: number } | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('');

  // Shipping quote state
  const [shippingQuoteDialogOpen, setShippingQuoteDialogOpen] = useState(false);
  const [shippingCost, setShippingCost] = useState('');
  const [shippingGST, setShippingGST] = useState('');
  const [shippingNotes, setShippingNotes] = useState('');
  const [bankDetails, setBankDetails] = useState('');
  const [paymentLink, setPaymentLink] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);

  // Refund state
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [processingRefund, setProcessingRefund] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  // Create Return state
  const [createReturnDialogOpen, setCreateReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returnComments, setReturnComments] = useState('');
  const [selectedReturnItems, setSelectedReturnItems] = useState<string[]>([]);
  const [creatingReturn, setCreatingReturn] = useState(false);

  // Order notes
  const [orderNotes, setOrderNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Generate Invoice state
  const [generatingInvoice, setGeneratingInvoice] = useState<string | null>(null);

  // Send Invoice Email state
  const [sendingInvoiceEmail, setSendingInvoiceEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  // Dismiss floating action menu on window scroll/resize
  useEffect(() => {
    const handleScrollOrResize = () => setActionMenu(null);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, []);

  // Reset to page 1 only when search term changes, not on every orders update
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = orders.filter(order =>
        order.id.toString().includes(searchTerm) ||
        order.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.payment_method?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchTerm, orders]);

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/payment/orders`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setFilteredOrders(data.orders || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = (order: any) => {
    setSelectedOrder(order);
    setOrderNotes(order.notes || '');
    setViewDialogOpen(true);
  };

  const handleSaveNotes = async () => {
    if (!selectedOrder) return;
    setSavingNotes(true);
    try {
      await fetch(`${API_URL}/orders/${selectedOrder.id}/notes`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${publicAnonKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: orderNotes }),
      });
      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? { ...o, notes: orderNotes } : o));
      setSelectedOrder((prev: any) => ({ ...prev, notes: orderNotes }));
      alert('Notes saved. Regenerate the invoice PDF to apply.');
    } catch {
      alert('Failed to save notes');
    } finally {
      setSavingNotes(false);
    }
  };

  const handleEditOrder = (order: any) => {
    setSelectedOrder(order);
    setEditStatus(order.order_status || 'processing');
    setEditDialogOpen(true);
  };

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;

    try {
      // In a real implementation, you'd update via API
      // For now, we'll just update locally
      const updatedOrders = orders.map(o =>
        o.id === selectedOrder.id
          ? { ...o, order_status: editStatus }
          : o
      );
      setOrders(updatedOrders);
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const handleDeleteOrder = (order: any) => {
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedOrder) return;

    try {
      // Call backend API to delete the order
      const response = await fetch(`${API_URL}/orders/${selectedOrder.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete order');
      }

      // Update local state after successful deletion
      const updatedOrders = orders.filter(o => o.id !== selectedOrder.id);
      setOrders(updatedOrders);
      setDeleteDialogOpen(false);
      alert('Order deleted successfully');
    } catch (error) {
      console.error('Failed to delete order:', error);
      alert('Failed to delete order. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'quote_sent':
        return 'bg-cyan-100 text-cyan-800';
      case 'ready_to_ship':
        return 'bg-purple-100 text-purple-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-teal-100 text-teal-800';
      case 'return_initiated':
        return 'bg-orange-100 text-orange-800';
      case 'refund_requested':
        return 'bg-amber-100 text-amber-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  // Check if order needs shipping (shipping_amount === 0 means customer pays later)
  const needsShipping = (order: any) => {
    const hasShipping = order.shipping?.[0] && (
      order.shipping[0].address || order.shipping[0].first_name || order.shipping[0].postcode || order.shipping[0].city
    );
    const noShippingCost = order.shipping_amount === 0 || order.shipping_amount === null || order.shipping_amount === undefined;
    const statusAllowsQuote = !['quote_sent', 'ready_to_ship', 'shipped', 'delivered', 'cancelled', 'refunded'].includes(order.order_status);

    return hasShipping && noShippingCost && statusAllowsQuote;
  };

  // Handle opening shipping quote dialog
  const handleCreateShippingQuote = (order: any) => {
    setSelectedOrder(order);
    setShippingCost('');
    setShippingGST('');
    setShippingNotes('');
    setBankDetails(`Bank: Costplus100 Bank
BSB: 123-456
Account Number: 12345678
Account Name: Costplus100 Pty Ltd

Please use Order #${order.id} as payment reference`);
    setPaymentLink('');
    setShippingQuoteDialogOpen(true);
  };

  // Auto-calculate GST when shipping cost changes
  const handleShippingCostChange = (value: string) => {
    setShippingCost(value);
    const cost = parseFloat(value);
    if (!isNaN(cost) && cost > 0) {
      const gst = cost * 0.1; // 10% GST
      setShippingGST(gst.toFixed(2));
    } else {
      setShippingGST('');
    }
  };

  // Send shipping quote email
  const handleSendShippingQuote = async () => {
    if (!selectedOrder || !shippingCost) {
      alert('Please enter shipping cost');
      return;
    }

    setSendingEmail(true);

    try {
      const cost = parseFloat(shippingCost);
      const gst = parseFloat(shippingGST) || 0;
      const totalShipping = cost + gst;

      // Get customer name with proper fallback
      const firstName = selectedOrder.shipping?.[0]?.first_name || selectedOrder.billing?.[0]?.first_name || '';
      const lastName = selectedOrder.shipping?.[0]?.last_name || selectedOrder.billing?.[0]?.last_name || '';
      const customerName = `${firstName} ${lastName}`.trim() || 'Valued Customer';

      const response = await fetch(`${API_URL}/email/shipping-quote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          customerEmail: selectedOrder.shipping?.[0]?.email || selectedOrder.customer?.email,
          customerName: customerName,
          shippingCost: cost,
          shippingGST: gst,
          totalShipping,
          notes: shippingNotes,
          bankDetails,
          paymentLink,
          order: selectedOrder,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send shipping quote');
      }

      alert('Shipping quote email sent successfully!');
      setShippingQuoteDialogOpen(false);
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Error sending shipping quote:', error);
      alert('Failed to send shipping quote email');
    } finally {
      setSendingEmail(false);
    }
  };

  // Handle opening refund dialog
  const handleRefundOrder = (order: any) => {
    setSelectedOrder(order);
    setRefundAmount('');
    setRefundReason('');
    setRefundDialogOpen(true);
  };

  // Process refund
  const handleProcessRefund = async () => {
    if (!selectedOrder || !refundAmount) {
      alert('Please enter refund amount');
      return;
    }

    setProcessingRefund(true);

    try {
      const amount = parseFloat(refundAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error('Invalid refund amount');
      }

      const response = await fetch(`${API_URL}/payment/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: selectedOrder.id,
          amount,
          reason: refundReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process refund');
      }

      alert('Refund processed successfully!');
      setRefundDialogOpen(false);
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund');
    } finally {
      setProcessingRefund(false);
    }
  };

  // Handle status change directly from table
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingStatus(orderId);

    try {
      const response = await fetch(`${API_URL}/payment/order/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Update local state without resetting pagination
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: newStatus } : o));
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Handle opening create return dialog
  const handleCreateReturn = (order: any) => {
    setSelectedOrder(order);
    setReturnReason('');
    setReturnComments('');
    setSelectedReturnItems([]);
    setCreateReturnDialogOpen(true);
  };

  // Process return
  const handleProcessReturn = async () => {
    if (!selectedOrder || !returnReason || selectedReturnItems.length === 0) {
      alert('Please enter return reason and select items to return');
      return;
    }

    setCreatingReturn(true);

    try {
      const response = await fetch(`${API_URL}/payment/order/${selectedOrder.id}/return`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: returnReason,
          comments: returnComments,
          items: selectedReturnItems,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process return');
      }

      alert('Return processed successfully!');
      setCreateReturnDialogOpen(false);
    } catch (error) {
      console.error('Error processing return:', error);
      alert('Failed to process return');
    } finally {
      setCreatingReturn(false);
    }
  };

  // Generate invoice from order
  const handleGenerateInvoice = async (order: any) => {
    if (!order.id) return;

    setGeneratingInvoice(order.id);

    try {
      const response = await fetch(`${API_URL}/invoices/generate-from-order/${order.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to generate invoice');
      }

      const data = await response.json();

      if (data.alreadyExists) {
        alert('Invoice already exists for this order!');
        navigate(`/admin/invoices`);
      } else {
        alert('Invoice generated successfully!');
        navigate(`/admin/invoices`);
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Failed to generate invoice');
    } finally {
      setGeneratingInvoice(null);
    }
  };

  // Send invoice email for an order
  const handleSendInvoiceEmail = async (order: any) => {
    if (!order.id) return;

    // Check if order has an invoice
    if (!order.invoice_id && !order.invoiceId) {
      const confirmGenerate = confirm('This order does not have an invoice yet. Would you like to generate one first?');
      if (confirmGenerate) {
        await handleGenerateInvoice(order);
      }
      return;
    }

    setSendingInvoiceEmail(order.id);

    try {
      // Get invoice ID from order
      const invoiceId = order.invoice_id || order.invoiceId;

      // Send invoice email via backend
      const response = await fetch(`${API_URL}/invoices/${invoiceId}/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId: order.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invoice email');
      }

      alert('Invoice email sent successfully!');
      fetchOrders(); // Refresh to get updated status
    } catch (error) {
      console.error('Error sending invoice email:', error);
      alert(`Failed to send invoice email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSendingInvoiceEmail(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-8 space-y-5">
      {/* Page Title Header */}
      <div className="bg-white rounded-xl p-5 sm:p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] mb-1 tracking-tight">Orders Management</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">View and manage all customer orders</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: orders.length, icon: Package, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'Completed', value: orders.filter(o => o.payment_status === 'completed').length, icon: Package, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Processing', value: orders.filter(o => o.order_status === 'processing').length, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Total Revenue', value: `$${orders.reduce((sum, o) => sum + (o.total_amount || 0), 0).toFixed(2)}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-50' },
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

      {/* Search Bar & Right-aligned Refresh Button Container */}
      <div className="bg-white rounded-xl p-3.5 shadow-xs border border-slate-200 flex items-center justify-between gap-3 w-full">
        <div className="relative max-w-sm sm:max-w-md w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Search Orders..."
            className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-xs sm:text-sm font-semibold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={fetchOrders}
          className="h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0 ml-auto"
        >
          Refresh
        </button>
      </div>

      {/* Orders Table Container */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-sm sm:text-base font-black text-[#0f172a] tracking-tight">All Orders ({filteredOrders.length})</h2>
        </div>
        <div className="p-0">
          {(() => {
            const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
            const paginatedOrders = filteredOrders.slice(
              (currentPage - 1) * ORDERS_PER_PAGE,
              currentPage * ORDERS_PER_PAGE
            );
            const goToPage = (page: number) => {
              if (page >= 1 && page <= totalPages) setCurrentPage(page);
            };
            const PaginationControls = () => totalPages > 1 ? (
              <div className="flex items-center justify-between px-6 py-4 bg-slate-50/50 border-t border-slate-100">
                <span className="text-xs sm:text-sm font-medium text-slate-500">
                  Showing {((currentPage - 1) * ORDERS_PER_PAGE) + 1} to {Math.min(currentPage * ORDERS_PER_PAGE, filteredOrders.length)} of {filteredOrders.length} orders
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer"
                  >
                    Prev
                  </button>

                  {/* Page Numbers */}
                  <div className="hidden sm:flex items-center gap-1.5 mx-2">
                    {currentPage > 3 && (
                      <>
                        <button onClick={() => goToPage(1)} className="size-8 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">1</button>
                        {currentPage > 4 && <span className="text-slate-400 text-xs">...</span>}
                      </>
                    )}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p >= currentPage - 2 && p <= currentPage + 2)
                      .map(p => (
                        <button
                          key={p}
                          onClick={() => goToPage(p)}
                          className={`size-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${p === currentPage
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                          {p}
                        </button>
                      ))}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && <span className="text-slate-400 text-xs">...</span>}
                        <button onClick={() => goToPage(totalPages)} className="size-8 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">{totalPages}</button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null;
            return (
              <>
                {loading ? (
                  <div className="text-center py-16">
                    <Loader2 className="size-10 animate-spin mx-auto text-[#E31837] mb-4" />
                    <p className="text-slate-500 font-medium text-xs sm:text-sm">Loading orders...</p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="size-12 mx-auto text-slate-300 mb-3" />
                    <p className="text-muted-foreground text-xs sm:text-sm font-medium">No orders found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto custom-scrollbar">
                    <Table>
                      <TableHeader className="bg-slate-50/70 border-b border-slate-200">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="w-[100px] h-9 px-3 uppercase text-[10px] font-extrabold text-slate-600 tracking-wider">Order ID</TableHead>
                          <TableHead className="w-[130px] h-9 px-3 uppercase text-[10px] font-extrabold text-slate-600 tracking-wider">Date</TableHead>
                          <TableHead className="w-[180px] h-9 px-3 uppercase text-[10px] font-extrabold text-slate-600 tracking-wider">Customer</TableHead>
                          <TableHead className="w-[80px] h-9 px-3 uppercase text-[10px] font-extrabold text-slate-600 tracking-wider text-center">Items</TableHead>
                          <TableHead className="w-[120px] h-9 px-3 uppercase text-[10px] font-extrabold text-slate-600 tracking-wider">Amount</TableHead>
                          <TableHead className="w-[150px] h-9 px-3 uppercase text-[10px] font-extrabold text-slate-600 tracking-wider">Payment</TableHead>
                          <TableHead className="w-[190px] h-9 px-3 uppercase text-[10px] font-extrabold text-slate-600 tracking-wider">Status</TableHead>
                          <TableHead className="w-[90px] h-9 px-3 uppercase text-[10px] font-extrabold text-slate-600 tracking-wider text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOrders.map((order) => (
                          <TableRow key={order.id} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                            <TableCell className="px-3 py-2.5">
                              <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">#{order.id}</span>
                            </TableCell>
                            <TableCell className="px-3 py-2.5">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                                <Calendar className="size-3.5 text-slate-400" />
                                {new Date(order.created_at).toLocaleDateString('en-AU', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-2.5">
                              {order.shipping?.[0] ? (
                                <div>
                                  <p className="text-xs font-bold text-[#0f172a]">
                                    {order.shipping[0].first_name} {order.shipping[0].last_name}
                                  </p>
                                  <p className="text-[11px] font-semibold text-slate-500 truncate max-w-[170px]">
                                    {order.shipping[0].email}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-xs font-medium text-slate-400">Guest</span>
                              )}
                            </TableCell>
                            <TableCell className="px-3 py-2.5 text-center text-xs font-extrabold text-slate-800">
                              {order.order_items?.length || 0}
                            </TableCell>
                            <TableCell className="px-3 py-2.5">
                              <span className="text-xs sm:text-sm font-black text-[#0f172a]">
                                ${order.total_amount?.toFixed(2)}
                              </span>
                            </TableCell>
                            <TableCell className="px-3 py-2.5">
                              <div className="flex flex-col items-start gap-1">
                                <p className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">{order.payment_method}</p>
                                <Badge className={`${getStatusColor(order.payment_status)} rounded-full px-2 py-0.5 border-none font-bold text-[9px] uppercase tracking-wider`}>
                                  {order.payment_status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="px-3 py-2.5">
                              <div className="space-y-2">
                                <Select
                                  value={order.order_status || 'processing'}
                                  onValueChange={(value) => handleStatusChange(order.id, value)}
                                  disabled={updatingStatus === order.id}
                                >
                                  <SelectTrigger className="w-[170px] h-8.5 text-xs font-semibold bg-white border-slate-200 rounded-lg hover:border-slate-400 transition-all focus:ring-1 focus:ring-[#E31837] cursor-pointer">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="rounded-xl border-slate-200 shadow-xl">
                                    <SelectItem value="pending" className="text-xs font-semibold cursor-pointer">🕐 Pending</SelectItem>
                                    <SelectItem value="processing" className="text-xs font-semibold cursor-pointer">⚙️ Processing</SelectItem>
                                    <SelectItem value="quote_sent" className="text-xs font-semibold cursor-pointer">📧 Quote Sent</SelectItem>
                                    <SelectItem value="ready_to_ship" className="text-xs font-semibold cursor-pointer">📦 Ready to Ship</SelectItem>
                                    <SelectItem value="shipped" className="text-xs font-semibold cursor-pointer">🚚 Shipped</SelectItem>
                                    <SelectItem value="delivered" className="text-xs font-semibold cursor-pointer">✅ Delivered</SelectItem>
                                    <SelectItem value="completed" className="text-xs font-bold text-emerald-700 cursor-pointer">🎉 Completed</SelectItem>
                                    <SelectItem value="cancelled" className="text-xs font-bold text-rose-600 cursor-pointer">❌ Cancelled</SelectItem>
                                    <SelectItem value="return_initiated" className="text-xs font-semibold text-orange-600 cursor-pointer">🔄 Return Initiated</SelectItem>
                                    <SelectItem value="refund_requested" className="text-xs font-semibold text-amber-600 cursor-pointer">💰 Refund Requested</SelectItem>
                                    <SelectItem value="refunded" className="text-xs font-semibold text-slate-600 cursor-pointer">✔️ Refunded</SelectItem>
                                  </SelectContent>
                                </Select>

                                {needsShipping(order) && (
                                  <Badge className="bg-[#E31837] text-white font-extrabold text-[9px] px-2 py-0.5 flex items-center gap-1 shadow-2xs border-none rounded-full w-fit">
                                    <Truck className="size-3" />
                                    <span>QUOTE NEEDED</span>
                                  </Badge>
                                )}

                                {order.order_status === 'return_initiated' && (
                                  <Badge className="bg-orange-500 text-white animate-pulse border-none rounded-full px-2 py-0.5 text-[9px] font-bold w-fit">
                                    🔄 Return Required
                                  </Badge>
                                )}
                                {updatingStatus === order.id && (
                                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#E31837]">
                                    <Loader2 className="size-3 animate-spin" />
                                    <span>Updating...</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            {/* Actions Column with 3 Vertical Dots Button */}
                            <TableCell className="px-3 py-2.5 text-right">
                              <div className="flex justify-end items-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (actionMenu?.order.id === order.id) {
                                      setActionMenu(null);
                                    } else {
                                      const rect = e.currentTarget.getBoundingClientRect();
                                      setActionMenu({
                                        order,
                                        top: rect.bottom + 4,
                                        left: Math.max(16, rect.right - 200),
                                      });
                                    }
                                  }}
                                  className={`size-8.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${actionMenu?.order.id === order.id
                                    ? 'bg-[#E31837] text-white border-[#E31837] shadow-sm'
                                    : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-[#E31837] border-slate-200'
                                    }`}
                                  title="Actions Menu"
                                >
                                  <MoreVertical className="size-4" />
                                </button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
                <PaginationControls />
              </>
            );
          })()}
        </div>
      </div>

      {/* Floating Unclipped Action Dropdown (Fixed Viewport Positioning) */}
      {actionMenu && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setActionMenu(null)}
          />
          <div
            style={{ top: `${actionMenu.top}px`, left: `${actionMenu.left}px` }}
            onClick={(e) => e.stopPropagation()}
            className="fixed w-50 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 p-1.5 font-sans animate-in fade-in zoom-in-95 duration-100 text-left"
          >
            <button
              onClick={() => {
                const ord = actionMenu.order;
                setActionMenu(null);
                handleViewOrder(ord);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 hover:text-slate-900 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Eye className="size-4 text-slate-400" />
              <span>View Details</span>
            </button>

            {needsShipping(actionMenu.order) && (
              <button
                onClick={() => {
                  const ord = actionMenu.order;
                  setActionMenu(null);
                  handleCreateShippingQuote(ord);
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-[#E31837] bg-rose-50/80 hover:bg-rose-100 font-extrabold text-xs transition-colors cursor-pointer"
              >
                <Truck className="size-4 text-[#E31837]" />
                <span>Send Quote</span>
              </button>
            )}

            <button
              onClick={() => {
                const ord = actionMenu.order;
                setActionMenu(null);
                handleGenerateInvoice(ord);
              }}
              disabled={generatingInvoice === actionMenu.order.id}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-emerald-700 hover:bg-emerald-50 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Receipt className="size-4 text-emerald-600" />
              <span>{actionMenu.order.invoice_id || actionMenu.order.invoiceId ? 'View Invoice' : 'Generate Invoice'}</span>
            </button>

            {(actionMenu.order.invoice_id || actionMenu.order.invoiceId) && (
              <button
                onClick={() => {
                  const ord = actionMenu.order;
                  setActionMenu(null);
                  handleSendInvoiceEmail(ord);
                }}
                disabled={sendingInvoiceEmail === actionMenu.order.id}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-purple-700 hover:bg-purple-50 font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Mail className="size-4 text-purple-600" />
                <span>Send Invoice Email</span>
              </button>
            )}

            <button
              onClick={() => {
                const ord = actionMenu.order;
                setActionMenu(null);
                handleRefundOrder(ord);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-amber-700 hover:bg-amber-50 font-bold text-xs transition-colors cursor-pointer"
            >
              <DollarSign className="size-4 text-amber-600" />
              <span>Process Refund</span>
            </button>

            {actionMenu.order.order_status === 'return_initiated' && (
              <button
                onClick={() => {
                  const ord = actionMenu.order;
                  setActionMenu(null);
                  handleCreateReturn(ord);
                }}
                className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-orange-700 hover:bg-orange-50 font-bold text-xs transition-colors cursor-pointer"
              >
                <Package className="size-4 text-orange-600" />
                <span>Process Return</span>
              </button>
            )}

            <div className="my-1 border-t border-slate-100" />

            <button
              onClick={() => {
                const ord = actionMenu.order;
                setActionMenu(null);
                handleDeleteOrder(ord);
              }}
              className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
            >
              <Trash2 className="size-4 text-rose-500" />
              <span>Delete Order</span>
            </button>
          </div>
        </>
      )}

      {/* View Order Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-3xl sm:max-w-4xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 rounded-xl border border-slate-200 shadow-2xl">
          <DialogHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <DialogTitle className="text-base sm:text-lg font-black text-[#0f172a] tracking-tight">
                  Order Details #{selectedOrder?.id}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 font-medium mt-0.5">
                  Complete breakdown of customer order and items
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 pt-1 pb-2">
              {/* Top Overview Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50/80 p-3 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Order Date</span>
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Calendar className="size-3.5 text-slate-400" />
                    <span>{new Date(selectedOrder.created_at).toLocaleDateString('en-AU', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Payment Method</span>
                  <span className="font-bold text-slate-800 uppercase">{selectedOrder.payment_method || 'N/A'}</span>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Payment</span>
                  <Badge className={`${getStatusColor(selectedOrder.payment_status)} rounded-full px-2 py-0.5 border-none font-bold text-[9px] uppercase tracking-wider`}>
                    {selectedOrder.payment_status}
                  </Badge>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Order Status</span>
                  <Badge className={`${getStatusColor(selectedOrder.order_status)} rounded-full px-2 py-0.5 border-none font-bold text-[9px] uppercase tracking-wider`}>
                    {selectedOrder.order_status || 'processing'}
                  </Badge>
                </div>
              </div>

              {/* Shipping Address Card */}
              {selectedOrder.shipping?.[0] && (
                <div className="bg-white rounded-xl border border-slate-200 p-3.5 space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#0f172a] border-b border-slate-100 pb-1.5">
                    <Truck className="size-3.5 text-[#E31837]" />
                    <span>Shipping Address</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-0.5 pt-0.5">
                    <p className="font-extrabold text-[#0f172a]">
                      {selectedOrder.shipping[0].first_name} {selectedOrder.shipping[0].last_name}
                    </p>
                    <p className="font-medium text-slate-600">{selectedOrder.shipping[0].address}</p>
                    <p className="font-medium text-slate-600">
                      {selectedOrder.shipping[0].city}, {selectedOrder.shipping[0].state}{' '}
                      {selectedOrder.shipping[0].postcode} {selectedOrder.shipping[0].country}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 pt-1 text-[11px] font-semibold text-slate-500">
                      {selectedOrder.shipping[0].email && (
                        <span className="flex items-center gap-1">
                          <Mail className="size-3 text-slate-400" />
                          {selectedOrder.shipping[0].email}
                        </span>
                      )}
                      {selectedOrder.shipping[0].phone && (
                        <span className="flex items-center gap-1">
                          📞 {selectedOrder.shipping[0].phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Side by Side Grid for Order Items (Left) and Total Breakdown (Right) on Laptop */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Left Side: Order Items List */}
                <div className="md:col-span-7 space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-[#0f172a]">
                    <span>Order Items ({selectedOrder.order_items?.length || 0})</span>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedOrder.order_items?.map((item: any, idx: number) => {
                      const price = item.price || item.product?.price || item.unit_price || 0;
                      const qty = item.quantity || 1;
                      const itemName = item.product?.name || item.name || item.title || `Item #${idx + 1}`;
                      const img = item.product?.image || item.image;

                      return (
                        <div key={idx} className="flex items-center gap-3 p-2.5 bg-slate-50/80 rounded-xl border border-slate-200 text-xs">
                          <div className="size-12 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {img ? (
                              <img
                                src={img}
                                alt={itemName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="size-5 text-slate-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-extrabold text-[#0f172a] truncate">{itemName}</p>
                            <p className="text-[11px] font-semibold text-slate-500">
                              Qty: <span className="font-bold text-slate-800">{qty}</span> × ${price.toFixed(2)}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-[#0f172a] text-xs sm:text-sm">
                              ${(price * qty).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right Side: Financial Totals & Summary Card */}
                <div className="md:col-span-5 space-y-3">
                  <div className="bg-slate-50/80 rounded-xl border border-slate-200 p-3.5 space-y-2.5 text-xs h-full flex flex-col justify-between">
                    <div className="space-y-2">
                      <span className="text-[11px] font-black text-[#0f172a] uppercase tracking-wider block border-b border-slate-200/60 pb-1.5">
                        Payment Summary
                      </span>

                      <div className="flex justify-between font-semibold text-slate-600">
                        <span>Subtotal:</span>
                        <span className="font-bold text-slate-800">${(selectedOrder.subtotal || (selectedOrder.total_amount - (selectedOrder.tax_amount || 0))).toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between font-semibold text-slate-600">
                        <span>GST (10%):</span>
                        <span className="font-bold text-slate-800">${(selectedOrder.tax_amount || (selectedOrder.total_amount * 0.1)).toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between font-semibold text-slate-600">
                        <span>Shipping:</span>
                        <span>
                          {selectedOrder.shipping_amount === 0 || !selectedOrder.shipping_amount ? (
                            <span className="text-[#E31837] font-black uppercase text-[10px] bg-rose-50 px-2 py-0.5 rounded border border-rose-100">Quote Needed</span>
                          ) : (
                            <span className="font-bold text-slate-800">${selectedOrder.shipping_amount?.toFixed(2)}</span>
                          )}
                        </span>
                      </div>

                      <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                        <span className="text-xs font-black text-[#0f172a]">Total Amount:</span>
                        <span className="text-base sm:text-lg font-black text-[#E31837]">${selectedOrder.total_amount?.toFixed(2)}</span>
                      </div>
                    </div>

                    {selectedOrder.shipping_amount === 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2.5 text-xs mt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-emerald-900">Products Paid</p>
                            <p className="text-[10px] text-emerald-700 leading-tight">Quote required before dispatch.</p>
                          </div>
                          <Badge className="bg-emerald-600 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-full border-none">
                            PAID
                          </Badge>
                        </div>
                        {needsShipping(selectedOrder) && (
                          <Button
                            className="w-full bg-[#E31837] hover:bg-[#c41530] text-white font-bold text-xs h-8"
                            onClick={() => {
                              setViewDialogOpen(false);
                              handleCreateShippingQuote(selectedOrder);
                            }}
                          >
                            <Truck className="size-3.5 mr-1.5" />
                            Send Shipping Quote
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedOrder.transaction_id && (
                <div className="bg-slate-100/70 p-2.5 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Transaction ID</span>
                  <p className="font-mono text-xs font-semibold text-slate-700 mt-0.5 select-all">{selectedOrder.transaction_id}</p>
                </div>
              )}

              {/* Admin Notes - printed in red on invoice PDF */}
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 space-y-2">
                <span className="text-[11px] font-black text-rose-700 uppercase tracking-wider block">Admin Notes (printed in red on PDF)</span>
                <Textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="e.g. Square account: $118.98 — refund required, no stock with Uropa..."
                  className="text-xs min-h-[80px] border-rose-200 focus:border-rose-400 focus:ring-rose-300 bg-white"
                />
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="bg-[#E31837] hover:bg-[#c41530] text-white font-bold text-xs"
                >
                  {savingNotes ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                  Save Notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Order #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>Update the order status</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Order Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOrder} className="bg-[#E31837] hover:bg-[#E31837]/90">
              Update Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete order #{selectedOrder?.id}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmDelete} variant="destructive">
              Delete Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping Quote Dialog */}
      <Dialog open={shippingQuoteDialogOpen} onOpenChange={setShippingQuoteDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shipping Quote for Order #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>Generate and send a shipping quote to the customer</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Order Date</Label>
                  <p className="font-medium">
                    {new Date(selectedOrder.created_at).toLocaleString('en-AU')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Method</Label>
                  <p className="font-medium">{selectedOrder.payment_method}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Status</Label>
                  <Badge className={getStatusColor(selectedOrder.payment_status)}>
                    {selectedOrder.payment_status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Order Status</Label>
                  <Badge className={getStatusColor(selectedOrder.order_status)}>
                    {selectedOrder.order_status || 'processing'}
                  </Badge>
                </div>
              </div>

              {selectedOrder.shipping?.[0] && (
                <div>
                  <Label className="text-muted-foreground">Shipping Address</Label>
                  <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium">
                      {selectedOrder.shipping[0].first_name} {selectedOrder.shipping[0].last_name}
                    </p>
                    <p>{selectedOrder.shipping[0].address}</p>
                    <p>
                      {selectedOrder.shipping[0].city}, {selectedOrder.shipping[0].state}{' '}
                      {selectedOrder.shipping[0].postcode}
                    </p>
                    <p>{selectedOrder.shipping[0].country}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selectedOrder.shipping[0].email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.shipping[0].phone}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Order Items</Label>
                <div className="mt-2 space-y-2">
                  {selectedOrder.order_items?.map((item: any, idx: number) => {
                    const price = item.price || item.product?.price || item.unit_price || 0;
                    const qty = item.quantity || 1;
                    const itemName = item.product?.name || item.name || item.title || `Item #${idx + 1}`;
                    const img = item.product?.image || item.image;
                    return (
                      <div key={idx} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                        <div className="size-16 rounded bg-white flex-shrink-0 overflow-hidden">
                          {img ? (
                            <img src={img} alt={itemName} className="w-full h-full object-cover rounded" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="size-6 text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{itemName}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {qty} × ${price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            ${(price * qty).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">${selectedOrder.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST:</span>
                    <span className="font-medium">${selectedOrder.tax_amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping:</span>
                    <span className="font-medium">
                      {selectedOrder.shipping_amount === 0 ? (
                        <span className="text-orange-600 font-semibold">Quote Needed</span>
                      ) : (
                        `$${selectedOrder.shipping_amount?.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-[#E31837]">${selectedOrder.total_amount?.toFixed(2)}</span>
                  </div>
                  {selectedOrder.shipping_amount === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-green-800">Product Payment Status:</span>
                        <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold">PAID</span>
                      </div>
                      <p className="text-xs text-green-700 mt-1">
                        Products have been paid. Shipping quote needs to be sent to customer.
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {selectedOrder.transaction_id && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <Label className="text-muted-foreground">Transaction ID</Label>
                  <p className="font-mono text-sm mt-1">{selectedOrder.transaction_id}</p>
                </div>
              )}

              <div className="mt-4">
                <Label className="text-muted-foreground">Shipping Cost</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={shippingCost}
                  onChange={(e) => handleShippingCostChange(e.target.value)}
                />
              </div>

              <div className="mt-4">
                <Label className="text-muted-foreground">Shipping GST</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={shippingGST}
                  onChange={(e) => setShippingGST(e.target.value)}
                />
              </div>

              <div className="mt-4">
                <Label className="text-muted-foreground">Shipping Notes</Label>
                <Textarea
                  value={shippingNotes}
                  onChange={(e) => setShippingNotes(e.target.value)}
                />
              </div>

              <div className="mt-4">
                <Label className="text-muted-foreground">Bank Details</Label>
                <Textarea
                  value={bankDetails}
                  onChange={(e) => setBankDetails(e.target.value)}
                />
              </div>

              <div className="mt-4">
                <Label className="text-muted-foreground">Payment Link</Label>
                <Input
                  value={paymentLink}
                  onChange={(e) => setPaymentLink(e.target.value)}
                />
              </div>

              {/* Shipping Quote Preview */}
              {shippingCost && parseFloat(shippingCost) > 0 && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4">📧 Email Preview</h3>

                  {/* Product Total - PAID */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-green-800">Product Payment Status:</span>
                      <span className="bg-green-600 text-white px-3 py-1 rounded text-sm font-bold">PAID</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-green-700">Product Subtotal:</span>
                        <span className="font-medium text-green-900">${selectedOrder.subtotal?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-green-700">Product GST:</span>
                        <span className="font-medium text-green-900">${selectedOrder.tax_amount?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-green-300 pt-2 mt-2">
                        <span className="font-bold text-green-900">Product Total (PAID):</span>
                        <span className="font-bold text-green-900 text-lg">${selectedOrder.total_amount?.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Shipping Total - DUE */}
                  <div className="bg-orange-50 border border-orange-300 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-orange-800">🚚 Shipping Payment Status:</span>
                      <span className="bg-orange-600 text-white px-3 py-1 rounded text-sm font-bold">DUE</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-orange-700">Shipping Cost:</span>
                        <span className="font-medium text-orange-900">${parseFloat(shippingCost).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-700">Shipping GST:</span>
                        <span className="font-medium text-orange-900">${parseFloat(shippingGST || '0').toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-orange-400 pt-2 mt-2">
                        <span className="font-bold text-orange-900">Total Shipping Due:</span>
                        <span className="font-bold text-orange-900 text-lg">
                          ${(parseFloat(shippingCost) + parseFloat(shippingGST || '0')).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {shippingNotes && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-xs font-semibold text-blue-800 mb-1">Notes:</p>
                      <p className="text-sm text-blue-900">{shippingNotes}</p>
                    </div>
                  )}
                </div>
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setShippingQuoteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSendShippingQuote}
                  className="bg-[#E31837] hover:bg-[#E31837]/90"
                  disabled={sendingEmail}
                >
                  {sendingEmail ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    'Send Shipping Quote'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Refund Dialog */}
      <Dialog open={refundDialogOpen} onOpenChange={setRefundDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Order #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>Process a refund for this order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Refund Amount</Label>
              <Input
                type="number"
                step="0.01"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
              />
            </div>
            <div>
              <Label>Refund Reason</Label>
              <Textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleProcessRefund}
              className="bg-[#E31837] hover:bg-[#E31837]/90"
              disabled={processingRefund}
            >
              {processingRefund ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Process Refund'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Return Dialog */}
      <Dialog open={createReturnDialogOpen} onOpenChange={setCreateReturnDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Return for Order #{selectedOrder?.id}</DialogTitle>
            <DialogDescription>Create a new return request for this order</DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Order Date</Label>
                  <p className="font-medium">
                    {new Date(selectedOrder.created_at).toLocaleString('en-AU')}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Method</Label>
                  <p className="font-medium">{selectedOrder.payment_method}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Payment Status</Label>
                  <Badge className={getStatusColor(selectedOrder.payment_status)}>
                    {selectedOrder.payment_status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Order Status</Label>
                  <Badge className={getStatusColor(selectedOrder.order_status)}>
                    {selectedOrder.order_status || 'processing'}
                  </Badge>
                </div>
              </div>

              {selectedOrder.shipping?.[0] && (
                <div>
                  <Label className="text-muted-foreground">Shipping Address</Label>
                  <div className="mt-2 p-3 bg-slate-50 rounded-lg">
                    <p className="font-medium">
                      {selectedOrder.shipping[0].first_name} {selectedOrder.shipping[0].last_name}
                    </p>
                    <p>{selectedOrder.shipping[0].address}</p>
                    <p>
                      {selectedOrder.shipping[0].city}, {selectedOrder.shipping[0].state}{' '}
                      {selectedOrder.shipping[0].postcode}
                    </p>
                    <p>{selectedOrder.shipping[0].country}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {selectedOrder.shipping[0].email}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedOrder.shipping[0].phone}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <Label className="text-muted-foreground">Order Items</Label>
                <div className="mt-2 space-y-2">
                  {selectedOrder.order_items?.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="size-16 rounded bg-white flex-shrink-0">
                        {item.product?.image && (
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-full h-full object-cover rounded"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{item.product?.name}</p>
                        <p className="text-sm text-muted-foreground">
                          Quantity: {item.quantity} × ${item.product?.price?.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          ${((item.product?.price || 0) * item.quantity).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-left">
                        <Checkbox
                          id={`item-${idx}`}
                          value={item.product?.id}
                          checked={selectedReturnItems.includes(item.product?.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedReturnItems([...selectedReturnItems, item.product?.id]);
                            } else {
                              setSelectedReturnItems(selectedReturnItems.filter(id => id !== item.product?.id));
                            }
                          }}
                        />
                        <Label
                          htmlFor={`item-${idx}`}
                          className="text-sm text-muted-foreground"
                        >
                          Return this item
                        </Label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span className="font-medium">${selectedOrder.subtotal?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST:</span>
                    <span className="font-medium">${selectedOrder.tax_amount?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping:</span>
                    <span className="font-medium">
                      {selectedOrder.shipping_amount === 0 ? (
                        <span className="text-orange-600 font-semibold">Quote Needed</span>
                      ) : (
                        `$${selectedOrder.shipping_amount?.toFixed(2)}`
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span>Total:</span>
                    <span className="text-[#E31837]">${selectedOrder.total_amount?.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedOrder.transaction_id && (
                <div className="bg-slate-50 p-3 rounded-lg">
                  <Label className="text-muted-foreground">Transaction ID</Label>
                  <p className="font-mono text-sm mt-1">{selectedOrder.transaction_id}</p>
                </div>
              )}

              <div className="mt-4">
                <Label className="text-muted-foreground">Return Reason</Label>
                <Input
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                />
              </div>

              <div className="mt-4">
                <Label className="text-muted-foreground">Return Comments</Label>
                <Textarea
                  value={returnComments}
                  onChange={(e) => setReturnComments(e.target.value)}
                />
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateReturnDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleProcessReturn}
                  className="bg-[#E31837] hover:bg-[#E31837]/90"
                  disabled={creatingReturn}
                >
                  {creatingReturn ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    'Process Return'
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
