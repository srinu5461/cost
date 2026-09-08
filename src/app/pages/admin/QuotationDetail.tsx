import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  ArrowLeft, CheckCircle, XCircle, FileText, Download, 
  ShoppingCart, Mail, Trash2
} from 'lucide-react';
import { DeleteConfirmModal } from '../../components/ui/DeleteConfirmModal';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface Quotation {
  id: string;
  quotationNumber: string;
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
  taxRate: number;
  total: number;
  status: string;
  validUntil: string;
  createdAt: string;
  notes?: string;
  invoiceId?: string;
}

export function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quotation, setQuotation] = useState<Quotation | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const fetchQuotation = async () => {
    try {
      const response = await fetch(`${API_URL}/quotations/${id}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQuotation(data.quotation);
      } else {
        alert('Quotation not found');
        navigate('/admin/quotations');
      }
    } catch (error) {
      console.error('Error fetching quotation:', error);
      alert('Failed to load quotation');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      const response = await fetch(`${API_URL}/quotations/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        alert(`Quotation ${status}`);
        fetchQuotation();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const convertToOrder = async () => {
    if (!confirm('Convert this quotation to an invoice and send to customer?')) return;

    try {
      // Step 1: Convert to invoice
      const convertResponse = await fetch(`${API_URL}/quotations/${id}/convert`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!convertResponse.ok) {
        const error = await convertResponse.json();
        alert(error.error || 'Failed to convert to invoice');
        return;
      }

      const convertData = await convertResponse.json();
      const invoice = convertData.invoice;
      const isAlreadyConverted = convertData.alreadyConverted;

      if (isAlreadyConverted) {
        // Already converted, just navigate to existing invoice
        alert(`This quotation is already converted to invoice ${invoice.invoiceNumber}`);
        navigate(`/admin/invoices/${invoice.id}`);
        return;
      }

      // Step 2: Send invoice email with payment link (for new conversions only)
      try {
        const emailResponse = await fetch(`${API_URL}/invoices/${invoice.id}/send-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        });

        if (emailResponse.ok) {
          alert(`✅ Invoice ${invoice.invoiceNumber} created and sent!\n📧 Customer will receive email with payment link\n📋 Quotation: ${quotation?.quotationNumber}`);
        } else {
          alert(`✅ Invoice ${invoice.invoiceNumber} created!\n⚠️ Email failed to send. You can resend from Invoice Manager.`);
        }
      } catch (emailError) {
        console.error('Error sending invoice email:', emailError);
        alert(`✅ Invoice ${invoice.invoiceNumber} created!\n⚠️ Email failed to send. You can resend from Invoice Manager.`);
      }

      // Navigate to invoice
      navigate(`/admin/invoices/${invoice.id}`);
    } catch (error) {
      console.error('Error converting to invoice:', error);
      alert('Failed to convert to invoice');
    }
  };

  const deleteQuotation = async () => {
    if (!confirm('Are you sure you want to delete this quotation?')) return;

    try {
      const response = await fetch(`${API_URL}/quotations/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        alert('Quotation deleted');
        navigate('/admin/quotations');
      } else {
        alert('Failed to delete quotation');
      }
    } catch (error) {
      console.error('Error deleting quotation:', error);
      alert('Failed to delete quotation');
    }
  };

  const sendEmail = async () => {
    if (!confirm('Send this quotation via email?')) return;
    setSendingEmail(true);

    try {
      const response = await fetch(`${API_URL}/quotations/${id}/send-email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        alert('Email sent successfully!');
        fetchQuotation(); // Refresh to show email sent status
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email');
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

  if (!quotation) {
    return null;
  }

  const getStatusBadge = () => {
    switch (quotation.status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase tracking-wider">Pending</Badge>;
      case 'accepted':
        return <Badge className="bg-green-100 text-green-800 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase tracking-wider">Accepted</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase tracking-wider">Rejected</Badge>;
      case 'expired':
        return <Badge className="bg-slate-200 text-slate-700 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase tracking-wider">Expired</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-none rounded-full px-3 py-1 font-bold text-[11px] uppercase tracking-wider">{quotation.status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-4">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <button 
            onClick={() => navigate('/admin/quotations')}
            className="size-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-[#0f172a] tracking-tight">{quotation.quotationNumber}</h1>
            <div className="flex items-center gap-2.5 mt-0.5">
              <span className="text-xs font-semibold text-slate-500">Created: {new Date(quotation.createdAt).toLocaleDateString('en-AU')}</span>
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

      {/* Action Prompts (if pending) */}
      {quotation.status === 'pending' && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-wrap items-center gap-2.5">
          <p className="text-xs font-black text-slate-500 uppercase tracking-wider mr-1">Actions:</p>
          <button 
            onClick={() => updateStatus('accepted')}
            className="h-9 px-4 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle className="size-3.5" />
            Accept
          </button>
          <button 
            onClick={() => updateStatus('rejected')}
            className="h-9 px-4 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <XCircle className="size-3.5" />
            Reject
          </button>
          <button 
            onClick={convertToOrder}
            className="h-9 px-4 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer ml-auto"
          >
            <FileText className="size-3.5" />
            Convert to Invoice
          </button>
        </div>
      )}

      {quotation.status === 'accepted' && !quotation.invoiceId && (
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-extrabold text-[#0f172a] text-sm">Ready to process?</p>
            <p className="text-xs text-slate-500 font-medium">This quotation was accepted and can be converted into an invoice.</p>
          </div>
          <button 
            onClick={convertToOrder}
            className="h-9 px-5 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <FileText className="size-3.5" />
            Convert to Invoice
          </button>
        </div>
      )}

      {quotation.invoiceId && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="font-extrabold text-emerald-900 text-sm">Invoice Generated</p>
            <p className="text-xs text-emerald-700 font-medium">This quotation has been converted to an invoice.</p>
          </div>
          <button 
            onClick={() => navigate(`/admin/invoices/${quotation.invoiceId}`)}
            className="h-9 px-5 bg-white hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer shrink-0"
          >
            <FileText className="size-3.5" />
            View Invoice
          </button>
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
                <p className="font-extrabold text-[#0f172a]">{quotation.customer.name}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Email</p>
                <p className="font-medium text-slate-600">{quotation.customer.email}</p>
              </div>
              {quotation.customer.phone && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Phone</p>
                  <p className="font-medium text-slate-600">{quotation.customer.phone}</p>
                </div>
              )}
              {quotation.customer.company && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Company</p>
                  <p className="font-medium text-slate-600">{quotation.customer.company}</p>
                </div>
              )}
              {quotation.customer.address && (
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Address</p>
                  <p className="font-medium text-slate-600">{quotation.customer.address}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 text-xs space-y-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Validity Period</h3>
            <p className="font-bold text-[#0f172a]">{new Date(quotation.validUntil).toLocaleDateString('en-AU')}</p>
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
                {quotation.items.map((item, index) => (
                  <div key={index} className="flex gap-4 px-4 py-3 items-center">
                    <div className="flex-1 min-w-0">
                      <p className="font-extrabold text-[#0f172a] truncate">{item.name}</p>
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
                  <span className="font-bold text-slate-800">${quotation.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-600 border-b border-slate-200 pb-2">
                  <span>GST ({(quotation.taxRate * 100).toFixed(0)}%):</span>
                  <span className="font-bold text-slate-800">${quotation.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-black text-[#E31837] pt-1">
                  <span>Total Amount:</span>
                  <span>${quotation.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {quotation.notes && (
            <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 text-xs">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider mb-2">Notes</h3>
              <p className="font-medium text-slate-600 whitespace-pre-wrap leading-relaxed">{quotation.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteQuotation}
        title="Delete Quotation"
        description={`Are you sure you want to delete quotation ${quotation.quotationNumber}? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
}