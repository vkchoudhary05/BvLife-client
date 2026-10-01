/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Crown, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Award, 
  Calendar, 
  Percent, 
  Copy, 
  CheckCircle2, 
  CreditCard,
  QrCode,
  ArrowRight,
  X,
  Zap,
  Gift
} from 'lucide-react';
import { MembershipPlanPrice, User, UserMembership } from '../types';
import { loadRazorpayScript } from '../utils/razorpay';
import bvlifeLogo from '../../assets/Bvlogo.png';

interface MembershipCardSectionProps {
  user: User;
  onUserUpdated: (updatedUser: User) => void;
}

interface TierPlan {
  tier: '1 Year' | '3 Years' | '5 Years' | '10 Years' | 'Lifetime';
  name: string;
  price: number;
  originalPrice?: number;
  discount: string;
  badge?: string;
  features: string[];
  popular?: boolean;
}

const MEMBERSHIP_TIERS: TierPlan[] = [
  {
    tier: '1 Year',
    name: '1 Year Privilege Pass',
    price: 2500,
    originalPrice: 3570,
    discount: '30% Discount on all orders',
    features: [
      '30% flat privilege discount on every purchase',
      'Free biological Dosha AI wellness profiling',
      'Dedicated Ayurvedic customer support',
      'Valid for 365 days from activation'
    ]
  },
  {
    tier: '3 Years',
    name: '3 Years Wellness Club',
    price: 4000,
    originalPrice: 7500,
    discount: '30% Discount (Save ₹3,500)',
    badge: 'Smart Value',
    features: [
      '30% flat privilege discount on every purchase',
      '2 Free Doctor Consultations with AYUSH Vaidya',
      'Priority order packaging & dispatch',
      'Valid for full 3 years'
    ]
  },
  {
    tier: '5 Years',
    name: '5 Years Golden Reserve',
    price: 5000,
    originalPrice: 12500,
    discount: '30% Discount (Save ₹7,500)',
    badge: 'Most Popular',
    popular: true,
    features: [
      '30% flat privilege discount on every purchase',
      'Unlimited Ayurvedic AI Consultations',
      'Annual seasonal herbal immunity gift box',
      'Free expedited courier shipping across India',
      'Valid for full 5 years'
    ]
  },
  {
    tier: '10 Years',
    name: '10 Years Royal Patron',
    price: 10000,
    originalPrice: 25000,
    discount: '30% Discount (Save ₹15,000)',
    features: [
      '30% flat privilege discount on all formulations',
      'Priority VIP line with senior Ayurvedic practitioners',
      'Family health coverage (share discounts with household)',
      'Early access to limited seasonal botanical harvests',
      'Valid for full 10 years'
    ]
  },
  {
    tier: 'Lifetime',
    name: 'Lifetime Heritage VIP',
    price: 15000,
    originalPrice: 45000,
    discount: '30% Lifetime Flat (Best Luxury)',
    badge: 'Lifetime Privilege',
    features: [
      '30% flat lifetime discount with zero renewal fees ever',
      'Uncapped biological dosha and diet consultations',
      'Permanent VIP concierge support manager',
      'Exclusive bespoke compound herbal batches',
      'Never expires • Lifetime heirloom membership'
    ]
  }
];

