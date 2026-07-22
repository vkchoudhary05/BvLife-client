import React, { useState } from 'react';
import { X, ShieldCheck, Plus, Check, Lock, ChevronRight, User, AlertCircle } from 'lucide-react';

export interface GoogleAccount {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface GoogleOAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccountAndLogin: (account: { name: string; email: string }) => Promise<void>;
}

const DEFAULT_ACCOUNTS: GoogleAccount[] = [
  {
    id: 'acc_1',
    name: 'Vipin Choudhary',
    email: 'vkchoudhary050607@gmail.com',
  },
  {
    id: 'acc_2',
    name: 'Vipin Choudhary (Work & Dev)',
    email: 'vipin.herbal.dev@gmail.com',
  },
  {
    id: 'acc_3',
    name: 'Dr. K. L. Choudhary',
    email: 'dr.klchoudhary@gmail.com',
  },
];

export const GoogleOAuthModal: React.FC<GoogleOAuthModalProps> = ({
  isOpen,
  onClose,
  onSelectAccountAndLogin,
}) => {
  const [step, setStep] = useState<'chooser' | 'consent' | 'custom'>('chooser');
  const [selectedAccount, setSelectedAccount] = useState<GoogleAccount | null>(null);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleAccountClick = (acc: GoogleAccount) => {
    setSelectedAccount(acc);
    setStep('consent');
    setErrorMsg('');
  };

  const handleCustomAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setErrorMsg('Please enter a valid Google email address.');
      return;
    }
    const createdAccount: GoogleAccount = {
      id: `acc_custom_${Date.now()}`,
      name: customName.trim() || customEmail.split('@')[0],
      email: customEmail.trim().toLowerCase(),
    };
    setSelectedAccount(createdAccount);
    setStep('consent');
    setErrorMsg('');
  };

  const handleConfirmConsent = async () => {
    if (!selectedAccount) return;
    setIsAuthenticating(true);
    try {
      await onSelectAccountAndLogin({
        name: selectedAccount.name,
        email: selectedAccount.email,
      });
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg('Authentication failed. Please try again.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md overflow-hidden text-gray-800 transition-all transform animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google Header Branding Bar */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            {/* Authentic Google G Logo */}
            <svg className="w-6 h-6 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
            </svg>
            <span className="font-sans text-sm font-semibold text-gray-700">Sign in with Google</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Container */}
        <div className="p-6 space-y-5">

          {/* STEP 1: CHOOSE AN ACCOUNT */}
          {step === 'chooser' && (
            <div className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold text-gray-900">Choose an account</h3>
                <p className="text-xs text-gray-500">
                  to continue to <span className="font-bold text-emerald-900">Giriraj Pharmacy & Herbal</span>
                </p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Account List */}
              <div className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
                {DEFAULT_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.id}
                    onClick={() => handleAccountClick(acc)}
                    className="w-full p-3.5 flex items-center justify-between hover:bg-gray-50 transition-colors text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                        {acc.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-gray-900 group-hover:text-emerald-700 transition-colors truncate">
                          {acc.name}
                        </p>
                        <p className="text-[11px] text-gray-500 truncate font-mono">
                          {acc.email}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}

                {/* Add / Use Another Account Option */}
                <button
                  onClick={() => setStep('custom')}
                  className="w-full p-3.5 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0 group-hover:bg-gray-200 transition-colors">
                    <Plus className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 group-hover:text-gray-900">
                    Use another Google Account
                  </span>
                </button>
              </div>

              <div className="text-center pt-2">
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  To continue, Google will share your name, email address, language preference, and profile picture with Giriraj Pharmacy.
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: ENTER OTHER GOOGLE EMAIL */}
          {step === 'custom' && (
            <form onSubmit={handleCustomAccountSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-semibold text-gray-900">Sign in with Google</h3>
                <p className="text-xs text-gray-500">Enter your Google Email address to request permission</p>
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Google Email or Phone</label>
                  <input
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-700">Full Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Vipin Choudhary"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('chooser')}
                  className="w-1/2 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition-colors cursor-pointer shadow-sm"
                >
                  Next
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: GOOGLE OAUTH PERMISSION CONSENT SCREEN */}
          {step === 'consent' && selectedAccount && (
            <div className="space-y-5">
              
              {/* Target Account Badge */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                    {selectedAccount.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">{selectedAccount.name}</p>
                    <p className="text-[11px] text-gray-500 font-mono truncate">{selectedAccount.email}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStep('chooser')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer shrink-0"
                >
                  Change
                </button>
              </div>

              {/* Scope Permission Requests */}
              <div className="space-y-3 bg-blue-50/60 border border-blue-100 rounded-2xl p-4">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">
                      Giriraj Pharmacy wants access to your Google Account
                    </h4>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      This will allow Giriraj Pharmacy to:
                    </p>
                  </div>
                </div>

                <ul className="space-y-2 pt-1 pl-7 text-xs text-gray-700">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Associate your email address (<strong className="font-mono text-gray-900">{selectedAccount.email}</strong>)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Access your personal profile info & full name</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Sync Ayurveda orders and digital wellness records</span>
                  </li>
                </ul>
              </div>

              <p className="text-[11px] text-gray-500 text-center leading-normal">
                By clicking <strong>Allow & Continue</strong>, you agree to allow Google to share your account information with Giriraj Pharmacy.
              </p>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('chooser')}
                  disabled={isAuthenticating}
                  className="w-1/3 py-2.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-medium transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmConsent}
                  disabled={isAuthenticating}
                  className="w-2/3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {isAuthenticating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Granting Permission...</span>
                    </>
                  ) : (
                    <>
                      <span>Allow & Continue</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Footer info bar */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-[10px] text-gray-500">
          <span className="flex items-center gap-1 font-medium text-gray-600">
            <Lock className="w-3 h-3 text-emerald-600" />
            256-bit OAuth SSL Encryption
          </span>
          <div className="flex gap-2">
            <span className="hover:underline cursor-pointer">Privacy</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer">Terms</span>
          </div>
        </div>

      </div>
    </div>
  );
};
