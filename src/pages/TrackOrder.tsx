/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, ArrowLeft, Check, Package, Truck, Calendar, 
  MapPin, AlertCircle, Clock, ShoppingBag, ArrowRight
} from 'lucide-react';
import { Order, User as UserType } from '../types';
import { Language, t } from '../lib/translations';

interface TrackOrderProps {
  onNavigate: (page: string, params?: any) => void;
  language: Language;
  currentUser: UserType | null;
  authToken: string | null;
}

export const TrackOrder: React.FC<TrackOrderProps> = ({
  onNavigate,
  language,
  currentUser,
  authToken
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState<Order | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // If user is logged in, fetch their recent orders to allow easy tracking clicks
  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!authToken || !currentUser) return;
      try {
        const res = await fetch('/api/orders', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Sort by date descending
          const sorted = data.sort((a: any, b: any) => 
            new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
          );
          setRecentOrders(sorted);
        }
      } catch (err) {
        console.error("Error fetching orders for quick track: ", err);
      }
    };

    fetchUserOrders();
  }, [currentUser, authToken]);

  const handleTrack = async (identifierStr: string) => {
    const id = identifierStr.trim();
    if (!id) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(id)}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
      } else {
        const errData = await res.json();
        setError(errData.error || 'No order found with that ID or tracking number.');
      }
    } catch (err) {
      console.error(err);
      setError('A connection issue occurred while fetching order status.');
    } finally {
      setLoading(false);
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
    <div id="track-order-page" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      
      {/* Header and Back Link */}
      <div className="mb-8 flex justify-between items-center">
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
      <div className="bg-brand-cream-50 border border-brand-gold-300 rounded-[2rem] p-6 sm:p-8 shadow-md space-y-6 relative overflow-hidden mb-10">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-gold-500 via-brand-cream-300 to-brand-gold-600" />
        
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider font-extrabold text-brand-green-800/80 block font-serif">
              Order ID or Tracking Reference
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. GL-123456-78 or GLTRK123456"
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

      {/* Logged in users: Quick tracked list */}
      {!order && recentOrders.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <h3 className="font-serif text-sm font-extrabold text-brand-green-950 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag className="w-4 h-4 text-brand-gold-600" />
            <span>Your Active Shipments</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentOrders.slice(0, 4).map((o) => (
              <button
                key={o.id}
                onClick={() => {
                  setSearchQuery(o.id);
                  handleTrack(o.id);
                }}
                className="p-4 text-left border border-brand-green-200/50 hover:border-brand-green-800 bg-white hover:bg-brand-green-50/10 rounded-2xl transition-all duration-200 shadow-sm flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="block text-xs font-bold font-mono text-brand-green-950">ID: {o.id}</span>
                  <span className="block text-[10px] text-brand-green-600/70">{o.orderDate.split('T')[0]} • {o.items.length} items</span>
                  <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-extrabold uppercase rounded bg-brand-gold-500/10 text-brand-gold-700">
                    {o.status}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-brand-green-50 text-brand-green-700 group-hover:bg-brand-gold-500/10 group-hover:text-brand-gold-700 transition-colors">
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            ))}
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

            <div className="space-y-1 text-xs md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-brand-green-100">
              <p className="text-brand-green-600/50">Tracking Number</p>
              <p className="font-mono font-bold text-sm text-brand-gold-700 tracking-wide">{order.trackingNumber || 'GL-PENDING-ASSIGNMENT'}</p>
              <p className="text-xs font-semibold text-brand-green-900">Total Secured: ₹{order.finalTotal}</p>
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
                  <span>{order.shippingAddress.fullName}</span>
                </p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.zipCode}</p>
                <p className="font-mono text-[10px] text-brand-green-600/70 pt-1">Phone: {order.shippingAddress.phone}</p>
              </div>
            </div>

            <div className="bg-white border border-brand-green-200 rounded-3xl p-6 shadow-sm space-y-3">
              <h4 className="font-serif text-xs font-bold text-brand-green-950 uppercase tracking-widest border-b pb-2 text-brand-gold-700">
                Apothecary Compounds Sourced
              </h4>
              <div className="text-xs space-y-2 text-brand-green-800 font-medium">
                {order.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <span>{item.productName} <span className="text-brand-green-600/50 font-sans">x{item.quantity}</span></span>
                    <span className="font-serif text-brand-green-950">₹{item.price * item.quantity}</span>
                  </div>
                ))}
                <div className="border-t border-brand-green-100 pt-2 flex justify-between items-center font-bold text-brand-green-950">
                  <span>Final Sourced Amount</span>
                  <span className="font-serif">₹{order.finalTotal}</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
