import { Product, Blog, FAQ, Coupon, Review, WebsiteSettings, User, Order, Address } from '../types';

export const api = {
  async getBaselineData(): Promise<{ products: Product[]; settings: WebsiteSettings | null }> {
    try {
      const [pRes, sRes] = await Promise.all([
        fetch('/api/products').then(r => r.json()),
        fetch('/api/settings').then(r => r.json())
      ]);
      return {
        products: Array.isArray(pRes) ? pRes : [],
        settings: sRes && sRes.defaultTaxPercentage !== undefined ? sRes : null
      };
    } catch (err) {
      console.error('Error fetching baseline data:', err);
      return { products: [], settings: null };
    }
  },

  async getProducts(): Promise<Product[]> {
    const res = await fetch('/api/products');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getBlogs(): Promise<Blog[]> {
    const res = await fetch('/api/blogs');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getFaqs(): Promise<FAQ[]> {
    const res = await fetch('/api/faqs');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getCoupons(): Promise<Coupon[]> {
    const res = await fetch('/api/coupons');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async getReviews(): Promise<Review[]> {
    const res = await fetch('/api/reviews');
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async postReview(review: Review): Promise<void> {
    await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review)
    });
  },

  async getUserMe(token: string): Promise<User | null> {
    const res = await fetch('/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.user || null;
  },

  async getOrders(token: string): Promise<Order[]> {
    const res = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  },

  async login(credentials: { email: string; password?: string }): Promise<{ token: string; user: User } | null> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: credentials.email, password: credentials.password || 'password123' })
    });
    if (!res.ok) return null;
    return await res.json();
  },

  async register(data: { fullName: string; email: string; phone: string; role: string; password?: string; accessToken?: string; code?: string; reqId?: string }): Promise<{ token: string; user: User } | null> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) return null;
    return await res.json();
  },

  async updateAddresses(addresses: Address[], token: string): Promise<boolean> {
    const res = await fetch('/api/auth/me', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ addresses })
    });
    return res.ok;
  },

  async placeOrder(orderPayload: Partial<Order>, token: string): Promise<Order | null> {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(orderPayload)
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.order || data;
  },

  async updateOrderStatus(orderId: string, status: string, paymentStatus: string, token: string): Promise<Order | null> {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status, paymentStatus })
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.order || null;
  },

  async addProduct(product: Partial<Product>, token: string): Promise<Product | null> {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(product)
    });
    if (!res.ok) return null;
    return await res.json();
  },

  async updateProduct(id: string, product: Partial<Product>, token: string): Promise<boolean> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(product)
    });
    return res.ok;
  },

  async deleteProduct(id: string, token: string): Promise<boolean> {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.ok;
  },

  async addCoupon(coupon: Coupon, token: string): Promise<boolean> {
    const res = await fetch('/api/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(coupon)
    });
    return res.ok;
  },

  async updateSettings(settings: WebsiteSettings, token: string): Promise<boolean> {
    const res = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(settings)
    });
    return res.ok;
  }
};
