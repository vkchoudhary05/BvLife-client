/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, Home, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AdminGatewayLoginProps {
  onNavigate: (page: string, params?: any) => void;
  onLoginSuccess: () => void;
  handleLogin: (credentials: { email: string, password?: string }) => Promise<boolean>;
}

export const AdminGatewayLogin: React.FC<AdminGatewayLoginProps> = ({
  onNavigate,
  onLoginSuccess,
  handleLogin
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please provide all requested administrative credentials.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const success = await handleLogin({ email: email.trim(), password });
      if (success) {
        const token = localStorage.getItem('grams_auth_token');
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.user && data.user.role === 'admin') {
            onLoginSuccess();
            // Reload or trigger state change in parent
            window.location.reload();
          } else {
            setError('ACCESS DENIED: Your account does not possess administrative clearance.');
            localStorage.removeItem('grams_auth_token');
          }
        } else {
          setError('Verification error: Unable to authenticate role authorization.');
        }
      } else {
        setError('AUTHENTICATION FAILURE: Invalid admin email or incorrect passcode.');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure: Unable to establish contact with the core servers.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-brand-green-950/5">
      <div className="max-w-md w-full space-y-8 bg-brand-green-900 text-brand-cream-50 p-8 sm:p-10 rounded-[2.5rem] border border-brand-gold-500/30 shadow-2xl relative overflow-hidden">
        {/* Elegant top ambient border glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-brand-gold-500 via-brand-gold-300 to-brand-gold-600" />
        
        <div className="text-center space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-brand-green-800 flex items-center justify-center border border-brand-gold-500/30 shadow-inner">
            <Lock className="h-7 w-7 text-brand-gold-400 animate-pulse" />
          </div>
          <div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-brand-cream-50">
              Apothecary Gateway
            </h2>
            <p className="mt-2 text-xs text-brand-cream-300/80 max-w-xs mx-auto leading-relaxed">
              Enter administrative security passcodes to manage holistic catalogs, coupon logs, and order dispatches.
            </p>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-950/40 border border-red-500/30 text-red-200 text-xs rounded-2xl flex items-start gap-3 animate-shake font-medium">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Sandbox Quick Profiles Autofill */}
        <div className="p-4 bg-brand-green-950/40 rounded-2xl border border-brand-gold-500/10 space-y-2.5">
          <div className="flex items-center gap-1.5 justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-gold-400 animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-gold-300">Sanctuary Quick Admin Profile</span>
            </div>
            <span className="text-[8px] text-brand-cream-100 font-bold bg-brand-gold-600/20 px-2 py-0.5 rounded-full border border-brand-gold-500/10">Staging Mode</span>
          </div>
          
          <button
            type="button"
            onClick={() => {
              setEmail('vkchoudhary050607@gmail.com');
              setPassword('password123');
              setError('');
            }}
            className="w-full text-left p-3 border border-brand-gold-500/10 hover:border-brand-gold-500/40 hover:bg-brand-green-800 rounded-xl bg-brand-green-850/40 transition-all duration-200 cursor-pointer group shadow-sm flex items-center gap-3"
          >
            <div className="p-2 rounded-lg bg-brand-green-900 text-brand-gold-400 group-hover:bg-brand-gold-500/10 transition-colors">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-brand-cream-100 group-hover:text-brand-gold-300 transition-colors">Aacharya Dhanvantari (Vipin)</span>
              <span className="block text-[10px] text-brand-cream-300/60 font-mono truncate">vkchoudhary050607@gmail.com</span>
            </div>
          </button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-1.5">
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
                className="w-full px-4 py-3.5 rounded-2xl bg-brand-green-950/40 border border-brand-gold-500/20 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-cream-50 placeholder-brand-cream-300/30 shadow-sm transition-all"
              />
            </div>

            <div className="space-y-1.5">
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
                  className="w-full pl-4 pr-10 py-3.5 rounded-2xl bg-brand-green-950/40 border border-brand-gold-500/20 focus:outline-none focus:ring-2 focus:ring-brand-gold-500/20 focus:border-brand-gold-500 text-xs font-semibold text-brand-cream-50 placeholder-brand-cream-300/30 shadow-sm transition-all"
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

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-brand-gold-500 hover:bg-brand-gold-600 disabled:bg-brand-gold-500/50 text-brand-green-950 font-bold rounded-2xl text-xs uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-brand-gold-500/10 flex items-center justify-center gap-1.5 cursor-pointer border border-brand-gold-400"
            >
              <span>{loading ? 'Validating Session...' : 'Unlock Control Panel'}</span>
              <ArrowRight className="w-4 h-4 text-brand-green-950" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="w-full py-3.5 bg-transparent text-brand-cream-300 hover:text-brand-cream-50 text-xs uppercase tracking-wider font-bold rounded-2xl flex items-center justify-center gap-1.5 border border-brand-gold-500/10 hover:border-brand-gold-500/30 transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Return to Public Sanctuary</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
