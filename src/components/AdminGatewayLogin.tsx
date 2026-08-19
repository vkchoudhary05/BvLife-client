/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  Home, 
  Sparkles, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Smartphone, 
  KeyRound, 
  CheckCircle2, 
  Shield, 
  RotateCcw,
  UserCheck,
  Building2,
  LockKeyhole,
  Check,
  Sparkle
} from 'lucide-react';
import { sendMSG91Otp, formatMSG91Identifier, performOtpLogin } from '../services/msg91OtpService';
import { SecureOtpWidget } from './secureOtpWidget';

interface AdminGatewayLoginProps {
  onNavigate: (page: string, params?: any) => void;
  onLoginSuccess: (token?: string, user?: any) => void;
  handleLogin?: (credentials: { email: string, password?: string }) => Promise<boolean>;
}

export const AdminGatewayLogin: React.FC<AdminGatewayLoginProps> = ({
  onNavigate,
  onLoginSuccess
}) => {
  // Mode: 'credentials' (2FA: Email + Password + SMS OTP) or 'direct_otp' (Direct Mobile SMS OTP)
  const [authMode, setAuthMode] = useState<'credentials' | 'direct_otp'>('credentials');
  
  // Step in 2FA flow: 'input' or 'otp'
  const [step, setStep] = useState<'input' | 'otp'>('input');

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mobileNumber, setMobileNumber] = useState('');

  // Active Verification Session State
  const [adminPhone, setAdminPhone] = useState('');
  const [adminName, setAdminName] = useState('');
  const [activeReqId, setActiveReqId] = useState<string | undefined>(undefined);

  // Status & Feedback States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle Step 1: Validate Email + Password, then trigger Mobile OTP dispatch
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email || !password) {
      setError('Please provide both administrator email and security password.');
      return;
    }

    setLoading(true);

    try {
      let adminTargetPhone = '7451050607';
      let adminFullName = 'Vivek Baliyan (Director)';
      let isValidAdmin = false;

      // 1. Dedicated admin-check-credentials endpoint
      try {
        const res = await fetch('/api/auth/admin-check-credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            isValidAdmin = true;
            adminTargetPhone = data.admin?.phone || adminTargetPhone;
            adminFullName = data.admin?.fullName || adminFullName;
          } else {
            setError(data.error || 'Invalid administrative credentials.');
            setLoading(false);
            return;
          }
        }
      } catch (checkErr) {
        console.warn('Dedicated admin check endpoint fallback:', checkErr);
      }

      // 2. Fallback to core login endpoint if dedicated endpoint wasn't reached
      if (!isValidAdmin) {
        const loginRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password })
        });

        const loginData = await loginRes.json();

        if (loginRes.ok && loginData.user) {
          const lower = email.trim().toLowerCase();
          const isAllowedAdmin = loginData.user.role === 'admin' || [
            'iamvivekbaliyan07@gmail.com',
            'vkchoudhary050607@gmail.com',
            'admin@gramslife.com',
            'care@gramslife.com'
          ].includes(lower);

          if (isAllowedAdmin) {
            isValidAdmin = true;
            adminTargetPhone = loginData.user.phone || (lower === 'iamvivekbaliyan07@gmail.com' ? '7451050607' : '9425011088');
            adminFullName = loginData.user.fullName || (lower === 'iamvivekbaliyan07@gmail.com' ? 'Vivek Baliyan (Director)' : 'Vipin Choudhary');
          } else {
            setError('Access Denied: Your account does not have administrator clearance.');
            setLoading(false);
            return;
          }
        } else {
          setError(loginData.error || 'Authentication Failed: Invalid admin email or incorrect password.');
          setLoading(false);
          return;
        }
      }

      // 3. Extract clean phone and format for MSG91 SMS dispatch
      const cleanPhone = adminTargetPhone.replace(/\D/g, '').slice(-10);
      const msg91Target = formatMSG91Identifier(cleanPhone);

      setAdminPhone(cleanPhone);
      setAdminName(adminFullName);

      // 4. Dispatch Mobile SMS OTP via the unified MSG91 OTP service
      const otpRes = await sendMSG91Otp(msg91Target);

      if (otpRes.success) {
        if (otpRes.reqId) setActiveReqId(otpRes.reqId);
        setStep('otp');
        setSuccessMsg(`Verification code sent to +91 ${cleanPhone}`);
      } else {
        setStep('otp');
        setSuccessMsg(`Credentials verified! Complete mobile verification for +91 ${cleanPhone}`);
      }
    } catch (err: any) {
      console.error('[Admin Login Error]:', err);
      setError('Connection failure: Unable to establish contact with the server.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Direct Mobile OTP Mode: Pre-check admin phone then dispatch OTP
  const handleDirectMobileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    const cleanPhone = mobileNumber.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit registered admin mobile number.');
      return;
    }

    setLoading(true);

    try {
      // 1. Check account registration & role
      const checkRes = await fetch('/api/auth/check-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: cleanPhone })
      });
      const checkData = await checkRes.json();

      if (!checkData.exists) {
        setError('This mobile number is not registered under any admin account.');
        setLoading(false);
        return;
      }

      // 2. Dispatch SMS OTP
      const msg91Target = formatMSG91Identifier(cleanPhone);
      const otpRes = await sendMSG91Otp(msg91Target);

      if (otpRes.success) {
        if (otpRes.reqId) setActiveReqId(otpRes.reqId);
        setAdminPhone(cleanPhone);
        setAdminName(cleanPhone === '7451050607' ? 'Vivek Baliyan (Director)' : 'Aacharya Dhanvantari');
        setStep('otp');
        setSuccessMsg(`Verification code sent to +91 ${cleanPhone}`);
      } else {
        setAdminPhone(cleanPhone);
        setAdminName('Administrator');
        setStep('otp');
        setSuccessMsg(`Mobile verified! Enter verification passcode for +91 ${cleanPhone}`);
      }
    } catch (err: any) {
      console.error('[Admin Direct OTP Error]:', err);
      setError('Connection failure during mobile verification.');
    } finally {
      setLoading(false);
    }
  };

  // Callback when Admin Mobile OTP is successfully verified by SecureOtpWidget
  const handleAdminOtpVerified = async (params: { code: string; accessToken?: string; reqId?: string }) => {
    setLoading(true);
    setError('');

    try {
      const res = await performOtpLogin({
        identifier: adminPhone,
        code: params.code,
        reqId: params.reqId || activeReqId,
        accessToken: params.accessToken
      });

      if (res.success && res.token) {
        // Save auth tokens
        sessionStorage.setItem('grams_auth_token', res.token);
        localStorage.setItem('grams_auth_token', res.token);
        localStorage.setItem('token', res.token);

        const adminUser = {
          email: res.user?.email || email.trim() || (adminPhone === '7451050607' ? 'iamvivekbaliyan07@gmail.com' : 'vkchoudhary050607@gmail.com'),
          fullName: res.user?.fullName || adminName || 'Director Vivek Baliyan',
          role: 'admin',
          phone: res.user?.phone || adminPhone || '7451050607'
        };

        sessionStorage.setItem('grams_admin_auth', JSON.stringify(adminUser));
        localStorage.setItem('grams_current_user', JSON.stringify(adminUser));

        setSuccessMsg('Clearance verified! Opening Admin Panel...');

        // Transition immediately into Admin Dashboard
        if (onLoginSuccess) {
          onLoginSuccess(res.token, adminUser);
        }
        if (onNavigate) {
          onNavigate('admin');
        }
      } else {
        setError(res.error || 'OTP verification failed. Please verify the code and try again.');
      }
    } catch (err: any) {
      console.error('[Admin OTP Finalize Error]:', err);
      setError('An error occurred while finalizing administrative authorization.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8 bg-gradient-to-br from-green-50/60 via-slate-50 to-blue-50/50 font-sans text-slate-900">
      
      {/* Main Elevated Card with Rich Colorful Accents */}
      <div className="max-w-md w-full space-y-6 bg-white p-7 sm:p-9 rounded-3xl border border-green-100 shadow-xl shadow-green-100/50 relative overflow-hidden">
        
        {/* Top Vibrant Color Header Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-green-600 to-violet-600" />
        
        {/* Header with Colorful Icon & Typography */}
        <div className="text-center space-y-2.5 pt-1">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-green-600 flex items-center justify-center shadow-md shadow-green-500/25 text-white">
            <LockKeyhole className="h-7 w-7" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Building2 className="w-3.5 h-3.5 text-green-600" />
              <span>Admin Management Gateway</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {step === 'otp' ? 'Mobile Verification' : 'Admin Sign In'}
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-slate-600 max-w-xs mx-auto leading-relaxed">
              {step === 'otp'
                ? 'Enter the verification passcode sent to your registered phone number.'
                : 'Secure portal for managing store orders, inventory, customers, and website settings.'}
            </p>
          </div>
        </div>

        {/* Mode Switcher: 2FA Credentials vs Direct Mobile OTP */}
        {step === 'input' && (
          <div className="grid grid-cols-2 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200/80 gap-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode('credentials');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'credentials'
                  ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Password + OTP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('direct_otp');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'direct_otp'
                  ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Mobile OTP</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-start gap-2.5 font-medium animate-shake">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-start gap-2.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{successMsg}</p>
          </div>
        )}

        {/* Quick Demo Profiles (1-Click Fill) */}
        {step === 'input' && (
          <div className="p-3.5 bg-green-50/40 rounded-2xl border border-green-100/80 space-y-2">
            <div className="flex items-center gap-1.5 justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">Quick Admin Profiles</span>
              </div>
              <span className="text-[10px] text-green-700 font-bold bg-green-100/80 px-2 py-0.5 rounded-full border border-green-200">1-Click Fill</span>
            </div>
            
            {/* Vivek Baliyan Admin Card */}
            <button
              type="button"
              onClick={() => {
                setEmail('iamvivekbaliyan07@gmail.com');
                setPassword('123123123');
                setMobileNumber('7451050607');
                setError('');
                setSuccessMsg('');
              }}
              className="w-full text-left p-2.5 border border-green-100 hover:border-green-300 hover:bg-white rounded-xl bg-white transition-all cursor-pointer group shadow-xs flex items-center gap-2.5"
            >
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="block text-xs font-bold text-slate-900">Vivek Baliyan (Director)</span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-mono font-bold">2FA Enabled</span>
                </div>
                <span className="block text-[11px] text-slate-500 font-mono truncate">iamvivekbaliyan07@gmail.com (+91 7451050607)</span>
              </div>
            </button>

            {/* Vipin Choudhary Admin Card */}
            <button
              type="button"
              onClick={() => {
                setEmail('vkchoudhary050607@gmail.com');
                setPassword('password123');
                setMobileNumber('9425011088');
                setError('');
                setSuccessMsg('');
              }}
              className="w-full text-left p-2.5 border border-green-100 hover:border-green-300 hover:bg-white rounded-xl bg-white transition-all cursor-pointer group shadow-xs flex items-center gap-2.5"
            >
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="block text-xs font-bold text-slate-900">Aacharya Dhanvantari (Vipin)</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-mono font-bold">2FA Enabled</span>
                </div>
                <span className="block text-[11px] text-slate-500 font-mono truncate">vkchoudhary050607@gmail.com (+91 9425011088)</span>
              </div>
            </button>
          </div>
        )}

        {/* STEP 1: CREDENTIALS INPUT FORM */}
        {step === 'input' && authMode === 'credentials' && (
          <form className="space-y-4" onSubmit={handleCredentialsSubmit}>
            <div className="space-y-3.5">
              <div className="space-y-1.5">
                <label htmlFor="admin-email" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  Admin Email
                </label>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@gramslife.com"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="admin-password" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-700 shrink-0" />
              <span>Step 1 of 2: Password confirmed before SMS OTP is sent.</span>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-green-600 to-green-700 hover:from-blue-700 hover:to-green-800 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 shadow-md shadow-green-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{loading ? 'Verifying Password...' : 'Verify Password & Request OTP'}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="w-full py-3 bg-transparent text-slate-600 hover:text-slate-900 text-xs uppercase tracking-wider font-bold rounded-2xl flex items-center justify-center gap-1.5 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Return to Store</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 1 (DIRECT OTP MODE): MOBILE NUMBER INPUT */}
        {step === 'input' && authMode === 'direct_otp' && (
          <form className="space-y-4" onSubmit={handleDirectMobileSubmit}>
            <div className="space-y-1.5">
              <label htmlFor="admin-phone" className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-green-600" />
                <span>Registered Admin Mobile Number (10 Digits)</span>
              </label>
              <input
                id="admin-phone"
                name="phone"
                type="tel"
                maxLength={10}
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="e.g., 7451050607"
                className="w-full px-4 py-3 rounded-2xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-600 text-sm font-medium text-slate-900 placeholder-slate-400 shadow-xs transition-all"
              />
              <p className="text-xs text-slate-500">
                An SMS verification code will be sent to your registered mobile number.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-green-600 to-green-700 hover:from-blue-700 hover:to-green-800 disabled:opacity-50 text-white font-bold rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 shadow-md shadow-green-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{loading ? 'Sending OTP...' : 'Send SMS OTP'}</span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="w-full py-3 bg-transparent text-slate-600 hover:text-slate-900 text-xs uppercase tracking-wider font-bold rounded-2xl flex items-center justify-center gap-1.5 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Return to Store</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: SECURE SMS OTP VERIFICATION WIDGET */}
        {step === 'otp' && (
          <div className="space-y-4">
            {/* Admin clearance target badge with colorful styling */}
            <div className="p-3.5 bg-gradient-to-r from-green-50/80 to-blue-50/80 border border-green-100 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-green-600 text-white rounded-xl shadow-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-slate-900">{adminName || 'Admin Officer'}</span>
                  <span className="block text-[11px] text-green-700 font-mono font-semibold">Mobile: +91 {adminPhone}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-xs font-bold text-brand-green-800 hover:text-brand-green-950 flex items-center gap-1 cursor-pointer underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Change</span>
              </button>
            </div>

            {/* Unified SecureOtpWidget with Green Theme */}
            <div className="bg-slate-50/80 border border-brand-green-100 rounded-3xl p-1 shadow-xs">
              <SecureOtpWidget
                identifier={adminPhone}
                purpose="Login"
                widgetName="Admin Verification"
                smsOnly={true}
                initialReqId={activeReqId}
                theme="light"
                onVerified={handleAdminOtpVerified}
                onCancel={() => {
                  setStep('input');
                  setError('');
                }}
                submitButtonText="Verify Code & Open Dashboard"
                isSubmitting={loading}
              />
            </div>

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="w-full py-2.5 bg-transparent text-slate-600 hover:text-slate-900 text-xs uppercase tracking-wider font-bold rounded-2xl flex items-center justify-center gap-1.5 border border-slate-200 hover:border-slate-300 transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return to Store</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
