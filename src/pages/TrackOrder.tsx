/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, ArrowLeft, Check, Package, Truck, Calendar, 
  MapPin, AlertCircle, Clock, ShoppingBag, ArrowRight,
  FileText, Tag, Printer, X, RefreshCw, Star, CheckCircle2, ShieldCheck
} from 'lucide-react';
import { Order, User as UserType } from '../types';
import { Language, t } from '../lib/translations';
import { WriteReviewModal } from '../components/WriteReviewModel';

interface TrackOrderProps {
  onNavigate: (page: string, params?: any) => void;
  language: Language;
  currentUser: UserType | null;
  authToken: string | null;
  onPostReview?: (reviewData: any) => Promise<void> | void;
}

export const TrackOrder: React.FC<TrackOrderProps> = ({
  onNavigate,
  language,
  currentUser,
  authToken,
  onPostReview
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [reviewModalProduct, setReviewModalProduct] = useState<{ id: string; name: string; image?: string; defaultRating?: number } | null>(null);
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('grams_reviewed_products');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [order, setOrder] = useState<Order | null>(() => {
    try {
      const userEmail = currentUser?.email?.toLowerCase();
      if (!userEmail) return null; // Strictly avoid preloading unverified storage without active user match

      const lastCompleted = localStorage.getItem('grams_last_completed_order');
      if (lastCompleted) {
        const parsed = JSON.parse(lastCompleted);
        if (parsed.userEmail && parsed.userEmail.toLowerCase() === userEmail) {
          return parsed;
        }
      }
      const lastPlaced = localStorage.getItem('grams_last_placed_order');
      if (lastPlaced) {
        const parsed = JSON.parse(lastPlaced);
        if (parsed.userEmail && parsed.userEmail.toLowerCase() === userEmail) {
          return parsed;
        }
      }
    } catch (e) {}
    return null;
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [shippingLabelOrder, setShippingLabelOrder] = useState<Order | null>(null);

  // Fetch logged in customer's order history
  const fetchUserOrders = useCallback(async () => {
    if (!currentUser || !currentUser.email) {
      setRecentOrders([]);
      return;
    }
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`/api/orders/user/${encodeURIComponent(currentUser.email)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const userEmailLower = currentUser.email.toLowerCase();
          const userPhoneClean = currentUser.phone ? currentUser.phone.replace(/\D/g, '') : '';

          // Strictly filter by current customer's email or phone
          const filtered = data.filter((o: Order) => {
            const oEmail = o.userEmail ? o.userEmail.toLowerCase() : '';
            const oPhone = o.shippingAddress?.phone ? o.shippingAddress.phone.replace(/\D/g, '') : '';
            const emailMatch = !!(userEmailLower && oEmail === userEmailLower);
            const phoneMatch = !!(userPhoneClean && userPhoneClean.length >= 10 && oPhone.endsWith(userPhoneClean.slice(-10)));
            return emailMatch || phoneMatch;
          });

          // Sort by date descending
          const sorted = filtered.sort((a: any, b: any) => 
            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
          );
          setRecentOrders(sorted);

          // If no order currently selected OR current order belongs to another customer, auto-select this customer's latest order
          setOrder(prev => {
            if (!prev || (prev.userEmail && prev.userEmail.toLowerCase() !== userEmailLower)) {
              return sorted[0] || null;
            }
            return prev;
          });
        } else {
          setRecentOrders([]);
        }
      } else {
        setRecentOrders([]);
      }
    } catch (err) {
      console.error("Error fetching orders for quick track: ", err);
      setRecentOrders([]);
    }
  }, [currentUser?.email, currentUser?.phone, authToken]);

  useEffect(() => {
    fetchUserOrders();
  }, [fetchUserOrders]);

  // Track / Search specific order by ID, tracking number, email, or phone
  const handleTrack = async (identifierStr: string) => {
    const id = identifierStr.trim();
    if (!id) return;

    setLoading(true);
    setError('');

    try {
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`/api/orders/track/${encodeURIComponent(id)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const activeOrder = data.order || (data.id ? data : null);
        if (activeOrder) {
          setOrder(activeOrder);

          // If logged-in and this order belongs to current user, include in recent list
          if (currentUser?.email) {
            const userEmailLower = currentUser.email.toLowerCase();
            if (activeOrder.userEmail && activeOrder.userEmail.toLowerCase() === userEmailLower) {
              setRecentOrders(prev => {
                const exists = prev.some(o => o.id === activeOrder.id);
                return exists ? prev : [activeOrder, ...prev];
              });
            }
          } else if (Array.isArray(data.userOrders) && data.userOrders.length > 0) {
            setRecentOrders(data.userOrders);
          }
        } else {
          setError('No order found matching that reference.');
        }
      } else {
        const errData = await res.json();
        setError(errData.error || 'No order found matching that Order ID, tracking number, email, or phone number.');
      }
    } catch (err) {
      console.error(err);
      setError('A connection issue occurred while fetching order status.');
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh handler on demand
  const handleRefreshStatus = async () => {
    if (!order?.id) return;
    setRefreshing(true);
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
      const res = await fetch(`/api/orders/track/${encodeURIComponent(order.id)}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const activeOrder = data.order || (data.id ? data : null);
        if (activeOrder) {
          setOrder(activeOrder);
        }
      }
    } catch (e) {
      console.warn('Status refresh notice:', e);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrack(searchQuery);
  };

  // Helper to format date
  const formatDate = (dateStr: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = { 
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      };
      return new Date(dateStr).toLocaleDateString(undefined, options);
    } catch (err) {
      return dateStr;
    }
  };

  // Helper to determine active step index for delivery status
  const getStatusIndex = (status: Order['status']) => {
    const steps = ['Ordered', 'Prepared', 'Dispatched', 'Delivered'];
    return steps.indexOf(status);
  };

  const steps = [
    { key: 'Ordered', title: 'Order Confirmed', desc: 'Your wellbeing request has been secured.' },
    { key: 'Prepared', title: 'Brewed & Packed', desc: 'Formulations prepared and packed under sacred supervision.' },
    { key: 'Dispatched', title: 'In Transit', desc: 'Your package is on its healing path with our delivery courier.' },
    { key: 'Delivered', title: 'Arrived at Destination', desc: 'The natural remedies have reached your sanctuary.' }
  ];

  const currentIdx = order ? getStatusIndex(order.status) : -1;

  return (
    <div id="track-order-page" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
      {/* Header and Back Link */}
      <div className="mb-5 flex justify-between items-center">
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-xs font-bold text-brand-green-800 hover:text-brand-gold-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
        <span className="text-xs font-mono text-brand-green-600/70">
          Tracking Portal
        </span>
      </div>

      <div className="text-center space-y-3 mb-10">
        <h2 className="font-serif text-3xl sm:text-4xl font-bold text-brand-green-900 tracking-tight">
          Track Your Wellness Shipment
        </h2>
        <p className="text-xs sm:text-sm text-brand-green-800/70 max-w-xl mx-auto leading-relaxed">
          Monitor your organic formulations and Ayurvedic remedies from the moment they are handcrafted at our temple to the time they arrive at your sanctuary.
        </p>
      </div>

      {/* Main Search Input Form */}
      <div className="bg-brand-cream-50 border border-brand-gold-300 rounded-[2rem] p-6 sm:p-8 shadow-md space-y-6 relative overflow-hidden mb-8">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-gold-500 via-brand-cream-300 to-brand-gold-600" />
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-brand-green-800/80 block font-serif">
              Search by Order ID, Tracking Ref, Email, or Mobile
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. GL-123456-78, user@email.com, or 9876543210"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-3.5 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-sm font-semibold text-brand-green-950 placeholder-brand-green-300 shadow-sm transition-all"
              />
              <button 
                type="submit" 
                disabled={loading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-brand-green-800 hover:bg-brand-green-900 disabled:bg-brand-green-800/40 text-brand-cream-50 rounded-xl transition-all cursor-pointer shadow"
              >
                {loading ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </form>

        {error && (
          <div className="p-3 bg-red-50 border border-red-150 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Quick Select Panel for Previous & Latest Orders */}
      {recentOrders.length > 0 && (
        <div className="space-y-3 mb-8 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-sm font-extrabold text-brand-green-950 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand-gold-600" />
              <span>Your Orders History ({recentOrders.length})</span>
            </h3>
            <span className="text-[10px] text-brand-green-600/70 font-sans">
              Click any order to view detailed status
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentOrders.map((o, idx) => {
              const isLatest = idx === 0;
              const isSelected = order?.id === o.id;

              return (
                <button
                  key={o.id}
                  onClick={() => {
                    setOrder(o);
                    setSearchQuery(o.id);
                  }}
                  className={`p-3.5 text-left border rounded-2xl transition-all duration-200 shadow-sm flex flex-col justify-between group cursor-pointer relative ${
                    isSelected 
                      ? 'border-brand-green-800 bg-brand-green-50/60 ring-2 ring-brand-green-800/20' 
                      : 'border-brand-green-200/60 hover:border-brand-green-700 bg-white hover:bg-brand-cream-50/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isLatest 
                          ? 'bg-brand-gold-500 text-brand-green-950 font-bold shadow-xs' 
                          : 'bg-brand-green-100 text-brand-green-800'
                      }`}>
                        {isLatest ? '✨ Latest Order' : `Previous Order #${recentOrders.length - idx}`}
                      </span>

                      <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-brand-green-700/10 text-brand-green-900">
                        {o.status}
                      </span>
                    </div>

                    <div className="pt-1">
                      <span className="block text-xs font-bold font-mono text-brand-green-950">
                        {o.id}
                      </span>
                      <span className="block text-[10px] text-brand-green-600/70 font-medium">
                        {o.orderDate ? o.orderDate.split('T')[0] : 'Recent'} • {o.items?.length || 0} item{(o.items?.length || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-brand-green-100/60 flex items-center justify-between text-xs">
                    <span className="font-serif font-bold text-brand-green-900">
                      ₹{o.finalTotal}
                    </span>
                    <span className="text-[10px] font-bold text-brand-green-800 group-hover:text-brand-gold-600 flex items-center gap-1 transition-colors">
                      {isSelected ? 'Viewing Details' : 'View Tracking'}
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Tracking Results View */}
      {order && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-300">
          
          {/* Order Meta Panel */}
          <div className="bg-white border border-brand-green-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-brand-green-700 text-brand-cream-50 px-2.5 py-0.5 rounded-full border border-brand-gold-500/10 shadow-sm">
                  {order.status}
                </span>
                {order.trackingNumber && (
                  <span className="text-[10px] font-extrabold uppercase tracking-widest bg-brand-gold-500/10 text-brand-gold-700 px-2.5 py-0.5 rounded-full border border-brand-gold-500/20">
                    Carrier: Grams Express
                  </span>
                )}
              </div>
              <h3 className="font-serif text-lg font-bold text-brand-green-950 flex items-center gap-2">
                <span>Order {order.id}</span>
              </h3>
              <p className="text-xs text-brand-green-600/70 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Placed on {formatDate(order.orderDate)}</span>
              </p>
            </div>

            <div className="space-y-2 text-xs md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-brand-green-100">
              <div>
                <p className="text-brand-green-600/50">Tracking Number</p>
                <p className="font-mono font-bold text-sm text-brand-gold-700 tracking-wide">{order.trackingNumber || 'GL-PENDING-ASSIGNMENT'}</p>
                <p className="text-xs font-semibold text-brand-green-900">Total Secured: ₹{order.finalTotal}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 md:justify-end">
                <button
                  onClick={handleRefreshStatus}
                  disabled={refreshing}
                  title="Refresh latest delivery updates from sanctuary"
                  className="px-3 py-1.5 rounded-xl border border-brand-green-300 hover:border-brand-green-700 text-brand-green-900 bg-white hover:bg-brand-green-50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-brand-gold-600' : 'text-brand-green-800'}`} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh Status'}</span>
                </button>
                <button
                  onClick={() => setInvoiceOrder(order)}
                  className="px-3 py-1.5 rounded-xl border border-brand-gold-500/30 hover:border-brand-gold-500 text-brand-gold-700 bg-brand-gold-50/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Print Bill</span>
                </button>
                <button
                  onClick={() => setShippingLabelOrder(order)}
                  className="px-3 py-1.5 rounded-xl border border-brand-green-600/30 hover:border-brand-green-600 text-brand-green-800 bg-brand-green-50/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>Print Label</span>
                </button>
              </div>
            </div>
          </div>

          {/* Visual Tracking Stepper Progress Line */}
          <div className="bg-brand-cream-50/40 border border-brand-gold-300/30 rounded-3xl p-6 sm:p-8 shadow-sm">
            <h4 className="font-serif text-sm font-bold text-brand-green-950 mb-8 pb-3 border-b border-brand-green-100">
              Shipment Dispatch Pipeline
            </h4>

            {/* Stepper Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              
              {/* Connector horizontal bar */}
              <div className="hidden md:block absolute top-[18px] left-[12%] right-[12%] h-1 bg-brand-green-200/50 z-0">
                <div 
                  className="h-full bg-brand-green-700 transition-all duration-500"
                  style={{ width: `${currentIdx >= 0 ? (currentIdx / 3) * 100 : 0}%` }}
                />
              </div>

              {steps.map((step, idx) => {
                const isActive = idx <= currentIdx;
                const isCurrent = idx === currentIdx;

                return (
                  <div key={idx} className="flex md:flex-col items-start md:items-center text-left md:text-center gap-4 md:gap-3 z-10">
                    
                    {/* Circle badge */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border font-bold text-xs shadow-sm shrink-0 transition-all ${
                      isActive 
                        ? 'bg-brand-green-700 text-brand-cream-50 border-brand-green-700 ring-4 ring-brand-green-700/10 scale-105' 
                        : 'bg-white text-brand-green-300 border-brand-green-200'
                    }`}>
                      {isActive ? (
                        <Check className="w-4 h-4 text-brand-cream-50" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <p className={`text-xs font-bold leading-tight ${isActive ? 'text-brand-green-900 font-serif' : 'text-brand-green-600/50'}`}>
                        {step.title}
                      </p>
                      <p className="text-[10px] text-brand-green-600/70 max-w-[150px] md:mx-auto leading-relaxed">
                        {step.desc}
                      </p>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          {/* Ledger of Detailed Tracking Updates */}
          <div className="bg-white border border-brand-green-200 rounded-3xl p-6 shadow-sm">
            <h4 className="font-serif text-sm font-bold text-brand-green-950 mb-6 pb-3 border-b border-brand-green-100 flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand-gold-600" />
              <span>Sanctuary Dispatch Log</span>
            </h4>

            {order.trackingUpdates && order.trackingUpdates.length > 0 ? (
              <div className="relative pl-6 space-y-6 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-0.5 before:bg-brand-green-200/50">
                {order.trackingUpdates.slice().reverse().map((update, idx) => {
                  const isLatest = idx === 0;

                  return (
                    <div key={idx} className="relative space-y-1 animate-in fade-in duration-300">
                      
                      {/* Bullet point indicator */}
                      <div className={`absolute -left-[20px] top-1.5 w-2.5 h-2.5 rounded-full border-2 ${
                        isLatest 
                          ? 'bg-brand-gold-500 border-brand-gold-500 scale-110 shadow animate-pulse' 
                          : 'bg-brand-green-700 border-white'
                      }`} />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1">
                        <span className={`font-bold uppercase tracking-wider ${isLatest ? 'text-brand-gold-800' : 'text-brand-green-950'}`}>
                          {update.status} {isLatest && '• Latest'}
                        </span>
                        <span className="text-[10px] text-brand-green-600/50 font-mono">
                          {formatDate(update.date)}
                        </span>
                      </div>
                      <p className="text-xs text-brand-green-800/80 leading-relaxed font-medium">
                        {update.comment}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-brand-green-600 italic">
                Initial tracking pending. Check back soon.
              </div>
            )}
          </div>

          {/* Delivery Endpoint Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            <div className="bg-white border border-brand-green-200 rounded-3xl p-6 shadow-sm space-y-3">
              <h4 className="font-serif text-xs font-bold text-brand-green-950 uppercase tracking-widest border-b pb-2 text-brand-gold-700">
                Delivery Endpoint
              </h4>
              <div className="text-xs space-y-1.5 text-brand-green-800 font-medium">
                <p className="font-bold text-brand-green-950 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-brand-gold-600" />
                  <span>{order.shippingAddress?.fullName || order.userName || 'Valued Customer'}</span>
                </p>
                <p>{order.shippingAddress?.addressLine1 || 'Address registered on file'}</p>
                {order.shippingAddress?.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>{order.shippingAddress?.city || ''}{order.shippingAddress?.state ? `, ${order.shippingAddress.state}` : ''}{order.shippingAddress?.zipCode ? ` - ${order.shippingAddress.zipCode}` : ''}</p>
                <p className="font-mono text-[10px] text-brand-green-600/70 pt-1">Phone: {order.shippingAddress?.phone || 'On File'}</p>
              </div>
            </div>

            {/* Post-Delivery Review Banner when Order is Delivered */}
            {order.status === 'Delivered' && (
              <div className="sm:col-span-2 bg-gradient-to-r from-emerald-50 via-brand-cream-50 to-amber-50/50 border border-emerald-300/80 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-xs border border-emerald-200">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif text-sm sm:text-base font-bold text-brand-green-950">
                        {language === 'hi' ? 'ऑर्डर सफलतापूर्वक डिलीवर हुआ!' : 'Package Delivered Successfully!'}
                      </h4>
                      <span className="bg-emerald-200 text-emerald-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Verified Purchase
                      </span>
                    </div>
                    <p className="text-xs text-brand-green-700/90 mt-0.5">
                      {language === 'hi'
                        ? 'अपने प्राप्त उपचारों के लिए अपनी स्टार रेटिंग और प्रामाणिक अनुभव साझा करें।'
                        : 'Share your herbal healing experience and rate each formulation in your delivered order.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('dashboard', { tab: 'orders' })}
                  className="inline-flex items-center gap-1.5 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-all cursor-pointer shrink-0"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{language === 'hi' ? 'ऑर्डर हिस्ट्री देखें' : 'View in Order History'}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-brand-gold-400" />
                </button>
              </div>
            )}

            <div className="bg-white border border-brand-green-200 rounded-3xl p-6 shadow-sm space-y-3">
              <h4 className="font-serif text-xs font-bold text-brand-green-950 uppercase tracking-widest border-b pb-2 text-brand-gold-700">
                Apothecary Compounds Sourced
              </h4>
              <div className="text-xs space-y-3 text-brand-green-800 font-medium">
                {(order.items || []).map((item, i) => {
                  const isReviewed = reviewedProductIds.includes(item.productId);
                  return (
                    <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-brand-green-100/60 last:border-0 last:pb-0">
                      <div className="space-y-0.5">
                        <div className="font-bold text-brand-green-950 flex flex-wrap items-center gap-1.5">
                          <span>{item.productName}</span>
                          {(item.variantName || item.variantSize) && (
                            <span className="text-[10px] font-semibold bg-brand-gold-100 text-brand-gold-900 px-2 py-0.5 rounded-full border border-brand-gold-300/60">
                              {item.variantName || item.variantSize}
                            </span>
                          )}
                          <span className="text-brand-green-600/60 font-normal">x{item.quantity}</span>
                        </div>
                        <span className="font-serif text-brand-green-900 text-xs">₹{item.price * item.quantity}</span>
                      </div>

                      {order.status === 'Delivered' && (
                        <div className="flex items-center gap-2 pt-1 sm:pt-0">
                          {isReviewed ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{language === 'hi' ? 'समीक्षा दर्ज ✓' : 'Reviewed ✓'}</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setReviewModalProduct({
                                  id: item.productId,
                                  name: item.productName,
                                  image: item.mainImage,
                                  defaultRating: 5
                                });
                              }}
                              className="inline-flex items-center gap-1.5 bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-green-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all shadow-2xs cursor-pointer active:scale-95"
                            >
                              <Star className="w-3 h-3 fill-brand-green-950" />
                              <span>{language === 'hi' ? 'समीक्षा लिखें' : 'Rate & Review'}</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div className="border-t border-brand-green-100 pt-2 flex justify-between items-center font-bold text-brand-green-950">
                  <span>Final Sourced Amount</span>
                  <span className="font-serif">₹{order.finalTotal}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Bill Invoice Modal */}
      {invoiceOrder && (
        <div className="fixed inset-0 bg-brand-green-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="max-w-2xl w-full bg-brand-cream-50 rounded-[2rem] shadow-2xl border border-brand-gold-500/20 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
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
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

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
                  body * { visibility: hidden !important; }
                  #print-invoice-area, #print-invoice-area * { visibility: visible !important; }
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
                  .print-hide, .print\:hidden { display: none !important; }
                }
              `}</style>
              <div className="flex justify-between items-center border-b border-brand-green-700/10 pb-6">
                <div>
                  <h2 className="font-serif text-2xl font-bold text-brand-green-900">Grams Life</h2>
                  <span className="text-[10px] uppercase tracking-widest text-brand-gold-700 font-extrabold block">Ayurvedic Sanctuary Invoice</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-xs font-bold text-brand-green-900">ORDER: {invoiceOrder.id}</span>
                  <p className="text-xs text-brand-green-700">{invoiceOrder.orderDate}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 text-xs">
                <div>
                  <h4 className="font-bold text-brand-green-700 uppercase">Billed & Shipped To:</h4>
                  <p className="font-bold text-brand-green-950">{invoiceOrder.shippingAddress?.fullName || invoiceOrder.userName}</p>
                  <p>{invoiceOrder.shippingAddress?.addressLine1}</p>
                  <p>{invoiceOrder.shippingAddress?.city}, {invoiceOrder.shippingAddress?.state} - {invoiceOrder.shippingAddress?.zipCode}</p>
                  <p className="font-mono text-[10px] text-brand-gold-700 font-bold">Contact: {invoiceOrder.shippingAddress?.phone}</p>
                </div>
                <div className="text-right">
                  <h4 className="font-bold text-brand-green-700 uppercase">Payment Details:</h4>
                  <p>Method: <span className="font-bold">{invoiceOrder.paymentMethod}</span></p>
                  <p>Status: <span className="font-bold uppercase text-brand-green-800">{invoiceOrder.paymentStatus}</span></p>
                </div>
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b font-bold uppercase text-brand-green-800">
                    <th className="py-2">Item</th>
                    <th className="py-2 text-center">Qty</th>
                    <th className="py-2 text-right">Price</th>
                    <th className="py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-green-100">
                  {invoiceOrder.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-bold">
                        <div>{item.productName}</div>
                        {(item.variantName || item.variantSize) && (
                          <div className="text-[10px] text-brand-gold-700 font-normal font-sans">
                            {item.variantName || item.variantSize}
                          </div>
                        )}
                      </td>
                      <td className="py-2 text-center">{item.quantity}</td>
                      <td className="py-2 text-right">₹{item.price}</td>
                      <td className="py-2 text-right font-bold">₹{item.price * item.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex justify-end border-t pt-4 text-xs font-bold">
                <div className="w-48 space-y-1">
                  <div className="flex justify-between"><span>Subtotal:</span><span>₹{invoiceOrder.subtotal}</span></div>
                  <div className="flex justify-between"><span>Tax:</span><span>₹{invoiceOrder.tax}</span></div>
                  <div className="flex justify-between border-t pt-2 text-sm text-brand-green-950 font-extrabold"><span>Total Paid:</span><span>₹{invoiceOrder.finalTotal}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Courier Shipping Label Modal */}
      {shippingLabelOrder && (
        <div className="fixed inset-0 bg-brand-green-950/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
          <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border border-gray-300 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
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
                  <span>Print Label</span>
                </button>
                <button
                  onClick={() => setShippingLabelOrder(null)}
                  className="p-2 rounded-xl hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

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
                  body * { visibility: hidden !important; }
                  #print-shipping-label-area, #print-shipping-label-area * { visibility: visible !important; }
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
                  .print-hide, .print\:hidden { display: none !important; }
                }
              `}</style>

              <div className="border-4 border-black p-4 space-y-3 bg-white text-black">
                <div className="flex justify-between items-center border-b-4 border-black pb-3">
                  <div>
                    <h1 className="text-xl font-black tracking-tighter uppercase italic">FLIPKART LOGISTICS</h1>
                    <p className="text-[10px] font-mono font-bold text-gray-700">EXPRESS COURIER DISPATCH</p>
                  </div>
                  <span className="text-xs font-mono font-black border-2 border-black px-2 py-1 uppercase bg-black text-white">STANDARD</span>
                </div>

                <div className="border-b-4 border-black pb-3 text-center space-y-1">
                  <p className="text-[10px] font-mono font-bold uppercase text-gray-600">AWB Tracking Number</p>
                  <p className="text-lg font-mono font-black tracking-widest">AWB-883{shippingLabelOrder.id.replace(/\D/g, '').slice(-8) || '92100492'}</p>
                  <div className="flex justify-center items-center h-10 my-1 gap-[2px]">
                    {[3,1,2,1,4,1,2,3,1,3,2,1,4,1,2,1,3,2,4,1,2,3,1,2,4,1,3,1,2,4,2,1,3].map((w, idx) => (
                      <div key={idx} className="bg-black h-full" style={{ width: `${w * 2}px` }} />
                    ))}
                  </div>
                </div>

                <div className="border-b-4 border-black pb-3">
                  {shippingLabelOrder.paymentMethod === 'Cash on Delivery' || shippingLabelOrder.paymentStatus === 'Pending' ? (
                    <div className="border-4 border-black p-2 text-center bg-yellow-200 text-black">
                      <p className="text-xs font-black uppercase">CASH ON DELIVERY (COD)</p>
                      <p className="text-2xl font-black font-mono">COLLECT CASH: ₹{shippingLabelOrder.finalTotal}</p>
                    </div>
                  ) : (
                    <div className="border-4 border-black p-2 text-center bg-black text-white">
                      <p className="text-xs font-black uppercase">PREPAID ORDER</p>
                      <p className="text-xl font-black font-mono">DO NOT COLLECT ANY CASH (PAID ₹{shippingLabelOrder.finalTotal})</p>
                    </div>
                  )}
                </div>

                <div className="border-b-4 border-black pb-3 space-y-1">
                  <p className="text-[10px] font-mono font-black uppercase bg-black text-white px-2 py-0.5 inline-block">SHIP TO</p>
                  <div className="text-sm font-bold pl-1">
                    <p className="text-base font-black uppercase">{shippingLabelOrder.shippingAddress?.fullName || shippingLabelOrder.userName}</p>
                    <p>{shippingLabelOrder.shippingAddress?.addressLine1}</p>
                    <p>{shippingLabelOrder.shippingAddress?.city}, {shippingLabelOrder.shippingAddress?.state}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="border-2 border-black px-3 py-1 bg-gray-100">
                        <span className="text-[10px] font-mono font-bold block">PIN CODE</span>
                        <span className="text-xl font-black font-mono">{shippingLabelOrder.shippingAddress?.zipCode || '302001'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono font-bold text-gray-600 block">CONTACT</span>
                        <span className="text-base font-black font-mono">📞 {shippingLabelOrder.shippingAddress?.phone || 'On File'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-bold border-b-4 border-black pb-3">
                  <p className="font-black text-gray-800">RETURN TO: Grams Life Sanctuary, Plot 42, Veda Heritage, Jaipur, RJ - 302020</p>
                </div>

                <div className="text-[10px] font-mono border-t border-black pt-1 flex justify-between">
                  <span>ORDER ID: {shippingLabelOrder.id}</span>
                  <span>ITEMS: {shippingLabelOrder.items?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rate & Review Modal for Delivered Items */}
      {reviewModalProduct && (
        <WriteReviewModal
          productId={reviewModalProduct.id}
          productName={reviewModalProduct.name}
          productImage={reviewModalProduct.image}
          defaultRating={reviewModalProduct.defaultRating || 5}
          onClose={() => setReviewModalProduct(null)}
          onSubmitReview={async (reviewData) => {
            if (onPostReview) {
              await onPostReview(reviewData);
            }
            setReviewedProductIds(prev => {
              const updated = [...prev, reviewData.productId];
              try {
                localStorage.setItem('grams_reviewed_products', JSON.stringify(updated));
              } catch {}
              return updated;
            });
            setReviewModalProduct(null);
          }}
          language={language}
          currentUser={currentUser}
        />
      )}

    </div>
  );
};
