/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  ShieldCheck, 
  MessageSquare, 
  PhoneCall, 
  Mail, 
  Smartphone, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Lock
} from 'lucide-react';
import { 
  sendMSG91Otp, 
  retryMSG91Otp, 
  verifyMSG91Otp, 
  formatMSG91Identifier, 
  DEFAULT_MSG91_CONFIG 
} from '../services/msg91OtpService';

export type OTPChannel = 'SMS' | 'WHATSAPP' | 'EMAIL' | 'VOICE';

interface SecureOtpWidgetProps {
  identifier: string; // Phone number (+91...) or Email
  purpose?: 'Registration' | 'Login' | 'ForgotPassword' | 'MobileChange' | 'EmailChange' | 'Checkout';
  otpLength?: number; // 4 or 6 digits
  resendCountdown?: number; // default 30s
  widgetName?: string; // e.g. "SecureOTPWidgetM7DX"
  allowedChannels?: OTPChannel[];
  smsOnly?: boolean;
  initialReqId?: string;
  onVerified: (params: { code: string; accessToken?: string; reqId?: string; identifier: string }) => void | Promise<void>;
  onCancel?: () => void;
  autoFocus?: boolean;
  className?: string;
  submitButtonText?: string;
  isSubmitting?: boolean;
}

export const SecureOtpWidget: React.FC<SecureOtpWidgetProps> = ({
  identifier,
  purpose = 'Login',
  otpLength = 4,
  resendCountdown = 30,
  widgetName = 'SecureOTPWidgetM7DX',
  allowedChannels,
  smsOnly = true,
  initialReqId,
  onVerified,
  onCancel,
  autoFocus = true,
  className = '',
  submitButtonText = 'Verify & Proceed',
  isSubmitting = false
}) => {
  const [otpCode, setOtpCode] = useState<string>('');
  const [activeChannel, setActiveChannel] = useState<OTPChannel>('SMS');
  const [timer, setTimer] = useState<number>(resendCountdown);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [reqId, setReqId] = useState<string>(initialReqId || '');
  const inputRef = useRef<HTMLInputElement>(null);

  const isEmailTarget = identifier.includes('@');
  const isSmsRestricted = smsOnly || (allowedChannels && allowedChannels.length === 1 && allowedChannels[0] === 'SMS');

  useEffect(() => {
    if (initialReqId) {
      setReqId(initialReqId);
    }
  }, [initialReqId]);

  // Countdown timer for resend
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  // Focus input automatically
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Channel mapping for MSG91 Headless API
  const getChannelCode = (channel: OTPChannel): '11' | '12' | '3' | '4' | null => {
    switch (channel) {
      case 'SMS': return '11';
      case 'WHATSAPP': return '12';
      case 'EMAIL': return '3';
      case 'VOICE': return '4';
      default: return null;
    }
  };

  const handleChannelResend = async (channel: OTPChannel) => {
    if (timer > 0 || loading || isSubmitting) return;

    setActiveChannel(channel);
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const channelCode = getChannelCode(channel);
      const res = await retryMSG91Otp(channelCode, reqId, identifier);
      
      if (res.success) {
        setTimer(resendCountdown);
        setSuccessMsg(`New OTP passcode dispatched via ${channel}.`);
        if (res.reqId) setReqId(res.reqId);
      } else {
        // Fallback to sendMSG91Otp or server side
        const sendRes = await sendMSG91Otp(identifier);
        if (sendRes.success) {
          setTimer(resendCountdown);
          setSuccessMsg(`New OTP passcode sent via ${channel}.`);
          if (sendRes.reqId) setReqId(sendRes.reqId);
        } else {
          setErrorMsg(res.error || sendRes.error || `Failed to dispatch OTP via ${channel}.`);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection error while requesting OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      setErrorMsg(`Please enter the complete ${otpLength}-digit verification passcode.`);
      return;
    }

    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    try {
      const cleanCode = otpCode.trim();
      // Try MSG91 headless verification + Server validation fallback
      const verifyRes = await verifyMSG91Otp(cleanCode, reqId, identifier);

      if (!verifyRes.success) {
        setErrorMsg(verifyRes.error || 'The entered OTP code is incorrect or expired. Please check your SMS for the latest code or click Resend.');
        setLoading(false);
        return;
      }

      // Trigger verification callback with verified code and access token
      await onVerified({
        code: cleanCode,
        accessToken: verifyRes.accessToken,
        reqId: reqId || verifyRes.reqId,
        identifier
      });
    } catch (err: any) {
      console.error('[SecureOtpWidget] Verification error:', err);
      setErrorMsg(err.message || 'OTP verification failed. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formattedDisplayTarget = isEmailTarget
    ? identifier
    : (identifier.startsWith('+') ? identifier : `+${formatMSG91Identifier(identifier)}`);

  return (
    <div className={`bg-brand-cream-50/80 border border-brand-gold-400/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5 relative overflow-hidden ${className}`}>
      
      {/* Top Header Badge */}
      <div className="flex items-center justify-between border-b border-brand-gold-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-green-900 text-brand-gold-400 flex items-center justify-center border border-brand-gold-500/30 shadow-inner">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-serif font-bold text-brand-green-950 tracking-wide">
                Secure Verification
              </h4>
              {/* <span className="text-[9px] bg-brand-green-800/10 text-brand-green-900 font-mono font-bold px-1.5 py-0.5 rounded border border-brand-green-800/20">
                {widgetName}
              </span> */}
            </div>
            {/* <p className="text-[11px] text-brand-green-800/70 font-medium">
              Multi-Channel Authentication Gateway
            </p> */}
          </div>
        </div>

        {/* <div className="flex items-center gap-1 text-[10px] text-emerald-800 bg-emerald-100/90 font-bold px-2.5 py-1 rounded-full border border-emerald-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>Live Gateway</span>
        </div> */}
      </div>
      {/* Target Info */}
      <div className="bg-brand-cream-100/70 p-3.5 rounded-2xl border border-brand-gold-500/20 text-center space-y-1">
        <p className="text-xs text-brand-green-800/80">
          Passcode sent for <span className="font-semibold text-brand-green-950">{purpose}</span> to:
        </p>
        <p className="font-mono text-sm font-bold text-brand-green-950 tracking-wide">
          {formattedDisplayTarget}
        </p>
      </div>

      {/* Feedback Banners */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 font-medium animate-shake">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main OTP Input Form */}
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[11px] uppercase tracking-wider font-bold text-brand-green-900 flex items-center justify-between font-serif">
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-brand-gold-600" />
              <span>Enter {otpLength}-Digit Code</span>
            </span>
            <span className="text-[10px] text-brand-green-700 font-sans lowercase font-normal">
              expires in 5 min
            </span>
          </label>

          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otpCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setOtpCode(val);
                if (val.length === otpLength || val.length === 6) {
                  setErrorMsg('');
                }
              }}
              placeholder="• • • •"
              className="w-full text-center py-3 px-4 rounded-2xl bg-white border-2 border-brand-green-200 focus:border-brand-gold-500 focus:ring-4 focus:ring-brand-gold-500/20 text-2xl tracking-[0.4em] font-mono font-bold text-brand-green-950 placeholder-brand-green-200 shadow-sm transition-all"
            />
          </div>
        </div>

        {/* Resend & Channel Selector */}
        <div className="space-y-2 pt-1 border-t border-brand-green-100">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] text-brand-green-800/80 font-medium flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-brand-green-700" />
              <span>{isSmsRestricted ? "SMS Verification" : "Didn't receive code?"}</span>
            </span>
            <button
              type="button"
              onClick={() => handleChannelResend('SMS')}
              disabled={timer > 0 || loading || isSubmitting}
              className={`text-[11px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                timer > 0 || loading || isSubmitting
                  ? 'text-brand-green-600/50 cursor-not-allowed opacity-70'
                  : 'text-brand-gold-700 hover:text-brand-gold-800 underline'
              }`}
            >
              <RotateCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              <span>{timer > 0 ? `Resend SMS in ${timer}s` : 'Resend SMS OTP'}</span>
            </button>
          </div>

          {/* If NOT restricted to SMS only, render the 4 multi-channel pills (SMS, WhatsApp, Email, Voice) */}
          {!isSmsRestricted && (
            <div className="grid grid-cols-4 gap-1.5 p-1.5 bg-brand-cream-100/90 rounded-2xl border border-brand-green-200/50">
              {/* SMS Channel */}
              <button
                type="button"
                onClick={() => handleChannelResend('SMS')}
                disabled={timer > 0 || loading || isSubmitting}
                className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                  activeChannel === 'SMS'
                    ? 'bg-brand-green-900 text-brand-cream-50 shadow-sm'
                    : 'bg-white/80 hover:bg-white text-brand-green-900 hover:text-brand-green-950'
                } ${timer > 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <Smartphone className="w-3 h-3" />
                <span>SMS</span>
              </button>

              {/* WhatsApp Channel */}
              <button
                type="button"
                onClick={() => handleChannelResend('WHATSAPP')}
                disabled={timer > 0 || loading || isSubmitting}
                className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                  activeChannel === 'WHATSAPP'
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-white/80 hover:bg-white text-brand-green-900 hover:text-emerald-800'
                } ${timer > 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <MessageSquare className="w-3 h-3 text-emerald-500" />
                <span>WhatsApp</span>
              </button>

              {/* Email Channel */}
              <button
                type="button"
                onClick={() => handleChannelResend('EMAIL')}
                disabled={timer > 0 || loading || isSubmitting}
                className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                  activeChannel === 'EMAIL'
                    ? 'bg-brand-gold-700 text-white shadow-sm'
                    : 'bg-white/80 hover:bg-white text-brand-green-900 hover:text-brand-gold-800'
                } ${timer > 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <Mail className="w-3 h-3 text-brand-gold-600" />
                <span>Email</span>
              </button>

              {/* Voice Channel */}
              <button
                type="button"
                onClick={() => handleChannelResend('VOICE')}
                disabled={timer > 0 || loading || isSubmitting}
                className={`flex items-center justify-center gap-1 py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                  activeChannel === 'VOICE'
                    ? 'bg-brand-green-800 text-brand-gold-300 shadow-sm'
                    : 'bg-white/80 hover:bg-white text-brand-green-900 hover:text-brand-green-950'
                } ${timer > 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <PhoneCall className="w-3 h-3" />
                <span>Voice</span>
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading || isSubmitting}
              className="w-1/3 py-3 rounded-2xl bg-white border border-brand-green-200 text-brand-green-800 text-xs font-bold hover:bg-brand-cream-100 transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={loading || isSubmitting || otpCode.length < 4}
            className={`py-3 rounded-2xl bg-brand-green-900 hover:bg-brand-green-950 text-brand-cream-50 font-serif font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer border border-brand-gold-500/30 ${
              onCancel ? 'w-2/3' : 'w-full'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading || isSubmitting ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin text-brand-gold-400" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-brand-gold-400" />
                <span>{submitButtonText}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
