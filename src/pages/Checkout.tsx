/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ShieldCheck, Plus, ShoppingBag, ArrowLeft, CheckCircle2, Ticket } from 'lucide-react';
import { CartItem, Address, Coupon, WebsiteSettings, Order } from '../types';
import { validateAndFormatIndianPhone } from '../utils';

interface CheckoutProps {
  cart: CartItem[];
  userAddresses: Address[];
  onAddAddress: (addr: Address) => void;
  onNavigate: (page: string, params?: any) => void;
  appliedCoupon: Coupon | null;
  settings: WebsiteSettings;
  onPlaceOrder: (orderData: Partial<Order>) => Promise<Order | null>;
}

export const Checkout: React.FC<CheckoutProps> = ({
  cart,
  userAddresses,
  onAddAddress,
  onNavigate,
  appliedCoupon,
  settings,
  onPlaceOrder
}) => {
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    userAddresses.find(a => a.isDefault)?.id || userAddresses[0]?.id || ''
  );
  
  // New Address form toggle & state
  const [showAddAddrForm, setShowAddAddrForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'UPI' | 'Cards' | 'Net Banking' | 'Cash on Delivery'>('UPI');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState<Order | null>(null);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

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

  // Handle Add New Address
  const [addressError, setAddressError] = useState('');

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');
    if (!fullName || !addressLine1 || !city || !stateName || !zipCode || !phone) return;

    // Validate and format receiver contact phone
    const formattedPhone = validateAndFormatIndianPhone(phone);
    if (!formattedPhone) {
      setAddressError("Please enter a valid 10-digit mobile phone number.");
      return;
    }

    const newAddr: Address = {
      id: `addr-${Date.now()}`,
      fullName,
      addressLine1,
      addressLine2,
      city,
      state: stateName,
      zipCode,
      phone: formattedPhone,
      isDefault: userAddresses.length === 0
    };

    onAddAddress(newAddr);
    setSelectedAddressId(newAddr.id);
    setShowAddAddrForm(false);
    
    // reset form fields
    setFullName('');
    setAddressLine1('');
    setAddressLine2('');
    setCity('');
    setStateName('');
    setZipCode('');
    setPhone('');
  };

  // Handle Submit Order
  const handleSubmitOrder = async () => {
    const selectedAddress = userAddresses.find(a => a.id === selectedAddressId);
    if (!selectedAddress) {
      alert("Please provide or select a shipping address.");
      return;
    }

    setProcessingOrder(true);

    const itemsPayload = cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      mainImage: item.product.mainImage
    }));

    const result = await onPlaceOrder({
      shippingAddress: selectedAddress,
      items: itemsPayload,
      subtotal,
      tax: taxAmount,
      shippingCharge,
      discount: discountAmount,
      finalTotal,
      paymentMethod
    });

    if (result) {
      setOrderCompleted(result);
    } else {
      alert("Order failed. Please check your network and try again.");
    }
    setProcessingOrder(false);
  };

  if (cart.length === 0 && !orderCompleted) {
    onNavigate('cart');
    return null;
  }

  return (
    <div id="checkout-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {orderCompleted ? (
        /* SUCCESS RECEIPT PAGE SCREEN */
        <div className="max-w-2xl mx-auto bg-white border border-brand-green-600/15 p-8 rounded-2xl text-center space-y-6 shadow-xl animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 rounded-full bg-brand-green-100 flex items-center justify-center text-brand-green-700 mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          
          <div className="space-y-1.5">
            <h3 className="font-serif text-2xl font-bold text-brand-green-900">Your Wellness Order Is Secured!</h3>
            <p className="text-sm text-brand-green-800">Your order has been logged into the Vedic chronicle database.</p>
            <p className="text-xs font-mono text-brand-gold-700 font-bold">ORDER ID: {orderCompleted.id}</p>
          </div>

          <div className="border-t border-b border-brand-green-600/10 py-5 text-left text-xs text-brand-green-800 space-y-4">
            
            {/* Delivery address details */}
            <div className="space-y-1">
              <h5 className="font-bold text-brand-green-900">Delivery Address Selected:</h5>
              <p className="font-medium text-brand-green-900/80">{orderCompleted.shippingAddress.fullName}</p>
              <p>{orderCompleted.shippingAddress.addressLine1}, {orderCompleted.shippingAddress.addressLine2 || ''}</p>
              <p>{orderCompleted.shippingAddress.city}, {orderCompleted.shippingAddress.state} - {orderCompleted.shippingAddress.zipCode}</p>
              <p>Phone Contact: {orderCompleted.shippingAddress.phone}</p>
            </div>

            {/* Items details table */}
            <div className="space-y-2 pt-2 border-t border-brand-green-600/5">
              <h5 className="font-bold text-brand-green-900">Remedies Breakdown:</h5>
              <div className="space-y-1.5">
                {orderCompleted.items.map((it, i) => (
                  <div key={i} className="flex justify-between font-medium">
                    <span>{it.productName} (x{it.quantity})</span>
                    <span>₹{it.price * it.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="pt-2 border-t border-brand-green-600/5 flex justify-between font-serif text-sm font-bold text-brand-green-950">
              <span>Grand Total Secured</span>
              <span>₹{orderCompleted.finalTotal}</span>
            </div>

            <div className="bg-brand-cream-100 p-3 rounded-lg border border-brand-gold-500/15 text-center text-[10px] text-brand-gold-700 font-bold uppercase tracking-wider">
              🛡️ Payment status: {orderCompleted.paymentStatus} via {orderCompleted.paymentMethod}
            </div>

          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => onNavigate('dashboard', { tab: 'orders' })}
              className="flex-1 bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 font-bold py-3 rounded-xl text-xs cursor-pointer"
            >
              Track Order In Dashboard
            </button>
            <button 
              onClick={() => onNavigate('shop')}
              className="flex-1 border border-brand-green-600/20 text-brand-green-800 font-bold py-3 rounded-xl text-xs cursor-pointer hover:bg-brand-green-50"
            >
              Continue Apothecary Shopping
            </button>
          </div>

        </div>
      ) : (
        /* STANDARD CHECKOUT DETAILS VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column Address & Payment selection */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Address Management block */}
            <div className="bg-white border border-brand-green-600/10 p-6 rounded-2xl space-y-4 shadow-sm">
              <h4 className="font-serif text-lg font-bold text-brand-green-900">1. Delivery Destination Address</h4>
              
              {userAddresses.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {userAddresses.map(addr => (
                    <div 
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      className={`p-4 border rounded-xl cursor-pointer transition-all space-y-2 text-xs relative ${
                        selectedAddressId === addr.id 
                          ? 'border-brand-green-700 bg-brand-green-50/20 shadow-sm' 
                          : 'border-brand-green-200 hover:border-brand-green-600/25 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shippingAddress"
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="absolute top-4 right-4 accent-brand-green-700 cursor-pointer"
                      />
                      <p className="font-bold text-brand-green-900">{addr.fullName}</p>
                      <p className="text-brand-green-800/80">{addr.addressLine1}, {addr.addressLine2 || ''}</p>
                      <p className="text-brand-green-800/80">{addr.city}, {addr.state} - {addr.zipCode}</p>
                      <p className="text-brand-green-800/80 font-mono font-semibold">Mob: {addr.phone}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-brand-green-600 italic">No addresses saved. Please add your shipping destination details below.</p>
              )}

              {/* Add New Address Form toggle */}
              {!showAddAddrForm ? (
                <button
                  type="button"
                  onClick={() => setShowAddAddrForm(true)}
                  className="flex items-center gap-1.5 text-xs text-brand-gold-700 font-bold hover:underline cursor-pointer pt-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Ship To A New Address</span>
                </button>
              ) : (
                /* Add Address Inline Form */
                <form onSubmit={handleAddAddress} className="border-t border-brand-green-600/10 pt-4 mt-2 space-y-4 text-xs">
                  {addressError && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl font-semibold">
                      {addressError}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-green-800">Receiver's Full Name</label>
                      <input
                        required
                        type="text"
                        placeholder="E.g., Vipin Choudhary"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-brand-green-50/50 border border-brand-green-200 rounded-xl px-3 py-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-green-800 flex justify-between">
                        <span>Receiver's Contact Phone</span>
                        <span className="font-mono text-[10px] text-brand-green-600">{phone.length}/10</span>
                      </label>
                      <input
                        required
                        type="tel"
                        maxLength={10}
                        placeholder="E.g., 9425011088 (10 digits)"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full bg-brand-green-50/50 border border-brand-green-200 rounded-xl px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-brand-green-800">Address Line 1 (Street, Area, Building)</label>
                    <input
                      required
                      type="text"
                      placeholder="E.g., 108 Lotus Lane, Sector 4"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className="w-full bg-brand-green-50/50 border border-brand-green-200 rounded-xl px-3 py-2"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-brand-green-800">Address Line 2 (Optional - Landmark, Floor)</label>
                    <input
                      type="text"
                      placeholder="E.g., Landmark: Near Sacred Temple"
                      value={addressLine2}
                      onChange={(e) => setAddressLine2(e.target.value)}
                      className="w-full bg-brand-green-50/50 border border-brand-green-200 rounded-xl px-3 py-2"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="font-bold text-brand-green-800">City</label>
                      <input
                        required
                        type="text"
                        placeholder="New Delhi"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-brand-green-50/50 border border-brand-green-200 rounded-xl px-3 py-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-green-800">State</label>
                      <input
                        required
                        type="text"
                        placeholder="Delhi"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className="w-full bg-brand-green-50/50 border border-brand-green-200 rounded-xl px-3 py-2"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-brand-green-800">Postal Zip Code</label>
                      <input
                        required
                        type="text"
                        placeholder="110001"
                        value={zipCode}
                        onChange={(e) => setZipCode(e.target.value)}
                        className="w-full bg-brand-green-50/50 border border-brand-green-200 rounded-xl px-3 py-2"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddAddrForm(false)}
                      className="px-4 py-2 border border-brand-green-600/10 rounded-xl font-bold hover:bg-brand-green-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 font-bold rounded-xl cursor-pointer"
                    >
                      Save & Ship Here
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* Payment Option box */}
            <div className="bg-white border border-brand-green-600/10 p-6 rounded-2xl space-y-4 shadow-sm">
              <h4 className="font-serif text-lg font-bold text-brand-green-900">2. Secure Gateway Payment Selection</h4>
              
              <div className="space-y-3">
                {[
                  { id: 'UPI', title: 'UPI / GooglePay / PhonePe', subtitle: 'Pay securely via instant mobile UPI' },
                  { id: 'Razorpay', title: 'Razorpay Payment Gateway', subtitle: 'Credit/Debit cards, NetBanking, and Wallets proxy' },
                  { id: 'Cards', title: 'Direct Cards (Visa / Mastercard / Amex)', subtitle: 'Encrypted safe bank card transactions' },
                  { id: 'Net Banking', title: 'Secure Net Banking', subtitle: 'All Indian major banks integrated directly' },
                  { id: 'Cash on Delivery', title: 'Cash on Delivery (COD)', subtitle: 'Pay when herbs arrive at your destination (₹50 cod fee applies)' }
                ].map(pay => (
                  <label 
                    key={pay.id}
                    className={`flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer transition-all ${
                      paymentMethod === pay.id 
                        ? 'border-brand-green-700 bg-brand-green-50/10' 
                        : 'border-brand-green-200 hover:border-brand-green-600/15 bg-white'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={paymentMethod === pay.id}
                      onChange={() => setPaymentMethod(pay.id as any)}
                      className="mt-1 accent-brand-green-700 cursor-pointer"
                    />
                    <div className="text-xs space-y-0.5">
                      <p className="font-bold text-brand-green-900">{pay.title}</p>
                      <p className="text-brand-green-600/70">{pay.subtitle}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column Checkout summary & complete checkout button */}
          <div className="space-y-6">
            
            <div className="bg-white border border-brand-green-600/10 p-6 rounded-2xl space-y-4 shadow-sm">
              <div className="flex justify-between items-center pb-3 border-b border-brand-green-600/5">
                <h4 className="font-serif text-base font-bold text-brand-green-900">Checkout Cart</h4>
                <button 
                  onClick={() => onNavigate('cart')}
                  className="text-xs text-brand-gold-700 hover:underline font-semibold"
                >
                  Edit bag
                </button>
              </div>

              {/* Items listing */}
              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.product.id} className="flex justify-between items-center text-xs text-brand-green-800 font-medium">
                    <span className="line-clamp-1 flex-1 pr-4">{item.product.name} (x{item.quantity})</span>
                    <span className="font-serif font-bold text-brand-green-900 flex-shrink-0">₹{item.product.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              {/* Subtotal breaking */}
              <div className="border-t border-brand-green-600/10 pt-4 space-y-2.5 text-xs text-brand-green-800">
                <div className="flex justify-between">
                  <span>Cart Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-brand-gold-700 font-bold">
                    <span className="flex items-center gap-1">
                      <Ticket className="w-3.5 h-3.5" />
                      <span>Coupon Applied ({appliedCoupon.code})</span>
                    </span>
                    <span>-₹{discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>GST/Vedic Tax</span>
                  <span>₹{taxAmount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping & Transport</span>
                  <span>{shippingCharge === 0 ? 'FREE' : `₹${shippingCharge}`}</span>
                </div>

                <div className="pt-3 border-t border-brand-green-600/10 flex justify-between items-baseline font-serif text-base font-bold text-brand-green-950">
                  <span>Estimated Total</span>
                  <span className="text-xl">₹{finalTotal}</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 space-y-3">
                <button
                  onClick={handleSubmitOrder}
                  disabled={processingOrder || userAddresses.length === 0}
                  className="w-full bg-brand-green-700 hover:bg-brand-green-800 text-brand-cream-100 font-bold py-4 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {processingOrder ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-brand-cream-100 border-t-transparent animate-spin" />
                      <span>Verifying Security Gateway...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4.5 h-4.5 text-brand-cream-300" />
                      <span>Secure Payment & Place Order</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => onNavigate('cart')}
                  className="w-full text-center py-2 text-xs text-brand-green-600 hover:text-brand-green-800 font-bold flex items-center justify-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Apothecary Bag</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
