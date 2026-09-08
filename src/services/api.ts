import { Product, ProductVariant, Blog, FAQ, Coupon, Review, WebsiteSettings, User, Order, Address, Doctor, DoctorAppointment, DoctorPrescription } from '../types';

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

  async getProductById(id: string, variantId?: string): Promise<any> {
    const url = variantId ? `/api/products/${id}?variantId=${encodeURIComponent(variantId)}` : `/api/products/${id}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  },

  async getProductVariant(productId: string, variantId: string): Promise<any> {
    const res = await fetch(`/api/products/${productId}/variants/${encodeURIComponent(variantId)}`);
    if (!res.ok) return null;
    return await res.json();
  },

  async switchProductFormulation(productId: string, formType: string): Promise<any> {
    const res = await fetch(`/api/products/${productId}/switch-formulation/${encodeURIComponent(formType)}`);
    if (!res.ok) return null;
    return await res.json();
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
      body: JSON.stringify({ email: (credentials.email || '').trim(), password: (credentials.password || '').trim() || 'password123' })
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.error || errData?.message || 'Authentication failed. Please check credentials.');
    }
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

  async updateProductVariant(productId: string, variantId: string, variantData: Partial<ProductVariant>, token: string): Promise<any> {
    const res = await fetch(`/api/products/${productId}/variants/${encodeURIComponent(variantId)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(variantData)
    });
    if (!res.ok) return null;
    return await res.json();
  },

  async addProductVariant(productId: string, variantData: Partial<ProductVariant>, token: string): Promise<any> {
    const res = await fetch(`/api/products/${productId}/variants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(variantData)
    });
    if (!res.ok) return null;
    return await res.json();
  },

  async deleteProductVariant(productId: string, variantId: string, token: string): Promise<boolean> {
    const res = await fetch(`/api/products/${productId}/variants/${encodeURIComponent(variantId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
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
  },

  // Doctor Consultation Endpoints
  async getDoctors(): Promise<Doctor[]> {
    try {
      const res = await fetch('/api/doctors');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error fetching doctors:', err);
      return [];
    }
  },

  async getDoctorById(id: string): Promise<Doctor | null> {
    try {
      const res = await fetch(`/api/doctors/${id}`);
      if (!res.ok) return null;
      return await res.json();
    } catch (err) {
      console.error('Error fetching doctor by id:', err);
      return null;
    }
  },

  async getDoctorAppointmentsByUser(email: string, token?: string): Promise<DoctorAppointment[]> {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/doctor-appointments/user/${encodeURIComponent(email)}`, { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error fetching doctor appointments:', err);
      return [];
    }
  },

  async bookDoctorAppointment(appointment: Partial<DoctorAppointment>, token?: string): Promise<{ success: boolean; appointment?: DoctorAppointment; error?: string }> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/doctor-appointments', {
        method: 'POST',
        headers,
        body: JSON.stringify(appointment)
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to book appointment' };
      }
      return { success: true, appointment: data.appointment };
    } catch (err: any) {
      console.error('Error booking doctor appointment:', err);
      return { success: false, error: err?.message || 'Network error' };
    }
  },

  async cancelDoctorAppointment(id: string, token?: string): Promise<boolean> {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/doctor-appointments/${id}`, {
        method: 'DELETE',
        headers
      });
      return res.ok;
    } catch (err) {
      console.error('Error cancelling doctor appointment:', err);
      return false;
    }
  },

  async getAllDoctorAppointments(token?: string): Promise<DoctorAppointment[]> {
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch('/api/doctor-appointments', { headers });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Error fetching all appointments:', err);
      return [];
    }
  },

  async updateDoctorAppointmentStatus(id: string, status: string, token?: string): Promise<{ success: boolean; appointment?: DoctorAppointment }> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/doctor-appointments/${id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      return { success: res.ok, appointment: data.appointment };
    } catch (err) {
      console.error('Error updating appointment status:', err);
      return { success: false };
    }
  },

  async saveDoctorPrescription(id: string, prescription: Partial<DoctorPrescription>, token?: string): Promise<{ success: boolean; appointment?: DoctorAppointment }> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/doctor-appointments/${id}/prescription`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(prescription)
      });
      const data = await res.json();
      return { success: res.ok, appointment: data.appointment };
    } catch (err) {
      console.error('Error saving prescription:', err);
      return { success: false };
    }
  },

  async updateAppointmentMeetingLink(id: string, meetingLink: string, meetingPlatform?: 'jitsi' | 'google-meet', token?: string): Promise<{ success: boolean; appointment?: DoctorAppointment }> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/doctor-appointments/${id}/meeting-link`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ meetingLink, meetingPlatform })
      });
      const data = await res.json();
      return { success: res.ok, appointment: data.appointment };
    } catch (err) {
      console.error('Error updating meeting link:', err);
      return { success: false };
    }
  },

  async updateAppointmentRoomStatus(id: string, roomStatus: 'waiting' | 'in-progress' | 'completed', token?: string): Promise<{ success: boolean; appointment?: DoctorAppointment }> {
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      const res = await fetch(`/api/doctor-appointments/${id}/room-status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ roomStatus })
      });
      const data = await res.json();
      return { success: res.ok, appointment: data.appointment };
    } catch (err) {
      console.error('Error updating room status:', err);
      return { success: false };
    }
  }
};
