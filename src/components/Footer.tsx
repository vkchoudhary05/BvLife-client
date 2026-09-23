/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Phone, MapPin, ArrowRight, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';
import { WebsiteSettings } from '../types';
import { Logo } from './Logo';

interface FooterProps {
  onNavigate: (page: string, params?: any) => void;
  onOpenConsultant: () => void;
  language?: any;
  settings?: WebsiteSettings;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenConsultant, settings }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <footer id="site-footer" className="bg-white text-black border-t border-gray-200">

      {/* Brand Value Props Bar — green */}
      <div className="bg-brand-green-900 py-8 sm:py-10">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-3 px-4 sm:grid-cols-3 sm:gap-4 sm:px-6 lg:px-8">
          {[0].map((copy) => (
            <React.Fragment key={copy}>
              <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-brand-cream-100/10 bg-white/5 p-4 sm:p-5">
                <ShieldCheck className="h-7 w-7 shrink-0 text-brand-gold-400" />
                <p className="min-w-0 text-sm leading-snug text-brand-cream-100"><strong className="mb-1 block text-white">Quality Assured</strong> <span className="text-brand-cream-200/80">Carefully selected Ayurvedic products made with quality-focused standards.</span></p>
              </div>
              <button onClick={onOpenConsultant} className="group flex min-w-0 items-start gap-3 rounded-2xl border border-brand-gold-500/30 bg-brand-gold-500/10 p-4 text-left transition hover:-translate-y-0.5 hover:bg-brand-gold-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-400 sm:p-5">
                <Sparkles className="h-7 w-7 shrink-0 text-brand-gold-400" />
                <p className="min-w-0 text-sm leading-snug text-brand-cream-100"><strong className="mb-1 block text-white">Ayurvedic AI Consultant</strong> <span className="text-brand-cream-200/80">Get a free dosha analysis and a personalised wellness plan instantly.</span><span className="mt-2 flex items-center text-xs font-bold text-brand-gold-300">Start a consultation <ArrowRight className="ml-1 h-3.5 w-3.5" /></span></p>
              </button>
              <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-brand-cream-100/10 bg-white/5 p-4 sm:p-5">
                <HeartHandshake className="h-7 w-7 shrink-0 text-brand-gold-400" />
                <p className="min-w-0 text-sm leading-snug text-brand-cream-100"><strong className="mb-1 block text-white">Care You Can Trust</strong> <span className="text-brand-cream-200/80">Thoughtfully selected Ayurvedic products with a focus on quality and care.</span></p>
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main footer — white background, bold black text, larger sizes */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">

        {/* Brand Column */}
        <div className="space-y-5">
          <div
            className="inline-block cursor-pointer hover:opacity-80 transition-opacity duration-200"
            onClick={() => onNavigate('home')}
          >
            <Logo variant="dark" />
          </div>
          <p className="text-sm text-black font-medium leading-relaxed">
            BV Life brings deep wild herbs, hand crafted oils, and clinically researched Ayurvedic formulas from tradition to your doorstep pure herbs for better health.
          </p>
          <div className="space-y-3 text-sm text-black font-semibold">
            <div className="flex items-center gap-2.5">
              <Phone className="w-5 h-5 text-brand-green-800 flex-shrink-0" />
              <span>+917451050607</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-brand-green-800 flex-shrink-0" />
              <span>care@bvlife.com</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-brand-green-800 flex-shrink-0" />
              <span className="leading-tight">Bv Life,Jhundpur Industrial Area, Sonipat, Haryana - 131021</span>
            </div>
          </div>
        </div>

        {/* Customer Care */}
        <div>
          <h4 className="font-serif text-xl font-bold text-black mb-6 relative after:absolute after:-bottom-2 after:left-0 after:w-10 after:h-0.5 after:bg-brand-green-800">
            Customer Trust
          </h4>
          <ul className="space-y-3 text-sm text-black font-semibold">
            <li><button onClick={() => onNavigate('static', { page: 'shipping' })} className="hover:text-brand-green-800 transition-colors text-left">Shipping & Delivery Policies</button></li>
            <li><button onClick={() => onNavigate('static', { page: 'refund' })} className="hover:text-brand-green-800 transition-colors text-left">Cancellation & Refund Policies</button></li>
            <li><button onClick={() => onNavigate('static', { page: 'privacy' })} className="hover:text-brand-green-800 transition-colors text-left">Privacy Guard & Cookies</button></li>
            <li><button onClick={() => onNavigate('static', { page: 'terms' })} className="hover:text-brand-green-800 transition-colors text-left">Terms & Conditions of Service</button></li>
            <li><button onClick={() => onNavigate('static', { page: 'faq' })} className="hover:text-brand-green-800 transition-colors text-left">Help Centers & FAQs</button></li>
          </ul>
        </div>

        {/* Categories Quick Links */}
        <div>
          <h4 className="font-serif text-xl font-bold text-black mb-6 relative after:absolute after:-bottom-2 after:left-0 after:w-10 after:h-0.5 after:bg-brand-green-800">
            Shop By Need
          </h4>
          <ul className="space-y-3 text-sm text-black font-semibold">
            <li><button onClick={() => onNavigate('shop', { category: 'Immunity' })} className="hover:text-brand-green-800 transition-colors">Immunity & Vitality</button></li>
            <li><button onClick={() => onNavigate('shop', { category: 'Digestion' })} className="hover:text-brand-green-800 transition-colors">Digestion & Gut Agni</button></li>
            <li><button onClick={() => onNavigate('shop', { category: 'Skin Care' })} className="hover:text-brand-green-800 transition-colors">Saffron Skin Glow</button></li>
            <li><button onClick={() => onNavigate('shop', { category: 'Hair Care' })} className="hover:text-brand-green-800 transition-colors">Hair Therapy Oils</button></li>
            <li><button onClick={() => onNavigate('shop', { category: "Women's Health" })} className="hover:text-brand-green-800 transition-colors">Women's Hormone Balance</button></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-serif text-xl font-bold text-black mb-6 relative after:absolute after:-bottom-2 after:left-0 after:w-10 after:h-0.5 after:bg-brand-green-800">
            Weekly Well-Being
          </h4>
          <p className="text-sm text-black font-medium leading-relaxed mb-5">
            Subscribe for BV Life's seasonal Ayurvedic health guides, exclusive compound recipes, and 15% off your first order.
          </p>
          {subscribed ? (
            <div className="bg-brand-green-950 text-white text-sm p-4 rounded-xl font-semibold">
              🎉 <strong>Thank you!</strong> Check your inbox for your 15% welcome code.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border-2 border-black/20 rounded-xl px-4 py-3 text-sm text-black font-medium focus:outline-none focus:border-brand-green-800 placeholder-black/40"
              />
              <button
                type="submit"
                className="bg-brand-green-950 hover:bg-brand-green-900 text-white font-bold text-sm px-5 py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                <span>Join</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

      </div>

      {/* Sub Footer */}
      <div className="bg-brand-green-900 border-t border-gray-200 py-4 text-sm text-white font-semibold">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
          <p>© 2026 BV Life. BV Life is a brand of Magadh Global Multiventures LLP. All rights reserved.</p>

        </div>
      </div>

    </footer>
  );
};
