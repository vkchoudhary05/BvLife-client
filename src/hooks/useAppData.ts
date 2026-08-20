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
      const stored = localStorage.getItem('grams_local_reviews');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  // Baseline data fetch
  useEffect(() => {
    api.getBaselineData().then(({ products, settings }) => {
      if (products.length > 0) setProducts(products);
      if (settings) setSettings(settings);
    });
    fetchReviews();
  }, []);

  // Targeted fetchers
  const fetchBlogs = useCallback(async () => {
    const data = await api.getBlogs();
    if (data.length > 0) setBlogs(data);
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
        const stored = localStorage.getItem('grams_local_reviews');
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
      userEmail: reviewData.userEmail || (currentUser ? currentUser.email : 'customer@gramslife.com'),
      rating: reviewData.rating,
      comment: reviewData.comment,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      isApproved: true
    };

    setReviews(prev => [newReview, ...prev.filter(r => r.id !== newReview.id)]);
    
    // Save to local storage for persistence across reloads
    try {
      const stored = localStorage.getItem('grams_local_reviews');
      const list: Review[] = stored ? JSON.parse(stored) : [];
      localStorage.setItem('grams_local_reviews', JSON.stringify([newReview, ...list.filter(r => r.id !== newReview.id)]));
      
      // Also mark this product as reviewed
      const storedReviewed = localStorage.getItem('grams_reviewed_products');
      const revIds: string[] = storedReviewed ? JSON.parse(storedReviewed) : [];
      if (!revIds.includes(reviewData.productId)) {
        localStorage.setItem('grams_reviewed_products', JSON.stringify([...revIds, reviewData.productId]));
      }
    } catch {}

    try {
      await api.postReview(newReview);
    } catch (err) {
      console.warn('Review synced locally (backend fallback):', err);
    }
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
    const activeEmail = orderData.userEmail || currentUser?.email || 'guest@gramslife.com';
    const activeName = orderData.userName || currentUser?.fullName || 'Guest Customer';

    const fallbackOrder: Order = {
      id: `GL-${Date.now().toString().slice(-6)}-${Math.floor(10 + Math.random() * 90)}`,
      userEmail: activeEmail.toLowerCase(),
      userName: activeName,
      shippingAddress: orderData.shippingAddress || {
        id: `addr-${Date.now()}`,
        fullName: activeName,
        addressLine1: 'Main Street',
        city: 'New Delhi',
        state: 'Delhi',
        zipCode: '110001',
        phone: currentUser?.phone || '+919876543210',
        isDefault: true
      },
      items: orderData.items && orderData.items.length > 0 ? orderData.items : cartItems.map(i => ({
        productId: i.product.id,
        productName: i.product.name,
        price: i.product.price,
        quantity: i.quantity,
        mainImage: i.product.mainImage
      })),
      subtotal: orderData.subtotal || 0,
      tax: orderData.tax || 0,
      shippingCharge: orderData.shippingCharge || 0,
      discount: orderData.discount || 0,
      finalTotal: orderData.finalTotal || 0,
      status: 'Pending',
      paymentMethod: orderData.paymentMethod || 'UPI',
      paymentStatus: orderData.paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
      orderDate: new Date().toISOString(),
      trackingNumber: `GLTRK${Math.floor(100000 + Math.random() * 900000)}`,
      trackingUpdates: [
        {
          status: 'Pending',
          date: new Date().toISOString(),
          comment: 'Your order has been received and is waiting for dispatch.'
        }
      ]
    };

    try {
      const orderPayload = {
        ...orderData,
        userEmail: activeEmail,
        userName: activeName
      };

      const currentToken = authToken || localStorage.getItem('grams_auth_token') || activeEmail;
      const savedOrder = await api.placeOrder(orderPayload, currentToken);

      if (savedOrder) {
        try {
          const stored = localStorage.getItem('grams_recent_orders');
          const existingIds: string[] = stored ? JSON.parse(stored) : [];
          if (!existingIds.includes(savedOrder.id)) {
            localStorage.setItem('grams_recent_orders', JSON.stringify([savedOrder.id, ...existingIds]));
          }
          localStorage.setItem('grams_last_completed_order', JSON.stringify(savedOrder));
          localStorage.setItem('grams_last_placed_order', JSON.stringify(savedOrder));
        } catch (e) {}

        setOrders(prev => [savedOrder, ...prev.filter(o => o.id !== savedOrder.id)]);
        onSuccessClearCart();

        return savedOrder;
      }
    } catch (err) {
      console.error('Order API error, using fallback:', err);
    }

    // Fallback save
    try {
      const stored = localStorage.getItem('grams_recent_orders');
      const existingIds: string[] = stored ? JSON.parse(stored) : [];
      if (!existingIds.includes(fallbackOrder.id)) {
        localStorage.setItem('grams_recent_orders', JSON.stringify([fallbackOrder.id, ...existingIds]));
      }
      localStorage.setItem('grams_last_completed_order', JSON.stringify(fallbackOrder));
      localStorage.setItem('grams_last_placed_order', JSON.stringify(fallbackOrder));
    } catch (e) {}

    setOrders(prev => [fallbackOrder, ...prev.filter(o => o.id !== fallbackOrder.id)]);
    onSuccessClearCart();
    return fallbackOrder;
  };

  // Admin CRUDs
  const handleAdminUpdateOrderStatus = async (orderId: string, status: Order['status'], payStatus: Order['paymentStatus']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, paymentStatus: payStatus } : o));
    if (authToken) {
      const updated = await api.updateOrderStatus(orderId, status, payStatus, authToken);
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
    if (authToken) {
      await api.addProduct(newP, authToken);
    }
  };

  const handleAdminEditProduct = async (id: string, prod: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...prod } : p));
    if (authToken) {
      await api.updateProduct(id, prod, authToken);
    }
  };

  const handleAdminDeleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    if (authToken) {
      await api.deleteProduct(id, authToken);
    }
  };

  const handleAdminAddCoupon = async (cpn: Coupon) => {
    setCoupons(prev => [cpn, ...prev]);
    if (authToken) {
      await api.addCoupon(cpn, authToken);
    }
  };

  const handleUpdateSettings = async (newSettings: WebsiteSettings) => {
    setSettings(newSettings);
    if (authToken) {
      await api.updateSettings(newSettings, authToken);
    }
  };

  const activeSettings: WebsiteSettings = settings || {
    logoName: "Grams Life",
    logoUrl: "",
    contactEmail: "care@gramslife.com",
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
