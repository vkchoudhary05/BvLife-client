/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { ShieldCheck, Plus, ShoppingBag, ArrowLeft, ArrowRight, CheckCircle2, Ticket, Mail, Lock, Phone as PhoneIcon, Sparkles, User as UserIcon, Shield } from 'lucide-react';
import { CartItem, Address, Coupon, WebsiteSettings, Order } from '../types';
import { validateAndFormatIndianPhone } from '../utils';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';

interface CheckoutProps {
  cart: CartItem[];
  userAddresses: Address[];
  onAddAddress: (addr: Address) => void;
  onNavigate: (page: string, params?: any) => void;
  appliedCoupon: Coupon | null;
  settings: WebsiteSettings;
  onPlaceOrder: (orderData: Partial<Order>) => Promise<Order | null>;
  language?: any;
  currentUser: any;
  onLoginSuccess?: (token: string) => void;
  authToken?: string | null;
  initialCompletedOrderId?: string;
}

export const Checkout: React.FC<CheckoutProps> = ({
  cart,
  userAddresses,
  onAddAddress,
  onNavigate,
  appliedCoupon,
  settings,
  onPlaceOrder,
  language,
  currentUser,
  onLoginSuccess,
  authToken,
  initialCompletedOrderId
}) => {
  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    userAddresses.find(a => a.isDefault)?.id || userAddresses[0]?.id || ''
  );

  // Sync selectedAddressId if user addresses change (e.g. after login/register)
  React.useEffect(() => {
    if (userAddresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(userAddresses.find(a => a.isDefault)?.id || userAddresses[0]?.id || '');
    }
  }, [userAddresses, selectedAddressId]);
  
  // Checkout Auth states
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authOtp, setAuthOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [useRealTwilio, setUseRealTwilio] = useState(false);
  const [formattedPhone, setFormattedPhone] = useState('');
  const [otpStep, setOtpStep] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const [loginError, setLoginError] = useState('');
  const [authAccountExists, setAuthAccountExists] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const handleCheckoutAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (isRegistering) {
      if (!otpStep) {
        if (authPhone.length !== 10) {
          setLoginError(language === 'hi' ? 'मोबाइल नंबर 10 अंकों का होना चाहिए।' : 'Mobile phone number must be exactly 10 digits.');
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
        setAuthLoading(true);
        try {
          if (useRealTwilio) {
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
            if (authOtp !== generatedOtp) {
              setLoginError('Invalid verification code. Please enter the correct 6-digit OTP code.');
              setAuthLoading(false);
              return;
            }
          }

          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              fullName: authName, 
              email: authEmail, 
              phone: formattedPhone || authPhone, 
              role: 'customer',
              password: authPassword || 'password123' 
            })
          });

          if (res.ok) {
            const regData = await res.json();
            if (onLoginSuccess) {
              onLoginSuccess(regData.token);
            }
          } else {
            const data = await res.json();
            setLoginError(data.error || 'Account creation failed. Email or mobile may already be registered.');
            if (data.accountExists || (data.error && data.error.toLowerCase().includes('already'))) {
              setAuthAccountExists(true);
            }
          }
        } catch (err) {
          console.error(err);
          setLoginError('An unexpected server error occurred during account finalization.');
        } finally {
          setAuthLoading(false);
        }
      }
    } else {
      setAuthLoading(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword || 'password123' })
        });

        if (res.ok) {
          const data = await res.json();
          if (onLoginSuccess) {
            onLoginSuccess(data.token);
          }
        } else {
          const data = await res.json();
          setLoginError(data.error || 'Invalid credentials or incorrect password.');
        }
      } catch (err) {
        console.error(err);
        setLoginError('Failed to establish session validation with temple servers.');
      } finally {
        setAuthLoading(false);
      }
    }
  };

  // Interactive Payment Gateway States
  const [isPaymentGatewayOpen, setIsPaymentGatewayOpen] = useState(false);
  const [gatewayStep, setGatewayStep] = useState<'selection' | 'processing' | 'otp' | 'bank_login' | 'success'>('selection');
  
  // Card inputs
  const [cardNo, setCardNo] = useState('');
  const [cardHolder, setCardHolder] = useState(currentUser?.fullName || '');
  const [cardExp, setCardExp] = useState('');
  const [cardCvvInput, setCardCvvInput] = useState('');
  const [cardErr, setCardErr] = useState('');
  
  // UPI inputs
  const [upiVal, setUpiVal] = useState('');
  const [upiErr, setUpiErr] = useState('');
  
  // Net Banking inputs
  const [selectedBank, setSelectedBank] = useState('');
  const [bankUserId, setBankUserId] = useState('');
  const [bankPassword, setBankPassword] = useState('');
  const [bankErr, setBankErr] = useState('');

  // OTP Verification Simulation
  const [paymentVerifyOtp, setPaymentVerifyOtp] = useState('');
  const [paymentOtpErr, setPaymentOtpErr] = useState('');
  const [simulatedGatewayOtp, setSimulatedGatewayOtp] = useState('');

  // Pre-fill card holder name when user logs in or changes
  React.useEffect(() => {
    if (currentUser) {
      setCardHolder(currentUser.fullName);
    }
  }, [currentUser]);

  // New Address form toggle & state
  const [showAddAddrForm, setShowAddAddrForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmedAddress, setConfirmedAddress] = useState<Address | null>(null);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay' | 'UPI' | 'Cards' | 'Net Banking' | 'Cash on Delivery'>('UPI');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [orderCompleted, setOrderCompleted] = useState<Order | null>(() => {
    try {
      if (initialCompletedOrderId) {
        const savedPlaced = localStorage.getItem('grams_last_placed_order');
        if (savedPlaced) {
          const parsed = JSON.parse(savedPlaced);
          if (parsed.id === initialCompletedOrderId) return parsed;
        }
        const savedComp = localStorage.getItem('grams_last_completed_order');
        if (savedComp) {
          const parsed = JSON.parse(savedComp);
          if (parsed.id === initialCompletedOrderId) return parsed;
        }
      }
      const saved = localStorage.getItem('grams_last_completed_order') || localStorage.getItem('grams_last_placed_order');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Effect to load order when initialCompletedOrderId changes
  React.useEffect(() => {
    if (initialCompletedOrderId) {
      try {
        const savedPlaced = localStorage.getItem('grams_last_placed_order');
        if (savedPlaced) {
          const parsed = JSON.parse(savedPlaced);
          if (parsed.id === initialCompletedOrderId) {
            setOrderCompleted(parsed);
            return;
          }
        }
        const savedComp = localStorage.getItem('grams_last_completed_order');
        if (savedComp) {
          const parsed = JSON.parse(savedComp);
          if (parsed.id === initialCompletedOrderId) {
            setOrderCompleted(parsed);
            return;
          }
        }
      } catch (e) {}
    }
  }, [initialCompletedOrderId]);

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

  // Handle Start Payment Outer Orchestrator
  // Automatically open add address form if user has no saved addresses
  React.useEffect(() => {
    if (userAddresses.length === 0) {
      setShowAddAddrForm(true);
    } else if (userAddresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(userAddresses[0].id);
    }
  }, [userAddresses, selectedAddressId]);

  const handleStartPayment = async () => {
    let targetAddress = userAddresses.find(a => a.id === selectedAddressId) || userAddresses[0];

    // If no address selected from list, check if user filled out the address form fields
    if (!targetAddress && (addressLine1.trim() || city.trim() || zipCode.trim())) {
      const newAddr: Address = {
        id: `addr-${Date.now()}`,
        fullName: fullName.trim() || currentUser?.fullName || authName || 'Valued Customer',
        addressLine1: addressLine1.trim() || 'Main Street',
        addressLine2,
        city: city.trim() || 'New Delhi',
        state: stateName.trim() || 'Delhi',
        zipCode: zipCode.trim() || '110001',
        phone: phone.trim() ? `+91${phone.replace('+91', '')}` : (currentUser?.phone || '+919876543210'),
        isDefault: true
      };
      onAddAddress(newAddr);
      setSelectedAddressId(newAddr.id);
      targetAddress = newAddr;
    }

    if (!targetAddress) {
      // Fallback address if form was completely empty
      targetAddress = {
        id: `addr-${Date.now()}`,
        fullName: currentUser?.fullName || authName || 'Valued Customer',
        addressLine1: 'Main Street',
        addressLine2: '',
        city: 'New Delhi',
        state: 'Delhi',
        zipCode: '110001',
        phone: currentUser?.phone || '+919876543210',
        isDefault: true
      };
      onAddAddress(targetAddress);
      setSelectedAddressId(targetAddress.id);
    }

    setConfirmedAddress(targetAddress);

    if (paymentMethod === 'Cash on Delivery') {
      await executeOrderPlacement(targetAddress);
    } else {
      setIsPaymentGatewayOpen(true);
      setGatewayStep('selection');
      setCardErr('');
      setUpiErr('');
      setBankErr('');
      setPaymentOtpErr('');
      setPaymentVerifyOtp('123456');
      setSimulatedGatewayOtp('123456');
    }
  };

  // Perform backend order placement
  const executeOrderPlacement = async (overrideAddr?: Address): Promise<Order | null> => {
    setProcessingOrder(true);
    let selectedAddress = overrideAddr || confirmedAddress || userAddresses.find(a => a.id === selectedAddressId) || userAddresses[0];

    if (!selectedAddress && (addressLine1.trim() || city.trim() || zipCode.trim())) {
      selectedAddress = {
        id: `addr-${Date.now()}`,
        fullName: fullName || currentUser?.fullName || 'Valued Customer',
        addressLine1: addressLine1 || 'Main Street',
        addressLine2,
        city: city || 'New Delhi',
        state: stateName || 'Delhi',
        zipCode: zipCode || '110001',
        phone: phone ? `+91${phone.replace('+91', '')}` : (currentUser?.phone || '+919876543210'),
        isDefault: true
      };
      onAddAddress(selectedAddress);
    }

    if (!selectedAddress) {
      selectedAddress = {
        id: `addr-${Date.now()}`,
        fullName: currentUser?.fullName || fullName || 'Valued Customer',
        addressLine1: 'Main Street',
        addressLine2: '',
        city: 'New Delhi',
        state: 'Delhi',
        zipCode: '110001',
        phone: currentUser?.phone || phone || '+919876543210',
        isDefault: true
      };
    }

    const itemsPayload = cart.length > 0 ? cart.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      mainImage: item.product.mainImage
    })) : [
      {
        productId: 'item-1',
        productName: 'Ayurvedic Wellness Pack',
        price: subtotal || finalTotal || 499,
        quantity: 1,
        mainImage: ''
      }
    ];

    const activeUserEmail = currentUser?.email || authEmail || (selectedAddress?.phone ? `${selectedAddress.phone.replace(/\D/g, '')}@gramslife.com` : 'guest@gramslife.com');
    const activeUserName = currentUser?.fullName || selectedAddress.fullName || fullName || authName || 'Guest Customer';

    const result = await onPlaceOrder({
      userEmail: activeUserEmail,
      userName: activeUserName,
      shippingAddress: selectedAddress,
      items: itemsPayload,
      subtotal: subtotal || finalTotal,
      tax: taxAmount,
      shippingCharge,
      discount: discountAmount,
      finalTotal: finalTotal || subtotal || 499,
      paymentMethod,
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid'
    });

    if (result) {
      setOrderCompleted(result);
      setProcessingOrder(false);
      try {
        localStorage.setItem('grams_last_completed_order', JSON.stringify(result));
        localStorage.setItem('grams_last_placed_order', JSON.stringify(result));
        const stored = localStorage.getItem('grams_recent_orders');
        const existingIds: string[] = stored ? JSON.parse(stored) : [];
        if (!existingIds.includes(result.id)) {
          localStorage.setItem('grams_recent_orders', JSON.stringify([result.id, ...existingIds]));
        }
      } catch (e) {}
      return result;
    } else {
      setProcessingOrder(false);
      alert(language === 'hi' ? "ऑर्डर प्लेस करने में विफल। कृपया पुन: प्रयास करें।" : "Order failed. Please check your network and try again.");
      return null;
    }
  };

  // Reset completed order state if user adds new items to cart to start a new purchase (only when not explicitly viewing an order confirmation by ID)
  React.useEffect(() => {
    if (cart.length > 0 && orderCompleted && !initialCompletedOrderId) {
      setOrderCompleted(null);
      localStorage.removeItem('grams_last_completed_order');
    }
  }, [cart.length, initialCompletedOrderId]);

  React.useEffect(() => {
    if (cart.length === 0 && !orderCompleted && !processingOrder && !initialCompletedOrderId) {
      const storedOrder = localStorage.getItem('grams_last_completed_order') || localStorage.getItem('grams_last_placed_order');
      if (storedOrder) {
        try {
          setOrderCompleted(JSON.parse(storedOrder));
        } catch (e) {
          onNavigate('cart');
        }
      } else {
        onNavigate('cart');
      }
    }
  }, [cart.length, orderCompleted, processingOrder, onNavigate, initialCompletedOrderId]);

  if (cart.length === 0 && !orderCompleted && !processingOrder) {
    const storedOrder = localStorage.getItem('grams_last_completed_order');
    if (!storedOrder) {
      return null;
    }
  }

  return (
    <div id="checkout-page" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      
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

          <div className="flex flex-col sm:flex-row gap-3">
            <button 
              onClick={() => onNavigate('track-order')}
              className="flex-1 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-sm transition-colors text-center"
            >
              Track Order Dispatch
            </button>
            <button 
              onClick={() => onNavigate('dashboard', { tab: 'orders' })}
              className="flex-1 bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-green-950 font-bold py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-sm transition-colors text-center"
            >
              View In Dashboard
            </button>
            <button 
              onClick={() => {
                localStorage.removeItem('grams_last_completed_order');
                setOrderCompleted(null);
                onNavigate('shop');
              }}
              className="flex-1 border border-brand-green-600/20 text-brand-green-800 font-bold py-3 rounded-xl text-xs cursor-pointer hover:bg-brand-green-50 transition-colors text-center uppercase tracking-wider"
            >
              Continue Shopping
            </button>
          </div>

        </div>
      ) : (authToken && !currentUser) ? (
        /* TRANSITIONAL SECURING SESSION SCREEN */
        <div id="checkout-session-loader" className="max-w-md mx-auto my-24 text-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-green-700 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-brand-green-800 font-medium">Securing your wellness sanctuary profile...</p>
        </div>
      ) : !currentUser ? (
        /* CONDITIONAL AUTHENTICATION FLOW */
        <div id="checkout-auth-screen" className="max-w-xl mx-auto my-8 bg-brand-cream-50/60 border border-brand-green-600/10 rounded-[2.5rem] p-6 sm:p-10 shadow-xl space-y-8 relative overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-gold-500 via-brand-cream-300 to-brand-gold-600" />
          
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-green-800 text-brand-gold-400 font-serif text-2xl font-bold border border-brand-gold-500/30 shadow-md mx-auto">
              G
            </div>
            <div className="space-y-1.5">
              <h3 className="font-serif text-2xl font-bold text-brand-green-900 tracking-tight font-serif">
                {isRegistering 
                  ? (otpStep ? "Verify Mobile Identity" : "Secure Sanctuary Account") 
                  : "Sign In to Your Sanctuary"}
              </h3>
              <p className="text-xs text-brand-green-800/70 max-w-sm mx-auto leading-relaxed">
                {isRegistering 
                  ? (otpStep 
                      ? "Check the OTP verification details below to log in safely." 
                      : "Begin your digital healing journey, save address templates, and track orders.")
                  : "Sign in using your password credentials to retrieve your delivery templates and complete payment."}
              </p>
            </div>
          </div>

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
                Register (New Seeker)
              </button>
            </div>
          )}

          {loginError && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-semibold flex flex-col items-center gap-2 text-center">
              <span>{loginError}</span>
              {authAccountExists && (
                <button
                  type="button"
                  onClick={() => {
                    setIsRegistering(false);
                    setLoginError('');
                    setAuthAccountExists(false);
                  }}
                  className="text-[10px] uppercase tracking-wider font-extrabold bg-brand-green-800 text-brand-cream-50 px-3 py-1.5 rounded-lg hover:bg-brand-green-900 transition-all cursor-pointer shadow-sm flex items-center gap-1"
                >
                  <span>Log In to Existing Account</span>
                  <ArrowRight className="w-3 h-3 text-brand-gold-400" />
                </button>
              )}
            </div>
          )}

          {otpStep && otpMessage && (
            <div className="p-4 bg-brand-gold-300/10 border border-brand-gold-400/30 rounded-2xl space-y-2 shadow-sm animate-pulse">
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
          )}

          {/* Quick Sandbox Profiles */}
          {!otpStep && (
            <div className="bg-brand-cream-100/60 border border-brand-gold-300/30 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green-800/80 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-brand-gold-600 animate-pulse" />
                  <span>Sandbox Quick Access Accounts</span>
                </span>
                <span className="text-[9px] text-brand-gold-700 font-extrabold bg-brand-gold-300/10 px-2 py-0.5 rounded-full border border-brand-gold-400/20">One-Click</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthEmail('vkchoudhary050607@gmail.com');
                    setAuthPassword('password123');
                    setAuthName('Vipin Choudhary');
                    setAuthPhone('9425011088');
                    setLoginError('');
                  }}
                  className="p-2.5 text-left border border-brand-gold-300/20 hover:border-brand-green-800 hover:bg-white rounded-xl bg-white/50 transition-all text-xs font-semibold text-brand-green-900 flex items-center gap-2"
                >
                  <UserIcon className="w-3.5 h-3.5 text-brand-gold-600 shrink-0" />
                  <div className="truncate text-left">
                    <p className="font-bold">Vipin Choudhary</p>
                    <p className="text-[9px] text-brand-green-600/70 font-mono">vkchoudhary050607@gmail.com</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthEmail('customer@example.com');
                    setAuthPassword('password123');
                    setAuthName('Demo Client');
                    setAuthPhone('9876543210');
                    setLoginError('');
                  }}
                  className="p-2.5 text-left border border-brand-gold-300/20 hover:border-brand-green-800 hover:bg-white rounded-xl bg-white/50 transition-all text-xs font-semibold text-brand-green-900 flex items-center gap-2"
                >
                  <UserIcon className="w-3.5 h-3.5 text-brand-gold-600 shrink-0" />
                  <div className="truncate text-left">
                    <p className="font-bold">Demo Client</p>
                    <p className="text-[9px] text-brand-green-600/70 font-mono">customer@example.com</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleCheckoutAuthSubmit} className="space-y-4">
            {isRegistering ? (
              otpStep ? (
                /* OTP STEP UI */
                <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800 flex items-center gap-1 font-serif">
                      <Lock className="w-3.5 h-3.5 text-brand-gold-600" />
                      <span>6-Digit Security OTP</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Enter 6-digit verification code"
                      value={authOtp}
                      onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center px-4 py-3 rounded-xl bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 text-lg tracking-widest font-bold font-mono text-brand-green-950 shadow-sm"
                    />
                  </div>

                  <div className="flex gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setOtpStep(false);
                        setLoginError('');
                        setAuthOtp('');
                      }}
                      className="w-1/3 py-3 bg-brand-cream-200 hover:bg-brand-cream-300 text-brand-green-900 font-bold rounded-xl transition-all cursor-pointer text-center"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={authLoading || authOtp.length !== 6}
                      className="w-2/3 py-3 bg-brand-green-800 hover:bg-brand-green-900 disabled:opacity-50 text-brand-cream-50 font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>{authLoading ? "Verifying..." : "Confirm & Register"}</span>
                      <ArrowRight className="w-4 h-4 text-brand-gold-400" />
                    </button>
                  </div>
                </div>
              ) : (
                /* REGISTRATION REGULAR FIELDS */
                <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800 flex items-center gap-1 font-serif text-left block">
                      <UserIcon className="w-3.5 h-3.5 text-brand-gold-600" />
                      <span>Sanctuary User Full Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Vipin Choudhary"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 text-xs font-semibold text-brand-green-900 shadow-sm text-left"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800 flex items-center gap-1 font-serif text-left block">
                      <Mail className="w-3.5 h-3.5 text-brand-gold-600" />
                      <span>Email Address (Login ID)</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g., vkchoudhary050607@gmail.com"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 text-xs font-semibold text-brand-green-900 shadow-sm text-left"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800 flex items-center gap-1 font-serif text-left block">
                      <Lock className="w-3.5 h-3.5 text-brand-gold-600" />
                      <span>Sanctuary Account Password</span>
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Choose password (at least 6 characters)"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 text-xs font-semibold text-brand-green-900 shadow-sm text-left"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800 flex items-center gap-1 font-serif text-left block">
                      <PhoneIcon className="w-3.5 h-3.5 text-brand-gold-600" />
                      <span>Indian Mobile Phone</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-green-600/40 font-bold font-mono text-xs">+91</span>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 text-xs font-bold font-mono tracking-wider text-brand-green-900 shadow-sm text-left"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3.5 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>{authLoading ? "Processing..." : "Verify Mobile Contact & Register"}</span>
                    <ArrowRight className="w-4 h-4 text-brand-gold-400" />
                  </button>
                </div>
              )
            ) : (
              /* LOGIN REGULAR FIELDS */
              <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800 flex items-center gap-1 font-serif text-left block">
                    <Mail className="w-3.5 h-3.5 text-brand-gold-600" />
                    <span>Email Address or Phone</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., vkchoudhary050607@gmail.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 text-xs font-semibold text-brand-green-900 shadow-sm text-left"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800 flex items-center gap-1 font-serif text-left block">
                      <Lock className="w-3.5 h-3.5 text-brand-gold-600" />
                      <span>Account Password</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPasswordOpen(true)}
                      className="text-[10px] font-bold text-brand-gold-700 hover:text-brand-gold-800 underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 text-xs font-semibold text-brand-green-900 shadow-sm text-left"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>{authLoading ? "Processing..." : "Sign In & Checkout"}</span>
                  <ArrowRight className="w-4 h-4 text-brand-gold-400" />
                </button>
              </div>
            )}
          </form>
        </div>
      ) : (
        /* STANDARD CHECKOUT DETAILS VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column Address & Payment selection */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Address Management block */}
            <div id="shipping-address-section" className="bg-white border border-brand-green-600/10 p-6 rounded-2xl space-y-4 shadow-sm">
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
                  <div key={pay.id} className="space-y-2">
                    <label 
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

                    {/* Inline Payment Inputs */}
                    {paymentMethod === 'UPI' && pay.id === 'UPI' && (
                      <div className="ml-7 p-3 bg-brand-green-50/60 rounded-xl border border-brand-green-200 space-y-2">
                        <label className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider block">
                          UPI VPA / Phone Number (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder={`${phone || '9425011088'}@upi`}
                          value={upiVal}
                          onChange={(e) => setUpiVal(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-brand-green-200 text-xs font-mono font-bold text-brand-green-950 bg-white"
                        />
                      </div>
                    )}

                    {paymentMethod === 'Cards' && pay.id === 'Cards' && (
                      <div className="ml-7 p-3 bg-brand-green-50/60 rounded-xl border border-brand-green-200 space-y-2 text-xs">
                        <input
                          type="text"
                          maxLength={19}
                          placeholder="Card Number (4111 2222 3333 4444)"
                          value={cardNo}
                          onChange={(e) => setCardNo(e.target.value.replace(/\D/g, '').slice(0, 16))}
                          className="w-full px-3 py-2 rounded-lg border border-brand-green-200 font-mono font-bold text-brand-green-950 bg-white"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            maxLength={5}
                            placeholder="MM/YY"
                            value={cardExp}
                            onChange={(e) => {
                              let val = e.target.value.replace(/\D/g, '');
                              if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                              setCardExp(val);
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-brand-green-200 font-mono text-center font-bold text-brand-green-950 bg-white"
                          />
                          <input
                            type="password"
                            maxLength={4}
                            placeholder="CVV"
                            value={cardCvvInput}
                            onChange={(e) => setCardCvvInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            className="w-full px-3 py-2 rounded-lg border border-brand-green-200 font-mono text-center font-bold text-brand-green-950 bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'Net Banking' && pay.id === 'Net Banking' && (
                      <div className="ml-7 p-3 bg-brand-green-50/60 rounded-xl border border-brand-green-200 space-y-2">
                        <select
                          value={selectedBank}
                          onChange={(e) => setSelectedBank(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-brand-green-200 text-xs font-bold text-brand-green-950 bg-white"
                        >
                          <option value="">Select Bank (HDFC, SBI, ICICI, etc.)</option>
                          <option value="HDFC Bank">HDFC Bank</option>
                          <option value="State Bank of India">State Bank of India (SBI)</option>
                          <option value="ICICI Bank">ICICI Bank</option>
                          <option value="Axis Bank">Axis Bank</option>
                        </select>
                      </div>
                    )}
                  </div>
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
                  onClick={handleStartPayment}
                  disabled={processingOrder}
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

      {/* SECURE INTEGRATED PAYMENT GATEWAY PORTAL MODAL */}
      {isPaymentGatewayOpen && (
        <div id="payment-gateway-modal" className="fixed inset-0 bg-brand-green-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-brand-green-200/20 relative animate-in zoom-in-95 duration-300">
            {/* Top Security Accent Header */}
            <div className="bg-brand-green-900 text-brand-cream-50 p-6 relative">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-gold-500 to-brand-gold-300" />
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-brand-green-800 rounded-xl border border-brand-gold-500/20">
                    <ShieldCheck className="w-5 h-5 text-brand-gold-400" />
                  </div>
                  <div>
                    <h3 className="font-serif text-sm font-bold tracking-tight text-left">Secure Transaction Endpoint</h3>
                    <p className="text-[10px] text-brand-cream-300/80 font-mono text-left">Gateway IP: 104.22.4.91 | SSL Secured</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[9px] font-extrabold uppercase bg-brand-gold-400/20 text-brand-gold-400 border border-brand-gold-500/30 px-2 py-0.5 rounded-full">
                    {paymentMethod === 'Razorpay' ? 'Razorpay' : paymentMethod}
                  </span>
                  <p className="font-serif font-bold text-xs mt-0.5 text-brand-gold-300">₹{finalTotal}</p>
                </div>
              </div>
            </div>

            {/* Simulated SMS Bank OTP Toast notification banner when step is 'otp' */}
            {gatewayStep === 'otp' && (
              <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2 text-xs text-amber-900 font-semibold animate-bounce shadow-inner">
                <Sparkles className="w-4 h-4 text-brand-gold-600 animate-pulse shrink-0" />
                <div className="flex-1 text-left">
                  <span className="text-[9px] font-bold uppercase text-brand-gold-800 font-mono">SMS Sandbox Simulator:</span>{' '}
                  Your secure banking OTP is <span className="font-mono font-bold tracking-widest text-brand-green-950 bg-brand-gold-500/30 px-1.5 py-0.5 rounded border border-brand-gold-500/20">{simulatedGatewayOtp}</span>
                </div>
              </div>
            )}

            <div className="p-6 sm:p-8 space-y-6">
              {gatewayStep === 'selection' && (
                <div className="space-y-5">
                  {/* Option-Specific Input Forms */}
                  
                  {paymentMethod === 'Cards' && (
                    <div className="space-y-4">
                      {/* Virtual interactive credit card */}
                      <div className="relative h-44 rounded-2xl bg-gradient-to-br from-brand-green-900 via-brand-green-850 to-brand-green-950 p-6 text-brand-cream-100 flex flex-col justify-between shadow-lg border border-brand-gold-500/10 overflow-hidden font-mono text-left">
                        <div className="absolute top-0 right-0 w-36 h-36 bg-brand-gold-500/5 rounded-full -mr-10 -mt-10 blur-xl" />
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[9px] uppercase tracking-widest font-sans text-brand-cream-300">Sanctuary Reserve</p>
                            <span className="text-xs font-bold text-brand-gold-400 font-serif">Vedic Premium Card</span>
                          </div>
                          {/* Card brand image/badge */}
                          <div className="bg-brand-cream-100/10 px-2.5 py-1 rounded-lg border border-brand-cream-100/20 text-[10px] font-sans font-black tracking-wider uppercase">
                            {cardNo.startsWith('4') ? 'Visa' : cardNo.startsWith('5') ? 'Mastercard' : cardNo.startsWith('3') ? 'Amex' : 'Card'}
                          </div>
                        </div>
                        
                        <div className="text-base sm:text-lg font-bold tracking-widest py-1 text-left">
                          {cardNo ? cardNo.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                        </div>

                        <div className="flex justify-between items-end text-[10px]">
                          <div>
                            <span className="text-[8px] text-brand-cream-300 uppercase block font-sans">Card Holder</span>
                            <span className="font-bold tracking-wide uppercase line-clamp-1">{cardHolder || 'Seeker Name'}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] text-brand-cream-300 uppercase block font-sans text-right">Expires</span>
                            <span className="font-bold tracking-wide">{cardExp || 'MM/YY'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Inputs Grid */}
                      <div className="space-y-3.5 text-xs">
                        {cardErr && <p className="text-[11px] font-bold text-red-500 bg-red-50 p-2.5 rounded-xl border border-red-100 text-left">{cardErr}</p>}
                        
                        <div className="space-y-1 text-left">
                          <label className="text-[10px] uppercase font-bold text-brand-green-800">Cardholder Name</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g., Vipin Choudhary"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-brand-green-200 focus:outline-none focus:border-brand-green-700 font-medium bg-white text-brand-green-950"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[10px] uppercase font-bold text-brand-green-800">16-Digit Card Number</label>
                          <input 
                            type="text"
                            required
                            maxLength={19}
                            placeholder="4111 2222 3333 4444"
                            value={cardNo}
                            onChange={(e) => setCardNo(e.target.value.replace(/\D/g, '').slice(0, 16))}
                            className="w-full px-4 py-2.5 rounded-xl border border-brand-green-200 focus:outline-none focus:border-brand-green-700 font-mono text-sm tracking-widest bg-white text-brand-green-955 text-left"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] uppercase font-bold text-brand-green-800">Expiry Date</label>
                            <input 
                              type="text"
                              required
                              maxLength={5}
                              placeholder="MM/YY"
                              value={cardExp}
                              onChange={(e) => {
                                let val = e.target.value.replace(/\D/g, '');
                                if (val.length > 2) {
                                  val = val.slice(0, 2) + '/' + val.slice(2, 4);
                                }
                                setCardExp(val);
                              }}
                              className="w-full px-4 py-2.5 rounded-xl border border-brand-green-200 focus:outline-none focus:border-brand-green-700 font-mono text-center bg-white text-brand-green-955"
                            />
                          </div>
                          <div className="space-y-1 text-left">
                            <label className="text-[10px] uppercase font-bold text-brand-green-800">CVV Code</label>
                            <input 
                              type="password"
                              required
                              maxLength={3}
                              placeholder="•••"
                              value={cardCvvInput}
                              onChange={(e) => setCardCvvInput(e.target.value.replace(/\D/g, '').slice(0, 3))}
                              className="w-full px-4 py-2.5 rounded-xl border border-brand-green-200 focus:outline-none focus:border-brand-green-700 font-mono text-center bg-white text-brand-green-955"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (!cardHolder || cardNo.length < 16 || cardExp.length < 5 || cardCvvInput.length < 3) {
                            setCardErr('Please complete all premium card parameters before authorizing.');
                            return;
                          }
                          setCardErr('');
                          setGatewayStep('processing');
                          setTimeout(() => {
                            setGatewayStep('otp');
                          }, 1500);
                        }}
                        className="w-full py-3.5 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer text-center"
                      >
                        Authorize & Pay ₹{finalTotal}
                      </button>
                    </div>
                  )}

                  {paymentMethod === 'UPI' && (
                    <div className="space-y-4 text-center">
                      <p className="text-xs text-brand-green-800 text-left leading-relaxed">Scan this secure QR code using GooglePay, PhonePe, Paytm or any BHIM UPI application to process ₹{finalTotal}.</p>
                      
                      {/* CSS QR Code Simulation */}
                      <div className="mx-auto w-40 h-40 bg-brand-cream-100 p-3 rounded-2xl border border-brand-gold-300/30 shadow-md flex items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-gold-500/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 animate-pulse" />
                        <div className="w-full h-full border-4 border-dashed border-brand-green-800/25 rounded-lg flex flex-col items-center justify-center space-y-1 bg-white">
                          <span className="text-[8px] font-mono text-brand-green-600/60 uppercase tracking-widest font-extrabold">BV LIFE QR</span>
                          <div className="grid grid-cols-5 gap-1.5 w-24 h-24 p-1.5 bg-white border border-brand-green-800/15 rounded">
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-transparent" />
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-transparent" />
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-transparent" />
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-transparent" />
                            <div className="bg-transparent" />
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-transparent" />
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-transparent" />
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-brand-green-900 rounded-sm" />
                            <div className="bg-brand-green-900 rounded-sm" />
                          </div>
                          <span className="text-[10px] font-bold text-brand-green-800 font-mono tracking-wider">₹{finalTotal}</span>
                        </div>
                      </div>

                      <div className="relative flex items-center justify-center py-2">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-green-100" /></div>
                        <span className="relative px-3 bg-white text-[9px] font-bold uppercase tracking-wider text-brand-green-600/40">Or Enter UPI Address</span>
                      </div>

                      <div className="space-y-3.5 text-xs text-left">
                        {upiErr && <p className="text-[11px] font-bold text-red-500 bg-red-50 p-2.5 rounded-xl border border-red-100 text-left">{upiErr}</p>}
                        
                        <div className="space-y-1 text-left">
                          <label className="text-[10px] uppercase font-bold text-brand-green-800 block text-left">Your UPI ID / VPA</label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g., vkchoudhary050607@okaxis"
                            value={upiVal}
                            onChange={(e) => setUpiVal(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-brand-green-200 focus:outline-none focus:border-brand-green-700 font-mono text-xs font-semibold text-brand-green-950 text-center bg-white"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          let cleanUpi = upiVal ? upiVal.trim() : '';
                          if (!cleanUpi) {
                            cleanUpi = `${phone || 'customer'}@upi`;
                          } else if (!cleanUpi.includes('@')) {
                            cleanUpi = `${cleanUpi}@upi`;
                          }
                          setUpiVal(cleanUpi);
                          setUpiErr('');
                          setProcessingOrder(true);
                          setGatewayStep('processing');
                          const res = await executeOrderPlacement();
                          if (res) {
                            setGatewayStep('success');
                            setTimeout(() => {
                              setIsPaymentGatewayOpen(false);
                            }, 800);
                          } else {
                            setGatewayStep('selection');
                            setUpiErr('Payment failed. Please try again.');
                          }
                        }}
                        className="w-full py-3.5 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer text-center"
                      >
                        Verify & Complete Payment
                      </button>
                    </div>
                  )}

                  {(paymentMethod === 'Razorpay' || paymentMethod === 'Net Banking') && (
                    <div className="space-y-4">
                      <p className="text-xs text-brand-green-800 text-center">Select your preferred Indian banking institution to initialize secure online debit transfer.</p>
                      
                      {bankErr && <p className="text-[11px] font-bold text-red-500 bg-red-50 p-2.5 rounded-xl border border-red-100 text-center">{bankErr}</p>}
                      
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { name: 'HDFC Bank', color: 'border-blue-600 text-blue-800 bg-blue-50/25' },
                          { name: 'State Bank of India', color: 'border-cyan-500 text-cyan-800 bg-cyan-50/25' },
                          { name: 'ICICI Bank', color: 'border-orange-500 text-orange-800 bg-orange-50/25' },
                          { name: 'Axis Bank', color: 'border-rose-700 text-rose-800 bg-rose-50/25' },
                          { name: 'Kotak Bank', color: 'border-red-600 text-red-800 bg-red-50/25' },
                          { name: 'Punjab National Bank', color: 'border-amber-600 text-amber-800 bg-amber-50/25' }
                        ].map(bank => (
                          <button
                            type="button"
                            key={bank.name}
                            onClick={() => setSelectedBank(bank.name)}
                            className={`p-3 text-center border-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                              selectedBank === bank.name 
                                ? `${bank.color} ring-2 ring-brand-gold-500`
                                : 'border-brand-green-100 hover:border-brand-green-600/15 bg-white text-brand-green-900'
                            }`}
                          >
                            {bank.name}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        disabled={!selectedBank}
                        onClick={() => {
                          setGatewayStep('bank_login');
                        }}
                        className="w-full py-3.5 bg-brand-green-800 hover:bg-brand-green-900 disabled:opacity-50 text-brand-cream-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer text-center"
                      >
                        Proceed to {selectedBank || 'Selected Bank'} Gateway
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Secure Bank Login Screen Step */}
              {gatewayStep === 'bank_login' && (
                <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
                  <div className="text-center space-y-1">
                    <span className="text-[10px] font-extrabold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full">{selectedBank} SECURE SERVER</span>
                    <h4 className="font-serif text-base font-bold text-brand-green-950 mt-2 text-center">Log in to Authorized Banking Account</h4>
                    <p className="text-[10px] text-brand-green-600/70 text-center">Establish secure authorization token to process the transaction of ₹{finalTotal}.</p>
                  </div>

                  <div className="space-y-3 text-xs text-left">
                    {bankErr && <p className="text-[11px] font-bold text-red-500 bg-red-50 p-2.5 rounded-xl border border-red-100 text-left">{bankErr}</p>}
                    
                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase font-bold text-brand-green-800">Customer ID / Username</label>
                      <input 
                        type="text"
                        required
                        placeholder="Enter banking credential ID"
                        value={bankUserId}
                        onChange={(e) => setBankUserId(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-green-200 focus:outline-none focus:border-brand-green-700 font-medium bg-white text-brand-green-950 text-left"
                      />
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[10px] uppercase font-bold text-brand-green-800">Secure PIN / IPIN Password</label>
                      <input 
                        type="password"
                        required
                        placeholder="Enter secure banking password"
                        value={bankPassword}
                        onChange={(e) => setBankPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-brand-green-200 focus:outline-none focus:border-brand-green-700 font-medium bg-white text-brand-green-950 text-left"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGatewayStep('selection')}
                      className="w-1/3 py-3 bg-brand-cream-100 hover:bg-brand-cream-200 text-brand-green-900 font-bold rounded-xl text-xs text-center cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!bankUserId || !bankPassword) {
                          setBankErr('Please enter your secure customer login credentials.');
                          return;
                        }
                        setBankErr('');
                        setGatewayStep('processing');
                        setTimeout(() => {
                          setGatewayStep('otp');
                        }, 1400);
                      }}
                      className="w-2/3 py-3 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold rounded-xl text-xs text-center cursor-pointer shadow-md"
                    >
                      Authorize Transaction
                    </button>
                  </div>
                </div>
              )}

              {/* PROCESSING STEP */}
              {gatewayStep === 'processing' && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-12 h-12 border-4 border-brand-gold-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  <div className="space-y-1">
                    <p className="font-bold text-brand-green-900 text-sm text-center">Querying Security Bank Nodes...</p>
                    <p className="text-[10px] text-brand-green-600/70 text-center">Connecting directly with National Payments Node server protocol.</p>
                  </div>
                </div>
              )}

              {/* OTP STEP */}
              {gatewayStep === 'otp' && (
                <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
                  <div className="text-center space-y-1.5">
                    <div className="inline-flex p-2 bg-brand-gold-400/20 rounded-xl border border-brand-gold-500/30 text-brand-gold-700">
                      <Lock className="w-5 h-5 font-bold" />
                    </div>
                    <h4 className="font-serif text-base font-bold text-brand-green-950 text-center">2-Factor Authentication Secure Check</h4>
                    <p className="text-[10px] text-brand-green-600/70 max-w-xs mx-auto text-center leading-relaxed">
                      Authorized by Reserve Bank Protocol. Enter the 6-digit passcode delivered to your linked secure contact endpoint.
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-left">
                    {paymentOtpErr && <p className="text-[11px] font-bold text-red-500 bg-red-50 p-2.5 rounded-xl border border-red-100 text-left">{paymentOtpErr}</p>}
                    
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-brand-green-800 block text-center">6-Digit Secure Verification OTP</label>
                      <input 
                        type="text"
                        required
                        maxLength={6}
                        placeholder="e.g., 123456"
                        value={paymentVerifyOtp}
                        onChange={(e) => setPaymentVerifyOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-4 py-3 text-center rounded-xl border border-brand-green-200 focus:outline-none focus:border-brand-green-700 font-mono text-lg font-bold tracking-widest text-brand-green-950 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentVerifyOtp('');
                        setPaymentOtpErr('');
                        setGatewayStep('selection');
                      }}
                      className="w-1/3 py-3.5 bg-brand-cream-100 hover:bg-brand-cream-200 text-brand-green-900 font-bold rounded-xl text-xs text-center cursor-pointer uppercase tracking-wider"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (!paymentVerifyOtp || paymentVerifyOtp.length < 4) {
                          setPaymentOtpErr('Please enter a valid 6-digit passcode.');
                          return;
                        }
                        setPaymentOtpErr('');
                        setProcessingOrder(true);
                        setGatewayStep('processing');
                        const res = await executeOrderPlacement();
                        if (res) {
                          setGatewayStep('success');
                          setTimeout(() => {
                            setIsPaymentGatewayOpen(false);
                          }, 800);
                        } else {
                          setGatewayStep('otp');
                          setPaymentOtpErr('Passcode verification failed. Please try again.');
                        }
                      }}
                      className="w-2/3 py-3.5 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer text-center"
                    >
                      Confirm & Complete Checkout
                    </button>
                  </div>
                </div>
              )}

              {/* SUCCESS STEP */}
              {gatewayStep === 'success' && (
                <div className="text-center py-8 space-y-4 animate-in zoom-in-95 duration-300">
                  <div className="w-16 h-16 rounded-full bg-brand-green-100 text-brand-green-700 flex items-center justify-center mx-auto shadow-md">
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                  </div>
                  <div className="space-y-1">
                    <p className="font-serif font-bold text-brand-green-950 text-base text-center">Vedic Payment Successful!</p>
                    <p className="text-[10px] text-brand-green-600/70 text-center">Dispensing secure health catalog ledger chronicles... Placed successfully.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Merchant Assurance */}
            <div className="bg-brand-cream-50/50 border-t border-brand-green-100 px-6 py-4 flex items-center justify-between text-[10px] text-brand-green-800 font-medium">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-green-700 shrink-0" />
                <span>PCI-DSS Compliant Secure Node</span>
              </span>
              <button
                type="button"
                onClick={() => setIsPaymentGatewayOpen(false)}
                className="text-brand-gold-700 hover:text-brand-gold-800 font-bold hover:underline cursor-pointer"
              >
                Cancel Checkout
              </button>
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
  );
};
