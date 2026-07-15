/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mail, User as UserIcon, Phone, Shield, Sparkles, CheckCircle2, Lock, ArrowRight, HelpCircle, Eye, EyeOff } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AIConsultantModal } from './components/AIConsultantModal';
import { QuickViewModal } from './components/QuickViewModal';
import { ProductCompare } from './components/ProductCompare';
import { AdminGatewayLogin } from './components/AdminGatewayLogin';

// Pages
import { CustomerHome } from './pages/CustomerHome';
import { Shop } from './pages/Shop';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { Dashboard } from './pages/Dashboard';
import { StaticPages } from './pages/StaticPages';

// Types
import { Product, Blog, FAQ, Coupon, WebsiteSettings, User, CartItem, Order, Address, Review } from './types';

// Bilingual translations
import { Language, t, translateProductAttr } from './lib/translations';
import { validateAndFormatIndianPhone } from './utils';

// Helper to parse current URL and return initial page + params
const getPageFromUrl = () => {
  if (typeof window === 'undefined') {
    return { page: 'home', params: null };
  }
  const path = window.location.pathname;
  const searchParams = new URLSearchParams(window.location.search);
  
  if (path === '/' || path === '') {
    return { page: 'home', params: null };
  }
  
  const cleanPath = path.substring(1); // remove leading slash
  
  if (cleanPath === 'shop') {
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    return { page: 'shop', params: { search, category } };
  }
  
  if (cleanPath === 'product') {
    const id = searchParams.get('id') || '';
    return { page: 'product', params: { id } };
  }
  
  if (cleanPath === 'admin' || cleanPath === 'admin-login') {
    return { page: 'admin', params: null };
  }
  
  // Check if it is a static page or blogs / faqs
  const staticPages = ['blogs', 'faqs', 'about', 'contact', 'terms', 'privacy', 'expert-panel', 'impact', 'shipping-policy'];
  if (staticPages.includes(cleanPath)) {
    return { page: 'static', params: { page: cleanPath } };
  }
  
  // Default match for other paths (cart, checkout, dashboard, login, etc.)
  const knownPages = ['cart', 'checkout', 'dashboard', 'login'];
  if (knownPages.includes(cleanPath)) {
    return { page: cleanPath, params: null };
  }
  
  return { page: 'home', params: null };
};

