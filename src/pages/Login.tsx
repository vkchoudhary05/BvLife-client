/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, User as UserIcon, Phone, Shield, Sparkles, Lock, ArrowRight, Eye, EyeOff, KeyRound, Smartphone } from 'lucide-react';
import { validateAndFormatIndianPhone } from '../utils';
import { sendMSG91Otp, formatMSG91Identifier, performOtpLogin } from '../services/msg91OtpService';
import { SecureOtpWidget } from '../components/secureOtpWidget';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';

interface LoginProps {
  onNavigate: (page: string, params?: any) => void;
  handleLogin: (credentials: { email: string; password?: string }) => Promise<boolean>;
  handleRegister: (data: { name: string; email: string; phone: string; role: string; password?: string; accessToken?: string; code?: string; reqId?: string }) => Promise<boolean>;
}

export const Login: React.FC<LoginProps> = ({
  onNavigate,
  handleLogin,
  handleRegister
}) => {
  // Auth view states
  const [isRegistering, setIsRegistering] = useState(false);
  const [loginMode, setLoginMode] = useState<'password' | 'otp'>('password');
  
  // Registration Form Fields
  const [authEmail, setAuthEmail] = useState('');
  const [authName, setAuthName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authConfirmPassword, setAuthConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Direct OTP Sign In Fields
  const [otpLoginIdentifier, setOtpLoginIdentifier] = useState('');
  const [otpLoginStarted, setOtpLoginStarted] = useState(false);

  // Registration OTP step state
  const [otpStep, setOtpStep] = useState(false);
  const [formattedPhone, setFormattedPhone] = useState('');
  const [activeReqId, setActiveReqId] = useState<string | undefined>(undefined);

  // Loading & error states
  const [authLoading, setAuthLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Submit handler for Registration Details (Step 1 -> pre-checks duplicate email/phone then triggers SMS OTP)
  const handleRegisterDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    if (authPassword !== authConfirmPassword) {
      setLoginError('Passwords do not match. Please ensure both fields are identical.');
      return;
    }
    if (authPassword.length < 6) {
      setLoginError('Security requirement: Password must be at least 6 characters.');
      return;
    }

    const cleanPhone = authPhone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setLoginError('Mobile number must contain exactly 10 digits.');
      return;
    }

    if (!authEmail || !authEmail.includes('@')) {
      setLoginError('Please enter a valid email address.');
      return;
    }

    setAuthLoading(true);
    try {
      // 1. PRE-CHECK DUPLICATE: Check if email or mobile number already exists BEFORE sending OTP
      const checkRes = await fetch('/api/auth/check-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail.trim(), phone: authPhone.trim() })
      });
      const checkData = await checkRes.json();

      if (checkData.exists) {
        if (checkData.emailExists && checkData.phoneExists) {
          setLoginError('Both this email address and mobile number are already registered. Please sign in instead.');
        } else if (checkData.emailExists) {
          setLoginError('This email address is already registered. Please sign in instead.');
        } else if (checkData.phoneExists) {
          setLoginError('This mobile number is already registered. Please sign in instead.');
        } else {
          setLoginError(checkData.error || 'An account with this email or mobile number already exists. Please sign in instead.');
        }
        setAuthLoading(false);
        return; // STOP! DO NOT SEND OTP!
      }

      // 2. Dispatch SMS OTP only
      const msg91Target = formatMSG91Identifier(authPhone);
      const response = await sendMSG91Otp(msg91Target);

      if (response.success) {
        if (response.reqId) setActiveReqId(response.reqId);
        setFormattedPhone(msg91Target);
        setOtpStep(true);
        setLoginSuccess(`Verification passcode dispatched via SMS to +${msg91Target}`);
      } else {
        setLoginError(response.error || 'Could not dispatch SMS verification OTP. Please check mobile details.');
      }
    } catch (err: any) {
      console.error(err);
      setLoginError('Connection failure during registration pre-check.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Callback when OTP verified for Registration
  const handleRegisterOtpVerified = async (params: { code: string; accessToken?: string; reqId?: string }) => {
    setAuthLoading(true);
    setLoginError('');
    try {
      const success = await handleRegister({ 
        name: authName, 
        email: authEmail,
        phone: formattedPhone || authPhone,
        role: 'customer',
        password: authPassword,
        accessToken: params.accessToken,
        code: params.code,
        reqId: params.reqId || activeReqId
      });

      if (success) {
        setAuthEmail('');
        setAuthName('');
        setAuthPhone('');
        setAuthPassword('');
        setAuthConfirmPassword('');
        setOtpStep(false);
        setIsRegistering(false);
        onNavigate('home');
      } else {
        setLoginError('Account creation failed. Please check registration parameters or try another email.');
      }
    } catch (err: any) {
      setLoginError('An unexpected error occurred during account finalization.');
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  // Submit handler for starting Direct OTP Login (Checks if registered before sending SMS OTP)
  const handleStartOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');

    const query = otpLoginIdentifier.trim();
    if (!query) {
      setLoginError('Please enter your registered mobile number.');
      return;
    }

    const cleanPhone = query.replace(/\D/g, '');
    if (cleanPhone.length !== 10 && !query.includes('@')) {
      setLoginError('Please enter a valid 10-digit mobile phone number.');
      return;
    }

    setAuthLoading(true);
    try {
      // 1. Check if the mobile number / user exists in the database
      const checkRes = await fetch('/api/auth/check-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const checkData = await checkRes.json();

      if (!checkData.exists) {
        setLoginError('This mobile number is not registered. Please register first or check your number.');
        setAuthLoading(false);
        return; // STOP! DO NOT SEND OTP!
      }

      // 2. Mobile number is registered -> Send SMS OTP
      const target = query.includes('@') ? query.toLowerCase() : formatMSG91Identifier(query);
      const res = await sendMSG91Otp(target);

      if (res.success) {
        if (res.reqId) setActiveReqId(res.reqId);
        setOtpLoginStarted(true);
        setLoginSuccess(`Verification code dispatched via SMS to ${query}`);
      } else {
        setLoginError(res.error || 'Failed to dispatch login SMS OTP passcode.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Connection error checking registered mobile number.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Callback when OTP verified for Direct OTP Login
  const handleOtpLoginVerified = async (params: { code: string; accessToken?: string; reqId?: string }) => {
    setAuthLoading(true);
    setLoginError('');
    try {
      const res = await performOtpLogin({
        identifier: otpLoginIdentifier.trim(),
        code: params.code,
        reqId: params.reqId,
        accessToken: params.accessToken
      });

      if (res.success && res.token) {
        localStorage.setItem('grams_auth_token', res.token);
        localStorage.setItem('token', res.token);
        setLoginSuccess('Authentication successful! Welcome back.');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        setLoginError(res.error || 'OTP login verification failed.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Error processing OTP sign in.');
    } finally {
      setAuthLoading(false);
    }
  };

  // Standard Password Sign In
  const handlePasswordLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');
    setAuthLoading(true);
    try {
      let loginId = authEmail.trim();
      const isMaybePhone = /^[0-9+\s()-]+$/.test(loginId);
      if (isMaybePhone) {
        const cleanPhone = loginId.replace(/\D/g, '');
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
        onNavigate('home');
      }
    } catch (err: any) {
      setLoginError('An unexpected error occurred during sign in.');
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4 sm:px-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-brand-cream-50 border border-brand-gold-300 rounded-[2.5rem] p-6 sm:p-8 shadow-2xl flex flex-col space-y-6 relative overflow-hidden">
        
        {/* Decorative top gold line */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-gold-500 via-brand-cream-300 to-brand-gold-600" />

        {/* Header block with Logo and Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-brand-green-800 text-brand-gold-400 font-serif text-2xl font-bold border border-brand-gold-500/30 shadow-md mx-auto">
            G
          </div>
          <div className="space-y-1">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-brand-green-900 tracking-tight">
              {isRegistering 
                ? (otpStep ? "Verify Identity" : "Create Account") 
                : (otpLoginStarted ? "Verify OTP Sign In" : "Welcome Back")}
            </h2>
            <p className="text-xs text-brand-green-800/70 max-w-xs mx-auto leading-relaxed">
              {isRegistering 
                ? (otpStep 
                    ? "Enter the multi-channel verification passcode dispatched via SecureOTPWidgetM7DX." 
                    : "Begin your digital wellness journey and access personal health profiles.")
                : (otpLoginStarted 
                    ? "Enter the passcode sent to authenticate your account."
                    : "Sign in with password or instant multi-channel OTP verification.")}
            </p>
          </div>
        </div>

        {/* Primary Tab Switcher (Sign In vs Register) */}
        {!otpStep && !otpLoginStarted && (
          <div className="grid grid-cols-2 p-1 bg-brand-cream-100/90 rounded-2xl border border-brand-green-200/40 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setLoginError('');
                setLoginSuccess('');
                setOtpStep(false);
                setOtpLoginStarted(false);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
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
                setLoginSuccess('');
                setOtpStep(false);
                setOtpLoginStarted(false);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all duration-300 cursor-pointer ${
                isRegistering
                  ? "bg-brand-green-800 text-brand-cream-50 shadow-sm border border-brand-gold-500/20 font-serif"
                  : "text-brand-green-700/60 hover:text-brand-green-900"
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* Secondary Switcher in Sign In (Password vs One-Time Passcode) */}
        {!isRegistering && !otpLoginStarted && (
          <div className="flex items-center justify-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setLoginMode('password');
                setLoginError('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                loginMode === 'password'
                  ? 'bg-brand-green-900 text-brand-cream-50 shadow-xs'
                  : 'bg-white border border-brand-green-200 text-brand-green-800 hover:bg-brand-cream-100'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Password Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode('otp');
                setLoginError('');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                loginMode === 'otp'
                  ? 'bg-brand-green-900 text-brand-cream-50 shadow-xs'
                  : 'bg-white border border-brand-green-200 text-brand-green-800 hover:bg-brand-cream-100'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-brand-gold-600" />
              <span>Sign In with OTP</span>
            </button>
          </div>
        )}

        {/* Error Banner */}
        {loginError && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center font-semibold animate-shake">
            {loginError}
          </div>
        )}

        {/* Success Banner */}
        {loginSuccess && !otpStep && !otpLoginStarted && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl text-center font-semibold">
            {loginSuccess}
          </div>
        )}

        {/* VIEW 1: REGISTRATION FLOW */}
        {isRegistering && (
          otpStep ? (
            /* STEP 2 OF REGISTER: SMS-ONLY OTP VERIFICATION WIDGET */
            <SecureOtpWidget
              identifier={formattedPhone || authPhone}
              purpose="Registration"
              widgetName="SecureOTPWidgetM7DX"
              smsOnly={true}
              allowedChannels={['SMS']}
              initialReqId={activeReqId}
              onVerified={handleRegisterOtpVerified}
              onCancel={() => setOtpStep(false)}
              submitButtonText="Verify & Complete Sign Up"
              isSubmitting={authLoading}
            />
          ) : (
            /* STEP 1 OF REGISTER: FILL DETAILS */
            <form onSubmit={handleRegisterDetailsSubmit} className="space-y-3.5 animate-in slide-in-from-bottom duration-300">
              {/* Name field */}
              <div className="space-y-1">
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
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-green-900 transition-all placeholder-brand-green-300 shadow-sm"
                />
              </div>

              {/* Phone field */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800/80 flex items-center gap-1.5 font-serif">
                  <Phone className="w-3.5 h-3.5 text-brand-gold-600" />
                  <span>Mobile Phone Number (10 Digits)</span>
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  placeholder="e.g., 9425011088"
                  value={authPhone}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setAuthPhone(val);
                  }}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-green-900 transition-all placeholder-brand-green-300 shadow-sm"
                />
              </div>

              {/* Email Address */}
              <div className="space-y-1">
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
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-green-900 transition-all placeholder-brand-green-300 shadow-sm"
                />
              </div>

              {/* Password and Confirm Password fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800/80 flex items-center gap-1.5 font-serif">
                    <Lock className="w-3.5 h-3.5 text-brand-gold-600" />
                    <span>Password</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      minLength={6}
                      placeholder="6+ chars"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full pl-4 pr-9 py-2.5 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-green-900 transition-all placeholder-brand-green-300 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-green-700/60 hover:text-brand-green-900 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
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
                      className="w-full pl-4 pr-9 py-2.5 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-green-900 transition-all placeholder-brand-green-300 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-green-700/60 hover:text-brand-green-900 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Submit Details */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-brand-green-800 hover:bg-brand-green-900 disabled:bg-brand-green-800/45 text-brand-cream-50 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-brand-green-900/10 flex items-center justify-center gap-1.5 cursor-pointer mt-3 border border-brand-gold-500/25 font-serif"
              >
                <span>{authLoading ? "Checking & Requesting OTP..." : "Continue with SMS OTP Verification"}</span>
                <ArrowRight className="w-4 h-4 text-brand-gold-400" />
              </button>
            </form>
          )
        )}

        {/* VIEW 2: LOGIN FLOW */}
        {!isRegistering && (
          loginMode === 'otp' ? (
            /* DIRECT SMS OTP SIGN IN */
            otpLoginStarted ? (
              <div className="space-y-3">
                <SecureOtpWidget
                  identifier={otpLoginIdentifier}
                  purpose="Login"
                  widgetName="SecureOTPWidgetM7DX"
                  smsOnly={false}
                  allowedChannels={['SMS', 'WHATSAPP', 'EMAIL', 'VOICE']}
                  initialReqId={activeReqId}
                  onVerified={handleOtpLoginVerified}
                  onCancel={() => setOtpLoginStarted(false)}
                  submitButtonText="Verify OTP & Sign In"
                  isSubmitting={authLoading}
                />
                <div className="text-center p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 font-medium">
                  ⚡ <span className="font-bold">Sandbox & Instant Passcode:</span> <span className="font-mono font-bold bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-950">1234</span> (or enter SMS code received on your phone)
                </div>
              </div>
            ) : (
              <form onSubmit={handleStartOtpLogin} className="space-y-4 animate-in slide-in-from-bottom duration-300">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800/80 flex items-center gap-1.5 font-serif">
                    <Smartphone className="w-3.5 h-3.5 text-brand-gold-600" />
                    <span>Registered Mobile Phone Number (10 Digits)</span>
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="e.g., 9425011088"
                    value={otpLoginIdentifier}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setOtpLoginIdentifier(val);
                    }}
                    className="w-full px-4 py-2.5 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-green-900 transition-all placeholder-brand-green-300 shadow-sm"
                  />
                  <p className="text-[10px] text-brand-green-700/70">
                    We will send an SMS OTP code to your registered mobile number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-3.5 bg-brand-green-800 hover:bg-brand-green-900 disabled:bg-brand-green-800/45 text-brand-cream-50 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-brand-green-900/10 flex items-center justify-center gap-1.5 cursor-pointer border border-brand-gold-500/25 font-serif"
                >
                  <span>{authLoading ? "Verifying Mobile & Sending..." : "Send SMS Verification OTP"}</span>
                  <ArrowRight className="w-4 h-4 text-brand-gold-400" />
                </button>
              </form>
            )
          ) : (
            /* PASSWORD LOGIN */
            <form onSubmit={handlePasswordLoginSubmit} className="space-y-3.5 animate-in slide-in-from-bottom duration-300">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800/80 flex items-center gap-1.5 font-serif">
                  <Mail className="w-3.5 h-3.5 text-brand-gold-600" />
                  <span>Email Address or Mobile Number</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., vkchoudhary050607@gmail.com or 9425011088"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-green-900 transition-all placeholder-brand-green-300 shadow-sm"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center font-serif">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-brand-green-800/80 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-brand-gold-600" />
                    <span>Password</span>
                  </label>
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
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Enter your password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-2xl bg-white border border-brand-green-200 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-green-900 transition-all placeholder-brand-green-300 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-green-700/60 hover:text-brand-green-900 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3.5 bg-brand-green-800 hover:bg-brand-green-900 disabled:bg-brand-green-800/45 text-brand-cream-50 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-brand-green-900/10 flex items-center justify-center gap-1.5 cursor-pointer mt-2 border border-brand-gold-500/25 font-serif"
              >
                <span>{authLoading ? "Signing In..." : "Sign In"}</span>
                <ArrowRight className="w-4 h-4 text-brand-gold-400" />
              </button>
            </form>
          )
        )}

        {/* Quick Profiles Autofill Panel */}
        {!otpStep && !otpLoginStarted && (
          <div className="bg-brand-cream-100 border border-brand-gold-300/40 p-3.5 rounded-2xl space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold-600 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-green-800/80">Quick Profiles (Autofill)</span>
              </div>
              <span className="text-[9px] text-brand-gold-700 font-extrabold bg-brand-gold-300/20 border border-brand-gold-400/30 px-2 py-0.5 rounded-full">One-Tap</span>
            </div>
            
            {isRegistering ? (
              <div className="grid grid-cols-1 gap-1.5">
                <button
                   type="button"
                   onClick={() => {
                     setAuthName('Vivek Baliyan');
                     setAuthPhone('7451050607');
                     setAuthEmail('iamvivekbaliyan07@gmail.com');
                     setAuthPassword('123123123');
                     setAuthConfirmPassword('123123123');
                     setOtpStep(false);
                     setLoginError('');
                     setLoginSuccess('');
                   }}
                   className="p-2.5 text-left border border-brand-gold-300/30 hover:border-brand-green-800 hover:bg-white rounded-xl bg-white/70 transition-all duration-200 cursor-pointer group shadow-sm flex items-center gap-2.5"
                >
                  <span className="p-1.5 rounded-lg bg-brand-green-50 text-brand-green-800 group-hover:bg-brand-gold-500/10 group-hover:text-brand-gold-700 transition-colors">
                    <UserIcon className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-brand-green-900 group-hover:text-brand-gold-700 transition-colors">Vivek Baliyan</span>
                    <span className="block text-[10px] text-brand-green-700/70 font-mono truncate">iamvivekbaliyan07@gmail.com</span>
                  </div>
                </button>

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
                     setLoginSuccess('');
                   }}
                   className="p-2.5 text-left border border-brand-gold-300/30 hover:border-brand-green-800 hover:bg-white rounded-xl bg-white/70 transition-all duration-200 cursor-pointer group shadow-sm flex items-center gap-2.5"
                >
                  <span className="p-1.5 rounded-lg bg-brand-green-50 text-brand-green-800 group-hover:bg-brand-gold-500/10 group-hover:text-brand-gold-700 transition-colors">
                    <UserIcon className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-brand-green-900 group-hover:text-brand-gold-700 transition-colors">Vipin Choudhary</span>
                    <span className="block text-[10px] text-brand-green-700/70 font-mono truncate">vkchoudhary050607@gmail.com</span>
                  </div>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthEmail('iamvivekbaliyan07@gmail.com');
                    setAuthPassword('123123123');
                    setOtpLoginIdentifier('7451050607');
                    setLoginError('');
                    setLoginSuccess('');
                  }}
                  className="p-2.5 text-left border border-brand-gold-300/50 hover:border-brand-green-800 hover:bg-white rounded-xl bg-white transition-all duration-200 cursor-pointer group shadow-sm flex items-center gap-2.5"
                >
                  <span className="p-1.5 rounded-lg bg-brand-gold-500/10 text-brand-gold-700 group-hover:bg-brand-gold-500/20 transition-colors">
                    <UserIcon className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-brand-green-900 group-hover:text-brand-gold-700 transition-colors">Vivek Baliyan (Admin)</span>
                    <span className="block text-[10px] text-brand-green-700/70 font-mono truncate">iamvivekbaliyan07@gmail.com (7451050607)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAuthEmail('vkchoudhary050607@gmail.com');
                    setAuthPassword('password123');
                    setOtpLoginIdentifier('9425011088');
                    setLoginError('');
                    setLoginSuccess('');
                  }}
                  className="p-2.5 text-left border border-brand-gold-300/30 hover:border-brand-green-800 hover:bg-white rounded-xl bg-white/70 transition-all duration-200 cursor-pointer group shadow-sm flex items-center gap-2.5"
                >
                  <span className="p-1.5 rounded-lg bg-brand-green-50 text-brand-green-800 group-hover:bg-brand-gold-500/10 group-hover:text-brand-gold-700 transition-colors">
                    <UserIcon className="w-3.5 h-3.5" />
                  </span>
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-brand-green-900 group-hover:text-brand-gold-700 transition-colors">Vipin Choudhary</span>
                    <span className="block text-[10px] text-brand-green-700/70 font-mono truncate">vkchoudhary050607@gmail.com (9425011088)</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onSuccessLogin={(token) => {
          localStorage.setItem('grams_auth_token', token);
          localStorage.setItem('token', token);
          window.location.reload();
        }}
      />
    </div>
  );
};
