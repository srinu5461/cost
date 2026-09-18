import { Hono } from 'npm:hono';
import * as kv from './kv_custom.tsx';

const reviews = new Hono();

function generateId(): string {
  return `rev_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// Public: get approved reviews for a product
reviews.get('/product/:productId', async (c) => {
  try {
    const productId = c.req.param('productId');
    const all: any[] = await kv.get('reviews') || [];
    const approved = all
      .filter((r: any) => r.productId === productId && r.status === 'approved')
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json({ success: true, reviews: approved });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Public: get rating summary for a product
reviews.get('/summary/:productId', async (c) => {
  try {
    const productId = c.req.param('productId');
    const all: any[] = await kv.get('reviews') || [];
    const approved = all.filter((r: any) => r.productId === productId && r.status === 'approved');
    if (approved.length === 0) return c.json({ success: true, summary: null });
    const total = approved.reduce((sum: number, r: any) => sum + r.rating, 0);
    const avg = total / approved.length;
    const breakdown: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    approved.forEach((r: any) => { breakdown[r.rating] = (breakdown[r.rating] || 0) + 1; });
    return c.json({ success: true, summary: { avg: Math.round(avg * 10) / 10, count: approved.length, breakdown } });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Public: submit a customer review (goes to pending)
reviews.post('/submit', async (c) => {
  try {
    const body = await c.req.json();
    const { productId, productName, customerId, customerName, rating, title, body: reviewBody } = body;
    if (!productId || !customerName || !rating || !reviewBody) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }
    if (rating < 1 || rating > 5) {
      return c.json({ success: false, error: 'Rating must be between 1 and 5' }, 400);
    }

    const review = {
      id: generateId(),
      productId,
      productName: productName || '',
      customerId: customerId || null,
      customerName,
      rating: Number(rating),
      title: title || '',
      body: reviewBody,
      status: 'pending',
      createdAt: new Date().toISOString(),
      verified: !!customerId,
      adminCreated: false,
    };

    const all: any[] = await kv.get('reviews') || [];
    all.push(review);
    await kv.set('reviews', all);

    return c.json({ success: true, review });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Admin: list all reviews
reviews.get('/admin/list', async (c) => {
  try {
    const all: any[] = await kv.get('reviews') || [];
    const sorted = [...all].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return c.json({ success: true, reviews: sorted });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Admin: create a manual/fake review (auto-approved)
reviews.post('/admin/create', async (c) => {
  try {
    const body = await c.req.json();
    const { productId, productName, customerName, rating, title, body: reviewBody, createdAt } = body;
    if (!productId || !customerName || !rating || !reviewBody) {
      return c.json({ success: false, error: 'Missing required fields' }, 400);
    }

    const review = {
      id: generateId(),
      productId,
      productName: productName || '',
      customerId: null,
      customerName,
      rating: Number(rating),
      title: title || '',
      body: reviewBody,
      status: 'approved',
      createdAt: createdAt || new Date().toISOString(),
      verified: false,
      adminCreated: true,
    };

    const all: any[] = await kv.get('reviews') || [];
    all.push(review);
    await kv.set('reviews', all);

    // Update product rating
    await recalcProductRating(productId);

    return c.json({ success: true, review });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Admin: approve a review
reviews.put('/admin/:id/approve', async (c) => {
  try {
    const id = c.req.param('id');
    const all: any[] = await kv.get('reviews') || [];
    const idx = all.findIndex((r: any) => r.id === id);
    if (idx === -1) return c.json({ success: false, error: 'Review not found' }, 404);
    all[idx].status = 'approved';
    all[idx].updatedAt = new Date().toISOString();
    await kv.set('reviews', all);
    await recalcProductRating(all[idx].productId);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Admin: reject a review
reviews.put('/admin/:id/reject', async (c) => {
  try {
    const id = c.req.param('id');
    const all: any[] = await kv.get('reviews') || [];
    const idx = all.findIndex((r: any) => r.id === id);
    if (idx === -1) return c.json({ success: false, error: 'Review not found' }, 404);
    all[idx].status = 'rejected';
    all[idx].updatedAt = new Date().toISOString();
    await kv.set('reviews', all);
    await recalcProductRating(all[idx].productId);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Admin: delete a review
reviews.delete('/admin/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const all: any[] = await kv.get('reviews') || [];
    const review = all.find((r: any) => r.id === id);
    if (!review) return c.json({ success: false, error: 'Review not found' }, 404);
    const updated = all.filter((r: any) => r.id !== id);
    await kv.set('reviews', updated);
    await recalcProductRating(review.productId);
    return c.json({ success: true });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Admin: update a review
reviews.put('/admin/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const all: any[] = await kv.get('reviews') || [];
    const idx = all.findIndex((r: any) => r.id === id);
    if (idx === -1) return c.json({ success: false, error: 'Review not found' }, 404);
    all[idx] = { ...all[idx], ...body, id, updatedAt: new Date().toISOString() };
    await kv.set('reviews', all);
    if (body.status === 'approved' || body.rating) await recalcProductRating(all[idx].productId);
    return c.json({ success: true, review: all[idx] });
  } catch (error) {
    return c.json({ success: false, error: String(error) }, 500);
  }
});

async function recalcProductRating(productId: string) {
  try {
    const all: any[] = await kv.get('reviews') || [];
    const approved = all.filter((r: any) => r.productId === productId && r.status === 'approved');
    const avg = approved.length > 0
      ? approved.reduce((sum: number, r: any) => sum + r.rating, 0) / approved.length
      : 0;
    const rounded = Math.round(avg * 10) / 10;

    // Update the product in KV
    const products: any[] = await kv.get('products_list') || [];
    const pIdx = products.findIndex((p: any) => p.id === productId || p.product_id === productId);
    if (pIdx !== -1) {
      products[pIdx].rating = rounded;
      products[pIdx].reviews_count = approved.length;
      await kv.set('products_list', products);
    }

    // Also update the individual product key
    const product = await kv.get(`products:${productId}`);
    if (product) {
      product.rating = rounded;
      product.reviews_count = approved.length;
      await kv.set(`products:${productId}`, product);
    }
  } catch (e) {
    console.error('recalcProductRating error:', e);
  }
}

export default reviews;
