/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, Phone, MapPin, ArrowRight, ShieldCheck, HeartHandshake, Sparkles, Building2, Facebook, Instagram, Twitter, MessageCircle } from 'lucide-react';
import { WebsiteSettings } from '../types';
import { Logo } from './Logo';
import amazonLogo from '@/assets/amazon-logo.svg';
import flipkartLogo from '@/assets/flipkart-logo.svg';

interface FooterProps {
  onNavigate: (page: string, params?: any) => void;
  onOpenConsultant: () => void;
  language?: any;
  settings?: WebsiteSettings;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onOpenConsultant, settings }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [benefitsPaused, setBenefitsPaused] = useState(false);

  const socialLinks = [
    { name: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61590349837422', icon: Facebook },
    { name: 'Instagram', href: 'https://www.instagram.com/bvlife.in/', icon: Instagram },
    { name: 'X / Twitter', href: settings?.twitter, icon: Twitter },
    {
      name: 'WhatsApp',
      href: settings?.contactPhone
        ? `https://wa.me/${settings.contactPhone.replace(/\D/g, '').replace(/^0+/, '').replace(/^(?!91)(\d{10})$/, '91$1')}`
        : undefined,
      icon: MessageCircle
    }
  ].flatMap((link) => {
    const rawHref = link.href?.trim();
    if (!rawHref) return [];
    const href = link.name === 'WhatsApp' || /^https?:\/\//i.test(rawHref)
      ? rawHref
      : `https://${rawHref}`;
    return [{ ...link, href }];
  });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
    }
  };

  const valueProps = [
    {
      title: 'Quality Assured',
      description: 'Carefully selected Ayurvedic products made with quality-focused standards.',
      icon: ShieldCheck
    },
    {
      title: 'Ayurvedic AI Consultant',
      description: 'Get a free dosha analysis and a personalised wellness plan instantly.',
      icon: Sparkles,
      action: true
    },
    {
      title: 'Care You Can Trust',
      description: 'Thoughtfully selected Ayurvedic products with a focus on quality and care.',
      icon: HeartHandshake
    },
    {
      title: 'Magadh Global',
      description: 'BV Life is a brand of Magadh Global Multiventures LLP.',
      icon: Building2,
      href: 'https://magadhglobal.com/',
      linkText: 'Visit magadhglobal.com'
    }
  ];

  const renderValueProp = (item: typeof valueProps[number], copyIndex: number) => {
    const Icon = item.icon;
    const duplicate = copyIndex >= valueProps.length;
    const className = `group flex w-[min(86vw,360px)] shrink-0 items-start gap-4 rounded-2xl border p-4 text-left shadow-[0_12px_28px_-18px_rgba(20,51,38,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:w-[380px] sm:p-5 lg:w-[400px] ${
      item.action
        ? 'border-brand-gold-300/50 bg-gradient-to-br from-[#173b2b] via-[#405136] to-[#846a37]'
        : item.title === 'Quality Assured'
          ? 'border-brand-green-700/25 bg-gradient-to-br from-[#123b29] via-[#1e5036] to-[#34734e]'
          : 'border-brand-green-700/25 bg-gradient-to-br from-[#15362d] via-[#235343] to-[#28604f]'
    }`;
    const content = (
      <>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl border ${item.action ? 'border-brand-gold-300/30 bg-brand-gold-400/15' : 'border-brand-gold-300/20 bg-white/5'}`}>
          <Icon className="h-5 w-5 text-brand-gold-300" />
        </span>
        <span className="min-w-0 flex-1">
          <strong className="block font-serif text-base leading-tight text-white sm:text-lg">{item.title}</strong>
          <span className="mt-1.5 block text-xs leading-relaxed text-brand-cream-200/75 sm:text-sm">{item.description}</span>
          {item.action && <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-gold-400 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-brand-green-950 sm:text-[11px]">Start a consultation <ArrowRight className="h-3.5 w-3.5" /></span>}
          {item.linkText && <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-brand-gold-300">{item.linkText} <ArrowRight className="h-3.5 w-3.5" /></span>}
        </span>
      </>
    );

    if (item.action) {
      return (
        <button
          key={`${item.title}-${copyIndex}`}
          onClick={onOpenConsultant}
          tabIndex={duplicate ? -1 : undefined}
          aria-hidden={duplicate || undefined}
          className={`${className} cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-400`}
        >
          {content}
        </button>
      );
    }

    if (item.href) {
      return (
        <a
          key={`${item.title}-${copyIndex}`}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-hidden={duplicate || undefined}
          tabIndex={duplicate ? -1 : undefined}
          className={`${className} focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold-400`}
        >
          {content}
        </a>
      );
    }

    return <div key={`${item.title}-${copyIndex}`} aria-hidden={duplicate || undefined} className={className}>{content}</div>;
  };

  return (
    <footer id="site-footer" className="bg-white text-black border-t border-gray-200">

      {/* Brand Value Props Bar — green */}
      <div className="py-7 sm:py-9">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-4 text-left sm:mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-brand-gold-700">The BV Life promise</p>
            <h3 className="mt-1 font-serif text-xl font-semibold text-brand-green-900 sm:text-2xl">Thoughtful care, every day</h3>
          </div>
          <div
            className="-mx-4 overflow-x-auto overflow-y-hidden overscroll-x-contain px-4 touch-pan-x scrollbar-none sm:mx-0 sm:px-0"
            role="region"
            aria-label="BV Life quality and care benefits"
            onMouseEnter={() => setBenefitsPaused(true)}
            onMouseLeave={() => setBenefitsPaused(false)}
            onTouchStart={() => setBenefitsPaused(true)}
            onTouchEnd={() => setBenefitsPaused(false)}
          >
            <div className={`animate-marquee w-max gap-3 [animation-duration:26s] [&:focus-within]:[animation-play-state:paused] ${benefitsPaused ? '[animation-play-state:paused]' : ''}`}>
              {[...valueProps, ...valueProps].map((item, index) => renderValueProp(item, index))}
            </div>
          </div>
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
          <p className="-mt-2 text-xs font-semibold leading-relaxed text-brand-green-800">BV Life is a brand of Magadh Global Multiventures LLP.</p>
          <div className="space-y-3 text-sm text-black font-semibold">
            <div className="flex items-center gap-2.5">
              <Phone className="w-5 h-5 text-brand-green-800 flex-shrink-0" />
              <span>+917015999375</span>
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
          {socialLinks.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-green-900">Follow BV Life</p>
              <div className="flex flex-wrap items-center gap-2">
                {socialLinks.map(({ name, href, icon: Icon }) => (
                  <a
                    key={name}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Follow BV Life on ${name}`}
                    title={name}
                    className="grid h-10 w-10 place-items-center rounded-full border border-brand-green-900/15 bg-brand-green-50 text-brand-green-900 transition-colors hover:border-brand-green-800 hover:bg-brand-green-900 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-green-700 focus-visible:ring-offset-2"
                  >
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          )}
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

      {/* Marketplace links */}
      <div className="border-y border-brand-green-900/10 bg-[#f8f7f2]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-7 lg:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold-700">Also available on</p>
            <h3 className="mt-1 font-serif text-lg font-bold text-brand-green-900 sm:text-xl">Shop BV Life on your favourite marketplace</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:min-w-[390px]">
            <a
              href="https://www.amazon.in/s?k=Bv+life"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Find BV Life products on Amazon"
              className="group flex min-w-0 items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-[#ff9900]/50 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff9900] sm:px-4"
            >
              <img src={amazonLogo} alt="Amazon" className="h-8 w-[70px] shrink-0 object-contain" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[10px] font-semibold text-gray-500 sm:text-xs">Shop BV Life</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#ff9900]" />
            </a>
            <a
              href="https://www.flipkart.com/search?q=Bv+life"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Find BV Life products on Flipkart"
              className="group flex min-w-0 items-center gap-2.5 rounded-2xl border border-gray-200 bg-white px-3 py-3 transition-all hover:-translate-y-0.5 hover:border-[#2874f0]/40 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2874f0] sm:px-4"
            >
              <img src={flipkartLogo} alt="Flipkart" className="h-8 w-[72px] shrink-0 object-contain" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[10px] font-semibold text-gray-500 sm:text-xs">Shop BV Life</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5 group-hover:text-[#2874f0]" />
            </a>
          </div>
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
