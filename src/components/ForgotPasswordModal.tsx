import React, { useState } from 'react';
import { ShieldCheck, Mail, Lock, ArrowRight, Eye, EyeOff, CheckCircle2, ShieldAlert, X } from 'lucide-react';
import { SecureOtpWidget } from './secureOtpWidget';
import { sendMSG91Otp } from '../services/msg91OtpService';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: (token: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin
}) => {
  const [step, setStep] = useState<'request' | 'otp' | 'new_password' | 'done'>('request');
  const [accountQuery, setAccountQuery] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifiedOtpCode, setVerifiedOtpCode] = useState('');
  const [verifiedReqId, setVerifiedReqId] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!accountQuery.trim()) {
      setErrorMsg('Please enter your registered email address or mobile number.');
      return;
    }

    setLoading(true);
    try {
      // 1. Check if account exists
      const checkRes = await fetch('/api/auth/check-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: accountQuery.trim() })
      });
      const checkData = await checkRes.json();

      if (!checkData.exists) {
        setErrorMsg('No registered account found with this email or mobile number. Please check or create an account.');
        setLoading(false);
        return;
      }

      setUserEmail(checkData.email);
      setUserPhone(checkData.phone || accountQuery.trim());

      // 2. Dispatch OTP via multi-channel service
      const targetToUse = checkData.phone || checkData.email || accountQuery.trim();
      const sendRes = await sendMSG91Otp(targetToUse);

      if (sendRes.success) {
        setStep('otp');
        setSuccessMsg(`Verification code dispatched to ${targetToUse}.`);
      } else {
        setErrorMsg(sendRes.error || 'Failed to dispatch verification code. Please try again.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to initiate password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = async (params: { code: string; accessToken?: string; reqId?: string }) => {
    setVerifiedOtpCode(params.code);
    if (params.reqId) setVerifiedReqId(params.reqId);
    setStep('new_password');
    setSuccessMsg('Passcode verified! Please enter your new secure password.');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query: userEmail || accountQuery, 
          newPassword,
          code: verifiedOtpCode,
          reqId: verifiedReqId
        })
      });
      const data = await res.json();

      if (res.ok) {
        setStep('done');
        setSuccessMsg(data.message || 'Password successfully updated!');
        if (data.token && onSuccessLogin) {
          setTimeout(() => {
            onSuccessLogin(data.token);
            onClose();
          }, 1500);
        }
      } else {
        setErrorMsg(data.error || 'Failed to update password.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error connecting to authentication servers.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-green-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300 text-left">
      <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-brand-green-100 relative animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-brand-green-900 text-brand-cream-50 p-6 relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-gold-500 via-brand-gold-300 to-brand-gold-600" />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-brand-cream-300 hover:text-white bg-brand-green-800/80 hover:bg-brand-green-800 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-green-800 rounded-2xl border border-brand-gold-500/20 shadow-inner">
              <ShieldCheck className="w-6 h-6 text-brand-gold-400" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-brand-cream-50">Account Password Reset</h3>
              <p className="text-[10px] text-brand-cream-300/80 font-mono">SecureOTPWidgetM7DX Verification</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-shake font-medium">
              <ShieldAlert className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{successMsg}</p>
            </div>
          )}

          {step === 'request' && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider block">Registered Email or Mobile Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="name@example.com or 9425011088"
                    value={accountQuery}
                    onChange={(e) => setAccountQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-brand-green-200 text-xs font-medium text-brand-green-950 focus:outline-none focus:border-brand-green-700 bg-white"
                  />
                  <Mail className="w-4 h-4 text-brand-green-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                </div>
                <p className="text-[10px] text-brand-green-600/70">Enter the email address or 10-digit mobile number linked to your profile.</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-green-800 hover:bg-brand-green-900 disabled:opacity-50 text-brand-cream-50 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{loading ? 'Searching Profile...' : 'Send Verification OTP'}</span>
                <ArrowRight className="w-4 h-4 text-brand-gold-400" />
              </button>
            </form>
          )}

          {step === 'otp' && (
            <SecureOtpWidget
              identifier={userPhone || userEmail || accountQuery}
              purpose="Password Reset"
              widgetName="Verification"
              onVerified={handleOtpVerified}
              onCancel={() => setStep('request')}
              submitButtonText="Verify Code & Proceed"
            />
          )}

          {step === 'new_password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider block">New Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-brand-green-200 text-xs font-medium text-brand-green-950 focus:outline-none focus:border-brand-green-700 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-green-700 p-0.5 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-brand-green-800 uppercase tracking-wider block">Confirm New Password</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-brand-green-200 text-xs font-medium text-brand-green-950 focus:outline-none focus:border-brand-green-700 bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-brand-green-800 hover:bg-brand-green-900 disabled:opacity-50 text-brand-cream-50 font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>{loading ? 'Updating Password...' : 'Save New Password & Sign In'}</span>
                <CheckCircle2 className="w-4 h-4 text-brand-gold-400" />
              </button>
            </form>
          )}

          {step === 'done' && (
            <div className="text-center py-4 space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center border border-emerald-300">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="text-xs font-bold text-brand-green-900">Your password has been successfully updated.</p>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 bg-brand-green-800 text-brand-cream-50 font-bold rounded-xl text-xs uppercase cursor-pointer"
              >
                Close & Return
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

