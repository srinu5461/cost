import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  ArrowLeft, CheckCircle, Download, Mail, Trash2, DollarSign
} from 'lucide-react';
import { DeleteConfirmModal } from '../../components/ui/DeleteConfirmModal';

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
    address?: string;
  };
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  status: string;
  dueDate: string;
  createdAt: string;
  paidAt?: string;
  notes?: string;
}

export function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const response = await fetch(`${API_URL}/invoices/${id}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoice(data.invoice);
      } else {
        alert('Invoice not found');
        navigate('/admin/invoices');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      alert('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async () => {
    if (!confirm('Mark this invoice as paid?')) return;

    try {
      const response = await fetch(`${API_URL}/invoices/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ 
          status: 'paid',
          paidAt: new Date().toISOString()
        }),
      });

      if (response.ok) {
        alert('Invoice marked as paid');
        fetchInvoice();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const cancelInvoice = async () => {
    if (!confirm('Cancel this invoice?')) return;

    try {
      const response = await fetch(`${API_URL}/invoices/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        alert('Invoice cancelled');
        fetchInvoice();
      } else {
        alert('Failed to cancel invoice');
      }
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      alert('Failed to cancel invoice');
    }
  };

  const deleteInvoice = async () => {
    setDeleting(true);
    try {
      const response = await fetch(`${API_URL}/invoices/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        setShowDeleteModal(false);
        navigate('/admin/invoices');
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

  const sendEmail = async () => {
    if (!confirm('Send this invoice via email?')) return;
    setSendingEmail(true);

    try {
      const response = await fetch(`${API_URL}/invoices/${id}/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        alert('Invoice email sent successfully!');
        fetchInvoice(); // Refresh to show email sent status
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send invoice email');
      }
    } catch (error) {
      console.error('Error sending invoice email:', error);
      alert('Failed to send invoice email');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto pb-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-16 w-full bg-slate-100 rounded-[2rem]"></div>
          <div className="h-64 bg-slate-100 rounded-[1.5rem]"></div>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  const getStatusBadge = () => {
    const isOverdue = invoice.status === 'unpaid' && new Date(invoice.dueDate) < new Date();
    
    if (isOverdue) {
      return <Badge className="bg-red-100 text-red-800 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase tracking-wider">Overdue</Badge>;
    }

    switch (invoice.status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase tracking-wider">Paid</Badge>;
      case 'unpaid':
        return <Badge className="bg-yellow-100 text-yellow-800 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase tracking-wider">Unpaid</Badge>;
      case 'cancelled':
        return <Badge className="bg-slate-200 text-slate-700 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase tracking-wider">Cancelled</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase tracking-wider">{invoice.status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-4">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => navigate('/admin/invoices')}
            className="size-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-[#0f172a] tracking-tight">{invoice.invoiceNumber}</h1>
            <div className="flex flex-wrap items-center gap-2.5 mt-0.5">
              <span className="text-xs font-semibold text-slate-500">Created: {new Date(invoice.createdAt).toLocaleDateString('en-AU')}</span>
              {getStatusBadge()}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button 
            onClick={sendEmail}
            disabled={sendingEmail}
            className="h-9 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Mail className="size-3.5" />
            {sendingEmail ? 'Sending...' : 'Email'}
          </button>
          <button 
            className="h-9 px-4 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="size-3.5" />
            PDF
          </button>
          <button 
            onClick={() => setShowDeleteModal(true)}
            className="h-9 px-4 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="size-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Action Prompts (if unpaid) */}
      {invoice.status === 'unpaid' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-wrap items-center gap-2.5">
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider mr-1">Actions:</p>
          <button 
            onClick={markAsPaid}
            className="h-9 px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle className="size-3.5" />
            Mark as Paid
          </button>
          <button 
            onClick={cancelInvoice}
            className="h-9 px-4 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Cancel Invoice
          </button>
          {invoice.orderId && (
            <button 
              onClick={() => navigate(`/admin/orders`)}
              className="h-9 px-4 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer ml-auto"
            >
              View Order
            </button>
          )}
        </div>
      )}

      {invoice.status === 'paid' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-extrabold text-emerald-900 text-sm flex items-center gap-1.5">
              <CheckCircle className="size-4 text-emerald-600" />
              Payment Received
            </p>
            <p className="text-xs text-emerald-700 font-medium mt-0.5">This invoice was paid on {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString('en-AU') : 'N/A'}</p>
          </div>
          {invoice.orderId && (
            <button 
              onClick={() => navigate(`/admin/orders`)}
              className="h-9 px-5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer shrink-0"
            >
              View Order
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Customer Info */}
        <div className="md:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-5 space-y-3.5 text-xs">
            <h3 className="text-sm font-black text-[#0f172a] border-b border-slate-100 pb-2.5">Customer Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Name</p>
                <p className="font-extrabold text-[#0f172a]">{invoice.customer.name}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email</p>
                <p className="font-medium text-slate-600">{invoice.customer.email}</p>
              </div>
              {invoice.customer.phone && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Phone</p>
                  <p className="font-medium text-slate-600">{invoice.customer.phone}</p>
                </div>
              )}
              {invoice.customer.company && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Company</p>
                  <p className="font-medium text-slate-600">{invoice.customer.company}</p>
                </div>
              )}
              {invoice.customer.address && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Address</p>
                  <p className="font-medium text-slate-600">{invoice.customer.address}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 text-xs space-y-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Due Date</h3>
            <p className={`font-bold ${new Date(invoice.dueDate) < new Date() && invoice.status === 'unpaid' ? 'text-rose-600' : 'text-[#0f172a]'}`}>{new Date(invoice.dueDate).toLocaleDateString('en-AU')}</p>
          </div>
        </div>

        {/* Items & Totals */}
        <div className="md:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-black text-[#0f172a]">Products Breakdown</h3>
            </div>
            
            <div className="bg-white text-xs">
              <div className="flex gap-4 px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <div className="flex-1">Product</div>
                <div className="w-16 text-center">Qty</div>
                <div className="w-20 text-right">Price</div>
                <div className="w-24 text-right">Total</div>
              </div>
              <div className="divide-y divide-slate-100">
                {invoice.items.map((item, index) => (
                  <div key={index} className="flex gap-4 px-4 py-3 items-center">
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-[#0f172a] truncate">{item.name}</p>
                      {(() => {
                        const isDirectShip = (item as any).uropaMessageEnum === 'AM_DIRECT' || (item as any).uropaShipDirect === 'DIRECT'
                          || (item.backorderMessage || '').toLowerCase().includes('despatch') || (item.backorderMessage || '').toLowerCase().includes('supplier');
                        const hasPromisedDate = !isDirectShip && item.uropaPromisedDate;
                        const hasBackorderMsg = !isDirectShip && !item.uropaPromisedDate && item.backorderMessage && item.backorderMessage.toLowerCase() !== 'in stock';
                        if (isDirectShip) return (
                          <p className="text-[11px] text-amber-700 font-semibold mt-0.5">
                            ⚠️ Dispatched by supplier — availability to be confirmed
                          </p>
                        );
                        if (hasPromisedDate) return (
                          <p className="text-[11px] text-amber-600 font-medium mt-0.5">
                            📅 Expected delivery: {new Date(item.uropaPromisedDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        );
                        if (hasBackorderMsg) return (
                          <p className="text-[11px] text-amber-600 font-medium mt-0.5">{item.backorderMessage}</p>
                        );
                        return null;
                      })()}
                    </div>
                    <div className="w-16 text-center">
                      <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">{item.quantity}</span>
                    </div>
                    <div className="w-20 text-right font-medium text-slate-600">${item.price.toFixed(2)}</div>
                    <div className="w-24 text-right font-black text-[#0f172a]">
                      ${(item.quantity * item.price).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-slate-50/80 p-4 border-t border-slate-200 flex flex-col items-end text-xs">
              <div className="w-full sm:w-64 space-y-1.5">
                <div className="flex justify-between font-semibold text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-800">${invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-600 border-b border-slate-200 pb-2">
                  <span>GST:</span>
                  <span className="font-bold text-slate-800">${invoice.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-[#E31837] pt-1">
                  <span>Total Amount:</span>
                  <span>${invoice.total.toFixed(2)}</span>
                </div>
                {invoice.status === 'unpaid' && (
                  <div className="flex justify-between text-sm font-black text-[#0f172a] pt-2 mt-1 border-t border-slate-200">
                    <span>Balance Due:</span>
                    <span className="text-rose-600">${invoice.total.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 text-xs">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Notes</h3>
              <p className="font-medium text-slate-600 whitespace-pre-wrap leading-relaxed">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteInvoice}
        title="Delete Invoice"
        description={`Are you sure you want to delete invoice ${invoice.invoiceNumber}? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}