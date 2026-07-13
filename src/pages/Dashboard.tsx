/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { 
  History, MapPin, User, LayoutDashboard, Leaf, ShoppingBag, 
  Tag, Plus, Trash2, Edit2, ShieldAlert, Sparkles, Check, CheckCircle2, Shield, Activity,
  Printer, FileText, X, Download
} from 'lucide-react';
import { User as UserType, Order, Address, Product, Coupon, WebsiteSettings } from '../types';

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
  onNavigate
}) => {
  const isAdmin = user?.role === 'admin';
  const [activeTab, setActiveTab] = useState<string>(isAdmin ? 'admin-stats' : 'orders');
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);

  // Payments Ledger state
  const [payments, setPayments] = useState<any[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editTxnRef, setEditTxnRef] = useState('');
  const [editPayStatus, setEditPayStatus] = useState<'Paid' | 'Pending' | 'Failed'>('Pending');

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

  useEffect(() => {
    if (isAdmin && (activeTab === 'admin-payments' || activeTab === 'admin-stats')) {
      fetchPayments();
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
          setLogs(data);
          setLoadingLogs(false);
        })
        .catch(err => {
          console.error(err);
          setLoadingLogs(false);
        });
    }
  }, [activeTab, isAdmin]);

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
  const [prodPrice, setProdPrice] = useState(500);
  const [prodOrigPrice, setProdOrigPrice] = useState(600);
  const [prodStock, setProdStock] = useState(20);
  const [prodCategory, setProdCategory] = useState('Immunity');
  const [prodDesc, setProdDesc] = useState('');
  const [prodImg, setProdImg] = useState('');
  const [prodBenefits, setProdBenefits] = useState('');
  const [prodDosage, setProdDosage] = useState('');

  // Admin coupon add state
  const [showAddCpn, setShowAddCpn] = useState(false);
  const [cpnCode, setCpnCode] = useState('');
  const [cpnVal, setCpnVal] = useState(15);
  const [cpnMin, setCpnMin] = useState(500);

  // Filter orders for non-admin
  const userOrders = useMemo(() => {
    if (isAdmin) return orders;
    return orders.filter(o => o.userId === user?.id);
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
    setProdPrice(prod.price);
    setProdOrigPrice(prod.originalPrice);
    setProdStock(prod.stock);
    setProdCategory(prod.category);
    setProdDesc(prod.description);
    setProdImg(prod.mainImage);
    setProdBenefits(prod.benefits.join(', '));
    setProdDosage(prod.dosage);
    setShowAddProd(true);
  };

  // Reset product CRUD states
  const handleResetProductForm = () => {
    setShowAddProd(false);
    setEditProdId(null);
    setProdName('');
    setProdPrice(500);
    setProdOrigPrice(600);
    setProdStock(20);
    setProdCategory('Immunity');
    setProdDesc('');
    setProdImg('');
    setProdBenefits('');
    setProdDosage('');
  };

  // Handle Product Save (Add/Edit)
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodName || !prodDesc) return;

    const payload: Partial<Product> = {
      name: prodName,
      price: prodPrice,
      originalPrice: prodOrigPrice,
      stock: prodStock,
      category: prodCategory,
      description: prodDesc,
      mainImage: prodImg || 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&q=80&w=200',
      benefits: prodBenefits.split(',').map(b => b.trim()).filter(Boolean),
      dosage: prodDosage || 'Take 1 capsule daily after breakfast.'
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
      minOrderValue: cpnMin
    });

    setShowAddCpn(false);
    setCpnCode('');
    setCpnVal(15);
    setCpnMin(500);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <ShieldAlert className="w-12 h-12 text-brand-gold-500 mx-auto" />
        <h3 className="font-serif text-xl font-bold text-brand-green-800">Sacred Access Required</h3>
        <p className="text-xs text-brand-green-600/70">Please authenticate with Grams Life to review your order chronicles.</p>
        <button onClick={() => onNavigate('home')} className="bg-brand-green-700 text-brand-cream-100 font-bold px-6 py-2.5 rounded-xl text-xs">
          Return to home
        </button>
      </div>
    );
  }

  return (
    <div id="dashboard-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Title block */}
      <div className="border-b border-brand-green-600/10 pb-5 mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-brand-gold-600 font-bold">Personal Account</span>
          <h2 className="font-serif text-3xl font-bold text-brand-green-900">
            Welcome, {user.name} <span className="text-xs font-sans text-brand-gold-700 font-bold italic">({user.role === 'admin' ? 'Apothecary Director' : 'Vedic Practitioner'})</span>
          </h2>
          <p className="text-xs text-brand-green-600/70 mt-1">
            {isAdmin ? "Manage store settings, CRUD remedies, and audit order dispatch statuses." : "Track package deliveries, biological diagnostic profile, and delivery endpoints."}
          </p>
        </div>
        <div className="text-xs text-brand-green-600 font-mono">
          Linked email: {user.email}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Navigation Sidebar Drawer */}
        <div className="lg:col-span-1 bg-white border border-brand-green-600/5 p-4 rounded-2xl h-fit flex flex-col gap-3 min-w-0">
          
          {/* Quick Sandbox Role Switcher */}
          {isAdmin && (
            <div className="p-3.5 border border-brand-gold-500/20 rounded-xl bg-brand-cream-100/30 text-xs space-y-2 shrink-0">
              <div className="flex items-center gap-1.5 justify-center">
                <Shield className="w-3.5 h-3.5 text-brand-gold-600 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-brand-gold-700 font-bold">Apothecary Sandbox Role</span>
              </div>
              <p className="text-[10px] text-brand-green-700/80 text-center leading-relaxed">
                Dynamically switch user capabilities between Buyer & Manager.
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
                  className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer text-center ${
                    !isAdmin 
                      ? 'bg-brand-green-700 text-brand-cream-50 shadow-sm' 
                      : 'bg-white text-brand-green-700 border border-brand-green-600/10 hover:bg-brand-green-50'
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
                  className={`py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer text-center ${
                    isAdmin 
                      ? 'bg-brand-green-700 text-brand-cream-50 shadow-sm' 
                      : 'bg-white text-brand-green-700 border border-brand-green-600/10 hover:bg-brand-green-50'
                  }`}
                >
                  Admin
                </button>
              </div>
            </div>
          )}

          {/* Navigation Tabs Area */}
          <div className="flex flex-row lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-2 lg:pb-0 whitespace-nowrap scrollbar-none snap-x w-full">
            {/* CUSTOMER TABS */}
            {!isAdmin ? (
              <>
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
                  <User className="w-4 h-4 shrink-0" />
                  <span>Dosha Biological Profile</span>
                </button>
              </>
            ) : (
              /* ADMIN TABS */
              <>
                <span className="hidden lg:block px-4 py-1 text-[9px] uppercase tracking-wider text-brand-gold-700 font-bold shrink-0">Admin Controls</span>
                <button
                  onClick={() => setActiveTab('admin-stats')}
                  className={`shrink-0 snap-start lg:w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    activeTab === 'admin-stats' ? 'bg-brand-green-700 text-brand-cream-50' : 'text-brand-green-700 hover:bg-brand-green-50'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span>Overview Statistics</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-catalog')}
                  className={`shrink-0 snap-start lg:w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    activeTab === 'admin-catalog' ? 'bg-brand-green-700 text-brand-cream-50' : 'text-brand-green-700 hover:bg-brand-green-50'
                  }`}
                >
                  <Leaf className="w-4 h-4 shrink-0" />
                  <span>Remedies Catalog CRUD</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-orders')}
                  className={`shrink-0 snap-start lg:w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    activeTab === 'admin-orders' ? 'bg-brand-green-700 text-brand-cream-50' : 'text-brand-green-700 hover:bg-brand-green-50'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 shrink-0" />
                  <span>All Orders Dispatch Registry</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-payments')}
                  className={`shrink-0 snap-start lg:w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    activeTab === 'admin-payments' ? 'bg-brand-green-700 text-brand-cream-50' : 'text-brand-green-700 hover:bg-brand-green-50'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Payments Ledger (MySQL)</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-coupons')}
                  className={`shrink-0 snap-start lg:w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    activeTab === 'admin-coupons' ? 'bg-brand-green-700 text-brand-cream-50' : 'text-brand-green-700 hover:bg-brand-green-50'
                  }`}
                >
                  <Tag className="w-4 h-4 shrink-0" />
                  <span>Coupons Management</span>
                </button>
                <button
                  onClick={() => setActiveTab('admin-logs')}
                  className={`shrink-0 snap-start lg:w-full text-left px-4 py-3 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-colors cursor-pointer ${
                    activeTab === 'admin-logs' ? 'bg-brand-green-700 text-brand-cream-50' : 'text-brand-green-700 hover:bg-brand-green-50'
                  }`}
                >
                  <Activity className="w-4 h-4 shrink-0" />
                  <span>Security & Activity Logs</span>
                </button>
              </>
            )}
          </div>

        </div>

        {/* Content Panel Area */}
        <div className="lg:col-span-3 bg-white border border-brand-green-600/5 p-6 rounded-2xl min-h-[450px]">
          
          {/* TAB: ORDERS HISTORY (CUSTOMER) */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <h3 className="font-serif text-lg font-bold text-brand-green-900 border-b border-brand-green-600/5 pb-2">
                Your Ayurvedic Orders Ledger
              </h3>

              {userOrders.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <ShoppingBag className="w-10 h-10 text-brand-gold-500/50 mx-auto" />
                  <p className="text-xs text-brand-green-600 italic">No packages logged yet.</p>
                  <button onClick={() => onNavigate('shop')} className="bg-brand-green-700 text-brand-cream-100 font-bold px-4 py-2 rounded-xl text-xs">
                    Start Remedies Shop
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {userOrders.map(order => (
                    <div key={order.id} className="border border-brand-green-600/10 rounded-2xl p-4.5 space-y-4">
                      
                      {/* Meta */}
                      <div className="flex flex-col sm:flex-row justify-between text-xs border-b border-brand-green-600/5 pb-3 gap-2">
                        <div>
                          <p className="font-bold text-brand-green-950 font-mono">ORDER ID: {order.id}</p>
                          <p className="text-brand-green-600/50">Placed: {order.createdAt}</p>
                        </div>
                        <div className="sm:text-right">
                          <p className="font-bold text-brand-green-900">Total Secured: ₹{order.finalTotal}</p>
                          <p className="text-[10px] text-brand-gold-700 font-bold uppercase">{order.paymentMethod} • {order.paymentStatus}</p>
                        </div>
                      </div>

                      {/* Delivery Status stepper */}
                      <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                        {[
                          { key: 'Ordered', label: 'Ordered' },
                          { key: 'Prepared', label: 'Brewed / Prepared' },
                          { key: 'Dispatched', label: 'In Transit' },
                          { key: 'Delivered', label: 'Delivered' }
                        ].map((step, idx) => {
                          const steps = ['Ordered', 'Prepared', 'Dispatched', 'Delivered'];
                          const currentIdx = steps.indexOf(order.status);
                          const active = idx <= currentIdx;
                          return (
                            <div key={idx} className="space-y-1">
                              <div className={`w-6 h-6 rounded-full mx-auto flex items-center justify-center font-bold border ${
                                active ? 'bg-brand-green-700 text-brand-cream-50 border-brand-green-700' : 'bg-gray-100 text-gray-400 border-gray-200'
                              }`}>
                                {active ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                              </div>
                              <span className={active ? 'text-brand-green-800' : 'text-gray-400'}>{step.label}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Items row */}
                      <div className="space-y-2 pt-2 border-t border-brand-green-600/5 text-xs text-brand-green-800 font-medium">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center">
                            <span>{item.productName} (x{item.quantity})</span>
                            <span className="font-serif">₹{item.price * item.quantity}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between items-center pt-3.5 border-t border-brand-green-600/5">
                        <span className="text-[10px] text-brand-green-600 font-mono">
                          Batch: GL-CH-{order.id.slice(-6).toUpperCase()}
                        </span>
                        <button
                          onClick={() => setInvoiceOrder(order)}
                          className="px-3.5 py-1.5 rounded-xl border border-brand-gold-500/30 hover:border-brand-gold-500 text-brand-gold-700 bg-brand-gold-50/25 text-[11px] font-bold tracking-wide flex items-center gap-1.5 transition-all cursor-pointer hover:bg-brand-gold-50"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View & Print Invoice</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

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
                  <div className="grid grid-cols-3 gap-3">
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
                Your Biological Constitution Profile
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
            </div>
          )}

          {/* TAB: OVERVIEW STATS (ADMIN) */}
          {activeTab === 'admin-stats' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="font-serif text-lg font-bold text-brand-green-900 border-b border-brand-green-600/5 pb-2">
                Store Operations Statistics Overview
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-brand-cream-100/40 border border-brand-green-600/10 p-4 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-brand-green-600/70">Expected Sales</span>
                  <p className="font-serif text-xl font-bold text-brand-green-900 mt-1">₹{adminStats.salesTotal}</p>
                </div>
                <div className="bg-brand-cream-100/40 border border-brand-green-600/10 p-4 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-brand-green-600/70">Total Orders</span>
                  <p className="font-serif text-xl font-bold text-brand-green-900 mt-1">{adminStats.ordersCount}</p>
                </div>
                <div className="bg-brand-cream-100/40 border border-brand-green-600/10 p-4 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-brand-green-600/70">Average Cart</span>
                  <p className="font-serif text-xl font-bold text-brand-green-900 mt-1">₹{adminStats.avgOrder}</p>
                </div>
                <div className="bg-brand-cream-100/40 border border-brand-green-600/10 p-4 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-brand-green-600/70">Active Catalog</span>
                  <p className="font-serif text-xl font-bold text-brand-green-900 mt-1">{adminStats.productsCount}</p>
                </div>
              </div>

              <div className="mt-8 border border-brand-gold-500/10 rounded-2xl bg-brand-cream-50/20 p-5 space-y-4">
                <h4 className="font-serif font-bold text-brand-green-950 text-sm flex items-center gap-1.5 border-b pb-2">
                  <Shield className="w-4 h-4 text-brand-gold-600 animate-pulse" />
                  <span>Real-time Live Financial Integrity (MySQL DB Backed)</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center pt-2">
                  <div className="p-4 border border-brand-green-100 rounded-xl bg-white space-y-1">
                    <span className="text-[10px] uppercase font-bold text-brand-green-600">Captured / Settled</span>
                    <p className="font-serif text-lg font-bold text-brand-green-900">₹{adminStats.capturedPaymentsTotal}</p>
                    <p className="text-[9px] text-brand-green-600/60 font-mono">Completed transactions</p>
                  </div>
                  <div className="p-4 border border-brand-green-100 rounded-xl bg-white space-y-1">
                    <span className="text-[10px] uppercase font-bold text-brand-gold-700">Awaiting Settlement</span>
                    <p className="font-serif text-lg font-bold text-brand-gold-800">₹{adminStats.pendingPaymentsTotal}</p>
                    <p className="text-[9px] text-brand-gold-700/60 font-mono">COD / pending audits</p>
                  </div>
                  <div className="p-4 border border-brand-green-100 rounded-xl bg-white space-y-1">
                    <span className="text-[10px] uppercase font-bold text-red-600">Failed or Voided</span>
                    <p className="font-serif text-lg font-bold text-red-700">₹{adminStats.failedPaymentsTotal}</p>
                    <p className="text-[9px] text-red-500/60 font-mono">Cancelled or declined</p>
                  </div>
                </div>

                <div className="text-[10px] text-center text-brand-green-600/50 pt-2 font-mono">
                  Syncing with {adminStats.paymentsCount} payments in active MySQL database.
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAYMENTS LEDGER (ADMIN) */}
          {activeTab === 'admin-payments' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-brand-green-600/5 pb-2">
                <h3 className="font-serif text-lg font-bold text-brand-green-900">
                  Payments Transaction Audit Ledger
                </h3>
                <p className="text-xs text-brand-green-600/70 mt-1">
                  Manage database-backed payment settled events, trace transaction references, and audit manual bank transfers.
                </p>
              </div>

              {loadingPayments ? (
                <div className="text-center py-12 text-xs text-brand-green-600 animate-pulse">
                  Querying live database-backed payment transactions...
                </div>
              ) : payments.length === 0 ? (
                <div className="text-center py-12 text-xs text-brand-green-600/60">
                  No payment ledger transactions registered.
                </div>
              ) : (
                <div className="space-y-4">
                  {payments.map((p) => {
                    const isEditing = editingPaymentId === p.id;
                    return (
                      <div key={p.id} className="border border-brand-green-600/10 bg-brand-cream-100/5 p-4 rounded-xl space-y-3 text-xs">
                        
                        <div className="flex justify-between items-start border-b pb-2">
                          <div>
                            <span className="font-mono font-bold text-brand-green-950">TXID: {p.id}</span>
                            <p className="text-[10px] text-brand-green-600/60 font-mono mt-0.5">Order ID: {p.orderId}</p>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                            p.status === 'Paid' ? 'bg-brand-green-100 text-brand-green-700' :
                            p.status === 'Failed' ? 'bg-red-100 text-red-500' :
                            'bg-brand-gold-100 text-brand-gold-700'
                          }`}>
                            {p.status}
                          </span>
                        </div>

                        {isEditing ? (
                          <form onSubmit={(e) => handleUpdatePaymentSubmit(e, p.id)} className="space-y-3 pt-1">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className="font-bold text-brand-green-800">Payment Status</label>
                                <select
                                  value={editPayStatus}
                                  onChange={(e) => setEditPayStatus(e.target.value as any)}
                                  className="w-full bg-white border p-1.5 rounded text-xs"
                                >
                                  <option value="Pending">Pending</option>
                                  <option value="Paid">Paid</option>
                                  <option value="Failed">Failed / Declined</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="font-bold text-brand-green-800">Transaction Reference Code</label>
                                <input
                                  type="text"
                                  value={editTxnRef}
                                  onChange={(e) => setEditTxnRef(e.target.value)}
                                  className="w-full bg-white border p-1.5 rounded text-xs"
                                  placeholder="TXN-ID / Reference"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end pt-1">
                              <button type="button" onClick={() => setEditingPaymentId(null)} className="px-3 py-1 border rounded text-[10px]">Cancel</button>
                              <button type="submit" className="px-4 py-1 bg-brand-green-700 text-brand-cream-100 font-bold rounded text-[10px]">Save Audit</button>
                            </div>
                          </form>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <p className="text-brand-green-600/70">Client details: <span className="font-bold text-brand-green-900">{p.userEmail}</span></p>
                              <p className="text-brand-green-600/70">Secured Amount: <span className="font-bold text-brand-green-900">₹{p.amount}</span></p>
                            </div>
                            <div className="space-y-1 sm:text-right">
                              <p className="text-brand-green-600/70">Channel: <span className="font-bold text-brand-green-900 uppercase">{p.paymentMethod}</span></p>
                              <p className="text-brand-green-600/70">Gateway Ref: <span className="font-mono text-brand-green-900 font-bold">{p.transactionReference || 'N/A'}</span></p>
                            </div>
                          </div>
                        )}

                        {!isEditing && (
                          <div className="flex justify-between items-center pt-2.5 border-t border-brand-green-600/5">
                            <span className="text-[10px] text-brand-green-600/50 font-mono">Timestamp: {new Date(p.createdAt).toLocaleString()}</span>
                            <button
                              onClick={() => {
                                setEditingPaymentId(p.id);
                                setEditTxnRef(p.transactionReference || '');
                                setEditPayStatus(p.status);
                              }}
                              className="px-3 py-1.5 rounded-lg border border-brand-green-200 hover:bg-brand-green-50 text-brand-green-800 text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              Edit Audit Status
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB: REMEDIES CATALOG CRUD (ADMIN) */}
          {activeTab === 'admin-catalog' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center border-b border-brand-green-600/5 pb-2">
                <h3 className="font-serif text-lg font-bold text-brand-green-900">Remedies Catalog</h3>
                <button 
                  onClick={() => setShowAddProd(!showAddProd)}
                  className="bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Compound</span>
                </button>
              </div>

              {/* Add/Edit Product Inline Form */}
              {showAddProd && (
                <form onSubmit={handleSaveProduct} className="bg-brand-cream-100/30 border border-brand-green-600/10 p-5 rounded-2xl space-y-4 text-xs">
                  <h4 className="font-serif font-bold text-brand-green-900">{editProdId ? 'Edit Product Details' : 'Add New Remedy Compound'}</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold">Product Name</label>
                      <input required type="text" value={prodName} onChange={e => setProdName(e.target.value)} className="w-full bg-white border p-2 rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold">Category</label>
                      <select value={prodCategory} onChange={e => setProdCategory(e.target.value)} className="w-full bg-white border p-2 rounded-lg">
                        <option value="Immunity">Immunity</option>
                        <option value="Skin Care">Skin Care</option>
                        <option value="Hair Care">Hair Care</option>
                        <option value="Digestion">Digestion</option>
                        <option value="Diabetes">Diabetes</option>
                        <option value="Joint Care">Joint Care</option>
                        <option value="Women's Health">Women's Health</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold">Price (₹)</label>
                      <input required type="number" value={prodPrice} onChange={e => setProdPrice(Number(e.target.value))} className="w-full bg-white border p-2 rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold">Original Price (₹)</label>
                      <input required type="number" value={prodOrigPrice} onChange={e => setProdOrigPrice(Number(e.target.value))} className="w-full bg-white border p-2 rounded-lg" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold">Stock Count</label>
                      <input required type="number" value={prodStock} onChange={e => setProdStock(Number(e.target.value))} className="w-full bg-white border p-2 rounded-lg" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold">Image URL</label>
                    <input type="text" placeholder="https://..." value={prodImg} onChange={e => setProdImg(e.target.value)} className="w-full bg-white border p-2 rounded-lg" />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold">Benefits (Comma separated)</label>
                    <input type="text" placeholder="Boosts immunity, Relieves fatigue" value={prodBenefits} onChange={e => setProdBenefits(e.target.value)} className="w-full bg-white border p-2 rounded-lg" />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold">Description</label>
                    <textarea required rows={3} value={prodDesc} onChange={e => setProdDesc(e.target.value)} className="w-full bg-white border p-2 rounded-lg" />
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button type="button" onClick={handleResetProductForm} className="px-4 py-2 border rounded-lg font-bold">Cancel</button>
                    <button type="submit" className="px-5 py-2 bg-brand-green-700 text-brand-cream-100 font-bold rounded-lg">Save Compound</button>
                  </div>
                </form>
              )}

              {/* Products Catalog list */}
              <div className="space-y-3.5">
                {products.map(prod => (
                  <div key={prod.id} className="border border-brand-green-600/10 p-4 rounded-xl flex items-center justify-between gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <img src={prod.mainImage} alt={prod.name} className="w-10 h-10 rounded object-cover flex-shrink-0" />
                      <div>
                        <h5 className="font-serif font-bold text-brand-green-900">{prod.name}</h5>
                        <p className="text-brand-green-600/70 font-semibold">{prod.category} • ₹{prod.price} • Stock: {prod.stock}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEditProductOpen(prod)}
                        className="p-1.5 rounded border border-brand-green-200 hover:bg-brand-green-50 text-brand-green-800"
                        title="Edit Details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => onDeleteProduct(prod.id)}
                        className="p-1.5 rounded border border-red-100 hover:bg-red-50 text-red-500"
                        title="Delete Compound"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: ALL ORDERS DISPATCH REGISTRY (ADMIN) */}
          {activeTab === 'admin-orders' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <h3 className="font-serif text-lg font-bold text-brand-green-900 border-b border-brand-green-600/5 pb-2">
                Order Delivery Registries
              </h3>

              <div className="space-y-4">
                {orders.map(ord => (
                  <div key={ord.id} className="border border-brand-green-600/10 p-4 rounded-xl space-y-4 text-xs bg-brand-cream-100/5">
                    
                    {/* header */}
                    <div className="flex justify-between font-bold border-b pb-2">
                      <span className="font-mono">ID: {ord.id}</span>
                      <span className="text-brand-green-900">₹{ord.finalTotal}</span>
                    </div>

                    {/* interactive controls */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      {/* order delivery status selection */}
                      <div className="space-y-1">
                        <label className="font-bold text-brand-green-800">Dispatch Status</label>
                        <select
                          value={ord.status}
                          onChange={(e) => onUpdateStatus(ord.id, e.target.value as any, ord.paymentStatus)}
                          className="w-full bg-white border p-1.5 rounded text-xs"
                        >
                          <option value="Ordered">Ordered</option>
                          <option value="Prepared">Prepared / Brewed</option>
                          <option value="Dispatched">Dispatched / Transport</option>
                          <option value="Delivered">Delivered Successfully</option>
                        </select>
                      </div>

                      {/* payment status selection */}
                      <div className="space-y-1">
                        <label className="font-bold text-brand-green-800">Payment Audit</label>
                        <select
                          value={ord.paymentStatus}
                          onChange={(e) => onUpdateStatus(ord.id, ord.status, e.target.value as any)}
                          className="w-full bg-white border p-1.5 rounded text-xs"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Completed">Paid Successfully</option>
                          <option value="Failed">Failed / Declined</option>
                        </select>
                      </div>

                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-brand-green-600/5">
                      <span className="text-[10px] text-brand-green-600/70">
                        Customer: <span className="font-semibold text-brand-green-800">{ord.userName} ({ord.userEmail})</span>
                      </span>
                      <button
                        onClick={() => setInvoiceOrder(ord)}
                        className="px-3 py-1 rounded-lg border border-brand-gold-500/30 hover:border-brand-gold-500 text-brand-gold-700 bg-brand-gold-50/20 text-[10px] font-bold tracking-wide flex items-center gap-1 transition-all cursor-pointer hover:bg-brand-gold-50"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Print Dispatch Invoice</span>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: COUPONS MANAGEMENT (ADMIN) */}
          {activeTab === 'admin-coupons' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-center border-b border-brand-green-600/5 pb-2">
                <h3 className="font-serif text-lg font-bold text-brand-green-900">Discount Coupons</h3>
                <button 
                  onClick={() => setShowAddCpn(!showAddCpn)}
                  className="bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Coupon</span>
                </button>
              </div>

              {/* Add Coupon form inline */}
              {showAddCpn && (
                <form onSubmit={handleAddCouponSubmit} className="bg-brand-cream-100/30 border border-brand-green-600/10 p-5 rounded-xl space-y-4 text-xs">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold">Code (Uppercase)</label>
                      <input required type="text" placeholder="E.g. AYUR20" value={cpnCode} onChange={e => setCpnCode(e.target.value)} className="w-full bg-white border p-1.5 rounded" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold">Percentage Value (%)</label>
                      <input required type="number" value={cpnVal} onChange={e => setCpnVal(Number(e.target.value))} className="w-full bg-white border p-1.5 rounded" />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold">Min Subtotal (₹)</label>
                      <input required type="number" value={cpnMin} onChange={e => setCpnMin(Number(e.target.value))} className="w-full bg-white border p-1.5 rounded" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setShowAddCpn(false)} className="px-3 py-1.5 border rounded">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 bg-brand-green-700 text-brand-cream-100 font-bold rounded">Add Coupon</button>
                  </div>
                </form>
              )}

              {/* Coupons list */}
              <div className="space-y-3">
                {coupons.map((cpn, i) => (
                  <div key={i} className="border border-brand-green-600/10 p-4 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-serif font-bold text-brand-green-900 bg-brand-gold-500/10 border border-brand-gold-500/20 px-2 py-0.5 rounded uppercase">{cpn.code}</span>
                      <p className="text-brand-green-600/70 mt-1">Deducts {cpn.value}% • Minimum Order required: ₹{cpn.minOrderValue}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${cpn.active ? 'bg-brand-green-100 text-brand-green-700' : 'bg-red-100 text-red-500'}`}>
                      {cpn.active ? 'Active' : 'Archived'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SECURITY & ACTIVITY LOGS (ADMIN) */}
          {activeTab === 'admin-logs' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="border-b border-brand-green-600/5 pb-2">
                <h3 className="font-serif text-lg font-bold text-brand-green-900">
                  System Audit Trails & Logs
                </h3>
                <p className="text-xs text-brand-green-600/70 mt-1">
                  Real-time cryptographic monitoring of administrative edits, formulas update, and order checkouts.
                </p>
              </div>

              {loadingLogs ? (
                <div className="text-center py-12 text-xs text-brand-green-600 animate-pulse">
                  Unrolling secure logs from the temple ledger...
                </div>
              ) : logs.length === 0 ? (
                <div className="text-center py-12 text-xs text-brand-green-600/60">
                  No registered actions inside the ledger.
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {logs.map((lg) => (
                    <div key={lg.id} className="border border-brand-green-600/5 bg-brand-cream-100/15 p-3 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-brand-green-900 bg-brand-green-50 px-2 py-0.5 rounded text-[10px] uppercase">
                            {lg.action}
                          </span>
                          <span className="text-[10px] text-brand-green-600/70 font-mono">
                            {lg.userEmail}
                          </span>
                        </div>
                        <p className="text-brand-green-800 leading-relaxed font-sans mt-1">
                          {lg.details}
                        </p>
                      </div>
                      <div className="text-[10px] text-brand-green-600/50 font-mono text-right shrink-0">
                        {new Date(lg.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  body * {
                    visibility: hidden !important;
                    background-color: #fdfbf7 !important;
                  }
                  #print-invoice-area, #print-invoice-area * {
                    visibility: visible !important;
                  }
                  #print-invoice-area {
                    position: absolute !important;
                    left: 0 !important;
                    top: 0 !important;
                    width: 100% !important;
                    margin: 0 !important;
                    padding: 20px !important;
                    box-shadow: none !important;
                    background: transparent !important;
                  }
                  .print-hide {
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
                    <p className="text-brand-green-950 font-medium">Sourcing Date: <span className="font-mono text-brand-green-900">{invoiceOrder.createdAt || invoiceOrder.orderDate || new Date().toLocaleDateString('en-IN')}</span></p>
                    <p className="text-brand-green-950 font-medium">Payment Ledger: <span className="font-mono text-brand-green-900">{invoiceOrder.paymentMethod}</span></p>
                    <p className="text-brand-green-950 font-medium">Status: <span className={`font-bold uppercase text-[9px] px-2 py-0.5 rounded-full ${invoiceOrder.paymentStatus === 'Paid' || invoiceOrder.paymentStatus === 'Completed' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-brand-gold-500/10 text-brand-gold-700 border border-brand-gold-500/20'}`}>{invoiceOrder.paymentStatus}</span></p>
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

    </div>
  );
};
