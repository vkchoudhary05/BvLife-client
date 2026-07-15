/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Phone, MapPin, ArrowRight, ShieldCheck, HeartHandshake, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string, params?: any) => void;
  onOpenConsultant: () => void;
  language?: any;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenConsultant }) => {
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
    <footer id="site-footer" className="bg-brand-green-900 text-brand-cream-50 border-t border-brand-green-800">
      
      {/* Brand Value Props Bar */}
      <div className="bg-brand-green-800 border-b border-brand-green-700/50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-green-700 flex items-center justify-center text-brand-cream-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-brand-cream-100 text-sm">100% Certified Organic</h4>
              <p className="text-xs text-brand-cream-300/80">AYUSH approved, GMP certified, chemical & heavy-metal tested.</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-green-700 flex items-center justify-center text-brand-cream-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-brand-cream-100 text-sm">Ayurvedic AI Consultant</h4>
              <p className="text-xs text-brand-cream-300/80">Get free expert biological dosha analysis and remedy plans instantly.</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-brand-green-700 flex items-center justify-center text-brand-cream-300">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-brand-cream-100 text-sm">Our Sacred Trust</h4>
              <p className="text-xs text-brand-cream-300/80">14-day risk free satisfaction refunds and round-the-clock supportive care.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid grid-cols-1 md:grid-cols-4 gap-12">
        
        {/* Brand Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('home')}>
            <div className="w-8 h-8 rounded-full bg-brand-gold-500 flex items-center justify-center text-brand-green-900 font-serif text-sm font-bold">
              G
            </div>
            <span className="font-serif text-xl font-bold tracking-tight text-brand-cream-100">
              Bv<span className="text-brand-gold-500 font-sans font-normal italic">Life</span>
            </span>
          </div>
          <p className="text-xs text-brand-cream-300/80 leading-relaxed">
            Sourcing deep wild herbs, hand-crafting pure oils, and formulating clinically researched solutions. We bridge Vedic secrets with modern bio-technology to heal your life, naturally.
          </p>
          <div className="space-y-2.5 text-xs text-brand-cream-300">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-brand-gold-500 flex-shrink-0" />
              <span>+1 (800) 555-GRAM</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-brand-gold-500 flex-shrink-0" />
              <span>care@gramslife.com</span>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-brand-gold-500 flex-shrink-0" />
              <span className="leading-tight">Bv Life Herbals, Silicon Valley, CA 94016</span>
            </div>
          </div>
        </div>

        {/* Customer Care */}
        <div>
          <h4 className="font-serif text-base font-semibold text-brand-cream-100 mb-5 relative after:absolute after:-bottom-1.5 after:left-0 after:w-10 after:h-0.5 after:bg-brand-gold-500">
            Customer Trust
          </h4>
          <ul className="space-y-2.5 text-xs text-brand-cream-300">
            <li><button onClick={() => onNavigate('static', { page: 'shipping' })} className="hover:text-brand-gold-500 transition-colors text-left">Shipping & Delivery Policies</button></li>
            <li><button onClick={() => onNavigate('static', { page: 'refund' })} className="hover:text-brand-gold-500 transition-colors text-left">Cancellation & Refund Policies</button></li>
            <li><button onClick={() => onNavigate('static', { page: 'privacy' })} className="hover:text-brand-gold-500 transition-colors text-left">Privacy Guard & Cookies</button></li>
            <li><button onClick={() => onNavigate('static', { page: 'terms' })} className="hover:text-brand-gold-500 transition-colors text-left">Terms & Conditions of Service</button></li>
            <li><button onClick={() => onNavigate('static', { page: 'faq' })} className="hover:text-brand-gold-500 transition-colors text-left">Help Centers & FAQs</button></li>
          </ul>
        </div>

        {/* Categories Quick Links */}
        <div>
          <h4 className="font-serif text-base font-semibold text-brand-cream-100 mb-5 relative after:absolute after:-bottom-1.5 after:left-0 after:w-10 after:h-0.5 after:bg-brand-gold-500">
            Shop By Need
          </h4>
          <ul className="space-y-2.5 text-xs text-brand-cream-300">
            <li><button onClick={() => onNavigate('shop', { category: 'Immunity' })} className="hover:text-brand-gold-500 transition-colors">Immunity & Vitality</button></li>
            <li><button onClick={() => onNavigate('shop', { category: 'Digestion' })} className="hover:text-brand-gold-500 transition-colors">Digestion & Gut Agni</button></li>
            <li><button onClick={() => onNavigate('shop', { category: 'Skin Care' })} className="hover:text-brand-gold-500 transition-colors">Saffron Skin Glow</button></li>
            <li><button onClick={() => onNavigate('shop', { category: 'Hair Care' })} className="hover:text-brand-gold-500 transition-colors">Hair Therapy Oils</button></li>
            <li><button onClick={() => onNavigate('shop', { category: "Women's Health" })} className="hover:text-brand-gold-500 transition-colors">Women's Hormone Balance</button></li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h4 className="font-serif text-base font-semibold text-brand-cream-100 mb-5 relative after:absolute after:-bottom-1.5 after:left-0 after:w-10 after:h-0.5 after:bg-brand-gold-500">
            Weekly Well-Being
          </h4>
          <p className="text-xs text-brand-cream-300 leading-relaxed mb-4">
            Subscribe to receive ancient Ayurvedic seasonal health guides, exclusive compound recipes, and 15% discount coupons.
          </p>
          {subscribed ? (
            <div className="bg-brand-green-800 text-brand-cream-300 text-xs p-3 rounded-xl border border-brand-gold-500/30">
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
                className="w-full bg-brand-green-800 border border-brand-green-700 rounded-xl px-4 py-2.5 text-xs text-brand-cream-50 focus:outline-none focus:border-brand-gold-500 placeholder-brand-cream-300/40"
              />
              <button
                type="submit"
                className="bg-brand-gold-500 hover:bg-brand-gold-600 text-brand-green-900 font-bold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Join</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}
        </div>

      </div>

      {/* Sub Footer */}
      <div className="bg-brand-green-955 border-t border-brand-green-800/40 py-6 text-xs text-brand-cream-300/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2026 Bv Life Inc. All Ayurvedic herbs strictly source from sustainable high-altitude farms.</p>
          <div className="flex gap-4 items-center">
            <span className="hover:text-brand-gold-500 cursor-pointer">Security SSL Verified</span>
            <span>•</span>
            <span className="hover:text-brand-gold-500 cursor-pointer">Cards, UPI, COD Accepted</span>
          </div>
        </div>
      </div>

    </footer>
  );
};