export const MembershipCardSection: React.FC<MembershipCardSectionProps> = ({
  user,
  onUserUpdated
}) => {
  const [membershipTiers, setMembershipTiers] = useState<TierPlan[]>(MEMBERSHIP_TIERS);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<TierPlan>(MEMBERSHIP_TIERS[2]); // Default 5 Years
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  React.useEffect(() => {
    let active = true;
    fetch('/api/membership-plans').then(response => response.ok ? response.json() : Promise.reject()).then((prices: MembershipPlanPrice[]) => {
      if (!active || !Array.isArray(prices)) return;
      setMembershipTiers(current => current.map(plan => {
        const storedPrice = prices.find(item => item.tier === plan.tier);
        return storedPrice ? { ...plan, price: Number(storedPrice.price), originalPrice: Number(storedPrice.originalPrice) } : plan;
      }));
    }).catch(error => console.warn('Could not load membership plan prices:', error));
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    const updatedSelection = membershipTiers.find(plan => plan.tier === selectedTier.tier);
    if (updatedSelection && (updatedSelection.price !== selectedTier.price || updatedSelection.originalPrice !== selectedTier.originalPrice)) setSelectedTier(updatedSelection);
  }, [membershipTiers, selectedTier]);

  const membershipExpiry = user.membership?.expiryDate;
  const membershipIsValid = membershipExpiry?.toLowerCase() === 'lifetime' ||
    Boolean(membershipExpiry && Number.isFinite(Date.parse(membershipExpiry)) && Date.parse(membershipExpiry) > Date.now());
  const activeMembership = user.membership?.status === 'active' && membershipIsValid
    ? user.membership
    : null;

  const handleCopyCardNumber = () => {
    if (activeMembership?.cardNumber) {
      navigator.clipboard.writeText(activeMembership.cardNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('Bv_auth_token') || localStorage.getItem('Bv_auth_token');
      if (!token) {
        throw new Error('Please sign in again before purchasing a membership.');
      }

      const response = await fetch('/api/auth/membership/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ tier: selectedTier.tier })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to start membership payment');
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !(window as any).Razorpay) {
        throw new Error('Unable to load Razorpay. Please check your internet connection and try again.');
      }

      const razorpay = new (window as any).Razorpay({
        key: data.keyId || (import.meta as any).env?.VITE_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency || 'INR',
        name: 'BV Life',
        description: `${selectedTier.name} Membership`,
        order_id: data.orderId,
        prefill: { name: user.fullName || '', email: user.email || '', contact: user.phone || '' },
        theme: { color: '#1e3a29' },
        handler: async (razorpayResponse: any) => {
          try {
            const confirmation = await fetch('/api/auth/membership/confirm-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ paymentId: data.paymentId, tier: selectedTier.tier, ...razorpayResponse })
            });
            const confirmationData = await confirmation.json();
            if (!confirmation.ok) {
              throw new Error(confirmationData.error || confirmationData.message || 'Payment verification failed.');
            }

            const updatedUser: User = confirmationData.user || { ...user, membership: confirmationData.membership };
            localStorage.setItem('Bv_current_user', JSON.stringify(updatedUser));
            onUserUpdated(updatedUser);
            setSuccessMessage(`Payment confirmed. Your BV Life ${selectedTier.tier} Membership is now active.`);
            setTimeout(() => {
              setShowUpgradeModal(false);
              setSuccessMessage(null);
            }, 2000);
          } catch (err: any) {
            setError(err.message || 'Payment was received but membership activation could not be completed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) }
      });
      razorpay.on('payment.failed', (event: any) => {
        setError(event?.error?.description || 'Payment was not completed. No membership was activated.');
        setLoading(false);
      });
      razorpay.open();
      return;
    } catch (err: any) {
      setError(err.message || 'Unable to start membership payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatExpiry = (expiryDate?: string) => {
    if (!expiryDate) return 'N/A';
    if (expiryDate.toLowerCase() === 'lifetime') return 'Lifetime Pass (Never Expires)';
    try {
      const d = new Date(expiryDate);
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return expiryDate;
    }
  };

  return (
    <div id="membership-privilege-section" className="space-y-6 rounded-[2rem] border border-brand-green-800/10 bg-[radial-gradient(ellipse_at_top_left,rgba(217,163,80,0.16),transparent_42%),linear-gradient(135deg,#f3f8f1_0%,#fffdf6_48%,#eef5ef_100%)] p-3 sm:p-5">
      
      {/* Header Banner */}
      <div className="relative isolate flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden bg-gradient-to-br from-[#102f22] via-[#1d5639] to-[#34714e] p-5 sm:p-6 rounded-3xl text-brand-cream-50 border border-brand-gold-500/50 shadow-lg">
        <div className="pointer-events-none absolute -right-12 -top-20 -z-10 h-56 w-56 rounded-full bg-brand-gold-400/20 blur-3xl" />
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-brand-gold-400" />
            <span className="text-[11px] uppercase tracking-widest text-brand-gold-400 font-extrabold">
              BV Life Privilege Club
            </span>
          </div>
          <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
            Ayurvedic Wellness Membership Pass
          </h3>
          <p className="text-xs text-brand-cream-100/90 max-w-xl leading-relaxed">
            Get an exclusive 30% privilege discount on all authentic formulations, priority consultations, and free door delivery.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setSuccessMessage(null);
            setShowUpgradeModal(true);
          }}
          className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-[#f4d77d] to-brand-gold-400 hover:from-[#ffe7a3] hover:to-brand-gold-300 text-brand-green-950 font-bold text-xs rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 font-sans tracking-wide"
        >
          <Sparkles className="w-4 h-4" />
          <span>{activeMembership ? 'Upgrade / Extend Tier' : 'Activate Membership'}</span>
        </button>
      </div>

      {/* Grid: Privilege Card + Benefits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        
        {/* PHYSICAL CARD MOCKUP (Left 7 Cols) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="relative -mx-2 w-[calc(100%+1rem)] max-w-[506px] min-h-[224px] sm:mx-0 sm:w-full sm:max-w-[490px] sm:min-h-0 sm:aspect-[1.65/1] rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-2xl overflow-hidden border border-brand-gold-400/50 bg-[radial-gradient(circle_at_top_right,rgba(217,163,80,0.22),transparent_48%),linear-gradient(135deg,#0c2417,#16432d,#081810)] text-white flex flex-col justify-between select-none">
            
            {/* Hologram & Sheen overlays */}
            <div className="absolute -top-24 -left-24 w-60 h-60 bg-brand-gold-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-brand-gold-500/15 rounded-full blur-3xl pointer-events-none" />
            
            {/* Etched watermark pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(217,163,80,0.12),transparent_60%)] pointer-events-none" />
            <span aria-hidden="true" className="membership-card-shine" />

            {/* Card Header */}
            <div className="relative z-10 flex items-start justify-between gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <img src={bvlifeLogo} alt="BV Life" className="h-7 w-7 rounded-full border border-brand-gold-300 bg-white object-cover p-0.5" />
                  <span className="font-serif font-extrabold text-sm sm:text-base tracking-widest text-brand-gold-300">
                    BV LIFE
                  </span>
                </div>
                <p className="text-[9px] uppercase tracking-widest text-brand-cream-200/70 font-sans">
                  Ayurvedic Privilege Pass
                </p>
              </div>

              {/* Status Badge */}
              <div className="flex flex-col items-end">
                <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border shadow-xs ${
                  activeMembership 
                    ? 'bg-brand-gold-500/20 text-brand-gold-300 border-brand-gold-400/40' 
                    : 'bg-white/10 text-white/70 border-white/20'
                }`}>
                  <Crown className="w-3 h-3 text-brand-gold-400" />
                  <span>{activeMembership ? `${activeMembership.tier} Member` : 'Privilege Pass'}</span>
                </span>
                <span className="text-[9px] text-brand-gold-300 font-mono mt-0.5">30% MEMBER SAVINGS</span>
              </div>
            </div>

            {/* Smart EMV Chip & Contactless Visual */}
            <div className="relative z-10 flex items-center gap-4 my-1.5 sm:my-2">
              <div className="w-11 h-8 rounded-md bg-gradient-to-tr from-amber-400 via-yellow-200 to-amber-500 border border-yellow-600/50 shadow-inner flex items-center justify-center">
                <div className="w-7 h-5 border border-amber-800/40 rounded-xs grid grid-cols-2 gap-0.5 opacity-60">
                  <div className="border-r border-b border-amber-800/40" />
                  <div className="border-b border-amber-800/40" />
                  <div className="border-r border-amber-800/40" />
                  <div />
                </div>
              </div>
              <CreditCard className="w-5 h-5 text-brand-gold-300/60" />
            </div>

            {/* Card Number Grouping */}
            <div className="relative z-10 my-1">
              <div className="flex items-center justify-between">
                <p className="min-w-0 break-words font-mono text-[13px] sm:text-xl font-bold tracking-[0.06em] sm:tracking-[0.2em] text-brand-cream-50 drop-shadow-md">
                  {activeMembership?.cardNumber || 'BVL-MEM-••••-••••'}
                </p>
                {activeMembership && (
                  <button
                    onClick={handleCopyCardNumber}
                    className="text-brand-gold-300 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10 cursor-pointer"
                    title="Copy Card Number"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
            </div>

            {/* Card Footer: Holder Name, Email, Validity */}
            <div className="relative z-10 pt-2 border-t border-brand-gold-500/20 flex items-end justify-between gap-2 sm:gap-4">
              <div className="min-w-0 space-y-0.5 max-w-[65%]">
                <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-brand-cream-200/60 font-semibold">
                  Card Holder
                </p>
                <p className="font-serif font-bold text-xs sm:text-sm text-white tracking-wide truncate">
                  {user.fullName || 'Valued Member'}
                </p>
                <p className="text-[9px] sm:text-[10px] text-brand-cream-200/70 font-mono truncate">
                  {user.email}
                </p>
              </div>

              <div className="space-y-0.5 text-right">
                <p className="text-[8px] sm:text-[9px] uppercase tracking-wider text-brand-cream-200/60 font-semibold">
                  Valid Thru
                </p>
                <p className="max-w-[126px] font-mono font-bold text-[11px] sm:text-sm text-brand-gold-300 sm:max-w-none">
                  {activeMembership ? formatExpiry(activeMembership.expiryDate) : 'Activate Now'}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* BENEFITS BREAKDOWN (Right 5 Cols) */}
        <div className="lg:col-span-5 space-y-4 bg-gradient-to-br from-white/90 via-[#fbfaf4] to-[#edf5ed] border border-brand-green-600/15 p-5 sm:p-6 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-gold-600" />
            <h4 className="font-serif text-base font-bold text-brand-green-950">
              Privilege Club Advantages
            </h4>
          </div>

          <ul className="space-y-3 text-xs text-brand-green-900">
            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-brand-gold-500/20 text-brand-gold-700 flex items-center justify-center shrink-0 mt-0.5">
                <Percent className="w-3 h-3" />
              </div>
              <div>
                <strong className="font-bold text-brand-green-950">30% Flat Discount</strong>
                <p className="text-brand-green-800/80">Applied automatically at checkout across the complete herbal apothecary catalogue.</p>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-brand-green-700/10 text-brand-green-800 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="w-3 h-3" />
              </div>
              <div>
                <strong className="font-bold text-brand-green-950">Free Vaidya Doctor Consultations</strong>
                <p className="text-brand-green-800/80">Personalized pulse reading, Dosha assessment, and tailor-made remedy protocols.</p>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-brand-gold-500/20 text-brand-gold-700 flex items-center justify-center shrink-0 mt-0.5">
                <Zap className="w-3 h-3" />
              </div>
              <div>
                <strong className="font-bold text-brand-green-950">Priority Air Dispatch</strong>
                <p className="text-brand-green-800/80">Zero minimum delivery fees and rapid priority packaging on every shipment.</p>
              </div>
            </li>

            <li className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-brand-green-700/10 text-brand-green-800 flex items-center justify-center shrink-0 mt-0.5">
                <Gift className="w-3 h-3" />
              </div>
              <div>
                <strong className="font-bold text-brand-green-950">Seasonal Botanical Gifts</strong>
                <p className="text-brand-green-800/80">Complimentary trial potions and fresh seasonal harvest batches sent periodically.</p>
              </div>
            </li>
          </ul>

          <div className="pt-2">
            <button
              onClick={() => {
                setError(null);
                setSuccessMessage(null);
                setShowUpgradeModal(true);
              }}
              className="w-full py-2.5 bg-brand-green-900 hover:bg-brand-green-800 text-brand-cream-50 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>{activeMembership ? 'View Upgrade Options' : 'Choose Your Plan & Join'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-brand-green-600/10 p-6 sm:p-8 space-y-6 my-8 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-brand-green-600/10 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-brand-gold-600 text-xs font-bold uppercase tracking-wider">
                  <Crown className="w-4 h-4" />
                  <span>BV Life Privilege Membership</span>
                </div>
                <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-green-950">
                  Select Your Privilege Plan
                </h3>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Error / Success Notifications */}
            {error && (
              <div className="p-3.5 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200 font-medium">
                {error}
              </div>
            )}
            {successMessage && (
              <div className="p-3.5 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Tiers List */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {membershipTiers.map((tierPlan) => {
                const isSelected = selectedTier.tier === tierPlan.tier;
                return (
                  <div
                    key={tierPlan.tier}
                    onClick={() => setSelectedTier(tierPlan)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-brand-gold-500 bg-brand-cream-50/70 shadow-sm'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-brand-green-950">
                          {tierPlan.name}
                        </span>
                        {tierPlan.badge && (
                          <span className="text-[9px] uppercase tracking-wider font-extrabold bg-brand-gold-500/20 text-brand-gold-800 px-2 py-0.5 rounded-full">
                            {tierPlan.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-brand-gold-700 font-semibold">
                        {tierPlan.discount}
                      </p>
                      <ul className="text-[11px] text-brand-green-800/80 space-y-0.5 pt-1">
                        {tierPlan.features.slice(0, 2).map((feat, idx) => (
                          <li key={idx} className="flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-emerald-600 shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center gap-1 shrink-0">
                      <div className="flex items-baseline gap-1.5">
                        {tierPlan.originalPrice && (
                          <span className="text-xs text-slate-400 line-through font-mono">
                            ₹{tierPlan.originalPrice.toLocaleString('en-IN')}
                          </span>
                        )}
                        <span className="font-serif text-lg font-bold text-brand-green-950 font-mono">
                          ₹{tierPlan.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isSelected ? 'bg-brand-green-800 text-white' : 'text-brand-green-700'
                      }`}>
                        {isSelected ? 'Selected Plan' : 'Select'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-brand-green-600/10">
              <div className="text-xs text-slate-600">
                <span>Selected: </span>
                <strong className="text-brand-green-950">{selectedTier.name} (₹{selectedTier.price})</strong>
                <p className="text-[10px] text-slate-500">Includes 30% discount on all purchases & instant card generation.</p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  className="w-1/2 sm:w-auto px-6 py-2.5 bg-gradient-to-r from-brand-gold-500 to-brand-gold-400 hover:from-brand-gold-400 hover:to-brand-gold-300 text-brand-green-950 text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Issuing Card...</span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Activate for ₹{selectedTier.price.toLocaleString('en-IN')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
