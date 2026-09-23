import React, { useState } from 'react';
import { ArrowRight, Phone, X } from 'lucide-react';
import bvlifeLogo from '../../assets/Bvlogo1.jpeg';

interface FirstVisitLoginProps {
  onClose: () => void;
  onLogin: (token: string, user: any) => void;
}

export const FirstVisitLogin: React.FC<FirstVisitLoginProps> = ({ onClose, onLogin }) => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async (event: React.FormEvent) => {
    event.preventDefault();
    const mobile = phone.replace(/\D/g, '').slice(-10);
    if (mobile.length !== 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/auth/quick-mobile-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: mobile })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to continue right now.');
      localStorage.setItem('bvlife_mobile_gate_seen', 'true');
      onLogin(data.token, data.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Unable to continue right now.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] grid place-items-center bg-brand-green-950/65 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-brand-cream-50 shadow-2xl">
        <div className="bg-gradient-to-br from-brand-green-950 via-brand-green-800 to-brand-gold-700 px-7 pb-10 pt-8 text-center text-white">
          <button onClick={onClose} aria-label="Close" className="absolute right-4 top-4 rounded-full p-1.5 text-brand-cream-200 hover:bg-white/10"><X className="h-4 w-4" /></button>
          <div className="mx-auto mb-3 h-18 w-18 overflow-hidden rounded-full border-2 border-white bg-white p-1 shadow-[0_0_0_5px_rgba(255,255,255,0.18)]">
            <img src={bvlifeLogo} alt="BV Life" className="h-full w-full object-contain" />
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-brand-gold-300">BV Life</p>
          <h2 className="mt-2 font-serif text-2xl font-bold">Welcome to wellness</h2>
          <p className="mt-2 text-sm text-brand-cream-200">Save your Acharya conversation and receive personal guidance.</p>
        </div>
        <form onSubmit={handleContinue} className="-mt-4 space-y-5 rounded-t-3xl bg-brand-cream-50 px-6 pb-7 pt-6">
          <label className="block text-sm font-bold text-brand-green-900">Mobile number</label>
          <div className="flex items-center gap-2 rounded-xl border border-brand-green-700/20 bg-white px-3 focus-within:border-brand-green-700">
            <Phone className="h-4 w-4 text-brand-gold-600" />
            <span className="text-sm font-semibold text-brand-green-800">+91</span>
            <input autoFocus inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))} placeholder="10-digit mobile number" className="w-full bg-transparent py-3 text-sm outline-none" />
          </div>
          {error && <p className="text-xs font-semibold text-red-600">{error}</p>}
          <button disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-green-800 py-3.5 text-sm font-bold text-white transition hover:bg-brand-green-900 disabled:opacity-60">
            {loading ? 'Starting your session…' : 'Continue'} <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-[10px] leading-relaxed text-brand-green-700/60">No OTP required. Your mobile number helps keep your consultation history together.</p>
        </form>
      </div>
    </div>
  );
};
