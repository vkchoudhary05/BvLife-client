import React from 'react';
import { Check, Crown, CreditCard, Leaf, Sparkles, Stethoscope, Truck, X } from 'lucide-react';
import bvlifeLogo from '../../assets/Bvlogo.png';

const confetti = Array.from({ length: 18 }, (_, index) => ({
  left: `${(index * 29 + 7) % 100}%`,
  delay: `${(index % 7) * 0.18}s`,
  color: ['#ef694a', '#f4c542', '#58b985', '#f6efe0'][index % 4]
}));

interface MembershipOfferPopupProps {
  isSignedIn: boolean;
  onClose: () => void;
  onJoin: () => void;
}

export const MembershipOfferPopup: React.FC<MembershipOfferPopupProps> = ({ isSignedIn, onClose, onJoin }) => (
  <div
    className="fixed inset-0 z-[10000] grid place-items-center overflow-y-auto bg-brand-green-950/65 px-3 py-3 backdrop-blur-sm sm:p-5"
    onMouseDown={(event) => event.target === event.currentTarget && onClose()}
  >
    <div aria-hidden="true" className="welcome-celebration pointer-events-none fixed inset-0 overflow-hidden">
      {confetti.map((piece, index) => <span key={index} className="welcome-confetti" style={{ left: piece.left, animationDelay: piece.delay, backgroundColor: piece.color }} />)}
      <span className="welcome-firework firework-left" />
      <span className="welcome-firework firework-right" />
    </div>
    <section role="dialog" aria-modal="true" aria-labelledby="membership-offer-title" className="relative my-auto w-full max-w-[430px] overflow-hidden rounded-[24px] border border-brand-gold-500/40 bg-[#fbfaf4] shadow-[0_24px_80px_rgba(15,45,32,0.35)] animate-in fade-in zoom-in-95 duration-300 sm:rounded-[28px]">
      <button type="button" onClick={onClose} aria-label="Close membership offer" className="absolute right-4 top-4 z-10 rounded-full border border-white/25 bg-white/10 p-2 text-white transition hover:bg-white/20">
        <X className="h-4 w-4" />
      </button>

      <div className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top,_rgba(212,175,55,0.3),_transparent_55%),linear-gradient(145deg,#173c2e_0%,#1e6246_55%,#163b2d_100%)] px-4 pb-4 pt-4 text-center text-white sm:px-6 sm:pb-5 sm:pt-6">
        <span className="pointer-events-none absolute -right-8 -top-10 h-36 w-36 rounded-full border border-brand-gold-300/25" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <Leaf className="membership-card-leaf membership-card-leaf-a" />
          <Leaf className="membership-card-leaf membership-card-leaf-b" />
          <Leaf className="membership-card-leaf membership-card-leaf-c" />
          <span className="membership-green-glow membership-green-glow-a" />
          <span className="membership-green-glow membership-green-glow-b" />
        </div>
        <div className="relative flex items-center justify-center gap-2">
          <img src={bvlifeLogo} alt="BV Life" className="h-9 w-9 rounded-full border-2 border-brand-gold-300 bg-white object-cover p-0.5 sm:h-10 sm:w-10" />
          <div className="text-left"><p className="font-serif text-base font-extrabold tracking-wide text-brand-gold-200">BV LIFE</p><p className="text-[9px] uppercase tracking-[0.14em] text-brand-cream-100/70">Ayurvedic wellness</p></div>
        </div>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-brand-gold-200 sm:mt-3 sm:text-[10px]"><Sparkles className="h-3.5 w-3.5" /> Privilege Club <Sparkles className="h-3.5 w-3.5" /></p>
        <h2 id="membership-offer-title" className="mt-1 font-serif text-xl font-bold leading-tight sm:text-2xl">Your wellness deserves more.</h2>
        <p className="relative mx-auto mt-1 max-w-xs text-[10px] text-brand-cream-100/85 sm:text-[11px]">Savings, Ayurvedic guidance, and care that stays with you.</p>
        <div className="relative mt-2 flex justify-center gap-1.5"><span className="rounded-full border border-brand-gold-300/30 bg-white/10 px-2 py-1 text-[9px] font-bold text-brand-gold-100">30% member savings</span><span className="rounded-full border border-emerald-100/25 bg-emerald-100/10 px-2 py-1 text-[9px] font-bold text-emerald-100">Doctor plan benefits</span></div>

        <div className="relative mx-auto mt-3 aspect-[1.65/1] w-full max-w-[250px] rounded-2xl border border-brand-gold-400/60 bg-[radial-gradient(circle_at_top_right,rgba(217,163,80,0.22),transparent_48%),linear-gradient(135deg,#0c2417,#16432d,#081810)] p-3 text-left shadow-xl sm:mt-4 sm:max-w-[292px] sm:p-4">
          <span aria-hidden="true" className="membership-card-shine" />
          <div className="flex items-start justify-between"><div className="flex items-center gap-1.5"><img src={bvlifeLogo} alt="" className="h-7 w-7 rounded-full bg-white object-cover p-0.5" /><span className="font-serif text-xs font-extrabold tracking-widest text-brand-gold-300">BV LIFE</span></div><span className="rounded-full border border-brand-gold-300/40 bg-white/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-brand-gold-200">Privilege Pass</span></div>
          <div className="mt-5 flex items-center gap-3"><div className="h-7 w-10 rounded-md border border-yellow-600/50 bg-gradient-to-tr from-amber-500 via-yellow-200 to-amber-400" /><CreditCard className="h-4 w-4 text-brand-gold-300/70" /></div>
          <p className="mt-3 font-mono text-xs font-bold tracking-[0.16em] text-white">BVL-MEM-••••-••••</p>
          <div className="mt-2 flex items-end justify-between border-t border-brand-gold-400/20 pt-2"><span className="text-[8px] uppercase tracking-wider text-brand-cream-100/65">Your Privilege</span><span className="font-serif text-xl font-bold text-brand-gold-300">30% OFF</span></div>
        </div>
      </div>

      <div className="space-y-2.5 px-4 py-4 sm:space-y-3 sm:px-5 sm:py-5">
        <div className="rounded-xl bg-brand-gold-500/10 px-3 py-2 text-center"><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-brand-gold-700">Your member advantage</p><p className="mt-0.5 text-[11px] leading-relaxed text-brand-green-800/75 sm:text-xs">Activate your digital card and start receiving member care from your next order.</p></div>
        {[
          { text: '30% flat discount on every purchase', icon: Crown },
          { text: 'Free doctor consultation benefits on selected plans', icon: Stethoscope },
          { text: 'Free delivery benefits for members', icon: Truck }
        ].map(({ text, icon: Icon }) => (
          <p key={text} className="flex items-center gap-2.5 rounded-xl border border-brand-green-700/10 bg-white px-3 py-2 text-xs font-semibold text-brand-green-800"><span className="grid h-6 w-6 place-items-center rounded-full bg-brand-gold-500/15 text-brand-gold-700"><Icon className="h-3.5 w-3.5" /></span>{text}</p>
        ))}
        <button type="button" onClick={onJoin} className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-green-800 to-brand-green-700 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-green-900/20 transition hover:-translate-y-0.5 hover:from-brand-green-900 hover:to-brand-green-800 sm:mt-2 sm:py-3">
          <Crown className="h-4 w-4 text-brand-gold-300" /> {isSignedIn ? 'Unlock My Member Benefits' : 'Sign in to Unlock Benefits'}
        </button>
        <p className="text-center text-[10px] font-medium text-brand-green-800/55">No coupon code needed · Your Privilege Pass is ready after activation</p>
        <button type="button" onClick={onClose} className="block w-full py-1 text-center text-xs font-semibold text-brand-green-800/55 transition hover:text-brand-green-900">Maybe later, keep browsing</button>
      </div>
    </section>
  </div>
);
