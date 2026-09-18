import { useState, useEffect, useCallback } from 'react';
import { Star, Plus, Check, X, Trash2, Edit2, Search, Filter } from 'lucide-react';
import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_URL = `https://${projectId}.supabase.co/functions/v1/make-server-d1fbc049`;

const authHeaders = {
  'Authorization': `Bearer ${publicAnonKey}`,
  'Content-Type': 'application/json',
};

function StarRating({ value, onChange }: { value: number; onChange?: (n: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-5 h-5 cursor-pointer transition-colors ${
            i <= (hover || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
          onClick={() => onChange?.(i)}
          onMouseEnter={() => onChange && setHover(i)}
          onMouseLeave={() => onChange && setHover(0)}
        />
      ))}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
};

const emptyForm = {
  productId: '',
  productName: '',
  customerName: '',
  rating: 5,
  title: '',
  body: '',
  createdAt: new Date().toISOString().slice(0, 10),
};

export function ReviewsManager() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingReview, setEditingReview] = useState<any | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/reviews/admin/list`, { headers: authHeaders });
      const data = await res.json();
      if (data.success) setReviews(data.reviews);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/products?limit=200`, { headers: authHeaders });
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchReviews();
    fetchProducts();
  }, [fetchReviews, fetchProducts]);

  const approve = async (id: string) => {
    await fetch(`${API_URL}/reviews/admin/${id}/approve`, { method: 'PUT', headers: authHeaders });
    fetchReviews();
  };

  const reject = async (id: string) => {
    await fetch(`${API_URL}/reviews/admin/${id}/reject`, { method: 'PUT', headers: authHeaders });
    fetchReviews();
  };

  const deleteReview = async (id: string) => {
    if (!confirm('Delete this review permanently?')) return;
    await fetch(`${API_URL}/reviews/admin/${id}`, { method: 'DELETE', headers: authHeaders });
    fetchReviews();
  };

  const openCreate = () => {
    setEditingReview(null);
    setForm({ ...emptyForm });
    setProductSearch('');
    setShowCreateModal(true);
  };

  const openEdit = (review: any) => {
    setEditingReview(review);
    setForm({
      productId: review.productId,
      productName: review.productName,
      customerName: review.customerName,
      rating: review.rating,
      title: review.title || '',
      body: review.body,
      createdAt: review.createdAt?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    });
    setProductSearch(review.productName || '');
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    if (!form.productId || !form.customerName || !form.body) {
      alert('Please fill in product, reviewer name and review body.');
      return;
    }
    setSaving(true);
    try {
      if (editingReview) {
        await fetch(`${API_URL}/reviews/admin/${editingReview.id}`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({ ...form, createdAt: form.createdAt ? new Date(form.createdAt).toISOString() : undefined }),
        });
      } else {
        await fetch(`${API_URL}/reviews/admin/create`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ ...form, createdAt: form.createdAt ? new Date(form.createdAt).toISOString() : undefined }),
        });
      }
      setShowCreateModal(false);
      fetchReviews();
    } catch (e) {
      alert('Save failed');
    } finally {
      setSaving(false);
    }
  };

  const filteredReviews = reviews.filter(r => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const q = search.toLowerCase();
    const matchesSearch = !q ||
      r.customerName?.toLowerCase().includes(q) ||
      r.productName?.toLowerCase().includes(q) ||
      r.body?.toLowerCase().includes(q) ||
      r.title?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const counts = {
    all: reviews.length,
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length,
    rejected: reviews.filter(r => r.status === 'rejected').length,
  };

  const filteredProducts = products.filter(p =>
    !productSearch || (p.name || p.title || '').toLowerCase().includes(productSearch.toLowerCase())
  ).slice(0, 20);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Moderate customer reviews and create manual reviews</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#E31837] hover:bg-[#c01530] text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Review
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filterStatus === s
                ? 'bg-[#E31837] text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 text-xs opacity-75">({counts[s]})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by customer, product, or content..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#E31837]/30"
        />
      </div>

      {/* Reviews list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading reviews…</div>
      ) : filteredReviews.length === 0 ? (
        <div className="text-center py-16 text-gray-400">No reviews found.</div>
      ) : (
        <div className="space-y-3">
          {filteredReviews.map(review => (
            <div key={review.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <StarRating value={review.rating} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[review.status]}`}>
                      {review.status}
                    </span>
                    {review.adminCreated && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
                        Admin created
                      </span>
                    )}
                    {review.verified && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                        Verified purchase
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5">
                    {review.title && <p className="font-semibold text-gray-800 text-sm">{review.title}</p>}
                    <p className="text-gray-600 text-sm mt-0.5 line-clamp-3">{review.body}</p>
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                    <span className="font-medium text-gray-600">{review.customerName}</span>
                    <span>·</span>
                    <span className="text-[#E31837] font-medium truncate max-w-[200px]">{review.productName || review.productId}</span>
                    <span>·</span>
                    <span>{new Date(review.createdAt).toLocaleDateString('en-AU')}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {review.status !== 'approved' && (
                    <button
                      onClick={() => approve(review.id)}
                      className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                      title="Approve"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  {review.status !== 'rejected' && (
                    <button
                      onClick={() => reject(review.id)}
                      className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="Reject"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(review)}
                    className="p-1.5 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => deleteReview(review.id)}
                    className="p-1.5 rounded-lg bg-gray-50 text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {editingReview ? 'Edit Review' : 'Create Review'}
              </h2>

              {/* Product picker */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                <input
                  type="text"
                  placeholder="Search product…"
                  value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setForm(f => ({ ...f, productId: '', productName: '' })); }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E31837]/30"
                />
                {productSearch && !form.productId && filteredProducts.length > 0 && (
                  <div className="border border-gray-200 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-sm">
                    {filteredProducts.map(p => (
                      <button
                        key={p.id || p.product_id}
                        onClick={() => {
                          const id = p.id || p.product_id;
                          const name = p.name || p.title || id;
                          setForm(f => ({ ...f, productId: id, productName: name }));
                          setProductSearch(name);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0"
                      >
                        {p.name || p.title}
                      </button>
                    ))}
                  </div>
                )}
                {form.productId && (
                  <p className="text-xs text-green-600 mt-1">✓ {form.productName}</p>
                )}
              </div>

              {/* Customer name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer Name *</label>
                <input
                  type="text"
                  value={form.customerName}
                  onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))}
                  placeholder="e.g. John S."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E31837]/30"
                />
              </div>

              {/* Rating */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating *</label>
                <StarRating value={form.rating} onChange={n => setForm(f => ({ ...f, rating: n }))} />
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Great product!"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E31837]/30"
                />
              </div>

              {/* Body */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Body *</label>
                <textarea
                  value={form.body}
                  onChange={e => setForm(f => ({ ...f, body: e.target.value }))}
                  rows={4}
                  placeholder="Write the review content here…"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E31837]/30 resize-none"
                />
              </div>

              {/* Date */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Review Date</label>
                <input
                  type="date"
                  value={form.createdAt}
                  onChange={e => setForm(f => ({ ...f, createdAt: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#E31837]/30"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 border border-gray-200 text-gray-600 rounded-lg py-2.5 font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-[#E31837] hover:bg-[#c01530] disabled:opacity-50 text-white rounded-lg py-2.5 font-medium transition-colors"
                >
                  {saving ? 'Saving…' : editingReview ? 'Save Changes' : 'Create Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
