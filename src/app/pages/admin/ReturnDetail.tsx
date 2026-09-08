import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { 
  ArrowLeft, CheckCircle, XCircle, DollarSign, Package, 
  User, Calendar, AlertCircle, RotateCcw, Save, Loader2
} from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface ReturnDetailData {
  id: string;
  returnNumber: string;
  orderId: string;
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  items: Array<{
    productId: string;
    productName: string;
    sku: string;
    quantity: number;
    price: number;
    reason: string;
  }>;
  reason: string;
  comments?: string;
  status: 'pending' | 'approved' | 'rejected' | 'refunded';
  refundAmount: number;
  refundMethod?: string;
  createdAt: string;
  processedAt?: string;
  adminNotes?: string;
}

export function ReturnDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [returnData, setReturnData] = useState<ReturnDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchReturnDetail();
  }, [id]);

  const fetchReturnDetail = async () => {
    try {
      const response = await fetch(`${API_URL}/returns/${id}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReturnData(data.return);
        setAdminNotes(data.return.adminNotes || '');
      } else {
        alert('Return request not found');
        navigate('/admin/returns');
      }
    } catch (error) {
      console.error('Error fetching return detail:', error);
      alert('Failed to load return details');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: 'approved' | 'rejected') => {
    setProcessing(true);
    try {
      const response = await fetch(`${API_URL}/returns/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          status,
          adminNotes,
          processedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        fetchReturnDetail();
      } else {
        alert('Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setProcessing(false);
    }
  };

  const processRefund = async () => {
    setProcessing(true);
    try {
      const response = await fetch(`${API_URL}/returns/${id}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          adminNotes,
        }),
      });

      if (response.ok) {
        fetchReturnDetail();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to process refund');
      }
    } catch (error) {
      console.error('Error processing refund:', error);
      alert('Failed to process refund');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FAFC] p-2 sm:p-3 font-sans flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RotateCcw className="size-8 animate-spin text-[#E31837]" />
          <p className="text-[#2D3748] font-bold text-sm">Loading return details...</p>
        </div>
      </div>
    );
  }

  if (!returnData) {
    return null;
  }

  const getStatusBadge = () => {
    switch (returnData.status) {
      case 'pending':
        return <Badge className="bg-amber-50 text-amber-700 border-amber-200/60 rounded-lg px-3 py-1 font-bold text-xs uppercase tracking-wider">Pending Review</Badge>;
      case 'approved':
        return <Badge className="bg-blue-50 text-blue-700 border-blue-200/60 rounded-lg px-3 py-1 font-bold text-xs uppercase tracking-wider">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-rose-50 text-rose-700 border-rose-200/60 rounded-lg px-3 py-1 font-bold text-xs uppercase tracking-wider">Rejected</Badge>;
      case 'refunded':
        return <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/60 rounded-lg px-3 py-1 font-bold text-xs uppercase tracking-wider">Refunded</Badge>;
      default:
        return <Badge className="bg-slate-100 text-slate-700 border-slate-200 rounded-lg px-3 py-1 font-bold text-xs uppercase tracking-wider">{returnData.status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-[#F7FAFC] p-2 sm:p-3 font-sans pb-24">
      <div className="max-w-[1600px] mx-auto space-y-3">
        {/* Navigation & Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/50">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/admin/returns')}
              className="h-9 px-3 bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold shadow-2xs"
            >
              <ArrowLeft className="size-4 mr-1.5" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-extrabold text-[#2D3748] tracking-tight flex items-center gap-2">
                Return Request: {returnData.returnNumber}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-slate-500 font-medium">
                <span>Order: <strong className="text-[#2D3748] font-bold">{returnData.orderId}</strong></span>
                <span>•</span>
                <span>Created: {new Date(returnData.createdAt).toLocaleDateString('en-AU')}</span>
                {returnData.processedAt && (
                  <>
                    <span>•</span>
                    <span>Processed: {new Date(returnData.processedAt).toLocaleDateString('en-AU')}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </div>

        {/* Action Status Ribbon */}
        {returnData.status === 'pending' && (
          <Card className="bg-amber-50/60 border-amber-200/80 shadow-2xs rounded-xl p-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-amber-900">Return Request Awaiting Approval</h4>
                  <p className="text-[11px] text-amber-700 font-medium">Review customer details and return items before taking action.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => updateStatus('approved')}
                  disabled={processing}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold h-8 px-3 shadow-2xs"
                >
                  {processing ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <CheckCircle className="size-3.5 mr-1" />}
                  Approve Return
                </Button>
                <Button
                  onClick={() => updateStatus('rejected')}
                  disabled={processing}
                  variant="outline"
                  className="bg-white border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold h-8 px-3 shadow-2xs"
                >
                  <XCircle className="size-3.5 mr-1" />
                  Reject Return
                </Button>
              </div>
            </div>
          </Card>
        )}

        {returnData.status === 'approved' && (
          <Card className="bg-blue-50/60 border-blue-200/80 shadow-2xs rounded-xl p-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="size-5 text-blue-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-blue-900">Return Approved & Ready for Refund</h4>
                  <p className="text-[11px] text-blue-700 font-medium">Click below to issue final refund amount of ${returnData.refundAmount.toFixed(2)} to customer.</p>
                </div>
              </div>
              <Button
                onClick={processRefund}
                disabled={processing}
                className="bg-[#2D3748] hover:bg-slate-800 text-white rounded-xl text-xs font-bold h-8 px-4 shadow-2xs"
              >
                {processing ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <DollarSign className="size-3.5 mr-1" />}
                Issue Refund (${returnData.refundAmount.toFixed(2)})
              </Button>
            </div>
          </Card>
        )}

        {returnData.status === 'refunded' && (
          <Card className="bg-emerald-50/60 border-emerald-200/80 shadow-2xs rounded-xl p-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="size-5 text-emerald-600 shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900">Refund Completed</h4>
                <p className="text-[11px] text-emerald-700 font-medium">
                  Total of ${returnData.refundAmount.toFixed(2)} has been successfully refunded to customer.
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Side-by-side Laptop Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
          {/* Left Side: Return Items & Reasons (lg:col-span-2) */}
          <div className="lg:col-span-2 space-y-3">
            <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
              <CardHeader className="p-3 border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-bold text-[#2D3748] flex items-center gap-2">
                  <Package className="size-4 text-[#E31837]" />
                  Return Items Breakdown
                </CardTitle>
                <Badge variant="outline" className="border-slate-200 text-slate-600 bg-white font-bold text-xs">
                  {returnData.items.length} Item(s)
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[#2D3748] font-bold uppercase tracking-wider">
                        <th className="py-2.5 px-4">Product Details</th>
                        <th className="py-2.5 px-4 text-center">Qty</th>
                        <th className="py-2.5 px-4 text-right">Unit Price</th>
                        <th className="py-2.5 px-4 text-right">Total Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {returnData.items.map((item, index) => (
                        <tr key={index} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-bold text-[#2D3748] text-xs">{item.productName}</p>
                            <p className="text-[11px] font-mono text-slate-400 mt-0.5 uppercase">SKU: {item.sku}</p>
                            {item.reason && (
                              <div className="mt-1.5 bg-amber-50 border border-amber-200/60 rounded-md p-1.5 text-[11px]">
                                <span className="font-bold text-amber-900">Reason: </span>
                                <span className="text-amber-800 font-medium">{item.reason}</span>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center justify-center h-6 px-2.5 bg-slate-100 text-slate-700 rounded-full text-xs font-bold">
                              {item.quantity}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-medium text-slate-600">
                            ${item.price.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-black text-[#2D3748]">
                            ${(item.price * item.quantity).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Return Reason & Comments Card */}
            <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
              <CardHeader className="p-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-sm font-bold text-[#2D3748] flex items-center gap-2">
                  <AlertCircle className="size-4 text-amber-600" />
                  Primary Return Reason & Customer Comments
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Primary Reason</p>
                  <p className="text-xs font-bold text-[#2D3748] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    {returnData.reason || 'No specific primary reason selected'}
                  </p>
                </div>
                {returnData.comments && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Customer Comments</p>
                    <p className="text-xs font-medium text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-wrap">
                      {returnData.comments}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Side: Customer Info, Refund Summary & Internal Notes (lg:col-span-1) */}
          <div className="space-y-3">
            {/* Refund Summary Card */}
            <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
              <CardHeader className="p-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-sm font-bold text-[#2D3748]">Refund Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Subtotal</span>
                  <span className="font-bold text-[#2D3748]">${returnData.refundAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Restocking Fee</span>
                  <span className="font-semibold text-slate-600">$0.00</span>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-xs font-bold text-[#2D3748] uppercase tracking-wider">Total Refund</span>
                  <span className="text-xl font-black text-[#E31837]">${returnData.refundAmount.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Customer Information Card */}
            <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
              <CardHeader className="p-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-sm font-bold text-[#2D3748] flex items-center gap-2">
                  <User className="size-4 text-slate-400" />
                  Customer Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2.5 text-xs">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Customer Name</p>
                  <p className="font-bold text-[#2D3748] text-xs mt-0.5">{returnData.customer?.name}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</p>
                  <p className="font-semibold text-slate-600 text-xs mt-0.5">{returnData.customer?.email}</p>
                </div>
                {returnData.customer?.phone && (
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Phone Number</p>
                    <p className="font-semibold text-slate-600 text-xs mt-0.5">{returnData.customer?.phone}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Internal Admin Notes Card */}
            <Card className="bg-white border-slate-200 shadow-xs rounded-xl overflow-hidden">
              <CardHeader className="p-3 border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-sm font-bold text-[#2D3748]">Internal Admin Notes</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div>
                  <Label htmlFor="adminNotes" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Notes (Internal Staff Only)</Label>
                  <Textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={4}
                    placeholder="Add internal staff notes regarding inspection or status..."
                    className="text-xs border-slate-200 rounded-lg focus:ring-[#2D3748] focus:border-[#2D3748] resize-none"
                  />
                </div>
                <Button
                  onClick={fetchReturnDetail}
                  size="sm"
                  className="w-full bg-[#2D3748] hover:bg-slate-800 text-white rounded-lg font-semibold text-xs shadow-2xs h-8"
                >
                  <Save className="size-3.5 mr-1.5" />
                  Save Internal Notes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
