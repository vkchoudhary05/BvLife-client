/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Heart, ShoppingCart, User, Sparkles, LogOut, LayoutDashboard, Shield, Menu, X } from 'lucide-react';
import { User as UserType, CartItem, WebsiteSettings } from '../types';
import { Language, t } from '../lib/translations';
import { Logo } from './Logo';

interface NavbarProps {
  currentUser: UserType | null;
  onNavigate: (page: string, params?: any) => void;
  cart: CartItem[];
  wishlist: string[]; // product IDs
  onOpenConsultant: () => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  searchQuery?: string;
  settings?: WebsiteSettings;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onNavigate,
  cart,
  wishlist,
  onOpenConsultant,
  onLogout,
  onSearch,
  language,
  onLanguageChange,
  searchQuery = '',
  settings
}) => {
  const [searchVal, setSearchVal] = useState(searchQuery);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const profileMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  React.useEffect(() => {
    setSearchVal(searchQuery);
  }, [searchQuery]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanQuery = searchVal.trim().toLowerCase();
    if (
      cleanQuery.includes('admin') || 
      cleanQuery.includes('apothecary') || 
      cleanQuery.includes('director') || 
      cleanQuery.includes('staff') ||
      ['healer', 'control panel', 'gateway'].includes(cleanQuery)
    ) {
      setSearchVal('');
      onSearch('');
      onNavigate('admin');
      setIsMobileMenuOpen(false);
      return;
    }
    onSearch(searchVal);
  };

  return (
    <header id="site-header" className="sticky top-0 z-40 w-full bg-brand-cream-50/90 backdrop-blur-md border-b border-brand-green-600/10">
      {/* Top Banner Alert - Running Marquee Line */}
      <div id="top-promo-banner" className="bg-brand-green-800 text-brand-gold-300 text-[11px] sm:text-xs py-1.5 sm:py-2 px-0 overflow-hidden whitespace-nowrap border-b border-brand-gold-500/20 font-bold uppercase tracking-widest">
        <div className="flex animate-marquee select-none">
          <div className="flex shrink-0 items-center gap-10 sm:gap-16 px-4">
            <span className="text-brand-gold-400">✨ FREE SHIPPING ON ALL ORDERS OVER ₹999</span>
            <span className="text-brand-gold-500/40">|</span>
            <span className="text-brand-gold-400">USE CODE: AYUR15 FOR 15% OFF</span>
            <span className="text-brand-gold-500/40">|</span>
            <span>100% Pure Natural Herbs</span>
            <span className="text-brand-gold-500/40">|</span>
            <span>Authentic Ayurvedic Wellness</span>
            <span className="text-brand-gold-500/40">|</span>
            <span>Rich in Herbal Extracts</span>
            <span className="text-brand-gold-500/40">|</span>
            <span>No Synthetic Additives</span>
            <span className="text-brand-gold-500/40">|</span>
            <span>Traditionally Crafted</span>
            <span className="text-brand-gold-500/40">|</span>
            <span>Daily Holistic Health Support</span>
          </div>
          <div className="flex shrink-0 items-center gap-10 sm:gap-16 px-4" aria-hidden="true">
            <span className="text-brand-gold-400">✨ FREE SHIPPING ON ALL ORDERS OVER ₹999</span>
            <span className="text-brand-gold-500/40">|</span>
            <span className="text-brand-gold-400">USE CODE: AYUR15 FOR 15% OFF</span>
            <span className="text-brand-gold-500/40">|</span>
            {/* <span>100% Pure Natural Herbs</span> */}
            <span className="text-brand-gold-500/40">|</span>
            <span>Authentic Ayurvedic Wellness</span>
            <span className="text-brand-gold-500/40">|</span>
            <span>Rich in Herbal Extracts</span>
            <span className="text-brand-gold-500/40">|</span>
            <span>No Synthetic Additives</span>
            <span className="text-brand-gold-500/40">|</span>
            <span>Traditionally Crafted</span>
            <span className="text-brand-gold-500/40">|</span>
            {/* <span>Daily Holistic Health Support</span> */}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 sm:h-18 gap-1.5 sm:gap-4">
          
          {/* Brand Logo - Aligned to left */}
          <div 
            id="brand-logo-container" 
            className="flex-shrink-0 cursor-pointer flex items-center gap-1.5 sm:gap-2 mr-auto md:mr-0"
            onClick={() => onNavigate('home')}
          >
            <Logo variant="dark" />
          </div>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center max-w-[140px] lg:max-w-[180px] relative mx-3 shrink">
            <input
              type="text"
              placeholder={t('navSearchPlaceholder', language)}
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-4 pr-10 py-2 rounded-full bg-brand-green-50 border border-brand-green-200 focus:outline-none focus:border-brand-green-700 text-xs sm:text-sm placeholder-brand-green-600/50"
            />
            <button type="submit" className="absolute right-3 text-brand-green-700 hover:text-brand-gold-600 transition-colors cursor-pointer">
              <Search className="w-4 h-4" />
            </button>
          </form>

          {/* Primary Navigation Links */}
            <nav className="hidden lg:flex items-center gap-6 xl:gap-8 text-base font-medium text-black">
            <button onClick={() => onNavigate('home')} className="hover:text-brand-gold-600 transition-colors cursor-pointer">{t('navHome', language)}</button>
            <button onClick={() => onNavigate('shop')} className="hover:text-brand-gold-600 transition-colors cursor-pointer">{t('navShop', language)}</button>
            <button onClick={() => onNavigate('track-order')} className="hover:text-brand-gold-600 transition-colors cursor-pointer">Track Order</button>
            <button onClick={() => onNavigate('static', { page: 'blog' })} className="hover:text-brand-gold-600 transition-colors cursor-pointer">{t('navBlogs', language)}</button>
            <button onClick={() => onNavigate('static', { page: 'about' })} className="hover:text-brand-gold-600 transition-colors cursor-pointer">{t('About', language)}</button>
            <button onClick={() => onNavigate('static', { page: 'contact' })} className="hover:text-brand-gold-600 transition-colors cursor-pointer">{t('navContact', language)}</button>
          </nav>

          {/* User, Checkout & Mobile Menu Quick Icons - Aligned to right */}
             <div className="flex items-center gap-1 sm:gap-2.5 md:gap-4">
            

            {/* AI consultant button removed from nav as requested */}

            {/* Wishlist - Visible on all screens */}
            <button 
              onClick={() => onNavigate('wishlist')}
              className="relative p-1.5 sm:p-2.5 text-black hover:text-brand-gold-600 transition-colors cursor-pointer shrink-0 flex"
              aria-label="Wishlist"
            >
              <Heart className="w-6 h-6" strokeWidth={2} />
              {wishlist.length > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-brand-gold-600 text-brand-cream-100 flex items-center justify-center text-[9px] font-bold">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart - Visible on all screens */}
            <button 
              onClick={() => onNavigate('cart')}
              className="relative p-1.5 sm:p-2.5 text-black hover:text-brand-gold-600 transition-colors cursor-pointer shrink-0"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-6 h-6" strokeWidth={2} />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-brand-green-700 text-brand-cream-100 flex items-center justify-center text-[9px] font-bold">
                  {cartCount}
                </span>
              )}
            </button>

            {/* User Profile - Hidden on mobile, visible on desktop */}
            <div ref={profileMenuRef} className="relative shrink-0 hidden md:block">
              <button 
                onClick={() => {
                  if (currentUser) {
                    onNavigate('dashboard');
                    setShowProfileMenu(false);
                  } else {
                    onNavigate('login');
                  }
                }}
                className="p-1.5 sm:p-2.5 text-black hover:text-brand-gold-600 transition-colors cursor-pointer flex items-center gap-1.5"
                aria-label="User Profile"
              >
                <User className="w-6 h-6 text-brand-green-900" strokeWidth={2} />
                {currentUser && (
                  <span className="hidden md:inline text-sm font-bold text-brand-green-900">
                    {currentUser.fullName.split(' ')[0]}
                  </span>
                )}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-brand-cream-50 border border-brand-green-600/10 rounded-xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  {currentUser ? (
                    <>
                      <div className="px-4 py-2 border-b border-brand-green-600/10 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-brand-green-600 font-medium">Logged in as</p>
                          <p className="text-sm font-bold truncate text-brand-green-800">{currentUser.fullName}</p>
                          <p className="text-[10px] text-brand-green-600/70 truncate">{currentUser.email}</p>
                        </div>
                        <button
                          onClick={() => setShowProfileMenu(false)}
                          className="p-1 rounded-full text-brand-green-600 hover:bg-brand-green-100/50 hover:text-brand-green-800 transition-colors shrink-0"
                          aria-label="Close Profile Menu"
                        >
                          <X className="w-4.5 h-4.5" />
                        </button>
                      </div>
                      <button 
                        onClick={() => { setShowProfileMenu(false); onNavigate('dashboard'); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-brand-green-800 hover:bg-brand-green-50 flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4 text-brand-green-600" />
                        <span>Customer Dashboard</span>
                      </button>

                      <button 
                        onClick={() => { setShowProfileMenu(false); onLogout(); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-4 py-2 border-b border-brand-green-600/10 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-brand-green-800">Welcome to Grams Life</p>
                          <p className="text-xs text-brand-green-600/70">Connect to synchronize your holistic cart & health logs.</p>
                        </div>
                        <button
                          onClick={() => setShowProfileMenu(false)}
                          className="p-1 rounded-full text-brand-green-600 hover:bg-brand-green-100/50 hover:text-brand-green-800 transition-colors shrink-0 mt-0.5"
                          aria-label="Close Profile Menu"
                        >
                          <X className="w-4.5 h-4.5" />
                        </button>
                      </div>
                      <button 
                        onClick={() => { setShowProfileMenu(false); onNavigate('login'); }}
                        className="w-full text-left px-4 py-2.5 text-sm text-brand-green-800 hover:bg-brand-green-50 font-bold"
                      >
                        Sign In / Register
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Menu Button - Aligned to far right on mobile, hidden on desktop */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2.5 text-black hover:text-brand-gold-600 transition-colors focus:outline-none cursor-pointer flex items-center justify-center rounded-lg hover:bg-brand-green-50/50 shrink-0"
              aria-label="Toggle navigation menu"
            >
              {isMobileMenuOpen ? <X className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5" strokeWidth={2} /> : <Menu className="w-6.5 h-6.5 sm:w-7.5 sm:h-7.5" strokeWidth={2} />}
            </button>

          </div>

        </div>

        {/* Mobile Navigation Links */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 px-4 border-t border-brand-green-600/10 flex flex-col gap-4 bg-brand-cream-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Mobile Search input */}
            <form onSubmit={(e) => {
              handleSearchSubmit(e);
              setIsMobileMenuOpen(false);
            }} className="relative">
              <input
                type="text"
                placeholder={t('navSearchPlaceholder', language)}
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full pl-4 pr-10 py-2 rounded-full bg-white border border-brand-green-200 focus:outline-none focus:border-brand-green-700 text-sm placeholder-brand-green-600/50"
              />
              <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-green-700 hover:text-brand-gold-600 transition-colors cursor-pointer">
                <Search className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-col gap-1">
              <button 
                onClick={() => { onNavigate('home'); setIsMobileMenuOpen(false); }} 
                className="text-left px-4 py-2.5 text-base font-medium text-black hover:text-brand-gold-600 hover:bg-brand-green-50/50 rounded-xl transition-all cursor-pointer"
              >
                {t('navHome', language)}
              </button>
              <button 
                onClick={() => { onNavigate('shop'); setIsMobileMenuOpen(false); }} 
                className="text-left px-4 py-2.5 text-base font-medium text-black hover:text-brand-gold-600 hover:bg-brand-green-50/50 rounded-xl transition-all cursor-pointer"
              >
                {t('navShop', language)}
              </button>
              <button 
                onClick={() => { onNavigate('track-order'); setIsMobileMenuOpen(false); }} 
                className="text-left px-4 py-2.5 text-base font-medium text-black hover:text-brand-gold-600 hover:bg-brand-green-50/50 rounded-xl transition-all cursor-pointer"
              >
                Track Order
              </button>
              <button 
                onClick={() => { onNavigate('wishlist'); setIsMobileMenuOpen(false); }} 
                className="text-left px-4 py-2.5 text-base font-medium text-black hover:text-brand-gold-600 hover:bg-brand-green-50/50 rounded-xl transition-all cursor-pointer flex items-center justify-between"
              >
                <span>{language === 'hi' ? 'इच्छा सूची' : 'Wishlist'}</span>
                {wishlist.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-brand-gold-500/20 text-brand-gold-800 text-[10px] font-bold">
                    {wishlist.length}
                  </span>
                )}
              </button>
              <button 
                onClick={() => { onNavigate('static', { page: 'blog' }); setIsMobileMenuOpen(false); }} 
                className="text-left px-4 py-2.5 text-base font-medium text-black hover:text-brand-gold-600 hover:bg-brand-green-50/50 rounded-xl transition-all cursor-pointer"
              >
                {t('navBlogs', language)}
              </button>
              <button 
                onClick={() => { onNavigate('static', { page: 'about' }); setIsMobileMenuOpen(false); }} 
                className="text-left px-4 py-2.5 text-base font-medium text-black hover:text-brand-gold-600 hover:bg-brand-green-50/50 rounded-xl transition-all cursor-pointer"
              >
                {t('About', language)}
              </button>
              <button 
                onClick={() => { onNavigate('static', { page: 'contact' }); setIsMobileMenuOpen(false); }} 
                className="text-left px-4 py-2.5 text-base font-medium text-black hover:text-brand-gold-600 hover:bg-brand-green-50/50 rounded-xl transition-all cursor-pointer"
              >
                {t('navContact', language)}
              </button>
            </div>

            {/* Mobile User Profile Section */}
            <div className="border-t border-brand-green-600/10 mt-2 pt-3 px-2">
              {currentUser ? (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 py-1.5 px-2">
                    <div className="w-9 h-9 rounded-full bg-brand-green-700 flex items-center justify-center text-brand-cream-100 font-bold text-sm">
                      {currentUser.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-brand-green-600 font-medium">Logged in as</p>
                      <p className="text-sm font-bold text-brand-green-800 truncate">{currentUser.fullName}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); onNavigate('dashboard'); }}
                    className="w-full text-left py-2 px-2 text-sm font-semibold text-brand-green-800 hover:text-brand-gold-600 flex items-center gap-2 rounded-lg hover:bg-brand-green-50/50"
                  >
                    <LayoutDashboard className="w-4 h-4 text-brand-green-600" />
                    <span>Customer Dashboard</span>
                  </button>

                  <button 
                    onClick={() => { setIsMobileMenuOpen(false); onLogout(); }}
                    className="w-full text-left py-2 px-2 text-sm font-semibold text-red-600 flex items-center gap-2 rounded-lg hover:bg-red-50/50"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => { setIsMobileMenuOpen(false); onNavigate('login'); }}
                  className="w-full py-2.5 px-4 bg-brand-green-700 text-brand-cream-100 rounded-xl text-center text-sm font-bold shadow-sm hover:bg-brand-green-800 transition-colors cursor-pointer"
                >
                  Sign In / Register
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </header>
  );
};
