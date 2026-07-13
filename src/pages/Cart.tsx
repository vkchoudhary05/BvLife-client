/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Trash2, ArrowRight, ShoppingBag, Sparkles, Tag } from 'lucide-react';
import { CartItem, Coupon, WebsiteSettings } from '../types';

interface CartProps {
  cart: CartItem[];
  onUpdateQty: (productId: string, qty: number) => void;
  onRemoveItem: (productId: string) => void;
  onNavigate: (page: string, params?: any) => void;
  coupons: Coupon[];
  settings: WebsiteSettings;
  onApplyCoupon: (coupon: Coupon | null) => void;
  appliedCoupon: Coupon | null;
}

export const Cart: React.FC<CartProps> = ({
  cart,
  onUpdateQty,
  onRemoveItem,
  onNavigate,
  coupons,
  settings,
  onApplyCoupon,
  appliedCoupon
}) => {
  const [couponCode, setCouponCode] = useState(appliedCoupon ? appliedCoupon.code : '');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(appliedCoupon ? 'Coupon applied successfully!' : '');

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  // Handle coupon validation
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    setCouponSuccess('');

    if (!couponCode.trim()) {
      onApplyCoupon(null);
      return;
    }

    const matched = coupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.active);
    
    if (!matched) {
      setCouponError("Invalid or expired coupon code.");
      onApplyCoupon(null);
      return;
    }

    if (subtotal < matched.minOrderValue) {
      setCouponError(`This coupon requires a minimum subtotal of ₹${matched.minOrderValue}.`);
      onApplyCoupon(null);
      return;
    }

    onApplyCoupon(matched);
    setCouponSuccess(`Success! Code "${matched.code}" applied.`);
  };

  const discountAmount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'fixed') {
      return appliedCoupon.value;
    } else {
      const percentageDeduct = (subtotal * appliedCoupon.value) / 100;
      return appliedCoupon.maxDiscount ? Math.min(percentageDeduct, appliedCoupon.maxDiscount) : percentageDeduct;
    }
  }, [appliedCoupon, subtotal]);

  const taxAmount = useMemo(() => {
    const taxableSub = Math.max(0, subtotal - discountAmount);
    return Math.round((taxableSub * settings.defaultTaxPercentage) / 100);
  }, [subtotal, discountAmount, settings]);

  const shippingCharge = useMemo(() => {
    if (subtotal === 0 || subtotal >= settings.freeShippingThreshold) return 0;
    return settings.baseShippingCharge;
  }, [subtotal, settings]);

  const finalTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + taxAmount + shippingCharge);
  }, [subtotal, discountAmount, taxAmount, shippingCharge]);

  if (cart.length === 0) {
    return (
      <div id="cart-empty-state" className="max-w-md mx-auto text-center py-20 space-y-6">
        <div className="w-16 h-16 rounded-full bg-brand-green-50 flex items-center justify-center text-brand-green-700 mx-auto border border-brand-green-100">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-serif text-xl font-bold text-brand-green-800">Your Apothecary Bag Is Empty</h3>
          <p className="text-xs text-brand-green-600/70 leading-relaxed">Explore our natural extracts and Vedic supplements to restore physical equilibrium and vitality.</p>
        </div>
        <button
          onClick={() => onNavigate('shop')}
          className="bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 font-bold px-8 py-3 rounded-xl text-xs cursor-pointer shadow-sm"
        >
          Explore Shop Apothecary
        </button>
      </div>
    );
  }

  return (
    <div id="cart-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      <div className="border-b border-brand-green-600/10 pb-5 mb-8">
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green-900">Your Apothecary Bag</h2>
        <p className="text-xs text-brand-green-600/70 mt-1">Review your selected Ayurvedic items before securing traditional checkout.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns: Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map(item => (
            <div 
              key={item.product.id} 
              className="bg-white border border-brand-green-600/5 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between"
            >
              
              {/* Image & Title */}
              <div className="flex items-center gap-4 flex-1 w-full">
                <img 
                  src={item.product.mainImage} 
                  alt={item.product.name} 
                  className="w-16 h-16 rounded-lg object-cover border border-brand-green-600/10 flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
                <div className="space-y-0.5 min-w-0 flex-1">
                  <span className="text-[9px] uppercase tracking-wider text-brand-gold-700 font-bold">{item.product.category}</span>
                  <h4 
                    onClick={() => onNavigate('product', { id: item.product.id })}
                    className="font-serif text-sm font-bold text-brand-green-800 hover:text-brand-gold-600 cursor-pointer line-clamp-1 text-left"
                  >
                    {item.product.name}
                  </h4>
                  <p className="text-[10px] text-brand-green-600/40 text-left">In Stock: {item.product.stock} units</p>
                </div>
              </div>

              {/* Adjust Quantity Controls */}
              <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto border-t border-brand-green-600/5 sm:border-t-0 pt-3 sm:pt-0 shrink-0">
                <div className="flex items-center border border-brand-green-100 rounded-lg overflow-hidden bg-white">
                  <button 
                    onClick={() => onUpdateQty(item.product.id, Math.max(1, item.quantity - 1))}
                    className="px-2.5 py-1 text-brand-green-800 font-bold hover:bg-brand-green-50 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-2 text-xs font-semibold text-brand-green-900">{item.quantity}</span>
                  <button 
                    onClick={() => onUpdateQty(item.product.id, Math.min(item.product.stock, item.quantity + 1))}
                    className="px-2.5 py-1 text-brand-green-800 font-bold hover:bg-brand-green-50 cursor-pointer"
                  >
                    +
                  </button>
                </div>

                {/* Pricing subtotal */}
                <div className="text-right w-20">
                  <span className="font-serif font-bold text-sm text-brand-green-900">₹{item.product.price * item.quantity}</span>
                </div>

                {/* Delete */}
                <button 
                  onClick={() => onRemoveItem(item.product.id)}
                  className="p-2 text-brand-green-600/50 hover:text-red-500 transition-colors cursor-pointer"
                  title="Remove Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

            </div>
          ))}

          {/* Prompt banner to get free shipping */}
          {subtotal < settings.freeShippingThreshold && (
            <div className="bg-brand-cream-100/50 border border-brand-green-600/5 p-4 rounded-xl text-xs text-brand-green-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-gold-600 animate-pulse" />
              <span>
                Add <strong>₹{settings.freeShippingThreshold - subtotal}</strong> more of remedies to activate <strong>FREE SHIPPING</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Right Column: Calculations & Coupon summary */}
        <div className="space-y-6">
          
          {/* Summary Box */}
          <div className="bg-white border border-brand-green-600/10 p-6 rounded-2xl space-y-4 shadow-sm">
            <h4 className="font-serif text-base font-bold text-brand-green-900 border-b border-brand-green-600/5 pb-3">
              Order Pricing Summary
            </h4>

            <div className="space-y-2.5 text-xs text-brand-green-800">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-brand-green-900">₹{subtotal}</span>
              </div>
              
              {appliedCoupon && (
                <div className="flex justify-between text-brand-gold-700 font-medium">
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    <span>Coupon ({appliedCoupon.code})</span>
                  </span>
                  <span>-₹{discountAmount}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Vedic Tax ({settings.defaultTaxPercentage}%)</span>
                <span className="font-semibold text-brand-green-900">₹{taxAmount}</span>
              </div>
              
              <div className="flex justify-between">
                <span>Shipping & Herb Transport</span>
                <span className="font-semibold text-brand-green-900">
                  {shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}
                </span>
              </div>

              <div className="pt-3 border-t border-brand-green-600/10 flex justify-between items-baseline font-serif text-base font-bold text-brand-green-950">
                <span>Estimated Total</span>
                <span className="text-xl">₹{finalTotal}</span>
              </div>
            </div>

            {/* Check out button */}
            <div className="pt-2">
              <button
                onClick={() => onNavigate('checkout')}
                className="w-full bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 font-bold py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Proceed to Secure Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Coupon Code Applying Box */}
          <div className="bg-white border border-brand-green-600/10 p-6 rounded-2xl space-y-3 shadow-sm">
            <h5 className="font-serif text-sm font-bold text-brand-green-800 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-brand-gold-600" />
              <span>Apply Well-Being Coupons</span>
            </h5>
            
            <form onSubmit={handleApplyCoupon} className="flex gap-2 text-xs">
              <input
                type="text"
                placeholder="E.g., AYUR15"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 bg-brand-green-50 border border-brand-green-200 rounded-xl px-3 py-2 uppercase placeholder-brand-green-600/20 focus:outline-none focus:border-brand-green-700"
              />
              <button
                type="submit"
                className="bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-green-950 font-bold px-4 rounded-xl transition-all cursor-pointer"
              >
                Apply
              </button>
            </form>

            {couponError && <p className="text-[10px] font-bold text-red-500">{couponError}</p>}
            {couponSuccess && <p className="text-[10px] font-bold text-brand-green-700">{couponSuccess}</p>}
            
            <div className="text-[10px] text-brand-green-600/60 leading-tight">
              💡 Use coupon code <span className="font-bold text-brand-gold-700">AYUR15</span> for 15% off (Min ₹1000 order).
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
