import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Trash2, ArrowLeft, Save } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';
import { useCMS } from '../../context/CMSContext';
import { useProducts } from '../../../hooks/useProducts';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

interface InvoiceItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  discount?: number; // Percentage discount (0-100)
}

export function CreateInvoice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { data } = useCMS();
  const { data: productsFromCDN } = useProducts();
  const products = productsFromCDN || [];
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerCompany: '',
    customerAddress: '',
    notes: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    taxRate: 0.1,
  });

  const [items, setItems] = useState<InvoiceItem[]>([]);

  // Load order data if orderId is provided
  useEffect(() => {
    if (orderId) {
      loadOrderData();
    }
  }, [orderId]);

  const loadOrderData = async () => {
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const order = data.order;
        
        setFormData({
          customerName: order.customer?.name || '',
          customerEmail: order.customer?.email || '',
          customerPhone: order.customer?.phone || '',
          customerCompany: order.customer?.company || '',
          customerAddress: order.shippingAddress ? 
            `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}` : '',
          notes: order.notes || '',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          taxRate: 0.1,
        });
        
        setItems(order.items || []);
      }
    } catch (error) {
      console.error('Error loading order:', error);
    }
  };

  const addProduct = (product: any) => {
    const existingItem = items.find(item => item.id === product.id);
    if (existingItem) {
      setItems(items.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setItems([...items, {
        id: product.id,
        name: product.name,
        quantity: 1,
        price: parseFloat(product.price) || 0,
        discount: 0,
      }]);
    }
    setSearchQuery('');
    setShowProductSearch(false);
  };

  const updateItemQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(items.filter(item => item.id !== id));
    } else {
      setItems(items.map(item => 
        item.id === id ? { ...item, quantity } : item
      ));
    }
  };

  const updateItemPrice = (id: string, price: number) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, price } : item
    ));
  };

  const updateItemDiscount = (id: string, discount: number) => {
    const clampedDiscount = Math.max(0, Math.min(100, discount));
    setItems(items.map(item =>
      item.id === id ? { ...item, discount: clampedDiscount } : item
    ));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.price;
    const discountAmount = itemTotal * ((item.discount || 0) / 100);
    return sum + (itemTotal - discountAmount);
  }, 0);
  const tax = subtotal * formData.taxRate;
  const total = subtotal + tax;

  const filteredProducts = products.filter((p: any) =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.code?.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerName || !formData.customerEmail || items.length === 0) {
      alert('Please fill in customer details and add at least one item');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/invoices/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          orderId: orderId || null,
          customer: {
            name: formData.customerName,
            email: formData.customerEmail,
            phone: formData.customerPhone,
            company: formData.customerCompany,
            address: formData.customerAddress,
          },
          items,
          subtotal,
          tax,
          total,
          notes: formData.notes,
          dueDate: new Date(formData.dueDate).toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        alert('Invoice created successfully!');
        navigate(`/admin/invoices/${data.invoice.id}`);
      } else {
        alert('Failed to create invoice');
      }
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-8 space-y-4">
      {/* Header Bar */}
      <div className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button 
            type="button"
            onClick={() => navigate('/admin/invoices')}
            className="size-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="size-4" />
          </button>
          <div>
            <h1 className="text-xl font-black text-[#0f172a] tracking-tight">Create Invoice</h1>
            <p className="text-xs font-semibold text-slate-500">Generate a new official invoice for a customer or order</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-4 sm:p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Information */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-[#0f172a] border-b border-slate-100 pb-2">Customer Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Label htmlFor="customerName" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Customer Name *</Label>
                  <Input
                    id="customerName"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    className="h-9 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerEmail" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email *</Label>
                  <Input
                    id="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    className="h-9 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-xs font-semibold"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="customerPhone" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phone</Label>
                  <Input
                    id="customerPhone"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="h-9 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-xs font-semibold"
                  />
                </div>
                <div>
                  <Label htmlFor="customerCompany" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Company</Label>
                  <Input
                    id="customerCompany"
                    value={formData.customerCompany}
                    onChange={(e) => setFormData({ ...formData, customerCompany: e.target.value })}
                    className="h-9 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-xs font-semibold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="customerAddress" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Address</Label>
                  <Textarea
                    id="customerAddress"
                    value={formData.customerAddress}
                    onChange={(e) => setFormData({ ...formData, customerAddress: e.target.value })}
                    rows={2}
                    className="bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-xs font-semibold resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-[#0f172a] border-b border-slate-100 pb-2">Products Selection</h3>
              
              {/* Product Search */}
              {!orderId && (
                <div className="relative">
                  <Input
                    placeholder="Search products by name or SKU to add..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowProductSearch(true);
                    }}
                    onFocus={() => setShowProductSearch(true)}
                    className="h-10 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-xs font-semibold"
                  />
                  {showProductSearch && searchQuery && (
                    <div className="absolute z-20 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                      {filteredProducts.map(product => (
                        <div
                          key={product.id}
                          className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-0 transition-colors flex justify-between items-center text-xs"
                          onClick={() => addProduct(product)}
                        >
                          <div>
                            <div className="font-extrabold text-[#0f172a]">{product.name}</div>
                            <div className="text-[11px] font-semibold text-slate-400 mt-0.5">{product.sku}</div>
                          </div>
                          <div className="font-black text-[#E31837] text-sm">${parseFloat(product.price).toFixed(2)}</div>
                        </div>
                      ))}
                      {filteredProducts.length === 0 && (
                        <div className="p-3.5 text-center text-xs font-semibold text-slate-500">
                          No products found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Items List */}
              <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden bg-white text-xs">
                <div className="flex gap-2 items-center px-4 py-2.5 bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex-1">Product</div>
                  <div className="w-20 text-center">Qty</div>
                  <div className="w-24 text-center">Price</div>
                  <div className="w-20 text-center">Discount %</div>
                  <div className="w-24 text-right">Total</div>
                  <div className="w-8"></div>
                </div>
                
                <div className="divide-y divide-slate-100">
                  {items.map(item => {
                    const itemTotal = item.quantity * item.price;
                    const discountAmount = itemTotal * ((item.discount || 0) / 100);
                    const finalPrice = itemTotal - discountAmount;

                    return (
                      <div key={item.id} className="flex gap-2 items-center px-4 py-2.5 hover:bg-slate-50/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="font-extrabold text-[#0f172a] truncate">{item.name}</div>
                        </div>
                        <div className="w-20">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value))}
                            min="1"
                            className="h-8 bg-slate-50 border-slate-200 rounded-lg text-center font-bold text-xs focus:bg-white"
                          />
                        </div>
                        <div className="w-24">
                          <Input
                            type="number"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateItemPrice(item.id, parseFloat(e.target.value))}
                            className="h-8 bg-slate-50 border-slate-200 rounded-lg text-center font-bold text-xs focus:bg-white"
                          />
                        </div>
                        <div className="w-20">
                          <Input
                            type="number"
                            step="1"
                            min="0"
                            max="100"
                            value={item.discount || 0}
                            onChange={(e) => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                            className="h-8 bg-slate-50 border-slate-200 rounded-lg text-center font-bold text-xs focus:bg-white"
                          />
                        </div>
                        <div className="w-24 text-right">
                          <div className="font-black text-xs text-[#0f172a]">${finalPrice.toFixed(2)}</div>
                          {(item.discount || 0) > 0 && (
                            <div className="text-[10px] font-bold text-slate-400 line-through">
                              ${itemTotal.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <div className="w-8 flex justify-end">
                          <button
                            type="button"
                            className="size-7 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="text-center p-8">
                      <p className="text-xs font-extrabold text-slate-500">No items added yet.</p>
                      <p className="text-[11px] font-medium text-slate-400 mt-1">Search for products above to start building the invoice.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Totals */}
            {items.length > 0 && (() => {
              const subtotalBeforeDiscount = items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
              const totalDiscount = items.reduce((sum, item) => {
                const itemTotal = item.quantity * item.price;
                return sum + (itemTotal * ((item.discount || 0) / 100));
              }, 0);

              return (
                <div className="bg-slate-50/80 p-4 rounded-xl space-y-1.5 border border-slate-200 flex flex-col items-end text-xs">
                  <div className="w-full sm:w-64 space-y-1.5">
                    {totalDiscount > 0 && (
                      <>
                        <div className="flex justify-between font-semibold text-slate-500">
                          <span>Subtotal (before discount)</span>
                          <span>${subtotalBeforeDiscount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md -mx-2">
                          <span>Total Discount</span>
                          <span>-${totalDiscount.toFixed(2)}</span>
                        </div>
                      </>
                    )}
                    <div className="flex justify-between font-semibold text-slate-600">
                      <span>Subtotal:</span>
                      <span className="font-bold text-slate-800">${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-slate-600 border-b border-slate-200 pb-1.5">
                      <span>GST ({(formData.taxRate * 100).toFixed(0)}%):</span>
                      <span className="font-bold text-slate-800">${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-[#E31837] pt-1">
                      <span>Total Amount:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Additional Details */}
            <div className="space-y-3">
              <h3 className="text-sm font-black text-[#0f172a] border-b border-slate-100 pb-2">Terms & Notes</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <Label htmlFor="dueDate" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="h-9 bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-xs font-semibold"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="notes" className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={2}
                    placeholder="Add any additional terms or payment notes..."
                    className="bg-slate-50 border-slate-200 rounded-xl hover:bg-slate-100 focus:bg-white focus:border-[#E31837] focus:ring-1 focus:ring-[#E31837] transition-all text-xs font-semibold resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
              <button 
                type="submit" 
                disabled={loading || items.length === 0}
                className="h-10 px-6 bg-[#E31837] hover:bg-[#c41530] text-white rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              >
                <Save className="size-4" />
                {loading ? 'Creating...' : 'Create Invoice'}
              </button>
              <button 
                type="button" 
                onClick={() => navigate('/admin/invoices')}
                className="h-10 px-6 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
    </div>
  );
}
