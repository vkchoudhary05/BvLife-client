import { useState, useEffect, useCallback } from 'react';
import { Product, Blog, FAQ, Coupon, Review, WebsiteSettings, Order, User, Address } from '../types';
import { api } from '../services/api';

export function useAppData(authToken: string | null, currentUser: User | null, setCurrentUser: (user: User | null) => void) {
  const [products, setProducts] = useState<Product[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>(() => {
    try {
      const stored = localStorage.getItem('Bv_local_reviews');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  // Baseline data fetch
  useEffect(() => {
    let cancelled = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    const retryDelays = [1000, 2500, 5000];

    const loadBaseline = async (attempt = 0) => {
      const { products: loadedProducts, settings: loadedSettings } = await api.getBaselineData();
      if (cancelled) return;

      if (loadedProducts.length > 0) setProducts(loadedProducts);
      if (loadedSettings) setSettings(loadedSettings);

      // A cold server or temporary network failure should not leave a first
      // visit permanently empty; retry while there are no products to display.
      if (loadedProducts.length === 0 && attempt < retryDelays.length) {
        retryTimer = setTimeout(() => loadBaseline(attempt + 1), retryDelays[attempt]);
      }
    };

    void loadBaseline();
    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, []);

  // Targeted fetchers
  const fetchBlogs = useCallback(async () => {
    try {
      const data = await api.getBlogs();
      if (data.length > 0) setBlogs(data);
    } catch (err) {
      console.warn('Unable to load articles:', err);
    }
  }, []);

  const fetchFaqs = useCallback(async () => {
    const data = await api.getFaqs();
    if (data.length > 0) setFaqs(data);
  }, []);

  const fetchCoupons = useCallback(async () => {
    const data = await api.getCoupons();
    if (data.length > 0) setCoupons(data);
  }, []);

  const fetchReviews = useCallback(async () => {
    try {
      const data = await api.getReviews();
      let localRevs: Review[] = [];
      try {
        const stored = localStorage.getItem('Bv_local_reviews');
        localRevs = stored ? JSON.parse(stored) : [];
      } catch {}

      const map = new Map<string, Review>();
      // Put server reviews first
      if (Array.isArray(data)) {
        data.forEach(r => {
          if (r && r.id) map.set(r.id, r);
        });
      }
      // Put local reviews on top (highest priority)
      localRevs.forEach(r => {
        if (r && r.id) map.set(r.id, r);
      });

      setReviews(Array.from(map.values()));
    } catch (e) {
      console.warn('Error fetching reviews:', e);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    const data = await api.getProducts();
    if (data.length > 0) setProducts(data);
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!authToken) return;
    const data = await api.getOrders(authToken);
    setOrders(data);
  }, [authToken]);

  // Initial order fetch on authentication state change
  useEffect(() => {
    if (!authToken) {
      setOrders([]);
      return;
    }

    fetchOrders();
  }, [authToken, fetchOrders]);

  // Review posting handler
  const handlePostReview = async (reviewData: { productId: string; rating: number; comment: string; userName?: string; userEmail?: string }) => {
    const product = products.find(p => p.id === reviewData.productId);
    const newReview: Review = {
      id: `rev-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      productId: reviewData.productId,
      productName: product ? product.name : 'Ayurvedic Remedy',
      userName: reviewData.userName || (currentUser ? currentUser.fullName : 'Verified Buyer'),
      userEmail: reviewData.userEmail || (currentUser ? currentUser.email : 'customer@Bvlife.com'),
      rating: reviewData.rating,
      comment: reviewData.comment,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      isApproved: true
    };

    await api.postReview(newReview, authToken || localStorage.getItem('Bv_auth_token'));
    setReviews(prev => [newReview, ...prev.filter(r => r.id !== newReview.id)]);

    // Save the successful server response locally for the delivered-order review UI.
    try {
      const stored = localStorage.getItem('Bv_local_reviews');
      const list: Review[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem('Bv_local_reviews', JSON.stringify([newReview, ...list.filter(r => r.id !== newReview.id)]));
      
      // Also mark this product as reviewed
      const storedReviewed = localStorage.getItem('Bv_reviewed_products');
      const revIds: string[] = storedReviewed ? JSON.parse(storedReviewed) : [];
      if (!revIds.includes(reviewData.productId)) {
        localStorage.setItem('Bv_reviewed_products', JSON.stringify([...revIds, reviewData.productId]));
      }
    } catch {}

  };

  // Address Handler
  const handleAddAddress = async (addr: Address) => {
    if (!currentUser) return;
    const updatedAddresses = [...(currentUser.addresses || []), addr];
    const updatedUser = { ...currentUser, addresses: updatedAddresses };
    setCurrentUser(updatedUser);

    if (authToken) {
      await api.updateAddresses(updatedAddresses, authToken);
    }
  };

  // Place Order Handler
  const handlePlaceOrder = async (
    orderData: Partial<Order>,
    cartItems: { product: Product; quantity: number }[],
    onSuccessClearCart: () => void
  ): Promise<Order | null> => {
    const activeEmail = orderData.userEmail || currentUser?.email || 'guest@Bvlife.com';
    const activeName = orderData.userName || currentUser?.fullName || 'Guest Customer';

    try {
      const orderPayload = {
        ...orderData,
        userEmail: activeEmail,
        userName: activeName
      };

      const currentToken = authToken || localStorage.getItem('Bv_auth_token') || activeEmail;
      const savedOrder = await api.placeOrder(orderPayload, currentToken);

      if (savedOrder) {
        try {
          const stored = localStorage.getItem('Bv_recent_orders');
          const existingIds: string[] = stored ? JSON.parse(stored) : [];
          if (!existingIds.includes(savedOrder.id)) {
            localStorage.setItem('Bv_recent_orders', JSON.stringify([savedOrder.id, ...existingIds]));
          }
          localStorage.setItem('Bv_last_completed_order', JSON.stringify(savedOrder));
          localStorage.setItem('Bv_last_placed_order', JSON.stringify(savedOrder));
        } catch (e) {}

        setOrders(prev => [savedOrder, ...prev.filter(o => o.id !== savedOrder.id)]);
        onSuccessClearCart();

        return savedOrder;
      }
    } catch (err) {
      console.error('Order API error:', err);
    }

    return null;
  };

  // Admin CRUDs
  const handleAdminUpdateOrderStatus = async (orderId: string, status: Order['status'], payStatus: Order['paymentStatus']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, paymentStatus: payStatus } : o));
    const token = authToken || localStorage.getItem('Bv_auth_token') || '';
    if (token) {
      const updated = await api.updateOrderStatus(orderId, status, payStatus, token);
      if (updated) {
        setOrders(prev => prev.map(o => o.id === orderId ? updated : o));
      }
    }
  };

  const handleAdminAddProduct = async (prod: Partial<Product>) => {
    const userProvidedSku = prod.sku?.trim();
    const newP = {
      ...prod,
      id: `prod-${Date.now()}`,
      rating: prod.rating || 5.0,
      bestSeller: prod.bestSeller || false,
      featured: prod.featured !== undefined ? prod.featured : true,
      sku: userProvidedSku || `GL-${Math.floor(1000 + Math.random() * 9000)}`
    } as Product;

    setProducts(prev => [newP, ...prev]);
    const token = authToken || localStorage.getItem('Bv_auth_token') || '';
    if (token) {
      await api.addProduct(newP, token);
    }
  };

  const handleAdminEditProduct = async (id: string, prod: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...prod } : p));
    const token = authToken || localStorage.getItem('Bv_auth_token') || '';
    if (token) {
      await api.updateProduct(id, prod, token);
    }
  };

  const handleAdminDeleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    const token = authToken || localStorage.getItem('Bv_auth_token') || '';
    if (token) {
      await api.deleteProduct(id, token);
    }
  };

  const handleAdminAddCoupon = async (cpn: Coupon) => {
    setCoupons(prev => [cpn, ...prev]);
    const token = authToken || localStorage.getItem('Bv_auth_token') || '';
    if (token) {
      await api.addCoupon(cpn, token);
    }
  };

  const handleUpdateSettings = async (newSettings: WebsiteSettings) => {
    setSettings(newSettings);
    const token = authToken || localStorage.getItem('Bv_auth_token') || '';
    if (token) {
      await api.updateSettings(newSettings, token);
    }
  };

  const activeSettings: WebsiteSettings = settings || {
    logoName: "Bv Life",
    logoUrl: "",
    contactEmail: "care@bvlife.in",
    contactPhone: "+91 98765 43210",
    address: "Kerala, India",
    freeShippingThreshold: 999,
    baseShippingCharge: 50,
    defaultTaxPercentage: 12
  };

  return {
    products,
    blogs,
    faqs,
    coupons,
    reviews,
    settings,
    activeSettings,
    orders,
    fetchBlogs,
    fetchFaqs,
    fetchCoupons,
    fetchReviews,
    fetchProducts,
    fetchOrders,
    handlePostReview,
    handleAddAddress,
    handlePlaceOrder,
    handleAdminUpdateOrderStatus,
    handleAdminAddProduct,
    handleAdminEditProduct,
    handleAdminDeleteProduct,
    handleAdminAddCoupon,
    handleUpdateSettings
  };
}
