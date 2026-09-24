import React, { useState } from 'react';
import { ArrowRight, Check, Gift, Phone, Sparkles, X } from 'lucide-react';
import bvlifeLogo from '../../assets/Bvlogo.png';
import { SecureOtpWidget } from './secureOtpWidget';
import { formatMSG91Identifier, performOtpLogin, sendMSG91Otp } from '../services/msg91OtpService';

const celebrationColors = ['#ef694a', '#f4c542', '#58b985', '#f6efe0', '#e889b2', '#7bc9cf'];
const confettiPieces = Array.from({ length: 42 }, (_, index) => ({
  left: `${(index * 37 + 9) % 100}%`,
  delay: `${(index % 14) * 0.11}s`,
  duration: `${4.2 + (index % 8) * 0.42}s`,
  color: celebrationColors[index % celebrationColors.length],
  shape: index % 4 === 0 ? 'round' : 'square'
}));
const celebrationBalloons = [
  { left: '4%', color: '#e9755e', delay: '0.3s', duration: '8.5s' },
  { left: '14%', color: '#efc84b', delay: '2.2s', duration: '9.2s' },
  { left: '81%', color: '#65b891', delay: '1.1s', duration: '8.8s' },
  { left: '92%', color: '#df83a0', delay: '3.1s', duration: '9.6s' }
];

interface FirstVisitLoginProps {
  onClose: () => void;
  onLogin: (token: string, user: any) => void;
}