export default function App() {
  // Navigation states
  const [currentPage, setCurrentPage] = useState<string>(() => {
    return getPageFromUrl().page;
  });
  const [pageParams, setPageParams] = useState<any>(() => {
    return getPageFromUrl().params;
  });

  // Language configuration
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('gramslife_lang') as Language) || 'en';
    }
    return 'en';
  });

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('gramslife_lang', lang);
  };

  // Global app states loaded from backend API
  const [products, setProducts] = useState<Product[]>([]);
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  // Authenticated User
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('grams_auth_token'));

  // User Interactive states (Cart, Wishlist, Compare)
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('grams_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('grams_wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Floating modals states
  const [isConsultantOpen, setIsConsultantOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);

  // Auth states
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [useRealTwilio, setUseRealTwilio] = useState(false);
  const [formattedPhone, setFormattedPhone] = useState('');
  const [authRole, setAuthRole] = useState<'customer' | 'admin'>('customer');
  const [authLoading, setAuthLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sync state modifications to localStorage
  useEffect(() => {
    localStorage.setItem('grams_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('grams_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Load baseline app data on boot
  useEffect(() => {
    const fetchBaseline = async () => {
      try {
        const [pRes, bRes, fRes, cRes, sRes, rRes] = await Promise.all([
          fetch('/api/products').then(r => r.json()),
          fetch('/api/blogs').then(r => r.json()),
          fetch('/api/faqs').then(r => r.json()),
          fetch('/api/coupons').then(r => r.json()),
          fetch('/api/settings').then(r => r.json()),
          fetch('/api/reviews').then(r => r.json())
        ]);

        if (Array.isArray(pRes)) setProducts(pRes);
        if (Array.isArray(bRes)) setBlogs(bRes);
        if (Array.isArray(fRes)) setFaqs(fRes);
        if (Array.isArray(cRes)) setCoupons(cRes);
        if (sRes && sRes.defaultTaxPercentage !== undefined) setSettings(sRes);
        if (Array.isArray(rRes)) setReviews(rRes);

      } catch (err) {
        console.error("Error loading Grams Life baseline data: ", err);
      }
    };

    fetchBaseline();
  }, []);

  // Fetch current user details & orders if token present
  useEffect(() => {
    const fetchUserAndOrders = async () => {
      if (!authToken) {
        setCurrentUser(null);
        setOrders([]);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (res.ok) {
          const userData = await res.json();
          setCurrentUser(userData.user);

          // Fetch orders
          const ordersRes = await fetch('/api/orders', {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          if (ordersRes.ok) {
            const ordersData = await ordersRes.json();
            setOrders(ordersData);
          }
        } else {
          // Token expired or invalid
          localStorage.removeItem('grams_auth_token');
          setAuthToken(null);
          setCurrentUser(null);
          setOrders([]);
        }
      } catch (err) {
        console.error("Error loading user credentials: ", err);
      }
    };

    fetchUserAndOrders();
  }, [authToken]);

  // Handlers
  const handleNavigate = (page: string, params: any = null, pushHistory = true) => {
    setCurrentPage(page);
    setPageParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (pushHistory) {
      let path = '/';
      if (page === 'shop') {
        const searchParams = new URLSearchParams();
        if (params?.search) searchParams.set('search', params.search);
        if (params?.category) searchParams.set('category', params.category);
        const q = searchParams.toString();
        path = q ? `/shop?${q}` : '/shop';
      } else if (page === 'product') {
        path = `/product?id=${params?.id || ''}`;
      } else if (page === 'static') {
        path = `/${params?.page || 'faq'}`;
      } else if (page === 'admin') {
        path = '/admin';
      } else if (page !== 'home') {
        path = `/${page}`;
      }
      window.history.pushState({ page, params }, '', path);
    }
  };

  // Sync state modifications with browser History API (for back/forward navigation)
  useEffect(() => {
    // 1. Initialize the root page entry in history if it doesn't exist
    if (!window.history.state) {
      const initialRoute = getPageFromUrl();
      const currentPath = window.location.pathname + window.location.search;
      window.history.replaceState({ page: initialRoute.page, params: initialRoute.params }, '', currentPath);
    }

    // 2. Setup popstate handler
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.page) {
        handleNavigate(event.state.page, event.state.params, false);
      } else {
        // Fallback to initial route or home
        const initialRoute = getPageFromUrl();
        handleNavigate(initialRoute.page, initialRoute.params, false);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (isRegistering) {
      if (!otpStep) {
        // Step 1 of registration: Validation and OTP dispatch
        if (authPassword !== authConfirmPassword) {
          setLoginError('Passwords do not match. Please ensure both fields are identical.');
          return;
        }
        if (authPassword.length < 6) {
          setLoginError('Security requirement: Password must be at least 6 characters.');
          return;
        }

        // Clean & Validate phone number
        const cleanPhone = authPhone.replace(/\D/g, '');
        if (cleanPhone.length !== 10) {
          setLoginError('Mobile number must contain exactly 10 digits.');
          return;
        }

        setAuthLoading(true);
        try {
          const res = await fetch('/api/auth/otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: authPhone, email: authEmail })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            setGeneratedOtp(data.otp || '');
            setUseRealTwilio(data.useRealTwilio || false);
            setFormattedPhone(data.formattedPhone || authPhone);
            setOtpMessage(data.message);
            setOtpStep(true);
          } else {
            setLoginError(data.error || 'Could not dispatch security OTP. Please check mobile details.');
          }
        } catch (err) {
          console.error(err);
          setLoginError('Connection failure dispatching verification OTP.');
        } finally {
          setAuthLoading(false);
        }
      } else {
        // Step 2 of registration: Verify OTP and create user
        setAuthLoading(true);
        try {
          if (useRealTwilio) {
            // Real Twilio verification check
            const verifyRes = await fetch('/api/auth/verify-otp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: formattedPhone, code: authOtp })
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) {
              setLoginError(verifyData.error || 'Invalid or incorrect OTP verification code.');
              setAuthLoading(false);
              return;
            }
          } else {
            // Mock simulation comparison
            if (authOtp !== generatedOtp) {
              setLoginError('Invalid verification code. Please enter the correct 6-digit OTP code.');
              setAuthLoading(false);
              return;
            }
          }

          // Verification succeeded, finalize account creation
          const success = await handleRegister({ 
            name: authName, 
            email: authEmail,
            phone: formattedPhone || authPhone,
            role: authRole,
            password: authPassword
          });
          if (success) {
            setAuthEmail('');
            setAuthName('');
            setAuthPhone('');
            setAuthPassword('');
            setAuthConfirmPassword('');
            setAuthOtp('');
            setGeneratedOtp('');
            setOtpStep(false);
            setOtpMessage('');
            setAuthRole('customer');
            setUseRealTwilio(false);
            setFormattedPhone('');
            setIsRegistering(false);
            handleNavigate('dashboard');
          } else {
            setLoginError('Account creation failed. Please check registration parameters or try another email.');
          }
        } catch (err) {
          setLoginError('An unexpected server error occurred during account finalization.');
          console.error(err);
        } finally {
          setAuthLoading(false);
        }
      }
    } else {
      // Standard Client Password Login (Allows email or mobile)
      setAuthLoading(true);
      try {
        let loginId = authEmail.trim();
        const isMaybePhone = /^[0-9+\s()-]+$/.test(loginId);
        if (isMaybePhone) {
          const cleanPhone = loginId.replace(/\D/g, '');
          // If it looks like a phone number but is not 10 digits, show error early
          if (cleanPhone.length < 10 || cleanPhone.length > 12) {
            setLoginError('Mobile number must be a valid 10-digit number.');
            setAuthLoading(false);
            return;
          }
          const formatted = validateAndFormatIndianPhone(loginId);
          if (formatted) {
            loginId = formatted;
          }
        }

        const success = await handleLogin({ email: loginId, password: authPassword });
        if (success) {
          setAuthEmail('');
          setAuthPassword('');
          handleNavigate('dashboard');
        }
      } catch (err) {
        setLoginError('An unexpected error occurred during portal entry.');
        console.error(err);
      } finally {
        setAuthLoading(false);
      }
    }
  };

  const handleLogin = async (credentials: { email: string, password?: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: credentials.email, password: credentials.password || 'password123' })
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('grams_auth_token', data.token);
        setAuthToken(data.token);
        return true;
      } else {
        const data = await res.json();
        setLoginError(data.error || 'Invalid credentials or incorrect password.');
      }
    } catch (err) {
      console.error(err);
      setLoginError('Failed to establish session validation with temple servers.');
    }
    return false;
  };

  const handleRegister = async (data: { name: string, email: string, phone: string, role: string, password?: string }): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fullName: data.name, 
          email: data.email, 
          phone: data.phone, 
          role: data.role,
          password: data.password || 'password123' 
        })
      });

      if (res.ok) {
        const regData = await res.json();
        localStorage.setItem('grams_auth_token', regData.token);
        setAuthToken(regData.token);
        return true;
      }
    } catch (err) {
      console.error(err);
    }
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('grams_auth_token');
    setAuthToken(null);
    setCurrentUser(null);
    setOrders([]);
    handleNavigate('home');
  };

  const handleAddToCart = (product: Product, qty: number) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: Math.min(product.stock, item.quantity + qty) }
            : item
        );
      }
      return [...prev, { product, quantity: qty }];
    });
  };

  const handleUpdateCartQty = (productId: string, qty: number) => {
    setCart(prev => 
      prev.map(item => 
        item.product.id === productId ? { ...item, quantity: qty } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleToggleWishlist = (product: Product) => {
    setWishlist(prev => 
      prev.includes(product.id) 
        ? prev.filter(id => id !== product.id)
        : [...prev, product.id]
    );
  };

  const handleAddToCompare = (product: Product) => {
    setCompareList(prev => {
      const exists = prev.some(p => p.id === product.id);
      if (exists) {
        return prev.filter(p => p.id !== product.id);
      }
      if (prev.length >= 3) {
        alert("You can compare up to 3 Ayurvedic remedies side by side.");
        return prev;
      }
      setIsCompareOpen(true);
      return [...prev, product];
    });
  };

  const handleClearCompare = () => {
    setCompareList([]);
    setIsCompareOpen(false);
  };

  const handleRemoveFromCompare = (product: Product) => {
    setCompareList(prev => prev.filter(p => p.id !== product.id));
  };

  // Add review dynamically
  const handlePostReview = async (reviewData: { productId: string, rating: number, comment: string }) => {
    const product = products.find(p => p.id === reviewData.productId);
    const newReview: Review = {
      id: `rev-${Date.now()}`,
      productId: reviewData.productId,
      productName: product ? product.name : 'Ayurvedic Remedy',
      userName: currentUser ? currentUser.fullName : 'Verified Healer',
      userEmail: currentUser ? currentUser.email : 'anonymous@gramslife.com',
      rating: reviewData.rating,
      comment: reviewData.comment,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
      isApproved: true
    };

    setReviews(prev => [newReview, ...prev]);

    try {
      await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Post Address
  const handleAddAddress = async (addr: Address) => {
    if (!currentUser) return;
    const updatedAddresses = [...(currentUser.addresses || []), addr];
    const updatedUser = { ...currentUser, addresses: updatedAddresses };
    setCurrentUser(updatedUser);

    try {
      await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ addresses: updatedAddresses })
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Complete Place Order
  const handlePlaceOrder = async (orderData: Partial<Order>): Promise<Order | null> => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const completeOrder = await response.json();
        setOrders(prev => [completeOrder, ...prev]);
        setCart([]); // Reset Cart
        setAppliedCoupon(null);
        return completeOrder;
      }
    } catch (err) {
      console.error(err);
    }
    return null;
  };

  // ADMIN CRUDS
  const handleAdminUpdateOrderStatus = async (orderId: string, status: Order['status'], payStatus: Order['paymentStatus']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status, paymentStatus: payStatus } : o));

    try {
      await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ status, paymentStatus: payStatus })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminAddProduct = async (prod: Partial<Product>) => {
    const newP = {
      ...prod,
      id: `prod-${Date.now()}`,
      rating: 5.0,
      bestSeller: false,
      featured: true,
      sku: `GL-${Math.floor(1000 + Math.random() * 9000)}`
    } as Product;

    setProducts(prev => [newP, ...prev]);

    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(newP)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminEditProduct = async (id: string, prod: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...prod } : p));

    try {
      await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(prod)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminDeleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));

    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${authToken}`
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAdminAddCoupon = async (cpn: Coupon) => {
    setCoupons(prev => [cpn, ...prev]);

    try {
      await fetch('/api/coupons', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(cpn)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const activeSettings: WebsiteSettings = settings || {
    logoName: "Grams Life",
    contactEmail: "care@gramslife.com",
    contactPhone: "+91 98765 43210",
    address: "Kerala, India",
    freeShippingThreshold: 999,
    baseShippingCharge: 50,
    defaultTaxPercentage: 12
  };

  return (
    <div className="bg-brand-cream-50 min-h-screen text-brand-green-950 font-sans selection:bg-brand-gold-500/30 flex flex-col justify-between">
      
      {/* 1. Header Navigation Bar */}
      {currentPage !== 'admin' && (
        <Navbar 
          currentUser={currentUser}
          onNavigate={handleNavigate}
          cart={cart}
          wishlist={wishlist}
          onOpenConsultant={() => setIsConsultantOpen(true)}
          onLogout={handleLogout}
          onSearch={(query) => handleNavigate('shop', { search: query })}
          language={language}
          onLanguageChange={handleLanguageChange}
          searchQuery={currentPage === 'shop' ? (pageParams?.search || '') : ''}
        />
      )}

      {/* 2. Main Routing Layout Viewport */}
      <main className="flex-grow">
        
        {/* Customer Home */}
        {currentPage === 'home' && (
          <CustomerHome
            products={products}
            blogs={blogs}
            onNavigate={handleNavigate}
            onOpenConsultant={() => setIsConsultantOpen(true)}
            onAddToCart={handleAddToCart}
            onQuickView={(p) => setQuickViewProduct(p)}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onAddToCompare={handleAddToCompare}
            compareList={compareList}
            language={language}
          />
        )}

        {/* Shop Page */}
        {currentPage === 'shop' && (
          <Shop
            products={products}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            onQuickView={(p) => setQuickViewProduct(p)}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onAddToCompare={handleAddToCompare}
            compareList={compareList}
            searchQuery={pageParams?.search || ''}
            categoryFilter={pageParams?.category || ''}
            language={language}
          />
        )}

        {/* Product Details page */}
        {currentPage === 'product' && (
          <ProductDetail
            productId={pageParams?.id || ''}
            products={products}
            reviews={reviews}
            onNavigate={handleNavigate}
            onAddToCart={handleAddToCart}
            wishlist={wishlist}
            onToggleWishlist={handleToggleWishlist}
            onPostReview={handlePostReview}
            language={language}
          />
        )}

        {/* Shopping Cart Bag */}
        {currentPage === 'cart' && (
          <Cart
            cart={cart}
            onUpdateQty={handleUpdateCartQty}
            onRemoveItem={handleRemoveFromCart}
            onNavigate={handleNavigate}
            coupons={coupons}
            settings={activeSettings}
            onApplyCoupon={setAppliedCoupon}
            appliedCoupon={appliedCoupon}
            language={language}
          />
        )}

        {/* Secure Checkout */}
        {currentPage === 'checkout' && (
          <Checkout
            cart={cart}
            userAddresses={currentUser?.addresses || []}
            onAddAddress={handleAddAddress}
            onNavigate={handleNavigate}
            appliedCoupon={appliedCoupon}
            settings={activeSettings}
            onPlaceOrder={handlePlaceOrder}
            language={language}
          />
        )}

        {/* User Dashboard */}
        {currentPage === 'dashboard' && (
          <Dashboard
            user={currentUser}
            orders={orders}
            products={products}
            coupons={coupons}
            settings={activeSettings}
            onUpdateStatus={handleAdminUpdateOrderStatus}
            onAddProduct={handleAdminAddProduct}
            onEditProduct={handleAdminEditProduct}
            onDeleteProduct={handleAdminDeleteProduct}
            onAddCoupon={handleAdminAddCoupon}
            onAddAddress={handleAddAddress}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
          />
        )}

        {/* Secret Admin Panel Route */}
        {currentPage === 'admin' && (
          currentUser && currentUser.role === 'admin' ? (
            <Dashboard
              user={currentUser}
              orders={orders}
              products={products}
              coupons={coupons}
              settings={activeSettings}
              onUpdateStatus={handleAdminUpdateOrderStatus}
              onAddProduct={handleAdminAddProduct}
              onEditProduct={handleAdminEditProduct}
              onDeleteProduct={handleAdminDeleteProduct}
              onAddCoupon={handleAdminAddCoupon}
              onAddAddress={handleAddAddress}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          ) : (
            <AdminGatewayLogin 
              onNavigate={handleNavigate}
              onLoginSuccess={() => {}}
              handleLogin={handleLogin}
            />
          )
        )}

        {/* Static Policies, FAQS, Blogs Chronicles */}
        {currentPage === 'static' && (
          <StaticPages
            pageType={pageParams?.page || 'faq'}
            params={pageParams}
            blogs={blogs}
            faqs={faqs}
            onNavigate={handleNavigate}
            language={language}
          />
        )}

        {/* Login & Register Portal */}
        {currentPage === 'login' && (
          <div className="max-w-md mx-auto my-16 px-4 sm:px-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="bg-brand-cream-50 border border-brand-gold-300 rounded-[2.5rem] p-6 sm:p-10 shadow-xl flex flex-col space-y-8 relative overflow-hidden">
              
              {/* Subtle top decorative ambient gold line */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-gold-500 via-brand-cream-300 to-brand-gold-600" />

              {/* Header block with Logo and Title */}
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-green-800 text-brand-gold-400 font-serif text-2xl font-bold border border-brand-gold-500/30 shadow-md mx-auto">
                  G
                </div>
                <div className="space-y-1.5">
                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green-900 tracking-tight">
                    {isRegistering 
                      ? (otpStep ? "Verify Identity" : "Create Sanctuary Account") 
                      : "Welcome Back"}
                  </h2>
                  <p className="text-xs text-brand-green-800/70 max-w-xs mx-auto leading-relaxed">
                    {isRegistering 
                      ? (otpStep 
                          ? "Enter the simulated OTP code sent to your mobile device." 
                          : "Begin your digital healing journey and track order dispatch histories.")
                      : "Sign in to access your personal wellness profile and order logs."}
                  </p>
                </div>
              </div>

              {/* Interactive Premium Tab Switcher (Only visible when not on OTP verification step) */}
              {!otpStep && (
                <div className="grid grid-cols-2 p-1 bg-brand-cream-100/90 rounded-2xl border border-brand-green-200/40 shadow-inner">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setLoginError('');
                      setOtpStep(false);
                    }}
                    className={`py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                      !isRegistering
                        ? "bg-brand-green-800 text-brand-cream-50 shadow-sm border border-brand-gold-500/20 font-serif"
                        : "text-brand-green-700/60 hover:text-brand-green-900"
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setLoginError('');
                      setOtpStep(false);
                    }}
                    className={`py-2.5 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                      isRegistering
                        ? "bg-brand-green-800 text-brand-cream-50 shadow-sm border border-brand-gold-500/20 font-serif"
                        : "text-brand-green-700/60 hover:text-brand-green-900"
                    }`}
                  >
                    Register
                  </button>
                </div>
              )}

              {/* Error Banner */}
              {loginError && (
                <div className="p-3.5 bg-red-50 border border-red-150 text-red-700 text-xs rounded-xl text-center font-semibold animate-shake">
                  {loginError}
                </div>
              )}

              {/* SMS Gateway Alert Banners (Differentiates between Real Twilio and Sandbox Simulation) */}
              {otpStep && otpMessage && (
                useRealTwilio ? (
                  <div className="p-4 bg-brand-green-500/10 border border-brand-green-500/30 rounded-2xl space-y-2 shadow-sm animate-in fade-in duration-300">
                    <div className="flex items-center gap-1.5 text-brand-green-950 font-serif">
                      <Shield className="w-4 h-4 shrink-0 text-brand-green-700 animate-pulse" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">Live OTP Verification</span>
                    </div>
                    <p className="text-xs text-brand-green-900 leading-relaxed font-semibold">
                      A live 6-digit OTP passcode has been sent to your mobile phone <span className="font-mono text-brand-gold-800 font-bold">{formattedPhone}</span> via SMS. Please check your messages and enter the code below.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-brand-gold-300/10 border border-brand-gold-400/30 rounded-2xl space-y-2 animate-pulse shadow-sm">
                    <div className="flex items-center gap-1.5 text-brand-green-900">
                      <Shield className="w-4 h-4 shrink-0 text-brand-gold-600" />
                      <span className="text-[10px] font-extrabold uppercase tracking-wider">SMS Sandbox Verification</span>
                    </div>
                    <p className="text-xs text-brand-green-800 leading-relaxed font-medium">
                      {otpMessage}
                    </p>
                    <div className="pt-1 flex items-center gap-2 text-xs text-brand-green-900 font-mono">
                      <span className="font-sans text-brand-green-600">OTP Passcode:</span>
                      <span className="px-2.5 py-0.5 rounded bg-brand-gold-400/30 text-brand-green-950 font-bold tracking-widest border border-brand-gold-400/20">{generatedOtp}</span>
                    </div>
                  </div>
                )
              )}

              {/* Interactive Premium Autofill Panel */}
              <div className="bg-brand-cream-100 border border-brand-gold-300/40 p-4 rounded-2xl space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-gold-600 animate-pulse" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green-800/80">Sandbox Quick Profiles (Autofill)</span>
                  </div>
                  <span className="text-[9px] text-brand-gold-700 font-extrabold bg-brand-gold-300/20 border border-brand-gold-400/30 px-2 py-0.5 rounded-full">One-Tap</span>
                </div>
                
                {isRegistering ? (
                  <div className="grid grid-cols-1 gap-2">
                    <button
                       type="button"
                       onClick={() => {
                         setAuthName('Vipin Choudhary');
                         setAuthPhone('9425011088');
                         setAuthEmail('vkchoudhary050607@gmail.com');
                         setAuthPassword('password123');
                         setAuthConfirmPassword('password123');
                         setOtpStep(false);
                         setLoginError('');
                       }}
                       className="p-3 text-left border border-brand-gold-300/30 hover:border-brand-green-800 hover:bg-white rounded-xl bg-white/70 transition-all duration-200 cursor-pointer group shadow-sm flex items-center gap-3"
                    >
                      <span className="p-2 rounded-lg bg-brand-green-50 text-brand-green-800 group-hover:bg-brand-gold-500/10 group-hover:text-brand-gold-700 transition-colors">
                        <UserIcon className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-brand-green-900 group-hover:text-brand-gold-700 transition-colors">Vipin Choudhary</span>
                        <span className="block text-[10px] text-brand-green-700/70 font-mono truncate">vkchoudhary050607@gmail.com</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthName('Demo Client');
                        setAuthPhone('9876543210');
                        setAuthEmail('customer@example.com');
                        setAuthPassword('password123');
                        setAuthConfirmPassword('password123');
                        setOtpStep(false);
                        setLoginError('');
                      }}
                      className="p-3 text-left border border-brand-gold-300/30 hover:border-brand-green-800 hover:bg-white rounded-xl bg-white/70 transition-all duration-200 cursor-pointer group shadow-sm flex items-center gap-3"
                    >
                      <span className="p-2 rounded-lg bg-brand-green-50 text-brand-green-800 group-hover:bg-brand-gold-500/10 group-hover:text-brand-gold-700 transition-colors">
                        <UserIcon className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-brand-green-900 group-hover:text-brand-gold-700 transition-colors">Demo Client</span>
                        <span className="block text-[10px] text-brand-green-700/70 font-mono truncate">customer@example.com</span>
                      </div>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthEmail('customer@example.com');
                        setAuthPassword('password123');
                        setLoginError('');
                      }}
                      className="p-3 text-left border border-brand-gold-300/30 hover:border-brand-green-800 hover:bg-white rounded-xl bg-white/70 transition-all duration-200 cursor-pointer group shadow-sm flex items-center gap-3"
                    >
                      <span className="p-2 rounded-lg bg-brand-green-50 text-brand-green-800 group-hover:bg-brand-gold-500/10 group-hover:text-brand-gold-700 transition-colors">
                        <UserIcon className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-brand-green-900 group-hover:text-brand-gold-700 transition-colors">Customer Profile</span>
                        <span className="block text-[10px] text-brand-green-700/70 font-mono truncate">customer@example.com</span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setAuthEmail('vkchoudhary050607@gmail.com');
                        setAuthPassword('password123');
                        setLoginError('');
                      }}
                      className="p-3 text-left border border-brand-gold-300/30 hover:border-brand-green-800 hover:bg-white rounded-xl bg-white/70 transition-all duration-200 cursor-pointer group shadow-sm flex items-center gap-3"
                    >
                      <span className="p-2 rounded-lg bg-brand-green-50 text-brand-green-800 group-hover:bg-brand-gold-500/10 group-hover:text-brand-gold-700 transition-colors">
                        <UserIcon className="w-4 h-4" />
                      </span>
                      <div className="min-w-0">
                        <span className="block text-xs font-bold text-brand-green-900 group-hover:text-brand-gold-700 transition-colors">Vipin Choudhary</span>
                        <span className="block text-[10px] text-brand-green-700/70 font-mono truncate">vkchoudhary050607@gmail.com</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Form Block */}
              <form onSubmit={handleAuthSubmit} className="space-y-5">
                
                {isRegistering ? (
                  otpStep ? (
                    /* STEP 2: OTP VERIFICATION UI */
                    <div className="space-y-5 animate-in slide-in-from-bottom duration-300">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800/80 flex items-center gap-1.5 font-serif">
                          <Lock className="w-3.5 h-3.5 text-brand-gold-600" />
                          <span>6-Digit Verification Code</span>
                        </label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="Enter 6-digit OTP code"
                          value={authOtp}
                          onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ''))}
                          className="w-full text-center px-4 py-3.5 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-lg tracking-widest font-bold font-mono text-brand-green-950 placeholder-brand-green-200 transition-all shadow-sm"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setOtpStep(false);
                            setLoginError('');
                            setAuthOtp('');
                          }}
                          className="w-1/3 py-3.5 bg-brand-cream-200 hover:bg-brand-cream-300 text-brand-green-900 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer text-center border border-brand-green-200/55"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={authLoading || authOtp.length !== 6}
                          className="w-2/3 py-3.5 bg-brand-green-800 hover:bg-brand-green-900 disabled:bg-brand-green-800/45 text-brand-cream-50 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-brand-green-900/10 flex items-center justify-center gap-1.5 cursor-pointer border border-brand-gold-500/20"
                        >
                          <span>{authLoading ? "Verifying..." : "Verify & Sign Up"}</span>
                          <ArrowRight className="w-4 h-4 text-brand-gold-400" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* STEP 1: FILL REGISTER DETAILS */
                    <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
                      
                      {/* Name field */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800/80 flex items-center gap-1.5 font-serif">
                          <UserIcon className="w-3.5 h-3.5 text-brand-gold-600" />
                          <span>Full Name</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g., Vipin Choudhary"
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-green-900 transition-all placeholder-brand-green-300 shadow-sm"
                        />
                      </div>

                      {/* Phone field */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800/80 flex items-center gap-1.5 font-serif">
                          <Phone className="w-3.5 h-3.5 text-brand-gold-600" />
                          <span>Mobile Phone Number</span>
                        </label>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="e.g., 9425011088 (10 digits)"
                          value={authPhone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setAuthPhone(val);
                          }}
                          className="w-full px-4 py-3 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-green-900 transition-all placeholder-brand-green-300 shadow-sm"
                        />
                        <div className="flex justify-between items-center text-[10px] text-brand-green-600/70 font-mono mt-1">
                          <span>* +91 prefix will be added automatically</span>
                          <span>{authPhone.length}/10 digits</span>
                        </div>
                      </div>

                      {/* Email Address */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800/80 flex items-center gap-1.5 font-serif">
                          <Mail className="w-3.5 h-3.5 text-brand-gold-600" />
                          <span>Email Address</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="e.g., vkchoudhary050607@gmail.com"
                          value={authEmail}
                          onChange={(e) => setAuthEmail(e.target.value)}
                          className="w-full px-4 py-3 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-green-900 transition-all placeholder-brand-green-300 shadow-sm"
                        />
                      </div>

                      {/* Password and Confirm Password fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Password */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800/80 flex items-center gap-1.5 font-serif">
                            <Lock className="w-3.5 h-3.5 text-brand-gold-600" />
                            <span>Password</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              minLength={6}
                              placeholder="6+ characters"
                              value={authPassword}
                              onChange={(e) => setAuthPassword(e.target.value)}
                              className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-green-900 transition-all placeholder-brand-green-300 shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-green-700/60 hover:text-brand-green-900 transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800/80 flex items-center gap-1.5 font-serif">
                            <Lock className="w-3.5 h-3.5 text-brand-gold-600" />
                            <span>Confirm</span>
                          </label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              required
                              placeholder="Retype password"
                              value={authConfirmPassword}
                              onChange={(e) => setAuthConfirmPassword(e.target.value)}
                              className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-green-900 transition-all placeholder-brand-green-300 shadow-sm"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-green-700/60 hover:text-brand-green-900 transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Submit Details */}
                      <button
                        type="submit"
                        disabled={authLoading}
                        className="w-full py-4 bg-brand-green-800 hover:bg-brand-green-900 disabled:bg-brand-green-800/45 text-brand-cream-50 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-brand-green-900/10 flex items-center justify-center gap-1.5 cursor-pointer mt-4 border border-brand-gold-500/25 font-serif"
                      >
                        <span>{authLoading ? "Requesting OTP..." : "Request Verification"}</span>
                        <ArrowRight className="w-4 h-4 text-brand-gold-400" />
                      </button>
                    </div>
                  )
                ) : (
                  /* PASSWORD LOGIN FIELDS */
                  <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
                    {/* Email address or mobile phone field */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800/80 flex items-center gap-1.5 font-serif">
                        <Mail className="w-3.5 h-3.5 text-brand-gold-600" />
                        <span>Email Address or Mobile Number</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., customer@example.com or 9425011088"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-green-900 transition-all placeholder-brand-green-300 shadow-sm"
                      />
                    </div>

                    {/* Password field */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center font-serif">
                        <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800/80 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-brand-gold-600" />
                          <span>Password</span>
                        </label>
                        <span className="text-[10px] text-brand-gold-700 hover:underline cursor-pointer font-bold">Forgot Password?</span>
                      </div>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          placeholder="Enter your secure password"
                          value={authPassword}
                          onChange={(e) => setAuthPassword(e.target.value)}
                          className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-green-900 transition-all placeholder-brand-green-300 shadow-sm"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-green-700/60 hover:text-brand-green-900 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="w-full py-4 bg-brand-green-800 hover:bg-brand-green-900 disabled:bg-brand-green-800/45 text-brand-cream-50 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-brand-green-900/10 flex items-center justify-center gap-1.5 cursor-pointer mt-4 border border-brand-gold-500/25 font-serif"
                    >
                      <span>{authLoading ? "Signing In..." : "Sign In"}</span>
                      <ArrowRight className="w-4 h-4 text-brand-gold-400" />
                    </button>
                  </div>
                )}

              </form>

            </div>
          </div>
        )}



      </main>

      {/* 3. Footer */}
      {currentPage !== 'admin' && (
        <Footer 
          onNavigate={handleNavigate}
          onOpenConsultant={() => setIsConsultantOpen(true)}
          language={language}
        />
      )}

      {/* 4. FLOATING COMPARISON DRAWER */}
      {currentPage !== 'admin' && (
        <ProductCompare 
          compareList={compareList}
          onRemoveFromCompare={handleRemoveFromCompare}
          onClearCompare={handleClearCompare}
          onAddToCart={handleAddToCart}
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
        />
      )}

      {/* 5. FLOATING QUICK VIEW POPUP */}
      {currentPage !== 'admin' && quickViewProduct && (
        <QuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleAddToCart}
          onNavigate={handleNavigate}
        />
      )}

      {/* 6. FLOATING VEDIC AI CONSULTANT MODAL */}
      {currentPage !== 'admin' && isConsultantOpen && (
        <AIConsultantModal
          onClose={() => setIsConsultantOpen(false)}
          products={products}
          onAddToCart={handleAddToCart}
          onNavigate={handleNavigate}
          language={language}
          currentUser={currentUser}
          authToken={authToken}
        />
      )}

    </div>
  );
}
