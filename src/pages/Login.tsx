
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Phone,
  Mail,
  User as UserIcon,
  Shield,
  ArrowRight,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  ArrowLeft,
  Loader2
} from 'lucide-react';

import { validateAndFormatIndianPhone } from '../utils';

import {
  sendMSG91Otp,
  retryMSG91Otp,
  verifyMSG91Otp,
  performOtpLogin
} from '../services/msg91OtpService';

interface LoginProps {
  onNavigate: (page: string, params?: any) => void;
  handleLogin?: (
    credentials: { email: string; password?: string }
  ) => Promise<boolean>;
  handleRegister?: (
    data: {
      name: string;
      email: string;
      phone: string;
      role: string;
      password?: string;
      accessToken?: string;
      code?: string;
      reqId?: string;
    }
  ) => Promise<boolean>;
  onLoginSuccess?: (token: string, user: any) => void;
}

export const Login: React.FC<LoginProps> = ({
  onNavigate,
  onLoginSuccess
}) => {
  // ------------------------------------------------------------
  // AUTH FLOW
  // phone -> otp -> profile
  // ------------------------------------------------------------
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');

  // ------------------------------------------------------------
  // PHONE
  // ------------------------------------------------------------
  const [mobileNumber, setMobileNumber] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');

  // MSG91 request ID
  const [activeReqId, setActiveReqId] = useState<string>('');

  // MSG91 verified access token. This is the only OTP proof sent to backend.
  const [msg91AccessToken, setMsg91AccessToken] = useState<string>('');

  // ------------------------------------------------------------
  // OTP
  // ------------------------------------------------------------
  const [otpDigits, setOtpDigits] = useState(['', '', '', '']);

  const otpInputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null)
  ];

  // ------------------------------------------------------------
  // PROFILE
  // ------------------------------------------------------------
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  // ------------------------------------------------------------
  // UI / ASYNC
  // ------------------------------------------------------------
  const [isLoading, setIsLoading] = useState(false);
  // React state is applied asynchronously, so it cannot by itself prevent two
  // submit events that occur in the same browser tick.
  const isSendingOtpRef = useRef(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ------------------------------------------------------------
  // RESEND
  // ------------------------------------------------------------
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // ------------------------------------------------------------
  // OTP INPUT FOCUS
  // ------------------------------------------------------------
  useEffect(() => {
    if (step === 'otp') {
      setTimeout(() => {
        otpInputRefs[0].current?.focus();
      }, 50);

      setResendTimer(30);
      setCanResend(false);
    }
  }, [step]);

  // ------------------------------------------------------------
  // RESEND COUNTDOWN
  // ------------------------------------------------------------
  useEffect(() => {
    if (step !== 'otp') {
      return;
    }

    if (resendTimer <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setResendTimer((previous) => {
        if (previous <= 1) {
          clearInterval(timer);
          setCanResend(true);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, resendTimer]);

  // ------------------------------------------------------------
  // MOBILE INPUT
  // ------------------------------------------------------------
  const handleMobileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const raw = e.target.value.replace(/\D/g, '');

    if (raw.length <= 10) {
      setMobileNumber(raw);
      setErrorMessage('');
      setSuccessMessage('');
    }
  };

  // ============================================================
  // STEP 1
  // SEND OTP
  // ============================================================
  const handleSendOtp = async (
    e?: React.FormEvent
  ) => {
    if (e) {
      e.preventDefault();
    }

    if (isLoading || isSendingOtpRef.current) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    const clean = mobileNumber.trim();

    if (!clean || clean.length !== 10) {
      setErrorMessage(
        'Please enter a valid 10-digit Indian mobile number.'
      );
      return;
    }

    const formatted = validateAndFormatIndianPhone(clean);

    if (!formatted) {
      setErrorMessage(
        'Invalid Indian mobile format. Expected 10 digits starting with 6-9.'
      );
      return;
    }

    setFormattedPhone(formatted);

    // Clear previous verification state
    setActiveReqId('');
    setMsg91AccessToken('');
    setOtpDigits(['', '', '', '']);

    isSendingOtpRef.current = true;
    setIsLoading(true);

    try {
      const res = await sendMSG91Otp(formatted);

      if (!res.success) {
        setErrorMessage(
          res.error ||
          'Failed to send verification code. Please try again.'
        );
        return;
      }

      /*
       * Save the MSG91 request ID returned by the widget. It identifies the
       * exact MSG91 OTP session that must be verified.
       */
      if (res.reqId) {
        setActiveReqId(res.reqId);

        console.log(
          '[Login] MSG91 request ID saved:',
          res.reqId
        );
      } else {
        console.warn(
          '[Login] MSG91 did not return a request ID.'
        );
      }

      setOtpDigits(['', '', '', '']);

      setSuccessMessage(
        `OTP passcode sent to +91 ${clean}`
      );

      setStep('otp');

    } catch (err: any) {
      console.error(
        '[Login] Send OTP exception:',
        err
      );

      setErrorMessage(
        err?.message ||
        'Connection error. Please try again.'
      );
    } finally {
      isSendingOtpRef.current = false;
      setIsLoading(false);
    }
  };

  // ============================================================
  // OTP DIGIT INPUT
  // ============================================================
  const handleDigitChange = (
    index: number,
    value: string
  ) => {
    const clean = value.replace(/\D/g, '');

    const newDigits = [...otpDigits];

    /*
     * PASTE SUPPORT
     *
     * Example:
     * User pastes 2532
     *
     * We fill:
     * [2,5,3,2]
     *
     * BUT we DO NOT verify automatically.
     */
    if (clean.length > 1) {
      const pasted = clean
        .slice(0, 4)
        .split('');

      pasted.forEach((character, pastedIndex) => {
        if (pastedIndex < 4) {
          newDigits[pastedIndex] = character;
        }
      });

      setOtpDigits(newDigits);

      const nextIndex = Math.min(
        pasted.length,
        3
      );

      otpInputRefs[nextIndex].current?.focus();

      setErrorMessage('');

      return;
    }

    // Normal single digit
    newDigits[index] = clean
      ? clean[clean.length - 1]
      : '';

    setOtpDigits(newDigits);
    setErrorMessage('');

    // Move to next box
    if (clean && index < 3) {
      otpInputRefs[index + 1].current?.focus();
    }

    /*
     * IMPORTANT:
     *
     * We intentionally DO NOT call verifyPasscode()
     * here.
     *
     * Verification happens only when the user presses
     * "Verify & Continue".
     */
  };

  // ============================================================
  // OTP BACKSPACE
  // ============================================================
  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (
      e.key === 'Backspace' &&
      !otpDigits[index] &&
      index > 0
    ) {
      otpInputRefs[index - 1].current?.focus();
    }
  };

  // ============================================================
  // STEP 2
  // VERIFY OTP WITH MSG91, THEN SEND ONLY ITS ACCESS TOKEN TO BACKEND
  // ============================================================
  const verifyPasscode = async (
    codeToVerify?: string
  ) => {
    if (isLoading) {
      return;
    }

    const code = (
      codeToVerify ||
      otpDigits.join('')
    ).replace(/\D/g, '');

    if (code.length !== 4) {
      setErrorMessage(
        'Please enter the full 4-digit passcode.'
      );
      return;
    }

    if (!activeReqId) {
      setErrorMessage(
        'Verification session is missing. Please resend the OTP and try again.'
      );
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      const msg91Result = await verifyMSG91Otp(
        formattedPhone || mobileNumber,
        code,
        activeReqId
      );

      if (!msg91Result.success || !msg91Result.accessToken) {
        setErrorMessage(
          msg91Result.error ||
          'MSG91 could not verify this OTP. Please check the code and try again.'
        );
        return;
      }

      setMsg91AccessToken(msg91Result.accessToken);

      const loginRes = await performOtpLogin({
        identifier: formattedPhone || mobileNumber,
        accessToken: msg91Result.accessToken
      });

      console.log(
        '[Login] Backend OTP login result:',
        loginRes
      );

      /*
       * Backend rejected authentication
       */
      if (!loginRes.success) {
        setErrorMessage(
          loginRes.error ||
          'OTP was verified, but your account could not be authenticated.'
        );

        return;
      }

      /*
       * ========================================================
       * EXISTING USER
       * ========================================================
       */
      if (
        loginRes.user &&
        loginRes.token
      ) {
        finalizeSessionAndGoHome(
          loginRes.token,
          loginRes.user,
          'Welcome back!'
        );

        return;
      }

      /*
       * ========================================================
       * NEW USER
       * ========================================================
       */
      if (loginRes.isNewUser) {
        setSuccessMessage(
          'Mobile verified! Please provide your name and email to complete your registration.'
        );

        setStep('profile');

        return;
      }

      /*
       * Unexpected backend response
       */
      setErrorMessage(
        'Authentication response was incomplete. Please try again.'
      );

    } catch (err: any) {
      console.error(
        '[Login] OTP verification exception:',
        err
      );

      setErrorMessage(
        err?.message ||
        'Verification failed. Please check your network and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // RESEND OTP
  // ============================================================
  const handleResend = async () => {
    if (!canResend || isLoading) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');
    setIsLoading(true);

    try {
      console.log(
        '[Login] Resending OTP...'
      );

      const res = await retryMSG91Otp(null, activeReqId, formattedPhone || mobileNumber);

      console.log(
        '[Login] Resend result:',
        res
      );

      if (!res.success) {
        setErrorMessage(
          res.error ||
          'Failed to resend passcode.'
        );
        return;
      }

      /*
       * MSG91 retry keeps the same verification session. If it returns a new
       * request ID, retain it for the next verification call.
       */
      if (res.reqId) {
        setActiveReqId(res.reqId);

        console.log(
          '[Login] New MSG91 request ID:',
          res.reqId
        );
      }

      setOtpDigits(['', '', '', '']);

      setMsg91AccessToken('');

      setResendTimer(30);
      setCanResend(false);

      setSuccessMessage(
        'A fresh passcode has been sent to your mobile.'
      );

      setTimeout(() => {
        otpInputRefs[0].current?.focus();
      }, 50);

    } catch (err: any) {
      console.error(
        '[Login] Resend exception:',
        err
      );

      setErrorMessage(
        err?.message ||
        'Failed to resend code.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // STEP 3
  // COMPLETE NEW USER PROFILE
  // ============================================================
  const handleCompleteProfile = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (isLoading) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim()) {
      setErrorMessage(
        'Please enter your full name.'
      );
      return;
    }

    if (
      !email.trim() ||
      !email.includes('@')
    ) {
      setErrorMessage(
        'Please enter a valid email address.'
      );
      return;
    }

      if (!activeReqId || !msg91AccessToken) {
        setErrorMessage(
          'Verification session is missing. Please restart the OTP verification.'
      );
      return;
    }

    setIsLoading(true);

    try {
      console.log(
        '[Login] Completing new user profile...'
      );

      const regRes = await performOtpLogin({
        identifier:
          formattedPhone || mobileNumber,
        accessToken: msg91AccessToken,

        fullName: fullName.trim(),

        email:
          email.trim().toLowerCase(),

        autoCreate: true
      });

      console.log(
        '[Login] Registration result:',
        regRes
      );

      if (
        regRes.success &&
        regRes.user &&
        regRes.token
      ) {
        finalizeSessionAndGoHome(
          regRes.token,
          regRes.user,
          'Registration successful! Welcome to BV Life.'
        );

        return;
      }

      setErrorMessage(
        regRes.error ||
        'Registration failed. Please try again.'
      );

    } catch (err: any) {
      console.error(
        '[Login] Profile registration exception:',
        err
      );

      setErrorMessage(
        err?.message ||
        'Error saving profile. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================
  // FINALIZE LOGIN SESSION
  // ============================================================
  const finalizeSessionAndGoHome = (
    token: string,
    user: any,
    toastMsg: string
  ) => {
    try {
      localStorage.setItem(
        'Bv_auth_token',
        token
      );

      sessionStorage.setItem(
        'Bv_auth_token',
        token
      );
    } catch {
      // Storage access safety
    }

    if (onLoginSuccess) {
      onLoginSuccess(token, user);
    }

    setSuccessMessage(toastMsg);

    setTimeout(() => {
      onNavigate('home');
    }, 400);
  };

  // ============================================================
  // UI
  // ============================================================
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[#FBF9F5] to-emerald-50/40 selection:bg-brand-gold-500/30">

      <div className="w-full max-w-md">

        {/* TOP BRAND HEADER */}
        <div className="text-center mb-8">

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/80 border border-emerald-300 text-emerald-900 text-[11px] font-bold tracking-wide uppercase shadow-xs mb-3">

            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />

            <span>
              BV Life Ayurvedic Health Care
            </span>

          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-black text-brand-green-950 tracking-tight">

            {step === 'phone' &&
              'Welcome to BV Life'}

            {step === 'otp' &&
              'Verify Mobile Passcode'}

            {step === 'profile' &&
              'Complete Your Profile'}

          </h1>

          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">

            {step === 'phone' &&
              'Enter your 10-digit mobile number to log in or register'}

            {step === 'otp' &&
              `Enter the 4-digit code sent to +91 ${mobileNumber}`}

            {step === 'profile' &&
              'Just enter your name and email to activate your account'}

          </p>

        </div>

        {/* STEP PROGRESS INDICATOR */}
        <div className="flex items-center justify-center gap-2 mb-6">

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              step === 'phone'
                ? 'bg-brand-green-800 text-brand-gold-300 shadow-sm'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >

            <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
              1
            </span>

            <span>
              Mobile
            </span>

          </div>

          <div
            className={`h-0.5 w-6 ${
              step !== 'phone'
                ? 'bg-emerald-500'
                : 'bg-slate-200'
            }`}
          />

          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all ${
              step === 'otp'
                ? 'bg-brand-green-800 text-brand-gold-300 shadow-sm'
                : step === 'profile'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-slate-100 text-slate-400'
            }`}
          >

            <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">
              2
            </span>

            <span>
              OTP
            </span>

          </div>

          {step === 'profile' && (
            <>
              <div className="h-0.5 w-6 bg-emerald-500" />

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-green-800 text-brand-gold-300 shadow-sm">

                <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">
                  3
                </span>

                <span>
                  Profile
                </span>

              </div>
            </>
          )}

        </div>

        {/* MAIN AUTH CARD */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-8 shadow-xl shadow-emerald-950/5 relative overflow-hidden">

          {/* ACCENT GLOW */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />

          <div className="absolute bottom-0 left-0 w-32 h-32 bg-brand-gold-100/40 rounded-full blur-3xl pointer-events-none" />

          {/* ERROR */}
          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">

              <span className="w-2 h-2 rounded-full bg-rose-600 mt-1.5 shrink-0" />

              <div className="flex-1 leading-relaxed">
                {errorMessage}
              </div>

            </div>
          )}

          {/* SUCCESS */}
          {successMessage && (
            <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200">

              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />

              <span>
                {successMessage}
              </span>

            </div>
          )}

          {/* ====================================================
              STEP 1
          ==================================================== */}
          {step === 'phone' && (
            <form
              onSubmit={handleSendOtp}
              className="space-y-5"
            >

              <div>

                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Mobile Number
                </label>

                <div className="relative flex items-center rounded-2xl border-2 border-slate-200 bg-slate-50/70 focus-within:border-brand-green-800 focus-within:bg-white transition-all shadow-xs">

                  <div className="pl-4 pr-3 py-3.5 flex items-center gap-2 border-r border-slate-200 text-slate-700 font-bold text-sm select-none">

                    <span className="text-base leading-none">
                      🇮🇳
                    </span>

                    <span>
                      +91
                    </span>

                  </div>

                  <input
                    type="tel"
                    id="mobile-login-input"
                    inputMode="numeric"
                    autoFocus
                    placeholder="Enter 10-digit number"
                    value={mobileNumber}
                    onChange={handleMobileChange}
                    maxLength={10}
                    disabled={isLoading}
                    className="w-full pl-3 pr-4 py-3.5 text-base font-bold tracking-wider text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                  />

                  <div className="pr-4 text-slate-400">

                    <Phone className="w-5 h-5 text-slate-400" />

                  </div>

                </div>

                <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">

                  <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />

                  <span>
                    We will send a 4-digit verification code via SMS.
                  </span>

                </p>

              </div>

              <button
                type="submit"
                id="btn-get-otp"
                disabled={
                  isLoading ||
                  mobileNumber.length !== 10
                }
                className="w-full py-4 rounded-2xl bg-brand-green-800 hover:bg-brand-green-900 disabled:opacity-50 text-brand-gold-300 font-bold text-sm tracking-wide shadow-lg shadow-emerald-950/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >

                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-brand-gold-300" />

                    <span>
                      Sending Code...
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      Get Verification Passcode
                    </span>

                    <ArrowRight className="w-4 h-4" />
                  </>
                )}

              </button>

              <div className="pt-2 text-center">

                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Existing users are logged in instantly. New patients complete a 1-step profile after OTP verification.
                </p>

              </div>

            </form>
          )}

          {/* ====================================================
              STEP 2
          ==================================================== */}
          {step === 'otp' && (
            <div className="space-y-6 animate-in fade-in duration-300">

              {/* PHONE */}
              <div className="flex items-center justify-between bg-slate-50 px-3.5 py-2.5 rounded-2xl border border-slate-200">

                <div className="text-xs">

                  <span className="text-slate-500">
                    Sending to:{' '}
                  </span>

                  <span className="font-bold text-slate-900">
                    +91 {mobileNumber}
                  </span>

                </div>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setStep('phone');
                    setErrorMessage('');
                    setSuccessMessage('');
                    setOtpDigits(['', '', '', '']);
                    setActiveReqId('');
                    setMsg91AccessToken('');
                  }}
                  className="text-xs font-bold text-brand-green-800 hover:underline cursor-pointer flex items-center gap-1 disabled:opacity-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>
                    Edit
                  </span>
                </button>
              </div>

              {/* OTP INPUT */}
              <div>

                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 text-center mb-3">
                  Enter 4-Digit Passcode
                </label>

                <div className="flex items-center justify-center gap-3 sm:gap-4">

                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={otpInputRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      disabled={isLoading}
                      onChange={(e) =>
                        handleDigitChange(
                          idx,
                          e.target.value
                        )
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(
                          idx,
                          e
                        )
                      }
                      className={`w-13 h-14 sm:w-14 sm:h-15 text-center text-2xl font-black rounded-2xl border-2 transition-all focus:outline-none ${
                        digit
                          ? 'border-brand-green-800 bg-emerald-50/50 text-brand-green-950 ring-2 ring-brand-green-800/20'
                          : 'border-slate-200 bg-white text-slate-900 focus:border-brand-green-800 focus:bg-white'
                      }`}
                    />
                  ))}

                </div>

              </div>

              {/* RESEND */}
              <div className="text-center">

                {canResend ? (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={isLoading}
                    className="text-xs font-bold text-brand-green-800 hover:text-brand-green-950 flex items-center justify-center gap-1.5 mx-auto cursor-pointer disabled:opacity-50"
                  >

                    <RotateCcw className="w-3.5 h-3.5" />

                    <span>
                      Resend OTP Code via SMS
                    </span>

                  </button>
                ) : (
                  <p className="text-xs text-slate-500 font-medium">

                    Resend passcode in{' '}

                    <span className="font-bold text-slate-800">
                      {resendTimer}s
                    </span>

                  </p>
                )}

              </div>

              {/* VERIFY */}
              <button
                type="button"
                id="btn-verify-otp"
                onClick={() => verifyPasscode()}
                disabled={
                  isLoading ||
                  otpDigits.join('').length !== 4
                }
                className="w-full py-4 rounded-2xl bg-brand-green-800 hover:bg-brand-green-900 disabled:opacity-50 text-brand-gold-300 font-bold text-sm tracking-wide shadow-lg shadow-emerald-950/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >

                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-brand-gold-300" />

                    <span>
                      Verifying Code...
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      Verify & Continue
                    </span>

                    <ArrowRight className="w-4 h-4" />
                  </>
                )}

              </button>

            </div>
          )}

          {/* ====================================================
              STEP 3
          ==================================================== */}
          {step === 'profile' && (
            <form
              onSubmit={handleCompleteProfile}
              className="space-y-4 animate-in fade-in duration-300"
            >

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 font-semibold flex items-center gap-2">

                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />

                <span>
                  +91 {mobileNumber} verified. Create your profile:
                </span>

              </div>

              {/* NAME */}
              <div>

                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name
                </label>

                <div className="relative flex items-center rounded-2xl border-2 border-slate-200 bg-slate-50/70 focus-within:border-brand-green-800 focus-within:bg-white transition-all">

                  <div className="pl-3.5 text-slate-400">

                    <UserIcon className="w-4 h-4" />

                  </div>

                  <input
                    type="text"
                    id="profile-name-input"
                    autoFocus
                    placeholder="e.g. Priya Sharma"
                    value={fullName}
                    disabled={isLoading}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    className="w-full pl-2.5 pr-4 py-3 text-sm font-semibold text-slate-900 bg-transparent focus:outline-none"
                    required
                  />

                </div>

              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative flex items-center rounded-2xl border-2 border-slate-200 bg-slate-50/70 focus-within:border-brand-green-800 focus-within:bg-white transition-all">
                  <div className="pl-3.5 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    id="profile-email-input"
                    placeholder="e.g. priya@gmail.com"
                    value={email}
                    disabled={isLoading}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    className="w-full pl-2.5 pr-4 py-3 text-sm font-semibold text-slate-900 bg-transparent focus:outline-none"
                    required
                  />

                </div>

              </div>

              {/* COMPLETE */}
              <button
                type="submit"
                id="btn-complete-profile"
                disabled={
                  isLoading ||
                  !fullName.trim() ||
                  !email.trim()
                }
                className="w-full py-4 mt-2 rounded-2xl bg-brand-green-800 hover:bg-brand-green-900 disabled:opacity-50 text-brand-gold-300 font-bold text-sm tracking-wide shadow-lg shadow-emerald-950/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >

                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-brand-gold-300" />

                    <span>
                      Activating Account...
                    </span>
                  </>
                ) : (
                  <>
                    <span>
                      Complete Registration & Enter
                    </span>

                    <ArrowRight className="w-4 h-4" />
                  </>
                )}

              </button>

            </form>
          )}

        </div>

        {/* TRUST */}
        <div className="mt-8 flex items-center justify-center gap-4 text-slate-400 text-xs font-medium">

          <span className="flex items-center gap-1.5">

            <Shield className="w-3.5 h-3.5 text-emerald-600" />

            <span>
              AYUSH Certified
            </span>

          </span>

          <span>
            •
          </span>

          <span>
            256-Bit Encrypted
          </span>

          <span>
            •
          </span>

          <span>
            Password-Free Login
          </span>

        </div>

      </div>

    </div>
  );
};

