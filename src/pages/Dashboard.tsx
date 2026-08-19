/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  History, MapPin, User, LayoutDashboard, Leaf, ShoppingBag, 
  Tag, Plus, Trash2, Edit2, ShieldAlert, Sparkles, Check, CheckCircle2, Shield, Activity,
  Printer, FileText, X, Download, Settings, Lock, Mail, Phone, ArrowRight, Eye, EyeOff, RotateCw,
  Search, Clock, Truck, AlertCircle, RefreshCw, Filter, ArrowUpDown, Layers, Radio, Copy,
  ExternalLink, SlidersHorizontal, BarChart3, TrendingUp, DollarSign, PackageCheck, AlertTriangle, CreditCard,
  Building2
} from 'lucide-react';
import { User as UserType, Order, Address, Product, Coupon, WebsiteSettings } from '../types';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';
import { SecureOtpWidget } from '../components/secureOtpWidget';
import { sendMSG91Otp, formatMSG91Identifier } from '../services/msg91OtpService';
import { Pagination } from '../components/Pagination';

interface DashboardProps {
  user: UserType | null;
  orders: Order[];
  products: Product[];
  coupons: Coupon[];
  settings: WebsiteSettings;
  onUpdateStatus: (orderId: string, status: Order['status'], payStatus: Order['paymentStatus']) => void;
  onAddProduct: (prod: Partial<Product>) => void;
  onEditProduct: (id: string, prod: Partial<Product>) => void;
  onDeleteProduct: (id: string) => void;
  onAddCoupon: (cpn: Coupon) => void;
  onAddAddress: (addr: Address) => void;
  onNavigate: (page: string, params?: any) => void;
  onLogout?: () => void;
  isAdminPanel?: boolean;
  onUpdateSettings?: (settings: WebsiteSettings) => void;
  onLoginSuccess?: (token: string) => void;
  onFetchCoupons?: () => void;
  onRefreshOrders?: () => void;
  onRefreshProducts?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  orders,
  products,
  coupons,
  settings,
  onUpdateStatus,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  onAddCoupon,
  onAddAddress,
  onNavigate,
  onLogout,
  isAdminPanel = false,
  onUpdateSettings,
  onLoginSuccess,
  onFetchCoupons,
  onRefreshOrders,
  onRefreshProducts
}) => {
  const isAdmin = (user?.role === 'admin' && isAdminPanel) || false;
  const [activeTab, setActiveTab] = useState<string>(isAdmin ? 'admin-stats' : 'account');
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [shippingLabelOrder, setShippingLabelOrder] = useState<Order | null>(null);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Payments Ledger state
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editTxnRef, setEditTxnRef] = useState('');
  const [editPayStatus, setEditPayStatus] = useState<'Paid' | 'Pending' | 'Failed'>('Pending');

  // Interactive Client-Side Auth States
  const [authTab, setAuthTab] = useState<'signin' | 'register'>('signin');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authAccountExists, setAuthAccountExists] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authSuccessMsg, setAuthSuccessMsg] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccessMsg('');
    setAuthLoading(true);

    try {
      if (authTab === 'signin') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail.trim(), password: authPassword || 'password123' })
        });
        const data = await res.json();
        if (res.ok && data.token) {
          setAuthSuccessMsg('Welcome back! Loading your wellbeing panel...');
          const isUserAdmin = data.user?.role === 'admin' || ['vkchoudhary050607@gmail.com', 'admin@gramslife.com', 'care@gramslife.com'].includes((data.user?.email || authEmail).toLowerCase());
          sessionStorage.setItem('grams_auth_token', data.token);
          if (!isUserAdmin) {
            localStorage.setItem('grams_auth_token', data.token);
          }
          setTimeout(() => {
            if (onLoginSuccess) {
              onLoginSuccess(data.token);
            } else {
              window.location.reload();
            }
          }, 1000);
        } else {
          setAuthError(data.error || 'Invalid credentials or incorrect password.');
        }
      } else {
        if (!authName || !authEmail || !authPhone) {
          setAuthError('Please fill in all requested fields.');
          setAuthLoading(false);
          return;
        }
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            fullName: authName, 
            email: authEmail.trim(), 
            phone: authPhone, 
            role: 'user', 
            password: authPassword || 'password123' 
          })
        });
        const data = await res.json();
        if (res.ok && data.token) {
          setAuthSuccessMsg('Account created! Preparing your dashboard...');
          setTimeout(() => {
            if (onLoginSuccess) {
              onLoginSuccess(data.token);
            } else {
              localStorage.setItem('grams_auth_token', data.token);
              window.location.reload();
            }
          }, 1000);
        } else {
          setAuthError(data.error || 'Registration failed. This email or number may already be registered.');
          if (data.accountExists) {
            setAuthAccountExists(true);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setAuthError('Temple servers are currently silent. Please check your network connection.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Live Sync & Auto Refresh states
  const [isLiveSyncActive, setIsLiveSyncActive] = useState(true);
  const [isRefreshingData, setIsRefreshingData] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );

  const fetchPayments = () => {
    if (isAdmin) {
      setLoadingPayments(true);
      fetch('/api/payments')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setPayments(data);
          }
          setLoadingPayments(false);
        })
        .catch(err => {
          console.error("Error loading payments: ", err);
          setLoadingPayments(false);
        });
    }
  };

  const onFetchCouponsRef = useRef(onFetchCoupons);
  const onRefreshOrdersRef = useRef(onRefreshOrders);
  const onRefreshProductsRef = useRef(onRefreshProducts);

  useEffect(() => {
    onFetchCouponsRef.current = onFetchCoupons;
    onRefreshOrdersRef.current = onRefreshOrders;
    onRefreshProductsRef.current = onRefreshProducts;
  });

  // Dedicated Live Refresh trigger with tactile loading animation
  const handleTriggerLiveRefresh = async () => {
    setIsRefreshingData(true);
    try {
      if (onRefreshOrders) await onRefreshOrders();
      if (onRefreshProducts) await onRefreshProducts();
      if (onFetchCoupons) await onFetchCoupons();
      fetchPayments();
      if (activeTab === 'admin-logs') {
        fetch('/api/logs')
          .then(r => r.json())
          .then(d => { if (Array.isArray(d)) setLogs(d); })
          .catch(() => {});
      }
      setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.error('Error refreshing live data: ', err);
    } finally {
      setTimeout(() => setIsRefreshingData(false), 500);
    }
  };

  // Live Auto-Sync interval (every 30s) when active
  useEffect(() => {
    if (!isAdmin || !isLiveSyncActive) return;

    const syncInterval = setInterval(() => {
      onRefreshOrdersRef.current?.();
      fetchPayments();
      if (activeTab === 'admin-catalog') onRefreshProductsRef.current?.();
      if (activeTab === 'admin-coupons') onFetchCouponsRef.current?.();
      setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 30000);

    return () => clearInterval(syncInterval);
  }, [isAdmin, isLiveSyncActive, activeTab]);

  useEffect(() => {
    if (!isAdmin) return;

    if (activeTab === 'admin-payments' || activeTab === 'admin-stats') {
      fetchPayments();
    } else if (activeTab === 'admin-coupons') {
      onFetchCouponsRef.current?.();
    } else if (activeTab === 'admin-orders') {
      onRefreshOrdersRef.current?.();
    } else if (activeTab === 'admin-catalog') {
      onRefreshProductsRef.current?.();
    }
  }, [activeTab, isAdmin]);

  const handleUpdatePaymentSubmit = async (e: React.FormEvent, paymentId: string) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editPayStatus,
          transactionReference: editTxnRef
        })
      });
      if (res.ok) {
        setEditingPaymentId(null);
        fetchPayments();
        if (typeof window !== 'undefined') {
          // Soft-reload to sync with parent's orders list state
          window.location.reload();
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Logs state
  const [logs, setLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (activeTab === 'admin-logs' && isAdmin) {
      setLoadingLogs(true);
      fetch('/api/logs')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setLogs(data);
          } else {
            setLogs([]);
          }
          setLoadingLogs(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingLogs(false);
        });
    }
  }, [activeTab]);

  // Address sub-tab state
  const [showAddAddr, setShowAddAddr] = useState(false);
  const [addrName, setAddrName] = useState('');
  const [addrLine1, setAddrLine1] = useState('');
  const [addrLine2, setAddrLine2] = useState('');
  const [addrCity, setAddrCity] = useState('');
  const [addrState, setAddrState] = useState('');
  const [addrZip, setAddrZip] = useState('');
  const [addrPhone, setAddrPhone] = useState('');

  // Admin CRUD Add Product state
  const [showAddProd, setShowAddProd] = useState(false);
  const [editProdId, setEditProdId] = useState<string | null>(null);
  
  // Product form states
  const [prodName, setProdName] = useState('');
  const [prodSku, setProdSku] = useState('');
  const [prodPrice, setProdPrice] = useState(500);
  const [prodOrigPrice, setProdOrigPrice] = useState(600);
  const [prodStock, setProdStock] = useState(20);
  const [prodCategory, setProdCategory] = useState('Immunity');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImg, setProdImg] = useState('');
  const [prodImg2, setProdImg2] = useState('');
  const [prodImg3, setProdImg3] = useState('');
  const [prodImg4, setProdImg4] = useState('');
  const [prodBenefits, setProdBenefits] = useState('');
  const [prodDosage, setProdDosage] = useState('');
  const [prodBrand, setProdBrand] = useState('Grams Life');
  const [prodSubcategory, setProdSubcategory] = useState('');
  const [prodUsageInstructions, setProdUsageInstructions] = useState('As directed');
  const [prodFeatured, setProdFeatured] = useState(false);
  const [prodBestSeller, setProdBestSeller] = useState(false);
  const [prodLowStockAlertLimit, setProdLowStockAlertLimit] = useState(5);
  const [prodIngredients, setProdIngredients] = useState<{name: string, description: string}[]>([]);
  const [prodFaqs, setProdFaqs] = useState<{question: string, answer: string}[]>([]);

  // Temporary inline input states for ingredients & FAQs
  const [ingName, setIngName] = useState('');
  const [ingDesc, setIngDesc] = useState('');
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');

  const handleAddIngredient = () => {
    if (!ingName || !ingDesc) return;
    setProdIngredients(prev => [...prev, { name: ingName, description: ingDesc }]);
    setIngName('');
    setIngDesc('');
  };

  const handleRemoveIngredient = (index: number) => {
    setProdIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddFaq = () => {
    if (!faqQ || !faqA) return;
    setProdFaqs(prev => [...prev, { question: faqQ, answer: faqA }]);
    setFaqQ('');
    setFaqA('');
  };

  const handleRemoveFaq = (index: number) => {
    setProdFaqs(prev => prev.filter((_, i) => i !== index));
  };

  // Admin coupon add state
  const [showAddCpn, setShowAddCpn] = useState(false);
  const [cpnCode, setCpnCode] = useState('');
  const [cpnVal, setCpnVal] = useState(15);
  const [cpnMin, setCpnMin] = useState(500);

  // 1. Admin Orders filter, search, sort, and pagination states
  const [adminOrderFilter, setAdminOrderFilter] = useState<'all' | 'pending' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [adminOrderSearch, setAdminOrderSearch] = useState('');
  const [adminOrderSort, setAdminOrderSort] = useState<'newest' | 'oldest' | 'amount-high' | 'amount-low'>('newest');
  const [adminOrderPage, setAdminOrderPage] = useState(1);
  const [adminOrderPageSize, setAdminOrderPageSize] = useState(10);

  // 2. Admin Catalog search, category, stock filter, sort, and pagination states
  const [adminCatalogSearch, setAdminCatalogSearch] = useState('');
  const [adminCatalogCategory, setAdminCatalogCategory] = useState('');
  const [adminCatalogStockFilter, setAdminCatalogStockFilter] = useState<'all' | 'in-stock' | 'low-stock' | 'out-of-stock'>('all');
  const [adminCatalogSort, setAdminCatalogSort] = useState<'name' | 'price-low' | 'price-high' | 'stock-low' | 'stock-high'>('name');
  const [adminCatalogPage, setAdminCatalogPage] = useState(1);
  const [adminCatalogPageSize, setAdminCatalogPageSize] = useState(8);

  // 3. Admin Payments search, status, method, and pagination states
  const [adminPaymentSearch, setAdminPaymentSearch] = useState('');
  const [adminPaymentFilter, setAdminPaymentFilter] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');
  const [adminPaymentMethod, setAdminPaymentMethod] = useState<string>('all');
  const [adminPaymentPage, setAdminPaymentPage] = useState(1);
  const [adminPaymentPageSize, setAdminPaymentPageSize] = useState(10);

  // 4. Admin Coupons search, filter, and pagination states
  const [adminCouponSearch, setAdminCouponSearch] = useState('');
  const [adminCouponStatus, setAdminCouponStatus] = useState<'all' | 'active' | 'archived'>('all');
  const [adminCouponPage, setAdminCouponPage] = useState(1);
  const [adminCouponPageSize, setAdminCouponPageSize] = useState(10);

  // 5. Admin Security & Activity Logs search, filter, and pagination states
  const [adminLogSearch, setAdminLogSearch] = useState('');
  const [adminLogActionFilter, setAdminLogActionFilter] = useState('');
  const [adminLogPage, setAdminLogPage] = useState(1);
  const [adminLogPageSize, setAdminLogPageSize] = useState(15);

  // 6. Customer Orders filter, search, and pagination states
  const [customerOrderFilter, setCustomerOrderFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [customerOrderSearch, setCustomerOrderSearch] = useState('');
  const [customerOrderPage, setCustomerOrderPage] = useState(1);
  const [customerOrderPageSize, setCustomerOrderPageSize] = useState(5);

  // Scroll container refs for contained scrolling without moving whole page
  const adminOrdersScrollRef = useRef<HTMLDivElement>(null);
  const adminCatalogScrollRef = useRef<HTMLDivElement>(null);
  const adminPaymentsScrollRef = useRef<HTMLDivElement>(null);
  const adminCouponsScrollRef = useRef<HTMLDivElement>(null);
  const adminLogsScrollRef = useRef<HTMLDivElement>(null);
  const customerOrdersScrollRef = useRef<HTMLDivElement>(null);

  // Profile Security & Multi-channel verification states
  const [showSecurityVerify, setShowSecurityVerify] = useState(false);
  const [verifyTargetIdentifier, setVerifyTargetIdentifier] = useState('');
  const [verifyPurpose, setVerifyPurpose] = useState<'MobileChange' | 'EmailChange' | 'Login'>('MobileChange');
  const [verifySuccessNotice, setVerifySuccessNotice] = useState('');

  // Filter orders for non-admin
  const userOrders = useMemo(() => {
    if (isAdmin) return orders;
    
    let recentOrderIds: string[] = [];
    try {
      const stored = localStorage.getItem('grams_recent_orders');
      if (stored) recentOrderIds = JSON.parse(stored);
    } catch (e) {}

    let lastOrder: Order | null = null;
    try {
      const lastStored = localStorage.getItem('grams_last_placed_order');
      if (lastStored) lastOrder = JSON.parse(lastStored);
    } catch (e) {}

    const uEmail = user?.email ? user.email.toLowerCase().trim() : '';
    const uPhone = user?.phone ? user.phone.replace(/\D/g, '') : '';
    const uName = user?.fullName ? user.fullName.toLowerCase().trim() : '';

    const userAddrPhones = (user?.addresses || [])
      .map(a => a.phone ? a.phone.replace(/\D/g, '') : '')
      .filter(p => p.length >= 7);

    const filtered = orders.filter(o => {
      if (!o || typeof o !== 'object' || !('id' in o)) return false;
      const oEmail = o.userEmail ? o.userEmail.toLowerCase().trim() : '';
      const oPhone = o.shippingAddress?.phone ? o.shippingAddress.phone.replace(/\D/g, '') : '';
      const oName = o.userName ? o.userName.toLowerCase().trim() : (o.shippingAddress?.fullName ? o.shippingAddress.fullName.toLowerCase().trim() : '');

      const matchEmail = !!(uEmail && uEmail !== 'guest@gramslife.com' && (oEmail === uEmail || oEmail.includes(uEmail) || uEmail.includes(oEmail)));
      const matchPhone = !!(uPhone && uPhone.length >= 7 && oPhone.endsWith(uPhone.slice(-10)));
      const matchAddrPhone = userAddrPhones.some(p => p.length >= 7 && oPhone.endsWith(p.slice(-10)));
      const matchNameAndPhone = !!(uName && uName === oName && (matchPhone || matchAddrPhone || uPhone));
      const matchRecent = recentOrderIds.includes(o.id) || (lastOrder && lastOrder.id === o.id);

      return matchEmail || matchPhone || matchAddrPhone || matchNameAndPhone || matchRecent;
    });

    if (filtered.length > 0) return filtered;
    if (orders && orders.length > 0) return orders;
    return [];
  }, [orders, user, isAdmin]);

  // Calculations for admin stats dashboard (MySQL-Backed)
  const adminStats = useMemo(() => {
    const salesTotal = orders.reduce((sum, o) => sum + o.finalTotal, 0);
    const avgOrder = orders.length > 0 ? Math.round(salesTotal / orders.length) : 0;
    
    const capturedPaymentsTotal = payments
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingPaymentsTotal = payments
      .filter(p => p.status === 'Pending')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const failedPaymentsTotal = payments
      .filter(p => p.status === 'Failed')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      salesTotal,
      ordersCount: orders.length,
      avgOrder,
      productsCount: products.length,
      capturedPaymentsTotal,
      pendingPaymentsTotal,
      failedPaymentsTotal,
      paymentsCount: payments.length
    };
  }, [orders, products, payments]);

  // Handle Add Address
  const handleAddAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addrName || !addrLine1 || !addrCity || !addrState || !addrZip || !addrPhone) return;

    onAddAddress({
      id: `addr-${Date.now()}`,
      fullName: addrName,
      addressLine1: addrLine1,
      addressLine2: addrLine2,
      city: addrCity,
      state: addrState,
      zipCode: addrZip,
      phone: addrPhone,
      isDefault: false
    });

    setShowAddAddr(false);
    setAddrName('');
    setAddrLine1('');
    setAddrLine2('');
    setAddrCity('');
    setAddrState('');
    setAddrZip('');
    setAddrPhone('');
  };

  // Open Edit Product form
  const handleEditProductOpen = (prod: Product) => {
    setEditProdId(prod.id);
    setProdName(prod.name);
    setProdSku(prod.sku || '');
    setProdPrice(prod.price);
    setProdOrigPrice(prod.originalPrice);
    setProdStock(prod.stock);
    setProdCategory(prod.category);
    setProdDesc(prod.description);
    setProdImg(prod.mainImage);
    setProdImg2(prod.images?.[0] || '');
    setProdImg3(prod.images?.[1] || '');
    setProdImg4(prod.images?.[2] || '');
    setProdBenefits(prod.benefits.join(', '));
    setProdDosage(prod.dosage);
    setProdBrand(prod.brand || 'Grams Life');
    setProdSubcategory(prod.subcategory || '');
    setProdUsageInstructions(prod.usageInstructions || 'As directed');
    setProdFeatured(prod.featured || false);
    setProdBestSeller(prod.bestSeller || false);
    setProdLowStockAlertLimit(prod.lowStockAlertLimit !== undefined ? prod.lowStockAlertLimit : 5);
    setProdIngredients(prod.ingredients || []);
    setProdFaqs(prod.faqs || []);
    setShowAddProd(true);
  };

  // Reset product CRUD states
  const handleResetProductForm = () => {
    setShowAddProd(false);
    setEditProdId(null);
    setProdName('');
    setProdSku('');
    setProdPrice(500);
    setProdOrigPrice(600);
    setProdStock(20);
    setProdCategory('Immunity');
    setProdDesc('');
    setProdImg('');
    setProdImg2('');
    setProdImg3('');
    setProdImg4('');
    setProdBenefits('');
    setProdDosage('');
    setProdBrand('Grams Life');
    setProdSubcategory('');
    setProdUsageInstructions('As directed');
    setProdFeatured(false);
    setProdBestSeller(false);
    setProdLowStockAlertLimit(5);
    setProdIngredients([]);
    setProdFaqs([]);
  };

  // Handle Product Save (Add/Edit)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodDesc) return;

    const extraImages = [prodImg2, prodImg3, prodImg4].map(img => img.trim()).filter(Boolean);

    const payload: Partial<Product> = {
      name: prodName,
      sku: prodSku.trim(),
      price: prodPrice,
      originalPrice: prodOrigPrice,
      stock: prodStock,
      category: prodCategory,
      subcategory: prodSubcategory,
      brand: prodBrand,
      description: prodDesc,
      mainImage: prodImg || 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=200',
      images: extraImages,
      benefits: prodBenefits.split(',').map(b => b.trim()).filter(Boolean),
      dosage: prodDosage || 'Take 1 capsule daily after breakfast.',
      usageInstructions: prodUsageInstructions || 'As directed',
      featured: prodFeatured,
      bestSeller: prodBestSeller,
      lowStockAlertLimit: prodLowStockAlertLimit,
      ingredients: prodIngredients,
      faqs: prodFaqs
    };

    if (editProdId) {
      onEditProduct(editProdId, payload);
    } else {
      onAddProduct(payload);
    }
    handleResetProductForm();
  };

  // Handle Coupon Submit
  const handleAddCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpnCode) return;

    onAddCoupon({
      code: cpnCode.toUpperCase(),
      discountType: 'percentage',
      value: cpnVal,
      active: true,
      minOrderValue: cpnMin,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    setShowAddCpn(false);
    setCpnCode('');
    setCpnVal(15);
    setCpnMin(500);
  };

  if (!user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-brand-green-950/5">
        <div className="max-w-md w-full space-y-6 bg-white text-brand-green-950 p-8 sm:p-10 rounded-[2.5rem] border border-brand-green-100 shadow-2xl relative overflow-hidden text-left">
          {/* Top Security Accent Header */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-gold-500 via-brand-gold-300 to-brand-gold-600" />
          
          <div className="text-center space-y-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-brand-green-50 flex items-center justify-center border border-brand-green-100 shadow-inner">
              <User className="h-5.5 w-5.5 text-brand-green-850" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold tracking-tight text-brand-green-900 text-center">
                Wellness Portal
              </h2>
              <p className="text-[11px] text-brand-green-600/80 max-w-xs mx-auto text-center leading-relaxed">
                Connect to review your order chronicles, manage custom dispatch addresses, and trace your healing packages.
              </p>
            </div>
          </div>

          {/* Toggle Tabs */}
          <div className="p-1 bg-brand-green-50 border border-brand-green-100 rounded-full flex gap-1">
            <button
              type="button"
              onClick={() => {
                setAuthTab('signin');
                setAuthError('');
                setAuthSuccessMsg('');
              }}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider cursor-pointer text-center ${
                authTab === 'signin'
                  ? 'bg-brand-green-800 text-brand-cream-50 shadow-md'
                  : 'text-brand-green-800 hover:text-brand-green-900 bg-transparent'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthTab('register');
                setAuthError('');
                setAuthSuccessMsg('');
              }}
              className={`flex-1 py-2 rounded-full text-xs font-bold transition-all uppercase tracking-wider cursor-pointer text-center ${
                authTab === 'register'
                  ? 'bg-brand-green-800 text-brand-cream-50 shadow-md'
                  : 'text-brand-green-800 hover:text-brand-green-900 bg-transparent'
              }`}
            >
              Create Account
            </button>
          </div>

          {authError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-[11px] rounded-xl flex flex-col gap-2 animate-shake font-semibold text-left">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="leading-relaxed flex-1">{authError}</p>
              </div>
              {authAccountExists && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthTab('signin');
                    setAuthError('');
                    setAuthAccountExists(false);
                  }}
                  className="self-start text-[10px] uppercase tracking-wider font-extrabold bg-brand-green-800 text-brand-cream-50 px-3 py-1 rounded-lg hover:bg-brand-green-900 transition-all cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <span>Log In to Existing Account</span>
                  <ArrowRight className="w-3 h-3 text-brand-gold-400" />
                </button>
              )}
            </div>
          )}

          {authSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] rounded-xl flex items-start gap-2.5 animate-pulse font-semibold text-left">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{authSuccessMsg}</p>
            </div>
          )}

          {/* Main Form */}
          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authTab === 'register' && (
              <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] uppercase font-bold text-brand-green-800 tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Vipin Choudhary"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-green-200 focus:outline-none focus:border-brand-green-700 font-medium text-xs bg-white text-brand-green-950 text-left"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] uppercase font-bold text-brand-green-800 tracking-wider">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g., 9425011088"
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-2.5 rounded-xl border border-brand-green-200 focus:outline-none focus:border-brand-green-700 font-medium text-xs bg-white text-brand-green-950 text-left"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] uppercase font-bold text-brand-green-800 tracking-wider">Email Address</label>
              <input
                type="email"
                required
                placeholder="e.g., vkchoudhary050607@gmail.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-brand-green-200 focus:outline-none focus:border-brand-green-700 font-medium text-xs bg-white text-brand-green-950 text-left"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <div className="flex justify-between items-center">
                <label className="text-[10px] uppercase font-bold text-brand-green-800 tracking-wider">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-[10px] font-bold text-brand-gold-700 hover:text-brand-gold-800 underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showAuthPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter secure password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-brand-green-200 focus:outline-none focus:border-brand-green-700 font-medium text-xs bg-white text-brand-green-950 text-left"
                />
                <button
                  type="button"
                  onClick={() => setShowAuthPassword(!showAuthPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-green-700 hover:text-brand-green-900 transition-colors p-0.5 cursor-pointer"
                >
                  {showAuthPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 bg-brand-green-800 hover:bg-brand-green-900 disabled:opacity-50 text-brand-cream-50 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{authLoading ? 'Verifying...' : authTab === 'signin' ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-brand-gold-400 shrink-0" />
            </button>
          </form>

          {/* Sandbox Quick Access Panel */}
          <div className="p-4 bg-brand-green-50/50 rounded-2xl border border-brand-green-100 space-y-2.5 text-left">
            <div className="flex items-center gap-1.5 justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-brand-green-800 bg-brand-gold-500/10 border border-brand-gold-500/20 px-2 py-0.5 rounded-full font-mono">Sandbox Demo Profiles</span>
              <span className="text-[8px] font-bold text-brand-green-600/60 font-mono uppercase">1-Click Auto Fill</span>
            </div>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('signin');
                  setAuthEmail('vkchoudhary050607@gmail.com');
                  setAuthPassword('password123');
                  setAuthError('');
                  setAuthSuccessMsg('');
                }}
                className="p-2.5 bg-white hover:bg-brand-green-50 border border-brand-green-100 hover:border-brand-green-200 rounded-xl text-left transition-all cursor-pointer shadow-sm group flex items-center justify-between"
              >
                <div>
                  <p className="text-[10px] font-bold text-brand-green-950 group-hover:text-brand-green-800">Vipul Choudhary</p>
                  <p className="text-[8px] font-mono text-brand-green-600/70">vkchoudhary050607@gmail.com | password123</p>
                </div>
                <span className="text-[9px] font-bold text-brand-gold-700 uppercase bg-brand-gold-500/10 px-1.5 py-0.5 rounded border border-brand-gold-500/10 shrink-0 group-hover:bg-brand-gold-500/20">User Profile</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthTab('signin');
                  setAuthEmail('admin@gramslife.com');
                  setAuthPassword('password123');
                  setAuthError('');
                  setAuthSuccessMsg('');
                }}
                className="p-2.5 bg-white hover:bg-brand-green-50 border border-brand-green-100 hover:border-brand-green-200 rounded-xl text-left transition-all cursor-pointer shadow-sm group flex items-center justify-between"
              >
                <div>
                  <p className="text-[10px] font-bold text-brand-green-950 group-hover:text-brand-green-800">Apothecary Director</p>
                  <p className="text-[8px] font-mono text-brand-green-600/70">admin@gramslife.com | password123</p>
                </div>
                <span className="text-[9px] font-bold text-rose-700 uppercase bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200 shrink-0 group-hover:bg-rose-100">Admin Panel</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="dashboard-page" className={`w-full ${isAdmin ? 'bg-gradient-to-br from-green-50/60 via-slate-50 to-blue-50/50 min-h-[90vh] font-sans text-slate-900' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      
      {/* Admin Title & Security Control Banner */}
      {isAdmin && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 mb-8 border border-green-100 shadow-xl shadow-green-100/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          {/* Top Vibrant Color Header Accent */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-green-600 to-violet-600" />
          
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-green-600 flex items-center justify-center shadow-md shadow-green-500/25 text-white shrink-0">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-wider mb-1">
                <Building2 className="w-3.5 h-3.5 text-green-600" />
                <span>Admin Management Gateway</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">Grams Life Admin Panel</h1>
              <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                Director: <span className="font-semibold text-slate-900">{user.fullName}</span> ({user.email})
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            {onLogout && (
              <button
                onClick={onLogout}
                className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 via-green-600 to-green-700 hover:from-blue-700 hover:to-green-800 text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-md shadow-green-500/20 text-center"
              >
                Secure Sign Out
              </button>
            )}
          </div>
        </div>
      )}

      {/* Regular Customer Title block */}
      {!isAdmin && (
        <div className="border-b border-brand-green-600/10 pb-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="text-xs uppercase tracking-widest text-brand-gold-600 font-bold">Personal Account</span>
            <h2 className="font-serif text-3xl font-bold text-brand-green-900">
              Welcome, {user.fullName} <span className="text-xs font-sans text-brand-gold-700 font-bold italic">({user.role === 'admin' ? 'Apothecary Director' : 'Vedic Practitioner'})</span>
            </h2>
            <p className="text-xs text-brand-green-600/70 mt-1">
              Track package deliveries, biological diagnostic profile, and delivery endpoints.
            </p>
          </div>
          <div className="text-xs text-brand-green-600 font-mono">
            Linked email: {user.email}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar Drawer */}
        <div className={`lg:col-span-1 bg-white border ${isAdmin ? 'border-green-100 shadow-xl shadow-green-100/40' : 'border-brand-green-600/5 shadow-2xs'} p-4 rounded-3xl h-fit lg:sticky lg:top-24 flex flex-col gap-3 min-w-0 z-10`}>
          
          {/* Quick Sandbox Role Switcher */}
          {isAdmin && (
            <div className="p-3.5 border border-green-100/80 rounded-2xl bg-green-50/40 text-xs space-y-2 shrink-0">
              <div className="flex items-center gap-1.5 justify-center">
                <Shield className="w-3.5 h-3.5 text-green-600" />
                <span className="text-[10px] uppercase tracking-widest text-slate-800 font-bold">Portal Role Clearance</span>
              </div>
              <p className="text-[10px] text-slate-600 text-center leading-relaxed">
                Switch user capability between Buyer & Administrator.
              </p>
              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/users/${user.email}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: 'customer' })
                      });
                      if (res.ok) {
                        window.location.reload();
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer text-center ${
                    !isAdmin 
                      ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-xs' 
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Customer
                </button>
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/users/${user.email}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: 'admin' })
                      });
                      if (res.ok) {
                        window.location.reload();
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer text-center ${
                    isAdmin 
                      ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-xs' 
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
          )}

          {/* Navigation Tabs Area */}
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-1.5 pb-2 lg:pb-0 whitespace-nowrap scrollbar-none snap-x w-full">
            {/* CUSTOMER TABS */}
            {!isAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab('account')}
                  className={`shrink-0 snap-start lg:w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    activeTab === 'account' ? 'bg-brand-green-700 text-brand-cream-50' : 'text-brand-green-700 hover:bg-brand-green-50'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span>My Profile & Account</span>
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`shrink-0 snap-start lg:w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    activeTab === 'orders' ? 'bg-brand-green-700 text-brand-cream-50' : 'text-brand-green-700 hover:bg-brand-green-50'
                  }`}
                >
                  <History className="w-4 h-4 shrink-0" />
                  <span>Wellness Orders History</span>
                </button>
                <button
                  onClick={() => setActiveTab('addresses')}
                  className={`shrink-0 snap-start lg:w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    activeTab === 'addresses' ? 'bg-brand-green-700 text-brand-cream-50' : 'text-brand-green-700 hover:bg-brand-green-50'
                  }`}
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span>Delivery Destinations</span>
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`shrink-0 snap-start lg:w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    activeTab === 'profile' ? 'bg-brand-green-700 text-brand-cream-50' : 'text-brand-green-700 hover:bg-brand-green-50'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>Dosha Biological Profile</span>
                </button>
              </>
            ) : (
              /* ADMIN TABS */
              <>
                <span className="hidden lg:block px-3 py-1 text-[10px] uppercase tracking-wider text-slate-400 font-bold shrink-0">Admin Controls</span>
                <button
                  onClick={() => setActiveTab('admin-stats')}
                  className={`shrink-0 snap-start lg:w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'admin-stats' 
                      ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-sm font-bold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Overview Statistics</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-catalog')}
                  className={`shrink-0 snap-start lg:w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'admin-catalog' 
                      ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-sm font-bold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Leaf className="w-4 h-4 shrink-0" />
                  <span>Remedies Catalog CRUD</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-orders')}
                  className={`shrink-0 snap-start lg:w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'admin-orders' 
                      ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-sm font-bold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>All Orders Dispatch Registry</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-payments')}
                  className={`shrink-0 snap-start lg:w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'admin-payments' 
                      ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-sm font-bold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Payments Ledger (MySQL)</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-coupons')}
                  className={`shrink-0 snap-start lg:w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'admin-coupons' 
                      ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-sm font-bold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Tag className="w-4 h-4 shrink-0" />
                  <span>Coupons Management</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-logs')}
                  className={`shrink-0 snap-start lg:w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'admin-logs' 
                      ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-sm font-bold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  <span>Security & Activity Logs</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-settings')}
                  className={`shrink-0 snap-start lg:w-full text-left px-3.5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                    activeTab === 'admin-settings' 
                      ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-sm font-bold' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Website Settings</span>
                </button>
              </>
            )}
          </div>

        </div>

        {/* Content Panel Area */}
        <div className={`lg:col-span-3 bg-white border ${isAdmin ? 'border-green-100 shadow-xl shadow-green-100/40' : 'border-brand-green-600/5'} p-6 sm:p-8 rounded-3xl min-h-[450px]`}>
          
          {/* TAB: MY PROFILE & ACCOUNT (CUSTOMER) */}
          {activeTab === 'account' && user && (
            <div className="space-y-6 animate-in fade-in duration-300">
              
              {/* Profile Card Banner Header */}
              <div className="relative overflow-hidden bg-gradient-to-r from-brand-green-900 via-brand-green-800 to-brand-green-950 text-brand-cream-50 p-6 sm:p-8 rounded-2xl border border-brand-gold-500/20 shadow-lg">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold-500/10 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                  {/* Large Avatar */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-brand-gold-400 to-brand-gold-600 p-1 shrink-0 shadow-md">
                    <div className="w-full h-full rounded-full bg-brand-green-900 flex items-center justify-center font-serif text-2xl sm:text-3xl font-bold text-brand-gold-300">
                      {user.fullName ? user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US'}
                    </div>
                  </div>

                  {/* Identity Details */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <h3 className="font-serif text-2xl font-bold text-brand-cream-50">{user.fullName}</h3>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-brand-gold-500/20 text-brand-gold-300 border border-brand-gold-500/30 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3 h-3 text-brand-gold-400" />
                        <span>Verified Account</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-brand-cream-200/80 font-medium pt-0.5">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-brand-gold-400" />
                        <span>{user.email}</span>
                      </div>
                      {user.addresses && user.addresses[0]?.phone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-brand-gold-400" />
                          <span className="font-mono">{user.addresses[0].phone}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[11px] text-brand-cream-300/70 pt-1">
                      Role: <span className="font-bold text-brand-gold-300 capitalize">{user.role === 'admin' ? 'Apothecary Director / Admin' : 'Vedic Wellness Member'}</span>
                    </p>
                  </div>

                  {/* Sign out button */}
                  {onLogout && (
                    <button
                      onClick={onLogout}
                      className="px-4 py-2 bg-brand-gold-500 hover:bg-brand-gold-400 text-brand-green-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer shrink-0"
                    >
                      Sign Out
                    </button>
                  )}
                </div>
              </div>

              {/* Quick Summary Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 bg-brand-green-50/40 border border-brand-green-600/10 rounded-xl text-center space-y-1">
                  <p className="text-[10px] uppercase font-bold text-brand-green-700 tracking-wider">Total Orders</p>
                  <p className="font-serif text-2xl font-bold text-brand-green-900">{userOrders.length}</p>
                </div>
                <div className="p-4 bg-amber-50/40 border border-amber-500/20 rounded-xl text-center space-y-1">
                  <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Active Shipments</p>
                  <p className="font-serif text-2xl font-bold text-amber-900">
                    {userOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length}
                  </p>
                </div>
                <div className="p-4 bg-brand-cream-100/50 border border-brand-gold-500/20 rounded-xl text-center space-y-1">
                  <p className="text-[10px] uppercase font-bold text-brand-gold-800 tracking-wider">Saved Addresses</p>
                  <p className="font-serif text-2xl font-bold text-brand-green-900">{user.addresses?.length || 0}</p>
                </div>
                <div className="p-4 bg-emerald-50/40 border border-emerald-500/20 rounded-xl text-center space-y-1">
                  <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Dosha Harmony</p>
                  <p className="font-serif text-sm font-bold text-emerald-950 mt-1">Vata-Pitta</p>
                </div>
              </div>

              {/* Detailed Personal Information Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Personal Information */}
                <div className="p-5 border border-brand-green-600/10 rounded-2xl bg-white space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-brand-green-600/10 pb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-brand-gold-600" />
                      <h4 className="font-serif text-base font-bold text-brand-green-900">Personal Account Details</h4>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="flex justify-between py-1.5 border-b border-brand-green-600/5">
                      <span className="text-brand-green-600/70 font-medium">Full Name</span>
                      <span className="font-bold text-brand-green-900">{user.fullName}</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-brand-green-600/5">
                      <span className="text-brand-green-600/70 font-medium">Email Address</span>
                      <span className="font-bold text-brand-green-900 font-mono">{user.email}</span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-brand-green-600/5">
                      <span className="text-brand-green-600/70 font-medium">Primary Contact</span>
                      <span className="font-bold text-brand-green-900 font-mono">
                        {user.addresses && user.addresses[0]?.phone ? user.addresses[0].phone : 'Not set'}
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5 border-b border-brand-green-600/5">
                      <span className="text-brand-green-600/70 font-medium">Account Protection</span>
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Lock className="w-3 h-3" /> Password Protected
                      </span>
                    </div>

                    <div className="flex justify-between py-1.5">
                      <span className="text-brand-green-600/70 font-medium">Account Status</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Active & Verified
                      </span>
                    </div>
                  </div>
                </div>

                {/* Default Delivery Address Card */}
                <div className="p-5 border border-brand-green-600/10 rounded-2xl bg-white space-y-4 shadow-sm">
                  <div className="flex items-center justify-between border-b border-brand-green-600/10 pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-gold-600" />
                      <h4 className="font-serif text-base font-bold text-brand-green-900">Primary Delivery Destination</h4>
                    </div>
                    <button
                      onClick={() => setActiveTab('addresses')}
                      className="text-[11px] text-brand-gold-700 hover:text-brand-gold-800 font-bold underline cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>

                  {user.addresses && user.addresses.length > 0 ? (
                    <div className="space-y-2 text-xs bg-brand-green-50/30 p-3.5 rounded-xl border border-brand-green-600/5">
                      <p className="font-bold text-brand-green-900">{user.addresses[0].fullName}</p>
                      <p className="text-brand-green-800">{user.addresses[0].addressLine1} {user.addresses[0].addressLine2 ? `, ${user.addresses[0].addressLine2}` : ''}</p>
                      <p className="text-brand-green-800">{user.addresses[0].city}, {user.addresses[0].state} - <span className="font-mono font-bold">{user.addresses[0].zipCode}</span></p>
                      <p className="text-brand-gold-800 font-mono font-bold pt-1">📞 {user.addresses[0].phone}</p>
                    </div>
                  ) : (
                    <div className="text-center py-6 space-y-2">
                      <MapPin className="w-8 h-8 text-brand-green-600/30 mx-auto" />
                      <p className="text-xs text-brand-green-700">No primary delivery address saved yet.</p>
                      <button
                        onClick={() => setActiveTab('addresses')}
                        className="px-3.5 py-1.5 bg-brand-green-700 text-brand-cream-50 rounded-xl text-xs font-bold cursor-pointer"
                      >
                        Add Address
                      </button>
                    </div>
                  )}
                </div>

              </div>

              {/* Quick Shortcuts Bar */}
              <div className="p-5 bg-brand-cream-100/50 border border-brand-gold-500/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-serif text-sm font-bold text-brand-green-950">Quick Account Shortcuts</h4>
                  <p className="text-xs text-brand-green-700/80">Manage your past orders, delivery addresses, and health preferences easily.</p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('orders')}
                    className="px-3.5 py-2 bg-white border border-brand-green-600/20 hover:border-brand-green-600 text-brand-green-900 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-brand-gold-600" />
                    <span>View Orders ({userOrders.length})</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('addresses')}
                    className="px-3.5 py-2 bg-white border border-brand-green-600/20 hover:border-brand-green-600 text-brand-green-900 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <MapPin className="w-3.5 h-3.5 text-brand-gold-600" />
                    <span>Manage Addresses</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB: ORDERS HISTORY (CUSTOMER) */}
          {activeTab === 'orders' && (() => {
            // Filter and search customer orders
            const filteredUserOrders = userOrders.filter(order => {
              if (customerOrderFilter === 'active' && (order.status === 'Delivered' || order.status === 'Cancelled')) return false;
              if (customerOrderFilter === 'delivered' && order.status !== 'Delivered') return false;
              if (customerOrderFilter === 'cancelled' && order.status !== 'Cancelled') return false;

              if (customerOrderSearch.trim()) {
                const q = customerOrderSearch.toLowerCase().trim();
                const idMatch = (order.id || '').toLowerCase().includes(q);
                const itemMatch = (order.items || []).some(it => (it.productName || '').toLowerCase().includes(q));
                return idMatch || itemMatch;
              }
              return true;
            });

            const totalPages = Math.ceil(filteredUserOrders.length / customerOrderPageSize) || 1;
            const validPage = Math.min(customerOrderPage, totalPages);
            const paginatedUserOrders = filteredUserOrders.slice((validPage - 1) * customerOrderPageSize, validPage * customerOrderPageSize);

            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-brand-green-600/10 pb-3">
                  <div>
                    <h3 className="font-serif text-xl font-bold text-brand-green-900">
                      Your Ayurvedic Orders Ledger
                    </h3>
                    <p className="text-xs text-brand-green-600/70">
                      Real-time shipment milestones, invoice printing, and delivery receipts.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (onRefreshOrders) onRefreshOrders();
                    }}
                    className="px-3.5 py-1.5 bg-brand-green-50 hover:bg-brand-green-100 text-brand-green-900 border border-brand-green-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3 text-brand-gold-600" />
                    <span>Refresh Orders</span>
                  </button>
                </div>

                {/* Filter and Search Bar */}
                {userOrders.length > 0 && (
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-3 rounded-2xl border border-brand-green-600/10 shadow-xs">
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                      <button
                        onClick={() => { setCustomerOrderFilter('all'); setCustomerOrderPage(1); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          customerOrderFilter === 'all'
                            ? 'bg-brand-green-900 text-white shadow-xs'
                            : 'bg-brand-green-50 text-brand-green-800 hover:bg-brand-green-100'
                        }`}
                      >
                        All Orders ({userOrders.length})
                      </button>
                      <button
                        onClick={() => { setCustomerOrderFilter('active'); setCustomerOrderPage(1); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          customerOrderFilter === 'active'
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        In Transit ({userOrders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length})
                      </button>
                      <button
                        onClick={() => { setCustomerOrderFilter('delivered'); setCustomerOrderPage(1); }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          customerOrderFilter === 'delivered'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                        }`}
                      >
                        Delivered ({userOrders.filter(o => o.status === 'Delivered').length})
                      </button>
                    </div>

                    <div className="relative min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-brand-green-600/50 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search Order ID or remedy..."
                        value={customerOrderSearch}
                        onChange={(e) => { setCustomerOrderSearch(e.target.value); setCustomerOrderPage(1); }}
                        className="w-full bg-brand-green-50/50 border border-brand-green-200 pl-8 pr-3 py-1.5 rounded-xl text-xs text-brand-green-900 focus:outline-none focus:border-brand-green-600"
                      />
                      {customerOrderSearch && (
                        <button
                          onClick={() => setCustomerOrderSearch('')}
                          className="absolute right-2.5 top-1.5 text-xs text-brand-green-600 hover:text-brand-green-900 font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {userOrders.length === 0 ? (
                  <div className="text-center py-12 space-y-3 bg-white rounded-2xl border border-brand-green-600/10 p-8">
                    <ShoppingBag className="w-10 h-10 text-brand-gold-500/50 mx-auto" />
                    <p className="text-sm font-bold text-brand-green-900">No packages logged yet.</p>
                    <p className="text-xs text-brand-green-600 italic">Discover authentic Vedic herbs and formulations customized for your dosha balance.</p>
                    <button onClick={() => onNavigate('shop')} className="bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer">
                      Start Remedies Shop
                    </button>
                  </div>
                ) : filteredUserOrders.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-2xl border border-brand-green-600/10 p-6 space-y-2">
                    <p className="text-sm font-bold text-brand-green-900">No orders match the current filter.</p>
                    <p className="text-xs text-brand-green-600/70">Try selecting "All Orders" or clearing your search term.</p>
                    <button
                      onClick={() => { setCustomerOrderFilter('all'); setCustomerOrderSearch(''); }}
                      className="text-xs font-bold text-brand-gold-700 underline pt-1 cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div 
                      ref={customerOrdersScrollRef}
                      className="max-h-[620px] overflow-y-auto pr-1.5 space-y-4 custom-scrollbar rounded-xl scroll-smooth"
                    >
                      {paginatedUserOrders.map(order => (
                        <div key={order.id} className="border border-brand-green-600/10 rounded-2xl p-5 space-y-4 bg-white shadow-xs hover:border-brand-green-600/30 transition-all">
                          
                          {/* Meta */}
                          <div className="flex flex-col sm:flex-row justify-between text-xs border-b border-brand-green-600/5 pb-3 gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-brand-green-950 font-mono text-sm">{order.id}</p>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  order.status === 'Delivered' ? 'bg-emerald-100 text-emerald-800' :
                                  order.status === 'Cancelled' ? 'bg-rose-100 text-rose-800' :
                                  'bg-amber-100 text-amber-800'
                                }`}>
                                  {order.status}
                                </span>
                              </div>
                              <p className="text-brand-green-600/60 mt-0.5">Placed: {new Date(order.orderDate).toLocaleString()}</p>
                            </div>
                            <div className="sm:text-right">
                              <p className="font-bold text-brand-green-900 text-base">Total: ₹{order.finalTotal}</p>
                              <p className="text-[10px] text-brand-gold-700 font-bold uppercase">{order.paymentMethod} • {order.paymentStatus}</p>
                            </div>
                          </div>

                          {/* Delivery Status stepper */}
                          <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold py-1">
                            {[
                              { key: 'Ordered', label: 'Ordered' },
                              { key: 'Prepared', label: 'Brewed / Prepared' },
                              { key: 'Dispatched', label: 'In Transit' },
                              { key: 'Delivered', label: 'Delivered' }
                            ].map((step, idx) => {
                              const steps = ['Ordered', 'Prepared', 'Dispatched', 'Delivered'];
                              const currentIdx = steps.indexOf(order.status === 'Shipped' ? 'Dispatched' : order.status);
                              const active = idx <= currentIdx;
                              return (
                                <div key={idx} className="space-y-1">
                                  <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center font-bold border transition-all ${
                                    active ? 'bg-brand-green-700 text-brand-cream-50 border-brand-green-700 shadow-xs' : 'bg-gray-100 text-gray-400 border-gray-200'
                                  }`}>
                                    {active ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                                  </div>
                                  <span className={active ? 'text-brand-green-800 font-bold' : 'text-gray-400'}>{step.label}</span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Items row */}
                          <div className="space-y-2 pt-2 border-t border-brand-green-600/5 text-xs text-brand-green-800 font-medium">
                            {order.items.map((item, i) => (
                              <div key={i} className="flex justify-between items-center bg-brand-cream-50/50 p-2 rounded-xl">
                                <div className="flex items-center gap-2">
                                  {item.mainImage && (
                                    <img src={item.mainImage} alt={item.productName} className="w-8 h-8 rounded object-cover" />
                                  )}
                                  <span>{item.productName} <span className="text-brand-green-600 font-bold">× {item.quantity}</span></span>
                                </div>
                                <span className="font-serif font-bold text-brand-green-900">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>

                          <div className="flex flex-wrap justify-between items-center gap-2 pt-3.5 border-t border-brand-green-600/5">
                            <span className="text-[10px] text-brand-green-600 font-mono">
                              Batch: GL-CH-{order.id.slice(-6).toUpperCase()}
                            </span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <button
                                onClick={() => onNavigate('track', { orderId: order.id })}
                                className="px-3.5 py-1.5 rounded-xl border border-brand-green-700/20 hover:border-brand-green-700 text-brand-green-800 bg-brand-green-50/50 text-[11px] font-bold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer"
                              >
                                <Truck className="w-3.5 h-3.5 text-brand-green-700" />
                                <span>Live Tracking</span>
                              </button>
                              <button
                                onClick={() => setInvoiceOrder(order)}
                                className="px-3.5 py-1.5 rounded-xl border border-brand-gold-500/30 hover:border-brand-gold-500 text-brand-gold-700 bg-brand-gold-50/25 text-[11px] font-bold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer hover:bg-brand-gold-50"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Print Bill Invoice</span>
                              </button>
                              <button
                                onClick={() => setShippingLabelOrder(order)}
                                className="px-3.5 py-1.5 rounded-xl border border-brand-green-600/30 hover:border-brand-green-600 text-brand-green-800 bg-brand-green-50/50 text-[11px] font-bold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer hover:bg-brand-green-100"
                              >
                                <Tag className="w-3.5 h-3.5 text-brand-green-700" />
                                <span>Print Shipping Label</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {filteredUserOrders.length > 0 && (
                      <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 px-1 z-10 border-t border-brand-green-600/10 rounded-b-xl">
                        <Pagination
                          currentPage={validPage}
                          totalItems={filteredUserOrders.length}
                          pageSize={customerOrderPageSize}
                          onPageChange={(p) => {
                            setCustomerOrderPage(p);
                            customerOrdersScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          onPageSizeChange={(s) => {
                            setCustomerOrderPageSize(s);
                            setCustomerOrderPage(1);
                            customerOrdersScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          pageSizeOptions={[5, 10, 20]}
                          itemLabel="orders"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: ADDRESSES (CUSTOMER) */}
          {activeTab === 'addresses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-brand-green-600/5 pb-2">
                <h3 className="font-serif text-lg font-bold text-brand-green-900">Delivery Endpoints</h3>
                <button 
                  onClick={() => setShowAddAddr(!showAddAddr)}
                  className="bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Endpoint</span>
                </button>
              </div>

              {/* Add address form inline modal */}
              {showAddAddr && (
                <form onSubmit={handleAddAddressSubmit} className="bg-brand-cream-100/30 border border-brand-green-600/10 p-5 rounded-xl space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input required type="text" placeholder="Receiver name" value={addrName} onChange={e => setAddrName(e.target.value)} className="bg-white border rounded-lg px-3 py-2" />
                    <input required type="tel" placeholder="Receiver phone number" value={addrPhone} onChange={e => setAddrPhone(e.target.value)} className="bg-white border rounded-lg px-3 py-2" />
                  </div>
                  <input required type="text" placeholder="Address Line 1" value={addrLine1} onChange={e => setAddrLine1(e.target.value)} className="w-full bg-white border rounded-lg px-3 py-2" />
                  <input type="text" placeholder="Address Line 2 (Optional)" value={addrLine2} onChange={e => setAddrLine2(e.target.value)} className="w-full bg-white border rounded-lg px-3 py-2" />
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input required type="text" placeholder="City" value={addrCity} onChange={e => setAddrCity(e.target.value)} className="bg-white border rounded-lg px-3 py-2" />
                    <input required type="text" placeholder="State" value={addrState} onChange={e => setAddrState(e.target.value)} className="bg-white border rounded-lg px-3 py-2" />
                    <input required type="text" placeholder="ZIP Code" value={addrZip} onChange={e => setAddrZip(e.target.value)} className="bg-white border rounded-lg px-3 py-2" />
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowAddAddr(false)} className="px-3 py-1.5 border rounded-lg">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 bg-brand-green-700 text-brand-cream-100 font-bold rounded-lg">Save</button>
                  </div>
                </form>
              )}

              {/* Address records */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {user.addresses && user.addresses.length > 0 ? (
                  user.addresses.map(addr => (
                    <div key={addr.id} className="border border-brand-green-600/10 p-4 rounded-xl bg-brand-cream-100/5">
                      <p className="font-bold text-brand-green-900">{addr.fullName}</p>
                      <p className="text-brand-green-800/85">{addr.addressLine1}, {addr.addressLine2 || ''}</p>
                      <p className="text-brand-green-800/85">{addr.city}, {addr.state} - {addr.zipCode}</p>
                      <p className="font-mono text-[10px] text-brand-gold-700 font-bold pt-1">Phone: {addr.phone}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-brand-green-600 italic">No alternative addresses saved.</p>
                )}
              </div>
            </div>
          )}

          {/* TAB: DOSHA PROFILE (CUSTOMER) */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="font-serif text-lg font-bold text-brand-green-900 border-b border-brand-green-600/5 pb-2">
                Your Biological Constitution & Security Profile
              </h3>
              
              <div className="bg-brand-cream-100/50 border border-brand-gold-500/10 p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center justify-between">
                <div className="space-y-2 max-w-md">
                  <div className="inline-flex items-center gap-1 text-[10px] uppercase bg-brand-gold-500/10 text-brand-gold-700 font-bold px-2 py-0.5 rounded">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Biological Harmony</span>
                  </div>
                  <h4 className="font-serif text-base font-bold text-brand-green-950">Vata-Pitta Biological Constitution</h4>
                  <p className="text-xs text-brand-green-800/90 leading-relaxed">
                    You have balanced Air & Fire bio-elements. Your Agni (digestive fire) is energetic but prone to occasional wind or dry cooling. Highly recommended to consume rich warm ghee, sweet nourishing roots, and avoid dry, cooling foods before bedtime.
                  </p>
                </div>
                <div className="w-24 h-24 rounded-full bg-brand-green-900 flex items-center justify-center text-brand-cream-50 font-serif font-bold text-2xl border-4 border-brand-gold-500">
                  VP
                </div>
              </div>

              {/* Multi-Channel OTP & Account Security Verification */}
              <div className="bg-white border border-brand-green-600/10 p-6 rounded-2xl space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-green-600/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-brand-gold-600" />
                    <div>
                      <h4 className="font-serif text-base font-bold text-brand-green-900">
                        Multi-Channel OTP Verification (SecureOTPWidgetM7DX)
                      </h4>
                      <p className="text-xs text-brand-green-700/70">
                        Supports SMS, WhatsApp, Email, and Voice verification channels.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Channels Active
                    </span>
                  </div>
                </div>

                {verifySuccessNotice && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{verifySuccessNotice}</span>
                  </div>
                )}

                {showSecurityVerify ? (
                  <div className="bg-brand-cream-50 border border-brand-gold-300/40 p-4 rounded-2xl">
                    <SecureOtpWidget
                      identifier={verifyTargetIdentifier || user.phone || user.email}
                      purpose={verifyPurpose}
                      widgetName="Security Verification"
                      onVerified={(params) => {
                        setVerifySuccessNotice(`Verification confirmed via ${verifyPurpose} for ${verifyTargetIdentifier || user.phone || user.email}! Token: ${params.accessToken?.slice(0, 12) || 'VERIFIED'}...`);
                        setShowSecurityVerify(false);
                      }}
                      onCancel={() => setShowSecurityVerify(false)}
                      submitButtonText={`Verify ${verifyPurpose}`}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 border border-brand-green-100 rounded-xl bg-brand-cream-50/50 space-y-2">
                      <p className="text-xs font-bold text-brand-green-900 flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-brand-gold-600" />
                        <span>Mobile Verification</span>
                      </p>
                      <p className="text-[11px] text-brand-green-700/80">
                        Test or update mobile contact with SMS, WhatsApp, or Voice OTP.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setVerifyPurpose('MobileChange');
                          setVerifyTargetIdentifier(user.phone || '9425011088');
                          setShowSecurityVerify(true);
                          setVerifySuccessNotice('');
                        }}
                        className="w-full py-2 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                      >
                        Verify Mobile
                      </button>
                    </div>

                    <div className="p-4 border border-brand-green-100 rounded-xl bg-brand-cream-50/50 space-y-2">
                      <p className="text-xs font-bold text-brand-green-900 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-brand-gold-600" />
                        <span>Email Verification</span>
                      </p>
                      <p className="text-[11px] text-brand-green-700/80">
                        Dispatch passcode directly to inbox for address validation.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setVerifyPurpose('EmailChange');
                          setVerifyTargetIdentifier(user.email || 'vkchoudhary050607@gmail.com');
                          setShowSecurityVerify(true);
                          setVerifySuccessNotice('');
                        }}
                        className="w-full py-2 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                      >
                        Verify Email
                      </button>
                    </div>

                    <div className="p-4 border border-brand-green-100 rounded-xl bg-brand-cream-50/50 space-y-2">
                      <p className="text-xs font-bold text-brand-green-900 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-brand-gold-600" />
                        <span>Security Challenge</span>
                      </p>
                      <p className="text-[11px] text-brand-green-700/80">
                        Authenticate high-privilege operations with instant verification.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setVerifyPurpose('Login');
                          setVerifyTargetIdentifier(user.phone || user.email);
                          setShowSecurityVerify(true);
                          setVerifySuccessNotice('');
                        }}
                        className="w-full py-2 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold rounded-lg text-xs cursor-pointer transition-colors"
                      >
                        Run Challenge
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB: OVERVIEW STATS (ADMIN) */}
          {activeTab === 'admin-stats' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <LayoutDashboard className="w-5 h-5 text-green-600" />
                    <span>Store Operations & Financial Overview</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Real-time operational metrics and live inventory data.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-gradient-to-br from-green-50/80 to-blue-50/50 border border-green-100 p-5 rounded-2xl shadow-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-green-700">Expected Sales</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">₹{adminStats.salesTotal}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-100 p-5 rounded-2xl shadow-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-blue-700">Total Orders</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{adminStats.ordersCount}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/50 border border-amber-100 p-5 rounded-2xl shadow-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-amber-700">Average Cart</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">₹{adminStats.avgOrder}</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/50 border border-emerald-100 p-5 rounded-2xl shadow-xs">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">Active Catalog</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{adminStats.productsCount}</p>
                </div>
              </div>

              <div className="mt-8 border border-green-100 rounded-3xl bg-green-50/30 p-6 space-y-4 shadow-xs">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-green-100/80 pb-3">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span>Real-time Live Financial Integrity (Database Backed)</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center pt-1">
                  <div className="p-4 border border-green-100 rounded-2xl bg-white space-y-1 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-green-700 tracking-wider">Captured / Settled</span>
                    <p className="text-xl font-bold text-green-900">₹{adminStats.capturedPaymentsTotal}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Completed transactions</p>
                  </div>
                  <div className="p-4 border border-amber-100 rounded-2xl bg-white space-y-1 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Awaiting Settlement</span>
                    <p className="text-xl font-bold text-amber-900">₹{adminStats.pendingPaymentsTotal}</p>
                    <p className="text-[10px] text-slate-500 font-mono">COD / pending audits</p>
                  </div>
                  <div className="p-4 border border-rose-100 rounded-2xl bg-white space-y-1 shadow-xs">
                    <span className="text-[10px] uppercase font-bold text-rose-600 tracking-wider">Failed or Voided</span>
                    <p className="text-xl font-bold text-rose-700">₹{adminStats.failedPaymentsTotal}</p>
                    <p className="text-[10px] text-slate-500 font-mono">Cancelled or declined</p>
                  </div>
                </div>

                <div className="text-[11px] text-center text-slate-500 pt-1 font-mono">
                  Syncing with {adminStats.paymentsCount} transactions in active database ledger.
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAYMENTS LEDGER (ADMIN) */}
          {activeTab === 'admin-payments' && (() => {
            const filteredPayments = payments.filter(p => {
              if (adminPaymentFilter === 'paid' && p.status !== 'Paid') return false;
              if (adminPaymentFilter === 'pending' && p.status !== 'Pending') return false;
              if (adminPaymentFilter === 'failed' && p.status !== 'Failed') return false;

              if (adminPaymentSearch.trim()) {
                const q = adminPaymentSearch.toLowerCase().trim();
                const idMatch = (p.id || '').toLowerCase().includes(q);
                const orderIdMatch = (p.orderId || '').toLowerCase().includes(q);
                const emailMatch = (p.userEmail || '').toLowerCase().includes(q);
                const refMatch = (p.transactionReference || '').toLowerCase().includes(q);
                const methodMatch = (p.paymentMethod || '').toLowerCase().includes(q);
                return idMatch || orderIdMatch || emailMatch || refMatch || methodMatch;
              }
              return true;
            });

            const totalPages = Math.ceil(filteredPayments.length / adminPaymentPageSize) || 1;
            const validPage = Math.min(adminPaymentPage, totalPages);
            const paginatedPayments = filteredPayments.slice((validPage - 1) * adminPaymentPageSize, validPage * adminPaymentPageSize);

            const paidCount = payments.filter(p => p.status === 'Paid').length;
            const pendingCount = payments.filter(p => p.status === 'Pending').length;
            const failedCount = payments.filter(p => p.status === 'Failed').length;

            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-green-600" />
                      <span>Payments Transaction Audit Ledger</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Audit database-backed settlement events, reconcile gateway references, and verify manual transfers.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTriggerLiveRefresh}
                      disabled={isRefreshingData}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 via-green-600 to-green-700 hover:from-blue-700 hover:to-green-800 text-white rounded-2xl text-xs font-bold flex items-center gap-2 transition-all shadow-md shadow-green-500/20 cursor-pointer disabled:opacity-50"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isRefreshingData ? 'animate-spin' : ''}`} />
                      <span>{isRefreshingData ? 'Syncing...' : 'Sync Payments'}</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    <button
                      onClick={() => { setAdminPaymentFilter('all'); setAdminPaymentPage(1); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        adminPaymentFilter === 'all'
                          ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      All ({payments.length})
                    </button>
                    <button
                      onClick={() => { setAdminPaymentFilter('paid'); setAdminPaymentPage(1); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        adminPaymentFilter === 'paid'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      Paid ({paidCount})
                    </button>
                    <button
                      onClick={() => { setAdminPaymentFilter('pending'); setAdminPaymentPage(1); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        adminPaymentFilter === 'pending'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      Pending ({pendingCount})
                    </button>
                    <button
                      onClick={() => { setAdminPaymentFilter('failed'); setAdminPaymentPage(1); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        adminPaymentFilter === 'failed'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      Failed ({failedCount})
                    </button>
                  </div>

                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search TXID, Order, Email, Ref..."
                      value={adminPaymentSearch}
                      onChange={(e) => { setAdminPaymentSearch(e.target.value); setAdminPaymentPage(1); }}
                      className="w-full bg-white border border-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600"
                    />
                    {adminPaymentSearch && (
                      <button
                        onClick={() => setAdminPaymentSearch('')}
                        className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-700 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {loadingPayments ? (
                  <div className="text-center py-12 text-xs text-green-700 animate-pulse bg-white rounded-2xl border border-green-100 p-6 shadow-xs">
                    Querying live database-backed payment transactions...
                  </div>
                ) : filteredPayments.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
                    <p className="text-sm font-bold text-slate-900">No payment records found.</p>
                    <p className="text-xs text-slate-500">
                      {adminPaymentSearch ? `No records match "${adminPaymentSearch}"` : 'No transactions recorded under this filter.'}
                    </p>
                    {adminPaymentSearch && (
                      <button
                        onClick={() => { setAdminPaymentSearch(''); setAdminPaymentFilter('all'); }}
                        className="text-xs font-bold text-green-600 underline cursor-pointer"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div 
                      ref={adminPaymentsScrollRef}
                      className="max-h-[620px] overflow-y-auto pr-1.5 space-y-3.5 custom-scrollbar rounded-xl scroll-smooth"
                    >
                      {paginatedPayments.map((p) => {
                        const isEditing = editingPaymentId === p.id;
                        return (
                          <div key={p.id} className="border border-green-100 hover:border-green-300 bg-white p-5 rounded-2xl space-y-3 text-xs shadow-xs hover:shadow-md transition-all">
                            
                            <div className="flex justify-between items-start border-b border-slate-100 pb-2.5">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-slate-900 text-sm">{p.id}</span>
                                  <span className="text-[10px] text-green-700 font-bold uppercase bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                    {p.paymentMethod}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 font-mono mt-0.5">Order Reference: {p.orderId}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full font-bold uppercase text-[10px] ${
                                p.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                p.status === 'Failed' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {p.status}
                              </span>
                            </div>

                            {isEditing ? (
                              <form onSubmit={(e) => handleUpdatePaymentSubmit(e, p.id)} className="space-y-3 pt-1 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div className="space-y-1">
                                    <label className="font-bold text-slate-700">Payment Status</label>
                                    <select
                                      value={editPayStatus}
                                      onChange={(e) => setEditPayStatus(e.target.value as any)}
                                      className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600"
                                    >
                                      <option value="Pending">Pending</option>
                                      <option value="Paid">Paid</option>
                                      <option value="Failed">Failed / Declined</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="font-bold text-slate-700">Transaction Reference Code</label>
                                    <input
                                      type="text"
                                      value={editTxnRef}
                                      onChange={(e) => setEditTxnRef(e.target.value)}
                                      className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600"
                                      placeholder="TXN-ID / UTR / Reference"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-1">
                                  <button type="button" onClick={() => setEditingPaymentId(null)} className="px-3.5 py-1.5 border border-slate-200 rounded-xl text-xs font-bold hover:bg-slate-100 text-slate-700 cursor-pointer">Cancel</button>
                                  <button type="submit" className="px-4 py-1.5 bg-gradient-to-r from-blue-600 to-green-600 text-white font-bold rounded-xl text-xs shadow-xs cursor-pointer">Save Audit</button>
                                </div>
                              </form>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                                <div className="space-y-1">
                                  <p className="text-slate-500">Client Email: <span className="font-bold text-slate-900">{p.userEmail}</span></p>
                                  <p className="text-slate-500">Secured Amount: <span className="font-bold text-slate-900 text-sm">₹{p.amount}</span></p>
                                </div>
                                <div className="space-y-1 sm:text-right">
                                  <p className="text-slate-500">Channel: <span className="font-bold text-slate-900 uppercase">{p.paymentMethod}</span></p>
                                  <p className="text-slate-500">Gateway Ref: <span className="font-mono text-slate-900 font-bold">{p.transactionReference || 'N/A'}</span></p>
                                </div>
                              </div>
                            )}

                            {!isEditing && (
                              <div className="flex justify-between items-center pt-2.5 border-t border-slate-100">
                                <span className="text-[10px] text-slate-400 font-mono">Timestamp: {new Date(p.createdAt).toLocaleString()}</span>
                                <button
                                  onClick={() => {
                                    setEditingPaymentId(p.id);
                                    setEditTxnRef(p.transactionReference || '');
                                    setEditPayStatus(p.status);
                                  }}
                                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold cursor-pointer transition-colors shadow-2xs"
                                >
                                  Edit Audit Status
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {filteredPayments.length > 0 && (
                      <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 px-1 z-10 border-t border-brand-green-600/10 rounded-b-xl">
                        <Pagination
                          currentPage={validPage}
                          totalItems={filteredPayments.length}
                          pageSize={adminPaymentPageSize}
                          onPageChange={(p) => {
                            setAdminPaymentPage(p);
                            adminPaymentsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          onPageSizeChange={(s) => {
                            setAdminPaymentPageSize(s);
                            setAdminPaymentPage(1);
                            adminPaymentsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          pageSizeOptions={[5, 10, 20, 50]}
                          itemLabel="transactions"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: REMEDIES CATALOG CRUD (ADMIN) */}
          {activeTab === 'admin-catalog' && (() => {
            // Filter and search catalog
            const filteredCatalog = products.filter(prod => {
              if (adminCatalogCategory && prod.category !== adminCatalogCategory) return false;
              
              if (adminCatalogStockFilter === 'in-stock' && prod.stock <= 0) return false;
              if (adminCatalogStockFilter === 'low-stock') {
                const limit = prod.lowStockAlertLimit || 10;
                if (prod.stock > limit || prod.stock <= 0) return false;
              }
              if (adminCatalogStockFilter === 'out-of-stock' && prod.stock > 0) return false;

              if (adminCatalogSearch.trim()) {
                const q = adminCatalogSearch.toLowerCase().trim();
                const nameMatch = (prod.name || '').toLowerCase().includes(q);
                const skuMatch = (prod.sku || '').toLowerCase().includes(q);
                const brandMatch = (prod.brand || '').toLowerCase().includes(q);
                const catMatch = (prod.category || '').toLowerCase().includes(q);
                return nameMatch || skuMatch || brandMatch || catMatch;
              }
              return true;
            });

            const totalPages = Math.ceil(filteredCatalog.length / adminCatalogPageSize) || 1;
            const validPage = Math.min(adminCatalogPage, totalPages);
            const paginatedCatalog = filteredCatalog.slice((validPage - 1) * adminCatalogPageSize, validPage * adminCatalogPageSize);

            const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockAlertLimit || 10)).length;
            const outOfStockCount = products.filter(p => p.stock <= 0).length;

            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-green-600" />
                      <span>Remedies Catalog & Formulation Registry</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Configure botanical ingredients, pricing, image galleries, dosha benefits, and inventory levels.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button 
                      onClick={() => setShowAddProd(!showAddProd)}
                      className="bg-gradient-to-r from-blue-600 via-green-600 to-green-700 hover:from-blue-700 hover:to-green-800 text-white font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-md shadow-green-500/20 cursor-pointer transition-all uppercase tracking-wider"
                    >
                      <Plus className="w-4 h-4 text-white" />
                      <span>{showAddProd ? 'Close Editor' : 'Add New Compound'}</span>
                    </button>
                  </div>
                </div>

                {/* Filter and Search Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    <button
                      onClick={() => { setAdminCatalogStockFilter('all'); setAdminCatalogPage(1); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        adminCatalogStockFilter === 'all'
                          ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      All Products ({products.length})
                    </button>
                    <button
                      onClick={() => { setAdminCatalogStockFilter('in-stock'); setAdminCatalogPage(1); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        adminCatalogStockFilter === 'in-stock'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      In Stock ({products.filter(p => p.stock > (p.lowStockAlertLimit || 10)).length})
                    </button>
                    <button
                      onClick={() => { setAdminCatalogStockFilter('low-stock'); setAdminCatalogPage(1); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        adminCatalogStockFilter === 'low-stock'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      Low Stock ({lowStockCount})
                    </button>
                    <button
                      onClick={() => { setAdminCatalogStockFilter('out-of-stock'); setAdminCatalogPage(1); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        adminCatalogStockFilter === 'out-of-stock'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      Out of Stock ({outOfStockCount})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={adminCatalogCategory}
                      onChange={(e) => { setAdminCatalogCategory(e.target.value); setAdminCatalogPage(1); }}
                      className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600"
                    >
                      <option value="">All Categories</option>
                      <option value="Immunity">Immunity</option>
                      <option value="Skin Care">Skin Care</option>
                      <option value="Hair Care">Hair Care</option>
                      <option value="Digestion">Digestion</option>
                      <option value="Diabetes">Diabetes</option>
                      <option value="Joint Care">Joint Care</option>
                      <option value="Women's Health">Women's Health</option>
                      <option value="Men's Health">Men's Health</option>
                      <option value="Brain & Memory">Brain & Memory</option>
                      <option value="Sleep & Stress">Sleep & Stress</option>
                      <option value="Sexual Wellness">Sexual Wellness</option>
                      <option value="Liver & Detox">Liver & Detox</option>
                      <option value="Heart Health">Heart Health</option>
                      <option value="Respiratory Care">Respiratory Care</option>
                    </select>

                    <div className="relative min-w-[200px]">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search name, SKU, brand..."
                        value={adminCatalogSearch}
                        onChange={(e) => { setAdminCatalogSearch(e.target.value); setAdminCatalogPage(1); }}
                        className="w-full bg-white border border-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600"
                      />
                      {adminCatalogSearch && (
                        <button
                          onClick={() => setAdminCatalogSearch('')}
                          className="absolute right-2.5 top-1.5 text-xs text-slate-400 hover:text-slate-700 font-bold"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Add/Edit Product Inline Form */}
                {showAddProd && (
                  <form onSubmit={handleSaveProduct} className="bg-slate-50/90 border border-green-200 p-6 rounded-3xl space-y-4 text-xs shadow-md">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                      <h4 className="text-base font-bold text-slate-900">{editProdId ? 'Edit Product Details' : 'Add New Remedy Compound'}</h4>
                      <button
                        type="button"
                        onClick={handleResetProductForm}
                        className="text-xs text-slate-500 hover:text-slate-800 font-bold underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1 sm:col-span-1">
                        <label className="font-bold text-slate-700">Product Name</label>
                        <input required type="text" value={prodName} onChange={e => setProdName(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" />
                      </div>
                      <div className="space-y-1 sm:col-span-1">
                        <label className="font-bold text-slate-700">SKU / Item Code</label>
                        <input type="text" placeholder="E.g. GL-1001" value={prodSku} onChange={e => setProdSku(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded-xl font-mono text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" />
                      </div>
                      <div className="space-y-1 sm:col-span-1">
                        <label className="font-bold text-slate-700">Category</label>
                        <select value={prodCategory} onChange={e => setProdCategory(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600">
                          <option value="Immunity">Immunity</option>
                          <option value="Skin Care">Skin Care</option>
                          <option value="Hair Care">Hair Care</option>
                          <option value="Digestion">Digestion</option>
                          <option value="Diabetes">Diabetes</option>
                          <option value="Joint Care">Joint Care</option>
                          <option value="Women's Health">Women's Health</option>
                          <option value="Men's Health">Men's Health</option>
                          <option value="Brain & Memory">Brain & Memory</option>
                          <option value="Sleep & Stress">Sleep & Stress</option>
                          <option value="Sexual Wellness">Sexual Wellness</option>
                          <option value="Liver & Detox">Liver & Detox</option>
                          <option value="Heart Health">Heart Health</option>
                          <option value="Respiratory Care">Respiratory Care</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Brand</label>
                        <input required type="text" value={prodBrand} onChange={e => setProdBrand(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Subcategory (Optional)</label>
                        <input type="text" placeholder="E.g. Herbal Drops, Oils" value={prodSubcategory} onChange={e => setProdSubcategory(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Price (₹)</label>
                        <input required type="number" value={prodPrice} onChange={e => setProdPrice(Number(e.target.value))} className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Original Price (₹)</label>
                        <input required type="number" value={prodOrigPrice} onChange={e => setProdOrigPrice(Number(e.target.value))} className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Stock Count</label>
                        <input required type="number" value={prodStock} onChange={e => setProdStock(Number(e.target.value))} className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" />
                      </div>
                    </div>

                    <div className="bg-white border border-green-100 p-4 rounded-2xl space-y-3 shadow-2xs">
                      <span className="block font-bold text-slate-900 text-xs uppercase tracking-wider">Product Visuals (Image Gallery)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-700">Primary Image URL</label>
                          <input type="text" placeholder="https://..." value={prodImg} onChange={e => setProdImg(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" />
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-700">Second Image URL (Optional)</label>
                          <input type="text" placeholder="https://..." value={prodImg2} onChange={e => setProdImg2(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" />
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-700">Third Image URL (Optional)</label>
                          <input type="text" placeholder="https://..." value={prodImg3} onChange={e => setProdImg3(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" />
                        </div>
                        <div className="space-y-1">
                          <label className="font-semibold text-slate-700">Fourth Image URL (Optional)</label>
                          <input type="text" placeholder="https://..." value={prodImg4} onChange={e => setProdImg4(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Dosage</label>
                        <input type="text" placeholder="E.g. Take 1 capsule daily" value={prodDosage} onChange={e => setProdDosage(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Usage Instructions</label>
                        <input type="text" placeholder="E.g. With warm water after meal" value={prodUsageInstructions} onChange={e => setProdUsageInstructions(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Low Stock Limit Alert</label>
                        <input type="number" value={prodLowStockAlertLimit} onChange={e => setProdLowStockAlertLimit(Number(e.target.value))} className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" />
                      </div>
                    </div>

                    <div className="flex gap-6 items-center bg-white p-3.5 rounded-2xl border border-slate-200">
                      <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer select-none">
                        <input type="checkbox" checked={prodFeatured} onChange={e => setProdFeatured(e.target.checked)} className="w-4 h-4 rounded text-green-600 focus:ring-green-500" />
                        <span>Featured Remedy</span>
                      </label>
                      <label className="flex items-center gap-2 font-bold text-slate-800 cursor-pointer select-none">
                        <input type="checkbox" checked={prodBestSeller} onChange={e => setProdBestSeller(e.target.checked)} className="w-4 h-4 rounded text-green-600 focus:ring-green-500" />
                        <span>Best Seller Tag</span>
                      </label>
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Health Benefits (Comma separated)</label>
                      <input type="text" placeholder="Boosts immunity, Relieves fatigue, Rejuvenates cells" value={prodBenefits} onChange={e => setProdBenefits(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" />
                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700">Description</label>
                      <textarea required rows={3} value={prodDesc} onChange={e => setProdDesc(e.target.value)} className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" />
                    </div>

                    {/* Botanical Ingredients Section */}
                    <div className="bg-white border border-green-100 p-4 rounded-2xl space-y-3.5 shadow-2xs">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-900 text-xs">Vedic Botanical Ingredients ({prodIngredients.length})</span>
                      </div>

                      {prodIngredients.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {prodIngredients.map((ing, index) => (
                            <div key={index} className="flex justify-between items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-900 block">{ing.name}</span>
                                <span className="text-[11px] text-slate-500 block">{ing.description}</span>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveIngredient(index)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                        <span className="block font-semibold text-slate-800 text-[11px]">Add Botanical Ingredient</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <input 
                            type="text" 
                            placeholder="Ingredient Name (e.g. Ashwagandha)" 
                            value={ingName} 
                            onChange={e => setIngName(e.target.value)} 
                            className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" 
                          />
                          <input 
                            type="text" 
                            placeholder="Description / Benefit (e.g. Adapts to stress)" 
                            value={ingDesc} 
                            onChange={e => setIngDesc(e.target.value)} 
                            className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" 
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={handleAddIngredient}
                          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 ml-auto cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Ingredient</span>
                        </button>
                      </div>
                    </div>

                    {/* Product FAQs Section */}
                    <div className="bg-white border border-green-100 p-4 rounded-2xl space-y-3.5 shadow-2xs">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="font-bold text-slate-900 text-xs">Product FAQs ({prodFaqs.length})</span>
                      </div>

                      {prodFaqs.length > 0 && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                          {prodFaqs.map((faq, index) => (
                            <div key={index} className="flex justify-between items-start gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                              <div className="space-y-0.5">
                                <span className="font-bold text-slate-900 block">Q: {faq.question}</span>
                                <span className="text-[11px] text-slate-500 block">A: {faq.answer}</span>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => handleRemoveFaq(index)}
                                className="text-red-500 hover:text-red-700 p-1 rounded-md hover:bg-red-50 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                        <span className="block font-semibold text-slate-800 text-[11px]">Add FAQ Item</span>
                        <div className="space-y-2.5">
                          <input 
                            type="text" 
                            placeholder="Question (e.g. Can I take this with milk?)" 
                            value={faqQ} 
                            onChange={e => setFaqQ(e.target.value)} 
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" 
                          />
                          <textarea 
                            rows={2} 
                            placeholder="Answer (e.g. Yes, warm milk is highly recommended.)" 
                            value={faqA} 
                            onChange={e => setFaqA(e.target.value)} 
                            className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600" 
                          />
                        </div>
                        <button 
                          type="button" 
                          onClick={handleAddFaq}
                          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-3.5 py-1.5 rounded-xl font-bold flex items-center gap-1.5 ml-auto cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add FAQ</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2 border-t border-slate-200">
                      <button type="button" onClick={handleResetProductForm} className="px-4 py-2 border border-slate-200 rounded-xl font-bold hover:bg-slate-100 text-slate-700 cursor-pointer">Cancel</button>
                      <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-blue-600 via-green-600 to-green-700 hover:from-blue-700 hover:to-green-800 text-white font-bold rounded-xl cursor-pointer shadow-md shadow-green-500/20">Save Compound</button>
                    </div>
                  </form>
                )}

                {/* Products Catalog list */}
                {filteredCatalog.length === 0 ? (
                  <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
                    <p className="text-sm font-bold text-slate-900">No remedies match the filter.</p>
                    <p className="text-xs text-slate-500">Try selecting a different category or clearing search.</p>
                    {(adminCatalogSearch || adminCatalogCategory || adminCatalogStockFilter !== 'all') && (
                      <button
                        onClick={() => { setAdminCatalogSearch(''); setAdminCatalogCategory(''); setAdminCatalogStockFilter('all'); }}
                        className="text-xs font-bold text-green-600 underline cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div 
                      ref={adminCatalogScrollRef}
                      className="max-h-[620px] overflow-y-auto pr-1.5 space-y-3 custom-scrollbar rounded-xl scroll-smooth"
                    >
                      {paginatedCatalog.map(prod => {
                        const isLowStock = prod.stock > 0 && prod.stock <= (prod.lowStockAlertLimit || 10);
                        const isOutOfStock = prod.stock <= 0;

                        return (
                          <div key={prod.id} className="border border-green-100 bg-white hover:border-green-300 hover:shadow-md p-4.5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs shadow-xs transition-all">
                            <div className="flex items-center gap-3.5 min-w-0">
                              <img src={prod.mainImage} alt={prod.name} className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border border-slate-100 bg-slate-50 shadow-2xs" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="font-bold text-slate-900 text-sm">{prod.name}</h5>
                                  {prod.sku && (
                                    <span className="text-[10px] font-mono bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                                      SKU: {prod.sku}
                                    </span>
                                  )}
                                  {prod.featured && (
                                    <span className="text-[10px] font-bold bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full border border-violet-200">
                                      Featured
                                    </span>
                                  )}
                                  {prod.bestSeller && (
                                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                                      Best Seller
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 mt-1 flex-wrap">
                                  <span className="font-semibold text-green-700">{prod.category}</span>
                                  <span>•</span>
                                  <span className="font-bold text-slate-900 text-sm">₹{prod.price}</span>
                                  {prod.originalPrice > prod.price && (
                                    <span className="text-slate-400 line-through text-[11px]">₹{prod.originalPrice}</span>
                                  )}
                                  <span>•</span>
                                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                                    isOutOfStock ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                    isLowStock ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                                    'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {isOutOfStock ? 'Out of Stock (0)' : isLowStock ? `Low Stock (${prod.stock})` : `Stock: ${prod.stock}`}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                              <button 
                                onClick={() => handleEditProductOpen(prod)}
                                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                                title="Edit Details"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-green-600" />
                                <span>Edit</span>
                              </button>
                              <button 
                                onClick={() => onDeleteProduct(prod.id)}
                                className="px-3.5 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs"
                                title="Delete Compound"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {filteredCatalog.length > 0 && (
                      <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 px-1 z-10 border-t border-brand-green-600/10 rounded-b-xl">
                        <Pagination
                          currentPage={validPage}
                          totalItems={filteredCatalog.length}
                          pageSize={adminCatalogPageSize}
                          onPageChange={(p) => {
                            setAdminCatalogPage(p);
                            adminCatalogScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          onPageSizeChange={(s) => {
                            setAdminCatalogPageSize(s);
                            setAdminCatalogPage(1);
                            adminCatalogScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          pageSizeOptions={[6, 12, 24, 48]}
                          itemLabel="remedies"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: ALL ORDERS DISPATCH REGISTRY (ADMIN/OWNER) */}
          {activeTab === 'admin-orders' && (() => {
            const pendingOrdersCount = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
            const deliveredOrdersCount = orders.filter(o => o.status === 'Delivered').length;
            const cancelledOrdersCount = orders.filter(o => o.status === 'Cancelled').length;

            // Apply filter & search
            const filteredOrders = orders.filter(o => {
              // Status tab filter
              if (adminOrderFilter === 'pending' && !(o.status === 'Pending' || o.status === 'Processing')) return false;
              if (adminOrderFilter === 'delivered' && o.status !== 'Delivered') return false;
              if (adminOrderFilter === 'cancelled' && o.status !== 'Cancelled') return false;

              // Search query filter
              if (adminOrderSearch.trim()) {
                const q = adminOrderSearch.toLowerCase().trim();
                const idMatch = (o.id || '').toLowerCase().includes(q);
                const nameMatch = (o.userName || '').toLowerCase().includes(q);
                const emailMatch = (o.userEmail || '').toLowerCase().includes(q);
                const phoneMatch = (o.shippingAddress?.phone || '').includes(q);
                return idMatch || nameMatch || emailMatch || phoneMatch;
              }
              return true;
            }).sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

            const totalPages = Math.ceil(filteredOrders.length / adminOrderPageSize) || 1;
            const validPage = Math.min(adminOrderPage, totalPages);
            const paginatedOrders = filteredOrders.slice((validPage - 1) * adminOrderPageSize, validPage * adminOrderPageSize);

            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                      👑 Platform Owner Command
                    </span>
                    <h3 className="text-xl font-bold text-slate-900 mt-1.5 flex items-center gap-2">
                      <span>Live Customer Orders Dispatch Registry</span>
                      {isRefreshingData && (
                        <span className="text-[11px] font-sans font-normal text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full animate-pulse border border-green-200">
                          Updating Live...
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Manage order fulfillment, verify payments, track pending dispatches, and mark completed deliveries.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTriggerLiveRefresh}
                      disabled={isRefreshingData}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 via-green-600 to-green-700 hover:from-blue-700 hover:to-green-800 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md shadow-green-500/20 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${isRefreshingData ? 'animate-spin' : ''}`} />
                      <span>{isRefreshingData ? 'Refreshing Live...' : 'Refresh Orders'}</span>
                    </button>
                  </div>
                </div>

                {/* Top Overview Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <button
                    onClick={() => { setAdminOrderFilter('all'); setAdminOrderPage(1); }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      adminOrderFilter === 'all'
                        ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white border-transparent shadow-md ring-2 ring-green-400'
                        : 'bg-white text-slate-900 border-slate-200 hover:border-green-300 shadow-2xs'
                    }`}
                  >
                    <p className={`text-[10px] uppercase font-bold tracking-wider ${adminOrderFilter === 'all' ? 'text-green-100' : 'text-slate-500'}`}>Total Orders</p>
                    <p className="text-2xl font-bold mt-1">{orders.length}</p>
                  </button>

                  <button
                    onClick={() => { setAdminOrderFilter('pending'); setAdminOrderPage(1); }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      adminOrderFilter === 'pending'
                        ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-2 ring-amber-400'
                        : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:border-amber-400 shadow-2xs'
                    }`}
                  >
                    <p className="text-[10px] uppercase font-bold tracking-wider text-amber-700">Pending / Incomplete</p>
                    <p className="text-2xl font-bold mt-1 flex items-center justify-between">
                      <span>{pendingOrdersCount}</span>
                      {pendingOrdersCount > 0 && (
                        <span className="text-[10px] bg-amber-800/30 px-2 py-0.5 rounded-full font-sans">Needs Dispatch</span>
                      )}
                    </p>
                  </button>

                  <button
                    onClick={() => { setAdminOrderFilter('delivered'); setAdminOrderPage(1); }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      adminOrderFilter === 'delivered'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500'
                        : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:border-emerald-400 shadow-2xs'
                    }`}
                  >
                    <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-700">Completed / Delivered</p>
                    <p className="text-2xl font-bold mt-1 flex items-center justify-between">
                      <span>{deliveredOrdersCount}</span>
                      <span className="text-[10px] bg-emerald-800/30 px-2 py-0.5 rounded-full font-sans">✓ Fulfilled</span>
                    </p>
                  </button>

                  <button
                    onClick={() => { setAdminOrderFilter('cancelled'); setAdminOrderPage(1); }}
                    className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      adminOrderFilter === 'cancelled'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-md ring-2 ring-rose-400'
                        : 'bg-rose-50/70 text-rose-900 border-rose-200 hover:border-rose-300 shadow-2xs'
                    }`}
                  >
                    <p className="text-[10px] uppercase font-bold tracking-wider text-rose-700">Cancelled</p>
                    <p className="text-2xl font-bold mt-1">{cancelledOrdersCount}</p>
                  </button>
                </div>

                {/* Filter Tabs Bar & Live Search Input */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    <button
                      onClick={() => { setAdminOrderFilter('all'); setAdminOrderPage(1); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        adminOrderFilter === 'all'
                          ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      All Orders ({orders.length})
                    </button>
                    <button
                      onClick={() => { setAdminOrderFilter('pending'); setAdminOrderPage(1); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                        adminOrderFilter === 'pending'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
                      }`}
                    >
                      <span>⏳ Incomplete / Pending</span>
                      <span className="bg-amber-900/20 px-1.5 py-0.2 text-[10px] rounded-full">{pendingOrdersCount}</span>
                    </button>
                    <button
                      onClick={() => { setAdminOrderFilter('delivered'); setAdminOrderPage(1); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                        adminOrderFilter === 'delivered'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      <span>✓ Completed / Delivered</span>
                      <span className="bg-emerald-900/20 px-1.5 py-0.2 text-[10px] rounded-full">{deliveredOrdersCount}</span>
                    </button>
                    <button
                      onClick={() => { setAdminOrderFilter('cancelled'); setAdminOrderPage(1); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                        adminOrderFilter === 'cancelled'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      Cancelled ({cancelledOrdersCount})
                    </button>
                  </div>

                  {/* Search box */}
                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search ID, name, phone, email..."
                      value={adminOrderSearch}
                      onChange={(e) => { setAdminOrderSearch(e.target.value); setAdminOrderPage(1); }}
                      className="w-full bg-white border border-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600"
                    />
                    {adminOrderSearch && (
                      <button
                        onClick={() => { setAdminOrderSearch(''); setAdminOrderPage(1); }}
                        className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-700 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                  <div className="p-10 bg-white border border-slate-200 rounded-3xl text-center space-y-3 shadow-xs">
                    <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-base font-bold text-slate-900">No matching orders found.</p>
                    <p className="text-xs text-slate-500">
                      {adminOrderSearch
                        ? `No order records matched "${adminOrderSearch}". Try clearing search.`
                        : adminOrderFilter === 'pending'
                        ? 'Great job! All customer orders are dispatched and fulfilled.'
                        : 'No orders fall into this filter category.'}
                    </p>
                    {(adminOrderSearch || adminOrderFilter !== 'all') && (
                      <button
                        onClick={() => { setAdminOrderFilter('all'); setAdminOrderSearch(''); setAdminOrderPage(1); }}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:from-blue-700 hover:to-green-700 transition-all shadow-xs"
                      >
                        Reset All Filters
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div 
                      ref={adminOrdersScrollRef}
                      className="max-h-[640px] overflow-y-auto pr-1.5 space-y-4 custom-scrollbar rounded-xl scroll-smooth"
                    >
                      {paginatedOrders.map(ord => {
                      const isDelivered = ord.status === 'Delivered';
                      const isPending = ord.status === 'Pending' || ord.status === 'Processing';
                      const isShipped = ord.status === 'Shipped';
                      const isCancelled = ord.status === 'Cancelled';

                      // Container border and badge theme styling
                      let cardBorderClass = 'border-slate-200 bg-white shadow-xs';
                      let headerBgClass = 'bg-slate-50/80 border-slate-200';
                      let statusBadge = (
                        <span className="bg-amber-500 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                          <Clock className="w-3 h-3" /> Pending Processing
                        </span>
                      );

                      if (isDelivered) {
                        cardBorderClass = 'border-emerald-200 bg-white shadow-xs';
                        headerBgClass = 'bg-emerald-50/70 border-emerald-100';
                        statusBadge = (
                          <span className="bg-emerald-600 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> ✓ Delivered & Completed
                          </span>
                        );
                      } else if (isShipped) {
                        cardBorderClass = 'border-blue-200 bg-white shadow-xs';
                        headerBgClass = 'bg-blue-50/70 border-blue-100';
                        statusBadge = (
                          <span className="bg-blue-600 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                            <Truck className="w-3.5 h-3.5" /> 🚚 Dispatched / In Transit
                          </span>
                        );
                      } else if (isCancelled) {
                        cardBorderClass = 'border-rose-200 bg-white shadow-xs';
                        headerBgClass = 'bg-rose-50/70 border-rose-100';
                        statusBadge = (
                          <span className="bg-rose-600 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs">
                            <AlertCircle className="w-3.5 h-3.5" /> ✕ Order Cancelled
                          </span>
                        );
                      } else {
                        // Pending
                        cardBorderClass = 'border-amber-200 bg-white shadow-xs';
                        headerBgClass = 'bg-amber-50/70 border-amber-100';
                        statusBadge = (
                          <span className="bg-amber-600 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-2xs animate-pulse">
                            <Clock className="w-3.5 h-3.5" /> ⏳ Pending Action (Incomplete)
                          </span>
                        );
                      }

                      return (
                        <div key={ord.id} className={`border p-5 rounded-3xl space-y-4 text-xs transition-all hover:shadow-md ${cardBorderClass}`}>
                          
                          {/* Banner Header with distinct background per status */}
                          <div className={`p-3.5 -mx-5 -mt-5 rounded-t-3xl border-b flex flex-wrap justify-between items-center gap-3 ${headerBgClass}`}>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                                ID: {ord.id}
                              </span>
                              <span className="text-slate-600 text-[11px] font-semibold">{ord.orderDate}</span>
                            </div>

                            <div className="flex items-center gap-2.5 flex-wrap">
                              {statusBadge}
                              <span className="text-base font-bold text-slate-900 bg-white px-3 py-0.5 rounded-lg border border-slate-200 shadow-2xs">
                                Total: ₹{ord.finalTotal}
                              </span>
                            </div>
                          </div>

                          {/* Customer Details & Shipping Address Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">👤 Customer Identity</p>
                              <p className="font-bold text-slate-900 text-sm">{ord.userName}</p>
                              <p className="text-slate-600">{ord.userEmail}</p>
                              {ord.shippingAddress?.phone && (
                                <p className="font-mono font-bold text-slate-900 mt-1 flex items-center gap-1">
                                  📞 Mob: {ord.shippingAddress.phone}
                                </p>
                              )}
                            </div>

                            <div className="space-y-1">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">📍 Delivery Destination Address</p>
                              {ord.shippingAddress ? (
                                <div className="text-slate-800 space-y-0.5">
                                  <p className="font-semibold">{ord.shippingAddress.fullName}</p>
                                  <p>{ord.shippingAddress.addressLine1} {ord.shippingAddress.addressLine2 ? `, ${ord.shippingAddress.addressLine2}` : ''}</p>
                                  <p>{ord.shippingAddress.city}, {ord.shippingAddress.state} - <span className="font-mono font-bold">{ord.shippingAddress.zipCode}</span></p>
                                </div>
                              ) : (
                                <p className="text-slate-400 italic">Address details included in profile</p>
                              )}
                            </div>
                          </div>

                          {/* Items Ordered List */}
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">📦 Items Purchased ({ord.items?.length || 0})</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {ord.items?.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-3 p-2.5 border border-slate-100 rounded-xl bg-white shadow-2xs">
                                  {item.mainImage && (
                                    <img src={item.mainImage} alt={item.productName} className="w-10 h-10 object-cover rounded-lg shrink-0 border border-slate-100" />
                                  )}
                                  <div className="min-w-0 text-xs">
                                    <p className="font-bold text-slate-900 truncate">{item.productName}</p>
                                    <p className="text-green-700 font-mono text-[11px]">Qty: {item.quantity} × ₹{item.price}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Interactive Controls & Status Selectors */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                            {/* Order delivery status selection */}
                            <div className="space-y-1">
                              <label className="font-bold text-slate-700 text-[11px]">Dispatch Tracking Status</label>
                              <select
                                value={ord.status}
                                onChange={(e) => onUpdateStatus(ord.id, e.target.value as any, ord.paymentStatus)}
                                className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-green-500/20 focus:border-green-600 focus:outline-none"
                              >
                                <option value="Pending">Pending Processing</option>
                                <option value="Processing">Processing / Handcrafted</option>
                                <option value="Shipped">Shipped / Dispatched</option>
                                <option value="Delivered">Delivered Successfully</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>

                            {/* Payment status selection */}
                            <div className="space-y-1">
                              <label className="font-bold text-slate-700 text-[11px]">Payment Audit Status</label>
                              <select
                                value={ord.paymentStatus}
                                onChange={(e) => onUpdateStatus(ord.id, ord.status, e.target.value as any)}
                                className="w-full bg-white border border-slate-200 p-2 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-green-500/20 focus:border-green-600 focus:outline-none"
                              >
                                <option value="Pending">Pending Payment</option>
                                <option value="Paid">Paid Successfully (Audit Verified)</option>
                                <option value="Failed">Failed / Payment Declined</option>
                              </select>
                            </div>
                          </div>

                          {/* One-Click Quick Action Bar */}
                          <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-2 flex-wrap">
                              {!isDelivered && (
                                <button
                                  onClick={() => onUpdateStatus(ord.id, 'Delivered', 'Paid')}
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Quick Fulfill: Mark Delivered & Paid</span>
                                </button>
                              )}

                              {!isShipped && !isDelivered && (
                                <button
                                  onClick={() => onUpdateStatus(ord.id, 'Shipped', ord.paymentStatus)}
                                  className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Mark Shipped</span>
                                </button>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-wrap ml-auto">
                              <button
                                onClick={() => setInvoiceOrder(ord)}
                                className="px-3.5 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                              >
                                <FileText className="w-3.5 h-3.5 text-blue-600" />
                                <span>Print Bill Invoice</span>
                              </button>
                              <button
                                onClick={() => setShippingLabelOrder(ord)}
                                className="px-3.5 py-1.5 rounded-xl border border-green-200 hover:border-green-300 text-green-800 bg-green-50 hover:bg-green-100 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                              >
                                <Tag className="w-3.5 h-3.5 text-green-700" />
                                <span>Print Courier Shipping Label</span>
                              </button>
                            </div>
                          </div>

                        </div>
                      );
                    })}
                    </div>

                    {/* Orders Pagination */}
                    {filteredOrders.length > 0 && (
                      <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 px-1 z-10 border-t border-slate-100 rounded-b-xl">
                        <Pagination
                          currentPage={validPage}
                          totalItems={filteredOrders.length}
                          pageSize={adminOrderPageSize}
                          onPageChange={(p) => {
                            setAdminOrderPage(p);
                            adminOrdersScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          onPageSizeChange={(s) => {
                            setAdminOrderPageSize(s);
                            setAdminOrderPage(1);
                            adminOrdersScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          pageSizeOptions={[5, 10, 20, 50]}
                          itemLabel="orders"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: COUPONS MANAGEMENT (ADMIN) */}
          {activeTab === 'admin-coupons' && (() => {
            const filteredCoupons = coupons.filter(cpn => {
              if (adminCouponStatus === 'active' && !cpn.active) return false;
              if (adminCouponStatus === 'archived' && cpn.active) return false;
              if (adminCouponSearch.trim()) {
                const q = adminCouponSearch.toLowerCase().trim();
                const codeMatch = (cpn.code || '').toLowerCase().includes(q);
                const descMatch = String(cpn.value).includes(q) || String(cpn.minOrderValue).includes(q);
                return codeMatch || descMatch;
              }
              return true;
            });

            const totalPages = Math.ceil(filteredCoupons.length / adminCouponPageSize) || 1;
            const validPage = Math.min(adminCouponPage, totalPages);
            const paginatedCoupons = filteredCoupons.slice((validPage - 1) * adminCouponPageSize, validPage * adminCouponPageSize);

            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <Tag className="w-5 h-5 text-green-600" />
                      <span>Promotional Coupons & Discounts</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Configure custom promo codes, discount percentages, and minimum order requirements.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleTriggerLiveRefresh}
                      disabled={isRefreshingData}
                      className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-2xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshingData ? 'animate-spin' : ''}`} />
                      <span>{isRefreshingData ? 'Refreshing...' : 'Refresh'}</span>
                    </button>

                    <button 
                      onClick={() => setShowAddCpn(!showAddCpn)}
                      className="bg-gradient-to-r from-blue-600 via-green-600 to-green-700 hover:from-blue-700 hover:to-green-800 text-white font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 shadow-md shadow-green-500/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create Coupon</span>
                    </button>
                  </div>
                </div>

                {/* Add Coupon form inline */}
                {showAddCpn && (
                  <form onSubmit={handleAddCouponSubmit} className="bg-slate-50/80 border border-slate-200 p-5 rounded-3xl space-y-4 text-xs shadow-xs animate-in fade-in">
                    <h4 className="font-bold text-slate-900 text-sm">Create New Promo Code</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Coupon Code (Uppercase)</label>
                        <input required type="text" placeholder="E.g. AYUR20" value={cpnCode} onChange={e => setCpnCode(e.target.value.toUpperCase())} className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-green-500/20 focus:border-green-600 focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Discount Rate (%)</label>
                        <input required type="number" min="1" max="90" value={cpnVal} onChange={e => setCpnVal(Number(e.target.value))} className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:ring-2 focus:ring-green-500/20 focus:border-green-600 focus:outline-none" />
                      </div>
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700">Minimum Order Subtotal (₹)</label>
                        <input required type="number" min="0" value={cpnMin} onChange={e => setCpnMin(Number(e.target.value))} className="w-full bg-white border border-slate-200 p-2.5 rounded-xl text-xs font-bold focus:ring-2 focus:ring-green-500/20 focus:border-green-600 focus:outline-none" />
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <button type="button" onClick={() => setShowAddCpn(false)} className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl font-bold cursor-pointer hover:bg-white transition-all">Cancel</button>
                      <button type="submit" className="px-5 py-2 bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white font-bold rounded-xl shadow-xs cursor-pointer transition-all">Save & Deploy Coupon</button>
                    </div>
                  </form>
                )}

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { setAdminCouponStatus('all'); setAdminCouponPage(1); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        adminCouponStatus === 'all'
                          ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      All ({coupons.length})
                    </button>
                    <button
                      onClick={() => { setAdminCouponStatus('active'); setAdminCouponPage(1); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        adminCouponStatus === 'active'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                      }`}
                    >
                      Active ({coupons.filter(c => c.active).length})
                    </button>
                    <button
                      onClick={() => { setAdminCouponStatus('archived'); setAdminCouponPage(1); }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        adminCouponStatus === 'archived'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                      }`}
                    >
                      Archived ({coupons.filter(c => !c.active).length})
                    </button>
                  </div>

                  <div className="relative min-w-[200px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search code or value..."
                      value={adminCouponSearch}
                      onChange={(e) => { setAdminCouponSearch(e.target.value); setAdminCouponPage(1); }}
                      className="w-full bg-white border border-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600"
                    />
                    {adminCouponSearch && (
                      <button
                        onClick={() => { setAdminCouponSearch(''); setAdminCouponPage(1); }}
                        className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-700 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Coupons list */}
                {filteredCoupons.length === 0 ? (
                  <div className="p-8 bg-white border border-slate-200 rounded-3xl text-center space-y-2 shadow-xs">
                    <p className="text-sm font-bold text-slate-900">No coupons match your criteria.</p>
                    <p className="text-xs text-slate-500">Create a coupon or adjust your active search filters.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div 
                      ref={adminCouponsScrollRef}
                      className="max-h-[600px] overflow-y-auto pr-1.5 space-y-3 custom-scrollbar rounded-xl scroll-smooth"
                    >
                      {paginatedCoupons.map((cpn, i) => (
                        <div key={i} className="border border-slate-200 bg-white hover:border-green-300 p-4 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs shadow-xs transition-all">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-green-900 bg-green-50 border border-green-200 px-3 py-1 rounded-lg text-xs uppercase tracking-wider">
                                {cpn.code}
                              </span>
                              <span className="text-slate-900 font-bold text-xs">
                                {cpn.value}% OFF
                              </span>
                            </div>
                            <p className="text-slate-500 mt-1">
                              Applies on orders with minimum subtotal of <span className="font-bold text-slate-900">₹{cpn.minOrderValue}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full font-bold uppercase text-[10px] ${cpn.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                              {cpn.active ? '✓ Active in Store' : 'Archived'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {filteredCoupons.length > 0 && (
                      <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 px-1 z-10 border-t border-slate-100 rounded-b-xl">
                        <Pagination
                          currentPage={validPage}
                          totalItems={filteredCoupons.length}
                          pageSize={adminCouponPageSize}
                          onPageChange={(p) => {
                            setAdminCouponPage(p);
                            adminCouponsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          onPageSizeChange={(s) => {
                            setAdminCouponPageSize(s);
                            setAdminCouponPage(1);
                            adminCouponsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          pageSizeOptions={[5, 10, 20]}
                          itemLabel="coupons"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: SECURITY & ACTIVITY LOGS (ADMIN ONLY) */}
          {activeTab === 'admin-logs' && isAdmin && (() => {
            const filteredLogs = logs.filter(lg => {
              if (adminLogActionFilter && lg.action !== adminLogActionFilter) return false;
              if (adminLogSearch.trim()) {
                const q = adminLogSearch.toLowerCase().trim();
                const userMatch = (lg.userEmail || '').toLowerCase().includes(q);
                const actionMatch = (lg.action || '').toLowerCase().includes(q);
                const detailsMatch = (lg.details || '').toLowerCase().includes(q);
                return userMatch || actionMatch || detailsMatch;
              }
              return true;
            });

            const uniqueActions = Array.from(new Set(logs.map(l => l.action).filter(Boolean)));
            const totalPages = Math.ceil(filteredLogs.length / adminLogPageSize) || 1;
            const validPage = Math.min(adminLogPage, totalPages);
            const paginatedLogs = filteredLogs.slice((validPage - 1) * adminLogPageSize, validPage * adminLogPageSize);

            return (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5 text-blue-600" />
                      <span>Security Ledger & System Audit Trails</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Real-time cryptographic monitoring of user sessions, password updates, and order activity logs.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button 
                      onClick={() => {
                        setLoadingLogs(true);
                        fetch('/api/logs')
                          .then(r => r.json())
                          .then(d => { setLogs(Array.isArray(d) ? d : []); setLoadingLogs(false); })
                          .catch(() => setLoadingLogs(false));
                      }}
                      disabled={loadingLogs}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 via-green-600 to-green-700 hover:from-blue-700 hover:to-green-800 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md shadow-green-500/20 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${loadingLogs ? 'animate-spin' : ''}`} />
                      <span>{loadingLogs ? 'Refreshing...' : 'Refresh Logs'}</span>
                    </button>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-bold shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Session Protected (256-Bit SSL)</span>
                    </div>
                  </div>
                </div>

                {/* Security Status Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                      <span>Account Security</span>
                      <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">Password Encrypted</p>
                    <p className="text-[10px] text-slate-500">Bcrypt Salt 10 Rounds</p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                      <span>JWT Auth Token</span>
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">Active & Valid</p>
                    <p className="text-[10px] text-slate-500">Automatic Expiry Control</p>
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-1 shadow-xs">
                    <div className="flex items-center justify-between text-xs text-slate-600 font-bold">
                      <span>Active Session</span>
                      <Activity className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">{user?.email || 'Current User'}</p>
                    <p className="text-[10px] text-slate-500">IP Verified Access</p>
                  </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700">Action:</span>
                    <select
                      value={adminLogActionFilter}
                      onChange={(e) => { setAdminLogActionFilter(e.target.value); setAdminLogPage(1); }}
                      className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 cursor-pointer"
                    >
                      <option value="">All Action Types ({logs.length})</option>
                      {uniqueActions.map(act => (
                        <option key={act} value={act}>{act}</option>
                      ))}
                    </select>
                  </div>

                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search email, action, details..."
                      value={adminLogSearch}
                      onChange={(e) => { setAdminLogSearch(e.target.value); setAdminLogPage(1); }}
                      className="w-full bg-white border border-slate-200 pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600"
                    />
                    {adminLogSearch && (
                      <button
                        onClick={() => { setAdminLogSearch(''); setAdminLogPage(1); }}
                        className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-700 font-bold"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Activity Logs Listing */}
                {loadingLogs ? (
                  <div className="text-center py-12 text-xs text-slate-500 animate-pulse bg-white rounded-3xl border border-slate-200 shadow-xs">
                    Loading secure audit logs...
                  </div>
                ) : filteredLogs.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-500 bg-white rounded-3xl border border-slate-200 p-6 shadow-xs">
                    <p className="font-bold text-slate-900 mb-1">No activity log entries found</p>
                    <p className="text-[11px] text-slate-500">
                      {adminLogSearch || adminLogActionFilter ? 'No logs match your filter criteria.' : 'Your session and account activities are completely clean and secure.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div 
                      ref={adminLogsScrollRef}
                      className="max-h-[600px] overflow-y-auto pr-1.5 space-y-2.5 custom-scrollbar rounded-xl scroll-smooth"
                    >
                      {paginatedLogs.map((lg) => (
                        <div key={lg.id} className="border border-slate-200 bg-white hover:border-green-300 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs transition-all">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 bg-slate-100 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                                {lg.action}
                              </span>
                              <span className="text-[11px] text-slate-500 font-mono font-medium">
                                {lg.userEmail}
                              </span>
                            </div>
                            <p className="text-slate-800 font-medium text-xs leading-relaxed mt-1">
                              {lg.details}
                            </p>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono text-right shrink-0 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-100">
                            {new Date(lg.timestamp).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {filteredLogs.length > 0 && (
                      <div className="sticky bottom-0 bg-white/95 backdrop-blur-xs pt-3 pb-1 px-1 z-10 border-t border-slate-100 rounded-b-xl">
                        <Pagination
                          currentPage={validPage}
                          totalItems={filteredLogs.length}
                          pageSize={adminLogPageSize}
                          onPageChange={(p) => {
                            setAdminLogPage(p);
                            adminLogsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          onPageSizeChange={(s) => {
                            setAdminLogPageSize(s);
                            setAdminLogPage(1);
                            adminLogsScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          pageSizeOptions={[10, 15, 25, 50]}
                          itemLabel="activity logs"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* TAB: WEBSITE SETTINGS (ADMIN) */}
          {activeTab === 'admin-settings' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-xl font-bold text-slate-900">
                  Global Website Settings
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Configure your brand logo, name, taxes, shipping, and store details.
                </p>
              </div>

              {settingsSaved && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Settings updated and saved securely.</span>
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const updatedSettings: WebsiteSettings = {
                  logoName: fd.get('logoName') as string || 'Grams Life',
                  logoUrl: fd.get('logoUrl') as string || '',
                  contactEmail: fd.get('contactEmail') as string || '',
                  contactPhone: fd.get('contactPhone') as string || '',
                  address: fd.get('address') as string || '',
                  facebook: fd.get('facebook') as string || '',
                  instagram: fd.get('instagram') as string || '',
                  twitter: fd.get('twitter') as string || '',
                  defaultTaxPercentage: Number(fd.get('defaultTaxPercentage') || 0),
                  baseShippingCharge: Number(fd.get('baseShippingCharge') || 0),
                  freeShippingThreshold: Number(fd.get('freeShippingThreshold') || 0),
                };
                if (onUpdateSettings) {
                  onUpdateSettings(updatedSettings);
                  setSettingsSaved(true);
                  setTimeout(() => setSettingsSaved(false), 3000);
                }
              }} className="space-y-4 max-w-xl bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Store Name (Logo Text)</label>
                  <input
                    type="text"
                    name="logoName"
                    defaultValue={settings.logoName}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Logo Image URL</label>
                  <input
                    type="text"
                    name="logoUrl"
                    defaultValue={settings.logoUrl || ''}
                    placeholder="https://example.com/logo.png"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 bg-white"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Provide a public image link or a base64 encoded image to display your brand logo.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Email</label>
                    <input
                      type="email"
                      name="contactEmail"
                      defaultValue={settings.contactEmail}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contact Phone</label>
                    <input
                      type="text"
                      name="contactPhone"
                      defaultValue={settings.contactPhone}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Address</label>
                  <input
                    type="text"
                    name="address"
                    defaultValue={settings.address}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Tax Percentage (%)</label>
                    <input
                      type="number"
                      name="defaultTaxPercentage"
                      defaultValue={settings.defaultTaxPercentage}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Shipping Charge (₹)</label>
                    <input
                      type="number"
                      name="baseShippingCharge"
                      defaultValue={settings.baseShippingCharge}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Free Shipping Min (₹)</label>
                    <input
                      type="number"
                      name="freeShippingThreshold"
                      defaultValue={settings.freeShippingThreshold}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Facebook URL</label>
                    <input
                      type="text"
                      name="facebook"
                      defaultValue={settings.facebook || ''}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Instagram URL</label>
                    <input
                      type="text"
                      name="instagram"
                      defaultValue={settings.instagram || ''}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Twitter URL</label>
                    <input
                      type="text"
                      name="twitter"
                      defaultValue={settings.twitter || ''}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 via-green-600 to-green-700 hover:from-blue-700 hover:to-green-800 text-white font-bold py-3 rounded-2xl text-xs uppercase tracking-wider transition-all shadow-md shadow-green-500/20 cursor-pointer mt-2"
                >
                  Save Settings
                </button>
              </form>
            </div>
          )}

        </div>

      </div>

      {/* 4. LUXURY PRINTABLE INVOICE MODAL OVERLAY */}
      {invoiceOrder && (
        <div className="fixed inset-0 bg-brand-green-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="max-w-2xl w-full bg-brand-cream-50 rounded-[2rem] shadow-2xl border border-brand-gold-500/20 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Control Bar (hidden in printing) */}
            <div className="bg-brand-green-950 px-6 py-4 flex items-center justify-between text-brand-cream-100 border-b border-brand-gold-500/10 shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-gold-400" />
                <span className="font-serif text-sm font-bold tracking-wide">Ayurvedic Sanctuary Invoice</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-green-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Invoice</span>
                </button>
                <button
                  onClick={() => setInvoiceOrder(null)}
                  className="p-2 rounded-xl hover:bg-brand-green-900 text-brand-cream-200 transition-colors cursor-pointer"
                  title="Close Invoice"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Container */}
            <div id="print-invoice-area" className="flex-grow overflow-y-auto p-8 sm:p-10 space-y-8 bg-[#fdfbf7] text-brand-green-950">
              
              <style>{`
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 5mm;
                  }
                  html, body {
                    height: 100% !important;
                    max-height: 100vh !important;
                    overflow: hidden !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                  }
                  body * {
                    visibility: hidden !important;
                  }
                  #print-invoice-area, #print-invoice-area * {
                    visibility: visible !important;
                  }
                  #print-invoice-area {
                    position: fixed !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    height: auto !important;
                    max-height: 98vh !important;
                    margin: 0 !important;
                    padding: 15px !important;
                    box-shadow: none !important;
                    background: #ffffff !important;
                    z-index: 999999 !important;
                    overflow: hidden !important;
                  }
                  .print-hide, .print\:hidden {
                    display: none !important;
                  }
                }
              `}</style>

              {/* Invoice Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center gap-6 border-b border-brand-green-700/10 pb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-green-700 flex items-center justify-center text-brand-cream-50 font-serif text-2xl font-bold border-2 border-brand-gold-500">
                    G
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-bold tracking-tight text-brand-green-900 leading-none">Grams Life</h2>
                    <span className="text-[10px] uppercase tracking-widest text-brand-gold-700 font-extrabold mt-1 block">Ayurvedic Sanctuary</span>
                  </div>
                </div>
                <div className="sm:text-right space-y-1">
                  <span className="text-[10px] uppercase tracking-widest font-extrabold bg-brand-gold-500/10 text-brand-gold-700 px-3 py-1 rounded-full border border-brand-gold-500/20">
                    Official Sourced Receipt
                  </span>
                  <p className="font-serif text-sm font-semibold text-brand-green-800/80 pt-1.5">HPLC Heavy-Metal Clean Certified</p>
                </div>
              </div>

              {/* Billing & Meta Block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs leading-relaxed">
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-brand-green-600/70">Securely Sourced For</h4>
                  <div className="border-l-2 border-brand-gold-500/40 pl-3.5 space-y-1">
                    <p className="font-serif text-base font-bold text-brand-green-950">{invoiceOrder.shippingAddress.fullName}</p>
                    <p className="text-brand-green-800/90">{invoiceOrder.shippingAddress.addressLine1}</p>
                    {invoiceOrder.shippingAddress.addressLine2 && <p className="text-brand-green-800/90">{invoiceOrder.shippingAddress.addressLine2}</p>}
                    <p className="text-brand-green-800/90">{invoiceOrder.shippingAddress.city}, {invoiceOrder.shippingAddress.state} - {invoiceOrder.shippingAddress.zipCode}</p>
                    <p className="font-mono text-[10px] text-brand-gold-700 font-bold">Contact: {invoiceOrder.shippingAddress.phone}</p>
                  </div>
                </div>

                <div className="space-y-2 md:text-right md:justify-self-end">
                  <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-brand-green-600/70">Sanctuary Chronicle Ledger</h4>
                  <div className="space-y-1.5">
                    <p className="text-brand-green-950 font-medium">Invoice Number: <span className="font-mono font-bold text-brand-green-900">GL-INV-{invoiceOrder.id.slice(-6).toUpperCase()}</span></p>
                    <p className="text-brand-green-950 font-medium">Sourcing Date: <span className="font-mono text-brand-green-900">{invoiceOrder.orderDate || new Date().toLocaleDateString('en-IN')}</span></p>
                    <p className="text-brand-green-950 font-medium">Payment Ledger: <span className="font-mono text-brand-green-900">{invoiceOrder.paymentMethod}</span></p>
                    <p className="text-brand-green-950 font-medium">Status: <span className={`font-bold uppercase text-[9px] px-2 py-0.5 rounded-full ${invoiceOrder.paymentStatus === 'Paid' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-brand-gold-500/10 text-brand-gold-700 border border-brand-gold-500/20'}`}>{invoiceOrder.paymentStatus}</span></p>
                  </div>
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-brand-green-600/70 border-b pb-1.5">Apothecary Compounds Sourced</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-brand-green-700/10 text-[10px] uppercase tracking-wider text-brand-green-700 font-bold">
                        <th className="py-2.5">Compound / Extract</th>
                        <th className="py-2.5 text-center">Qty</th>
                        <th className="py-2.5 text-right">Unit Price</th>
                        <th className="py-2.5 text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-green-600/5 font-medium text-brand-green-900">
                      {invoiceOrder.items.map((item, index) => (
                        <tr key={index}>
                          <td className="py-3 pr-4">
                            <span className="block font-serif font-bold text-brand-green-950">{item.productName}</span>
                            <span className="block text-[10px] text-brand-green-600/50 font-mono">SKU: GL-CH-{item.productId.slice(-4).toUpperCase()}</span>
                          </td>
                          <td className="py-3 text-center font-mono">{item.quantity}</td>
                          <td className="py-3 text-right font-mono">₹{item.price}</td>
                          <td className="py-3 text-right font-mono font-bold">₹{item.price * item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Summary Breakdown block */}
              <div className="border-t border-brand-green-700/10 pt-6 flex justify-end">
                <div className="w-full sm:w-64 space-y-2.5 text-xs text-brand-green-800">
                  <div className="flex justify-between">
                    <span>Compounds Subtotal</span>
                    <span className="font-mono">₹{invoiceOrder.subtotal}</span>
                  </div>
                  {invoiceOrder.discount > 0 && (
                    <div className="flex justify-between text-brand-gold-700 font-bold">
                      <span>Heritage Coupon Discount</span>
                      <span className="font-mono">-₹{invoiceOrder.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Vedic Cess / VAT ({settings.defaultTaxPercentage || 12}%)</span>
                    <span className="font-mono">₹{invoiceOrder.tax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Lunar Sourcing Shipping</span>
                    <span className="font-mono">{invoiceOrder.shippingCharge === 0 ? 'FREE' : `₹${invoiceOrder.shippingCharge}`}</span>
                  </div>
                  <div className="pt-3 border-t border-brand-green-700/10 flex justify-between items-baseline font-serif text-base font-bold text-brand-green-950">
                    <span>Prana Balance Total</span>
                    <span className="text-lg text-brand-green-900 font-mono font-extrabold">₹{invoiceOrder.finalTotal}</span>
                  </div>
                </div>
              </div>

              {/* Traditional Blessings Seal */}
              <div className="border-t border-brand-gold-500/20 pt-8 text-center space-y-3">
                <p className="font-serif text-[13px] text-brand-green-800/80 leading-relaxed italic max-w-lg mx-auto">
                  “The preservation of dynamic equilibrium is the highest art of living. May this pristine formulation restore perfect, radiant equilibrium to your biological elixirs.”
                </p>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-bold text-brand-gold-700 uppercase tracking-widest">Aacharya Dhanvantari</p>
                  <p className="text-[9px] text-brand-green-600/60 uppercase">Chief Apothecary • Grams Life Sanctuary</p>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* 5. COURIER SHIPPING & TRACKING LABEL MODAL (FLIPKART / AMAZON STYLE) */}
      {shippingLabelOrder && (
        <div className="fixed inset-0 bg-brand-green-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-gray-300 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Control Bar (hidden in printing) */}
            <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0 print:hidden">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <span className="font-sans text-sm font-bold tracking-wide">Flipkart-Style Courier Shipping Label</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-150 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Package Label</span>
                </button>
                <button
                  onClick={() => setShippingLabelOrder(null)}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                  title="Close Label"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Shipping Label Container */}
            <div id="print-shipping-label-area" className="flex-grow overflow-y-auto p-6 bg-white text-black font-sans">
              
              <style>{`
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 5mm;
                  }
                  html, body {
                    height: 100% !important;
                    max-height: 100vh !important;
                    overflow: hidden !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    background: #ffffff !important;
                  }
                  body * {
                    visibility: hidden !important;
                  }
                  #print-shipping-label-area, #print-shipping-label-area * {
                    visibility: visible !important;
                  }
                  #print-shipping-label-area {
                    position: fixed !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    max-width: 100% !important;
                    height: auto !important;
                    max-height: 98vh !important;
                    margin: 0 !important;
                    padding: 10px !important;
                    box-shadow: none !important;
                    background: #ffffff !important;
                    z-index: 999999 !important;
                    overflow: hidden !important;
                  }
                  .print-hide, .print\:hidden {
                    display: none !important;
                  }
                }
              `}</style>

              {/* Outer Label Frame (Standard E-Commerce Parcel Label 4x6 inch aspect) */}
              <div className="border-4 border-black p-4 space-y-3 bg-white text-black">
                
                {/* Header Bar */}
                <div className="flex justify-between items-center border-b-4 border-black pb-3">
                  <div>
                    <h1 className="text-xl font-black tracking-tighter uppercase italic">FLIPKART LOGISTICS</h1>
                    <p className="text-[10px] font-mono font-bold tracking-widest text-gray-700">EXPRESS COURIER DISPATCH</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-black border-2 border-black px-2 py-1 uppercase bg-black text-white">
                      SURFACE AIR / STANDARD
                    </span>
                  </div>
                </div>

                {/* Barcode & AWB Row */}
                <div className="border-b-4 border-black pb-3 text-center space-y-1">
                  <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-600">AWB Tracking Number</p>
                  <p className="text-lg font-mono font-black tracking-widest">AWB-883{shippingLabelOrder.id.replace(/\D/g, '').slice(-8) || '92100492'}</p>
                  
                  {/* Visual SVG Barcode bars */}
                  <div className="flex justify-center items-center h-12 my-1 gap-[2px] overflow-hidden px-4">
                    {[3,1,2,1,4,1,2,3,1,3,2,1,4,1,2,1,3,2,4,1,2,3,1,2,4,1,3,1,2,4,2,1,3,1,2,3,1,4,1,2].map((w, idx) => (
                      <div key={idx} className="bg-black h-full" style={{ width: `${w * 2}px` }} />
                    ))}
                  </div>
                  <p className="text-[9px] font-mono text-gray-700">Scan barcode at hub arrival or delivery handoff</p>
                </div>

                {/* Payment Status Big Badge */}
                <div className="border-b-4 border-black pb-3">
                  {shippingLabelOrder.paymentMethod === 'Cash on Delivery' || shippingLabelOrder.paymentStatus === 'Pending' ? (
                    <div className="border-4 border-black p-2 text-center bg-yellow-200 text-black">
                      <p className="text-xs font-black uppercase tracking-widest">CASH ON DELIVERY (COD)</p>
                      <p className="text-2xl font-black font-mono mt-0.5">COLLECT CASH: ₹{shippingLabelOrder.finalTotal}</p>
                    </div>
                  ) : (
                    <div className="border-4 border-black p-2 text-center bg-black text-white">
                      <p className="text-xs font-black uppercase tracking-widest">PREPAID ORDER</p>
                      <p className="text-xl font-black font-mono mt-0.5">DO NOT COLLECT ANY CASH (PAID ₹{shippingLabelOrder.finalTotal})</p>
                    </div>
                  )}
                </div>

                {/* Shipping Address (SHIP TO) Section */}
                <div className="border-b-4 border-black pb-3 space-y-1.5">
                  <p className="text-[10px] font-mono font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 inline-block">
                    DELIVERY DESTINATION (SHIP TO)
                  </p>
                  <div className="text-sm font-bold leading-tight pl-1">
                    <p className="text-base font-black uppercase">{shippingLabelOrder.shippingAddress?.fullName || shippingLabelOrder.userName}</p>
                    <p className="mt-0.5">{shippingLabelOrder.shippingAddress?.addressLine1}</p>
                    {shippingLabelOrder.shippingAddress?.addressLine2 && <p>{shippingLabelOrder.shippingAddress.addressLine2}</p>}
                    <p>{shippingLabelOrder.shippingAddress?.city}, {shippingLabelOrder.shippingAddress?.state}</p>
                    
                    {/* Highlighted PIN code box */}
                    <div className="mt-2 flex items-center gap-3">
                      <div className="border-2 border-black px-3 py-1 bg-gray-100">
                        <span className="text-[10px] font-mono font-bold block">PIN CODE</span>
                        <span className="text-xl font-black font-mono tracking-wider">{shippingLabelOrder.shippingAddress?.zipCode || '302001'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-gray-600 block">RECIPIENT CONTACT</span>
                        <span className="text-base font-black font-mono">📞 {shippingLabelOrder.shippingAddress?.phone || 'On File'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Return Address (SHIPPER) & QR Code Grid */}
                <div className="grid grid-cols-3 gap-3 border-b-4 border-black pb-3">
                  <div className="col-span-2 space-y-1">
                    <p className="text-[9px] font-mono font-black uppercase tracking-widest bg-gray-200 text-black px-1.5 py-0.5 inline-block">
                      RETURN ADDRESS (SHIPPER / SELLER)
                    </p>
                    <div className="text-[11px] font-bold leading-tight text-gray-800">
                      <p className="font-black">Grams Life Ayurvedic Sanctuary</p>
                      <p>Plot 42, Veda Heritage Enclave, Mansarovar</p>
                      <p>Jaipur, Rajasthan - 302020</p>
                      <p className="font-mono text-[10px] pt-0.5">Seller Care: +91 98765 43210 | care@gramslife.com</p>
                    </div>
                  </div>

                  {/* Simulated Courier Scan QR Code */}
                  <div className="col-span-1 border-2 border-black p-1.5 flex flex-col items-center justify-center text-center bg-gray-50">
                    <div className="w-16 h-16 border-2 border-black p-1 bg-white flex flex-col justify-between">
                      <div className="flex justify-between"><div className="w-3 h-3 bg-black"/> <div className="w-3 h-3 bg-black"/></div>
                      <div className="text-[8px] font-mono font-bold text-center">QR SCAN</div>
                      <div className="flex justify-between"><div className="w-3 h-3 bg-black"/> <div className="w-3 h-3 border-2 border-black"/></div>
                    </div>
                    <span className="text-[8px] font-mono font-bold mt-1">HUB SORT QR</span>
                  </div>
                </div>

                {/* Manifest Item Contents Summary */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-mono font-black uppercase">ORDER ID: {shippingLabelOrder.id}</p>
                    <p className="text-[10px] font-mono font-bold text-gray-600">DATE: {shippingLabelOrder.orderDate}</p>
                  </div>
                  
                  <div className="border border-black text-[10px] font-mono">
                    <div className="bg-gray-100 font-bold p-1 border-b border-black flex justify-between">
                      <span>PARCEL MANIFEST CONTENTS ({shippingLabelOrder.items?.length || 0} ITEMS)</span>
                      <span>QTY</span>
                    </div>
                    <div className="p-1 space-y-0.5 divide-y divide-gray-200">
                      {shippingLabelOrder.items?.map((item, i) => (
                        <div key={i} className="flex justify-between pt-0.5">
                          <span className="truncate pr-2 font-bold">{item.productName}</span>
                          <span className="font-black">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer note */}
                <div className="text-[8px] text-center font-mono font-bold border-t border-black pt-1">
                  If undelivered, please return to seller address within 7 days. Handle with care - Ayurvedic Health Remedies.
                </div>

              </div>

            </div>

          </div>
        </div>
      )}

      {/* Forgot Password Recovery Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccessLogin={(token) => {
          if (onLoginSuccess) {
            onLoginSuccess(token);
          } else {
            localStorage.setItem('grams_auth_token', token);
            window.location.reload();
          }
        }}
      />

      </div>
    </div>
  );
};