export const FirstVisitLogin: React.FC<FirstVisitLoginProps> = ({ onClose, onLogin }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpReqId, setOtpReqId] = useState('');

  const handleContinue = async (event: React.FormEvent) => {
    event.preventDefault();
    const mobile = phone.replace(/\D/g, '').slice(-10);
    if (mobile.length !== 10) {
      setError('Enter a valid 10-digit mobile number to continue.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await sendMSG91Otp(formatMSG91Identifier(mobile));
      if (!result.success) throw new Error(result.error || 'Unable to send your verification code.');
      setOtpReqId(result.reqId || '');
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || 'Unable to continue right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpVerified = async (params: { code: string; accessToken?: string; reqId?: string }) => {
    setLoading(true);
    setError('');
    try {
      const mobile = phone.replace(/\D/g, '').slice(-10);
      const result = await performOtpLogin({
        identifier: mobile,
        accessToken: params.accessToken,
        code: params.code,
        reqId: params.reqId || otpReqId,
        fullName: 'BV Life Member',
        email: `mobile-${mobile}@bvlife.local`,
        autoCreate: true
      });
      if (!result.success || !result.user || !result.token) throw new Error(result.error || 'Unable to sign in. Please try again.');
      localStorage.setItem('bvlife_mobile_gate_seen', 'true');
      localStorage.setItem('bvlife_welcome_offer_seen', 'true');
      onLogin(result.token, result.user);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'OTP verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center overflow-hidden bg-brand-green-950/65 p-4 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div aria-hidden="true" className="welcome-celebration pointer-events-none absolute inset-0 z-0 overflow-hidden">
        {confettiPieces.map((piece, index) => (
          <span key={`confetti-${index}`} className={`welcome-confetti ${piece.shape}`} style={{ left: piece.left, animationDelay: piece.delay, animationDuration: piece.duration, backgroundColor: piece.color }} />
        ))}
        {celebrationBalloons.map((balloon, index) => (
          <span key={`balloon-${index}`} className="welcome-balloon" style={{ left: balloon.left, animationDelay: balloon.delay, animationDuration: balloon.duration }}>
            <i style={{ backgroundColor: balloon.color }} />
            <b />
          </span>
        ))}
        <span className="welcome-firework firework-left" />
        <span className="welcome-firework firework-right" />
        <span className="welcome-firework firework-top" />
      </div>
      <section role="dialog" aria-modal="true" aria-labelledby="welcome-offer-title" className="relative z-10 w-full max-w-[340px] overflow-hidden rounded-[24px] border border-brand-gold-500/30 bg-brand-cream-50 shadow-[0_24px_80px_rgba(15,45,32,0.35)] animate-in fade-in zoom-in-95 duration-300 sm:max-w-sm">
        <button type="button" onClick={onClose} aria-label="Close welcome offer" className="absolute right-4 top-4 z-10 rounded-full border border-white/25 bg-white/10 p-2 text-white transition hover:bg-white/20">
          <X className="h-4 w-4" />
        </button>

        <div className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.24),_transparent_55%),linear-gradient(145deg,#173c2e_0%,#1e6246_55%,#163b2d_100%)] px-5 pb-5 pt-5 text-center text-white sm:px-6 sm:pb-6 sm:pt-6">
          <div className="pointer-events-none absolute -right-10 -top-14 h-44 w-44 rounded-full border border-brand-gold-300/25" />
          <div className="pointer-events-none absolute -right-3 -top-7 h-32 w-32 rounded-full border border-brand-gold-300/20" />
          <span className="pointer-events-none absolute left-[12%] top-14 h-2 w-2 rotate-45 bg-brand-gold-300/80" />
          <span className="pointer-events-none absolute right-[15%] top-28 h-1.5 w-1.5 rounded-full bg-emerald-200/90" />
          <span className="pointer-events-none absolute left-[20%] top-36 h-1.5 w-1.5 rotate-45 bg-orange-300/90" />
          <span className="pointer-events-none absolute right-[23%] top-12 h-2 w-2 rounded-full bg-brand-gold-200/80" />
          <div className="relative mx-auto mb-2 flex h-[64px] w-[64px] items-center justify-center rounded-full border-[3px] border-brand-gold-300 bg-white p-1 shadow-[0_0_0_5px_rgba(255,255,255,0.12),0_8px_20px_rgba(0,0,0,0.22)]">
            <img src={bvlifeLogo} alt="BV Life logo" className="h-full w-full scale-125 rounded-full object-cover" />
            <span className="absolute -bottom-1 -right-2 flex h-8 w-8 items-center justify-center rounded-full border-2 border-brand-green-800 bg-brand-gold-400 text-brand-green-950 shadow-md"><Gift className="h-4 w-4" /></span>
          </div>
          <p className="relative flex items-center justify-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-brand-gold-200"><Sparkles className="h-4 w-4" /> You’ve unlocked a welcome gift <Sparkles className="h-4 w-4" /></p>
          <h2 id="welcome-offer-title" className="mt-1.5 font-serif text-xl font-bold leading-tight text-white sm:text-2xl">Congratulations!</h2>
          <div className="mx-auto mt-2.5 flex w-fit items-baseline gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-1.5 backdrop-blur-sm">
            <span className="font-serif text-4xl font-bold leading-none text-brand-gold-300 sm:text-5xl">10%</span>
            <span className="text-left text-xs font-extrabold uppercase leading-tight tracking-[0.12em] text-white">off<br />your order</span>
          </div>
          <p className="mx-auto mt-2 max-w-xs text-[11px] leading-relaxed text-brand-cream-100/90">Sign in or get started with your mobile number to claim your BV Life offer.</p>
          <div className="mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border border-dashed border-brand-gold-300/70 bg-brand-green-950/35 px-3 py-1.5 text-xs shadow-inner">
            <span className="text-xs text-brand-cream-100/80">Use code</span>
            <strong className="font-extrabold tracking-[0.16em] text-brand-gold-200">WELCOME10</strong>
          </div>
        </div>

        <div className="space-y-3 px-4 pb-4 pt-4 sm:px-5 sm:pb-5">
          {!otpSent ? <form onSubmit={handleContinue} className="space-y-3">
            <label htmlFor="welcome-offer-phone" className="block text-xs font-bold text-brand-green-950">Continue with your mobile</label>
            <div className="flex items-center gap-2 rounded-2xl border border-brand-green-700/15 bg-white px-3 focus-within:border-brand-green-700 focus-within:ring-2 focus-within:ring-brand-green-700/10">
              <Phone className="h-4 w-4 shrink-0 text-brand-gold-600" />
              <span className="border-r border-brand-green-700/10 pr-2 text-sm font-semibold text-brand-green-800">+91</span>
              <input id="welcome-offer-phone" autoFocus inputMode="numeric" autoComplete="off" maxLength={10} value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" className="w-full bg-transparent py-3 text-sm text-brand-green-950 outline-none placeholder:text-brand-green-800/35" />
            </div>
            {error && <p role="alert" className="text-xs font-semibold text-red-600">{error}</p>}
            <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-green-800 py-3 text-sm font-bold text-white shadow-lg shadow-brand-green-900/15 transition hover:-translate-y-0.5 hover:bg-brand-green-900 disabled:cursor-wait disabled:opacity-60">
              {loading ? 'Sending code...' : 'Send sign-in code'} <ArrowRight className="h-4 w-4" />
            </button>
          </form> : <div>
            <p className="mb-3 text-center text-xs text-brand-green-800">Enter the code sent to +91 {phone}</p>
            {error && <p role="alert" className="mb-3 text-xs font-semibold text-red-600">{error}</p>}
            <SecureOtpWidget identifier={phone} purpose="Login" widgetName="BV Life Welcome Login" smsOnly initialReqId={otpReqId} theme="light" onVerified={handleOtpVerified} onCancel={() => { setOtpSent(false); setError(''); }} submitButtonText="Verify & claim offer" isSubmitting={loading} />
          </div>}
          <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-brand-green-800/60"><Check className="h-3.5 w-3.5 text-brand-green-700" /> WELCOME10 will be applied to your cart when you continue.</p>
          <button type="button" onClick={onClose} className="block w-full py-1 text-center text-xs font-semibold text-brand-green-800/55 transition hover:text-brand-green-900">Maybe later, keep browsing</button>
        </div>
      </section>
    </div>
  );
};
