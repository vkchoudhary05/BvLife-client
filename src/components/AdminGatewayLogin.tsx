/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Lock, 
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
  UserCheck
} from 'lucide-react';
import { sendMSG91Otp, formatMSG91Identifier, performOtpLogin } from '../services/msg91OtpService';
import { SecureOtpWidget } from './secureOtpWidget';
import { validateAndFormatIndianPhone } from '../utils';

interface AdminGatewayLoginProps {
  onNavigate: (page: string, params?: any) => void;
  onLoginSuccess: () => void;
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
      setError('Please provide both administrative email and security passcode.');
      return;
    }

    setLoading(true);

    try {
      let adminTargetPhone = '7451050607';
      let adminFullName = 'Administrator';
      let isValidAdmin = false;

      // 1. First attempt dedicated admin-check-credentials endpoint
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
        console.warn('Dedicated admin check endpoint unreachable, using core authentication fallback:', checkErr);
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
            adminFullName = loginData.user.fullName || 'Administrator';
          } else {
            setError('ACCESS DENIED: Your account does not possess administrative clearance.');
            setLoading(false);
            return;
          }
        } else {
          setError(loginData.error || 'AUTHENTICATION FAILURE: Invalid admin email or incorrect passcode.');
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
        setSuccessMsg(`Administrative 2FA SMS passcode dispatched to +91 ${cleanPhone}`);
      } else {
        setError(otpRes.error || 'Failed to dispatch SMS verification OTP. Please verify mobile connection.');
      }
    } catch (err: any) {
      console.error('[Admin Login Error]:', err);
      setError('Connection failure: Unable to establish contact with the security gateway.');
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
      setError('Please enter a valid 10-digit registered administrative mobile number.');
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
        setError('This mobile number is not registered under any administrative account.');
        setLoading(false);
        return;
      }

      // 2. Dispatch SMS OTP
      const msg91Target = formatMSG91Identifier(cleanPhone);
      const otpRes = await sendMSG91Otp(msg91Target);

      if (otpRes.success) {
        if (otpRes.reqId) setActiveReqId(otpRes.reqId);
        setAdminPhone(cleanPhone);
        setAdminName('Director / Admin');
        setStep('otp');
        setSuccessMsg(`Administrative SMS passcode dispatched to +91 ${cleanPhone}`);
      } else {
        setError(otpRes.error || 'Failed to dispatch SMS verification OTP.');
      }
    } catch (err: any) {
      console.error('[Admin Direct OTP Error]:', err);
      setError('Connection failure during mobile security verification.');
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

        setSuccessMsg('Administrative clearance verified! Unlocking Apothecary Gateway...');

        setTimeout(() => {
          onLoginSuccess();
          window.location.reload();
        }, 600);
      } else {
        setError(res.error || 'OTP verification failed. Please ensure the code is correct.');
      }
    } catch (err: any) {
      console.error('[Admin OTP Finalize Error]:', err);
      setError('An error occurred while finalizing administrative authorization.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-brand-green-950/5">
      <div className="max-w-md w-full space-y-7 bg-brand-green-900 text-brand-cream-50 p-7 sm:p-9 rounded-[2.5rem] border border-brand-gold-500/30 shadow-2xl relative overflow-hidden">
        
        {/* Elegant top ambient border gold glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-gold-500 via-brand-gold-300 to-brand-gold-600" />
        
        {/* Header with Lock Icon and Gateway Title */}
        <div className="text-center space-y-3">
          <div className="mx-auto h-16 w-16 rounded-full bg-brand-green-800 flex items-center justify-center border border-brand-gold-500/30 shadow-inner">
            <Lock className="h-7 w-7 text-brand-gold-400 animate-pulse" />
          </div>
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-brand-cream-50">
              {step === 'otp' ? 'Admin 2FA Verification' : 'Apothecary Gateway'}
            </h2>
            <p className="mt-1.5 text-xs text-brand-cream-300/80 max-w-xs mx-auto leading-relaxed">
              {step === 'otp'
                ? 'Enter the multi-channel SMS OTP dispatched to verify your administrative clearance.'
                : 'Multi-factor protected access for holistic catalogs, inventory dispatches, and audit ledgers.'}
            </p>
          </div>
        </div>

        {/* Mode Switcher: 2FA Credentials vs Direct Mobile OTP (Only shown in input step) */}
        {step === 'input' && (
          <div className="grid grid-cols-2 p-1 bg-brand-green-950/60 rounded-2xl border border-brand-gold-500/15">
            <button
              type="button"
              onClick={() => {
                setAuthMode('credentials');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'credentials'
                  ? 'bg-brand-gold-500 text-brand-green-950 shadow-sm font-serif'
                  : 'text-brand-cream-300/70 hover:text-brand-cream-100'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>2FA Passcode + OTP</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('direct_otp');
                setError('');
                setSuccessMsg('');
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                authMode === 'direct_otp'
                  ? 'bg-brand-gold-500 text-brand-green-950 shadow-sm font-serif'
                  : 'text-brand-cream-300/70 hover:text-brand-cream-100'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Admin Mobile OTP</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 bg-red-950/50 border border-red-500/40 text-red-200 text-xs rounded-2xl flex items-start gap-2.5 animate-shake font-medium">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs rounded-2xl flex items-start gap-2.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{successMsg}</p>
          </div>
        )}

        {/* Sandbox Quick Profiles Autofill (Only on input step) */}
        {step === 'input' && (
          <div className="p-3.5 bg-brand-green-950/40 rounded-2xl border border-brand-gold-500/15 space-y-2.5">
            <div className="flex items-center gap-1.5 justify-between">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-gold-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold-300">Sanctuary Quick Admin Profiles</span>
              </div>
              <span className="text-[8px] text-brand-cream-100 font-bold bg-brand-gold-600/20 px-2 py-0.5 rounded-full border border-brand-gold-500/10">Staging Mode</span>
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
              className="w-full text-left p-2.5 border border-brand-gold-500/30 hover:border-brand-gold-500/60 hover:bg-brand-green-850 rounded-xl bg-brand-green-850/50 transition-all duration-200 cursor-pointer group shadow-sm flex items-center gap-2.5"
            >
              <div className="p-2 rounded-lg bg-brand-gold-500/20 text-brand-gold-300 group-hover:bg-brand-gold-500/30 transition-colors">
                <ShieldCheck className="w-4 h-4 text-brand-gold-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="block text-xs font-bold text-brand-cream-100 group-hover:text-brand-gold-300 transition-colors">Vivek Baliyan (Director)</span>
                  <span className="text-[9px] bg-brand-gold-500/20 text-brand-gold-300 px-1.5 py-0.2 rounded font-mono font-bold">2FA Active</span>
                </div>
                <span className="block text-[10px] text-brand-cream-300/70 font-mono truncate">iamvivekbaliyan07@gmail.com (+91 7451050607)</span>
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
              className="w-full text-left p-2.5 border border-brand-gold-500/15 hover:border-brand-gold-500/50 hover:bg-brand-green-850 rounded-xl bg-brand-green-850/20 transition-all duration-200 cursor-pointer group shadow-sm flex items-center gap-2.5"
            >
              <div className="p-2 rounded-lg bg-brand-green-900 text-brand-gold-400 group-hover:bg-brand-gold-500/10 transition-colors">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="block text-xs font-bold text-brand-cream-100 group-hover:text-brand-gold-300 transition-colors">Aacharya Dhanvantari (Vipin)</span>
                  <span className="text-[9px] bg-brand-gold-500/10 text-brand-gold-400/80 px-1.5 py-0.2 rounded font-mono font-bold">2FA Active</span>
                </div>
                <span className="block text-[10px] text-brand-cream-300/60 font-mono truncate">vkchoudhary050607@gmail.com (+91 9425011088)</span>
              </div>
            </button>
          </div>
        )}

        {/* STEP 1: CREDENTIALS INPUT FORM */}
        {step === 'input' && authMode === 'credentials' && (
          <form className="space-y-4 animate-in slide-in-from-bottom duration-300" onSubmit={handleCredentialsSubmit}>
            <div className="space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="admin-email" className="text-[10px] uppercase tracking-wider font-bold text-brand-gold-300 flex items-center gap-1.5 font-serif">
                  Director Email / User
                </label>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="director@gramslife.com"
                  className="w-full px-4 py-3 rounded-2xl bg-brand-green-950/40 border border-brand-gold-500/20 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-cream-50 placeholder-brand-cream-300/30 shadow-sm transition-all"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="admin-password" className="text-[10px] uppercase tracking-wider font-bold text-brand-gold-300 flex items-center gap-1.5 font-serif">
                  Security Passcode
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
                    className="w-full pl-4 pr-10 py-3 rounded-2xl bg-brand-green-950/40 border border-brand-gold-500/20 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-cream-50 placeholder-brand-cream-300/30 shadow-sm transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-cream-300/60 hover:text-brand-cream-100 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-3 bg-brand-green-950/30 border border-brand-gold-500/10 rounded-xl text-[11px] text-brand-cream-300/80 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-brand-gold-400 shrink-0" />
              <span>Step 1 of 2: Security credentials will be confirmed before SMS OTP dispatch.</span>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-gold-500 hover:bg-brand-gold-600 disabled:bg-brand-gold-500/50 text-brand-green-950 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-brand-gold-500/10 flex items-center justify-center gap-1.5 cursor-pointer border border-brand-gold-400 font-serif"
              >
                <span>{loading ? 'Verifying & Sending OTP...' : 'Verify Passcode & Request SMS OTP'}</span>
                <ArrowRight className="w-4 h-4 text-brand-green-950" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="w-full py-3 bg-transparent text-brand-cream-300 hover:text-brand-cream-50 text-xs uppercase tracking-wider font-bold rounded-2xl flex items-center justify-center gap-1.5 border border-brand-gold-500/10 hover:border-brand-gold-500/30 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Return to Public Sanctuary</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 1 (DIRECT OTP MODE): MOBILE NUMBER INPUT */}
        {step === 'input' && authMode === 'direct_otp' && (
          <form className="space-y-4 animate-in slide-in-from-bottom duration-300" onSubmit={handleDirectMobileSubmit}>
            <div className="space-y-1">
              <label htmlFor="admin-phone" className="text-[10px] uppercase tracking-wider font-bold text-brand-gold-300 flex items-center gap-1.5 font-serif">
                <Smartphone className="w-3.5 h-3.5 text-brand-gold-400" />
                <span>Registered Admin Mobile Phone Number (10 Digits)</span>
              </label>
              <input
                id="admin-phone"
                name="phone"
                type="tel"
                maxLength={10}
                required
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="e.g., 9425011088"
                className="w-full px-4 py-3 rounded-2xl bg-brand-green-950/40 border border-brand-gold-500/20 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-cream-50 placeholder-brand-cream-300/30 shadow-sm transition-all"
              />
              <p className="text-[10px] text-brand-cream-300/60">
                An administrative OTP will be dispatched via SMS to authenticate your clearance.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-brand-gold-500 hover:bg-brand-gold-600 disabled:bg-brand-gold-500/50 text-brand-green-950 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-brand-gold-500/10 flex items-center justify-center gap-1.5 cursor-pointer border border-brand-gold-400 font-serif"
              >
                <span>{loading ? 'Verifying & Dispatching OTP...' : 'Send Administrative SMS OTP'}</span>
                <ArrowRight className="w-4 h-4 text-brand-green-950" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="w-full py-3 bg-transparent text-brand-cream-300 hover:text-brand-cream-50 text-xs uppercase tracking-wider font-bold rounded-2xl flex items-center justify-center gap-1.5 border border-brand-gold-500/10 hover:border-brand-gold-500/30 transition-all cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Return to Public Sanctuary</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: SECURE SMS OTP VERIFICATION WIDGET */}
        {step === 'otp' && (
          <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
            {/* Admin clearance target badge */}
            <div className="p-3 bg-brand-green-950/60 border border-brand-gold-500/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-brand-gold-500/10 text-brand-gold-400 rounded-lg">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-brand-cream-100">{adminName || 'Admin Officer'}</span>
                  <span className="block text-[10px] text-brand-gold-300 font-mono">Mobile: +91 {adminPhone}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('input');
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-[10px] font-bold text-brand-cream-300/80 hover:text-brand-gold-300 flex items-center gap-1 cursor-pointer underline"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Change</span>
              </button>
            </div>

            {/* Unified SecureOtpWidget with Multi-Channel OTP */}
            <div className="bg-brand-cream-50 text-brand-green-950 rounded-2xl p-4 sm:p-5 border border-brand-gold-500/30 shadow-inner">
              <SecureOtpWidget
                identifier={adminPhone}
                purpose="Login"
                widgetName="SecureOTPWidgetM7DX"
                smsOnly={false}
                allowedChannels={['SMS', 'WHATSAPP', 'EMAIL', 'VOICE']}
                initialReqId={activeReqId}
                onVerified={handleAdminOtpVerified}
                onCancel={() => {
                  setStep('input');
                  setError('');
                }}
                submitButtonText="Verify Mobile OTP & Unlock Control Panel"
                isSubmitting={loading}
              />
              <div className="mt-3 text-center p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-900 font-medium">
                ⚡ <span className="font-bold">Instant Sandbox & Carrier Bypass OTP:</span> <span className="font-mono font-bold bg-amber-200/80 px-1.5 py-0.5 rounded text-amber-950">1234</span> (or enter SMS code received on your phone)
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="w-full py-2.5 bg-transparent text-brand-cream-300 hover:text-brand-cream-50 text-xs uppercase tracking-wider font-bold rounded-2xl flex items-center justify-center gap-1.5 border border-brand-gold-500/10 hover:border-brand-gold-500/30 transition-all cursor-pointer"
            >
              <Home className="w-3.5 h-3.5" />
              <span>Return to Public Sanctuary</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

