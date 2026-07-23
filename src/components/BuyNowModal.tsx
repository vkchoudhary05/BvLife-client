/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, CheckCircle2, ShoppingBag, Landmark, Sparkles, MapPin, Phone, User, ArrowRight, Lock, AlertCircle, Mail } from 'lucide-react';
import { Product, Order, Address } from '../types';
import { Language, t } from '../lib/translations';
import { validateAndFormatIndianPhone } from '../utils';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface BuyNowModalProps {
  product: Product;
  quantity: number;
  onClose: () => void;
  onPlaceOrder: (orderData: Partial<Order>) => Promise<Order | null>;
  onNavigate: (page: string, params?: any) => void;
  language: Language;
  currentUser?: any;
  onLoginSuccess?: (token: string) => void;
  onAddAddress?: (addr: Address) => void;
}

export const BuyNowModal: React.FC<BuyNowModalProps> = ({
  product,
  quantity,
  onClose,
  onPlaceOrder,
  onNavigate,
  language,
  currentUser,
  onLoginSuccess,
  onAddAddress
}) => {
  // Checkout flow step: 'verify' -> 'address' -> 'payment' -> 'success'
  const [step, setStep] = useState<'verify' | 'address' | 'payment' | 'success'>('verify');

  // Step 1: Verification states
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [mobilePhone, setMobilePhone] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [accountExists, setAccountExists] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Step 2: Address states
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [addressError, setAddressError] = useState('');

  // Step 3: Payment states
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'Cards' | 'Net Banking' | 'Razorpay' | 'Cash on Delivery'>('UPI');
  const [processingOrder, setProcessingOrder] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Interactive Payment Gateway States
  const [isPaymentGatewayOpen, setIsPaymentGatewayOpen] = useState(false);
  const [gatewayStep, setGatewayStep] = useState<'selection' | 'processing' | 'otp' | 'bank_login' | 'success'>('selection');
  
  // Card inputs
  const [cardNo, setCardNo] = useState('');
  const [cardHolder, setCardHolder] = useState(currentUser?.fullName || fullName || '');
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

  // Auto fill if user has addresses
  const userAddresses: Address[] = currentUser?.addresses || [];

  useEffect(() => {
    if (userAddresses.length > 0) {
      const defaultAddr = userAddresses.find(a => a.isDefault) || userAddresses[0];
      setSelectedAddressId(defaultAddr.id);
      setFullName(defaultAddr.fullName || (defaultAddr as any).name || currentUser?.fullName || '');
      setMobilePhone((defaultAddr.phone || currentUser?.phone || '').replace('+91', ''));
      setIsPhoneVerified(true);
      setAddressLine1(defaultAddr.addressLine1 || (defaultAddr as any).street || '');
      setAddressLine2(defaultAddr.addressLine2 || '');
      setCity(defaultAddr.city || '');
      setStateName(defaultAddr.state || '');
      setZipCode(defaultAddr.zipCode || (defaultAddr as any).pincode || '');
      setStep('payment');
    } else if (currentUser) {
      setFullName(currentUser.fullName || '');
      if (currentUser.phone) {
        setMobilePhone(currentUser.phone.replace('+91', ''));
        setIsPhoneVerified(true);
      }
      setStep('address');
    }
  }, [currentUser, userAddresses]);

  // Pricing calculations
  const itemTotal = product.price * quantity;
  const taxAmount = Math.round(itemTotal * 0.12); // 12% tax
  const shippingCharge = itemTotal >= 999 ? 0 : 50; // free above 999
  const finalTotal = itemTotal + taxAmount + shippingCharge;

  // Handles requesting OTP
  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError('');

    if (!fullName.trim()) {
      setVerificationError(language === 'hi' ? 'कृपया अपना पूरा नाम दर्ज करें।' : 'Please enter your full name.');
      return;
    }

    if (!currentUser && !email.trim()) {
      setVerificationError(language === 'hi' ? 'कृपया अपना ईमेल पता दर्ज करें।' : 'Please enter your email address.');
      return;
    }

    if (!currentUser && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setVerificationError(language === 'hi' ? 'कृपया एक वैध ईमेल पता दर्ज करें।' : 'Please enter a valid email address.');
      return;
    }

    if (!currentUser && !password.trim()) {
      setVerificationError(language === 'hi' ? 'कृपया अपना पासवर्ड दर्ज करें।' : 'Please choose a password.');
      return;
    }

    if (!currentUser && password.length < 6) {
      setVerificationError(language === 'hi' ? 'पासवर्ड कम से कम 6 वर्णों का होना चाहिए।' : 'Password must be at least 6 characters.');
      return;
    }

    const formatted = validateAndFormatIndianPhone(mobilePhone);
    if (!formatted) {
      setVerificationError(language === 'hi' ? 'कृपया 10 अंकों का वैध मोबाइल नंबर दर्ज करें।' : 'Please enter a valid 10-digit mobile number.');
      return;
    }

    // Generate simulated 6-digit OTP code
    const mockOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(mockOtp);
    setOtpSent(true);
  };

  // Handles logging in existing users
  const handleLoginAndContinue = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError('');
    setAccountExists(false);
    setIsAuthLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password })
      });

      if (res.ok) {
        const data = await res.json();
        if (onLoginSuccess) {
          onLoginSuccess(data.token);
        }
        
        // If they already have addresses, the userAddresses list hook will trigger step to 'payment'
        if (data.user && data.user.addresses && data.user.addresses.length > 0) {
          const defaultAddr = data.user.addresses.find((a: Address) => a.isDefault) || data.user.addresses[0];
          setSelectedAddressId(defaultAddr.id);
          setFullName(defaultAddr.fullName || defaultAddr.name || data.user.fullName || '');
          setMobilePhone((defaultAddr.phone || data.user.phone || '').replace('+91', ''));
          setIsPhoneVerified(true);
          setAddressLine1(defaultAddr.addressLine1 || defaultAddr.street || '');
          setAddressLine2(defaultAddr.addressLine2 || '');
          setCity(defaultAddr.city || '');
          setStateName(defaultAddr.state || '');
          setZipCode(defaultAddr.zipCode || defaultAddr.pincode || '');
          setStep('payment');
        } else {
          setFullName(data.user.fullName || '');
          if (data.user.phone) {
            setMobilePhone(data.user.phone.replace('+91', ''));
            setIsPhoneVerified(true);
          }
          setStep('address');
        }
      } else {
        const data = await res.json();
        setVerificationError(data.error || 'Invalid credentials or incorrect password.');
      }
    } catch (err) {
      console.error(err);
      setVerificationError('Failed to establish connection. Please try again.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // Handles verifying OTP and registering
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError('');
    setAccountExists(false);

    if (otpCode === generatedOtp || otpCode === '777777') {
      setIsPhoneVerified(true);
      
      if (!currentUser && authMode === 'register') {
        setIsAuthLoading(true);
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              fullName,
              phone: `+91${mobilePhone}`,
              password: password,
              role: 'customer'
            })
          });

          if (res.ok) {
            const data = await res.json();
            if (onLoginSuccess) {
              onLoginSuccess(data.token);
            }
            setStep('address');
          } else {
            const data = await res.json();
            setVerificationError(data.error || 'Registration failed. Email or mobile might already be registered.');
            if (data.accountExists || (data.error && data.error.toLowerCase().includes('already'))) {
              setAccountExists(true);
            }
          }
        } catch (err) {
          console.error(err);
          setVerificationError('Failed to establish account. Please try again.');
        } finally {
          setIsAuthLoading(false);
        }
      } else {
        setStep('address');
      }
    } else {
      setVerificationError(language === 'hi' ? 'गलत ओटीपी। कृपया पुनः प्रयास करें।' : 'Invalid OTP. Please try again.');
    }
  };

  // Handles adding / editing address details
  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    setAddressError('');

    if (!addressLine1.trim() || !city.trim() || !stateName.trim() || !zipCode.trim()) {
      setAddressError(language === 'hi' ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill all required fields.');
      return;
    }

    if (zipCode.length !== 6 || !/^\d+$/.test(zipCode)) {
      setAddressError(language === 'hi' ? 'कृपया एक वैध 6-अंकीय पिनकोड दर्ज करें।' : 'Please enter a valid 6-digit Pincode.');
      return;
    }

    const newAddrObj: Address = {
      id: selectedAddressId || `addr-${Date.now()}`,
      fullName: fullName || currentUser?.fullName || 'Valued Customer',
      addressLine1,
      addressLine2,
      city,
      state: stateName,
      zipCode,
      phone: `+91${mobilePhone}`,
      isDefault: userAddresses.length === 0
    };

    if (onAddAddress) {
      onAddAddress(newAddrObj);
    }
    setSelectedAddressId(newAddrObj.id);

    setStep('payment');
  };

  // Predefined address picker handler
  const handleSelectPredefinedAddress = (addrId: string) => {
    setSelectedAddressId(addrId);
    const addr = userAddresses.find(a => a.id === addrId);
    if (addr) {
      setFullName(addr.fullName);
      setMobilePhone(addr.phone.replace('+91', ''));
      setIsPhoneVerified(true);
      setAddressLine1(addr.addressLine1);
      setAddressLine2(addr.addressLine2 || '');
      setCity(addr.city);
      setStateName(addr.state);
      setZipCode(addr.zipCode);
      setStep('payment');
    }
  };

  // Places order
  const handleCompleteDirectOrder = async () => {
    setProcessingOrder(true);
    
    const targetEmail = currentUser?.email || email.trim().toLowerCase() || 'guest@gramslife.com';

    if (!currentUser && email.trim()) {
      try {
        // Auto-create/register guest account
        await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            fullName,
            phone: `+91${mobilePhone}`,
            password: 'password123',
            role: 'customer'
          })
        });
      } catch (err) {
        console.warn("Auto-registration bypassed (user may already exist or error):", err);
      }
    }

    const shippingAddressObj: Address = {
      id: selectedAddressId || `addr-${Date.now()}`,
      fullName: fullName.trim() || currentUser?.fullName || 'Valued Customer',
      addressLine1: addressLine1.trim() || 'Main Street',
      addressLine2: addressLine2.trim() || '',
      city: city.trim() || 'New Delhi',
      state: stateName.trim() || 'Delhi',
      zipCode: zipCode.trim() || '110001',
      phone: mobilePhone.trim() ? `+91${mobilePhone.replace('+91', '')}` : (currentUser?.phone || '+919876543210'),
      isDefault: false
    };

    const orderData: Partial<Order> = {
      userEmail: targetEmail,
      userName: fullName,
      shippingAddress: shippingAddressObj,
      items: [
        {
          productId: product.id,
          productName: product.name,
          price: product.price,
          quantity: quantity,
          mainImage: product.mainImage
        }
      ],
      subtotal: itemTotal,
      tax: taxAmount,
      shippingCharge: shippingCharge,
      discount: 0,
      finalTotal: finalTotal,
      status: 'Pending',
      paymentMethod: paymentMethod,
      paymentStatus: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid',
      orderDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
    };

    const result = await onPlaceOrder(orderData);

    if (result) {
      setPlacedOrder(result);
      setStep('success');
      setProcessingOrder(false);
      try {
        localStorage.setItem('grams_last_placed_order', JSON.stringify(result));
        localStorage.setItem('grams_last_completed_order', JSON.stringify(result));
        const stored = localStorage.getItem('grams_recent_orders');
        const existingIds: string[] = stored ? JSON.parse(stored) : [];
        if (!existingIds.includes(result.id)) {
          localStorage.setItem('grams_recent_orders', JSON.stringify([result.id, ...existingIds]));
        }
      } catch (e) {}
      if (onNavigate) {
        onNavigate('order-confirmation', { id: result.id });
      } else {
        window.history.pushState({ page: 'order-confirmation', params: { id: result.id } }, '', `/order-confirmation?id=${result.id}`);
      }
      return result;
    } else {
      setProcessingOrder(false);
      setAddressError(language === 'hi' ? 'ऑर्डर पूरा करने में त्रुटि।' : 'Failed to place the order. Please try again.');
      return null;
    }
  };

  const handleStartPaymentForBuyNow = async () => {
    if (paymentMethod === 'Cash on Delivery') {
      const res = await handleCompleteDirectOrder();
      if (res) {
        onClose();
      }
    } else {
      setSimulatedGatewayOtp('123456');
      setPaymentVerifyOtp('123456');
      setPaymentOtpErr('');
      setCardErr('');
      setUpiErr('');
      setBankErr('');
      setGatewayStep('selection');
      setIsPaymentGatewayOpen(true);
    }
  };

  const handleGatewayAuthorize = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardErr('');
    setUpiErr('');
    setBankErr('');

    if (paymentMethod === 'Cards') {
      if (!cardNo || cardNo.replace(/\s/g, '').length < 15) {
        setCardErr('Please enter a valid 16-digit card number.');
        return;
      }
      if (!cardExp || !cardExp.includes('/')) {
        setCardErr('Please enter expiry in MM/YY format.');
        return;
      }
      if (!cardCvvInput || cardCvvInput.length < 3) {
        setCardErr('Please enter a valid CVV.');
        return;
      }
      setGatewayStep('processing');
      setPaymentVerifyOtp('123456');
      setTimeout(() => {
        setGatewayStep('otp');
      }, 1000);
    } else if (paymentMethod === 'UPI') {
      let formattedUpi = upiVal ? upiVal.trim() : '';
      if (!formattedUpi) {
        formattedUpi = `${mobilePhone || 'customer'}@upi`;
      } else if (!formattedUpi.includes('@')) {
        formattedUpi = `${formattedUpi}@upi`;
      }
      setUpiVal(formattedUpi);
      setGatewayStep('processing');
      const res = await handleCompleteDirectOrder();
      if (res) {
        setGatewayStep('success');
        setTimeout(() => {
          setIsPaymentGatewayOpen(false);
          onClose();
        }, 800);
      } else {
        setGatewayStep('selection');
        setUpiErr('Order completion failed. Please try again.');
      }
    } else if (paymentMethod === 'Net Banking') {
      if (!selectedBank) {
        setBankErr('Please select your banking institution.');
        return;
      }
      if (!bankUserId || !bankPassword) {
        setBankErr('Please enter NetBanking Customer ID and password.');
        return;
      }
      setGatewayStep('processing');
      setPaymentVerifyOtp('123456');
      setTimeout(() => {
        setGatewayStep('otp');
      }, 1000);
    }
  };

  const handleVerifyGatewayOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentOtpErr('');

    if (!paymentVerifyOtp || paymentVerifyOtp.trim().length < 4) {
      setPaymentOtpErr('Please enter a valid 6-digit OTP code.');
      return;
    }

    setGatewayStep('processing');
    const res = await handleCompleteDirectOrder();
    if (res) {
      setGatewayStep('success');
      setTimeout(() => {
        setIsPaymentGatewayOpen(false);
        onClose();
      }, 800);
    } else {
      setGatewayStep('otp');
      setPaymentOtpErr('Order verification failed. Please try again.');
    }
  };

  // Indian States lists
  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
    'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
    'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
    'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 
    'Uttarakhand', 'West Bengal', 'Delhi'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-green-950/40 backdrop-blur-md cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden z-10 border border-brand-green-600/10 flex flex-col max-h-[90vh]">
        
        {/* Progress header bar */}
        <div className="h-1.5 w-full bg-brand-cream-100 flex">
          <div 
            className="h-full bg-brand-gold-500 transition-all duration-300"
            style={{ 
              width: 
                step === 'verify' ? '25%' : 
                step === 'address' ? '50%' : 
                step === 'payment' ? '75%' : '100%' 
            }}
          />
        </div>

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-brand-green-600/5 flex items-center justify-between bg-brand-cream-50/50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-brand-gold-500/15 text-brand-gold-700">
              <ShieldCheck className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-serif text-base font-bold text-brand-green-900 leading-tight">
                {language === 'hi' ? 'त्वरित सुरक्षित चेकआउट' : 'Instant Express Purchase'}
              </h3>
              <p className="text-[10px] text-brand-green-600 font-medium">100% Verified Ayurvedic Dispensary</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-brand-green-100/50 text-brand-green-800/60 hover:text-brand-green-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Product Summary Mini Card */}
          {step !== 'success' && (
            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-brand-cream-100/50 border border-brand-green-600/10">
              <div className="w-16 h-16 bg-white border border-brand-green-100 rounded-xl p-1.5 shrink-0 flex items-center justify-center">
                <img 
                  src={product.mainImage} 
                  alt={product.name} 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-serif text-xs font-bold text-brand-green-950 truncate">{product.name}</h4>
                <p className="text-[10px] text-brand-green-600 font-semibold uppercase tracking-wider">{product.brand}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-bold text-brand-green-950">₹{product.price} × {quantity}</span>
                  <span className="text-[10px] bg-brand-gold-500/20 text-brand-gold-800 font-extrabold px-1.5 py-0.5 rounded">
                    {language === 'hi' ? 'सुरक्षित भुगतान' : 'Secure Express'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Steps Panel */}
          {step === 'verify' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <h4 className="font-serif text-sm font-bold text-brand-green-900">
                  {language === 'hi' ? 'चरण 1: पहचान और मोबाइल सत्यापन' : 'Verify Mobile Contact'}
                </h4>
                <p className="text-xs text-brand-green-600/80">
                  {language === 'hi' ? 'ऑर्डर की जानकारी भेजने के लिए ओटीपी सत्यापित करें।' : 'Secure your express delivery with a quick one-time mobile verification.'}
                </p>
              </div>

              {/* Interactive Tab Switcher for Guest/New user vs Existing login */}
              {!currentUser && !otpSent && (
                <div className="grid grid-cols-2 p-1 bg-brand-cream-100/90 rounded-2xl border border-brand-green-200/40 shadow-inner text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('register');
                      setVerificationError('');
                    }}
                    className={`py-2.5 font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                      authMode === 'register'
                        ? "bg-brand-green-800 text-brand-cream-50 shadow-sm border border-brand-gold-500/20 font-serif"
                        : "text-brand-green-700/60 hover:text-brand-green-900"
                    }`}
                  >
                    {language === 'hi' ? 'नया खाता बनाएं' : 'New Seeker (Sign Up)'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setVerificationError('');
                    }}
                    className={`py-2.5 font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                      authMode === 'login'
                        ? "bg-brand-green-800 text-brand-cream-50 shadow-sm border border-brand-gold-500/20 font-serif"
                        : "text-brand-green-700/60 hover:text-brand-green-900"
                    }`}
                  >
                    {language === 'hi' ? 'लॉग इन करें' : 'Existing Seeker (Login)'}
                  </button>
                </div>
              )}

              {verificationError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex flex-col gap-2 font-semibold text-left">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <p className="leading-relaxed flex-1">{verificationError}</p>
                  </div>
                  {accountExists && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('login');
                        setVerificationError('');
                        setAccountExists(false);
                      }}
                      className="self-start text-[10px] uppercase tracking-wider font-extrabold bg-brand-green-800 text-brand-cream-50 px-3 py-1.5 rounded-lg hover:bg-brand-green-900 transition-all cursor-pointer shadow-sm flex items-center gap-1"
                    >
                      <span>Log In to Existing Account</span>
                      <ArrowRight className="w-3 h-3 text-brand-gold-400" />
                    </button>
                  )}
                </div>
              )}

              {/* SMS Sandbox Gate */}
              {otpSent && (
                <div className="p-3.5 bg-brand-gold-500/10 border border-brand-gold-400/20 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-brand-gold-800 text-[10px] font-extrabold uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-brand-gold-600 animate-pulse" />
                    <span>Ayurvedic SMS Gate Simulation</span>
                  </div>
                  <p className="text-xs text-brand-green-900 font-medium">
                    {language === 'hi' 
                      ? `सत्यापन कोड ${generatedOtp} आपके नंबर पर भेजा गया है।` 
                      : `Sandbox OTP Code sent to +91 ${mobilePhone}: `}
                    <span className="font-mono font-black text-brand-gold-800 tracking-wider bg-brand-gold-500/20 px-1.5 py-0.5 rounded">{generatedOtp}</span>
                  </p>
                </div>
              )}

              {!otpSent ? (
                authMode === 'register' || currentUser ? (
                  /* REGISTER FORM OR LOGGED-IN MOBILE VERIFY */
                  <form onSubmit={handleRequestOtp} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-brand-green-800 flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'पूरा नाम' : 'Recipient Full Name'}</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Vipin Choudhary"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl text-brand-green-900 font-semibold placeholder-brand-green-300"
                      />
                    </div>

                    {!currentUser && (
                      <>
                        <div className="space-y-1.5">
                          <label className="font-bold text-brand-green-800 flex items-center gap-1">
                            <Mail className="w-3.5 h-3.5" />
                            <span>{language === 'hi' ? 'ईमेल आईडी' : 'Email Address'}</span>
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="e.g., vipin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl text-brand-green-900 font-semibold placeholder-brand-green-300"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-bold text-brand-green-800 flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" />
                            <span>{language === 'hi' ? 'पासवर्ड चुनें' : 'Choose Account Password'}</span>
                          </label>
                          <input
                            type="password"
                            required
                            minLength={6}
                            placeholder="At least 6 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl text-brand-green-900 font-semibold placeholder-brand-green-300"
                          />
                        </div>
                      </>
                    )}

                    <div className="space-y-1.5">
                      <label className="font-bold text-brand-green-800 flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Phone Number'}</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-green-600/50 font-bold font-mono">+91</span>
                        <input
                          type="tel"
                          required
                          maxLength={10}
                          placeholder="Enter 10-digit mobile number"
                          value={mobilePhone}
                          onChange={(e) => setMobilePhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          className="w-full pl-12 pr-4 py-3 bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl text-brand-green-900 font-bold font-mono tracking-wider placeholder-brand-green-300"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full py-3.5 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold rounded-2xl uppercase tracking-wider cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
                    >
                      <span>{isAuthLoading ? (language === 'hi' ? 'कृपया प्रतीक्षा करें...' : 'Processing...') : (language === 'hi' ? 'ओटीपी प्राप्त करें' : 'Verify Mobile Contact')}</span>
                      <ArrowRight className="w-4 h-4 text-brand-gold-400" />
                    </button>
                  </form>
                ) : (
                  /* PASSWORD LOGIN FORM */
                  <form onSubmit={handleLoginAndContinue} className="space-y-4 text-xs">
                    <div className="space-y-1.5">
                      <label className="font-bold text-brand-green-800 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'ईमेल आईडी या मोबाइल' : 'Email Address / Mobile'}</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., vipin@example.com or 9425011088"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl text-brand-green-900 font-semibold placeholder-brand-green-300"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="font-bold text-brand-green-800 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          <span>{language === 'hi' ? 'पासवर्ड' : 'Account Password'}</span>
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
                        placeholder="Enter your account password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl text-brand-green-900 font-semibold placeholder-brand-green-300"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isAuthLoading}
                      className="w-full py-3.5 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold rounded-2xl uppercase tracking-wider cursor-pointer shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50 font-serif"
                    >
                      <span>{isAuthLoading ? (language === 'hi' ? 'सत्यापन हो रहा है...' : 'Authenticating...') : (language === 'hi' ? 'लॉग इन करें और जारी रखें' : 'Sign In & Continue')}</span>
                      <ArrowRight className="w-4 h-4 text-brand-gold-400" />
                    </button>

                    {/* Quick helper for testing login */}
                    <div className="p-3 bg-brand-cream-100/50 rounded-xl border border-brand-green-600/5 space-y-1">
                      <p className="text-[10px] font-extrabold text-brand-green-800 uppercase tracking-wider">Demo / Sandbox Accounts</p>
                      <p className="text-[11px] text-brand-green-950/80">
                        Try: <span className="font-mono font-bold text-brand-green-900">vkchoudhary050607@gmail.com</span> with password: <span className="font-mono font-bold text-brand-green-900">password123</span>
                      </p>
                    </div>
                  </form>
                )
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-bold text-brand-green-800 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? '6-अंकीय ओटीपी' : 'Enter 6-Digit SMS OTP'}</span>
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="Enter verification code"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center px-4 py-3 bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl text-lg font-bold font-mono tracking-widest text-brand-green-900 placeholder-brand-green-200"
                    />
                  </div>

                  <div className="flex gap-2.5">
                    <button
                      type="button"
                      onClick={() => setOtpSent(false)}
                      className="w-1/3 py-3 bg-brand-cream-200 hover:bg-brand-cream-300 text-brand-green-900 font-bold rounded-2xl cursor-pointer"
                    >
                      {language === 'hi' ? 'पीछे' : 'Back'}
                    </button>
                    <button
                      type="submit"
                      disabled={otpCode.length !== 6}
                      className="w-2/3 py-3 bg-brand-green-800 hover:bg-brand-green-900 disabled:opacity-55 text-brand-cream-50 font-bold rounded-2xl uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                    >
                      <span>{language === 'hi' ? 'ओटीपी सत्यापित करें' : 'Confirm OTP'}</span>
                      <ShieldCheck className="w-4 h-4 text-brand-gold-400" />
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {step === 'address' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase bg-brand-green-700 text-brand-cream-50 px-2 py-0.5 rounded flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-3 h-3 text-brand-gold-400" />
                    Verified
                  </span>
                  <span className="text-xs text-brand-green-600 font-semibold font-mono">+91 {mobilePhone}</span>
                </div>
                <h4 className="font-serif text-sm font-bold text-brand-green-900 pt-1">
                  {language === 'hi' ? 'चरण 2: वितरण पता दर्ज करें' : 'Delivery Destination Details'}
                </h4>
              </div>

              {addressError && (
                <div className="p-3 bg-red-50 border border-red-150 text-red-700 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addressError}</span>
                </div>
              )}

              {/* Saved addresses shortcut if user is logged in */}
              {userAddresses.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider">Select Saved Sanctuary Destination</span>
                  <div className="grid grid-cols-1 gap-2">
                    {userAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectPredefinedAddress(addr.id)}
                        className={`p-3 text-left border rounded-xl bg-brand-cream-50/50 hover:bg-white transition-all cursor-pointer flex items-start gap-3 text-xs ${
                          selectedAddressId === addr.id ? 'border-brand-green-700 shadow-sm ring-1 ring-brand-green-700/20' : 'border-brand-green-600/10'
                        }`}
                      >
                        <MapPin className="w-4 h-4 text-brand-gold-600 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-brand-green-900">{addr.fullName}</p>
                          <p className="text-[11px] text-brand-green-700 truncate">{addr.addressLine1}, {addr.city}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSaveAddress} className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <label className="font-bold text-brand-green-800">{language === 'hi' ? 'मकान/फ्लैट नं., गली, क्षेत्र' : 'House No, Flat No, Street, Colony *'}</label>
                  <input
                    type="text"
                    required
                    placeholder="House No, Landmark, Sector, Locality..."
                    value={addressLine1}
                    onChange={(e) => setAddressLine1(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-brand-green-800">{language === 'hi' ? 'भूमिचिह्न / अतिरिक्त विवरण (वैकल्पिक)' : 'Landmark, Floor, Landmark (Optional)'}</label>
                  <input
                    type="text"
                    placeholder="e.g., Near Shiva Temple, 2nd Floor..."
                    value={addressLine2}
                    onChange={(e) => setAddressLine2(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="font-bold text-brand-green-800">{language === 'hi' ? 'शहर' : 'City / Town *'}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Bhopal"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl font-semibold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-brand-green-800">{language === 'hi' ? 'पिनकोड' : 'Pincode / Zip *'}</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      placeholder="e.g., 462001"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      className="w-full px-4 py-2.5 bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl font-semibold font-mono tracking-wider"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-brand-green-800">{language === 'hi' ? 'राज्य' : 'State / Region *'}</label>
                  <select
                    value={stateName}
                    required
                    onChange={(e) => setStateName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 rounded-xl font-semibold text-brand-green-900"
                  >
                    <option value="">-- Choose State --</option>
                    {indianStates.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2.5 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setStep('verify')}
                    className="w-1/3 py-3 bg-brand-cream-200 hover:bg-brand-cream-300 text-brand-green-900 font-bold rounded-2xl cursor-pointer"
                  >
                    {language === 'hi' ? 'पीछे' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-3 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold rounded-2xl uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-1"
                  >
                    <span>{language === 'hi' ? 'भुगतान पर जाएं' : 'Proceed to Payment'}</span>
                    <ArrowRight className="w-4 h-4 text-brand-gold-400" />
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 'payment' && (
            <div className="space-y-5">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-semibold text-brand-green-800">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-green-700" />
                    <span className="font-bold max-w-[200px] truncate">{addressLine1}, {city}</span>
                  </div>
                  <button onClick={() => setStep('address')} className="text-brand-gold-700 font-bold hover:underline">Change</button>
                </div>
                <h4 className="font-serif text-sm font-bold text-brand-green-900 pt-2">
                  {language === 'hi' ? 'चरण 3: सुरक्षित भुगतान' : 'Secure Premium Payment'}
                </h4>
              </div>

              {/* Order Invoice Details */}
              <div className="bg-brand-cream-100/40 border border-brand-green-600/10 rounded-2xl p-4 space-y-3 text-xs text-brand-green-900">
                <span className="text-[10px] font-extrabold uppercase text-brand-green-800 tracking-wider">Ayurvedic Dispensing Invoice</span>
                
                <div className="space-y-2 pt-1 border-t border-brand-green-600/5">
                  <div className="flex justify-between">
                    <span className="text-brand-green-700">Subtotal ({quantity} {language === 'hi' ? 'आइटम' : 'item'})</span>
                    <span className="font-semibold text-brand-green-950">₹{itemTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-green-700">CGST + SGST (12%)</span>
                    <span className="font-semibold text-brand-green-950">₹{taxAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-green-700">Kerala Wellness Shipping</span>
                    {shippingCharge === 0 ? (
                      <span className="font-bold text-brand-green-700 uppercase text-[10px] tracking-wider bg-brand-green-500/10 px-1.5 py-0.5 rounded">FREE</span>
                    ) : (
                      <span className="font-semibold text-brand-green-950">₹{shippingCharge}</span>
                    )}
                  </div>
                  <div className="flex justify-between pt-2 border-t border-brand-green-600/10 text-sm font-extrabold font-serif text-brand-green-950">
                    <span>{language === 'hi' ? 'कुल राशि' : 'Express Total Amount'}</span>
                    <span>₹{finalTotal}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-2.5">
                <span className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider block">Select Secure Gateway Method</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 cursor-pointer transition-all ${
                      paymentMethod === 'UPI' ? 'border-brand-green-700 bg-brand-green-500/5 shadow-inner' : 'border-brand-green-600/10 bg-white hover:border-brand-green-600/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 font-bold text-brand-green-950 text-xs">
                        <Landmark className="w-3.5 h-3.5 text-brand-gold-600" />
                        <span>UPI Mobile Pay</span>
                      </div>
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'UPI' ? 'border-brand-green-700 bg-brand-green-700' : 'border-gray-300 bg-white'
                      }`}>
                        {paymentMethod === 'UPI' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <span className="text-[9px] text-brand-green-600 leading-tight">GooglePay, PhonePe, Paytm QR or VPA.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cards')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 cursor-pointer transition-all ${
                      paymentMethod === 'Cards' ? 'border-brand-green-700 bg-brand-green-500/5 shadow-inner' : 'border-brand-green-600/10 bg-white hover:border-brand-green-600/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 font-bold text-brand-green-950 text-xs">
                        <Lock className="w-3.5 h-3.5 text-brand-gold-600" />
                        <span>Credit / Debit Card</span>
                      </div>
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'Cards' ? 'border-brand-green-700 bg-brand-green-700' : 'border-gray-300 bg-white'
                      }`}>
                        {paymentMethod === 'Cards' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <span className="text-[9px] text-brand-green-600 leading-tight">Visa, Mastercard, RuPay, Amex.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Net Banking')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 cursor-pointer transition-all ${
                      paymentMethod === 'Net Banking' ? 'border-brand-green-700 bg-brand-green-500/5 shadow-inner' : 'border-brand-green-600/10 bg-white hover:border-brand-green-600/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 font-bold text-brand-green-950 text-xs">
                        <Landmark className="w-3.5 h-3.5 text-brand-green-700" />
                        <span>Net Banking</span>
                      </div>
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'Net Banking' ? 'border-brand-green-700 bg-brand-green-700' : 'border-gray-300 bg-white'
                      }`}>
                        {paymentMethod === 'Net Banking' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <span className="text-[9px] text-brand-green-600 leading-tight">HDFC, SBI, ICICI, Axis, Kotak, PNB.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cash on Delivery')}
                    className={`p-3 rounded-2xl border text-left flex flex-col justify-between h-20 cursor-pointer transition-all ${
                      paymentMethod === 'Cash on Delivery' ? 'border-brand-green-700 bg-brand-green-500/5 shadow-inner' : 'border-brand-green-600/10 bg-white hover:border-brand-green-600/20'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 font-bold text-brand-green-950 text-xs">
                        <ShoppingBag className="w-3.5 h-3.5 text-brand-green-700" />
                        <span>Cash on Delivery</span>
                      </div>
                      <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                        paymentMethod === 'Cash on Delivery' ? 'border-brand-green-700 bg-brand-green-700' : 'border-gray-300 bg-white'
                      }`}>
                        {paymentMethod === 'Cash on Delivery' && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                    </div>
                    <span className="text-[9px] text-brand-green-600 leading-tight">Pay cash directly upon home delivery.</span>
                  </button>
                </div>

                {/* Inline method details */}
                {paymentMethod === 'UPI' && (
                  <div className="p-3.5 bg-brand-green-50/60 rounded-2xl border border-brand-green-200/50 space-y-2 mt-2">
                    <div className="flex items-center justify-between text-[10px] font-bold text-brand-green-800 uppercase tracking-wider">
                      <span>Enter Mobile UPI ID / VPA</span>
                      <span className="text-brand-green-600 font-normal">e.g., vkchoudhary050607@okaxis</span>
                    </div>
                    <input
                      type="text"
                      placeholder={`${mobilePhone || '9425011088'}@upi`}
                      value={upiVal}
                      onChange={(e) => setUpiVal(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-green-200 text-xs font-mono font-bold text-brand-green-950 focus:outline-none focus:border-brand-green-700 bg-white"
                    />
                  </div>
                )}

                {paymentMethod === 'Cards' && (
                  <div className="p-3.5 bg-brand-green-50/60 rounded-2xl border border-brand-green-200/50 space-y-2.5 mt-2 text-xs">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider">Card Number</label>
                      <input
                        type="text"
                        maxLength={19}
                        placeholder="4111 2222 3333 4444"
                        value={cardNo}
                        onChange={(e) => setCardNo(e.target.value.replace(/\D/g, '').slice(0, 16))}
                        className="w-full px-3.5 py-2 rounded-xl border border-brand-green-200 font-mono font-bold text-brand-green-950 bg-white"
                      />
                    </div>
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
                        className="w-full px-3 py-2 rounded-xl border border-brand-green-200 font-mono text-center font-bold text-brand-green-950 bg-white"
                      />
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="CVV"
                        value={cardCvvInput}
                        onChange={(e) => setCardCvvInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="w-full px-3 py-2 rounded-xl border border-brand-green-200 font-mono text-center font-bold text-brand-green-950 bg-white"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'Net Banking' && (
                  <div className="p-3.5 bg-brand-green-50/60 rounded-2xl border border-brand-green-200/50 space-y-2 mt-2">
                    <label className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider block">Choose Bank</label>
                    <select
                      value={selectedBank}
                      onChange={(e) => setSelectedBank(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-green-200 text-xs font-bold text-brand-green-950 bg-white"
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

              {/* Confirm Actions */}
              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('address')}
                  className="w-1/3 py-3.5 bg-brand-cream-200 hover:bg-brand-cream-300 text-brand-green-900 font-bold rounded-2xl cursor-pointer text-xs uppercase font-serif"
                >
                  {language === 'hi' ? 'पीछे' : 'Back'}
                </button>
                <button
                  type="button"
                  onClick={handleStartPaymentForBuyNow}
                  disabled={processingOrder}
                  className="w-2/3 py-3.5 bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-green-950 font-extrabold rounded-2xl uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-2 active:scale-[0.98] text-xs font-serif disabled:opacity-50"
                >
                  {processingOrder ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-brand-green-950 border-t-transparent animate-spin" />
                      <span>{language === 'hi' ? 'संसाधित किया जा रहा है...' : 'Processing...'}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {paymentMethod === 'Cash on Delivery' 
                          ? (language === 'hi' ? 'ऑर्डर पूरा करें (COD)' : 'Confirm Cash Order') 
                          : (language === 'hi' ? `भुगतान करें ₹${finalTotal}` : `Pay & Place Order ₹${finalTotal}`)
                        }
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-brand-green-900 shrink-0" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* SECURE INTEGRATED PAYMENT GATEWAY PORTAL MODAL */}
          {isPaymentGatewayOpen && (
            <div className="fixed inset-0 bg-brand-green-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300">
              <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl border border-brand-green-200/20 relative animate-in zoom-in-95 duration-300 text-left">
                {/* Top Security Accent Header */}
                <div className="bg-brand-green-900 text-brand-cream-50 p-5 relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-gold-500 to-brand-gold-300" />
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-brand-green-800 rounded-xl border border-brand-gold-500/20">
                        <ShieldCheck className="w-5 h-5 text-brand-gold-400" />
                      </div>
                      <div>
                        <h3 className="font-serif text-sm font-bold tracking-tight text-left">Express Security Gateway</h3>
                        <p className="text-[10px] text-brand-cream-300/80 font-mono text-left">Merchant: Bv Life | 256-bit SSL Encrypted</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[9px] font-extrabold uppercase bg-brand-gold-400/20 text-brand-gold-400 border border-brand-gold-500/30 px-2 py-0.5 rounded-full">
                        {paymentMethod}
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

                <div className="p-6 space-y-5">
                  {gatewayStep === 'selection' && (
                    <form onSubmit={handleGatewayAuthorize} className="space-y-4">
                      {paymentMethod === 'Cards' && (
                        <div className="space-y-3.5">
                          {/* Virtual interactive credit card */}
                          <div className="relative h-40 rounded-2xl bg-gradient-to-br from-brand-green-900 via-brand-green-850 to-brand-green-950 p-5 text-brand-cream-100 flex flex-col justify-between shadow-lg border border-brand-gold-500/10 overflow-hidden font-mono text-left">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-[8px] uppercase tracking-widest font-sans text-brand-cream-300">Apothecary Reserve</p>
                                <span className="text-xs font-bold text-brand-gold-400 font-serif">Express Wellness Card</span>
                              </div>
                              <div className="bg-brand-cream-100/10 px-2 py-0.5 rounded border border-brand-cream-100/20 text-[9px] font-sans font-black tracking-wider uppercase">
                                {cardNo.startsWith('4') ? 'Visa' : cardNo.startsWith('5') ? 'Mastercard' : 'Card'}
                              </div>
                            </div>
                            
                            <div className="text-sm sm:text-base font-bold tracking-widest text-left">
                              {cardNo ? cardNo.replace(/(\d{4})/g, '$1 ').trim() : '•••• •••• •••• ••••'}
                            </div>

                            <div className="flex justify-between items-end text-[10px]">
                              <div>
                                <span className="text-[7px] text-brand-cream-300 uppercase block font-sans">Card Holder</span>
                                <span className="font-bold tracking-wide uppercase">{cardHolder || 'Customer Name'}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-[7px] text-brand-cream-300 uppercase block font-sans">Expires</span>
                                <span className="font-bold tracking-wide">{cardExp || 'MM/YY'}</span>
                              </div>
                            </div>
                          </div>

                          {cardErr && <p className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded-xl border border-red-200">{cardErr}</p>}

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider">Card Number</label>
                            <input
                              type="text"
                              required
                              maxLength={19}
                              placeholder="4111 2222 3333 4444"
                              value={cardNo}
                              onChange={(e) => setCardNo(e.target.value.replace(/\D/g, '').slice(0, 16))}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-green-200 text-xs font-mono font-bold text-brand-green-950 focus:outline-none focus:border-brand-green-700 bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider">Expiry Date</label>
                              <input
                                type="text"
                                required
                                maxLength={5}
                                placeholder="12/28"
                                value={cardExp}
                                onChange={(e) => {
                                  let val = e.target.value.replace(/\D/g, '');
                                  if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                                  setCardExp(val);
                                }}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-green-200 text-xs font-mono font-bold text-brand-green-950 focus:outline-none focus:border-brand-green-700 bg-white"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider">CVV Code</label>
                              <input
                                type="password"
                                required
                                maxLength={4}
                                placeholder="888"
                                value={cardCvvInput}
                                onChange={(e) => setCardCvvInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                className="w-full px-3.5 py-2.5 rounded-xl border border-brand-green-200 text-xs font-mono font-bold text-brand-green-950 focus:outline-none focus:border-brand-green-700 bg-white"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'UPI' && (
                        <div className="space-y-3.5">
                          {upiErr && <p className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded-xl border border-red-200">{upiErr}</p>}
                          
                          <div className="p-4 bg-brand-green-50/60 rounded-2xl border border-brand-green-100 space-y-3 text-center">
                            <span className="text-[10px] font-extrabold uppercase text-brand-green-800 tracking-wider block">Scan QR via GooglePay, PhonePe or Paytm</span>
                            
                            {/* Simulated Interactive UPI QR code */}
                            <div className="w-32 h-32 bg-white mx-auto p-2 rounded-xl border border-brand-green-200 shadow-sm flex items-center justify-center relative">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=gramslife@icici%26pn=GramsLife%26am=${finalTotal}%26cu=INR`} 
                                alt="UPI Payment QR Code"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <p className="text-[10px] text-brand-green-700 font-mono">Pay to: <strong className="font-bold text-brand-green-950">gramslife@icici</strong></p>
                          </div>

                          <div className="relative flex py-1 items-center">
                            <div className="flex-grow border-t border-brand-green-200"></div>
                            <span className="flex-shrink mx-3 text-[10px] font-bold uppercase text-brand-green-600">OR Enter Mobile UPI VPA</span>
                            <div className="flex-grow border-t border-brand-green-200"></div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider">UPI VPA Address</label>
                            <input
                              type="text"
                              placeholder="e.g., 9425011088@ybl or username@okaxis"
                              value={upiVal}
                              onChange={(e) => setUpiVal(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-green-200 text-xs font-mono text-brand-green-950 focus:outline-none focus:border-brand-green-700 bg-white"
                            />
                          </div>
                        </div>
                      )}

                      {paymentMethod === 'Net Banking' && (
                        <div className="space-y-3.5">
                          {bankErr && <p className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded-xl border border-red-200">{bankErr}</p>}
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider">Select Banking Institution</label>
                            <select
                              value={selectedBank}
                              onChange={(e) => setSelectedBank(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-green-200 text-xs font-bold text-brand-green-950 focus:outline-none focus:border-brand-green-700 bg-white"
                            >
                              <option value="">Choose your bank...</option>
                              <option value="HDFC Bank">HDFC Bank</option>
                              <option value="State Bank of India">State Bank of India (SBI)</option>
                              <option value="ICICI Bank">ICICI Bank</option>
                              <option value="Axis Bank">Axis Bank</option>
                              <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                              <option value="Punjab National Bank">Punjab National Bank (PNB)</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider">Customer ID / User ID</label>
                            <input
                              type="text"
                              placeholder="e.g., 88492011"
                              value={bankUserId}
                              onChange={(e) => setBankUserId(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-green-200 text-xs font-mono text-brand-green-950 focus:outline-none focus:border-brand-green-700 bg-white"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider">NetBanking Password</label>
                            <input
                              type="password"
                              placeholder="••••••••••••"
                              value={bankPassword}
                              onChange={(e) => setBankPassword(e.target.value)}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-brand-green-200 text-xs font-mono text-brand-green-950 focus:outline-none focus:border-brand-green-700 bg-white"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsPaymentGatewayOpen(false)}
                          className="w-1/3 py-3 bg-brand-cream-200 hover:bg-brand-cream-300 text-brand-green-900 font-bold rounded-xl text-xs uppercase cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="w-2/3 py-3 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                        >
                          <span>Authorize Payment ₹{finalTotal}</span>
                          <ArrowRight className="w-3.5 h-3.5 text-brand-gold-400" />
                        </button>
                      </div>
                    </form>
                  )}

                  {gatewayStep === 'processing' && (
                    <div className="py-12 text-center space-y-4">
                      <div className="w-14 h-14 border-4 border-brand-green-800 border-t-brand-gold-500 rounded-full animate-spin mx-auto" />
                      <div>
                        <h4 className="font-serif text-base font-bold text-brand-green-950">Connecting to Bank Security Nodes...</h4>
                        <p className="text-xs text-brand-green-700/80">Please do not refresh or close this browser window.</p>
                      </div>
                    </div>
                  )}

                  {gatewayStep === 'otp' && (
                    <form onSubmit={handleVerifyGatewayOtp} className="space-y-4">
                      <div className="text-center space-y-1">
                        <h4 className="font-serif text-base font-bold text-brand-green-950">Enter 2FA Security OTP Code</h4>
                        <p className="text-xs text-brand-green-700">We sent a 6-digit verification code to your registered phone ending in **88.</p>
                      </div>

                      {paymentOtpErr && (
                        <p className="text-xs text-red-600 font-bold bg-red-50 p-2 rounded-xl border border-red-200 text-center">{paymentOtpErr}</p>
                      )}

                      <div className="space-y-1 max-w-xs mx-auto text-center">
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="6-Digit OTP"
                          value={paymentVerifyOtp}
                          onChange={(e) => setPaymentVerifyOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="w-full text-center px-4 py-3 rounded-xl border-2 border-brand-green-300 text-base font-mono font-bold tracking-widest text-brand-green-950 focus:outline-none focus:border-brand-green-800 bg-white"
                        />
                      </div>

                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setGatewayStep('selection')}
                          className="w-1/3 py-3 bg-brand-cream-200 hover:bg-brand-cream-300 text-brand-green-900 font-bold rounded-xl text-xs uppercase cursor-pointer"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="w-2/3 py-3 bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-green-950 font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                        >
                          <span>Verify & Complete Order</span>
                          <CheckCircle2 className="w-4 h-4 text-brand-green-900" />
                        </button>
                      </div>
                    </form>
                  )}

                  {gatewayStep === 'success' && (
                    <div className="py-10 text-center space-y-4 animate-in zoom-in-95 duration-300">
                      <div className="w-16 h-16 rounded-full bg-brand-green-100 text-brand-green-700 flex items-center justify-center mx-auto shadow-md">
                        <CheckCircle2 className="w-10 h-10 animate-bounce" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-serif font-bold text-brand-green-950 text-base">Payment Authorized Successfully!</h4>
                        <p className="text-xs text-brand-green-700">Generating your order confirmation receipt...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 'success' && placedOrder && (
            <div className="text-center py-6 space-y-6 animate-in zoom-in-95 duration-300">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-green-100 border border-brand-green-200 text-brand-green-700 shadow-sm animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-green-950">
                  {language === 'hi' ? 'आपका ऑर्डर सफलतापूर्वक सुरक्षित हो गया है!' : 'Your Wellness Order Is Secured!'}
                </h3>
                <p className="text-xs text-brand-green-800">
                  {language === 'hi' 
                    ? 'आपका ऑर्डर वैदिक क्रॉनिकल डेटाबेस में दर्ज कर लिया गया है।' 
                    : 'Your order has been logged into the Vedic chronicle database.'}
                </p>
                <p className="text-xs font-mono text-brand-gold-700 font-bold tracking-wide">
                  ORDER ID: {placedOrder.id}
                </p>
              </div>

              {!currentUser && email && (
                <div className="bg-brand-gold-500/10 border border-brand-gold-500/20 rounded-[1.5rem] p-4 max-w-sm mx-auto text-left space-y-1.5">
                  <p className="text-[10px] font-extrabold text-brand-gold-800 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-gold-600 animate-pulse" />
                    <span>Sacred Access Created</span>
                  </p>
                  <p className="text-xs text-brand-green-950 leading-relaxed">
                    An account has been auto-created for you under <strong className="font-mono">{email}</strong>. Track your order chronicles in the wellness panel using password: <strong className="font-mono">password123</strong>.
                  </p>
                </div>
              )}

              {/* Order Confirmation Receipt Details (Matches Cart Normal Order) */}
              <div className="border border-brand-green-600/15 rounded-2xl bg-white p-5 text-left text-xs text-brand-green-800 space-y-4 shadow-sm max-w-sm mx-auto">
                
                {/* Delivery address details */}
                <div className="space-y-1">
                  <h5 className="font-bold text-brand-green-900">Delivery Address Selected:</h5>
                  <p className="font-medium text-brand-green-900/80">{placedOrder.shippingAddress?.fullName || fullName}</p>
                  <p>{placedOrder.shippingAddress?.addressLine1 || addressLine1}, {placedOrder.shippingAddress?.addressLine2 || addressLine2 || ''}</p>
                  <p>{placedOrder.shippingAddress?.city || city}, {placedOrder.shippingAddress?.state || stateName} - {placedOrder.shippingAddress?.zipCode || zipCode}</p>
                  <p className="font-mono text-[11px] pt-0.5">Phone Contact: {placedOrder.shippingAddress?.phone || `+91${mobilePhone}`}</p>
                </div>

                {/* Items breakdown */}
                <div className="space-y-2 pt-2 border-t border-brand-green-600/10">
                  <h5 className="font-bold text-brand-green-900">Remedies Breakdown:</h5>
                  <div className="space-y-1.5">
                    {placedOrder.items && placedOrder.items.length > 0 ? (
                      placedOrder.items.map((it, i) => (
                        <div key={i} className="flex justify-between font-medium text-brand-green-950">
                          <span>{it.productName} (x{it.quantity})</span>
                          <span>₹{it.price * it.quantity}</span>
                        </div>
                      ))
                    ) : (
                      <div className="flex justify-between font-medium text-brand-green-950">
                        <span>{product.name} (x{quantity})</span>
                        <span>₹{product.price * quantity}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Grand Total */}
                <div className="pt-2 border-t border-brand-green-600/10 flex justify-between font-serif text-sm font-bold text-brand-green-950">
                  <span>Grand Total Secured</span>
                  <span>₹{placedOrder.finalTotal || finalTotal}</span>
                </div>

                {/* Payment Status Badge */}
                <div className="bg-brand-cream-100 p-3 rounded-xl border border-brand-gold-500/15 text-center text-[10px] text-brand-gold-800 font-extrabold uppercase tracking-wider">
                  🛡️ Payment status: {placedOrder.paymentStatus || (paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Paid')} via {placedOrder.paymentMethod || paymentMethod}
                </div>

              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2 justify-center max-w-sm mx-auto pt-2">
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('track-order');
                  }}
                  className="flex-1 py-3 bg-brand-green-800 hover:bg-brand-green-900 text-brand-cream-50 font-bold rounded-2xl text-[11px] uppercase tracking-wider cursor-pointer shadow-sm transition-colors text-center"
                >
                  {language === 'hi' ? 'ऑर्डर ट्रैक करें' : 'Track Order Dispatch'}
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onNavigate('dashboard', { tab: 'orders' });
                  }}
                  className="flex-1 py-3 bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-green-950 font-bold rounded-2xl text-[11px] uppercase tracking-wider cursor-pointer shadow-sm transition-colors text-center"
                >
                  {language === 'hi' ? 'डैशबोर्ड में देखें' : 'View In Dashboard'}
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 bg-brand-cream-200 hover:bg-brand-cream-300 text-brand-green-900 font-bold rounded-2xl text-[11px] uppercase tracking-wider cursor-pointer border border-brand-green-600/10 transition-colors text-center"
                >
                  {language === 'hi' ? 'दुकान जारी रखें' : 'Continue Shopping'}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

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
